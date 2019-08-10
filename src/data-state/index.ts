import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {buildDefaultPath, getWorkspace, parseName} from '../utility/config';
import {buildInjectionChanges, createAddReducerContext} from '../utility/find-reducer';
import {copyFiles} from '../utility/copy-files';

export default function (options: DataStateSchematics): Rule {
    return (tree: Tree, _context: SchematicContext) => {
        const workspace = getWorkspace(tree);
        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const project = workspace.projects[options.project];

        if (options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;

        return chain(
            [
                test(options),
                copyFiles(options, './files', options.path)
            ]
        )
    };
}

function test(options: any): Rule {
    return (host: Tree) => {
        const context = createAddReducerContext(host, options, 'data');

        const changes = buildInjectionChanges(context, host, options);

        const declarationRecorder = host.beginUpdate(options.path + '/' + context.rootReducerFileName + '.ts');
        for (const change of changes) {
            declarationRecorder.insertLeft(change.pos, change.toAdd);
        }
        host.commitUpdate(declarationRecorder);

        return host;
    }
}

import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {copyFiles} from '../utility/copy-files';
import {buildAddStateChanges, createAddStateContext, getStateName} from '../utility/find-state';
import {addImports, createAddSelectorContext, getSelectorName} from '../utility/find-selector';
import {buildAddReducerChanges, createAddReducerContext} from '../utility/find-reducer';
import {getWorkspace} from "@schematics/angular/utility/config";
import {buildDefaultPath} from "@schematics/angular/utility/project";
import {parseName} from "@schematics/angular/utility/parse-name";
import {applyChanges} from "../utility/change";

export default function (options: AddStateSchematics): Rule {
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

        const selectorContext = createAddSelectorContext(tree, options, options.type);
        const stateContext = createAddStateContext(tree, options, options.type);

        options.selectorName = getSelectorName(selectorContext, tree, options);
        options.stateName = getStateName(stateContext, tree, options);

        return chain(
            [
                addReducer(options),
                addState(options),
                copyFiles(options, './files', options.path),
                addImports(options, selectorContext, stateContext)
            ]
        )
    };
}

function addReducer(options: any): Rule {
    return (host: Tree) => {
        const context = createAddReducerContext(host, options, options.type);

        const changes = buildAddReducerChanges(context, host, options);

        return applyChanges(host, changes, options.path + '/' + context.rootReducerFileName + '.ts');
    }
}

function addState(options: any): Rule {
    return (host: Tree) => {
        const context = createAddStateContext(host, options, options.type);

        const changes = buildAddStateChanges(context, host, options);

        return applyChanges(host, changes, options.path + '/' + context.rootStateFileName + '.ts');
    }
}

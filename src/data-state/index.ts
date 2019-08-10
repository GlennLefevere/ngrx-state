import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {buildDefaultPath, getWorkspace, parseName} from '../utility/config';
import {buildAddReducerChanges, createAddReducerContext} from '../utility/find-reducer';
import {copyFiles} from '../utility/copy-files';
import {AddStateContext, buildAddStateChanges, createAddStateContext, getStateName} from '../utility/find-state';
import {addImports, AddSelectorContext, createAddSelectorContext, getSelectorName} from '../utility/find-selector';
import {join, normalize, relative} from 'path';
import {insertImport} from '../utility/find-module';
import * as ts from 'typescript';
import {InsertChange} from '../utility/change';
import {dasherize} from '@angular-devkit/core/src/utils/strings';

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

        const selectorContext = createAddSelectorContext(tree, options, 'data');
        const stateContext = createAddStateContext(tree, options, 'data');

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
        const context = createAddReducerContext(host, options, 'data');

        const changes = buildAddReducerChanges(context, host, options);

        const declarationRecorder = host.beginUpdate(options.path + '/' + context.rootReducerFileName + '.ts');
        for (const change of changes) {
            declarationRecorder.insertLeft(change.pos, change.toAdd);
        }
        host.commitUpdate(declarationRecorder);

        return host;
    }
}

function addState(options: any): Rule {
    return (host: Tree) => {
        const context = createAddStateContext(host, options, 'data');

        const changes = buildAddStateChanges(context, host, options);

        const declarationRecorder = host.beginUpdate(options.path + '/' + context.rootStateFileName + '.ts');

        for (const change of changes) {
            declarationRecorder.insertLeft(change.pos, change.toAdd);
        }
        host.commitUpdate(declarationRecorder);

        return host;
    }
}

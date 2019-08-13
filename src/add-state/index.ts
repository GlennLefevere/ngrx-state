import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {copyFiles} from '../utility/copy-files';
import {buildAddStateChanges, createAddStateContext, getStateName} from '../utility/find-state';
import {addImports, createAddSelectorContext, getSelectorName} from '../utility/find-selector';
import {buildAddReducerChanges, createAddReducerContext} from '../utility/find-reducer';
import {applyChanges} from "../utility/change";
import {enrichOptions} from '../utility/options';

export default function (options: AddStateSchematics): Rule {
    return (host: Tree, _context: SchematicContext) => {
        options = enrichOptions(host, options);

        const selectorContext = createAddSelectorContext(host, options, options.type);
        const stateContext = createAddStateContext(host, options, options.type);

        options.selectorName = getSelectorName(selectorContext, host, options);
        options.stateName = getStateName(stateContext, host, options);

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

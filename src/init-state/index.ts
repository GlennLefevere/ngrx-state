import {chain, noop, Rule, schematic, SchematicContext, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {functionIze} from "../utility/function-ize";
import {copyFiles} from "../utility/copy-files";
import {addImport, addNgrxImportsToNgModule} from "../utility/import";
import {enrichOptions} from '../utility/options';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export default function (options: InitStateSchematics): Rule {
    // @ts-ignore
    return (host: Tree, _context: SchematicContext) => {
        const {data, container, effects} = options;

        options = enrichOptions(host, options);

        const rootReducerName = functionIze(strings.classify(`${options.name}RootReducer`));
        const storeName = `StoreModule.forFeature('${options.name}', ${rootReducerName})`;

        return chain([
            addNgrxImportsToNgModule(options.module, '@ngrx/store', storeName),
            copyFiles(options, './files', options.path),
            addImport(options, rootReducerName, '/statemanagement/reducers/'),
            !data ? noop() : schematic('add-state', buildStateProperties('data', options)),
            !container ? noop() : schematic('add-state', buildStateProperties('container', options)),
            !effects ? noop() : schematic('init-effects', {
                name: options.name,
                project: options.project
            })
        ])(host, _context);
    };
}

function buildStateProperties(type: string, options: InitStateSchematics): any {
    return {
        path: options.path,
        name: options.name,
        type,
        project: options.project,
        module: options.module ? options.module.replace(options.path ? options.path : '', '') : ''
    };
}

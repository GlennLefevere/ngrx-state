import {chain, noop, Rule, schematic, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {getWorkspace} from "@schematics/angular/utility/config";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {parseName} from "@schematics/angular/utility/parse-name";
import {functionIze} from "../utility/function-ize";
import {copyFiles} from "../utility/copy-files";
import {buildDefaultPath} from "@schematics/angular/utility/project";
import {addImport, addNgrxImportsToNgModule} from "../utility/import";


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export default function (options: InitStateSchematics): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const {data, container, effects} = options;
        const workspace = getWorkspace(tree);
        if (!options.project) {
            throw new SchematicsException('Option (project) is required.');
        }

        const project = workspace.projects[options.project];

        if (options.path === undefined) {
            options.path = buildDefaultPath(project);
        }

        options.module = findModuleFromOptions(tree, options);

        const parsedPath = parseName(options.path, options.name);
        options.name = parsedPath.name;
        options.path = parsedPath.path;


        const rootReducerName = functionIze(strings.classify(`${options.name}RootReducer`));
        const storeName = `StoreModule.forFeature('${options.name}', ${rootReducerName})`;

        /*const rootEffectsName = strings.classify(`${options.name}RootEffects`);
        const effectsName = `EffectsModule.forFeature(${rootEffectsName}),`;*/

        return chain([
            addNgrxImportsToNgModule(options.module, '@ngrx/store', storeName),
            copyFiles(options, './files/default', parsedPath.path),
            addImport(options, rootReducerName, '/statemanagement/reducers/'),
            !data ? noop() : schematic('add-state', buildStateProperties('data', options)),
            !container ? noop() : schematic('add-state', buildStateProperties('container', options)),
            !effects ? noop() : schematic('init-effects', {
                name: options.name,
                path: options.path,
                project: options.project
            }),
            /*            !effects ? noop() : copyFiles(options, './files/effects', parsedPath.path),
                        !effects ? noop : addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
                        !effects ? noop() : addImport(options, rootEffectsName, '/statemanagement/effects/'),*/
        ])(tree, _context);
    };
}

function buildStateProperties(type: string, options: InitStateSchematics): any {
    return {
        path: options.path,
        name: options.name,
        type,
        project: options.project,
        module: options.module
    };
}

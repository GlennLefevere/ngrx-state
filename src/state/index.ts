import {
    apply,
    chain,
    mergeWith,
    noop,
    Rule,
    SchematicContext,
    SchematicsException,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {
    addImportToModule,
    buildRelativePath,
    findModuleFromOptions,
    findRootEffects,
    findRootReducer,
    insertImport,
    readIntoSourceFile
} from '../utility/find-module';
import {functionIze} from '../utility/function-ize';
import {InsertChange} from '../utility/change';
import {buildDefaultPath, getWorkspace, parseName} from '../utility/config';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export default function (options: StateSchematics): Rule {
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

        const rootEffectsName = strings.classify(`${options.name}RootEffects`);
        const effectsName = `EffectsModule.forFeature(${rootEffectsName}),`;

        return chain([
            addNgrxImportsToNgModule(options.module, '@ngrx/store', storeName),
            defaultState(options),
            addRootStateImportToNgModule(options, rootReducerName),
            !data ? noop() : dataState(options),
            !container ? noop() : containerState(options),
            !effects ? noop() : effectsState(options),
            !effects ? noop : addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
            !effects ? noop() : addRootEffectsImportToNgModule(options, rootEffectsName),
        ])(tree, _context);
    };
}

export function defaultState(options: any): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const sourceTemplates = url('./files/default');

        const sourceParameterizedTemplates = apply(
            sourceTemplates,
            [
                template({
                    ...options,
                    ...strings,
                    functionIze
                })
            ]
        );
        return mergeWith(sourceParameterizedTemplates);
    };
}

export function dataState(options: any): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const sourceTemplates = url('./files/data');

        const sourceParameterizedTemplates = apply(
            sourceTemplates,
            [
                template({
                    ...options,
                    ...strings,
                    functionIze
                })
            ]
        );
        return mergeWith(sourceParameterizedTemplates);
    };
}

export function containerState(options: any): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const sourceTemplates = url('./files/container');

        const sourceParameterizedTemplates = apply(
            sourceTemplates,
            [
                template({
                    ...options,
                    ...strings,
                    functionIze
                })
            ]
        );
        return mergeWith(sourceParameterizedTemplates);
    };
}

export function effectsState(options: any): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const sourceTemplates = url('./files/effects');

        const sourceParameterizedTemplates = apply(
            sourceTemplates,
            [
                template({
                    ...options,
                    ...strings,
                    functionIze
                })
            ]
        );
        return mergeWith(sourceParameterizedTemplates);
    };
}


export function addNgrxImportsToNgModule(modulePath: string | undefined, importPath: string, name: string): Rule {
    return (host: Tree) => {
        if (!modulePath) {
            return host;
        }
        const source = readIntoSourceFile(host, modulePath);

        const declarationChanges = addImportToModule(source,
            modulePath,
            name,
            importPath);

        const declarationRecorder = host.beginUpdate(modulePath);
        for (const change of declarationChanges) {
            if (change instanceof InsertChange) {
                declarationRecorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(declarationRecorder);

        return host;
    };
}

export interface RootEffectsImportOptions {
    module?: string;
    name: string;
    flat?: boolean;
    path?: string;
}

export function addRootEffectsImportToNgModule(options: RootEffectsImportOptions, classToImport: string): Rule {
    return (host: Tree) => {
        options.flat = true;
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const pathToCheck = (options.path || '')
            + (options.flat ? '' : '/' + strings.dasherize(options.name));

        const importPath = buildRelativePath(`.${options.module}`, '/' + findRootEffects(host, pathToCheck)).replace('.ts', '');

        const declarationChange = insertImport(source, options.module, classToImport, importPath);

        const declarationRecorder = host.beginUpdate(options.module);

        if (declarationChange instanceof InsertChange) {
            declarationRecorder.insertLeft(declarationChange.pos, declarationChange.toAdd);
        }

        host.commitUpdate(declarationRecorder);

        return host;
    }
}

export function addRootStateImportToNgModule(options: RootEffectsImportOptions, classToImport: string): Rule {
    return (host: Tree) => {
        options.flat = true;
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const pathToCheck = (options.path || '')
            + (options.flat ? '' : '/' + strings.dasherize(options.name));

        const importPath = buildRelativePath(`.${options.module}`, '/' + findRootReducer(host, pathToCheck)).replace('.ts', '');

        const declarationChange = insertImport(source, options.module, classToImport, importPath);

        const declarationRecorder = host.beginUpdate(options.module);

        if (declarationChange instanceof InsertChange) {
            declarationRecorder.insertLeft(declarationChange.pos, declarationChange.toAdd);
        }

        host.commitUpdate(declarationRecorder);
        return host;
    }
}
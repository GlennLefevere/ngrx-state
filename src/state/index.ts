import {
    apply,
    chain,
    mergeWith,
    move,
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
            addState(options, './files/default', parsedPath.path),
            addImport(options, rootReducerName, '/statemanagement/reducers/'),
            !data ? noop() : addState(options, './files/data', parsedPath.path),
            !container ? noop() : addState(options, './files/container', parsedPath.path),
            !effects ? noop() : addState(options, './files/effects', parsedPath.path),
            !effects ? noop : addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
            !effects ? noop() : addImport(options, rootEffectsName, '/statemanagement/effects/'),
        ])(tree, _context);
    };
}

export function addState(options: any, templatePath: string, parsedPath: string): Rule {
    return mergeWith(apply(
        url(templatePath),
        [
            template({
                ...options,
                ...strings,
                functionIze
            }),
            move(parsedPath)
        ],
    ));
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

export function addImport(options: any, classToImport: string, path: string): Rule {
    return (host: Tree) => {
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const dashedImportClass = strings.dasherize(classToImport);
        const index = dashedImportClass.lastIndexOf('-');

        const pathToCheck = (options.path || '')
            + path + dashedImportClass.substring(0, index) + '.' + dashedImportClass.substring(index + 1, dashedImportClass.length);

        const importPath = buildRelativePath(`//${options.module}`, pathToCheck);

        const declarationChange = insertImport(source, options.module, classToImport, importPath);

        const declarationRecorder = host.beginUpdate(options.module);

        if (declarationChange instanceof InsertChange) {
            declarationRecorder.insertLeft(declarationChange.pos, declarationChange.toAdd);
        }

        host.commitUpdate(declarationRecorder);

        return host;
    }
}

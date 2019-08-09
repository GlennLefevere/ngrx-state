import {
    apply,
    chain,
    mergeWith,
    move,
    noop,
    Rule,
    SchematicContext,
    SchematicsException,
    Source,
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
        console.log(options);
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

        console.log(options);

        return chain([
            addNgrxImportsToNgModule(options.module, '@ngrx/store', storeName),
            mergeWith(addState(options, './files/default', parsedPath.path)),
            addRootStateImportToNgModule(options, rootReducerName),
            !data ? noop() : mergeWith(addState(options, './files/data', parsedPath.path)),
            !container ? noop() : mergeWith(addState(options, './files/container', parsedPath.path)),
            !effects ? noop() : mergeWith(addState(options, './files/effects', parsedPath.path)),
            !effects ? noop : addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
            !effects ? noop() : addRootEffectsImportToNgModule(options, rootEffectsName),
        ])(tree, _context);
    };
}

export function addState(options: any, templatePath: string, parsedPath: string): Source {
    const sourceTemplates = url(templatePath);

    return apply(
        sourceTemplates,
        [
            template({
                ...options,
                ...strings,
                functionIze
            }),
            move(parsedPath)
        ],
    );
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
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const pathToCheck = (options.path || '');
           // + '/statemanagement';

        const importPath = buildRelativePath(`//${options.module}`, options.path + '/' + findRootEffects(host, pathToCheck)).replace('.ts', '');

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
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const pathToCheck = (options.path || '');
            //+ '/statemanagement';

        const importPath = buildRelativePath(`//${options.module}`, options.path + '/' + findRootReducer(host, pathToCheck)).replace('.ts', '');

        const declarationChange = insertImport(source, options.module, classToImport, importPath);

        const declarationRecorder = host.beginUpdate(options.module);

        if (declarationChange instanceof InsertChange) {
            declarationRecorder.insertLeft(declarationChange.pos, declarationChange.toAdd);
        }

        host.commitUpdate(declarationRecorder);
        return host;
    }
}

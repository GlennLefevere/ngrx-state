import {join, normalize, Path, relative, strings} from '@angular-devkit/core';
import {DirEntry, Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import * as ts from 'typescript';
import {Change, InsertChange, NoopChange} from './change';


export interface ModuleOptions {
    module?: string;
    name: string;
    flat?: boolean;
    path?: string;
    skipImport?: boolean;
}

export interface ImportOptions {
    module?: string;
    name: string;
    flat?: boolean;
    path?: string;
    skipImport?: boolean;
    importPath: string;
    type: string;
}

/**
 * Find the module referred by a set of options passed to the schematics.
 */
export function findModuleFromOptions(host: Tree, options: ModuleOptions): Path | undefined {
    if (options.hasOwnProperty('skipImport') && options.skipImport) {
        return undefined;
    }

    if (!options.module) {
        const pathToCheck = (options.path || '')
            + (options.flat ? '' : '/' + strings.dasherize(options.name));

        return normalize(findModule(host, pathToCheck));
    } else {
        const modulePath = normalize(
            '/' + (options.path) + '/' + options.module);
        const moduleBaseName = normalize(modulePath).split('/').pop();

        if (host.exists(modulePath)) {
            return normalize(modulePath);
        } else if (host.exists(modulePath + '.ts')) {
            return normalize(modulePath + '.ts');
        } else if (host.exists(modulePath + '.module.ts')) {
            return normalize(modulePath + '.module.ts');
        } else if (host.exists(modulePath + '/' + moduleBaseName + '.module.ts')) {
            return normalize(modulePath + '/' + moduleBaseName + '.module.ts');
        } else {
            throw new Error('Specified module does not exist');
        }
    }
}

/**
 * Function to find the "closest" module to a generated file's path.
 */
export function findModule(host: Tree, generateDir: string): Path {
    let dir: DirEntry | null = host.getDir('/' + generateDir);

    const moduleRe = /\.module\.ts$/;
    const routingModuleRe = /-routing\.module\.ts/;

    while (dir) {
        const matches = dir.subfiles.filter(p => moduleRe.test(p) && !routingModuleRe.test(p));

        if (matches.length == 1) {
            return join(dir.path, matches[0]);
        } else if (matches.length > 1) {
            throw new Error('More than one module matches. Use skip-import option to skip importing '
                + 'the component into the closest module.');
        }

        dir = dir.parent;
    }

    throw new Error('Could not find an NgModule. Use the skip-import '
        + 'option to skip importing in NgModule.');
}

/**
 * Function to find the "closest" module to a generated file's path.
 */
export function findRootReducer(host: Tree, generateDir: string): Path {
    console.log('findRootReducer ' + generateDir);
    let dir: DirEntry | null = host.getDir('/' + generateDir);
    console.log(dir.subfiles);
    console.log(dir.subdirs);

    const moduleRe = /-root\.reducer\.ts$/;

    let result = determineFilePath(dir, host, moduleRe);

    if (result) {
        return result;
    }

    throw new Error('Could not find an RootReducer. Use the skip-import '
        + 'option to skip importing in RootReducer.');
}


/**
 * Function to find the "closest" module to a generated file's path.
 */
/*export function findRootEffects(host: Tree, generateDir: string): Path {
    console.log('findRootEffects ' + generateDir);
    let dir: DirEntry | null = host.getDir('/' + generateDir);
    console.log(dir.subfiles);
    console.log(dir.subdirs);

    const moduleRe = /-root\.effects\.ts$/;

    let result = determineFilePath(dir, host, moduleRe);

    if (result) {
        return result;
    }

    throw new Error('Could not find an RootEffects. Use the skip-import '
        + 'option to skip importing in RootEffects.');
}*/

export function determineFilePath(dirEntry: DirEntry, host: Tree, moduleRe: RegExp): Path | undefined {
    let result;
    for (const entry of dirEntry.subdirs) {
        let dir: DirEntry | null = host.getDir(dirEntry.path + '/' + entry);
        const matches = dir.subfiles.filter(p => moduleRe.test(p));

        if (matches.length == 1) {
            result = matches[0];
        } else if (matches.length > 1) {
            throw new Error('More than one module matches. Use skip-import option to skip importing '
                + 'the component into the closest module.');
        } else {
            result = determineFilePath(dir, host, moduleRe);
        }
        if(result) {
            result = join(entry, result);
            break;
        }
    }
    return result;
   /* throw new Error('Could not find an NgModule. Use the skip-import '
        + 'option to skip importing in NgModule.');*/
}

export function buildRelativePath(from: string, to: string): string {
    from = normalize(from);
    to = normalize(to);

    // Convert to arrays.
    const fromParts = from.split('/');
    const toParts = to.split('/');

    // Remove file names (preserving destination)
    fromParts.pop();
    const toFileName = toParts.pop();

    const relativePath = relative(normalize(fromParts.join('/') || '/'),
        normalize(toParts.join('/') || '/'));
    let pathPrefix = '';

    // Set the path prefix for same dir or child dir, parent dir starts with `..`
    if (!relativePath) {
        pathPrefix = '.';
    } else if (!relativePath.startsWith('.')) {
        pathPrefix = `./`;
    }
    if (pathPrefix && !pathPrefix.endsWith('/')) {
        pathPrefix += '/';
    }

    return pathPrefix + (relativePath ? relativePath + '/' : '') + toFileName;
}

export function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
    const text = host.read(modulePath);
    if (text === null) {
        throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString('utf-8');

    return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

export function addImportToNgModule(options: ImportOptions): Rule {
    return (host: Tree) => {
        if (options.skipImport || !options.module) {
            return host;
        }

        const modulePath = options.module;
        const source = readIntoSourceFile(host, modulePath);

        const importPath = options.importPath;
        const relativePath = buildRelativePath(modulePath, importPath);
        const classifiedName = strings.classify(`${options.name}${options.type}`);
        const declarationChanges = addImportToModule(source,
            modulePath,
            classifiedName,
            relativePath);

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

/**
 * Custom function to insert a declaration (component, pipe, directive)
 * into NgModule declarations. It also imports the component.
 */
export function addDeclarationToModule(source: ts.SourceFile,
                                       modulePath: string, classifiedName: string,
                                       importPath: string): Change[] {
    return addSymbolToNgModuleMetadata(
        source, modulePath, 'declarations', classifiedName, importPath);
}

/**
 * Custom function to insert an NgModule into NgModule imports. It also imports the module.
 */
export function addImportToModule(source: ts.SourceFile,
                                  modulePath: string, classifiedName: string,
                                  importPath: string): Change[] {

    return addSymbolToNgModuleMetadata(source, modulePath, 'imports', classifiedName, importPath);
}

export function addSymbolToNgModuleMetadata(
    source: ts.SourceFile,
    ngModulePath: string,
    metadataField: string,
    symbolName: string,
    importPath: string | null = null,
): Change[] {
    const nodes = getDecoratorMetadata(source, 'NgModule', '@angular/core');
    let node: any = nodes[0];  // tslint:disable-line:no-any

    // Find the decorator declaration.
    if (!node) {
        return [];
    }

    // Get all the children property assignment of object literals.
    const matchingProperties: ts.ObjectLiteralElement[] =
        (node as ts.ObjectLiteralExpression).properties
            .filter(prop => prop.kind == ts.SyntaxKind.PropertyAssignment)
            // Filter out every fields that's not "metadataField". Also handles string literals
            // (but not expressions).
            .filter((prop: ts.PropertyAssignment) => {
                const name = prop.name;
                switch (name.kind) {
                    case ts.SyntaxKind.Identifier:
                        return (name as ts.Identifier).getText(source) == metadataField;
                    case ts.SyntaxKind.StringLiteral:
                        return (name as ts.StringLiteral).text == metadataField;
                }

                return false;
            });

    // Get the last node of the array literal.
    if (!matchingProperties) {
        return [];
    }
    if (matchingProperties.length == 0) {
        // We haven't found the field in the metadata declaration. Insert a new field.
        const expr = node as ts.ObjectLiteralExpression;
        let position: number;
        let toInsert: string;
        if (expr.properties.length == 0) {
            position = expr.getEnd() - 1;
            toInsert = `  ${metadataField}: [${symbolName}]\n`;
        } else {
            node = expr.properties[expr.properties.length - 1];
            position = node.getEnd();
            // Get the indentation of the last element, if any.
            const text = node.getFullText(source);
            const matches = text.match(/^\r?\n\s*/);
            if (matches.length > 0) {
                toInsert = `,${matches[0]}${metadataField}: [${symbolName}]`;
            } else {
                toInsert = `, ${metadataField}: [${symbolName}]`;
            }
        }
        if (importPath !== null) {
            return [
                new InsertChange(ngModulePath, position, toInsert),
                insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
            ];
        } else {
            return [new InsertChange(ngModulePath, position, toInsert)];
        }
    }
    const assignment = matchingProperties[0] as ts.PropertyAssignment;

    // If it's not an array, nothing we can do really.
    if (assignment.initializer.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
        return [];
    }

    const arrLiteral = assignment.initializer as ts.ArrayLiteralExpression;
    if (arrLiteral.elements.length == 0) {
        // Forward the property.
        node = arrLiteral;
    } else {
        node = arrLiteral.elements;
    }

    if (!node) {
        console.log('No app module found. Please add your new class to your component.');

        return [];
    }

    if (Array.isArray(node)) {
        const nodeArray = node as {} as Array<ts.Node>;
        const symbolsArray = nodeArray.map(node => node.getText());
        if (symbolsArray.includes(symbolName)) {
            return [];
        }

        node = node[node.length - 1];
    }

    let toInsert: string;
    let position = node.getEnd();
    if (node.kind == ts.SyntaxKind.ObjectLiteralExpression) {
        // We haven't found the field in the metadata declaration. Insert a new
        // field.
        const expr = node as ts.ObjectLiteralExpression;
        if (expr.properties.length == 0) {
            position = expr.getEnd() - 1;
            toInsert = `  ${metadataField}: [${symbolName}]\n`;
        } else {
            node = expr.properties[expr.properties.length - 1];
            position = node.getEnd();
            // Get the indentation of the last element, if any.
            const text = node.getFullText(source);
            if (text.match('^\r?\r?\n')) {
                toInsert = `,${text.match(/^\r?\n\s+/)[0]}${metadataField}: [${symbolName}]`;
            } else {
                toInsert = `, ${metadataField}: [${symbolName}]`;
            }
        }
    } else if (node.kind == ts.SyntaxKind.ArrayLiteralExpression) {
        // We found the field but it's empty. Insert it just before the `]`.
        position--;
        toInsert = `${symbolName}`;
    } else {
        // Get the indentation of the last element, if any.
        const text = node.getFullText(source);
        if (text.match(/^\r?\n/)) {
            toInsert = `,${text.match(/^\r?\n(\r?)\s+/)[0]}${symbolName}`;
        } else {
            toInsert = `, ${symbolName}`;
        }
    }
    if (importPath !== null) {
        return [
            new InsertChange(ngModulePath, position, toInsert),
            insertImport(source, ngModulePath, symbolName.replace(/\..*$/, ''), importPath),
        ];
    }

    return [new InsertChange(ngModulePath, position, toInsert)];
}

/**
 * Add Import `import { symbolName } from fileName` if the import doesn't exit
 * already. Assumes fileToEdit can be resolved and accessed.
 * @param fileToEdit (file we want to add import to)
 * @param symbolName (item to import)
 * @param fileName (path to the file)
 * @param isDefault (if true, import follows style for importing default exports)
 * @return Change
 */
export function insertImport(source: ts.SourceFile, fileToEdit: string, symbolName: string,
                             fileName: string, isDefault = false): Change {
    const rootNode = source;
    const allImports = findNodes(rootNode, ts.SyntaxKind.ImportDeclaration);

    // get nodes that map to import statements from the file fileName
    const relevantImports = allImports.filter(node => {
        // StringLiteral of the ImportDeclaration is the import file (fileName in this case).
        const importFiles = node.getChildren()
            .filter(child => child.kind === ts.SyntaxKind.StringLiteral)
            .map(n => (n as ts.StringLiteral).text);

        return importFiles.filter(file => file === fileName).length === 1;
    });

    if (relevantImports.length > 0) {
        let importsAsterisk = false;
        // imports from import file
        const imports: ts.Node[] = [];
        relevantImports.forEach(n => {
            Array.prototype.push.apply(imports, findNodes(n, ts.SyntaxKind.Identifier));
            if (findNodes(n, ts.SyntaxKind.AsteriskToken).length > 0) {
                importsAsterisk = true;
            }
        });

        // if imports * from fileName, don't add symbolName
        if (importsAsterisk) {
            return new NoopChange();
        }

        const importTextNodes = imports.filter(n => (n as ts.Identifier).text === symbolName);

        // insert import if it's not there
        if (importTextNodes.length === 0) {
            const fallbackPos =
                findNodes(relevantImports[0], ts.SyntaxKind.CloseBraceToken)[0].getStart() ||
                findNodes(relevantImports[0], ts.SyntaxKind.FromKeyword)[0].getStart();

            return insertAfterLastOccurrence(imports, `, ${symbolName}`, fileToEdit, fallbackPos);
        }

        return new NoopChange();
    }

    // no such import declaration exists
    const useStrict = findNodes(rootNode, ts.SyntaxKind.StringLiteral)
        .filter((n: ts.StringLiteral) => n.text === 'use strict');
    let fallbackPos = 0;
    if (useStrict.length > 0) {
        fallbackPos = useStrict[0].end;
    }
    const open = isDefault ? '' : '{ ';
    const close = isDefault ? '' : ' }';
    // if there are no imports or 'use strict' statement, insert import at beginning of file
    const insertAtBeginning = allImports.length === 0 && useStrict.length === 0;
    const separator = insertAtBeginning ? '' : ';\n';
    const toInsert = `${separator}import ${open}${symbolName}${close}` +
        ` from '${fileName}'${insertAtBeginning ? ';\n' : ''}`;

    return insertAfterLastOccurrence(
        allImports,
        toInsert,
        fileToEdit,
        fallbackPos,
        ts.SyntaxKind.StringLiteral,
    );
}

/**
 * Insert `toInsert` after the last occurence of `ts.SyntaxKind[nodes[i].kind]`
 * or after the last of occurence of `syntaxKind` if the last occurence is a sub child
 * of ts.SyntaxKind[nodes[i].kind] and save the changes in file.
 *
 * @param nodes insert after the last occurence of nodes
 * @param toInsert string to insert
 * @param file file to insert changes into
 * @param fallbackPos position to insert if toInsert happens to be the first occurence
 * @param syntaxKind the ts.SyntaxKind of the subchildren to insert after
 * @return Change instance
 * @throw Error if toInsert is first occurence but fall back is not set
 */
export function insertAfterLastOccurrence(nodes: ts.Node[],
                                          toInsert: string,
                                          file: string,
                                          fallbackPos: number,
                                          syntaxKind?: ts.SyntaxKind): Change {
    // sort() has a side effect, so make a copy so that we won't overwrite the parent's object.
    let lastItem = [...nodes].sort(nodesByPosition).pop();
    if (!lastItem) {
        throw new Error();
    }
    if (syntaxKind) {
        lastItem = findNodes(lastItem, syntaxKind).sort(nodesByPosition).pop();
    }
    if (!lastItem && fallbackPos == undefined) {
        throw new Error(`tried to insert ${toInsert} as first occurence with no fallback position`);
    }
    const lastItemPosition: number = lastItem ? lastItem.getEnd() : fallbackPos;

    return new InsertChange(file, lastItemPosition, toInsert);
}

function nodesByPosition(first: ts.Node, second: ts.Node): number {
    return first.getStart() - second.getStart();
}

/**
 * Find all nodes from the AST in the subtree of node of SyntaxKind kind.
 * @param node
 * @param kind
 * @param max The maximum number of items to return.
 * @return all nodes of kind, or [] if none is found
 */
export function findNodes(node: ts.Node, kind: ts.SyntaxKind, max = Infinity): ts.Node[] {
    if (!node || max == 0) {
        return [];
    }

    const arr: ts.Node[] = [];
    if (node.kind === kind) {
        arr.push(node);
        max--;
    }
    if (max > 0) {
        for (const child of node.getChildren()) {
            findNodes(child, kind, max).forEach(node => {
                if (max > 0) {
                    arr.push(node);
                }
                max--;
            });

            if (max <= 0) {
                break;
            }
        }
    }

    return arr;
}

export function getDecoratorMetadata(source: ts.SourceFile, identifier: string,
                                     module: string): ts.Node[] {
    const angularImports: { [name: string]: string }
        = findNodes(source, ts.SyntaxKind.ImportDeclaration)
        .map((node: ts.ImportDeclaration) => _angularImportsFromNode(node, source))
        .reduce((acc: { [name: string]: string }, current: { [name: string]: string }) => {
            for (const key of Object.keys(current)) {
                acc[key] = current[key];
            }

            return acc;
        }, {});

    return getSourceNodes(source)
        .filter(node => {
            return node.kind == ts.SyntaxKind.Decorator
                && (node as ts.Decorator).expression.kind == ts.SyntaxKind.CallExpression;
        })
        .map(node => (node as ts.Decorator).expression as ts.CallExpression)
        .filter(expr => {
            if (expr.expression.kind == ts.SyntaxKind.Identifier) {
                const id = expr.expression as ts.Identifier;

                return id.getFullText(source) == identifier
                    && angularImports[id.getFullText(source)] === module;
            } else if (expr.expression.kind == ts.SyntaxKind.PropertyAccessExpression) {
                // This covers foo.NgModule when importing * as foo.
                const paExpr = expr.expression as ts.PropertyAccessExpression;
                // If the left expression is not an identifier, just give up at that point.
                if (paExpr.expression.kind !== ts.SyntaxKind.Identifier) {
                    return false;
                }

                const id = paExpr.name.text;
                const moduleId = (paExpr.expression as ts.Identifier).getText(source);

                return id === identifier && (angularImports[moduleId + '.'] === module);
            }

            return false;
        })
        .filter(expr => expr.arguments[0]
            && expr.arguments[0].kind == ts.SyntaxKind.ObjectLiteralExpression)
        .map(expr => expr.arguments[0] as ts.ObjectLiteralExpression);
}

/**
 * Get all the nodes from a source.
 * @param sourceFile The source file object.
 * @returns {Observable<ts.Node>} An observable of all the nodes in the source.
 */
export function getSourceNodes(sourceFile: ts.SourceFile): ts.Node[] {
    const nodes: ts.Node[] = [sourceFile];
    const result = [];

    while (nodes.length > 0) {
        const node = nodes.shift();

        if (node) {
            result.push(node);
            if (node.getChildCount(sourceFile) >= 0) {
                nodes.unshift(...node.getChildren());
            }
        }
    }

    return result;
}


function _angularImportsFromNode(node: ts.ImportDeclaration,
                                 _sourceFile: ts.SourceFile): { [name: string]: string } {
    const ms = node.moduleSpecifier;
    let modulePath: string;
    switch (ms.kind) {
        case ts.SyntaxKind.StringLiteral:
            modulePath = (ms as ts.StringLiteral).text;
            break;
        default:
            return {};
    }

    if (!modulePath.startsWith('@angular/')) {
        return {};
    }

    if (node.importClause) {
        if (node.importClause.name) {
            // This is of the form `import Name from 'path'`. Ignore.
            return {};
        } else if (node.importClause.namedBindings) {
            const nb = node.importClause.namedBindings;
            if (nb.kind == ts.SyntaxKind.NamespaceImport) {
                // This is of the form `import * as name from 'path'`. Return `name.`.
                return {
                    [(nb as ts.NamespaceImport).name.text + '.']: modulePath,
                };
            } else {
                // This is of the form `import {a,b,c} from 'path'`
                const namedImports = nb as ts.NamedImports;

                return namedImports.elements
                    .map((is: ts.ImportSpecifier) => is.propertyName ? is.propertyName.text : is.name.text)
                    .reduce((acc: { [name: string]: string }, curr: string) => {
                        acc[curr] = modulePath;

                        return acc;
                    }, {});
            }
        }

        return {};
    } else {
        // This is of the form `import 'path';`. Nothing to do.
        return {};
    }
}

/**
 * Custom function to insert an export into NgModule. It also imports it.
 */
export function addExportToModule(source: ts.SourceFile,
                                  modulePath: string, classifiedName: string,
                                  importPath: string): Change[] {
    return addSymbolToNgModuleMetadata(source, modulePath, 'exports', classifiedName, importPath);
}

export function buildPath(options: any, type: string): string {
    return `/${options.path}/`
        + (options.flat ? '' : strings.dasherize(options.name) + '/')
        + strings.dasherize(options.name)
        + '.' + type;
}

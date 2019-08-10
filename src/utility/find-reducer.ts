import {DirEntry, SchematicsException, Tree} from '@angular-devkit/schematics';
import {join, Path} from '@angular-devkit/core';
import {determineFilePath, getSourceNodes, insertImport} from './find-module';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {InsertChange} from '@schematics/angular/utility/change';
import * as ts from 'typescript';
import {normalize} from 'path';
import {functionIze} from './function-ize';

export function findRootReducer(host: Tree, generateDir: string): Path {
    let dir: DirEntry | null = host.getDir('/' + generateDir);

    const moduleRe = /-root\.reducer\.ts$/;

    let result = determineFilePath(dir, host, moduleRe);

    if (result) {
        return result;
    }

    while (dir) {
        const matches = dir.subfiles.filter(p => moduleRe.test(p));

        if (matches.length == 1) {
            return join(dir.path, matches[0]);
        } else if (matches.length > 1) {
            throw new Error('More than one root-reducer matches. Use skip-import option to skip importing '
                + 'the state into the closest root-reducer.');
        }

        dir = dir.parent;
    }

    throw new Error('Could not find an RootReducer. Use the skip-import '
        + 'option to skip importing in RootReducer.');
}

export interface AddReducerContext {
    rootReducerFileName: string;
    relativeReducerFileName: string;
    reducerName: string;
    reducerType: string;
}


export function createAddReducerContext(host: Tree, options: any, reducerType: string): AddReducerContext {
    const rootReducerFileName = findRootReducer(host, options.path).replace('.ts', '');
    const reducerName = dasherize(options.name + classify(reducerType) + 'Reducer');
    const reducerFileName = constructDestinationPath(options, reducerName);
    const relativeReducerFileName = buildRelativePath(options.path + '/' + rootReducerFileName, reducerFileName);

    return {
        rootReducerFileName,
        relativeReducerFileName,
        reducerName,
        reducerType
    }
}

export function constructDestinationPath(options: any, reducerName: string): string {
    return options.path + '/statemanagement/reducers/data/' + reducerName;
}

export function createConstructorForInjection(context: AddReducerContext, nodes: ts.Node[]): InsertChange {
    let toAdd = '\n  ' + context.reducerType + ': ' + context.reducerName + ',';
    const rootReducerNameArray = context.rootReducerFileName.split('/');
    const rootReducerName = functionIze(rootReducerNameArray[rootReducerNameArray.length - 1].replace('.', '-'));

    const constNode = nodes.find(n => n.kind === ts.SyntaxKind.VariableDeclaration && n.getFullText().includes(rootReducerName));

    if (!constNode) {
        throw new SchematicsException(`expected const in ${context.rootReducerFileName}`);
    }

    if (!constNode.parent) {
        throw new SchematicsException(`expected constructor in ${context.rootReducerFileName} to have a parent node`);
    }

    const objectLiteralExpression = constNode.getChildren().find(n => n.kind === ts.SyntaxKind.ObjectLiteralExpression);

    if (!objectLiteralExpression) {
        throw new SchematicsException(`expected ObjectLiteralExpression in ${context.rootReducerFileName}`);
    }

    const syntaxList = objectLiteralExpression.getChildren().filter(n => n.kind === ts.SyntaxKind.SyntaxList);

    console.log('syntaxList.length: ' + syntaxList.length);
    let positon: number = 0;
    if (syntaxList.length > 0) {
        let result = syntaxList.sort((a, b) => (a.pos > b.pos) ? 1 : -1).map(n => n.pos);
        console.log('result: ' + result);
        console.log('result.length: ' + result.length);
        positon = result[result.length - 1];
    } else if (syntaxList.length == 0) {
        positon = objectLiteralExpression.pos;
    } else {
        throw new SchematicsException('ObjectLiteralExpression doesn\'t have children for some reason');
    }
    console.log('positon: ' + positon);
    return new InsertChange(context.rootReducerFileName, positon + 1, toAdd);
}

export function buildInjectionChanges(context: AddReducerContext, host: Tree, options: any): InsertChange[] {
    const text = host.read(normalize(options.path + '/' + context.rootReducerFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootReducerFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

    const nodes = getSourceNodes(sourceFile);

    const constructorChange: InsertChange = createConstructorForInjection(context, nodes);


    return [
        constructorChange,
        insertImport(sourceFile, context.rootReducerFileName, functionIze(context.reducerName), context.relativeReducerFileName) as InsertChange
    ];

}

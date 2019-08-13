import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {getSourceNodes, insertImport} from './find-module';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import * as ts from 'typescript';
import {normalize} from 'path';
import {functionIze} from './function-ize';
import {findFile} from './find-file';
import {Change, InsertChange} from "./change";

export function findRootReducer(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.reducer\.ts$/;

    return findFile(host, generateDir, moduleRe);
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
    const reducerFileName = constructDestinationPath(options, reducerType, 'reducers', 'reducer');
    const relativeReducerFileName = buildRelativePath(options.path + '/' + rootReducerFileName, reducerFileName);

    return {
        rootReducerFileName,
        relativeReducerFileName,
        reducerName,
        reducerType
    }
}

export function constructDestinationPath(options: any, reducerType: string, folder: string, extention: string): string {
    return options.path + '/statemanagement/' + folder + '/' + reducerType + '/' + dasherize(options.name ) + '-' + reducerType + '.' + extention;
}

export function createReducerChange(context: AddReducerContext, nodes: ts.Node[]): InsertChange {
    let toAdd = '\n  ' + context.reducerType + ': ' + functionIze(context.reducerName) + ',';
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

    let positon: number = 0;
    if (syntaxList.length > 0) {
        let result = syntaxList.sort((a, b) => (a.pos > b.pos) ? 1 : -1).map(n => n.pos);
        positon = result[result.length - 1];
    } else if (syntaxList.length == 0) {
        positon = objectLiteralExpression.pos;
    } else {
        throw new SchematicsException('ObjectLiteralExpression doesn\'t have children for some reason');
    }
    return new InsertChange(context.rootReducerFileName, positon + 1, toAdd);
}

export function buildAddReducerChanges(context: AddReducerContext, host: Tree, options: any): Change[] {
    const text = host.read(normalize(options.path + '/' + context.rootReducerFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootReducerFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

    const nodes = getSourceNodes(sourceFile);

    return [
        createReducerChange(context, nodes),
        insertImport(sourceFile, context.rootReducerFileName, functionIze(context.reducerName), context.relativeReducerFileName)
    ];
}

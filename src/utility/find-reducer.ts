import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {functionIze} from './function-ize';
import {findFile, getSourceFile} from './find-file';
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {Change, InsertChange} from "@schematics/angular/utility/change";

export function findRootReducer(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.reducer\.ts$/;

    return findFile(host, moduleRe, generateDir);
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
    const reducerFileName = constructDestinationPath(options, 'reducers', 'reducer', reducerType);
    const relativeReducerFileName = buildRelativePath(options.path + '/' + rootReducerFileName, reducerFileName);

    return {
        rootReducerFileName,
        relativeReducerFileName,
        reducerName,
        reducerType
    }
}

export function constructDestinationPath(options: any, folder: string, extention: string, reducerType?: string): string {
    if (reducerType)
        return constructDestinationPathWithType(options, folder, extention, reducerType);
    return constructDestinationPathWithoutType(options, folder, extention);
}

function constructDestinationPathWithoutType(options: any, folder: string, extention: string): string {
    return options.path + '/statemanagement/' + folder + '/' + dasherize(options.name) + '.' + extention;
}

function constructDestinationPathWithType(options: any, folder: string, extention: string, reducerType: string) {
    return options.path + '/statemanagement/' + folder + '/' + reducerType + '/' + dasherize(options.name) + '-' + reducerType + '.' + extention;
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
    const sourceFile = getSourceFile(host, options.path, context.rootReducerFileName);

    const nodes = getSourceNodes(sourceFile);

    return [
        createReducerChange(context, nodes),
        insertImport(sourceFile, context.rootReducerFileName, functionIze(context.reducerName), context.relativeReducerFileName)
    ];
}

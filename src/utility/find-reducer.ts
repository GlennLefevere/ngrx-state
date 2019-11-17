import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {functionIze} from './function-ize';
import {findFile, getSourceFile, readIntoSourceFile} from './find-file';
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {Change, InsertChange} from "@schematics/angular/utility/change";
import {findNodeByType, findPositionSyntaxLists} from './nodes';
import {findFileContainingType} from './find-action';

export function findRootReducer(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.reducer\.ts$/;

    return findFile(host, moduleRe, generateDir);
}

function findReducerForStateLevel(host: Tree, generateDir: string, stateLevel: string): Path {
    const moduleRe = new RegExp(stateLevel + "\.reducer\.ts");

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

export function constructDestinationPath(options: any, folder: string, extention: string, reducerType?: string, withoutExtenstion: boolean = false): string {
    if (reducerType && !withoutExtenstion)
        return constructDestinationPathWithType(options, folder, extention, reducerType);
    else if(reducerType && withoutExtenstion)
        return constructDestinationPathWithoutExtensionType(options, folder, extention, reducerType);
    return constructDestinationPathWithoutType(options, folder, extention);
}

function constructDestinationPathWithoutType(options: any, folder: string, extention: string): string {
    return options.path + '/statemanagement/' + folder + '/' + dasherize(options.name) + '.' + extention;
}

function constructDestinationPathWithType(options: any, folder: string, extention: string, reducerType: string) {
    return options.path + '/statemanagement/' + folder + '/' + reducerType + '/' + dasherize(options.name) + '-' + reducerType + '.' + extention;
}

function constructDestinationPathWithoutExtensionType(options: any, folder: string, extention: string, reducerType: string) {
    return options.path + '/statemanagement/' + folder + '/' + reducerType + '/' + dasherize(options.name) + '.' + extention;
}

function createReducerChange(context: AddReducerContext, nodes: ts.Node[]): InsertChange {
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

    const objectLiteralExpression = findNodeByType(constNode, ts.SyntaxKind.ObjectLiteralExpression);

    const position = findPositionSyntaxLists(objectLiteralExpression);

    return new InsertChange(context.rootReducerFileName, position + 1, toAdd);
}

export function buildAddReducerChanges(context: AddReducerContext, host: Tree, options: any): Change[] {
    const sourceFile = getSourceFile(host, options.path, context.rootReducerFileName);

    const nodes = getSourceNodes(sourceFile);

    return [
        createReducerChange(context, nodes),
        insertImport(sourceFile, context.rootReducerFileName, functionIze(context.reducerName), context.relativeReducerFileName)
    ];
}

interface AddToStateLevelReducerContext {
    reducerFunction: string;
    destinationReducerPath: string;
    reducerPath: string;
    relativePath: string;
    reducerStateName: string;
}

export function buildAddToStateLevelReducerContext(host: Tree, options: any): AddToStateLevelReducerContext {
    const destinationReducerPath = options.path + '/' + findReducerForStateLevel(host, options.path, options.stateLevel);
    const reducerFunction = functionIze(options.name) + 'Reducer';
    const reducerPath = constructDestinationPath(options, 'reducers', 'reducer', options.stateLevel, true);
    const relativePath = buildRelativePath(destinationReducerPath, reducerPath);
    const reducerStateName = functionIze(options.name) + (options.array ? 's' : '');

    return {
        reducerFunction,
        destinationReducerPath,
        reducerPath,
        relativePath,
        reducerStateName
    };
}

export function createStateLevelReducerChange(host: Tree, context: AddToStateLevelReducerContext): Change {
    const source = readIntoSourceFile(host, context.destinationReducerPath);

    const nodes = getSourceNodes(source);

    return addStateLevelReducer(context, nodes);
}

function addStateLevelReducer(context: AddToStateLevelReducerContext, nodes: ts.Node[]): Change {
    let toAdd = '\n      ' + context.reducerStateName + ': ' + context.reducerFunction + ',';

    const combineReducerReturnNode = nodes.find(n => n.kind === ts.SyntaxKind.CallExpression && n.getFullText().includes('combineReducers') && !n.getFullText().includes('action'));

    if (!combineReducerReturnNode) {
        throw new SchematicsException("combineReducer return not found!");
    }

    const combineReducerSyntaxList = findNodeByType(combineReducerReturnNode, ts.SyntaxKind.SyntaxList);

    const reducerObjectLiteralExpression = findNodeByType(combineReducerSyntaxList, ts.SyntaxKind.ObjectLiteralExpression);

    const position = findPositionSyntaxLists(reducerObjectLiteralExpression);

    return new InsertChange(context.destinationReducerPath, position + 1, toAdd);
}

export interface AddActionTypeContext {
    actionType: string;
    relativePath: string;
    destinationFile: string;
}

export function createAddActionTypeContext(host: Tree, options: any): AddActionTypeContext {
    const addActionType = !!options.actionType;
    const destinationFile = constructDestinationPath(options, 'reducers', 'reducer', options.stateLevel, true) + '.ts';
    let relativePath = '@ngrx/store';
    if (addActionType) {
        const actionTypeFile = /*options.path + '/' + */findFileContainingType(host, classify(options.actionType), options.path);
        relativePath = buildRelativePath(destinationFile, actionTypeFile.replace('.ts', ''));
    } else {
        options.actionType = 'Action';
    }
    return {
        actionType: options.actionType,
        destinationFile,
        relativePath
    }
}

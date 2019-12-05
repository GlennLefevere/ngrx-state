import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile, findFileContainingClass, getSourceFile, readIntoSourceFile} from './find-file';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {constructDestinationPath} from './find-reducer';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {Change, InsertChange, NoopChange} from "@schematics/angular/utility/change";
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {findNodeByType, findPositionSyntaxLists} from './nodes';
import {functionIze} from './function-ize';

export function findRootState(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.state\.ts$/;

    return findFile(host, moduleRe, generateDir);
}

export function findStateForStateLevel(host: Tree, generateDir: string, stateLevel: string): Path {
    const moduleRe = new RegExp(stateLevel + "\.state\.ts");

    return findFile(host, moduleRe, generateDir);
}

export interface AddStateContext {
    rootStateFileName: string;
    relativeStateFileName: string;
    stateName: string;
    stateType: string;
}

export function createAddStateContext(host: Tree, options: any, stateType: string): AddStateContext {
    const rootStateFileName = findRootState(host, options.path).replace('.ts', '');
    const stateName = dasherize(options.name + classify(stateType) + 'State');
    const stateFileName = constructDestinationPath(options, 'state', 'state', stateType);
    const relativeStateFileName = buildRelativePath(options.path + '/' + rootStateFileName, stateFileName);

    return {
        rootStateFileName,
        relativeStateFileName,
        stateName,
        stateType
    }
}

function createStateChange(context: AddStateContext, nodes: ts.Node[]): InsertChange {
    let toAdd = '\n  ' + context.stateType + ': ' + classify(context.stateName) + ';';
    const rootStateNameArray = context.rootStateFileName.split('/');
    const rootStateName = classify(rootStateNameArray[rootStateNameArray.length - 1].replace('.', '-'));

    const interfaceNode = nodes.find(n => n.kind === ts.SyntaxKind.InterfaceDeclaration && n.getFullText().includes(rootStateName));

    if (!interfaceNode) {
        throw new SchematicsException(`expected const in ${context.rootStateFileName}`);
    }

    const positon = findPositionSyntaxLists(interfaceNode);

    return new InsertChange(context.rootStateFileName, positon + 1, toAdd);
}

export function buildAddStateChanges(context: AddStateContext, host: Tree, options: any): Change[] {
    const sourceFile = getSourceFile(host, options.path, context.rootStateFileName);

    const nodes = getSourceNodes(sourceFile);

    return [
        createStateChange(context, nodes),
        insertImport(sourceFile, context.rootStateFileName, classify(context.stateName), context.relativeStateFileName)
    ];
}


export function getStateName(context: AddStateContext, host: Tree, options: any): string {
    const sourceFile = getSourceFile(host, options.path, context.rootStateFileName);

    const nodes = getSourceNodes(sourceFile);

    return getStateNameFromNodes(context, nodes);
}

function getStateNameFromNodes(context: AddStateContext, nodes: ts.Node[]): string {
    const constNode = nodes.filter(n => n.kind === ts.SyntaxKind.Identifier).filter(n => n.getFullText().includes('RootState'));

    if (!constNode || constNode.length == 0) {
        throw new SchematicsException(`expected Variable in ${context.rootStateFileName}`);
    } else if (constNode.length > 1) {
        throw new SchematicsException(`Many Variables with get*RootState in ${context.rootStateFileName}`);
    }
    const node = constNode[0];

    return node.getFullText().replace(/\s/g, '');
}

export interface AddStateLevelChangesContext {
    destinationStateFileName: string;
    className: string;
    classRelativePath: string;
}

export function createAddStateLevelChangesContext(host: Tree, options: any): AddStateLevelChangesContext {
    const destinationStateFileName = options.path + '/' + findStateForStateLevel(host, options.path, options.stateLevel);
    const classFileName = findFileContainingClass(host, options.className, options.path).replace('\.ts', '');
    const className = classify(options.className);
    const classRelativePath = buildRelativePath(destinationStateFileName, classFileName);

    return {
        destinationStateFileName,
        className,
        classRelativePath
    };
}

export function buildAddStateLevelChangesContext(context: AddStateLevelChangesContext, host: Tree, options: any): Change[] {
    const sourceFile = readIntoSourceFile(host, context.destinationStateFileName);

    const nodes = getSourceNodes(sourceFile);

    return [
        createStateLevelTypeChanges(nodes, options, context),
        createInitialStateLevelChanges(nodes, options, context),
        insertImport(sourceFile, context.destinationStateFileName, context.className, context.classRelativePath)
    ];
}

function createStateLevelTypeChanges(nodes: ts.Node[], options: any, context: AddStateLevelChangesContext): Change {
    const toAdd = '\n  ' + functionIze(options.name) + ': ' + context.className + (options.array ? '[],' : ',');
    const stateTypeDef = nodes.find(n => n.kind === ts.SyntaxKind.TypeAliasDeclaration);

    if (!stateTypeDef) {
        throw new SchematicsException('State type definition not found');
    }

    const readOnlyTypeReference = findNodeByType(stateTypeDef, ts.SyntaxKind.TypeReference);

    const position = findPositionSyntaxLists(readOnlyTypeReference);

    return new InsertChange(context.destinationStateFileName, position + 1, toAdd);
}

function createInitialStateLevelChanges(nodes: ts.Node[], options: any, context: AddStateLevelChangesContext): Change {
    const toAdd = '\n  ' + options.name + ': ' + (options.array ? '[],' : 'undefined,');

    const stateVariableDeclaration = nodes.find(n => n.kind === ts.SyntaxKind.VariableDeclaration);

    if(!stateVariableDeclaration) {
        console.error('Initial state declaration not found.');
        return new NoopChange();
    }

    const objectLiteralExpression = findNodeByType(stateVariableDeclaration, ts.SyntaxKind.ObjectLiteralExpression);

    const positon = findPositionSyntaxLists(objectLiteralExpression);

    return new InsertChange(context.destinationStateFileName, positon + 1, toAdd);
}

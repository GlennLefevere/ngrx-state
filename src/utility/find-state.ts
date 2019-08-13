import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile} from './find-file';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {constructDestinationPath} from './find-reducer';
import {normalize} from "path";
import * as ts from 'typescript';
import {getSourceNodes, insertImport} from './find-module';
import {Change, InsertChange} from "./change";

export function findRootState(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.state\.ts$/;

    return findFile(host, generateDir, moduleRe);
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
    const stateFileName = constructDestinationPath(options, stateType, 'state', 'state');
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

    const syntaxList = interfaceNode.getChildren().filter(n => n.kind === ts.SyntaxKind.SyntaxList);
    let positon: number = 0;
    if (syntaxList.length > 0) {
        let result = syntaxList.sort((a, b) => (a.pos > b.pos) ? 1 : -1).map(n => n.pos);
        positon = result[result.length - 1];
    } else if (syntaxList.length == 0) {
        positon = interfaceNode.pos;
    } else {
        throw new SchematicsException('InterfaceDeclaration doesn\'t have children for some reason');
    }


    return new InsertChange(context.rootStateFileName, positon + 1, toAdd);
}

export function buildAddStateChanges(context: AddStateContext, host: Tree, options: any): Change[] {
    const text = host.read(normalize(options.path + '/' + context.rootStateFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootStateFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

    const nodes = getSourceNodes(sourceFile);

    return [
        createStateChange(context, nodes),
        insertImport(sourceFile, context.rootStateFileName, classify(context.stateName), context.relativeStateFileName)
    ];
}


export function getStateName(context: AddStateContext, host: Tree, options: any): string {
    const text = host.read(normalize(options.path + '/' + context.rootStateFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootStateFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

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

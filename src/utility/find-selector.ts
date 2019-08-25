import {Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile, getSourceFile, readIntoSourceFile} from './find-file';
import {join, relative} from 'path';
import {constructDestinationPath} from './find-reducer';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {AddStateContext, findStateForStateLevel} from './find-state';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {applyChanges} from './change';
import {Change, InsertChange} from '@schematics/angular/utility/change';
import {findNodeByType} from './nodes';

export function findRootSelector(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.selectors\.ts$/;

    return findFile(host, moduleRe, generateDir);
}

function findSelectorForStateLevel(host: Tree, generateDir: string, stateLevel: string): Path {
    const moduleRe = new RegExp(stateLevel + "\.selectors\.ts");

    return findFile(host, moduleRe, generateDir);
}

export interface AddSelectorContext {
    rootSelectorFileName: string;
    relativeSelectorFileName: string;
    selectorType: string;
}

export function createAddSelectorContext(host: Tree, options: any, selectorType: string): AddSelectorContext {
    const rootSelectorFileName = findRootSelector(host, options.path).replace('.ts', '');
    const selectorPath = constructDestinationPath(options, 'selectors', 'selectors', selectorType);
    const relativeSelectorFileName = relative(selectorPath, options.path + '/' + rootSelectorFileName);

    return {
        rootSelectorFileName,
        relativeSelectorFileName,
        selectorType
    };
}

function determineSelectorName(context: AddSelectorContext, nodes: ts.Node[]): string {
    const constNode = nodes.filter(n => n.kind === ts.SyntaxKind.Identifier).filter(n => n.getFullText().includes('State') && n.getFullText().includes('get'));

    if (!constNode || constNode.length == 0) {
        throw new SchematicsException(`expected Variable in ${context.rootSelectorFileName}`);
    } else if (constNode.length > 1) {
        throw new SchematicsException(`Many Variables with get*State in ${context.rootSelectorFileName}`);
    }

    const node = constNode[0];

    return node.getFullText().replace(/\s/g, '');
}


export function getSelectorName(context: AddSelectorContext, host: Tree, options: any): string {
    const sourceFile = getSourceFile(host, options.path, context.rootSelectorFileName);

    const nodes = getSourceNodes(sourceFile);

    return determineSelectorName(context, nodes);
}

export function addImports(options: any, selectorContext: AddSelectorContext, stateContext: AddStateContext): Rule {
    return (host: Tree) => {
        const path = '/statemanagement/selectors/' + selectorContext.selectorType + '/' + dasherize(options.name) + '-' + selectorContext.selectorType + '.selectors';

        const stateRelativePath = buildRelativePath(join(options.path, path), options.path + '/' + stateContext.rootStateFileName);
        const selectorRelativePath = buildRelativePath(join(options.path, path), options.path + '/' + selectorContext.rootSelectorFileName);

        const stateSourceFile = getSourceFile(host, options.path, path);

        let changes = [
            insertImport(stateSourceFile, path, options.selectorName, selectorRelativePath),
            insertImport(stateSourceFile, path, options.stateName, stateRelativePath),
        ];

        return applyChanges(host, changes, options.path + '/' + path + '.ts');
    }
}

export interface StateLevelSelectorContext {
    selectorFileName: string;
    stateLevelState: string;
    relativePath: string;
}

export function createStateLevelSelectorContext(host: Tree, options: any): StateLevelSelectorContext {
    const selectorFileName = options.path + '/' + findSelectorForStateLevel(host, options.path, options.stateLevel);
    const stateLevelFIleName = options.path + '/' + findStateForStateLevel(host, options.path, options.stateLevel);
    const stateLevelState = determineStateTypeName(host, stateLevelFIleName);
    const relativePath = buildRelativePath(selectorFileName, stateLevelFIleName);

    return {
        relativePath,
        selectorFileName,
        stateLevelState
    }
}

export function addStateLevelSelectorContext(host: Tree, options: any, context: StateLevelSelectorContext): Change[] {
    const sourceFile = readIntoSourceFile(host, context.selectorFileName);

    const nodes = getSourceNodes(sourceFile);

    return [
        addSelector(nodes, options, context),
        insertImport(sourceFile, context.selectorFileName, context.stateLevelState, context.relativePath)
    ];
}

function addSelector(nodes: ts.Node[], options: any, context: StateLevelSelectorContext): Change {
    const startRegex = /select/;
    const endRegex = new RegExp(classify(options.stateLevel) + 'State');

    const selectorDeclaration = nodes.find(n => startRegex.test(n.getFullText()) && endRegex.test(n.getFullText()) && n.kind === ts.SyntaxKind.VariableDeclaration);

    if (!selectorDeclaration) {
        throw new SchematicsException("Selector declaration not found");
    }

    const selectorIdentifier = findNodeByType(selectorDeclaration, ts.SyntaxKind.Identifier);

    const selectorIdentifierName = selectorIdentifier.getFullText().trim();

    const name = options.name + (options.array ? 's' : '');
    const nameClassified = classify(name);

    //TODO: fix import for the state

    const toAdd = `\nexport const select${nameClassified} = createSelector(
  ${selectorIdentifierName},
  (state: ${context.stateLevelState}) => state.${name}
);`;

    let result = nodes.sort((a, b) => (a.pos > b.pos) ? 1 : -1).map(n => n.pos);
    const position = result[result.length - 1];

    return new InsertChange(context.selectorFileName, position + 1, toAdd);
}

function determineStateTypeName(host: Tree, stateFileName: string): string {
    const sourceFile = readIntoSourceFile(host, stateFileName);

    const nodes = getSourceNodes(sourceFile);

    const typeAliasDeclaration = nodes.find(n => n.kind === ts.SyntaxKind.TypeAliasDeclaration);

    if (!typeAliasDeclaration) {
        throw new SchematicsException('TypeAliasDeclaration not found');
    }

    return findNodeByType(typeAliasDeclaration, ts.SyntaxKind.Identifier).getFullText().trim();
}

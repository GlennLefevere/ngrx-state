import {Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile, getSourceFile} from './find-file';
import {join, relative} from 'path';
import {constructDestinationPath} from './find-reducer';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {AddStateContext} from './find-state';
import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {applyChanges} from './change';

export function findRootSelector(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.selectors\.ts$/;

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

import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile} from './find-file';
import {normalize, relative} from 'path';
import {constructDestinationPath} from './find-reducer';
import * as ts from 'typescript';
import {InsertChange} from '@schematics/angular/utility/change';
import {getSourceNodes, insertImport} from './find-module';

export function findRootSelector(host: Tree, generateDir: string): Path {
    const moduleRe = /-root\.selectors\.ts$/;

    return findFile(host, generateDir, moduleRe);
}

export interface AddSelectorContext {
    rootSelectorFileName: string;
    relativeSelectorFileName: string;
    selectorType: string;
}

export function createAddSelectorContext(host: Tree, options: any, selectorType: string): AddSelectorContext {
    const rootSelectorFileName = findRootSelector(host, options.path).replace('.ts', '');
    const selectorPath = constructDestinationPath(options, selectorType, 'selectors', 'selectors');
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
    } else if(constNode.length > 1) {
        throw new SchematicsException(`Many Variables with get*RootState in ${context.rootSelectorFileName}`);
    }

    const node = constNode[0];

    return node.getFullText().replace(/\s/g,'');
}


export function buildAddSelectorChanges(context: AddSelectorContext, host: Tree, options: any): InsertChange[] {
    const text = host.read(normalize(options.path + '/' + context.rootSelectorFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootSelectorFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

    const nodes = getSourceNodes(sourceFile);

    const selectorName = determineSelectorName(context, nodes);

    return [
        insertImport(sourceFile, context.rootSelectorFileName, selectorName, context.relativeSelectorFileName) as InsertChange
    ];
}

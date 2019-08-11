import {Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {Path} from '@angular-devkit/core';
import {findFile} from './find-file';
import {join, normalize, relative} from 'path';
import {constructDestinationPath} from './find-reducer';
import * as ts from 'typescript';
import {getSourceNodes, insertImport} from './find-module';
import {AddStateContext} from './find-state';
import {dasherize} from '@angular-devkit/core/src/utils/strings';
import {InsertChange} from './change';
import {buildRelativePath} from '@schematics/angular/utility/find-module';

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
    } else if (constNode.length > 1) {
        throw new SchematicsException(`Many Variables with get*State in ${context.rootSelectorFileName}`);
    }

    const node = constNode[0];

    return node.getFullText().replace(/\s/g, '');
}


export function getSelectorName(context: AddSelectorContext, host: Tree, options: any): string {
    const text = host.read(normalize(options.path + '/' + context.rootSelectorFileName + '.ts'));
    if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
    const sourceText = text.toString('utf-8');

    const sourceFile = ts.createSourceFile(context.rootSelectorFileName, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

    const nodes = getSourceNodes(sourceFile);

    return determineSelectorName(context, nodes);
}

export function addImports(options: any, selectorContext: AddSelectorContext, stateContext: AddStateContext): Rule {
    return (host: Tree) => {
        const path = '/statemanagement/selectors/' + selectorContext.selectorType + '/' + dasherize(options.name) + '-' + selectorContext.selectorType + '.selectors';

        const stateRelativePath = buildRelativePath(join(options.path, path), options.path + '/' + stateContext.rootStateFileName);
        const selectorRelativePath = buildRelativePath(join(options.path, path), options.path + '/' + selectorContext.rootSelectorFileName);

        const text = host.read(normalize(options.path + '/' + path + '.ts'));
        if (!text) throw new SchematicsException(`File ${options.module} does not exist.`);
        const sourceText = text.toString('utf-8');

        const stateSourceFile = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true) as ts.SourceFile;

        console.log(stateSourceFile, path, options.selectorName, selectorRelativePath);

        let changes = [
            insertImport(stateSourceFile, path, options.selectorName, selectorRelativePath),
            insertImport(stateSourceFile, path, options.stateName, stateRelativePath),
        ];

        const declarationRecorder = host.beginUpdate(options.path + '/' + path + '.ts');

        for (const change of changes) {
            if(change instanceof InsertChange) {
                declarationRecorder.insertLeft(change.pos, change.toAdd);
            }
        }
        host.commitUpdate(declarationRecorder);

        return host;
    }
}

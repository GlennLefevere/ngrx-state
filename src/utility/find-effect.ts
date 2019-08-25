import {SchematicsException, Tree} from "@angular-devkit/schematics";
import {Path} from "@angular-devkit/core";
import {findFile, getSourceFile} from "./find-file";
import {classify} from "@angular-devkit/core/src/utils/strings";
import {buildRelativePath} from "@schematics/angular/utility/find-module";
import {constructDestinationPath} from "./find-reducer";
import {Change, InsertChange} from "@schematics/angular/utility/change";
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";
import {getSourceNodes, insertImport} from "@schematics/angular/utility/ast-utils";
import {findNodeByType} from './nodes';

export function findRootEffects(host: Tree, generateDir?: string): Path {
    const moduleRe = /-root\.effects\.ts$/;

    return findFile(host, moduleRe, generateDir);
}

export interface AddEffectsContext {
    rootEffectsName: string;
    relativeEffectsFileName: string;
    effectsName: string;
}

export function createAddEffectsContext(host: Tree, options: any): AddEffectsContext {
    let rootEffectsName = findRootEffects(host, options.path).replace('.ts', '');
    const effectsName = classify(options.name + 'Effects');
    const effectsFileName = constructDestinationPath(options, 'effects', 'effects');
    const relativeEffectsFileName = buildRelativePath(options.path + '/' + rootEffectsName, effectsFileName);

    return {
        rootEffectsName,
        relativeEffectsFileName,
        effectsName
    };
}

function createRootEffectsChanges(context: AddEffectsContext, nodes: ts.Node[]): Change {
    const rootEffectsNameArray = context.rootEffectsName.split('/');
    const rootEffectsName = classify(rootEffectsNameArray[rootEffectsNameArray.length - 1].replace('.', '-'));

    const constNode = nodes.find(n => n.kind === ts.SyntaxKind.VariableDeclaration && n.getFullText().includes(rootEffectsName));
    if (!constNode) {
        throw new SchematicsException(`expected const in ${context.rootEffectsName}`);
    }

    if (!constNode.parent) {
        throw new SchematicsException(`expected constructor in ${context.rootEffectsName} to have a parent node`);
    }

    const arrayNode = findNodeByType(constNode, ts.SyntaxKind.ArrayLiteralExpression);

    const syntaxListNode = findNodeByType(arrayNode, ts.SyntaxKind.SyntaxList);

    let postFix = '';
    let positon: number = syntaxListNode.pos;

    if (syntaxListNode.getChildren().length > 0) {
        postFix = ', ';
    }

    const toAdd = context.effectsName + postFix;
    return new InsertChange(context.rootEffectsName, positon, toAdd);
}

export function buildAddEffectsChanges(host: Tree, context: AddEffectsContext, options: any): Change[] {
    const sourceFile = getSourceFile(host, options.path, context.rootEffectsName);

    const nodes = getSourceNodes(sourceFile);

    return [
        createRootEffectsChanges(context, nodes),
        insertImport(sourceFile, context.rootEffectsName, context.effectsName, context.relativeEffectsFileName)
    ];
}

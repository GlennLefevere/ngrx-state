import {chain, noop, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {enrichOptions} from '../utility/options';
import {copyFiles} from '../utility/copy-files';
import {addProviderToModule, getSourceNodes, insertImport} from '@schematics/angular/utility/ast-utils';
import {readIntoSourceFile} from '../utility/find-file';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {applyChanges} from '../utility/change';
import {Change, InsertChange} from '@schematics/angular/utility/change';
import {findRootState, findStateName} from '../utility/find-state';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {findNodeByType} from '../utility/nodes';
import {functionIze} from '../utility/function-ize';

export default function (options: AddSandboxSchematics): Rule {
    return (host: Tree, context: SchematicContext) => {

        options = enrichOptions(host, options);

        return chain([
            copyFiles(options, './files', options.path),
            options.importRootState ? addStoreImport(options) : noop(),
            options.importRootState ? addStoreToSandbox(options) : noop(),
            provideSandboxInModule(options)
        ])(host, context);
    }
}

function addStoreImport(options: AddSandboxSchematics): Rule {
    return (host: Tree) => {
        const fileName = options.path + '/sandbox/' + dasherize(options.name) + '.sandbox.ts';
        const sourceFile = readIntoSourceFile(host, fileName);

        const change = [
            insertImport(sourceFile, fileName, 'Store', '@ngrx/store')
        ];

        return applyChanges(host, change, fileName)
    }

}

class AddStoreContext {
    destinationFile: string;
    rootStateFileName: string;
    rootStateName: string;
    relativePath: string;
}

function buildAddStoreContext(host: Tree, options: any): AddStoreContext {
    const destinationFile = options.path + '/sandbox/' + dasherize(options.name) + '.sandbox.ts';
    const rootStateFileName = options.path + '/' + findRootState(host, options.path).replace('.ts', '');
    const rootStateName = findStateName(host, rootStateFileName);
    const relativePath = buildRelativePath(destinationFile, rootStateFileName);
    return {
        destinationFile,
        rootStateFileName,
        rootStateName,
        relativePath
    }
}

function addStoreToSandbox(options: AddSandboxSchematics): Rule {
    return (host: Tree) => {
        const context = buildAddStoreContext(host, options);

        const sourceFile = readIntoSourceFile(host, context.destinationFile);

        const change: Change[] = [
            insertImport(sourceFile, context.destinationFile, context.rootStateName, context.relativePath),
            addRootStateToConstructor(host, context)
        ];

        return applyChanges(host, change, context.destinationFile);
    }
}

function addRootStateToConstructor(host: Tree, context: AddStoreContext): Change {
    const toAdd = functionIze(context.rootStateName) + ': Store<' + context.rootStateName + '>';
    const sourceFile = readIntoSourceFile(host, context.destinationFile);

    const nodes = getSourceNodes(sourceFile);

    const constructorNode = nodes.find(n => n.kind === ts.SyntaxKind.Constructor);
    if (!constructorNode) {
        throw new SchematicsException('Constructor node not found');
    }

    const syntaxList = findNodeByType(constructorNode, ts.SyntaxKind.SyntaxList);

    return new InsertChange(context.destinationFile, syntaxList.pos, toAdd);
}

function provideSandboxInModule(options: any): Rule {
    return (host: Tree) => {
        const sandboxPath = options.path + '/sandbox/' + dasherize(options.name) + '.sandbox';
        const modulePath = options.module;
        const relativePath = buildRelativePath(modulePath, sandboxPath);

        const sourceFile = readIntoSourceFile(host, modulePath);

        const changes = addProviderToModule(sourceFile, modulePath, classify(options.name) + 'Sandbox', relativePath);

        return applyChanges(host, changes, modulePath);
    }
}

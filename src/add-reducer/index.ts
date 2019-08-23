import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {enrichOptions} from '../utility/options';
import {copyFiles} from '../utility/copy-files';
import {findFileContainingClass, readIntoSourceFile} from '../utility/find-file';
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';
import {buildRelativePath} from '@schematics/angular/utility/find-module';
import {insertImport} from '@schematics/angular/utility/ast-utils';
import {applyChanges} from '../utility/change';
import {buildAddToStateLevelReducerContext, createStateLevelReducerChange} from '../utility/find-reducer';
import {buildAddStateLevelChangesContext, createAddStateLevelChangesContext} from '../utility/find-state';


export default function (options: AddReducerSchematics): Rule {
    return (host: Tree, context: SchematicContext) => {

        options = enrichOptions(host, options);

        return chain([
            copyFiles(options, './files', options.path),
            addClassImport(options),
            addToCombineReducer(options),
            addToStateLevelState(options)
        ])(host, context);
    }
}

function addClassImport(options: AddReducerSchematics): Rule {
    return (host: Tree) => {

        const context = createAddClassImportContext(host, options);

        const source = readIntoSourceFile(host, context.classDestinationPath);

        const changes = [
            insertImport(source, context.classDestinationPath, context.className, context.classRelativePath)
        ];

        return applyChanges(host, changes, context.classDestinationPath);
    }
}

interface AddClassImportContext {
    importFile: string;
    classRelativePath: string;
    classDestinationPath: string;
    className: string;
}

function createAddClassImportContext(host: Tree, options: AddReducerSchematics): AddClassImportContext {
    const importFile = findFileContainingClass(host, options.className, options.path);
    const className = classify(options.className);
    let classDestinationPath = constructDestinationPathWithType(options, 'reducers', 'reducer', options.stateLevel);
    const classRelativePath = buildRelativePath(classDestinationPath, importFile);

    classDestinationPath = classDestinationPath + '.ts';

    return {
        importFile,
        classRelativePath,
        classDestinationPath,
        className
    }
}

function constructDestinationPathWithType(options: any, folder: string, extention: string, stateLevel: string) {
    return options.path + '/statemanagement/' + folder + '/' + stateLevel + '/' + dasherize(options.name) + '.' + extention;
}

function addToCombineReducer(options: any): Rule {
    return (host: Tree) => {
        const context = buildAddToStateLevelReducerContext(host, options);

        const source = readIntoSourceFile(host, context.destinationReducerPath);

        const changes = [
            createStateLevelReducerChange(host, context),
            insertImport(source, context.destinationReducerPath, context.reducerFunction, context.relativePath)
        ];

        return applyChanges(host, changes, context.destinationReducerPath);
    }
}

function addToStateLevelState(options: any): Rule {
    return (host: Tree) => {

        const context = createAddStateLevelChangesContext(host, options);

        const changes = buildAddStateLevelChangesContext(context, host, options);

        return applyChanges(host, changes, context.destinationStateFileName);
    }
}

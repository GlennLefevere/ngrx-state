import {Rule, Tree} from "@angular-devkit/schematics";
import {readIntoSourceFile} from "./find-file";
import {strings} from "@angular-devkit/core";
import {buildRelativePath} from "@schematics/angular/utility/find-module";
import {addImportToModule, insertImport} from "@schematics/angular/utility/ast-utils";
import {applyChanges} from "./change";

export function addImport(options: any, classToImport: string, path: string): Rule {
    return (host: Tree) => {
        if (!options.module) {
            return host;
        }
        const source = readIntoSourceFile(host, options.module);

        const dashedImportClass = strings.dasherize(classToImport);
        const index = dashedImportClass.lastIndexOf('-');

        const pathToCheck = (options.path || '')
            + path + dashedImportClass.substring(0, index) + '.' + dashedImportClass.substring(index + 1, dashedImportClass.length);

        const importPath = buildRelativePath(`//${options.module}`, pathToCheck);

        const declarationChanges = [insertImport(source, options.module, classToImport, importPath)];

        return applyChanges(host, declarationChanges, options.module);
    }
}

export function addNgrxImportsToNgModule(modulePath: string | undefined, importPath: string, name: string): Rule {
    return (host: Tree) => {
        if (!modulePath) {
            return host;
        }
        const source = readIntoSourceFile(host, modulePath);

        const declarationChanges = addImportToModule(source,
            modulePath,
            name,
            importPath);

        return applyChanges(host, declarationChanges, modulePath);
    };
}

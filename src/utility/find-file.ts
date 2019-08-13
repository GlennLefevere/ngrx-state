import {DirEntry, SchematicsException, Tree} from '@angular-devkit/schematics';
import {join, Path} from '@angular-devkit/core';
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";

export function findFile(host: Tree, generateDir: string, regex: RegExp): Path {
    let dir: DirEntry | null = host.getDir('/' + generateDir);

    let result = determineFilePath(dir, host, regex);

    if (result) {
        return result;
    }

    while (dir) {
        const matches = dir.subfiles.filter(p => regex.test(p));

        if (matches.length == 1) {
            return join(dir.path, matches[0]);
        } else if (matches.length > 1) {
            throw new SchematicsException('More than one root-reducer matches. Use skip-import option to skip importing '
                + 'the state into the closest root-reducer.');
        }

        dir = dir.parent;
    }

    throw new SchematicsException('Could not find an RootReducer. Use the skip-import '
        + 'option to skip importing in RootReducer.');
}

export function determineFilePath(dirEntry: DirEntry, host: Tree, moduleRe: RegExp): Path | undefined {
    let result;
    for (const entry of dirEntry.subdirs) {
        let dir: DirEntry | null = host.getDir(dirEntry.path + '/' + entry);
        const matches = dir.subfiles.filter(p => moduleRe.test(p));

        if (matches.length == 1) {
            result = matches[0];
        } else if (matches.length > 1) {
            throw new Error('More than one module matches. Use skip-import option to skip importing '
                + 'the component into the closest module.');
        } else {
            result = determineFilePath(dir, host, moduleRe);
        }
        if (result) {
            result = join(entry, result);
            break;
        }
    }
    return result;
}

export function readIntoSourceFile(host: Tree, modulePath: string): ts.SourceFile {
    const text = host.read(modulePath);
    if (text === null) {
        throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString('utf-8');

    return ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);
}

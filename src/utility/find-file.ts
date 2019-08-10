import {DirEntry, Tree} from '@angular-devkit/schematics';
import {join, Path} from '@angular-devkit/core';
import {determineFilePath} from './find-module';

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
            throw new Error('More than one root-reducer matches. Use skip-import option to skip importing '
                + 'the state into the closest root-reducer.');
        }

        dir = dir.parent;
    }

    throw new Error('Could not find an RootReducer. Use the skip-import '
        + 'option to skip importing in RootReducer.');
}

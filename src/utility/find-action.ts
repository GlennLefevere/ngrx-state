import {DirEntry, SchematicsException, Tree} from '@angular-devkit/schematics';
import {join, Path, PathFragment} from '@angular-devkit/core';
import {getSourceNodes} from '@schematics/angular/utility/ast-utils';
import {classify} from '@angular-devkit/core/src/utils/strings';
import {readIntoSourceFile} from './find-file';

export function findFileContainingType(host: Tree, typeName: string, path?: string): string {
    let dir: DirEntry | null = host.getDir('/' + path);

    let result = determineTypeFilePath(dir, host, typeName, path);

    if (result) {
        return path + '/' + result;
    }

    while (dir) {
        if (!dir.path.includes('app')) {
            break;
        }
        if (dir) {
            path = dir.path;
        }

        const matches = dir.subfiles.filter(p => testFileContent(host, p, typeName, path));

        if (matches.length == 0) {
            const res = test(host, typeName, dir, dir.subdirs, path);
            if (res.length > 0) {
                return res;
            }
        }

        if (matches.length == 1) {
            return join(dir.path, matches[0]);
        } else if (matches.length > 1) {
            throw new SchematicsException('More than one class matches ${className}. Use skip-import option to skip importing '
                + 'the state into the closest class.');
        }

        dir = dir.parent;
    }

    throw new SchematicsException(`Could not find class ${typeName}. Use the skip-import`
        + 'option to skip importing in RootReducer.');
}

function test(host: Tree, name: string, dir: DirEntry, subDirs: PathFragment[], path?: string): string {
    for (let subDir of subDirs) {
        let actualDir = dir.dir(subDir);
        if (actualDir) {
            path = actualDir.path;
        }
        const matches = actualDir.subfiles.filter(p => testFileContent(host, p, name, path));
        if (matches.length == 0) {
            const res = test(host, name, actualDir, actualDir.subdirs, path);
            if (res.length > 0) {
                return res;
            }
        }

        if (matches.length == 1) {
            return join(actualDir.path, matches[0]);
        }
    }
    return '';
}

function testFileContent(host: Tree, dir: Path, typeName: string, path?: string): boolean {
    let result = false;
    const sourceFile = readIntoSourceFile(host, path + '/' + dir);

    const nodes = getSourceNodes(sourceFile);

    if (nodes.find(n => n.getFullText().includes('export type ' + classify(typeName)))) {
        result = true;
    }

    return result;
}

function determineTypeFilePath(dirEntry: DirEntry, host: Tree, typeName: string, path?: string): Path | undefined {
    let result;
    for (const entry of dirEntry.subdirs) {
        let dir: DirEntry = host.getDir(dirEntry.path + '/' + entry);

        const matches = dir.subfiles.filter(p => testFileContent(host, p, typeName, dir.path));

        if (matches.length == 1) {
            result = matches[0];
        } else if (matches.length > 1) {
            throw new Error('More than one module matches. Use skip-import option to skip importing '
                + 'the component into the closest module.');
        } else {
            result = determineTypeFilePath(dir, host, typeName, path);
        }
        if (result) {
            result = join(entry, result);
            break;
        }
    }
    return result;
}

import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {experimental, JsonParseMode, parseJson} from '@angular-devkit/core';
import { Path, basename, dirname, normalize } from '@angular-devkit/core';

export type WorkspaceSchema = experimental.workspace.WorkspaceSchema;
export type WorkspaceProject = experimental.workspace.WorkspaceProject;

export function getWorkspacePath(host: Tree): string {
    const possibleFiles = [ '/angular.json', '/.angular.json' ];
    const path = possibleFiles.filter(path => host.exists(path))[0];

    return path;
}

export function getWorkspace(host: Tree): WorkspaceSchema {
    const path = getWorkspacePath(host);
    const configBuffer = host.read(path);
    if (configBuffer === null) {
        throw new SchematicsException(`Could not find (${path})`);
    }
    const content = configBuffer.toString();

    return parseJson(content, JsonParseMode.Loose) as {} as WorkspaceSchema;
}

/**
 * Build a default project path for generating.
 * @param project The project to build the path for.
 */
export function buildDefaultPath(project: WorkspaceProject): string {
    const root = project.sourceRoot
        ? `/${project.sourceRoot}/`
        : `/${project.root}/src/`;

    const projectDirName = project.projectType === 'application' ? 'app' : 'lib';

    return `${root}${projectDirName}`;
}

export interface Location {
    name: string;
    path: Path;
}

export function parseName(path: string, name: string): Location {
    const nameWithoutPath = basename(name as Path);
    const namePath = dirname((path + '/' + name) as Path);

    return {
        name: nameWithoutPath,
        path: normalize('/' + namePath),
    };
}
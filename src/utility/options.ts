import {getWorkspace} from '@schematics/angular/utility/config';
import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {buildDefaultPath} from '@schematics/angular/utility/project';
import {findModuleFromOptions, ModuleOptions} from '@schematics/angular/utility/find-module';
import {parseName} from '@schematics/angular/utility/parse-name';

export interface DefaultOptions extends ModuleOptions {
    project?: string;
}

export function enrichOptions<T extends DefaultOptions>(host: Tree, options: T): T {
    const workspace = getWorkspace(host);
    if (!options.project) {
        throw new SchematicsException('Option (project) is required.');
    }

    const project = workspace.projects[options.project];

    if (options.path === undefined) {
        options.path = buildDefaultPath(project);
    }

    options.module = findModuleFromOptions(host, options);

    const parsedPath = parseName(options.path, options.name);
    options.name = parsedPath.name;
    options.path = parsedPath.path;

    return options;
}

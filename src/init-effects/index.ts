import {chain, Rule, SchematicContext, SchematicsException, Tree} from "@angular-devkit/schematics";
import {getWorkspace} from "@schematics/angular/utility/config";
import {buildDefaultPath} from "@schematics/angular/utility/project";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {parseName} from "@schematics/angular/utility/parse-name";
import {strings} from "@angular-devkit/core";
import {addImport, addNgrxImportsToNgModule} from "../utility/import";
import {copyFiles} from "../utility/copy-files";

export default function(options: any): Rule {
    return (host: Tree, context: SchematicContext) => {
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

        const rootEffectsName = strings.classify(`${options.name}RootEffects`);
        const effectsName = `EffectsModule.forFeature(${rootEffectsName}),`;

        return chain([
            copyFiles(options, './files', parsedPath.path),
            addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
            addImport(options, rootEffectsName, '/statemanagement/effects/')
        ])(host, context);
    }
}

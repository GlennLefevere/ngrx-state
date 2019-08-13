import {chain, noop, Rule, schematic, SchematicContext, SchematicsException, Tree} from "@angular-devkit/schematics";
import {getWorkspace} from "@schematics/angular/utility/config";
import {buildDefaultPath} from "@schematics/angular/utility/project";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {parseName} from "@schematics/angular/utility/parse-name";
import {copyFiles} from "../utility/copy-files";
import {
    AddEffectsContext,
    buildAddEffectsChanges,
    createAddEffectsContext,
    findRootEffects
} from "../utility/find-effect";
import {applyChanges} from "../utility/change";

export default function(options: AddEffectSchematics): Rule {
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

        let rootEffectsExist = true;
        try {
            findRootEffects(host, options.path);
        } catch (e) {
            console.log('Since RootEffect is not found one will be created');
            rootEffectsExist = false;
        }

        return chain([
            rootEffectsExist ? noop() : schematic('init-effects', {
                name: options.name,
                path: options.path,
                project: options.project
            }),
            copyFiles(options, './files', parsedPath.path),
            addImportToRootState(options)
        ])(host, context);
    }
}

function addImportToRootState(options: AddEffectSchematics): Rule {
    return (host: Tree) => {
        const context: AddEffectsContext = createAddEffectsContext(host, options);

        const changes = buildAddEffectsChanges(host, context, options);

        return applyChanges(host, changes, options.path + '/' + context.rootEffectsName + '.ts');
    }
}

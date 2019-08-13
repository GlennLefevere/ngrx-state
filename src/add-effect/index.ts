import {chain, noop, Rule, schematic, SchematicContext, Tree} from "@angular-devkit/schematics";
import {copyFiles} from "../utility/copy-files";
import {
    AddEffectsContext,
    buildAddEffectsChanges,
    createAddEffectsContext,
    findRootEffects
} from "../utility/find-effect";
import {applyChanges} from "../utility/change";
import {enrichOptions} from '../utility/options';

export default function (options: AddEffectSchematics): Rule {
    return (host: Tree, context: SchematicContext) => {

        options = enrichOptions(host, options);

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
            copyFiles(options, './files', options.path),
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

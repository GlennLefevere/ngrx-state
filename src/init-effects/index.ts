import {chain, Rule, SchematicContext, Tree} from "@angular-devkit/schematics";
import {strings} from "@angular-devkit/core";
import {addImport, addNgrxImportsToNgModule} from "../utility/import";
import {copyFiles} from "../utility/copy-files";
import {enrichOptions} from '../utility/options';

export default function (options: any): Rule {
    return (host: Tree, context: SchematicContext) => {

        options = enrichOptions(host, options);

        const rootEffectsName = strings.classify(`${options.name}RootEffects`);
        const effectsName = `EffectsModule.forFeature(${rootEffectsName}),`;

        return chain([
            copyFiles(options, './files', options.path),
            addNgrxImportsToNgModule(options.module, '@ngrx/effects', effectsName),
            addImport(options, rootEffectsName, '/statemanagement/effects/')
        ])(host, context);
    }
}

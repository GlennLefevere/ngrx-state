import {apply, mergeWith, Rule, SchematicContext, template, Tree, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {functionIze} from '../utility/function-ize';

export function containerState(_options: any): Rule {
    // @ts-ignore
    return (tree: Tree, _context: SchematicContext) => {
        const sourceTemplates = url('./files');

        const sourceParameterizedTemplates = apply(
            sourceTemplates,
            [
                template({
                    ..._options,
                    ...strings,
                    functionIze
                })
            ]
        );
        return mergeWith(sourceParameterizedTemplates);
    };
}

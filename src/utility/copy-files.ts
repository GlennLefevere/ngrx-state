import {apply, mergeWith, move, Rule, template, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {functionIze} from './function-ize';

export function copyFiles(options: any, templatePath: string, parsedPath: string): Rule {
    return mergeWith(apply(
        url(templatePath),
        [
            template({
                ...options,
                ...strings,
                functionIze
            }),
            move(parsedPath)
        ],
    ));
}

import {apply, MergeStrategy, mergeWith, move, noop, Rule, template, url} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {concatAndFunctionIze, functionIze} from './function-ize';
import {concatAndCamelize} from './concat-and-camelize';
import {concatAndDasherize} from './concat-and-dasherize';
import {concatAndClassify} from './concat-and-classify';

export function copyFiles(options: any, templatePath: string, parsedPath: string | undefined): Rule {
    return mergeWith(apply(
        url(templatePath),
        [
            template({
                ...options,
                ...strings,
                functionIze,
                concatAndCamelize,
                concatAndFunctionIze,
                concatAndDasherize,
                concatAndClassify
            }),
            parsedPath ? move(parsedPath) : noop()
        ],
    ), MergeStrategy.Overwrite);
}

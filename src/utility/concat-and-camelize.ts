import {camelize, classify} from '@angular-devkit/core/src/utils/strings';

export function concatAndCamelize(value1: string, value2: string): string {
    return camelize(classify(value1) + classify(value2));
}

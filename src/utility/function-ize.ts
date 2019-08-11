import {camelize, classify} from '@angular-devkit/core/src/utils/strings';

export function functionIze(value: string): string {
    let result = camelize(value);
    return result.charAt(0).toLowerCase() + result.slice(1);
}

export function concatAndFunctionIze(value1: string, value2: string): string {
    let result = classify(value1) + classify(value2);
    return functionIze(result);
}

import {camelize} from '@angular-devkit/core/src/utils/strings';

export function functionIze(value: string): string {
    let result = camelize(value);
    return result.charAt(0).toLowerCase() + result.slice(1);
}
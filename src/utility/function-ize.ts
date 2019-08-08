import {camelize} from '@ngrx/store/schematics-core/utility/strings';

export function functionIze(value: string): string {
    let result = camelize(value);
    return result.charAt(0).toLowerCase() + result.slice(1);
}
import {classify, dasherize} from '@angular-devkit/core/src/utils/strings';

export function concatAndDasherize(value1: string, value2: string): string {
    let result = classify(value1) + classify(value2);
    return dasherize(result);
}

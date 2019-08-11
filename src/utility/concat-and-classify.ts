import {classify} from '@angular-devkit/core/src/utils/strings';

export function concatAndClassify(value1: string, value2: string): string {
    return classify(value1) + classify(value2);
}

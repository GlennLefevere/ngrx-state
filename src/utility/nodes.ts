import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {SchematicsException} from '@angular-devkit/schematics';

export function findPositionSyntaxLists(node: ts.Node): number {
    const syntaxList = node.getChildren().filter(n => n.kind === ts.SyntaxKind.SyntaxList);
    let position: number = 0;
    if (syntaxList.length > 0) {
        let result = syntaxList.sort((a, b) => (a.pos > b.pos) ? 1 : -1).map(n => n.pos);
        position = result[result.length - 1];
    } else if (syntaxList.length == 0) {
        position = node.pos;
    } else {
        throw new SchematicsException('ObjectLiteralExpression doesn\'t have children for some reason');
    }

    return position;
}

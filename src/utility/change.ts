import {Change, InsertChange} from "@schematics/angular/utility/change";
import {Tree} from "@angular-devkit/schematics";

export function applyChanges(host: Tree, changes: Change[], path: string): Tree {
    const declarationRecorder = host.beginUpdate(path);
    for (const change of changes) {
        if (change instanceof InsertChange) {
            declarationRecorder.insertLeft(change.pos, change.toAdd);
        }
    }
    host.commitUpdate(declarationRecorder);

    return host;
}

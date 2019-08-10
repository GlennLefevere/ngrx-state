import * as path from "path";
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {Style} from '@schematics/angular/application/schema';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('schematics', collectionPath);
let appTree: UnitTestTree;

const workspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
};

const appOptions = {
    name: 'bar',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: Style.Css,
    skipTests: false,
    skipPackageJson: false,
};

describe('ngrx-state', () => {
    beforeEach(async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'workspace',
            workspaceOptions
        ).toPromise();
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'application',
            appOptions,
            appTree
        ).toPromise();
        appTree = await runner.runSchematicAsync('state', {
            name: 'bar',
            data: true,
            container: false,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
    });


    xit('works', async () => {

    });
});

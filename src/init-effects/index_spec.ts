import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import * as path from 'path';
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

describe('init-effects', () => {
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
    });


    it('works', async () => {
        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: false,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        await runner.runSchematicAsync('init-effects', {
            name: 'bar',
            project: 'bar',
        }, appTree).toPromise();
    });

});

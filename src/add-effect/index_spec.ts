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

describe('add-effect', () => {
    beforeEach(async () => {
        console.log('\nadd-effect start');
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

    afterEach(() => {
        console.log('add-effect end\n');
    });

    xit('works with effects', async () => {
        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        await runner.runSchematicAsync('add-effect', {
            name: 'bar',
            project: 'bar',
        }, appTree).toPromise();
    });

    xit('works with multiple effects', async () => {
        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        appTree = await runner.runSchematicAsync('add-effect', {
            name: 'bar',
            project: 'bar',
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-effect', {
            name: 'fu',
            project: 'bar',
        }, appTree).toPromise();
    });


    // Disabled til init-effects is built
    xit('works without effects', async () => {
        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: false,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        await runner.runSchematicAsync('add-effect', {
            name: 'bar',
            project: 'bar',
        }, appTree).toPromise();

    });
});

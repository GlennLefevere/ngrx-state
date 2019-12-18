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

const classOptions = {
    name: 'bar',
    project: 'bar'
};

const classOptionsWithDir = {
    name: 'bar',
    project: 'bar',
    path: '/projects/bar/src/app/model'
};

describe('add-reducer', () => {
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


    it('works default', async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptions,
            appTree
        ).toPromise();

        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'bar',
            array: true,
            selector: false,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
    });

    it('works default with selector', async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptions,
            appTree
        ).toPromise();

        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'bar',
            array: true,
            selector: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
    });

    it('works with model in other dir', async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptionsWithDir,
            appTree
        ).toPromise();

        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'bar',
            array: true,
            selector: false,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
    });

    it('works with action type', async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptionsWithDir,
            appTree
        ).toPromise();

        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        appTree = await runner.runSchematicAsync('add-action', {
            name: 'bar',
            project: 'bar'
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'bar',
            array: true,
            selector: false,
            project: 'bar',
            actionType: 'BarActions',
            flat: true
        }, appTree).toPromise();
    });

    it('works with type any', async () => {
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptionsWithDir,
            appTree
        ).toPromise();

        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        appTree = await runner.runSchematicAsync('add-action', {
            name: 'bar',
            project: 'bar'
        }, appTree).toPromise();

        await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'any',
            array: true,
            selector: false,
            project: 'bar',
            actionType: 'BarActions',
            flat: true
        }, appTree).toPromise();
    })
});

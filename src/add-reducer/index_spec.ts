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
        appTree = await runner.runExternalSchematicAsync(
            '@schematics/angular',
            'class',
            classOptions,
            appTree
        ).toPromise();
    });


    it('works', async () => {
        appTree = await runner.runSchematicAsync('init-state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        const tree = await runner.runSchematicAsync('add-reducer', {
            name: 'bar',
            stateLevel: 'data',
            className: 'bar',
            array: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        console.log(tree.readContent('/projects/bar/src/app/statemanagement/reducers/data/bar-data.reducer.ts'));
        console.log(tree.readContent('/projects/bar/src/app/statemanagement/state/data/bar-data.state.ts',));
    });
});

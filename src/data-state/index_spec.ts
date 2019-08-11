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

describe('data-state', () => {
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


    it('works with container', async () => {
        appTree = await runner.runSchematicAsync('state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        const tree = await runner.runSchematicAsync('data-state', {
            name: 'bar',
            type: 'custom',
            project: 'bar',
            flat: true
        }, appTree).toPromise();

        // console.log(tree.files);
        console.log(tree.readContent('/projects/bar/src/app/statemanagement/selectors/custom/bar-custom.selectors.ts'));
    });


/*    it('works without data', async () => {
        appTree = await runner.runSchematicAsync('state', {
            name: 'bar',
            data: false,
            container: false,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        await runner.runSchematicAsync('data-state', {
            name: 'bar',
            type: 'data',
            project: 'bar',
            flat: true
        }, appTree).toPromise();

    });*/
});

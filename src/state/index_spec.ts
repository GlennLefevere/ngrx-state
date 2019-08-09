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
    });


    it('works', async () => {
        const tree = await runner.runSchematicAsync('state', {
            name: 'bar',
            data: true,
            container: true,
            effects: true,
            project: 'bar',
            flat: true
        }, appTree).toPromise();
        const moduleResult = 'import { BrowserModule } from \'@angular/platform-browser\';\n' +
            'import { NgModule } from \'@angular/core\';\n' +
            '\nimport { AppComponent } from \'./app.component\';\n' +
            'import { StoreModule } from \'@ngrx/store\';\n' +
            'import { barRootReducer } from \'./statemanagement/reducers/bar-root.reducer\';\n' +
            'import { EffectsModule } from \'@ngrx/effects\';\n' +
            'import { BarRootEffects } from \'./statemanagement/effects/bar-root.effects\';\n' +
            '\n' +
            '@NgModule({\n' +
            '  declarations: [\n' +
            '    AppComponent\n' +
            '  ],\n' +
            '  imports: [\n' +
            '    BrowserModule,\n' +
            '    StoreModule.forFeature(\'bar\', barRootReducer),\n' +
            '    EffectsModule.forFeature(BarRootEffects),\n' +
            '  ],\n' +
            '  providers: [],\n' +
            '  bootstrap: [AppComponent]\n' +
            '})\n' +
            'export class AppModule { }\n';

        const module = '/projects/bar/src/app/app.module.ts';

        const moduleContent = tree.readContent(module);

        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/reducers/bar-root.reducer.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/reducers/data/bar-data.reducer.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/reducers/container/bar-container.reducer.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/selectors/bar-root.selectors.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/selectors/data/bar-data.selectors.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/selectors/container/bar-container.selectors.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/state/bar-root.state.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/state/data/bar-data.state.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/state/container/bar-container.state.ts');
        expect(tree.files).toContain('/projects/bar/src/app/statemanagement/effects/bar-root.effects.ts');
        expect(moduleContent).toEqual(moduleResult);
    });
});

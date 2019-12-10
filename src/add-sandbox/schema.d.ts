/**
 * Add-sandbox Options Schema
 * Add sandbox to module
 */
declare interface AddSandboxSchematics {
    /**
     * The name
     */
    name: string;
    /**
     * The stateName
     */
    importRootState: boolean;
    /**
     * The path to create the component.
     */
    path?: string; // path
    /**
     * The name of the project.
     */
    project?: string;
    /**
     * The module to update
     */
    module?: string;
}

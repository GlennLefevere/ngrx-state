/**
 * Add-action Options Schema
 * Add action to module
 */
declare interface AddActionSchematics {
    /**
     * The name
     */
    name: string;
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

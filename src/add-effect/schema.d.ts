/**
 * Add-effect Options Schema
 * Add effect to module
 */
declare interface AddEffectSchematics {
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

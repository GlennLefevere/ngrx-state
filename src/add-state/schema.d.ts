/**
 * Add-state Options Schema
 * Adds state to existing state
 */
declare interface AddStateSchematics {
    /**
     * The name
     */
    name: string;
    /**
     * The state type
     */
    type: string;
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
    /**
     * The selectorName
     */
    selectorName?: string;
    /**
     * The state name
     */
    stateName?: string;
}

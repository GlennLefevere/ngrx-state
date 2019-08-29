/**
 * Add-reducer Options Schema
 * Add effect to module
 */
declare interface AddReducerSchematics {
    /**
     * The name
     */
    name: string;
    /**
     * The state level
     */
    stateLevel: string;
    /**
     * Is returned type
     */
    className: string;
    /**
     * Is return value array
     */
    array: boolean;
    /**
     * Action type
     */
    actionType?: string;
    /**
     * Add selector
     */
    selector?: boolean;
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

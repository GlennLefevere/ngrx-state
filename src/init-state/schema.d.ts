/**
 * Init-state Options Schema
 * Init state in module
 */
declare interface InitStateSchematics {
    /**
     * The name
     */
    name: string;
    /**
     * Add data state
     */
    data: boolean;
    /**
     * Add container state
     */
    container: boolean;
    /**
     * Add effects
     */
    effects: boolean;
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

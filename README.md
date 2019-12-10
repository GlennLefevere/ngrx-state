Ngrx-state functions
============================

##Schematics:
* [init-state](#using-init-state)
* [add-action](#using-add-action)
* [add-effect](#using-add-effect)
* [add-state](#using-add-state)
* [add-reducer](#using-add-reducer)
* [init-effects](#using-init-effects)
* [add-sandbox](#using-add-sandbox)

### Using init-state
Options:
>
>    name (The state name)  
>    data (Boolean that determines whether to add a data level to the state)  
>    container  (Boolean that determines whether to add a container level to the state)  
>    path (optional)  
>    project (optional)  
>    module (optional)  
>    

Created structure with all options true:

    .
    ├── ...
    ├── statemanagement
    │   ├── effects
    │   │       └── {name}-root.effects.ts
    │   ├── reducers
    │   │       │── container
    │   │       │    └── {name}-container.reducer.ts
    │   │       │── data
    │   │       │    └── {name}-data.reducer.ts
    │   │       └── {name}-root.reducer.ts
    │   ├── selectors
    │   │       │── container
    │   │       │    └── {name}-container.selectors.ts
    │   │       │── data
    │   │       │    └── {name}-data.selectors.ts
    │   │       └── {name}-root.selectors.ts
    │   └── state
    │         │── container
    │         │    └── {name}-container.state.ts
    │         │── data
    │         │    └── {name}-data.state.ts
    │         └── {name}-root.state.ts
    └── ...

The closest NgModule will then include imports of the ngrx modules StoreModule and if the effects option is checked the EffectsModule.

### Using add-action
Options:
>
>    name (The action name)    
>    path (optional)  
>    project (optional)  
>    module (optional)  

Created structure:

    .
    ├── ...
    ├── statemanagement
    │   └── actions
    │          └── {name}.actions.ts
    └── ...

### Using add-effect
Options:
>
>    name (The effect name)    
>    path (optional)  
>    project (optional)  
>    module (optional)  

Created structure:

    .
    ├── ...
    ├── statemanagement
    │   └── effects
    │          ├─── {name}.effects.ts
    │          └─── {name}-root.effects.ts      (This wil be created if it doesn't exist and the ngrx module will be added to the closest NgModule) 
    └── ...

### Using add-state
Options:
>
>    name (The state name)
>    type  (The type of state eg: container as seen in the init-state schematic)  
>    path (optional)  
>    project (optional)  
>    module (optional)
>    

Created structure with all options:

    .
    ├── ...
    ├── statemanagement
    │   ├── reducers
    │   │       └── {type}
    │   │             └── {name}-{type}.reducer.ts
    │   ├── selectors
    │   │       └── {type}
    │   │             └── {name}-{type}.selectors.ts
    │   └── state
    │         └── {type}
    │               └── {name}-{type}.state.ts
    └── ...
    
Next to creating these files this schematic also adjusts the correlating root-reducer & state.ts

### Using add-reducer
Options:
>
>    name (The reducer name)
>    stateLevel (The state level name eg in init-state with data checked then you could use data as a value)
>    className (The returned class of the reducer)
>    array (boolean to make the return value of the reducer an array and not a single class) 
>    type  (The type of state eg: container as seen in the init-state schematic)  
>    actionType (optional)
>    selector (optional) (boolean whether to add a selector)
>    path (optional)  
>    project (optional)  
>    module (optional)
>    

Created structure with all options:

    .
    ├── ...
    ├── statemanagement
    │   └── reducers
    │           └── {stateLevel}
    │                 └── {name}.reducer.ts
    └── ...    

Depending on the options the stateLevel state will be adjusted to the return value. The stateLevel reducer will also be adjusted accordingly.
If the selector option is true a selector will be added to the stateLevel selectors.

### Using init-effects
Options:
>
>    name (The effects name)  
>    path (optional)  
>    project (optional)  
>    module (optional)
>    

Created structure with all options:

    .
    ├── ...
    ├── statemanagement
    │   └── effects
    │          └─── {name}-root.effects.ts 
    └── ...
    
The ngrx effects module will be added as an import to the closest NgModule


### Using add-sandbox
Options:
>
>    name (The effects name)  
>    importRootState (add rootState to constructor)
>    path (optional)  
>    project (optional)  
>    module (optional)
>   

Created structure with all options:

    .
    ├── ...
    ├── sandbox
    │   └── {name}.sandbox.ts
    └── ...

Ngrx-state functions
============================
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

import {ActionReducer} from '@ngrx/store';

export const <%= functionIze(name) %>Reducer: ActionReducer<<%= classify(className) %><% if (array){%><%= '[]' %><% } %>> = (state = null, action: <%= classify(actionType) %>): <%= classify(className) %><% if (array){%><%= '[]' %><% } %> => {

    return state;
};

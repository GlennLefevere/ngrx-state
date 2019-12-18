import {ActionReducer} from '@ngrx/store';

export const <%= functionIze(name) %>Reducer: ActionReducer<<% if(className === 'any') {%>any<% } else {%><%= classify(className) %><% } %><% if (array){%><%= '[]' %><% } %>> = (state = null, action: <%= classify(actionType) %>): <% if(className === 'any') {%>any<% } else {%><%= classify(className) %><% } %><% if (array){%><%= '[]' %><% } %> => {

    return state;
};

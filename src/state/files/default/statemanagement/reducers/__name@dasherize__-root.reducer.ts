import {ActionReducerMap} from '@ngrx/store';
import {<%= classify(name) %>RootState} from '../state/<%= dasherize(name) %>-root.state';
<% if(data){ %>import {<%= functionIze(name) %>DataReducer} from './data/<%= dasherize(name) %>-data.reducer';<% } %>
<% if (container) {%>import {<%= functionIze(name) %>ContainerReducer} from './container/<%= dasherize(name) %>-container.reducer';<% } %>

export const <%= functionIze(name) %>RootReducer: ActionReducerMap<<%= classify(name) %>RootState> = {<% if (container) {%>
  container: <%= functionIze(name) %>ContainerReducer<%} if (container && data){  %>,<% } %><% if(data){ %>
  data: <%= functionIze(name) %>DataReducer<% } %>
};

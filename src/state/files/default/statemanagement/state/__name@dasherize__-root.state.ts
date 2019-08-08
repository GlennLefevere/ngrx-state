<% if(data){ %>import {<%= classify(name) %>DataState} from './data/<%= dasherize(name) %>-data.state';<% } %>
<% if (container) {%>import {<%= classify(name) %>ContainerState} from './container/<%= dasherize(name) %>-container.state';<% } %>

export interface <%= classify(name) %>RootState {<% if (container) {%>
  container: <%= classify(name) %>ContainerState<%} if (container && data){  %>,<% } %><% if(data){ %>
  data: <%= classify(name) %>DataState<% } %>
}
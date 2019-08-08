import {Action, combineReducers} from '@ngrx/store';
import {<%= classify(name) %>ContainerState, initial<%= classify(name) %>ContainerState} from '../../state/container/<%= dasherize(name) %>-container.state';

export function <%= functionIze(name) %>ContainerReducer(state: <%= classify(name) %>ContainerState, action: Action) {
  return combineReducers({
  }, initial<%= classify(name) %>ContainerState)(state, action);
}

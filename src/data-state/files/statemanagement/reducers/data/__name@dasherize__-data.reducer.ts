import {<%= classify(name) %>DataState, intitial<%= classify(name) %>DataState} from '../../state/data/<%= dasherize(name) %>-data.state';
import {Action, combineReducers} from '@ngrx/store';

export function <%= functionIze(name) %>DataReducer(state: <%= classify(name) %>DataState, action: Action) {
  return combineReducers({
    },
    intitial<%= classify(name) %>DataState)(state, action);
}

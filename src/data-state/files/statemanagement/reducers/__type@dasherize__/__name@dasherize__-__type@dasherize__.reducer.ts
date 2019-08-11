import {<%= concatAndClassify(name, type) %>State, intitial<%= concatAndClassify(name, type) %>State} from '../../state/<%= dasherize(type) %>/<%= concatAndDasherize(name, type) %>.state';
import {Action, combineReducers} from '@ngrx/store';

export function <%= concatAndFunctionIze(name, type) %>Reducer(state: <%= concatAndClassify(name, type) %>State, action: Action) {
  return combineReducers({
    },
    intitial<%= concatAndClassify(name, type) %>State)(state, action);
}

import {ActionReducerMap} from '@ngrx/store';
import {<%= classify(name) %>RootState} from '../state/<%= dasherize(name) %>-root.state';

export const <%= functionIze(name) %>RootReducer: ActionReducerMap<<%= classify(name) %>RootState> = {
};


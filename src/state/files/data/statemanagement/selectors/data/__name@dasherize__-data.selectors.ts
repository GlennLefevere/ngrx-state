import {createSelector} from '@ngrx/store';
import {get<%= classify(name) %>State} from '../<%= dasherize(name) %>-root.selectors';
import {<%= classify(name) %>RootState} from '../../state/<%= dasherize(name) %>-root.state';

export const select<%= classify(name) %>DataState = createSelector(
  get<%= classify(name) %>State,
  (state: <%= classify(name) %>RootState) => state.data
);
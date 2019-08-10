import {createSelector} from '@ngrx/store';

export const select<%= classify(name) %>DataState = createSelector(
  <%= selectorName %>,
  (state: <%= stateName %>) => state.data
);

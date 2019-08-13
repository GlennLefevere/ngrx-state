import {createSelector} from '@ngrx/store';

export const select<%= concatAndClassify(name, type) %>State = createSelector(
  <%= selectorName %>,
  (state: <%= stateName %>) => state.<%= type %>
);

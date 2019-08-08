import {createSelector} from '@ngrx/store';
import {getGroupState} from '../group-root.selectors';
import {__nameDasherize__RootState} from '../../state/group-root.state';

export const selectGroupContainerState = createSelector(
  getGroupState,
  (state: __nameDasherize__RootState) => state.container
);


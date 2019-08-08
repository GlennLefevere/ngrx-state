import {createFeatureSelector} from '@ngrx/store';
import {<%= classify(name) %>RootState} from '../state/<%= dasherize(name) %>-root.state';

export const get<%= classify(name) %>State = createFeatureSelector<<%= classify(name) %>RootState>('<%= dasherize(name) %>');

// ============================================
// Redux Store Configuration
// ============================================
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobReducer from './slices/jobSlice';
import applicationReducer from './slices/applicationSlice';
import notificationReducer from './slices/notificationSlice';
import employerReducer from './slices/employerSlice';
import adminReducer from './slices/adminSlice';
import messagesReducer from './slices/messagesSlice';

const rootReducer = {
  auth: authReducer,
  jobs: jobReducer,
  applications: applicationReducer,
  notifications: notificationReducer,
  employer: employerReducer,
  admin: adminReducer,
  messages: messagesReducer,
};

const appReducer = combineReducers(rootReducer);

const rootReducerWithReset = (state, action) => {
  if (action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const setupStore = () =>
  configureStore({
    reducer: rootReducerWithReset,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

export const store = setupStore();
export default store;

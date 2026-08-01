import { setupStore } from './store';
import { logout } from './slices/authSlice';

describe('logout state reset', () => {
  it('clears auth state and resets all slices when logout is fulfilled', async () => {
    const store = setupStore();

    // Seed the store with fake authenticated data
    store.dispatch({ type: 'auth/login/fulfilled', payload: { user: { id: '123', email: 'user@example.com' }, accessToken: 'abc123' } });
    store.dispatch({ type: 'jobs/fetchJobs/fulfilled', payload: { data: [{ id: 'job1', title: 'Test Job' }], pagination: null } });
    store.dispatch({ type: 'applications/fetchMy/fulfilled', payload: { data: [{ _id: 'app1', job: 'job1' }], pagination: null } });
    store.dispatch({ type: 'notifications/fetch/fulfilled', payload: { data: [{ _id: 'note1', message: 'Test' }] } });

    expect(store.getState().auth.user).toEqual({ id: '123', email: 'user@example.com' });
    expect(store.getState().jobs.jobs).toHaveLength(1);
    expect(store.getState().applications.applications).toHaveLength(1);
    expect(store.getState().notifications.notifications).toHaveLength(1);

    // Dispatch logout fulfilled to clear the store
    store.dispatch({ type: logout.fulfilled.type });

    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.jobs.jobs).toEqual([]);
    expect(state.applications.applications).toEqual([]);
    expect(state.notifications.notifications).toEqual([]);
  });
});

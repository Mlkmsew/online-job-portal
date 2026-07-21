// ============================================
// Application Slice - Redux Toolkit
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  applications: [],
  application: null,
  loading: false,
  error: null,
  pagination: null,
};

// Async Thunks
export const fetchMyApplications = createAsyncThunk('applications/fetchMy', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/applications/my', { params });
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load applications');
  }
});

export const fetchApplicationById = createAsyncThunk('applications/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/applications/${id}`);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load application');
  }
});

export const withdrawApplication = createAsyncThunk('applications/withdraw', async (id, { rejectWithValue }) => {
  try {
    const response = await api.put(`/applications/${id}/withdraw`);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Applications
      .addCase(fetchMyApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data;
        const applications = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        state.applications = applications;
        state.pagination = payload?.pagination || null;
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Application By ID
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        const payload = action.payload?.data;
        state.application = payload?.data || payload || null;
      })
      // Withdraw Application
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app._id === action.meta.arg);
        if (index !== -1) {
          state.applications[index].status = 'withdrawn';
        }
      });
  },
});

export const { clearError } = applicationSlice.actions;
export default applicationSlice.reducer;

// ============================================
// Job Slice - Redux Toolkit
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  jobs: [],
  job: null,
  loading: false,
  error: null,
  pagination: null,
  filters: {
    search: '',
    category: '',
    location: '',
    jobType: '',
    workMode: '',
    experienceLevel: '',
  },
};

// Async Thunks
export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (filters = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/jobs', { params: filters });
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const fetchJobById = createAsyncThunk('jobs/fetchJobById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/jobs/${id}`);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const applyForJob = createAsyncThunk('jobs/applyForJob', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/applications', data);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const bookmarkJob = createAsyncThunk('jobs/bookmarkJob', async (jobId, { rejectWithValue }) => {
  try {
    const response = await api.post('/bookmarks', { job: jobId });
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const removeBookmark = createAsyncThunk('jobs/removeBookmark', async (bookmarkId, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/bookmarks/${bookmarkId}`);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Job By ID
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.job = action.payload.data;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearError } = jobSlice.actions;
export default jobSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  company: null,
  jobs: [],
  applications: [],
  dashboardStats: null,
  loading: false,
  error: null,
  pagination: null,
};

const isNotFoundError = (error) => error?.response?.status === 404;

export const fetchEmployerDashboard = createAsyncThunk(
  'employer/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [companyResult, jobsResult, applicationsResult, dashboardStatsResult] = await Promise.allSettled([
        api.get('/companies/my/company'),
        api.get('/jobs/my/posted'),
        api.get('/applications/employer'),
        api.get('/employer/dashboard'),
      ]);

      const company = companyResult.status === 'fulfilled' ? companyResult.value.data.data : null;
      const jobs = jobsResult.status === 'fulfilled' ? (jobsResult.value.data.data || jobsResult.value.data || []) : [];
      const applications = applicationsResult.status === 'fulfilled'
        ? (applicationsResult.value.data.data || applicationsResult.value.data || [])
        : [];
      const dashboardStats = dashboardStatsResult.status === 'fulfilled'
        ? (dashboardStatsResult.value.data.data || dashboardStatsResult.value.data || null)
        : null;

      return {
        company,
        jobs,
        applications,
        dashboardStats,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load employer dashboard');
    }
  }
);

export const fetchEmployerCompany = createAsyncThunk(
  'employer/fetchCompany',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/companies/my/company');
      return response.data.data;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load company profile');
    }
  }
);

export const fetchEmployerJobs = createAsyncThunk(
  'employer/fetchJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs/my/posted');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load jobs');
    }
  }
);

export const fetchEmployerApplications = createAsyncThunk(
  'employer/fetchApplications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/applications/employer', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load applications');
    }
  }
);

const employerSlice = createSlice({
  name: 'employer',
  initialState,
  reducers: {
    clearEmployerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.company = action.payload.company;
        state.jobs = action.payload.jobs || [];
        state.applications = action.payload.applications || [];
        state.dashboardStats = action.payload.dashboardStats || null;
      })
      .addCase(fetchEmployerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployerCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployerCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.company = action.payload;
      })
      .addCase(fetchEmployerCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployerJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployerJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEmployerJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployerApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployerApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEmployerApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployerError } = employerSlice.actions;
export default employerSlice.reducer;

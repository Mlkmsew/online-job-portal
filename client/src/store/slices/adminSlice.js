import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  stats: null,
  users: [],
  companies: [],
  categories: [],
  loading: false,
  error: null,
  pagination: null,
};

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load admin stats');
  }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load users');
  }
});

export const fetchAdminCompanies = createAsyncThunk('admin/fetchCompanies', async (filters = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/companies', { params: filters });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load companies');
  }
});

export const fetchAdminCategories = createAsyncThunk('admin/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/admin/categories');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load categories');
  }
});

export const toggleUserSuspension = createAsyncThunk('admin/toggleUserSuspension', async (userId, { rejectWithValue }) => {
  try {
    const response = await api.put(`/admin/users/${userId}/suspend`);
    return { userId, message: response.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user');
  }
});

export const approveCompany = createAsyncThunk('admin/approveCompany', async (companyId, { rejectWithValue }) => {
  try {
    const response = await api.put(`/admin/companies/${companyId}/approve`);
    return { companyId, message: response.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to approve company');
  }
});

export const rejectCompany = createAsyncThunk('admin/rejectCompany', async ({ companyId, reason }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/admin/companies/${companyId}/reject`, { reason });
    return { companyId, message: response.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to reject company');
  }
});

export const verifyCompany = createAsyncThunk('admin/verifyCompany', async (companyId, { rejectWithValue }) => {
  try {
    const response = await api.put(`/admin/companies/${companyId}/verify`);
    return { companyId, message: response.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to verify company');
  }
});

export const createCategory = createAsyncThunk('admin/createCategory', async (category, { rejectWithValue }) => {
  try {
    const response = await api.post('/admin/categories', category);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create category');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload.data || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || [];
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleUserSuspension.fulfilled, (state, action) => {
        const index = state.users.findIndex((user) => user._id === action.payload.userId);
        if (index !== -1) {
          state.users[index].isSuspended = !state.users[index].isSuspended;
        }
      })
      .addCase(approveCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex((company) => company._id === action.payload.companyId);
        if (index !== -1) {
          state.companies[index].isApproved = true;
          state.companies[index].isActive = true;
        }
      })
      .addCase(rejectCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex((company) => company._id === action.payload.companyId);
        if (index !== -1) {
          state.companies[index].isApproved = false;
          state.companies[index].isActive = false;
        }
      })
      .addCase(verifyCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex((company) => company._id === action.payload.companyId);
        if (index !== -1) {
          state.companies[index].isVerified = !state.companies[index].isVerified;
        }
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.unshift(action.payload);
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;

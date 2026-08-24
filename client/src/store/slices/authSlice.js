// ============================================
// Auth Slice - Redux Toolkit
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import authService from '../../services/authService';

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('ethiojob_resumes');
  sessionStorage.clear();
};

const normalizeRole = (role) => (typeof role === 'string' ? role.toLowerCase().trim() : role);
const normalizeUser = (user) => {
  if (!user) return null;
  return { ...user, role: normalizeRole(user.role) };
};

const getSafeUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      return normalizeUser(JSON.parse(storedUser));
    }
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    localStorage.removeItem('user');
  }
  return null;
};

const initialState = {
  user: localStorage.getItem('token') ? getSafeUser() : null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Async Thunks
export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message || 'Login failed');
  }
});

export const googleLogin = createAsyncThunk('auth/googleLogin', async ({ idToken }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Google login failed');
  }
});

export const initializeAuth = createAsyncThunk('auth/initializeAuth', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    clearAuthStorage();
    return { user: null, token: null };
  }

  try {
    const currentUser = await authService.getMe();
    return { user: currentUser, token };
  } catch (error) {
    clearAuthStorage();
    return rejectWithValue(error.response?.data?.message || error.message || 'Authentication initialization failed');
  }
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await api.put('/auth/update-profile', data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const uploadCV = createAsyncThunk('auth/uploadCV', async (formData, { rejectWithValue }) => {
  try {
    const response = await api.put('/auth/upload-cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const uploadAvatar = createAsyncThunk('auth/uploadAvatar', async (formData, { rejectWithValue }) => {
  try {
    const response = await api.put('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteAvatar = createAsyncThunk('auth/deleteAvatar', async (_, { rejectWithValue }) => {
  try {
    const response = await api.delete('/auth/upload-avatar');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteCV = createAsyncThunk('auth/deleteCV', async (_, { rejectWithValue }) => {
  try {
    const response = await api.delete('/auth/upload-cv');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const updateSettings = createAsyncThunk('auth/updateSettings', async (settingsPayload, { rejectWithValue }) => {
  try {
    const response = await api.put('/auth/update-settings', { settings: settingsPayload });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
  }
});

export const updatePassword = createAsyncThunk('auth/updatePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    const response = await api.put('/auth/update-password', { currentPassword, newPassword });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update password');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout', {}, { skipAuthRedirect: true });
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    setUser: (state, action) => {
      state.user = { ...(state.user || {}), ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      clearAuthStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = Boolean(action.payload.user && action.payload.token);
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload.data);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload.data);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      // Upload CV
      .addCase(uploadCV.fulfilled, (state, action) => {
        if (action.payload?.data) {
          state.user = normalizeUser(action.payload.data);
        } else {
          state.user = normalizeUser({ ...(state.user || {}), cv: action.payload?.cv });
        }
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      // Upload / Delete Avatar
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        // If backend returns full user data object, use it; otherwise merge avatar field
        if (action.payload?.data) {
          state.user = normalizeUser(action.payload.data);
        } else {
          state.user = normalizeUser({ ...(state.user || {}), avatar: action.payload.avatar });
        }
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(deleteAvatar.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload.data);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(deleteCV.fulfilled, (state, action) => {
        state.user = normalizeUser(action.payload.data);
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      // Update Settings
      .addCase(updateSettings.fulfilled, (state, action) => {
        if (state.user) {
          state.user = normalizeUser({
            ...state.user,
            settings: action.payload.data,
          });
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        clearAuthStorage();
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        clearAuthStorage();
      });
  },
});

export const { clearError, setCredentials, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;

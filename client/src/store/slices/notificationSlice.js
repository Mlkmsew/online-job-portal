// ============================================
// Notification Slice - Redux Toolkit
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingUnread: false,
  error: null,
  pagination: null,
};

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications', { params });
      return { data: response.data.data || [], pagination: response.data.pagination || null };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load notifications');
    }
  }
);

export const getUnreadCount = createAsyncThunk('notifications/unreadCount', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/notifications/unread/count');
    return response.data.count || 0;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to load unread count');
  }
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try {
    await api.put(`/notifications/${id}/read`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark as read');
  }
});

export const markAllAsRead = createAsyncThunk('notifications/markAllAsRead', async (_, { rejectWithValue }) => {
  try {
    await api.put('/notifications/read-all');
    return true;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark all as read');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const incoming = action.payload;
      if (!incoming || !incoming._id) return;
      const exists = state.notifications.some((n) => n._id === incoming._id);
      if (!exists) {
        state.notifications.unshift(incoming);
        state.notifications = state.notifications.slice(0, 50);
      }
      if (!incoming.isRead) {
        state.unreadCount += 1;
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, Number(action.payload) || 0);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUnreadCount.pending, (state) => {
        state.loadingUnread = true;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.loadingUnread = false;
        state.unreadCount = Math.max(0, Number(action.payload) || 0);
      })
      .addCase(getUnreadCount.rejected, (state) => {
        state.loadingUnread = false;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n._id === action.payload);
        if (notification) {
          if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, setUnreadCount, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;

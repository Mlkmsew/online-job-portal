// ============================================
// Messages Slice - global unread count + online users
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  unreadCount: 0,
  onlineUsers: [],
  loading: false,
};

export const fetchUnreadCount = createAsyncThunk('messages/unreadCount', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/messages/unread/count');
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload ?? 0;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = Array.isArray(action.payload) ? action.payload : [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadCount = action.payload.count || 0;
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUnreadCount, setOnlineUsers } = messagesSlice.actions;
export default messagesSlice.reducer;

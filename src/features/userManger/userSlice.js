import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch users from API with search and sort parameters
export const getUsersContent = createAsyncThunk(
  'user/getUsersContent',
  async ({ name, page = 0, size = 10, sortField = 'id', sortOrder = 'asc' }, { rejectWithValue }) => {
    try {
      const sortOrderSymbol = sortOrder === 'asc' ? `+${sortField}` : `-${sortField}`;
      const response = await fetch(`http://localhost:8080/api/v1/user?name=${name}&page=${page}&size=${size}&sort=${sortOrderSymbol}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users.');
      }

      const data = await response.json();
      return {
        users: data.data.data,
        totalPages: data.data.totalPages || 1,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Ban user
export const banUser = createAsyncThunk(
  'user/banUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/user/ban/${userId}`, {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to ban user.');
      }

      const data = await response.json();
      return data.message;  // Trả về thông điệp từ server
    } catch (error) {
      return rejectWithValue(error.message);  // Trả về lỗi nếu có
    }
  }
);

// Unban user
export const unbanUser = createAsyncThunk(
  'user/unbanUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/user/unban/${userId}`, {
        method: 'PATCH',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unban user.');
      }

      const data = await response.json();
      return data.message;  // Trả về thông điệp từ server
    } catch (error) {
      return rejectWithValue(error.message);  // Trả về lỗi nếu có
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    totalPages: 1,
    error: null,
    status: 'idle',
    banStatus: '',
    unbanStatus: '',
  },
  reducers: {
    // Reset ban/unban status
    resetBanUnbanStatus: (state) => {
      state.banStatus = '';
      state.unbanStatus = '';
    },
    // Set users directly (useful after ban/unban to immediately update the state)
    setUsers: (state, action) => {
      state.users = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUsersContent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getUsersContent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload.users;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getUsersContent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(banUser.fulfilled, (state, action) => {
        state.banStatus = action.payload;
        state.users = state.users.map(user =>
          user.id === action.meta.arg ? { ...user, isBanned: true } : user
        );
      })
      .addCase(unbanUser.fulfilled, (state, action) => {
        state.unbanStatus = action.payload;
        state.users = state.users.map(user =>
          user.id === action.meta.arg ? { ...user, isBanned: false } : user
        );
      })
      .addCase(banUser.rejected, (state, action) => {
        state.banStatus = `Error: ${action.payload}`;
      })
      .addCase(unbanUser.rejected, (state, action) => {
        state.unbanStatus = `Error: ${action.payload}`;
      });
  },
});

export const { resetBanUnbanStatus, setUsers } = userSlice.actions;

export default userSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch users from API
export const getUsersContent = createAsyncThunk(
  'user/getUsersContent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user?page=0&size=10', {
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
      return data.data.data;  // Truy xuất đúng dữ liệu mảng người dùng
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    error: null,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUsersContent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getUsersContent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;  // Lưu mảng người dùng vào state
      })
      .addCase(getUsersContent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;

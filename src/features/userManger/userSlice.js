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
      return data.data.data;  // Trả về mảng người dùng
    } catch (error) {
      return rejectWithValue(error.message);  // Trả về lỗi nếu có
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
        state.users = action.payload;
      })
      .addCase(getUsersContent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;

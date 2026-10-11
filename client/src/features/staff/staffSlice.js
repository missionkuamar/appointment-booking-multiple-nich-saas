import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyStaff = createAsyncThunk(
  "staff/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/staff");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const addStaff = createAsyncThunk(
  "staff/add",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/staff", payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/staff/${id}`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const deleteStaff = createAsyncThunk(
  "staff/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/staff/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const initialState = {
  list: [],
  loading: false,
  error: null,
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMyStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addStaff.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      .addCase(updateStaff.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
      });
  },
});

export default staffSlice.reducer;
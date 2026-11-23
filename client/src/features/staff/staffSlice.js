import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyStaff = createAsyncThunk(
  "staff/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/staff", { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch staff"
      );
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
      return rejectWithValue(
        err.response?.data?.message || "Failed to add staff"
      );
    }
  }
);

export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    // console.log("[updateStaff] Request started:", { id, payload });
    try {
      const { data } = await api.patch(`/staff/${id}`, payload);
      // console.log("[updateStaff] Success response:", data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to update staff";
      console.error("[updateStaff] Failed:", {
        id,
        status: err.response?.status,
        message: errorMessage,
        error: err,
      });
      return rejectWithValue(errorMessage);
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
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete staff"
      );
    }
  }
);

const initialState = {
  list: [],
  availableTitles: [],
  pagination: {
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  },
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
        state.error = null;
      })
      .addCase(fetchMyStaff.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.list = action.payload;
        } else {
          state.list = action.payload?.data || [];
          state.availableTitles = action.payload?.availableTitles || [];
          if (action.payload?.pagination) {
            state.pagination = action.payload.pagination;
          }
        }
      })
      .addCase(fetchMyStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateStaff.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
        state.pagination.total = Math.max(state.pagination.total - 1, 0);
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default staffSlice.reducer;
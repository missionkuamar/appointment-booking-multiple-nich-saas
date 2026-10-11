import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Generate slots
export const generateSlots = createAsyncThunk(
  "slot/generate",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/slots/generate", payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Get my slots
export const fetchMySlots = createAsyncThunk(
  "slot/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/slots/my");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Clear slots
export const clearSlots = createAsyncThunk(
  "slot/clear",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/slots/clear");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const initialState = {
  slots: [],
  grouped: {},
  loading: false,
  error: null,
};

const slotSlice = createSlice({
  name: "slot",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(generateSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSlots.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMySlots.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMySlots.fulfilled, (state, action) => {
        state.loading = false;
        state.slots = action.payload.slots;
        state.grouped = action.payload.grouped;
      })
      .addCase(fetchMySlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(clearSlots.fulfilled, (state) => {
        state.slots = [];
        state.grouped = {};
      });
  },
});

export default slotSlice.reducer;
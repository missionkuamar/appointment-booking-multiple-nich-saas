import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Generate slots
export const generateSlots = createAsyncThunk(
  "slot/generate",
  async (payload, { rejectWithValue }) => {
    // console.log("📡 [Thunk: generateSlots] POST /slots/generate | Payload:", payload);
    try {
      const { data } = await api.post("/slots/generate", payload);
      // console.log("✅ [Thunk: generateSlots] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: generateSlots] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to generate slots");
    }
  }
);

// Get my slots (doctorId query param support ke saath)
export const fetchMySlots = createAsyncThunk(
  "slot/fetchMy",
  async (params = {}, { rejectWithValue }) => {
    // console.log("📡 [Thunk: fetchMySlots] GET /slots/my | Params:", params);
    try {
      const { data } = await api.get("/slots/my", { params });
      // console.log("✅ [Thunk: fetchMySlots] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: fetchMySlots] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to fetch slots");
    }
  }
);

// Clear slots (doctorId query param support ke saath)
export const clearSlots = createAsyncThunk(
  "slot/clear",
  async (params = {}, { rejectWithValue }) => {
    // console.log("📡 [Thunk: clearSlots] DELETE /slots/clear | Params:", params);
    try {
      const { data } = await api.delete("/slots/clear", { params });
      // console.log("✅ [Thunk: clearSlots] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: clearSlots] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to clear slots");
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
        // console.log("⏳ [Slice: slot] generateSlots.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSlots.fulfilled, (state, action) => {
        // console.log("🟢 [Slice: slot] generateSlots.fulfilled:", action.payload);
        state.loading = false;
      })
      .addCase(generateSlots.rejected, (state, action) => {
        console.error("🔴 [Slice: slot] generateSlots.rejected:", action.payload);
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMySlots.pending, (state) => {
        // console.log("⏳ [Slice: slot] fetchMySlots.pending");
        state.loading = true;
      })
      .addCase(fetchMySlots.fulfilled, (state, action) => {
        // console.log("🟢 [Slice: slot] fetchMySlots.fulfilled:", action.payload);
        state.loading = false;
        state.slots = action.payload?.slots || [];
        state.grouped = action.payload?.grouped || {};
      })
      .addCase(fetchMySlots.rejected, (state, action) => {
        console.error("🔴 [Slice: slot] fetchMySlots.rejected:", action.payload);
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(clearSlots.fulfilled, (state, action) => {
        // console.log("🟢 [Slice: slot] clearSlots.fulfilled:", action.payload);
        state.slots = [];
        state.grouped = {};
      })
      .addCase(clearSlots.rejected, (state, action) => {
        console.error("🔴 [Slice: slot] clearSlots.rejected:", action.payload);
        state.error = action.payload;
      });
  },
});

export default slotSlice.reducer;
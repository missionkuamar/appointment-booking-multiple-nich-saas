import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyAppointments = createAsyncThunk(
  "appointment/fetchMy",
  async ({ status = "all", staffId } = {}, { rejectWithValue }) => {
    try {
      let url = `/appointments/my?status=${status}`;
      if (staffId) url += `&staffId=${staffId}`;
      const { data } = await api.get(url);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const fetchStats = createAsyncThunk(
  "appointment/stats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/appointments/stats");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const updateAppointment = createAsyncThunk(
  "appointment/update",
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/appointments/${id}`, {
        status,
        notes,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const initialState = {
  list: [],
  stats: null,
  loading: false,
  statsLoading: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: "appointment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state) => {
        state.statsLoading = false;
      })

      .addCase(updateAppointment.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default appointmentSlice.reducer;
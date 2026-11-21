import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyAppointments = createAsyncThunk(
  "appointment/fetchMy",
  async ({ status = "all", doctorId, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ status, page, limit });
      if (doctorId) params.append("doctorId", doctorId);
      
      const { data } = await api.get(`/appointments/my?${params}`);
      return data; 
      // Returns: { data: [...], pagination: { page, limit, total, totalPages } }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// fetchStats mein range add karo
export const fetchStats = createAsyncThunk(
  "appointment/stats",
  async (range = "7", { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/appointments/stats?range=${range}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

export const updateAppointment = createAsyncThunk(
  "appointment/update",
  async ({ id, status, notes }, { rejectWithValue }) => {
    console.log("[AppointmentSlice][updateAppointment] request:", {
      url: `/appointments/${id}`,
      id,
      status,
      notes,
    });

    try {
      const { data } = await api.patch(`/appointments/${id}`, {
        status,
        notes,
      });

      console.log("[AppointmentSlice][updateAppointment] success response:", data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed";

      console.error("[AppointmentSlice][updateAppointment] error:", {
        id,
        status: err.response?.status,
        message: errorMessage,
        responseData: err.response?.data,
      });

      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  list: [],
   pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
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
      .addCase(fetchMyAppointments.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchMyAppointments.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.data;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchMyAppointments.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
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
// src/features/admin/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// 1. Fetch Users (with search, page, role)
export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async ({ search = "", role = "all", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/users", {
        params: { search, role, page, limit },
      });
      return res.data; // { users, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load users");
    }
  }
);

// 2. Add New User
export const addUser = createAsyncThunk(
  "admin/addUser",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/users", payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create user");
    }
  }
);

// 3. Toggle Status
export const toggleUserStatus = createAsyncThunk(
  "admin/toggleStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/users/${id}`, { isActive });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);

// 4. Delete User
export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete user");
    }
  }
);

// Fetch Businesses
export const fetchAdminBusinesses = createAsyncThunk(
  "admin/fetchBusinesses",
  async ({ search = "", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/businesses", {
        params: { search, page, limit },
      });
      return res.data; // { businesses, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load businesses");
    }
  }
);

export const fetchAdminDoctors = createAsyncThunk(
  "admin/fetchDoctors",
  async ({ search = "", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/doctors", {
        params: { search, page, limit },
      });
      return res.data; // { doctors, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load doctors");
    }
  }
);

export const deleteDoctorById = createAsyncThunk(
  "admin/deleteDoctor",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/doctors/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete doctor");
    }
  }
);

export const toggleDoctorActiveStatus = createAsyncThunk(
  "admin/toggleDoctorStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/doctors/${id}`, { isActive });
      return res.data.doctor;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);



// Delete Business
export const deleteBusinessById = createAsyncThunk(
  "admin/deleteBusiness",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/businesses/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete");
    }
  }
);


// 🔴 APPOINTMENTS THUNKS
export const fetchAdminAppointments = createAsyncThunk(
  "admin/fetchAppointments",
  async ({ search = "", status = "all", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/appointments", {
        params: { search, status, page, limit },
      });
      return res.data; // { appointments, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load appointments");
    }
  }
);

export const deleteAppointmentById = createAsyncThunk(
  "admin/deleteAppointment",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/appointments/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete appointment");
    }
  }
);

export const updateAppointmentStatusById = createAsyncThunk(
  "admin/updateAppointmentStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/appointments/${id}`, { status });
      return res.data.appointment;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);


// 🔴 SLOTS THUNKS
export const fetchAdminSlots = createAsyncThunk(
  "admin/fetchSlots",
  async ({ search = "", doctorId = "", status = "all", page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/slots", {
        params: { search, doctorId, status, page, limit },
      });
      return res.data; // { slots, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load slots");
    }
  }
);

export const deleteSlotById = createAsyncThunk(
  "admin/deleteSlot",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/slots/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete slot");
    }
  }
);

export const clearUnbookedSlots = createAsyncThunk(
  "admin/clearSlots",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.delete("/admin/slots/bulk/clear");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to clear slots");
    }
  }
);

// 🔴 HOLIDAYS THUNKS
export const fetchAdminHolidays = createAsyncThunk(
  "admin/fetchHolidays",
  async ({ search = "", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/holidays", {
        params: { search, page, limit },
      });
      return res.data; // { holidays, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load holidays");
    }
  }
);

export const addHoliday = createAsyncThunk(
  "admin/addHoliday",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/admin/holidays", payload);
      return res.data.holiday;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create holiday");
    }
  }
);

export const deleteHolidayById = createAsyncThunk(
  "admin/deleteHoliday",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/holidays/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete holiday");
    }
  }
);

// 🔴 SUBSCRIPTIONS THUNKS
export const fetchAdminSubscriptions = createAsyncThunk(
  "admin/fetchSubscriptions",
  async ({ search = "", plan = "all", status = "all", page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/subscriptions", {
        params: { search, plan, status, page, limit },
      });
      return res.data; // { subscriptions, pagination }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load subscriptions");
    }
  }
);

export const fetchSubscriptionStats = createAsyncThunk(
  "admin/fetchSubStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/admin/subscriptions/stats");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load stats");
    }
  }
);

export const updateSubscriptionStatusById = createAsyncThunk(
  "admin/updateSubStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/subscriptions/${id}`, { status });
      return res.data.subscription;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);




const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    pagination: { page: 1, limit: 10, 
        userPagination: { page: 1, totalPages: 0 },
        total: 0, totalPages: 0 },

        businesses: [],
    businessPagination: { page: 1, totalPages: 0, total: 0 },
    businessLoading: false,

     doctors: [],
    doctorPagination: { page: 1, totalPages: 0, total: 0 },
    doctorLoading: false,

// 🔴 Appointments State
    appointments: [],
    appointmentPagination: { page: 1, totalPages: 0, total: 0 },
    appointmentLoading: false,

    // 🔴 Slots State
    slots: [],
    slotPagination: { page: 1, totalPages: 0, total: 0 },
    slotLoading: false,

    // 🔴 Holidays State
    holidays: [],
    holidayPagination: { page: 1, totalPages: 0, total: 0 },
    holidayLoading: false,

    // 🔴 Subscriptions State
    subscriptions: [],
    subscriptionPagination: { page: 1, totalPages: 0, total: 0 },
    subscriptionStats: null,
    subscriptionLoading: false,


    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchAdminUsers.pending, (s) => { s.loading = true; })
      .addCase(fetchAdminUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.users = a.payload.users;
        s.pagination = a.payload.pagination;
      })
      .addCase(fetchAdminUsers.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
      })
      // Add User
      .addCase(addUser.fulfilled, (s, a) => {
        s.users.unshift(a.payload); // Add top
      })
      // Toggle Status
      .addCase(toggleUserStatus.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx].isActive = a.payload.isActive;
      })
      // Delete User
      .addCase(deleteAdminUser.fulfilled, (s, a) => {
        s.users = s.users.filter((u) => u._id !== a.payload);
      })
      .addCase(fetchAdminBusinesses.pending, (s) => { s.businessLoading = true; })
      .addCase(fetchAdminBusinesses.fulfilled, (s, a) => {
        s.businessLoading = false;
        s.businesses = a.payload.businesses;
        s.businessPagination = a.payload.pagination;
      })
      .addCase(fetchAdminBusinesses.rejected, (s, a) => {
        s.businessLoading = false;
        s.error = a.payload;
      })
      .addCase(deleteBusinessById.fulfilled, (s, a) => {
        s.businesses = s.businesses.filter((b) => b._id !== a.payload);
      })
      // 🔴 DOCTORS REDUCERS
      .addCase(fetchAdminDoctors.pending, (s) => { s.doctorLoading = true; })
      .addCase(fetchAdminDoctors.fulfilled, (s, a) => {
        s.doctorLoading = false;
        s.doctors = a.payload.doctors;
        s.doctorPagination = a.payload.pagination;
      })
      .addCase(fetchAdminDoctors.rejected, (s, a) => {
        s.doctorLoading = false;
        s.error = a.payload;
      })
      .addCase(deleteDoctorById.fulfilled, (s, a) => {
        s.doctors = s.doctors.filter((d) => d._id !== a.payload);
      })
      .addCase(toggleDoctorActiveStatus.fulfilled, (s, a) => {
        const idx = s.doctors.findIndex((d) => d._id === a.payload._id);
        if (idx !== -1) s.doctors[idx].isActive = a.payload.isActive;
      })
      // 🔴 APPOINTMENTS REDUCERS
      .addCase(fetchAdminAppointments.pending, (s) => { s.appointmentLoading = true; })
      .addCase(fetchAdminAppointments.fulfilled, (s, a) => {
        s.appointmentLoading = false;
        s.appointments = a.payload.appointments;
        s.appointmentPagination = a.payload.pagination;
      })
      .addCase(fetchAdminAppointments.rejected, (s, a) => {
        s.appointmentLoading = false;
        s.error = a.payload;
      })
      .addCase(deleteAppointmentById.fulfilled, (s, a) => {
        s.appointments = s.appointments.filter((appt) => appt._id !== a.payload);
      })
      .addCase(updateAppointmentStatusById.fulfilled, (s, a) => {
        const idx = s.appointments.findIndex((appt) => appt._id === a.payload._id);
        if (idx !== -1) s.appointments[idx] = a.payload;
      })
      // 🔴 SLOTS REDUCERS
      .addCase(fetchAdminSlots.pending, (s) => { s.slotLoading = true; })
      .addCase(fetchAdminSlots.fulfilled, (s, a) => {
        s.slotLoading = false;
        s.slots = a.payload.slots;
        s.slotPagination = a.payload.pagination;
      })
      .addCase(fetchAdminSlots.rejected, (s, a) => {
        s.slotLoading = false;
        s.error = a.payload;
      })
      .addCase(deleteSlotById.fulfilled, (s, a) => {
        s.slots = s.slots.filter((slot) => slot._id !== a.payload);
      })
      
      .addCase(fetchAdminHolidays.pending, (s) => { s.holidayLoading = true; })
      .addCase(fetchAdminHolidays.fulfilled, (s, a) => {
        s.holidayLoading = false;
        s.holidays = a.payload.holidays;
        s.holidayPagination = a.payload.pagination;
      })
      .addCase(fetchAdminHolidays.rejected, (s, a) => {
        s.holidayLoading = false;
        s.error = a.payload;
      })
      .addCase(addHoliday.fulfilled, (s, a) => {
        s.holidays.unshift(a.payload); // Add to top
      })
      .addCase(deleteHolidayById.fulfilled, (s, a) => {
        s.holidays = s.holidays.filter((h) => h._id !== a.payload);
      })
      .addCase(fetchAdminSubscriptions.pending, (s) => { s.subscriptionLoading = true; })
      .addCase(fetchAdminSubscriptions.fulfilled, (s, a) => {
        s.subscriptionLoading = false;
        s.subscriptions = a.payload.subscriptions;
        s.subscriptionPagination = a.payload.pagination;
      })
      .addCase(fetchAdminSubscriptions.rejected, (s, a) => {
        s.subscriptionLoading = false;
        s.error = a.payload;
      })
      .addCase(fetchSubscriptionStats.fulfilled, (s, a) => {
        s.subscriptionStats = a.payload;
      })
      .addCase(updateSubscriptionStatusById.fulfilled, (s, a) => {
        const idx = s.subscriptions.findIndex((sub) => sub._id === a.payload._id);
        if (idx !== -1) s.subscriptions[idx] = a.payload;
      });
  },
});

export default adminSlice.reducer;
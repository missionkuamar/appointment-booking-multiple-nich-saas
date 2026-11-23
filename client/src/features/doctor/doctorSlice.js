import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyDoctors = createAsyncThunk(
  "doctor/fetch",
  async (_, { rejectWithValue }) => {
    // console.log("📡 [Thunk: fetchMyDoctors] Calling GET /doctors...");
    try {
      const { data } = await api.get("/doctors");
      // console.log("✅ [Thunk: fetchMyDoctors] API Response Data:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: fetchMyDoctors] API Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to fetch doctors");
    }
  }
);

export const addDoctor = createAsyncThunk(
  "doctor/add",
  async (payload, { rejectWithValue }) => {
    // console.log("📡 [Thunk: addDoctor] Calling POST /doctors with payload:", payload);
    try {
      const { data } = await api.post("/doctors", payload);
      // console.log("✅ [Thunk: addDoctor] API Response Data:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: addDoctor] API Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to add doctor");
    }
  }
);

export const updateDoctor = createAsyncThunk(
  "doctor/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    // console.log(`📡 [Thunk: updateDoctor] Calling PATCH /doctors/${id} with:`, payload);
    try {
      const { data } = await api.patch(`/doctors/${id}`, payload);
      // console.log("✅ [Thunk: updateDoctor] API Response Data:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: updateDoctor] API Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to update doctor");
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  "doctor/delete",
  async (id, { rejectWithValue }) => {
    // console.log(`📡 [Thunk: deleteDoctor] Calling DELETE /doctors/${id}...`);
    try {
      const res = await api.delete(`/doctors/${id}`);
      // console.log("✅ [Thunk: deleteDoctor] Deleted ID:", id, "Response:", res.data);
      return id;
    } catch (err) {
      console.error("❌ [Thunk: deleteDoctor] API Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to delete doctor");
    }
  }
);

const initialState = { list: [], loading: false, error: null };

const doctorSlice = createSlice({
  name: "doctor",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH DOCTORS
      .addCase(fetchMyDoctors.pending, (s) => {
        // console.log("⏳ [Slice] fetchMyDoctors.pending");
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchMyDoctors.fulfilled, (s, a) => {
        // console.log("🟢 [Slice] fetchMyDoctors.fulfilled | Payload:", a.payload);
        s.loading = false;
        // Agar backend { doctors: [...] } bhej raha hai to a.payload.doctors use karein
        s.list = Array.isArray(a.payload) ? a.payload : a.payload?.doctors || [];
        // console.log("📦 [Slice] Updated s.list:", JSON.parse(JSON.stringify(s.list)));
      })
      .addCase(fetchMyDoctors.rejected, (s, a) => {
        console.error("🔴 [Slice] fetchMyDoctors.rejected | Error:", a.payload);
        s.loading = false;
        s.error = a.payload;
      })

      // ADD DOCTOR
      .addCase(addDoctor.pending, (s) => {
        // console.log("⏳ [Slice] addDoctor.pending");
        s.loading = true;
        s.error = null;
      })
      .addCase(addDoctor.fulfilled, (s, a) => {
        // console.log("🟢 [Slice] addDoctor.fulfilled | Payload:", a.payload);
        s.loading = false;
        // Agar backend { doctor: {...} } bhej raha hai to a.payload.doctor handle hoga
        const newDoc = a.payload?.doctor || a.payload;
        if (newDoc && typeof newDoc === "object") {
          s.list.unshift(newDoc);
        }
        // console.log("📦 [Slice] List after add:", JSON.parse(JSON.stringify(s.list)));
      })
      .addCase(addDoctor.rejected, (s, a) => {
        console.error("🔴 [Slice] addDoctor.rejected | Error:", a.payload);
        s.loading = false;
        s.error = a.payload;
      })

      // UPDATE DOCTOR
      .addCase(updateDoctor.fulfilled, (s, a) => {
        // console.log("🟢 [Slice] updateDoctor.fulfilled | Payload:", a.payload);
        const updatedDoc = a.payload?.doctor || a.payload;
        const i = s.list.findIndex((d) => d._id === updatedDoc._id);
        // console.log("🔍 [Slice] Found index for update:", i);
        if (i !== -1) s.list[i] = updatedDoc;
      })
      .addCase(updateDoctor.rejected, (s, a) => {
        console.error("🔴 [Slice] updateDoctor.rejected | Error:", a.payload);
        s.error = a.payload;
      })

      // DELETE DOCTOR
      .addCase(deleteDoctor.fulfilled, (s, a) => {
        // console.log("🟢 [Slice] deleteDoctor.fulfilled | Removed ID:", a.payload);
        s.list = s.list.filter((d) => d._id !== a.payload);
        // console.log("📦 [Slice] List after delete:", JSON.parse(JSON.stringify(s.list)));
      })
      .addCase(deleteDoctor.rejected, (s, a) => {
        console.error("🔴 [Slice] deleteDoctor.rejected | Error:", a.payload);
        s.error = a.payload;
      });
  },
});

export default doctorSlice.reducer;
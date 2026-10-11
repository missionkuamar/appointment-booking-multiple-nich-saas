import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch my business
export const fetchMyBusiness = createAsyncThunk(
  "business/fetchMyBusiness",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/business/me");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "No business");
    }
  }
);

// Onboarding (create/update business)
export const saveBusiness = createAsyncThunk(
  "business/saveBusiness",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/business/onboarding", formData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

const initialState = {
  data: null,
  loading: false,
  error: null,
  fetched: false,
};

const businessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    clearBusiness: (state) => {
      state.data = null;
      state.fetched = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBusiness.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.fetched = true;
      })
      .addCase(fetchMyBusiness.rejected, (state) => {
        state.loading = false;
        state.data = null;
        state.fetched = true;
      })

      .addCase(saveBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.fetched = true;
      })
      .addCase(saveBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBusiness } = businessSlice.actions;
export default businessSlice.reducer;
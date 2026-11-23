import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchPlans = createAsyncThunk(
  "subscription/fetchPlans",
  async (_, { rejectWithValue }) => {
    // console.log("📡 [Thunk: fetchPlans] GET /plans");
    try {
      const { data } = await api.get("/plans");
      // console.log("✅ [Thunk: fetchPlans] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: fetchPlans] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to fetch plans");
    }
  }
);

export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchStatus",
  async (_, { rejectWithValue }) => {
    // console.log("📡 [Thunk: fetchSubscriptionStatus] GET /subscriptions/status");
    try {
      const { data } = await api.get("/subscriptions/status");
      // console.log("✅ [Thunk: fetchSubscriptionStatus] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: fetchSubscriptionStatus] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to fetch status");
    }
  }
);

export const createSubscription = createAsyncThunk(
  "subscription/create",
  async (planName, { rejectWithValue }) => {
    // console.log("📡 [Thunk: createSubscription] POST /subscriptions/create | planName:", planName);
    try {
      const { data } = await api.post("/subscriptions/create", { planName });
      // console.log("✅ [Thunk: createSubscription] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: createSubscription] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Failed to create subscription");
    }
  }
);

export const verifyPayment = createAsyncThunk(
  "subscription/verify",
  async (payload, { rejectWithValue }) => {
    // console.log("📡 [Thunk: verifyPayment] POST /subscriptions/verify | Payload:", payload);
    try {
      const { data } = await api.post("/subscriptions/verify", payload);
      // console.log("✅ [Thunk: verifyPayment] Response:", data);
      return data;
    } catch (err) {
      console.error("❌ [Thunk: verifyPayment] Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data?.message || "Payment verification failed");
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    plans: [],
    plan: null,
    status: null,
    features: [],
    startDate: null,
    endDate: null,
    subscriptionId: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (s) => {
        // console.log("⏳ [Slice: subscription] fetchPlans.pending");
        s.loading = true;
      })
      .addCase(fetchPlans.fulfilled, (s, a) => {
        // console.log("🟢 [Slice: subscription] fetchPlans.fulfilled:", a.payload);
        s.loading = false;
        s.plans = Array.isArray(a.payload) ? a.payload : a.payload?.plans || [];
      })
      .addCase(fetchPlans.rejected, (s, a) => {
        console.error("🔴 [Slice: subscription] fetchPlans.rejected:", a.payload);
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(fetchSubscriptionStatus.pending, (s) => {
        // console.log("⏳ [Slice: subscription] fetchSubscriptionStatus.pending");
        s.loading = true;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (s, a) => {
        // console.log("🟢 [Slice: subscription] fetchSubscriptionStatus.fulfilled:", a.payload);
        s.loading = false;
        s.plan = a.payload?.plan;
        s.status = a.payload?.status;
        s.features = a.payload?.features || [];
        s.startDate = a.payload?.startDate;
        s.endDate = a.payload?.endDate;
        s.subscriptionId = a.payload?.subscriptionId;
      })
      .addCase(fetchSubscriptionStatus.rejected, (s, a) => {
        console.error("🔴 [Slice: subscription] fetchSubscriptionStatus.rejected:", a.payload);
        s.loading = false;
        s.error = a.payload;
      })
      .addCase(createSubscription.pending, (s) => {
        // console.log("⏳ [Slice: subscription] createSubscription.pending");
        s.loading = true;
      })
      .addCase(createSubscription.fulfilled, (s) => {
        // console.log("🟢 [Slice: subscription] createSubscription.fulfilled");
        s.loading = false;
      })
      .addCase(createSubscription.rejected, (s, a) => {
        console.error("🔴 [Slice: subscription] createSubscription.rejected:", a.payload);
        s.loading = false;
        s.error = a.payload;
      });
  },
});

export default subscriptionSlice.reducer;
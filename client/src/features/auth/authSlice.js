import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ---------- Async Thunks ----------

// Register
export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password, ref = "" }, { rejectWithValue }) => {
    try {
      const affiliateRef = ref || localStorage.getItem("affiliateRef") || "";
      // console.log("[authSlice:registerUser] Sending POST /auth/register:", {
      //   name,
      //   email,
      //   ref: affiliateRef,
      // });

      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        ref: affiliateRef,
      });
      // console.log("[authSlice:registerUser] Response received:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);
        // console.log("[authSlice:registerUser] Token saved to localStorage");
      } else {
        console.warn("[authSlice:registerUser] No token in response data");
      }

      return data;
    } catch (err) {
      console.error("[authSlice:registerUser] Error:", err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password, ref = "" }, { rejectWithValue }) => {
    try {
      const affiliateRef = ref || localStorage.getItem("affiliateRef") || "";
      // console.log("[authSlice:loginUser] Sending POST /auth/login:", {
      //   email,
      //   ref: affiliateRef,
      // });

      const { data } = await api.post("/auth/login", {
        email,
        password,
        ref: affiliateRef,
      });
      // console.log("[authSlice:loginUser] Response received:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);
        // console.log("[authSlice:loginUser] Token saved to localStorage");
      } else {
        console.warn("[authSlice:loginUser] No token in response data");
      }

      return data;
    } catch (err) {
      console.error("[authSlice:loginUser] Error:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// Get current user (on app load)
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      // console.log("[authSlice:fetchMe] Sending GET /auth/me");
      const { data } = await api.get("/auth/me");
      // console.log("[authSlice:fetchMe] Response received:", data);
      return data.user || data;
    } catch (err) {
      console.warn("[authSlice:fetchMe] Failed -> clearing token:", err.response?.data || err.message);
      localStorage.removeItem("token");
      return rejectWithValue(err.response?.data?.message || "Not authorized");
    }
  }
);

// ---------- Slice ----------

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  initialized: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // console.log("[authSlice:logout] Clearing token, affiliateRef, and auth state");
      localStorage.removeItem("token");
      localStorage.removeItem("affiliateRef");
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      // console.log("[authSlice:clearError] Clearing auth error");
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        // console.log("[authSlice] registerUser.pending");
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user || action.payload;
        state.token = action.payload?.token || localStorage.getItem("token");
        state.initialized = true;
        // console.log("[authSlice] registerUser.fulfilled -> user:", state.user?._id || state.user?.id || state.user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.warn("[authSlice] registerUser.rejected -> error:", action.payload);
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        // console.log("[authSlice] loginUser.pending");
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user || action.payload;
        state.token = action.payload?.token || localStorage.getItem("token");
        state.initialized = true;
        // console.log("[authSlice] loginUser.fulfilled -> user:", state.user?._id || state.user?.id || state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.warn("[authSlice] loginUser.rejected -> error:", action.payload);
      })

      // Fetch Me
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        // console.log("[authSlice] fetchMe.pending");
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user || action.payload;
        state.initialized = true;
        // console.log("[authSlice] fetchMe.fulfilled -> user:", state.user?._id || state.user?.id || state.user);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.initialized = true;
        console.warn("[authSlice] fetchMe.rejected -> payload:", action.payload);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
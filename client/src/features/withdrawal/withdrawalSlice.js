import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const DEFAULT_WITHDRAWAL_PAGINATION = {
  page: 1,
  limit: 5,
  total: 0,
  pages: 0,
};

export const DEFAULT_WITHDRAWAL_FILTERS = {
  status: "",
  startDate: "",
  endDate: "",
  search: "",
  paymentMethod: "",
};

// 1. Fetch Earnings from Affiliate Dashboard
export const fetchWithdrawalEarnings = createAsyncThunk(
  "withdrawal/fetchEarnings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/affiliate/dashboard");
      const totalEarnings = response?.data?.data?.stats?.totalEarnings;
      return Number(totalEarnings) || 0;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load earnings"
      );
    }
  }
);

// 2. Fetch Withdrawal Stats
export const fetchWithdrawalStats = createAsyncThunk(
  "withdrawal/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/affiliate/withdrawals/stats");
      return response?.data?.data || null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load withdrawal stats"
      );
    }
  }
);

// 3. Fetch Paginated & Filtered Withdrawals
export const fetchWithdrawalsList = createAsyncThunk(
  "withdrawal/fetchList",
  async (overrideArgs = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().withdrawal;
      const page = overrideArgs.page ?? state.pagination.page;
      const limit = overrideArgs.limit ?? state.pagination.limit;
      const activeFilters = overrideArgs.filters ?? state.filters;

      const params = { page, limit };
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.paymentMethod) {
        params.paymentMethod = activeFilters.paymentMethod;
      }
      if (activeFilters.search?.trim()) {
        params.search = activeFilters.search.trim();
      }
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;

      const response = await api.get("/affiliate/withdrawals", { params });

      if (!response?.data?.success) {
        return rejectWithValue(
          response?.data?.message || "Failed to load withdrawals"
        );
      }

      const data = response?.data?.data || {};
      return {
        withdrawals: Array.isArray(data.withdrawals) ? data.withdrawals : [],
        stats: data.stats || null,
        pagination: {
          ...(data.pagination || {}),
          page: data.pagination?.page ?? page,
          limit: data.pagination?.limit ?? limit,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load withdrawals"
      );
    }
  }
);

// 4. Refresh Withdrawals + Stats + Earnings Together
export const refreshAllWithdrawalData = createAsyncThunk(
  "withdrawal/refreshAll",
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchWithdrawalsList()),
      dispatch(fetchWithdrawalStats()),
      dispatch(fetchWithdrawalEarnings()),
    ]);
  }
);

// 5. Request Withdrawal
export const requestWithdrawal = createAsyncThunk(
  "withdrawal/request",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post("/affiliate/withdraw", payload);

      if (!response?.data?.success) {
        return rejectWithValue(
          response?.data?.message || "Failed to request withdrawal"
        );
      }

      await dispatch(refreshAllWithdrawalData());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to request withdrawal"
      );
    }
  }
);

// 6. Cancel Withdrawal
export const cancelWithdrawalRequest = createAsyncThunk(
  "withdrawal/cancel",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/affiliate/withdraw/${id}/cancel`);

      if (!response?.data?.success) {
        return rejectWithValue(
          response?.data?.message || "Failed to cancel withdrawal"
        );
      }

      await dispatch(refreshAllWithdrawalData());
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to cancel withdrawal"
      );
    }
  }
);

const initialState = {
  withdrawals: [],
  stats: null,
  withdrawStats: null,
  earnings: 0,
  pagination: DEFAULT_WITHDRAWAL_PAGINATION,
  filters: DEFAULT_WITHDRAWAL_FILTERS,
  loading: true,
  withdrawLoading: false,
  error: null,
};

const withdrawalSlice = createSlice({
  name: "withdrawal",
  initialState,
  reducers: {
    setWithdrawalFilters: (state, action) => {
      const next = action.payload || {};
      state.filters = {
        status: next.status || "",
        startDate: next.startDate || "",
        endDate: next.endDate || "",
        search: next.search || "",
        paymentMethod: next.paymentMethod || "",
      };
      state.pagination.page = 1;
    },
    setWithdrawalPage: (state, action) => {
      const page = Number(action.payload);
      if (Number.isFinite(page) && page >= 1) {
        state.pagination.page = page;
      }
    },
    setWithdrawalLimit: (state, action) => {
      const limit = Number(action.payload);
      if (Number.isFinite(limit) && limit > 0) {
        state.pagination.limit = limit;
        state.pagination.page = 1;
      }
    },
    resetWithdrawalState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchWithdrawalsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawalsList.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.withdrawals;
        state.stats = action.payload.stats;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })
      .addCase(fetchWithdrawalsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Stats
      .addCase(fetchWithdrawalStats.fulfilled, (state, action) => {
        state.withdrawStats = action.payload;
      })

      // Fetch Earnings
      .addCase(fetchWithdrawalEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload;
      })

      // Request Withdrawal
      .addCase(requestWithdrawal.pending, (state) => {
        state.withdrawLoading = true;
      })
      .addCase(requestWithdrawal.fulfilled, (state) => {
        state.withdrawLoading = false;
      })
      .addCase(requestWithdrawal.rejected, (state) => {
        state.withdrawLoading = false;
      });
  },
});

export const {
  setWithdrawalFilters,
  setWithdrawalPage,
  setWithdrawalLimit,
  resetWithdrawalState,
} = withdrawalSlice.actions;

export default withdrawalSlice.reducer;
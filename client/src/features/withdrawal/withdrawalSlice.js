import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const DEFAULT_WITHDRAWAL_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 1,
};

// 1. Fetch Available Earnings
export const fetchWithdrawalEarnings = createAsyncThunk(
  "withdrawal/fetchEarnings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/affiliate/dashboard");
      const totalEarnings = response?.data?.data?.stats?.totalEarnings;
      return Number(totalEarnings) || 0;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load earnings"
      );
    }
  }
);

// 2. Fetch Paginated Withdrawals (Always 10 per page)
export const fetchWithdrawalsList = createAsyncThunk(
  "withdrawal/fetchList",
  async ({ page = 1, status = "" } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;

      const response = await api.get("/affiliate/withdrawals", { params });

      if (!response?.data?.success) {
        return rejectWithValue(
          response?.data?.message || "Failed to load withdrawals"
        );
      }

      const data = response?.data?.data || {};
      const pag = data.pagination || {};

      return {
        withdrawals: Array.isArray(data.withdrawals) ? data.withdrawals : [],
        pagination: {
          page: Number(pag.page) || page,
          limit: 10,
          total: Number(pag.total) || 0,
          pages: Number(pag.pages) || 1,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load withdrawals"
      );
    }
  }
);

// 3. Request Withdrawal
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
      await Promise.all([
        dispatch(fetchWithdrawalsList({ page: 1 })),
        dispatch(fetchWithdrawalEarnings()),
      ]);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to request withdrawal"
      );
    }
  }
);

// 4. Cancel Withdrawal
export const cancelWithdrawalRequest = createAsyncThunk(
  "withdrawal/cancel",
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await api.post(`/affiliate/withdraw/${id}/cancel`);
      if (!response?.data?.success) {
        return rejectWithValue(
          response?.data?.message || "Failed to cancel withdrawal"
        );
      }
      const { page } = getState().withdrawal.pagination;
      await Promise.all([
        dispatch(fetchWithdrawalsList({ page })),
        dispatch(fetchWithdrawalEarnings()),
      ]);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to cancel withdrawal"
      );
    }
  }
);

const initialState = {
  withdrawals: [],
  earnings: 0,
  pagination: DEFAULT_WITHDRAWAL_PAGINATION,
  statusFilter: "",
  loading: false,
  withdrawLoading: false,
};

const withdrawalSlice = createSlice({
  name: "withdrawal",
  initialState,
  reducers: {
    setWithdrawalPage: (state, action) => {
      const page = Number(action.payload);
      if (Number.isFinite(page) && page >= 1) {
        state.pagination.page = page;
      }
    },
    setWithdrawalStatusFilter: (state, action) => {
      state.statusFilter = action.payload || "";
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWithdrawalsList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWithdrawalsList.fulfilled, (state, action) => {
        state.loading = false;
        state.withdrawals = action.payload.withdrawals;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWithdrawalsList.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchWithdrawalEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload;
      })
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

export const { setWithdrawalPage, setWithdrawalStatusFilter } =
  withdrawalSlice.actions;

export default withdrawalSlice.reducer;
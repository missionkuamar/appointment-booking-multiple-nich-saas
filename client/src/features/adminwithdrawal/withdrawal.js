import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ============================================================
// ✅ ASYNC THUNKS (Admin Withdrawals API)
// ============================================================

// Fetch all withdrawals (admin)
export const fetchWithdrawals = createAsyncThunk(
  "withdrawals/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:fetchWithdrawals] params:", params);
      const response = await api.get("/admin/withdrawals", { params });
      console.log("[withdrawalSlice:fetchWithdrawals] response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[withdrawalSlice:fetchWithdrawals] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch withdrawals"
      );
    }
  }
);

// Fetch single withdrawal (admin)
export const fetchWithdrawalById = createAsyncThunk(
  "withdrawals/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:fetchWithdrawalById] id:", id);
      const response = await api.get(`/admin/withdrawals/${id}`);
      console.log("[withdrawalSlice:fetchWithdrawalById] response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[withdrawalSlice:fetchWithdrawalById] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch withdrawal"
      );
    }
  }
);

// Approve withdrawal (admin)
export const approveWithdrawal = createAsyncThunk(
  "withdrawals/approve",
  async ({ id, notes }, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:approveWithdrawal] payload:", { id, notes });
      const response = await api.patch(`/admin/withdrawals/${id}/approve`, {
        notes,
      });
      console.log("[withdrawalSlice:approveWithdrawal] response:", response.data);
      return { id, data: response.data };
    } catch (error) {
      console.error(
        "[withdrawalSlice:approveWithdrawal] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to approve withdrawal"
      );
    }
  }
);

// Complete withdrawal (admin)
export const completeWithdrawal = createAsyncThunk(
  "withdrawals/complete",
  async ({ id, transactionId, notes }, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:completeWithdrawal] payload:", {
        id,
        transactionId,
        notes,
      });
      const response = await api.patch(`/admin/withdrawals/${id}/complete`, {
        transactionId,
        notes,
      });
      console.log("[withdrawalSlice:completeWithdrawal] response:", response.data);
      return { id, data: response.data };
    } catch (error) {
      console.error(
        "[withdrawalSlice:completeWithdrawal] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to complete withdrawal"
      );
    }
  }
);

// Reject withdrawal (admin)
export const rejectWithdrawal = createAsyncThunk(
  "withdrawals/reject",
  async ({ id, notes }, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:rejectWithdrawal] payload:", { id, notes });
      const response = await api.patch(`/admin/withdrawals/${id}/reject`, {
        notes,
      });
      console.log("[withdrawalSlice:rejectWithdrawal] response:", response.data);
      return { id, data: response.data };
    } catch (error) {
      console.error(
        "[withdrawalSlice:rejectWithdrawal] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to reject withdrawal"
      );
    }
  }
);

// Cancel withdrawal (admin)
export const cancelWithdrawal = createAsyncThunk(
  "withdrawals/cancel",
  async (id, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:cancelWithdrawal] id:", id);
      const response = await api.patch(`/admin/withdrawals/${id}/cancel`);
      console.log("[withdrawalSlice:cancelWithdrawal] response:", response.data);
      return { id, data: response.data };
    } catch (error) {
      console.error(
        "[withdrawalSlice:cancelWithdrawal] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to cancel withdrawal"
      );
    }
  }
);

// Bulk process withdrawals (admin)
export const bulkProcessWithdrawals = createAsyncThunk(
  "withdrawals/bulkProcess",
  async ({ withdrawalIds, status, notes }, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:bulkProcessWithdrawals] payload:", {
        withdrawalIds,
        status,
        notes,
      });
      const response = await api.post("/admin/withdrawals/bulk-process", {
        withdrawalIds,
        status,
        notes,
      });
      console.log(
        "[withdrawalSlice:bulkProcessWithdrawals] response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[withdrawalSlice:bulkProcessWithdrawals] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to process withdrawals"
      );
    }
  }
);

// Get withdrawal stats (admin)
export const fetchWithdrawalStats = createAsyncThunk(
  "withdrawals/fetchStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:fetchWithdrawalStats] params:", params);
      const response = await api.get("/admin/withdrawals/stats", { params });
      console.log(
        "[withdrawalSlice:fetchWithdrawalStats] response:",
        response.data
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error(
        "[withdrawalSlice:fetchWithdrawalStats] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch stats"
      );
    }
  }
);

// Export withdrawals (admin)
export const exportWithdrawals = createAsyncThunk(
  "withdrawals/export",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("[withdrawalSlice:exportWithdrawals] params:", params);
      const response = await api.get("/admin/withdrawals/export", {
        params,
        responseType: "blob",
      });
      console.log("[withdrawalSlice:exportWithdrawals] blob received:", {
        size: response.data?.size,
        type: response.data?.type,
      });
      return response.data;
    } catch (error) {
      console.error(
        "[withdrawalSlice:exportWithdrawals] error:",
        error?.response?.data || error?.message
      );
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to export withdrawals"
      );
    }
  }
);

// ============================================================
// ✅ INITIAL STATE
// ============================================================

const initialState = {
  withdrawals: [],
  selectedWithdrawal: null,
  withdrawalHistory: [],
  stats: {
    breakdown: [],
    pendingCount: 0,
    pendingTotal: 0,
    completedCount: 0,
    completedTotal: 0,
    failedCount: 0,
    failedTotal: 0,
    approvedCount: 0,
    approvedTotal: 0,
    totalRequests: 0,
    totalWithdrawn: 0,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  },
  loading: false,
  processing: false,
  error: null,
  exportLoading: false,
  totalWithdrawals: 0,
  lastFetched: null,
};

// Helper to extract updated withdrawal object safely
const extractUpdatedWithdrawal = (payloadData) => {
  if (!payloadData) return null;
  return payloadData.data || payloadData.withdrawal || payloadData;
};

// ============================================================
// ✅ SLICE
// ============================================================

const withdrawalSlice = createSlice({
  name: "withdrawals",
  initialState,
  reducers: {
    clearWithdrawalError: (state) => {
      state.error = null;
    },
    resetWithdrawalState: (state) => {
      state.selectedWithdrawal = null;
      state.error = null;
      state.loading = false;
      state.processing = false;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearWithdrawals: (state) => {
      state.withdrawals = [];
      state.totalWithdrawals = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ALL
      .addCase(fetchWithdrawals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawals.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload || {};
        state.withdrawals = payload.withdrawals || [];
        state.stats = { ...initialState.stats, ...(payload.stats || {}) };
        state.pagination = {
          ...initialState.pagination,
          ...(payload.pagination || {}),
        };
        state.totalWithdrawals =
          payload.pagination?.total ?? payload.withdrawals?.length ?? 0;
        state.lastFetched = Date.now();
      })
      .addCase(fetchWithdrawals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH BY ID
      .addCase(fetchWithdrawalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWithdrawalById.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload || {};
        state.selectedWithdrawal = payload.withdrawal || payload.data || null;
        state.withdrawalHistory = payload.history || [];
      })
      .addCase(fetchWithdrawalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // APPROVE
      .addCase(approveWithdrawal.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(approveWithdrawal.fulfilled, (state, action) => {
        state.processing = false;
        const updated = extractUpdatedWithdrawal(action.payload.data);
        if (updated) {
          const index = state.withdrawals.findIndex(
            (w) => w._id === action.payload.id
          );
          if (index !== -1) state.withdrawals[index] = updated;
          if (state.selectedWithdrawal?._id === action.payload.id) {
            state.selectedWithdrawal = updated;
          }
        }
      })
      .addCase(approveWithdrawal.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })

      // COMPLETE
      .addCase(completeWithdrawal.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(completeWithdrawal.fulfilled, (state, action) => {
        state.processing = false;
        const updated = extractUpdatedWithdrawal(action.payload.data);
        if (updated) {
          const index = state.withdrawals.findIndex(
            (w) => w._id === action.payload.id
          );
          if (index !== -1) state.withdrawals[index] = updated;
          if (state.selectedWithdrawal?._id === action.payload.id) {
            state.selectedWithdrawal = updated;
          }
        }
      })
      .addCase(completeWithdrawal.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })

      // REJECT
      .addCase(rejectWithdrawal.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(rejectWithdrawal.fulfilled, (state, action) => {
        state.processing = false;
        const updated = extractUpdatedWithdrawal(action.payload.data);
        if (updated) {
          const index = state.withdrawals.findIndex(
            (w) => w._id === action.payload.id
          );
          if (index !== -1) state.withdrawals[index] = updated;
          if (state.selectedWithdrawal?._id === action.payload.id) {
            state.selectedWithdrawal = updated;
          }
        }
      })
      .addCase(rejectWithdrawal.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })

      // CANCEL
      .addCase(cancelWithdrawal.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(cancelWithdrawal.fulfilled, (state, action) => {
        state.processing = false;
        const updated = extractUpdatedWithdrawal(action.payload.data);
        if (updated) {
          const index = state.withdrawals.findIndex(
            (w) => w._id === action.payload.id
          );
          if (index !== -1) state.withdrawals[index] = updated;
          if (state.selectedWithdrawal?._id === action.payload.id) {
            state.selectedWithdrawal = updated;
          }
        }
      })
      .addCase(cancelWithdrawal.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })

      // BULK PROCESS
      .addCase(bulkProcessWithdrawals.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(bulkProcessWithdrawals.fulfilled, (state) => {
        state.processing = false;
      })
      .addCase(bulkProcessWithdrawals.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      })

      // FETCH STATS
      .addCase(fetchWithdrawalStats.fulfilled, (state, action) => {
        state.stats = { ...state.stats, ...(action.payload || {}) };
      })

      // EXPORT
      .addCase(exportWithdrawals.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
      })
      .addCase(exportWithdrawals.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportWithdrawals.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearWithdrawalError,
  resetWithdrawalState,
  updatePagination,
  clearWithdrawals,
} = withdrawalSlice.actions;

export default withdrawalSlice.reducer;
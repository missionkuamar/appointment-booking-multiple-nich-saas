import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const DEFAULT_LINK_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  pages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export const DEFAULT_LIST_PAGINATION = {
  page: 1,
  limit: 5,
  total: 0,
  pages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const normalizePagination = (pag, fallbackPage, fallbackLimit) => {
  if (!pag) return null;
  const total = Number(pag.total) || 0;
  const limit = Number(pag.limit) || fallbackLimit;
  const pages = Number(pag.pages) || Math.max(1, Math.ceil(total / limit));
  const page = Number(pag.page) || fallbackPage;

  return {
    page,
    limit,
    total,
    pages,
    hasNextPage:
      typeof pag.hasNextPage === "boolean" ? pag.hasNextPage : page < pages,
    hasPreviousPage:
      typeof pag.hasPreviousPage === "boolean"
        ? pag.hasPreviousPage
        : page > 1,
  };
};

// 1. Fetch Affiliate Withdrawals (Dashboard summary list)
export const fetchAffiliateWithdrawals = createAsyncThunk(
  "affiliate/fetchWithdrawals",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/affiliate/withdrawals");
      const list = Array.isArray(response.data?.data?.withdrawals)
        ? response.data.data.withdrawals
        : [];
      return list;
    } catch (error) {
      if (error?.response?.status === 404) {
        return [];
      }
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load withdrawals"
      );
    }
  }
);

// 2. Fetch Affiliate Dashboard + Withdrawals
export const fetchAffiliateDashboard = createAsyncThunk(
  "affiliate/fetchDashboard",
  async ({ linkPage = 1, linkLimit = 10 } = {}, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/affiliate/dashboard", {
        params: { linkPage, linkLimit },
      });

      const data = response.data?.data;
      if (!data) {
        throw new Error("Invalid affiliate dashboard response");
      }

      const affiliate = data.affiliate || null;
      if (affiliate) {
        await dispatch(fetchAffiliateWithdrawals());
      }

      return {
        data,
        targetPage: linkPage,
        targetLimit: linkLimit,
      };
    } catch (error) {
      if (error?.response?.status === 404) {
        return { notFound: true };
      }
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load affiliate dashboard"
      );
    }
  }
);

// 3. Join Affiliate Program
export const joinAffiliateProgram = createAsyncThunk(
  "affiliate/joinProgram",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/affiliate/join");
      return true;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to join affiliate program"
      );
    }
  }
);

// 4. Create Affiliate Link
export const createAffiliateLink = createAsyncThunk(
  "affiliate/createLink",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/affiliate/links", payload);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create affiliate link"
      );
    }
  }
);

// 5. Delete Affiliate Link
export const deleteAffiliateLink = createAsyncThunk(
  "affiliate/deleteLink",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/affiliate/links/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete affiliate link"
      );
    }
  }
);

// 6. Fetch Paginated Referrals or Withdrawals (for AffiliateReferrals component)
export const fetchPaginatedAffiliateList = createAsyncThunk(
  "affiliate/fetchPaginatedList",
  async (
    { fetchUrl, type = "referral", page = 1, limit = 5, status = "" },
    { rejectWithValue }
  ) => {
    try {
      if (!fetchUrl) {
        throw new Error("Missing fetchUrl");
      }

      const params = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await api.get(fetchUrl, { params });
      const data = response.data?.data;
      if (!data) {
        throw new Error("Invalid response");
      }

      const list = data.withdrawals || data.referrals || [];
      const pag = data.pagination || {};
      const normalizedPagination =
        normalizePagination(pag, page, limit) || {
          ...DEFAULT_LIST_PAGINATION,
          page,
          limit,
        };

      return {
        type,
        items: Array.isArray(list) ? list : [],
        pagination: normalizedPagination,
        status,
      };
    } catch (error) {
      return rejectWithValue({
        type,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load list",
      });
    }
  }
);

const initialState = {
  loading: true,
  hasLoadedOnce: false,
  affiliate: null,
  stats: null,
  links: [],
  linksPagination: DEFAULT_LINK_PAGINATION,
  referrals: [],
  earnings: 0,
  withdrawals: [],
  isCreatingLink: false,
  error: null,

  // Paginated list states for AffiliateReferrals
  listData: {
    referral: {
      items: [],
      pagination: DEFAULT_LIST_PAGINATION,
      statusFilter: "",
      loading: false,
    },
    withdrawal: {
      items: [],
      pagination: DEFAULT_LIST_PAGINATION,
      statusFilter: "",
      loading: false,
    },
  },
};

const affiliateSlice = createSlice({
  name: "affiliate",
  initialState,
  reducers: {
    setLinkPage: (state, action) => {
      const newPage = Number(action.payload);
      if (Number.isInteger(newPage) && newPage >= 1) {
        state.linksPagination.page = newPage;
      }
    },
    setLinkLimit: (state, action) => {
      const newLimit = Number(action.payload);
      if (Number.isInteger(newLimit) && newLimit > 0) {
        state.linksPagination.limit = newLimit;
        state.linksPagination.page = 1;
      }
    },
    setListItems: (state, action) => {
      const { type = "referral", items = [] } = action.payload || {};
      const bucket = state.listData[type] || state.listData.referral;
      bucket.items = Array.isArray(items) ? items : [];
    },
    setListStatusFilter: (state, action) => {
      const { type = "referral", status = "" } = action.payload || {};
      const bucket = state.listData[type] || state.listData.referral;
      bucket.statusFilter = status;
    },
    resetAffiliateState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchAffiliateDashboard.pending, (state) => {
        if (!state.hasLoadedOnce) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchAffiliateDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.hasLoadedOnce = true;

        if (action.payload?.notFound) {
          state.affiliate = null;
          state.withdrawals = [];
          return;
        }

        const { data, targetPage, targetLimit } = action.payload;
        const aff = data.affiliate || null;

        state.affiliate = aff;
        state.stats = data.stats || null;
        state.earnings = Number(data.stats?.totalEarnings) || 0;
        state.links = Array.isArray(data.links) ? data.links : [];
        state.referrals = Array.isArray(data.recentReferrals)
          ? data.recentReferrals
          : [];

        const pag = data.linkPagination || data.linksPagination;
        const normalized = normalizePagination(pag, targetPage, targetLimit);
        if (normalized) {
          state.linksPagination = normalized;
        }

        if (!aff) {
          state.withdrawals = [];
        }
      })
      .addCase(fetchAffiliateDashboard.rejected, (state, action) => {
        state.loading = false;
        state.hasLoadedOnce = true;
        state.error = action.payload;
      })

      // Fetch Withdrawals
      .addCase(fetchAffiliateWithdrawals.fulfilled, (state, action) => {
        state.withdrawals = action.payload || [];
      })
      .addCase(fetchAffiliateWithdrawals.rejected, (state) => {
        state.withdrawals = [];
      })

      // Create Link
      .addCase(createAffiliateLink.pending, (state) => {
        state.isCreatingLink = true;
      })
      .addCase(createAffiliateLink.fulfilled, (state) => {
        state.isCreatingLink = false;
      })
      .addCase(createAffiliateLink.rejected, (state) => {
        state.isCreatingLink = false;
      })

      // Delete Link
      .addCase(deleteAffiliateLink.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.links = state.links.filter((l) => l._id !== deletedId);
        const remaining = Math.max(0, state.linksPagination.total - 1);
        const maxPage = Math.max(
          1,
          Math.ceil(remaining / state.linksPagination.limit)
        );
        state.linksPagination.total = remaining;
        state.linksPagination.pages = maxPage;
        state.linksPagination.page = Math.min(
          state.linksPagination.page,
          maxPage
        );
      })

      // Fetch Paginated List (Referrals / Withdrawals)
      .addCase(fetchPaginatedAffiliateList.pending, (state, action) => {
        const type = action.meta?.arg?.type || "referral";
        const bucket = state.listData[type] || state.listData.referral;
        bucket.loading = true;
      })
      .addCase(fetchPaginatedAffiliateList.fulfilled, (state, action) => {
        const { type = "referral", items, pagination, status } = action.payload;
        const bucket = state.listData[type] || state.listData.referral;
        bucket.loading = false;
        bucket.items = items;
        bucket.pagination = pagination;
        bucket.statusFilter = status;
      })
      .addCase(fetchPaginatedAffiliateList.rejected, (state, action) => {
        const type =
          action.payload?.type || action.meta?.arg?.type || "referral";
        const bucket = state.listData[type] || state.listData.referral;
        bucket.loading = false;
      });
  },
});

export const {
  setLinkPage,
  setLinkLimit,
  setListItems,
  setListStatusFilter,
  resetAffiliateState,
} = affiliateSlice.actions;

export default affiliateSlice.reducer;
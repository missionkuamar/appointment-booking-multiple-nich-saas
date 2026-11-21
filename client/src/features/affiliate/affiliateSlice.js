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
  console.log("[AffiliateSlice][normalizePagination] input:", {
    pag,
    fallbackPage,
    fallbackLimit,
  });

  if (!pag) {
    console.log("[AffiliateSlice][normalizePagination] no pagination object -> null");
    return null;
  }

  const total = Number(pag.total) || 0;
  const limit = Number(pag.limit) || fallbackLimit;
  const pages = Number(pag.pages) || Math.max(1, Math.ceil(total / limit));
  const page = Number(pag.page) || fallbackPage;

  const normalized = {
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

  console.log("[AffiliateSlice][normalizePagination] output:", normalized);
  return normalized;
};

// 1. Fetch Affiliate Withdrawals (Dashboard summary list)
export const fetchAffiliateWithdrawals = createAsyncThunk(
  "affiliate/fetchWithdrawals",
  async (_, { rejectWithValue }) => {
    console.log("[AffiliateSlice][fetchWithdrawals] calling GET /affiliate/withdrawals");
    try {
      const response = await api.get("/affiliate/withdrawals");
      console.log("fetchAffiliateWithdrawals", fetchAffiliateWithdrawals)
      console.log("[AffiliateSlice][fetchWithdrawals] raw respon  se:", response.data);

      const list = Array.isArray(response.data?.data?.withdrawals)
        ? response.data.data.withdrawals
        : [];
      console.log("[AffiliateSlice][fetchWithdrawals] extracted list count:", list.length);
      return list;
    } catch (error) {
      console.error("[AffiliateSlice][fetchWithdrawals] error:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data,
      });

      if (error?.response?.status === 404) {
        console.warn("[AffiliateSlice][fetchWithdrawals] 404 received -> returning []");
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
    console.log("[AffiliateSlice][fetchDashboard] params:", { linkPage, linkLimit });
    try {
      const response = await api.get("/affiliate/dashboard", {
        params: { linkPage, linkLimit },
      });
      console.log("[AffiliateSlice][fetchDashboard] raw response:", response.data);

      const data = response.data?.data;
      if (!data) {
        console.error("[AffiliateSlice][fetchDashboard] missing data in response");
        throw new Error("Invalid affiliate dashboard response");
      }

      const affiliate = data.affiliate || null;
      console.log("[AffiliateSlice][fetchDashboard] affiliate:", affiliate);

      if (affiliate) {
        console.log("[AffiliateSlice][fetchDashboard] dispatching fetchAffiliateWithdrawals");
        await dispatch(fetchAffiliateWithdrawals());
      } else {
        console.log("[AffiliateSlice][fetchDashboard] no affiliate found, skipping withdrawals fetch");
      }

      return {
        data,
        targetPage: linkPage,
        targetLimit: linkLimit,
      };
    } catch (error) {
      console.error("[AffiliateSlice][fetchDashboard] error:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data,
      });

      if (error?.response?.status === 404) {
        console.warn("[AffiliateSlice][fetchDashboard] 404 received -> notFound: true");
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
    console.log("[AffiliateSlice][joinProgram] calling POST /affiliate/join");
    try {
      const res = await api.post("/affiliate/join");
      console.log("[AffiliateSlice][joinProgram] success:", res.data);
      return true;
    } catch (error) {
      console.error("[AffiliateSlice][joinProgram] error:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data,
      });
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
    console.log("[AffiliateSlice][createLink] payload:", payload);
    try {
      const response = await api.post("/affiliate/links", payload);
      console.log("[AffiliateSlice][createLink] success response:", response.data);
      return response.data?.data || null;
    } catch (error) {
      console.error("[AffiliateSlice][createLink] error:", {
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data,
      });
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
    console.log("[AffiliateSlice][deleteLink] deleting id:", id);
    try {
      await api.delete(`/affiliate/links/${id}`);
      console.log("[AffiliateSlice][deleteLink] deleted id:", id);
      return id;
    } catch (error) {
      console.error("[AffiliateSlice][deleteLink] error:", {
        id,
        status: error?.response?.status,
        message: error?.response?.data?.message || error?.message,
        data: error?.response?.data,
      });
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
    console.log("[AffiliateSlice][fetchPaginatedList] request:", {
      fetchUrl,
      type,
      page,
      limit,
      status,
    });

    try {
      if (!fetchUrl) {
        console.error("[AffiliateSlice][fetchPaginatedList] missing fetchUrl");
        throw new Error("Missing fetchUrl");
      }

      const params = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await api.get(fetchUrl, { params });
      console.log("[AffiliateSlice][fetchPaginatedList] raw response:", response.data);

      const data = response.data?.data;
      if (!data) {
        console.error("[AffiliateSlice][fetchPaginatedList] missing data object in response");
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

      const result = {
        type,
        items: Array.isArray(list) ? list : [],
        pagination: normalizedPagination,
        status,
      };

      console.log("[AffiliateSlice][fetchPaginatedList] normalized result:", {
        type: result.type,
        itemsCount: result.items.length,
        pagination: result.pagination,
        status: result.status,
      });

      return result;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load list";

      console.error("[AffiliateSlice][fetchPaginatedList] error:", {
        fetchUrl,
        type,
        status: error?.response?.status,
        message,
        data: error?.response?.data,
      });

      return rejectWithValue({
        type,
        message,
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
      console.log("[AffiliateSlice][setLinkPage]", {
        payload: action.payload,
        newPage,
        prevPage: state.linksPagination.page,
      });
      if (Number.isInteger(newPage) && newPage >= 1) {
        state.linksPagination.page = newPage;
      }
    },
    setLinkLimit: (state, action) => {
      const newLimit = Number(action.payload);
      console.log("[AffiliateSlice][setLinkLimit]", {
        payload: action.payload,
        newLimit,
        prevLimit: state.linksPagination.limit,
      });
      if (Number.isInteger(newLimit) && newLimit > 0) {
        state.linksPagination.limit = newLimit;
        state.linksPagination.page = 1;
      }
    },
    setListItems: (state, action) => {
      const { type = "referral", items = [] } = action.payload || {};
      console.log("[AffiliateSlice][setListItems]", {
        type,
        itemsCount: Array.isArray(items) ? items.length : 0,
      });
      const bucket = state.listData[type] || state.listData.referral;
      bucket.items = Array.isArray(items) ? items : [];
    },
    setListStatusFilter: (state, action) => {
      const { type = "referral", status = "" } = action.payload || {};
      console.log("[AffiliateSlice][setListStatusFilter]", { type, status });
      const bucket = state.listData[type] || state.listData.referral;
      bucket.statusFilter = status;
    },
    resetAffiliateState: () => {
      console.log("[AffiliateSlice][resetAffiliateState] resetting state to initialState");
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchAffiliateDashboard.pending, (state) => {
        console.log("[AffiliateSlice][fetchDashboard.pending]", {
          hasLoadedOnce: state.hasLoadedOnce,
        });
        if (!state.hasLoadedOnce) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchAffiliateDashboard.fulfilled, (state, action) => {
        console.log("[AffiliateSlice][fetchDashboard.fulfilled] payload:", action.payload);
        state.loading = false;
        state.hasLoadedOnce = true;

        if (action.payload?.notFound) {
          console.log("[AffiliateSlice][fetchDashboard.fulfilled] notFound -> clearing affiliate & withdrawals");
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

        console.log("[AffiliateSlice][fetchDashboard.fulfilled] updated state summary:", {
          hasAffiliate: Boolean(state.affiliate),
          earnings: state.earnings,
          linksCount: state.links.length,
          referralsCount: state.referrals.length,
          linksPagination: state.linksPagination,
        });
      })
      .addCase(fetchAffiliateDashboard.rejected, (state, action) => {
        console.error("[AffiliateSlice][fetchDashboard.rejected]", action.payload);
        state.loading = false;
        state.hasLoadedOnce = true;
        state.error = action.payload;
      })

      // Fetch Withdrawals
      .addCase(fetchAffiliateWithdrawals.fulfilled, (state, action) => {
        console.log("[AffiliateSlice][fetchWithdrawals.fulfilled] count:", (action.payload || []).length);
        state.withdrawals = action.payload || [];
      })
      .addCase(fetchAffiliateWithdrawals.rejected, (state, action) => {
        console.error("[AffiliateSlice][fetchWithdrawals.rejected]", action.payload);
        state.withdrawals = [];
      })

      // Create Link
      .addCase(createAffiliateLink.pending, (state) => {
        console.log("[AffiliateSlice][createLink.pending]");
        state.isCreatingLink = true;
      })
      .addCase(createAffiliateLink.fulfilled, (state, action) => {
        console.log("[AffiliateSlice][createLink.fulfilled]", action.payload);
        state.isCreatingLink = false;
      })
      .addCase(createAffiliateLink.rejected, (state, action) => {
        console.error("[AffiliateSlice][createLink.rejected]", action.payload);
        state.isCreatingLink = false;
      })

      // Delete Link
      .addCase(deleteAffiliateLink.fulfilled, (state, action) => {
        const deletedId = action.payload;
        console.log("[AffiliateSlice][deleteLink.fulfilled] removed id:", deletedId);
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
        console.log("[AffiliateSlice][fetchPaginatedList.pending] type:", type);
        const bucket = state.listData[type] || state.listData.referral;
        bucket.loading = true;
      })
      .addCase(fetchPaginatedAffiliateList.fulfilled, (state, action) => {
        const { type = "referral", items, pagination, status } = action.payload;
        console.log("[AffiliateSlice][fetchPaginatedList.fulfilled]", {
          type,
          itemsCount: items?.length || 0,
          pagination,
          status,
        });
        const bucket = state.listData[type] || state.listData.referral;
        bucket.loading = false;
        bucket.items = items;
        bucket.pagination = pagination;
        bucket.statusFilter = status;
      })
      .addCase(fetchPaginatedAffiliateList.rejected, (state, action) => {
        const type =
          action.payload?.type || action.meta?.arg?.type || "referral";
        console.error("[AffiliateSlice][fetchPaginatedList.rejected]", {
          type,
          payload: action.payload,
        });
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
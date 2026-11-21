import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminBusinesses,
  deleteBusinessById,
} from "../../features/admin/adminSlice";
import { FaTrash, FaEye, FaSearch } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-white",
  border: "border-gray-200",
};

export default function AdminBusinessesPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();
  
  const { businesses, businessPagination, businessLoading } = useSelector(
    (s) => s.admin
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminBusinesses({ search, page, limit: 10 }));
    }, 500); // Debounce search
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this business?")) return;
    
    const res = await dispatch(deleteBusinessById(id));
    if (deleteBusinessById.fulfilled.match(res)) {
      toast.success("Business deleted successfully");
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${theme.text}`}>
          All Clinics / Businesses
        </h1>
        <p className={`text-sm ${theme.muted}`}>
          Manage all registered businesses on the platform
        </p>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl border ${theme.card} ${theme.border} relative`}>
        <FaSearch className={`absolute left-7 top-1/2 -translate-y-1/2 ${theme.muted}`} />
        <input
          type="text"
          placeholder="Search by business name, owner, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.soft} ${theme.text} outline-none focus:ring-2 focus:ring-primary`}
        />
      </div>

      {/* List */}
      {businessLoading ? (
        <div className="text-center py-10">
          <p className={theme.muted}>Loading businesses...</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className={`text-center py-10 border rounded-2xl ${theme.border}`}>
          <p className={theme.muted}>No businesses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((b) => (
            <div
              key={b._id}
              className={`p-5 rounded-2xl border ${theme.card} ${theme.border} shadow-sm flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-lg ${theme.text}`}>
                    {b.businessName}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                      b.subscriptionStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {b.subscriptionStatus || "No Sub"}
                  </span>
                </div>
                <p className={`text-sm capitalize ${theme.muted}`}>{b.businessType}</p>

                <div className={`mt-4 p-3 rounded-xl ${theme.soft} space-y-1`}>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Owner:</strong> {b.ownerId?.name || "-"}
                  </p>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Email:</strong> {b.ownerId?.email || "-"}
                  </p>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Slug:</strong> /{b.slug}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setSelectedBusiness(b)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition"
                >
                  <FaEye /> View
                </button>
                <button
                  onClick={() => handleDelete(b._id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 text-sm font-medium py-2 rounded-xl hover:bg-red-100 transition"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {businessPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl mt-6">
          <span className="text-sm text-gray-500">
            Page {businessPagination.page} of {businessPagination.totalPages} ({businessPagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(businessPagination.totalPages, p + 1))}
              disabled={page === businessPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Simple View Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4">{selectedBusiness.businessName}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Owner:</strong> {selectedBusiness.ownerId?.name}</p>
              <p><strong>Email:</strong> {selectedBusiness.ownerId?.email}</p>
              <p><strong>Phone:</strong> {selectedBusiness.phone || "N/A"}</p>
              <p><strong>Address:</strong> {selectedBusiness.address || "N/A"}</p>
            </div>
            <button
              onClick={() => setSelectedBusiness(null)}
              className="mt-6 w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
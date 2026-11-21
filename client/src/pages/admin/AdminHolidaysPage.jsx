import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminHolidays,
  addHoliday,
  deleteHolidayById,
} from "../../features/admin/adminSlice";
import { FaTrash, FaPlus, FaSearch, FaCalendarAlt } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-gray-50",
  border: "border-gray-200",
};

export default function AdminHolidaysPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();

  const { holidays, holidayPagination, holidayLoading } = useSelector(
    (s) => s.admin
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
  });

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminHolidays({ search, page, limit: 10 }));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, page]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!formData.date) return toast.error("Please select a date");

    const res = await dispatch(addHoliday(formData));
    if (addHoliday.fulfilled.match(res)) {
      toast.success("Holiday added!");
      setFormData({ date: "", reason: "" });
      setShowAddForm(false);
    } else {
      toast.error(res.payload);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    const res = await dispatch(deleteHolidayById(id));
    if (deleteHolidayById.fulfilled.match(res)) {
      toast.success("Holiday deleted");
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>
            Holidays Management
          </h1>
          <p className={`text-sm ${theme.muted}`}>
            Add global holidays or view clinic-specific leaves
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition shadow-sm"
        >
          <FaPlus /> {showAddForm ? "Cancel" : "Add Holiday"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddHoliday}
          className={`p-5 rounded-2xl border ${theme.card} ${theme.border} shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4`}
        >
          <div>
            <label className={`block text-xs font-bold mb-1 ${theme.muted}`}>Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full p-2.5 rounded-xl border ${theme.border} ${theme.soft} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${theme.muted}`}>Reason (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Diwali, Christmas..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className={`w-full p-2.5 rounded-xl border ${theme.border} ${theme.soft} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-secondary text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition text-sm"
            >
              Save Holiday
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className={`p-4 rounded-2xl border ${theme.card} ${theme.border} relative`}>
        <FaSearch className={`absolute left-7 top-1/2 -translate-y-1/2 ${theme.muted}`} />
        <input
          type="text"
          placeholder="Search by date or reason..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.soft} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm`}
        />
      </div>

      {/* List */}
      <div className={`rounded-2xl border ${theme.card} ${theme.border} overflow-hidden shadow-sm`}>
        {holidayLoading ? (
          <div className="p-10 text-center"><p className={theme.muted}>Loading holidays...</p></div>
        ) : holidays.length === 0 ? (
          <div className="p-10 text-center"><p className={theme.muted}>No holidays found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme.soft} border-b ${theme.border} text-xs font-bold uppercase ${theme.muted}`}>
                  <th className="p-4">Date</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Scope (Clinic / Doctor)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {holidays.map((h) => (
                  <tr key={h._id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-primary" />
                        <p className={`font-bold ${theme.text}`}>{h.date}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${theme.text}`}>{h.reason || "-"}</p>
                    </td>
                    <td className="p-4">
                      {!h.businessId && !h.doctorId ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700">GLOBAL (All Clinics)</span>
                      ) : h.doctorId ? (
                        <div>
                          <p className={`font-medium ${theme.text}`}>{h.doctorId?.name || "Doctor"}</p>
                          <p className={`text-xs ${theme.muted}`}>{h.businessId?.businessName || "-"}</p>
                        </div>
                      ) : (
                        <p className={`font-medium ${theme.text}`}>{h.businessId?.businessName || "Clinic"}</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(h._id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Delete Holiday"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {holidayPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl">
          <span className="text-sm text-gray-500">
            Page {holidayPagination.page} of {holidayPagination.totalPages} ({holidayPagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(holidayPagination.totalPages, p + 1))}
              disabled={page === holidayPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
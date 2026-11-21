import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminSlots,
  deleteSlotById,
  clearUnbookedSlots,
} from "../../features/admin/adminSlice";
import { FaTrash, FaEye, FaSearch, FaBroom } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-gray-50",
  border: "border-gray-200",
};

export default function AdminSlotsPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();

  const { slots, slotPagination, slotLoading } = useSelector(
    (s) => s.admin
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminSlots({ search, status: statusFilter, page, limit: 20 }));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, statusFilter, page]);

  const handleDelete = async (id, isBooked) => {
    if (isBooked) {
      toast.error("Cannot delete a booked slot.");
      return;
    }
    if (!window.confirm("Delete this slot permanently?")) return;
    
    const res = await dispatch(deleteSlotById(id));
    if (deleteSlotById.fulfilled.match(res)) {
      toast.success("Slot deleted");
    } else {
      toast.error(res.payload);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL unbooked future slots? This action cannot be undone.")) return;
    
    const res = await dispatch(clearUnbookedSlots());
    if (clearUnbookedSlots.fulfilled.match(res)) {
      toast.success(res.payload.message);
      dispatch(fetchAdminSlots({ search, status: statusFilter, page, limit: 20 }));
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>All Slots</h1>
          <p className={`text-sm ${theme.muted}`}>
            View and manage all generated time slots
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`} />
            <input
              type="text"
              placeholder="Search by date or time..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.card} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`px-4 py-2.5 rounded-xl border ${theme.border} ${theme.card} ${theme.text} outline-none focus:ring-2 focus:ring-primary text-sm font-medium`}
          >
            <option value="all">All Slots</option>
            <option value="available">Available Only</option>
            <option value="booked">Booked Only</option>
            <option value="blocked">Blocked (Holidays)</option>
          </select>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition"
          >
            <FaBroom /> Clear Unbooked
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border ${theme.card} ${theme.border} overflow-hidden shadow-sm`}>
        {slotLoading ? (
          <div className="p-10 text-center"><p className={theme.muted}>Loading slots...</p></div>
        ) : slots.length === 0 ? (
          <div className="p-10 text-center"><p className={theme.muted}>No slots found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme.soft} border-b ${theme.border} text-xs font-bold uppercase ${theme.muted}`}>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Clinic</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {slots.map((slot) => (
                  <tr key={slot._id} className={`hover:bg-gray-50 transition`}>
                    <td className="p-4">
                      <p className={`font-bold ${theme.text}`}>{slot.date}</p>
                      <p className={`text-xs ${theme.muted}`}>{slot.startTime} - {slot.endTime}</p>
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${theme.text}`}>{slot.doctorId?.name || "Any"}</p>
                      <p className={`text-xs ${theme.muted}`}>{slot.doctorId?.specialization || "-"}</p>
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${theme.text}`}>{slot.businessId?.businessName || "-"}</p>
                    </td>
                    <td className="p-4">
                      {slot.isBooked ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700">BOOKED</span>
                      ) : slot.isBlocked ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-200 text-gray-700">BLOCKED</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-green-100 text-green-700">AVAILABLE</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedSlot(slot)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDelete(slot._id, slot.isBooked)}
                        disabled={slot.isBooked}
                        className={`p-2 rounded-lg transition ${
                          slot.isBooked 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                        title={slot.isBooked ? "Cannot delete booked slot" : "Delete Slot"}
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
      {slotPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl">
          <span className="text-sm text-gray-500">
            Page {slotPagination.page} of {slotPagination.totalPages} ({slotPagination.total} total)
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
              onClick={() => setPage((p) => Math.min(slotPagination.totalPages, p + 1))}
              disabled={page === slotPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Slot Details</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <p><strong>Date:</strong> {selectedSlot.date}</p>
                <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
              </div>
              <p><strong>Doctor:</strong> {selectedSlot.doctorId?.name || "Any"}</p>
              <p><strong>Clinic:</strong> {selectedSlot.businessId?.businessName || "-"}</p>
              
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  selectedSlot.isBooked ? "bg-red-100 text-red-700" :
                  selectedSlot.isBlocked ? "bg-gray-200 text-gray-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {selectedSlot.isBooked ? "BOOKED" : selectedSlot.isBlocked ? "BLOCKED" : "AVAILABLE"}
                </span>
              </p>
            </div>
            
            <button
              onClick={() => setSelectedSlot(null)}
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
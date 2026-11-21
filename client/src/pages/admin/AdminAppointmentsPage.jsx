import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminAppointments,
  deleteAppointmentById,
  updateAppointmentStatusById,
} from "../../features/admin/adminSlice";
import { FaTrash, FaEye, FaSearch } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-gray-50",
  border: "border-gray-200",
};

// Status Colors
const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-700",
};

export default function AdminAppointmentsPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();

  const { appointments, appointmentPagination, appointmentLoading } = useSelector(
    (s) => s.admin
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedAppt, setSelectedAppt] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminAppointments({ search, status: statusFilter, page, limit: 10 }));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, statusFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;
    const res = await dispatch(deleteAppointmentById(id));
    if (deleteAppointmentById.fulfilled.match(res)) {
      toast.success("Appointment deleted");
    } else {
      toast.error(res.payload);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const res = await dispatch(updateAppointmentStatusById({ id, status: newStatus }));
    if (updateAppointmentStatusById.fulfilled.match(res)) {
      toast.success(`Status updated to ${newStatus}`);
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
            All Appointments
          </h1>
          <p className={`text-sm ${theme.muted}`}>
            View and manage all platform appointments
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.muted}`} />
            <input
              type="text"
              placeholder="Search patient name or phone..."
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
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border ${theme.card} ${theme.border} overflow-hidden shadow-sm`}>
        {appointmentLoading ? (
          <div className="p-10 text-center"><p className={theme.muted}>Loading appointments...</p></div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center"><p className={theme.muted}>No appointments found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme.soft} border-b ${theme.border} text-xs font-bold uppercase ${theme.muted}`}>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Doctor / Clinic</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {appointments.map((appt) => (
                  <tr key={appt._id} className={`hover:bg-gray-50 transition`}>
                    <td className="p-4">
                      <p className={`font-bold ${theme.text}`}>{appt.clientName}</p>
                      <p className={`text-xs ${theme.muted}`}>📞 {appt.clientPhone}</p>
                      {appt.clientEmail && <p className={`text-xs ${theme.muted}`}>✉️ {appt.clientEmail}</p>}
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${theme.text}`}>{appt.date}</p>
                      <p className={`text-xs ${theme.muted}`}>🕐 {appt.time}</p>
                    </td>
                    <td className="p-4">
                      <p className={`font-medium ${theme.text}`}>{appt.doctorId?.name || "Any Doctor"}</p>
                      <p className={`text-xs ${theme.muted}`}>{appt.businessId?.businessName || "-"}</p>
                    </td>
                    <td className="p-4">
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg outline-none border-none cursor-pointer ${statusColors[appt.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        <option value="pending">PENDING</option>
                        <option value="confirmed">CONFIRMED</option>
                        <option value="completed">COMPLETED</option>
                        <option value="cancelled">CANCELLED</option>
                        <option value="no_show">NO SHOW</option>
                      </select>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDelete(appt._id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        title="Delete"
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
      {appointmentPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl">
          <span className="text-sm text-gray-500">
            Page {appointmentPagination.page} of {appointmentPagination.totalPages} ({appointmentPagination.total} total)
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
              onClick={() => setPage((p) => Math.min(appointmentPagination.totalPages, p + 1))}
              disabled={page === appointmentPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Appointment Details</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="font-bold text-gray-800">{selectedAppt.clientName}</p>
                <p>📞 {selectedAppt.clientPhone}</p>
                {selectedAppt.clientEmail && <p>✉️ {selectedAppt.clientEmail}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <p><strong>Date:</strong> {selectedAppt.date}</p>
                <p><strong>Time:</strong> {selectedAppt.time}</p>
              </div>

              <p><strong>Doctor:</strong> {selectedAppt.doctorId?.name || "Any"}</p>
              <p><strong>Clinic:</strong> {selectedAppt.businessId?.businessName || "-"}</p>
              
              {selectedAppt.reason && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl mt-2">
                  <strong>Reason:</strong> {selectedAppt.reason}
                </div>
              )}

              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[selectedAppt.status]}`}>
                  {selectedAppt.status.toUpperCase()}
                </span>
              </p>
            </div>
            
            <button
              onClick={() => setSelectedAppt(null)}
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
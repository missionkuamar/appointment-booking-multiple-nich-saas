import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchAdminDoctors,
  deleteDoctorById,
  toggleDoctorActiveStatus,
} from "../../features/admin/adminSlice";
import { FaTrash, FaEye, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  soft: "bg-white",
  border: "border-gray-200",
};

export default function AdminDoctorsPage({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const dispatch = useDispatch();

  const { doctors, doctorPagination, doctorLoading } = useSelector(
    (s) => s.admin
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      dispatch(fetchAdminDoctors({ search, page, limit: 10 }));
    }, 500); // Debounce search
    return () => clearTimeout(delayDebounce);
  }, [dispatch, search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    
    const res = await dispatch(deleteDoctorById(id));
    if (deleteDoctorById.fulfilled.match(res)) {
      toast.success("Doctor deleted successfully");
    } else {
      toast.error(res.payload);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const res = await dispatch(toggleDoctorActiveStatus({ id, isActive: !currentStatus }));
    if (toggleDoctorActiveStatus.fulfilled.match(res)) {
      toast.success("Status updated");
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${theme.text}`}>
          Doctors Management
        </h1>
        <p className={`text-sm ${theme.muted}`}>
          Manage all doctors registered on the platform
        </p>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl border ${theme.card} ${theme.border} relative`}>
        <FaSearch className={`absolute left-7 top-1/2 -translate-y-1/2 ${theme.muted}`} />
        <input
          type="text"
          placeholder="Search by name, specialization, qualification..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.soft} ${theme.text} outline-none focus:ring-2 focus:ring-primary`}
        />
      </div>

      {/* List */}
      {doctorLoading ? (
        <div className="text-center py-10">
          <p className={theme.muted}>Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className={`text-center py-10 border rounded-2xl ${theme.border}`}>
          <p className={theme.muted}>No doctors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className={`p-5 rounded-2xl border ${theme.card} ${theme.border} shadow-sm flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    {doc.avatarUrl ? (
                      <img src={doc.avatarUrl} alt={doc.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                        {doc.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${theme.text}`}>
                        {doc.name}
                      </h3>
                      <p className={`text-sm ${theme.muted}`}>{doc.specialization || "General"}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                      doc.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {doc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className={`mt-4 p-3 rounded-xl ${theme.soft} space-y-1`}>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Clinic:</strong> {doc.businessId?.businessName || "-"}
                  </p>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Experience:</strong> {doc.experienceYears || 0} years
                  </p>
                  <p className={`text-xs ${theme.muted}`}>
                    <strong>Fee:</strong> ₹{doc.consultationFee || 0}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition"
                >
                  <FaEye /> View
                </button>
                <button
                  onClick={() => handleToggleStatus(doc._id, doc.isActive)}
                  className={`flex-1 flex items-center justify-center gap-2 border text-sm font-medium py-2 rounded-xl transition ${
                    doc.isActive
                      ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                      : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                  }`}
                >
                  {doc.isActive ? <><FaTimes /> Deactivate</> : <><FaCheck /> Activate</>}
                </button>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="flex items-center justify-center bg-red-50 text-red-600 border border-red-100 p-2 rounded-xl hover:bg-red-100 transition"
                  title="Delete Doctor"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {doctorPagination.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 border rounded-2xl mt-6">
          <span className="text-sm text-gray-500">
            Page {doctorPagination.page} of {doctorPagination.totalPages} ({doctorPagination.total} total)
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
              onClick={() => setPage((p) => Math.min(doctorPagination.totalPages, p + 1))}
              disabled={page === doctorPagination.totalPages}
              className="px-4 py-2 border rounded-lg bg-white text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Simple View Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4">{selectedDoctor.name}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
              <p><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
              <p><strong>Clinic:</strong> {selectedDoctor.businessId?.businessName}</p>
              <p><strong>Experience:</strong> {selectedDoctor.experienceYears} years</p>
              <p><strong>Fee:</strong> ₹{selectedDoctor.consultationFee}</p>
              <p><strong>Availability:</strong> {selectedDoctor.availability?.length || 0} days configured</p>
            </div>
            <button
              onClick={() => setSelectedDoctor(null)}
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
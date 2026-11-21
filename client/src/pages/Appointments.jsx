import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMyAppointments,
  updateAppointment,
} from "../features/appointment/appointmentSlice";
import { fetchMyDoctors } from "../features/doctor/doctorSlice";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const statusColors = {
  pending: "bg-yellow-500/15 text-yellow-500",
  confirmed: "bg-green-500/15 text-green-500",
  cancelled: "bg-red-500/15 text-red-500",
  completed: "bg-blue-500/15 text-blue-500",
};

const Appointments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loading, pagination } = useSelector((state) => state.appointment);
  const { list: doctors } = useSelector((state) => state.doctor);
  const { user } = useSelector((state) => state.auth);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchMyDoctors());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchMyAppointments({
        status: statusFilter,
        doctorId: doctorFilter,
        page,
        limit: 10,
      })
    );
  }, [dispatch, statusFilter, doctorFilter, page]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const handleStatusChangeFilter = (s) => {
    setStatusFilter(s);
    setPage(1);
  };

  const handleDoctorChangeFilter = (e) => {
    setDoctorFilter(e.target.value);
    setPage(1);
  };

  const handleUpdateStatus = async (id, status) => {
    const res = await dispatch(updateAppointment({ id, status }));
    if (updateAppointment.fulfilled.match(res)) {
      toast.success(`Appointment marked as ${status}`);
      dispatch(
        fetchMyAppointments({
          status: statusFilter,
          doctorId: doctorFilter,
          page,
          limit: 10,
        })
      );
    } else {
      toast.error(res.payload || "Failed to update status");
    }
  };

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>Appointments</h1>
            <p className={`text-sm ${t.muted}`}>
              View and manage patient bookings
            </p>
          </div>
          <Link
            to="/dashboard"
            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${t.border} ${t.card} ${t.text} ${t.hover}`}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Filters Section */}
        <div className={`rounded-2xl border ${t.card} ${t.border} p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center`}>
          
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChangeFilter(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                  statusFilter === s
                    ? t.selected
                    : `${t.soft} ${t.text} ${t.hover}`
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Doctor Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className={`text-xs font-semibold ${t.muted}`}>Doctor:</span>
            <select
              value={doctorFilter}
              onChange={handleDoctorChangeFilter}
              className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs font-medium outline-none w-full md:w-48`}
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`text-center py-10 text-sm font-medium ${t.muted}`}>
            Loading appointments...
          </div>
        )}

        {/* Empty State */}
        {!loading && list.length === 0 && (
          <div className={`rounded-2xl border ${t.card} ${t.border} p-12 text-center`}>
            <p className={`text-base font-bold ${t.text}`}>No appointments found</p>
            <p className={`text-xs mt-1 ${t.muted}`}>
              Try changing the filters or share your booking link.
            </p>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-3">
          {!loading &&
            list.map((appt) => (
              <div
                key={appt._id}
                className={`rounded-2xl border ${t.card} ${t.border} p-5 flex flex-col md:flex-row justify-between gap-4`}
              >
                {/* Left Side: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <h3 className={`font-bold text-base ${t.text}`}>
                      {appt.clientName}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        statusColors[appt.status] || t.soft
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div className={`space-y-1 text-xs ${t.muted}`}>
                    <p>
                      📞 {appt.clientPhone}
                      {appt.clientEmail ? ` | ✉️ ${appt.clientEmail}` : ""}
                    </p>
                    <p className={`font-semibold ${t.text} ${t.soft} inline-block px-2.5 py-1 rounded-lg mt-1`}>
                      📅 {appt.date} • 🕐 {appt.time}
                    </p>
                    <p className={`font-semibold ${t.accentText} pt-1`}>
                      🩺 {appt.doctorId?.name || "Not Assigned"}
                    </p>
                  </div>

                  {appt.reason && (
                    <p className={`text-xs mt-3 ${t.soft} ${t.text} p-2.5 rounded-xl border ${t.border}`}>
                      <strong>Reason:</strong> {appt.reason}
                    </p>
                  )}
                </div>

                {/* Right Side: Actions */}
                <div className={`flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l ${t.border} pt-3 md:pt-0 md:pl-4`}>
                  {appt.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appt._id, "confirmed")}
                        className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt._id, "cancelled")}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:opacity-90 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus(appt._id, "completed")}
                      className={`flex-1 md:flex-none px-4 py-2 ${t.accent} text-white rounded-xl text-xs font-bold hover:opacity-90 transition`}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Pagination Controls */}
        {!loading && pagination && pagination.totalPages > 1 && (
          <div className={`flex justify-between items-center mt-6 rounded-2xl border ${t.card} ${t.border} p-4`}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover} transition`}
            >
              ← Previous
            </button>

            <span className={`text-xs font-medium ${t.muted}`}>
              Page <strong className={t.accentText}>{pagination.page}</strong> of{" "}
              {pagination.totalPages}{" "}
              <span className="ml-1">({pagination.total} total)</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover} transition`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
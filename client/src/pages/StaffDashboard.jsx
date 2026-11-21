import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchMyAppointments,
  updateAppointment,
} from "../features/appointment/appointmentSlice";
import { fetchMyDoctors } from "../features/doctor/doctorSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const statusColors = {
  pending: "bg-yellow-500/15 text-yellow-500",
  confirmed: "bg-green-500/15 text-green-500",
  cancelled: "bg-red-500/15 text-red-500",
  completed: "bg-blue-500/15 text-blue-500",
};

const StaffDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { list: appointments, loading } = useSelector(
    (state) => state.appointment
  );
  const { list: doctors } = useSelector((state) => state.doctor);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("");

  useEffect(() => {
    dispatch(fetchMyDoctors());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchMyAppointments({
        status: statusFilter,
        doctorId: doctorFilter,
        page: 1,
        limit: 20,
      })
    );
  }, [dispatch, statusFilter, doctorFilter]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const handleStatusChange = async (id, status) => {
    const res = await dispatch(updateAppointment({ id, status }));
    if (updateAppointment.fulfilled.match(res)) {
      toast.success(`Marked as ${status}`);
      dispatch(
        fetchMyAppointments({
          status: statusFilter,
          doctorId: doctorFilter,
          page: 1,
          limit: 20,
        })
      );
    } else {
      toast.error(res.payload || "Failed to update status");
    }
  };

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter(
    (a) => a.status === "confirmed"
  ).length;

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={
          user
            ? {
                ...user,
                name: user.staffTitle ? `${user.staffTitle} ${user.name}` : user.name,
              }
            : user
        }
        handleLogout={handleLogout}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${t.text}`}>
            Staff Dashboard
          </h1>
          <p className={`text-sm ${t.muted}`}>
            Manage daily bookings and patient check-ins
          </p>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-xs font-semibold ${t.muted}`}>Shown Bookings</p>
            <p className={`text-3xl font-bold mt-1 ${t.text}`}>
              {appointments.length}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-xs font-semibold ${t.muted}`}>Pending</p>
            <p className="text-3xl font-bold mt-1 text-yellow-500">
              {pendingCount}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-xs font-semibold ${t.muted}`}>Confirmed</p>
            <p className="text-3xl font-bold mt-1 text-green-500">
              {confirmedCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-2xl border ${t.card} ${t.border} p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center`}>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className={`text-xs font-semibold ${t.muted}`}>Doctor:</span>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
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

        {/* Appointments List */}
        {loading ? (
          <p className={`text-center py-10 text-sm ${t.muted}`}>
            Loading appointments...
          </p>
        ) : appointments.length === 0 ? (
          <div className={`rounded-2xl border ${t.card} ${t.border} p-10 text-center text-sm ${t.muted}`}>
            No appointments found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt._id}
                className={`rounded-2xl border ${t.card} ${t.border} p-5 flex flex-col md:flex-row justify-between gap-4`}
              >
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
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

                  <p className={`text-xs mt-1.5 ${t.muted}`}>
                    📞 {appt.clientPhone} • 📅 {appt.date} • 🕐 {appt.time}
                  </p>

                  <p className={`text-xs font-semibold mt-1.5 ${t.accentText}`}>
                    🩺 {appt.doctorId?.name || "Any Doctor"}
                  </p>

                  {appt.reason && (
                    <p className={`text-xs mt-2 ${t.muted}`}>
                      Reason: {appt.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {appt.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(appt._id, "confirmed")}
                        className="px-3.5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:opacity-90"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(appt._id, "cancelled")}
                        className="px-3.5 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:opacity-90"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusChange(appt._id, "completed")}
                      className={`px-3.5 py-2 ${t.accent} text-white rounded-xl text-xs font-bold hover:opacity-90`}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
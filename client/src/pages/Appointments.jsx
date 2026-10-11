import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchMyAppointments,
  updateAppointment,
} from "../features/appointment/appointmentSlice";
import toast from "react-hot-toast";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

const Appointments = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.appointment);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchMyAppointments(filter));
  }, [dispatch, filter]);

  const handleStatusChange = async (id, status) => {
    const res = await dispatch(updateAppointment({ id, status }));
    if (updateAppointment.fulfilled.match(res)) {
      toast.success(`Appointment ${status}`);
    } else {
      toast.error(res.payload);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          ← BookEasy
        </Link>
        <span className="text-sm text-gray-500">Appointments</span>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap ${
                  filter === s
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}

        {!loading && list.length === 0 && (
          <div className="bg-white p-12 rounded-2xl text-center text-gray-500">
            <p className="text-lg">Koi appointment nahi hai</p>
            <p className="text-sm mt-2">
              Apna booking link share karo clients ko
            </p>
          </div>
        )}

        <div className="space-y-3">
          {list.map((appt) => (
            <div
              key={appt._id}
              className="bg-white p-5 rounded-2xl shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{appt.clientName}</h3>
                  <p className="text-sm text-gray-500">📞 {appt.clientPhone}</p>
                  {appt.clientEmail && (
                    <p className="text-sm text-gray-500">
                      ✉️ {appt.clientEmail}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    statusColors[appt.status]
                  }`}
                >
                  {appt.status}
                </span>
              </div>

              <div className="flex gap-4 text-sm text-gray-700 mb-3">
                <span>📅 {appt.date}</span>
                <span>🕐 {appt.time}</span>
              </div>

              {appt.reason && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
                  <strong>Reason:</strong> {appt.reason}
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                {appt.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleStatusChange(appt._id, "confirmed")
                      }
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(appt._id, "cancelled")
                      }
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {appt.status === "confirmed" && (
                  <button
                    onClick={() =>
                      handleStatusChange(appt._id, "completed")
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
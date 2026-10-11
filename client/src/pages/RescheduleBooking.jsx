import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const RescheduleBooking = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [rescheduled, setRescheduled] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/public/manage/${token}`);
        setData(res.data);
        if (res.data.appointment.status === "cancelled") {
          setCancelled(true);
        }
      } catch (err) {
        toast.error("Appointment not found");
      }
    };
    load();
  }, [token]);

  const handleCancel = async () => {
    if (!window.confirm("Appointment cancel karna hai?")) return;
    setLoading(true);
    try {
      await api.post(`/public/manage/${token}/cancel`);
      setCancelled(true);
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      toast.error("Naya slot select karo");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/public/manage/${token}/reschedule`, {
        newSlotId: selectedSlot._id,
      });
      setRescheduled(res.data.appointment);
      toast.success("Rescheduled!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Appointment Cancelled</h1>
          <p className="text-gray-500">
            Aapka appointment cancel ho gaya hai
          </p>
        </div>
      </div>
    );
  }

  if (rescheduled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Rescheduled!</h1>
          <div className="bg-gray-50 p-4 rounded-xl my-4">
            <p>
              <strong>📅 Date:</strong> {rescheduled.date}
            </p>
            <p>
              <strong>🕐 Time:</strong> {rescheduled.time}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group slots by date
  const grouped = {};
  data.availableSlots.forEach((s) => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });
  const dates = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {data.business.name}
          </h1>
          <p className="text-gray-500">Manage your appointment</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="font-bold mb-3">Current Appointment</h2>
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p>
              <strong>📅 Date:</strong> {data.appointment.date}
            </p>
            <p>
              <strong>🕐 Time:</strong> {data.appointment.time}
            </p>
            <p>
              <strong>👤 Name:</strong> {data.appointment.clientName}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="font-bold mb-3">Reschedule to:</h2>

          {dates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Koi slot available nahi hai
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dates.map((date) => (
                <div key={date}>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {new Date(date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {grouped[date].map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setSelectedSlot(s)}
                        className={`p-2 rounded-lg border-2 text-sm font-medium ${
                          selectedSlot?._id === s._id
                            ? "border-primary bg-indigo-50"
                            : "border-gray-200"
                        }`}
                      >
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleReschedule}
            disabled={!selectedSlot || loading}
            className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Reschedule"}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="font-bold mb-3 text-red-500">Danger Zone</h2>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full border-2 border-red-500 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleBooking;
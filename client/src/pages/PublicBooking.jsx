import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const PublicBooking = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    reason: "",
  });
  // ✅ Custom fields ke liye state
  const [customData, setCustomData] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Load business + dates
  useEffect(() => {
    const load = async () => {
      try {
        const biz = await api.get(`/public/${slug}`);
        setBusiness(biz.data);

        const d = await api.get(`/public/${slug}/dates`);
        setDates(d.data);
      } catch (err) {
        toast.error("Business not found");
      }
    };
    load();
  }, [slug]);

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    const load = async () => {
      const res = await api.get(
        `/public/${slug}/slots?date=${selectedDate}`
      );
      setSlots(res.data);
    };
    load();
  }, [selectedDate, slug]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Slot select karo");
      return;
    }
    setLoading(true);
    try {
      // ✅ customData bhi bhejo
      const res = await api.post(`/public/${slug}/book`, {
        slotId: selectedSlot._id,
        ...form,
        customData,
      });
      setSuccess(res.data.appointment);
      toast.success("Booking confirmed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            {business.businessName} mein aapka appointment book ho gaya
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2 mb-6">
            <p>
              <strong>📅 Date:</strong> {success.date}
            </p>
            <p>
              <strong>🕐 Time:</strong> {success.time}
            </p>
            <p>
              <strong>👤 Name:</strong> {success.clientName}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Confirmation email bhej diya gaya hai
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {business.businessName}
          </h1>
          {business.tagline && (
            <p className="text-gray-600 mb-3">{business.tagline}</p>
          )}
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            {business.address && <span>📍 {business.address}</span>}
            {business.phone && <span>📞 {business.phone}</span>}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`flex-1 h-2 rounded-full ${
              step >= 1 ? "bg-primary" : "bg-gray-200"
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full ${
              step >= 2 ? "bg-primary" : "bg-gray-200"
            }`}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          {/* STEP 1: Date + Time */}
          {step === 1 && (
            <>
              {/* Staff selection (agar multiple staff hain) */}
              {business.staff && business.staff.length > 0 && (
                <>
                  <h2 className="text-xl font-bold mb-4">Select Staff</h2>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null);
                        setSelectedDate("");
                        setSelectedSlot(null);
                      }}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        !selectedStaff
                          ? "border-primary bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-bold text-sm">Any Available</div>
                    </button>
                    {business.staff.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(s._id);
                          setSelectedDate("");
                          setSelectedSlot(null);
                        }}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          selectedStaff === s._id
                            ? "border-primary bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-bold text-sm">
                          {s.staffTitle} {s.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-xl font-bold mb-4">Select Date</h2>

              {dates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Abhi koi slot available nahi hai
                </p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                  {dates.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        selectedDate === d.date
                          ? "border-primary bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-bold text-sm">
                        {new Date(d.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {d.count} slots
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedDate && (
                <>
                  <h2 className="text-xl font-bold mb-4">Select Time</h2>
                  {slots.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Is din koi slot nahi hai
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                      {slots.map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`p-3 rounded-xl border-2 text-center transition ${
                            selectedSlot?._id === s._id
                              ? "border-primary bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-bold text-sm">
                            {s.startTime}
                          </div>
                          {s.staffId?.name && (
                            <div className="text-xs text-gray-500">
                              {s.staffId.name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(2)}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Next
              </button>
            </>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <form onSubmit={handleBook}>
              <h2 className="text-xl font-bold mb-4">
                Your Details
              </h2>

              <div className="bg-indigo-50 p-3 rounded-xl mb-4 text-sm">
                📅 {selectedDate} at 🕐 {selectedSlot?.startTime}
                {selectedSlot?.staffId?.name && (
                  <> with 👨‍⚕️ {selectedSlot.staffId.name}</>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={`${business.labels?.clientLabel || "Your"} Name *`}
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm({ ...form, clientPhone: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.clientEmail}
                  onChange={(e) =>
                    setForm({ ...form, clientEmail: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />

                {/* ✅ Custom Fields — YAHAN RENDER HO RAHE HAIN */}
                {business.customFields && business.customFields.length > 0 && (
                  <>
                    {business.customFields.map((field) => (
                      <div key={field.key}>
                        {field.type === "textarea" ? (
                          <textarea
                            placeholder={
                              field.label + (field.required ? " *" : "")
                            }
                            value={customData[field.key] || ""}
                            onChange={(e) =>
                              setCustomData({
                                ...customData,
                                [field.key]: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            rows={3}
                            required={field.required}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={customData[field.key] || ""}
                            onChange={(e) =>
                              setCustomData({
                                ...customData,
                                [field.key]: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required={field.required}
                          >
                            <option value="">
                              {field.label} {field.required && "*"}
                            </option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            placeholder={
                              field.label + (field.required ? " *" : "")
                            }
                            value={customData[field.key] || ""}
                            onChange={(e) =>
                              setCustomData({
                                ...customData,
                                [field.key]: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}

                <textarea
                  placeholder="Reason (optional)"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
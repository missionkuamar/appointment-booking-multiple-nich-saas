// pages/PublicBooking.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const PublicBooking = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
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
  const [customData, setCustomData] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [success, setSuccess] = useState(null);

  // 1. Load business + doctors
  useEffect(() => {
    const load = async () => {
      console.log("🚀 [PublicBooking] Fetching business for slug:", slug);
      try {
        const biz = await api.get(`/public/${slug}`);
        console.log("✅ [PublicBooking] Business Data:", biz.data);
        setBusiness(biz.data);
        setDoctors(biz.data.doctors || []);
      } catch (err) {
        console.error("❌ [PublicBooking] Business load error:", err);
        toast.error("Business not found");
      }
    };
    load();
  }, [slug]);

  // 2. Load dates when doctor selected (or "Any")
  useEffect(() => {
    if (!business) return;
    
    const load = async () => {
      setLoadingDates(true);
      setSelectedDate("");
      setSelectedSlot(null);
      setSlots([]);

      try {
        const params = {};
        // 🔴 FIX: Ensure doctorId is only added if a doctor is actually selected
        if (selectedDoctor && selectedDoctor._id) {
          params.doctorId = selectedDoctor._id;
        }

        console.log("📡 [PublicBooking] Fetching dates with params:", params);
        const res = await api.get(`/public/${slug}/dates`, { params });
        console.log("✅ [PublicBooking] Raw Dates Response:", res.data);

        // Normalize response
        const rawList = Array.isArray(res.data) ? res.data : res.data?.dates || res.data?.data || [];
        const normalizedDates = rawList.map((item) =>
          typeof item === "string"
            ? { date: item, count: null }
            : { date: item.date || item._id, count: item.count ?? null }
        );

        console.log("📅 [PublicBooking] Normalized Dates:", normalizedDates);
        setDates(normalizedDates);

        // Auto-select first date if available
        if (normalizedDates.length > 0) {
          setSelectedDate(normalizedDates[0].date);
        }
      } catch (err) {
        console.error("❌ [PublicBooking] Dates fetch error:", err.response?.data || err);
        setDates([]);
      } finally {
        setLoadingDates(false);
      }
    };
    load();
  }, [selectedDoctor, slug, business]);

  // 3. Load slots when date + doctor selected
  useEffect(() => {
    if (!selectedDate) return;
    
    const load = async () => {
      setLoadingSlots(true);
      try {
        const params = { date: selectedDate };
        // 🔴 FIX: Ensure doctorId is only added if a doctor is actually selected
        if (selectedDoctor && selectedDoctor._id) {
          params.doctorId = selectedDoctor._id;
        }

        console.log("📡 [PublicBooking] Fetching slots with params:", params);
        const res = await api.get(`/public/${slug}/slots`, { params });
        console.log("✅ [PublicBooking] Raw Slots Response:", res.data);

        const slotList = Array.isArray(res.data) ? res.data : res.data?.slots || res.data?.data || [];
        setSlots(slotList);
        setSelectedSlot(null);
      } catch (err) {
        console.error("❌ [PublicBooking] Slots fetch error:", err.response?.data || err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    load();
  }, [selectedDate, selectedDoctor, slug]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Slot select karo");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        slotId: selectedSlot._id,
        doctorId: selectedDoctor?._id || selectedSlot.doctorId?._id || selectedSlot.doctorId,
        ...form,
        customData,
      };
      console.log("📤 [PublicBooking] Booking payload:", payload);
      const res = await api.post(`/public/${slug}/book`, payload);
      console.log("🎉 [PublicBooking] Booking Success:", res.data);
      setSuccess(res.data.appointment || res.data);
      toast.success("Booking confirmed!");
    } catch (err) {
      console.error("❌ [PublicBooking] Booking failed:", err.response?.data || err);
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
    const manageUrl = `${window.location.origin}/manage/${success.cancelToken}`;
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
            {(selectedDoctor || selectedSlot?.doctorId?.name) && (
              <p>
                <strong>🩺 Doctor:</strong>{" "}
                {selectedDoctor?.name || selectedSlot?.doctorId?.name}
              </p>
            )}
          </div>
          {success.cancelToken && (
            <a
              href={manageUrl}
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Manage Appointment
            </a>
          )}
          <p className="text-sm text-gray-500 mt-4">
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
          {/* STEP 1: Doctor + Date + Time */}
          {step === 1 && (
            <>
              {/* Doctor selection */}
              {doctors.length > 0 && (
                <>
                  <h2 className="text-xl font-bold mb-4">Select Doctor</h2>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        !selectedDoctor
                          ? "border-primary bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-bold text-sm">Any Available</div>
                      <div className="text-xs text-gray-500">Fastest slot</div>
                    </button>
                    {doctors.map((doc) => (
                      <button
                        key={doc._id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          selectedDoctor?._id === doc._id
                            ? "border-primary bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-bold text-sm">{doc.name}</div>
                        {doc.specialization && (
                          <div className="text-xs text-gray-500">
                            {doc.specialization}
                          </div>
                        )}
                        {doc.consultationFee > 0 && (
                          <div className="text-xs text-primary mt-1">
                            ₹{doc.consultationFee}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-xl font-bold mb-4">Select Date</h2>

              {loadingDates ? (
                <p className="text-gray-500 text-center py-6">
                  Loading available dates...
                </p>
              ) : dates.length === 0 ? (
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
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      {d.count !== null && (
                        <div className="text-xs text-gray-500">
                          {d.count} slots
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedDate && (
                <>
                  <h2 className="text-xl font-bold mb-4">Select Time</h2>
                  {loadingSlots ? (
                    <p className="text-gray-500 text-center py-4">
                      Loading slots...
                    </p>
                  ) : slots.length === 0 ? (
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
                          {s.doctorId?.name && (
                            <div className="text-xs text-gray-500">
                              {s.doctorId.name}
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
              <h2 className="text-xl font-bold mb-4">Your Details</h2>

              <div className="bg-indigo-50 p-3 rounded-xl mb-4 text-sm">
                📅 {selectedDate} at 🕐 {selectedSlot?.startTime}
                {selectedDoctor && <> with 🩺 {selectedDoctor.name}</>}
                {!selectedDoctor && selectedSlot?.doctorId?.name && (
                  <> with 🩺 {selectedSlot.doctorId.name}</>
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

                {/* Custom Fields */}
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
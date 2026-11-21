import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DoctorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const business = useSelector((state) => state.business?.data);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [businessSlug, setBusinessSlug] = useState(() => {
    return (
      business?.slug ||
      user?.businessSlug ||
      localStorage.getItem("business-slug") ||
      ""
    );
  });

  useEffect(() => {
    const foundSlug = business?.slug || user?.businessSlug;
    if (foundSlug) {
      setBusinessSlug(foundSlug);
      localStorage.setItem("business-slug", foundSlug);
    }
  }, [business?.slug, user?.businessSlug]);

  // Walk-in Modal State
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [selectedWalkInSlot, setSelectedWalkInSlot] = useState(null);
  const [walkInForm, setWalkInForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    reason: "Walk-in / Emergency",
  });
  const [customData, setCustomData] = useState({});

  // Doctor Slot Generator Modal State
  const [showGenerateSlots, setShowGenerateSlots] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [slotConfig, setSlotConfig] = useState({
    weeksAhead: 2,
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    startTime: "09:00",
    endTime: "17:00",
    duration: 30,
    bufferTime: 0,
  });

  const todayStr = new Date().toLocaleDateString("en-CA");

  const fetchScheduleData = async (dateToFetch = "") => {
    setLoading(true);
    const url = dateToFetch
      ? `/slots/my-schedule?date=${dateToFetch}`
      : `/slots/my-schedule`;

    try {
      const res = await api.get(url);

      if (Array.isArray(res.data)) {
        setSchedule(res.data);
      } else {
        const list = res.data?.schedule || [];
        const dates = res.data?.availableDates || [];
        const active = res.data?.activeDate || dateToFetch || todayStr;

        const incomingSlug =
          res.data?.businessSlug ||
          res.data?.slug ||
          res.data?.business?.slug ||
          "";
        if (incomingSlug) {
          setBusinessSlug(incomingSlug);
          localStorage.setItem("business-slug", incomingSlug);
        }

        setSchedule(list);
        setAvailableDates(dates);
        if (!dateToFetch) {
          setSelectedDate(active);
        }

        const firstFree = (Array.isArray(list) ? list : []).find(
          (s) => !s.isBooked
        );
        setSelectedWalkInSlot(firstFree || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchScheduleData();
  }, [user?._id || user?.id]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    fetchScheduleData(newDate);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleStatusUpdate = async (apptId, newStatus) => {
    const endpoint = `/appointments/bydoctor/${apptId}`;
    try {
      await api.patch(endpoint, { status: newStatus });
      toast.success("Status updated");

      setSchedule((prev) =>
        prev.map((s) => {
          if (s.patient && s.patient.id === apptId) {
            return { ...s, patient: { ...s.patient, status: newStatus } };
          }
          return s;
        })
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const toggleDay = (day) => {
    setSlotConfig((prev) => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      };
    });
  };

  const handleGenerateMySlots = async (e) => {
    e.preventDefault();
    if (slotConfig.days.length === 0) {
      return toast.error("Kam se kam ek day select karein");
    }

    setGeneratingSlots(true);
    try {
      const res = await api.post("/slots/my-generate", slotConfig);
      toast.success(res.data?.message || "Slots generated!");
      setShowGenerateSlots(false);
      await fetchScheduleData(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate slots");
    } finally {
      setGeneratingSlots(false);
    }
  };

  const openWalkInModal = () => {
    const firstFreeSlot = (Array.isArray(schedule) ? schedule : []).find(
      (s) => !s.isBooked
    );
    setSelectedWalkInSlot(firstFreeSlot || null);
    setWalkInForm({
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      reason: "Walk-in / Emergency",
    });
    setCustomData({});
    setShowWalkIn(true);
  };

  const resolveBusinessSlug = async () => {
    if (businessSlug) return businessSlug;
    const stored =
      business?.slug ||
      user?.businessSlug ||
      localStorage.getItem("business-slug");
    if (stored) {
      setBusinessSlug(stored);
      localStorage.setItem("business-slug", stored);
      return stored;
    }
    try {
      const res = await api.get(
        selectedDate
          ? `/slots/my-schedule?date=${selectedDate}`
          : `/slots/my-schedule`
      );
      const fetched =
        res.data?.businessSlug ||
        res.data?.slug ||
        res.data?.business?.slug ||
        "";
      if (fetched) {
        setBusinessSlug(fetched);
        localStorage.setItem("business-slug", fetched);
        return fetched;
      }
    } catch (_) {}
    return "";
  };

  const handleWalkInBook = async (e) => {
    e.preventDefault();

    const slotId = selectedWalkInSlot?.slotId || selectedWalkInSlot?._id;
    if (!slotId) {
      toast.error("Slot select karo");
      return;
    }

    if (!walkInForm.clientName.trim() || !walkInForm.clientPhone.trim()) {
      toast.error("Name and Phone required");
      return;
    }

    const activeSlug = await resolveBusinessSlug();
    if (!activeSlug) {
      toast.error("Business slug not found");
      return;
    }

    setSubmittingWalkIn(true);
    try {
      const doctorId =
        selectedWalkInSlot?.doctorId?._id ||
        selectedWalkInSlot?.doctorId ||
        user?.doctorId ||
        user?._id ||
        user?.id;

      const payload = {
        slotId,
        doctorId,
        date: selectedDate || selectedWalkInSlot?.date || todayStr,
        ...walkInForm,
        customData,
      };

      await api.post(`/public/${activeSlug}/book`, payload);
      toast.success("Booking confirmed!");
      setShowWalkIn(false);
      setSelectedWalkInSlot(null);
      setWalkInForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        reason: "Walk-in / Emergency",
      });
      setCustomData({});

      await fetchScheduleData(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const safeSchedule = Array.isArray(schedule) ? schedule : [];
  const freeSlots = safeSchedule.filter((s) => !s.isBooked);
  const totalSlots = safeSchedule.length;
  const bookedSlots = safeSchedule.filter((s) => s.isBooked).length;
  const pendingApprovals = safeSchedule.filter(
    (s) => s.patient?.status === "pending"
  ).length;

  return (
    <div
      className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}
    >
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user ? { ...user, name: `Dr. ${user.name}` } : user}
        handleLogout={handleLogout}
      />

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${t.text}`}>Your Schedule</h2>
            <p className={`text-sm ${t.muted}`}>
              Manage your daily appointments and slots
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${t.card} ${t.border} flex items-center gap-2`}
            >
              <span className={`text-sm font-medium ${t.muted}`}>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`p-1.5 rounded-lg border ${t.border} ${t.soft} ${t.text} outline-none text-sm font-medium`}
              />
            </div>

            <button
              onClick={() => setShowGenerateSlots(true)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${t.border} ${t.card} ${t.text} ${t.hover}`}
            >
              + Generate Slots
            </button>

            {/* <button
              onClick={openWalkInModal}
              className={`${t.accent} text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90`}
            >
              + Walk-in
            </button> */}
          </div>
        </div>

        {/* Available Dates Pills */}
        {availableDates.length > 0 && (
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase mb-2 ${t.muted}`}>
              Available Dates ({availableDates.length})
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableDates.slice(0, 15).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDateChange(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
                    selectedDate === d
                      ? `${t.selected} border-transparent`
                      : `${t.card} ${t.border} ${t.text} ${t.hover}`
                  }`}
                >
                  {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-sm font-medium ${t.muted}`}>Total Slots</p>
            <p className={`text-3xl font-bold mt-1 ${t.text}`}>{totalSlots}</p>
          </div>

          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-sm font-medium ${t.muted}`}>Booked Patients</p>
            <p className={`text-3xl font-bold mt-1 ${t.accentText}`}>
              {bookedSlots}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${t.card} ${t.border}`}>
            <p className={`text-sm font-medium ${t.muted}`}>Pending Approvals</p>
            <p className="text-3xl font-bold mt-1 text-yellow-500">
              {pendingApprovals}
            </p>
          </div>
        </div>

        {/* Doctor Slot Generator Modal */}
        {showGenerateSlots && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleGenerateMySlots}
              className={`rounded-2xl border ${t.card} ${t.border} p-6 w-full max-w-md space-y-4`}
            >
              <h3 className={`text-lg font-bold ${t.text}`}>
                Generate My Slots
              </h3>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${t.muted}`}>
                  Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = slotConfig.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          active
                            ? `${t.selected} border-transparent`
                            : `${t.soft} ${t.border} ${t.text}`
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={slotConfig.startTime}
                    onChange={(e) =>
                      setSlotConfig({ ...slotConfig, startTime: e.target.value })
                    }
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={slotConfig.endTime}
                    onChange={(e) =>
                      setSlotConfig({ ...slotConfig, endTime: e.target.value })
                    }
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    Slot (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={slotConfig.duration}
                    onChange={(e) =>
                      setSlotConfig({ ...slotConfig, duration: e.target.value })
                    }
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    Buffer (mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={slotConfig.bufferTime}
                    onChange={(e) =>
                      setSlotConfig({
                        ...slotConfig,
                        bufferTime: e.target.value,
                      })
                    }
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    Weeks Ahead
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={slotConfig.weeksAhead}
                    onChange={(e) =>
                      setSlotConfig({
                        ...slotConfig,
                        weeksAhead: e.target.value,
                      })
                    }
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm`}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateSlots(false)}
                  className={`flex-1 py-2.5 rounded-lg border ${t.border} ${t.soft} ${t.text} text-sm font-semibold`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingSlots}
                  className={`flex-1 py-2.5 rounded-lg ${t.accent} text-white text-sm font-semibold disabled:opacity-50`}
                >
                  {generatingSlots ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Walk-in Booking Modal */}
        {showWalkIn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleWalkInBook}
              className={`rounded-2xl border ${t.card} ${t.border} p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}
            >
              <h2 className={`text-xl font-bold mb-3 ${t.text}`}>
                Your Details (Walk-in)
              </h2>

              <div
                className={`p-3 rounded-xl mb-4 text-sm border ${t.border} ${t.soft} ${t.text}`}
              >
                📅 {selectedDate || todayStr} at 🕐{" "}
                {selectedWalkInSlot?.startTime || "Select a slot"}
                {selectedWalkInSlot?.doctorId?.name ? (
                  <> with 🩺 {selectedWalkInSlot.doctorId.name}</>
                ) : user?.name ? (
                  <> with 🩺 Dr. {user.name}</>
                ) : null}
              </div>

              <div className="mb-4">
                <label className={`block text-xs font-semibold mb-1.5 ${t.muted}`}>
                  Select Date *
                </label>
                <input
                  type="date"
                  value={selectedDate || todayStr}
                  onChange={async (e) => {
                    const newDate = e.target.value;
                    setSelectedDate(newDate);
                    setSelectedWalkInSlot(null);
                    await fetchScheduleData(newDate);
                  }}
                  className={`w-full px-4 py-2.5 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium`}
                  required
                />

                {availableDates.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2 pb-1">
                    {availableDates.slice(0, 10).map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={async () => {
                          setSelectedDate(d);
                          setSelectedWalkInSlot(null);
                          await fetchScheduleData(d);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition ${
                          selectedDate === d
                            ? `${t.selected} border-transparent`
                            : `${t.card} ${t.border} ${t.text} ${t.hover}`
                        }`}
                      >
                        {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className={`text-xs font-semibold mb-2 ${t.muted}`}>
                  Select Free Slot *
                </p>
                {freeSlots.length === 0 ? (
                  <p className="text-xs text-red-500">
                    No free slots available for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-28 overflow-y-auto">
                    {freeSlots.map((slot) => {
                      const isSelected =
                        (selectedWalkInSlot?.slotId || selectedWalkInSlot?._id) ===
                        (slot.slotId || slot._id);
                      return (
                        <button
                          type="button"
                          key={slot.slotId || slot._id}
                          onClick={() => setSelectedWalkInSlot(slot)}
                          className={`p-2 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? `${t.selected} border-transparent`
                              : `${t.soft} ${t.border} ${t.text} ${t.hover}`
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={`${business?.labels?.clientLabel || "Your"} Name *`}
                  value={walkInForm.clientName}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, clientName: e.target.value })
                  }
                  className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  required
                />

                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={walkInForm.clientPhone}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, clientPhone: e.target.value })
                  }
                  className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  required
                />

                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={walkInForm.clientEmail}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, clientEmail: e.target.value })
                  }
                  className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                />

                {business?.customFields && business.customFields.length > 0 && (
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
                            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
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
                            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
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
                            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}

                <textarea
                  placeholder="Reason (optional)"
                  value={walkInForm.reason}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, reason: e.target.value })
                  }
                  className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWalkIn(false)}
                  className={`px-6 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg font-semibold ${t.hover} text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWalkIn || freeSlots.length === 0}
                  className={`flex-1 ${t.accent} text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 text-sm`}
                >
                  {submittingWalkIn ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slots List */}
        <div
          className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}
        >
          <div className={`p-4 border-b ${t.border} ${t.soft}`}>
            <h3 className={`font-bold ${t.text}`}>
              {selectedDate === todayStr
                ? "Today's Schedule"
                : selectedDate
                ? `Schedule for ${new Date(
                    selectedDate + "T00:00:00"
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : "Schedule"}
            </h3>
          </div>

          <div className="p-5">
            {loading ? (
              <p className={`text-center py-6 text-sm ${t.muted}`}>
                Loading schedule...
              </p>
            ) : safeSchedule.length === 0 ? (
              <div className="text-center py-10">
                <p className={`font-medium ${t.muted}`}>
                  No slots generated for this date.
                </p>
                <p className={`text-xs mt-1 ${t.muted}`}>
                  {availableDates.length > 0
                    ? `Select an available date above (e.g. ${availableDates[0]}).`
                    : "Click '+ Generate Slots' above to create your schedule."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeSchedule.map((slot) => (
                  <div
                    key={slot.slotId}
                    className={`p-4 rounded-xl border ${t.border} ${
                      slot.isBooked ? t.soft : t.card
                    } flex flex-col sm:flex-row justify-between sm:items-center gap-3`}
                  >
                    <div className="min-w-[130px]">
                      <span className={`font-bold text-sm ${t.text}`}>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    {slot.isBooked && slot.patient ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold text-sm ${t.text}`}>
                            {slot.patient.name}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              slot.patient.status === "confirmed"
                                ? "bg-green-500/15 text-green-500"
                                : slot.patient.status === "completed"
                                ? "bg-blue-500/15 text-blue-500"
                                : "bg-yellow-500/15 text-yellow-500"
                            }`}
                          >
                            {slot.patient.status}
                          </span>
                        </div>

                        <p className={`text-xs mt-1 ${t.muted}`}>
                          📞 {slot.patient.phone}
                          {slot.patient.reason ? ` • ${slot.patient.reason}` : ""}
                        </p>
                      </div>
                    ) : (
                      <div className={`flex-1 text-sm ${t.muted}`}>
                        Available
                      </div>
                    )}

                    {slot.isBooked && slot.patient && (
                      <div className="flex gap-2">
                        {slot.patient.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(slot.patient.id, "confirmed")
                            }
                            className={`${t.accent} text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90`}
                          >
                            Confirm
                          </button>
                        )}
                        {slot.patient.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(slot.patient.id, "completed")
                            }
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
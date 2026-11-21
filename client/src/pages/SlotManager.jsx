import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  generateSlots,
  fetchMySlots,
  clearSlots,
} from "../features/slot/slotSlice";
import { fetchMyDoctors } from "../features/doctor/doctorSlice";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS_LIST = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12

const SlotManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { slots, grouped, loading, error } = useSelector((state) => state.slot);
  const { list: doctors } = useSelector((state) => state.doctor);
  const { user } = useSelector((state) => state.auth);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [form, setForm] = useState({
    days: [],
    startTime: "09:00",
    endTime: "12:00",
    duration: 30,
    bufferTime: 0,
    weeksAhead: 4, // Week 1 to Week 12
  });

  useEffect(() => {
    dispatch(fetchMyDoctors());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDoctorId) {
      dispatch(fetchMySlots({ doctorId: selectedDoctorId }));
    }
  }, [dispatch, selectedDoctorId]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const updatedDays = prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day];
      return { ...prev, days: updatedDays };
    });
  };

  const handleGenerate = async () => {
    if (!selectedDoctorId) {
      return toast.error("Pehle Doctor select karo!");
    }
    if (!form.days.length) {
      return toast.error("Kam se kam ek din select karo");
    }

    const payload = { ...form, doctorId: selectedDoctorId };
    const res = await dispatch(generateSlots(payload));

    if (generateSlots.fulfilled.match(res)) {
      toast.success(res.payload.message || "Slots generated!");
      dispatch(fetchMySlots({ doctorId: selectedDoctorId }));
    } else {
      toast.error(res.payload || "Generate failed");
    }
  };

  const handleClear = async () => {
    if (!selectedDoctorId) {
      return toast.error("Pehle Doctor select karo!");
    }
    if (!window.confirm("Is doctor ke saare unbooked future slots delete karne hain?")) {
      return;
    }

    const res = await dispatch(clearSlots({ doctorId: selectedDoctorId }));

    if (clearSlots.fulfilled.match(res)) {
      toast.success(res.payload.message || "Slots cleared!");
      dispatch(fetchMySlots({ doctorId: selectedDoctorId }));
    } else {
      toast.error(res.payload || "Clear failed");
    }
  };

  const sortedDates = Object.keys(grouped || {}).sort();

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        
        {/* Page Title & Back Link */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>Slot Manager</h1>
            <p className={`text-sm ${t.muted}`}>
              Generate week-wise slots for doctors (Week 1 to Week 12)
            </p>
          </div>
          <Link
            to="/dashboard"
            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${t.border} ${t.card} ${t.text} ${t.hover}`}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-500 p-3 rounded-xl mb-4 text-sm">
            ⚠️ Error: {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        )}

        {/* Doctor Selector */}
        <div className={`p-5 md:p-6 rounded-2xl border ${t.card} ${t.border} mb-6`}>
          <label className={`block text-sm font-bold mb-2 ${t.text}`}>
            Select Doctor to Manage Slots
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm font-medium outline-none`}
          >
            <option value="">-- Choose Doctor --</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name} ({doc.specialization || "General"})
              </option>
            ))}
          </select>

          {doctors.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Koi doctor nahi mila. Pehle{" "}
              <Link to="/doctors" className={`underline font-semibold ${t.accentText}`}>
                Doctors page
              </Link>{" "}
              se doctor add karo.
            </p>
          )}
        </div>

        {/* Generator Card */}
        {selectedDoctorId && (
          <div className={`p-5 md:p-6 rounded-2xl border ${t.card} ${t.border} mb-6`}>
            <h2 className={`text-lg font-bold mb-4 ${t.text}`}>
              Generate Week-wise Slots
            </h2>

            {/* Days Selector */}
            <div className="mb-5">
              <label className={`block text-xs font-semibold mb-2 ${t.muted}`}>
                Select Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                      form.days.includes(d)
                        ? `${t.selected} border-transparent`
                        : `${t.soft} ${t.border} ${t.text} ${t.hover}`
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time & Slot Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  End Time
                </label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Duration
                </label>
                <select
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: Number(e.target.value) })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs outline-none`}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Buffer Time
                </label>
                <select
                  value={form.bufferTime}
                  onChange={(e) =>
                    setForm({ ...form, bufferTime: Number(e.target.value) })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs outline-none`}
                >
                  <option value={0}>No Buffer</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Weeks (Week 1 - 12)
                </label>
                <select
                  value={form.weeksAhead}
                  onChange={(e) =>
                    setForm({ ...form, weeksAhead: Number(e.target.value) })
                  }
                  className={`w-full px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs font-semibold outline-none`}
                >
                  {WEEKS_LIST.map((weekNum) => (
                    <option key={weekNum} value={weekNum}>
                      Week {weekNum}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`flex-1 ${t.accent} text-white py-3 px-4 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50`}
              >
                {loading ? "Generating..." : "Generate Slots"}
              </button>

              {slots.length > 0 && (
                <button
                  onClick={handleClear}
                  className="px-5 py-3 border border-red-500/40 text-red-500 bg-red-500/10 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Existing Slots List */}
        {selectedDoctorId && (
          <div className={`p-5 md:p-6 rounded-2xl border ${t.card} ${t.border}`}>
            <h2 className={`text-lg font-bold mb-4 ${t.text}`}>
              Doctor's Slots ({slots.length})
            </h2>

            {sortedDates.length === 0 ? (
              <p className={`text-center py-8 text-sm ${t.muted}`}>
                Is doctor ke abhi koi slots nahi hain. Upar se generate karo.
              </p>
            ) : (
              <div className="space-y-4">
                {sortedDates.map((date) => (
                  <div
                    key={date}
                    className={`border ${t.border} ${t.soft} rounded-xl p-4`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`font-bold text-sm ${t.text}`}>
                        {new Date(date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </h3>
                      <span className={`text-xs px-2.5 py-1 rounded-md border ${t.border} ${t.card} ${t.muted}`}>
                        {grouped[date].length} slots
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {grouped[date].map((slot) => (
                        <span
                          key={slot._id}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            slot.isBooked
                              ? "bg-red-500/15 text-red-500 border border-red-500/30"
                              : slot.isBlocked
                              ? "bg-gray-500/15 text-gray-500 line-through"
                              : "bg-green-500/15 text-green-500 border border-green-500/30"
                          }`}
                        >
                          {slot.startTime}
                          {slot.isBooked && " 🔒"}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotManager;
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  generateSlots,
  fetchMySlots,
  clearSlots,
} from "../features/slot/slotSlice";
import toast from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SlotManager = () => {
  const dispatch = useDispatch();
  const { slots, grouped, loading } = useSelector((state) => state.slot);
  const [form, setForm] = useState({
    days: [],
    startTime: "09:00",
    endTime: "12:00",
    duration: 30,
    weeksAhead: 4,
  });

  useEffect(() => {
    dispatch(fetchMySlots());
  }, [dispatch]);

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleGenerate = async () => {
    if (!form.days.length) {
      toast.error("Kam se kam ek din select karo");
      return;
    }

    const res = await dispatch(generateSlots(form));
    if (generateSlots.fulfilled.match(res)) {
      toast.success(res.payload.message);
      dispatch(fetchMySlots());
    } else {
      toast.error(res.payload);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Saare unbooked future slots delete karne hain?")) return;
    const res = await dispatch(clearSlots());
    if (clearSlots.fulfilled.match(res)) {
      toast.success(res.payload.message);
    }
  };

  // Group slots by date with proper sorting
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          ← BookEasy
        </Link>
        <span className="text-sm text-gray-500">Slot Manager</span>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Generator Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-4">Generate Slots</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    form.days.includes(d)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (min)
              </label>
              <select
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Weeks Ahead
              </label>
              <select
                value={form.weeksAhead}
                onChange={(e) =>
                  setForm({ ...form, weeksAhead: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={1}>1 week</option>
                <option value={2}>2 weeks</option>
                <option value={4}>4 weeks</option>
                <option value={8}>8 weeks</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Slots"}
            </button>
            {slots.length > 0 && (
              <button
                onClick={handleClear}
                className="px-6 py-3 border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Existing Slots */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">
            Your Slots ({slots.length})
          </h2>

          {sortedDates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Abhi koi slot nahi hai. Upar se generate karo.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date} className="border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {grouped[date].length} slots
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grouped[date].map((slot) => (
                      <span
                        key={slot._id}
                        className={`px-3 py-1 rounded-full text-sm ${
                          slot.isBooked
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
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
      </div>
    </div>
  );
};

export default SlotManager;
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMyDoctors,
  addDoctor,
  deleteDoctor,
  updateDoctor,
} from "../features/doctor/doctorSlice";
import { fetchSubscriptionStatus } from "../features/subscription/subscriptionSlice";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = [
  { label: "All Weeks (Every Week)", value: "all" },
  { label: "Week 1", value: "1" },
  { label: "Week 2", value: "2" },
  { label: "Week 3", value: "3" },
  { label: "Week 4", value: "4" },
];

export default function DoctorManager() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.doctor);
  const { user } = useSelector((s) => s.auth);
  const { plan, status } = useSelector((s) => s.subscription || {});

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    qualification: "",
    consultationFee: 0,
    availability: [],
  });

  const [newAvail, setNewAvail] = useState({
    week: "all",
    day: "Mon",
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    bufferTime: 0,
  });

  useEffect(() => {
    dispatch(fetchMyDoctors());
    dispatch(fetchSubscriptionStatus());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const handleAddAvailability = () => {
    const exists = form.availability.find(
      (a) => (a.week || "all") === newAvail.week && a.day === newAvail.day
    );

    if (!exists) {
      setForm({ ...form, availability: [...form.availability, newAvail] });
    } else {
      toast.error(
        `Week (${newAvail.week === "all" ? "All" : "W" + newAvail.week}) - ${
          newAvail.day
        } ki availability pehle se added hai!`
      );
    }
  };

  const handleRemoveAvail = (weekToRemove, dayToRemove) => {
    setForm({
      ...form,
      availability: form.availability.filter(
        (a) => !((a.week || "all") === weekToRemove && a.day === dayToRemove)
      ),
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      specialization: "",
      qualification: "",
      consultationFee: 0,
      availability: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.specialization) {
      toast.error("Staff ka naam aur specialization zaroori hai! Nhi tho kuch bhi likh do ");
      return;
    }

    if (form.availability.length === 0) {
      toast.error("Kam se kam ek din ki availability set karo!");
      return;
    }

    if (editingId) {
      const res = await dispatch(updateDoctor({ id: editingId, ...form }));
      if (updateDoctor.fulfilled.match(res)) {
        toast.success("Staff updated!");
        resetForm();
      } else {
        toast.error(res.payload || "Update failed");
      }
    } else {
      const res = await dispatch(addDoctor(form));
      if (addDoctor.fulfilled.match(res)) {
        toast.success("Staff added!");
        resetForm();
      } else {
        toast.error(res.payload || "Failed to add Staff");
      }
    }
  };

  const startEdit = (doc) => {
    setForm({
      name: doc.name,
      email: doc.email || "",
      password: "",
      specialization: doc.specialization,
      qualification: doc.qualification,
      consultationFee: doc.consultationFee,
      availability: (doc.availability || []).map((a) => ({
        ...a,
        week: a.week || "all",
      })),
    });
    setEditingId(doc._id);
    setShowForm(true);
  };

  const getWeekBadge = (week) => {
    if (!week || week === "all") return "Every Week";
    return `Week ${week}`;
  };

  const activePlanName = (plan || "free").toUpperCase();

  return (
    <div
      className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}
    >
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className={`text-2xl font-bold ${t.text}`}>
                Staff Management
              </h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                  status === "active"
                    ? "bg-indigo-500/15 text-indigo-500"
                    : `${t.soft} ${t.muted}`
                }`}
              >
                Plan: {activePlanName}
              </span>
            </div>
            <p className={`text-sm mt-1 ${t.muted}`}>
              Add Staff and configure their Week 1 to Week 4 schedules
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/subscription"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${t.border} ${t.card} ${t.text} ${t.hover} transition`}
            >
              💳 Subscription ({activePlanName})
            </Link>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className={`${
                showForm ? "bg-red-500" : t.accent
              } text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition`}
            >
              {showForm ? "Cancel" : "+ Add Staff"}
            </button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className={`rounded-2xl border ${t.card} ${t.border} p-5 md:p-6 mb-6 space-y-5`}
          >
            <h2 className={`text-lg font-bold ${t.text}`}>
              {editingId ? "Edit Staff Details" : "Add New Staff"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Staff Name *
                </label>
                <input
                  type="text"
                  placeholder="Mr Rahul Sharma"
                  className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="your@gmail.com"
                  className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none disabled:opacity-60`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingId}
                  required
                />
              </div>

              {!editingId && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Specialization *
                </label>
                <input
                  type="text"
                  placeholder="Cardiologist, or Put any thing"
                  className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  value={form.specialization}
                  onChange={(e) =>
                    setForm({ ...form, specialization: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Qualification
                </label>
                <input
                  type="text"
                  placeholder="MBBS , Put any things"
                  className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  value={form.qualification}
                  onChange={(e) =>
                    setForm({ ...form, qualification: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="Please Enter Staff Amount"
                  className={`w-full p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  value={form.consultationFee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      consultationFee: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Availability Section with Week 1 - Week 4 */}
            <div className={`border-t ${t.border} pt-5`}>
              <h3 className={`font-bold text-sm ${t.accentText}`}>
                Schedule & Availability (Week 1 to Week 4)
              </h3>
              <p className={`text-xs mt-1 mb-4 ${t.muted}`}>
                Select specific weeks (Week 1 - Week 4) or "All Weeks" to set repeating schedule.
              </p>

              <div
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 rounded-xl border ${t.border} ${t.soft}`}
              >
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${t.muted}`}>
                    Week
                  </label>
                  <select
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs outline-none`}
                    value={newAvail.week}
                    onChange={(e) =>
                      setNewAvail({ ...newAvail, week: e.target.value })
                    }
                  >
                    {WEEKS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${t.muted}`}>
                    Day
                  </label>
                  <select
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs outline-none`}
                    value={newAvail.day}
                    onChange={(e) =>
                      setNewAvail({ ...newAvail, day: e.target.value })
                    }
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${t.muted}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs outline-none`}
                    value={newAvail.startTime}
                    onChange={(e) =>
                      setNewAvail({ ...newAvail, startTime: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${t.muted}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs outline-none`}
                    value={newAvail.endTime}
                    onChange={(e) =>
                      setNewAvail({ ...newAvail, endTime: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${t.muted}`}>
                    Slot (Min)
                  </label>
                  <select
                    className={`w-full p-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs outline-none`}
                    value={newAvail.slotDuration}
                    onChange={(e) =>
                      setNewAvail({
                        ...newAvail,
                        slotDuration: Number(e.target.value),
                      })
                    }
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddAvailability}
                    className={`w-full ${t.accent} text-white py-2 px-3 rounded-lg font-semibold text-xs hover:opacity-90`}
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              {form.availability.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {form.availability.map((a, idx) => (
                    <span
                      key={`${a.week}-${a.day}-${idx}`}
                      className={`border ${t.border} ${t.soft} ${t.text} px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-medium`}
                    >
                      <span className={`font-bold ${t.accentText}`}>
                        [{getWeekBadge(a.week)}]
                      </span>
                      <span>
                        {a.day}: {a.startTime} - {a.endTime} ({a.slotDuration}m)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveAvail(a.week || "all", a.day)
                        }
                        className="text-red-500 font-bold hover:text-red-600 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`w-full ${t.accent} text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition`}
            >
              {editingId ? "Update Staff" : "Save Staff"}
            </button>
          </form>
        )}

        {/* Doctors List */}
        {loading ? (
          <p className={`text-center py-10 text-sm ${t.muted}`}>
            Loading Staff...
          </p>
        ) : list.length === 0 ? (
          <div
            className={`rounded-2xl border ${t.card} ${t.border} p-10 text-center`}
          >
            <p className={`font-medium ${t.muted}`}>No Staff added yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((doc) => (
              <div
                key={doc._id}
                className={`rounded-2xl border ${t.card} ${t.border} p-5 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className={`font-bold text-lg ${t.text}`}>
                        {doc.name}
                      </h3>
                      <p className={`text-sm font-medium ${t.accentText}`}>
                        {doc.specialization}
                      </p>
                      {doc.qualification && (
                        <p className={`text-xs mt-0.5 ${t.muted}`}>
                          {doc.qualification}
                        </p>
                      )}
                      {doc.consultationFee > 0 && (
                        <p className={`text-sm font-bold mt-2 ${t.text}`}>
                          Fee: ₹{doc.consultationFee}
                        </p>
                      )}
                    </div>

                    <span className="bg-green-500/15 text-green-500 text-xs px-2.5 py-1 rounded-full font-bold">
                      Active
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className={`text-xs font-semibold mb-2 ${t.muted}`}>
                      Schedule ({doc.availability?.length || 0} slots):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.availability?.length > 0 ? (
                        doc.availability.map((a, i) => (
                          <span
                            key={i}
                            className={`text-[11px] px-2 py-1 rounded-lg border ${t.border} ${t.soft} ${t.text}`}
                          >
                            <strong>
                              {a.week && a.week !== "all" ? `W${a.week} ` : ""}
                              {a.day}
                            </strong>{" "}
                            ({a.startTime}-{a.endTime})
                          </span>
                        ))
                      ) : (
                        <span className={`text-xs ${t.muted}`}>Not set</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`flex gap-2 mt-5 pt-4 border-t ${t.border}`}>
                  <button
                    onClick={() => startEdit(doc)}
                    className={`flex-1 text-xs font-semibold ${t.accentText} ${t.soft} py-2.5 rounded-xl ${t.hover} transition`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => dispatch(deleteDoctor(doc._id))}
                    className="flex-1 text-xs font-semibold text-red-500 bg-red-500/10 py-2.5 rounded-xl hover:bg-red-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
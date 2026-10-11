import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchMyStaff,
  addStaff,
  updateStaff,
  deleteStaff,
} from "../features/staff/staffSlice";
import toast from "react-hot-toast";

const StaffManager = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.staff);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    staffTitle: "",
  });

  useEffect(() => {
    dispatch(fetchMyStaff());
  }, [dispatch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await dispatch(addStaff(form));
    if (addStaff.fulfilled.match(res)) {
      toast.success("Staff added!");
      setForm({ name: "", email: "", password: "", staffTitle: "" });
      setShowForm(false);
    } else {
      toast.error(res.payload);
    }
  };

  const handleToggle = async (staff) => {
    await dispatch(
      updateStaff({ id: staff._id, isActive: !staff.isActive })
    );
    toast.success(staff.isActive ? "Staff deactivated" : "Staff activated");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Staff remove karna hai?")) return;
    const res = await dispatch(deleteStaff(id));
    if (deleteStaff.fulfilled.match(res)) {
      toast.success("Staff removed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          ← BookEasy
        </Link>
        <span className="text-sm text-gray-500">Staff Manager</span>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Staff ({list.length})</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
          >
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-white p-6 rounded-2xl shadow-sm mb-6"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-3 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Title (Dr., Sr. Physio)"
                value={form.staffTitle}
                onChange={(e) =>
                  setForm({ ...form, staffTitle: e.target.value })
                }
                className="px-4 py-3 border rounded-lg"
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-4 py-3 border rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="Password (min 6) *"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="px-4 py-3 border rounded-lg"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Staff"}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {list.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center text-gray-500">
              Abhi koi staff nahi hai
            </div>
          )}
          {list.map((s) => (
            <div
              key={s._id}
              className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold">
                  {s.staffTitle} {s.name}
                  {!s.isActive && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(s)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    s.isActive
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {s.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffManager;
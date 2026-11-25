import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMyStaff,
  addStaff,
  updateStaff,
  deleteStaff,
} from "../features/staff/staffSlice";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const StaffManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, availableTitles, pagination, loading } = useSelector(
    (state) => state.staff
  );
  const { user } = useSelector((state) => state.auth);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  // Create Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    staffTitle: "",
  });

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    staffTitle: "",
    isActive: true,
  });

  const loadStaff = (targetPage = page) => {
    dispatch(
      fetchMyStaff({
        status: statusFilter,
        title: titleFilter,
        search,
        page: targetPage,
        limit,
      })
    );
  };

  useEffect(() => {
    loadStaff(page);
  }, [dispatch, statusFilter, titleFilter, search, page]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const res = await dispatch(addStaff(form));
    if (addStaff.fulfilled.match(res)) {
      toast.success("Staff added!");
      setForm({ name: "", email: "", password: "", staffTitle: "" });
      setShowForm(false);
      setPage(1);
      loadStaff(1);
    } else {
      toast.error(res.payload || "Failed to add staff");
    }
  };

  const openEdit = (staff) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name || "",
      email: staff.email || "",
      staffTitle: staff.staffTitle || "",
      isActive: Boolean(staff.isActive),
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    const res = await dispatch(
      updateStaff({
        id: editingStaff._id,
        ...editForm,
      })
    );

    if (updateStaff.fulfilled.match(res)) {
      toast.success("Staff updated!");
      setEditingStaff(null);
      loadStaff(page);
    } else {
      toast.error(res.payload || "Update failed");
    }
  };

  const handleToggle = async (staff) => {
    const res = await dispatch(
      updateStaff({ id: staff._id, isActive: !staff.isActive })
    );
    if (updateStaff.fulfilled.match(res)) {
      toast.success(staff.isActive ? "Staff deactivated" : "Staff activated");
      loadStaff(page);
    } else {
      toast.error(res.payload || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Staff remove karna hai?")) return;
    const res = await dispatch(deleteStaff(id));
    if (deleteStaff.fulfilled.match(res)) {
      toast.success("Staff removed");
      const nextPage = list.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      loadStaff(nextPage);
    } else {
      toast.error(res.payload || "Delete failed");
    }
  };

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
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${t.text}`}>
              Your Staff ({pagination?.total ?? list.length})
            </h2>
            <p className={`text-sm ${t.muted}`}>
              Create, filter, edit, and manage staff accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`text-xs font-semibold px-3 py-2.5 rounded-xl border ${t.border} ${t.card} ${t.text} ${t.hover}`}
            >
              ← Dashboard
            </Link>
            {/* <button
              onClick={() => setShowForm(!showForm)}
              className={`px-4 py-2.5 ${
                showForm ? "bg-red-500" : t.accent
              } text-white rounded-xl text-xs font-bold hover:opacity-90 transition`}
            >
              {showForm ? "Cancel" : "+ Add Staff"}
            </button> */}
          </div>
        </div>

        {/* Add Staff Form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className={`rounded-2xl border ${t.card} ${t.border} p-5 md:p-6 mb-6 space-y-4`}
          >
            <h3 className={`text-base font-bold ${t.text}`}>Add New Staff</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Staff Name *
                </label>
                <input
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Title / Role Label
                </label>
                <input
                  type="text"
                  placeholder="Receptionist, Front Desk, Coordinator"
                  value={form.staffTitle}
                  onChange={(e) =>
                    setForm({ ...form, staffTitle: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Login Email *
                </label>
                <input
                  type="email"
                  placeholder="staff@clinic.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${t.accent} text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50`}
            >
              {loading ? "Adding Staff..." : "Create Staff Account"}
            </button>
          </form>
        )}

        {/* Edit Staff Modal */}
        {editingStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleEditSubmit}
              className={`rounded-2xl border ${t.card} ${t.border} p-6 w-full max-w-md space-y-4`}
            >
              <h3 className={`text-lg font-bold ${t.text}`}>Edit Staff</h3>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.muted}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.staffTitle}
                  onChange={(e) =>
                    setEditForm({ ...editForm, staffTitle: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                />
              </div>

              <label className={`flex items-center gap-2 text-sm ${t.text}`}>
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                />
                <span>Active Account</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 ${t.accent} text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90`}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className={`flex-1 border ${t.border} ${t.soft} ${t.text} py-2.5 rounded-xl text-xs font-semibold`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar (Business-scoped Status + Title + Search) */}
        <div
          className={`rounded-2xl border ${t.card} ${t.border} p-4 mb-6 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center`}
        >
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "inactive", label: "Inactive" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? t.selected
                    : `${t.soft} ${t.text} ${t.hover}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs font-medium outline-none`}
            >
              <option value="all">All Titles</option>
              {availableTitles.map((titleItem) => (
                <option key={titleItem} value={titleItem}>
                  {titleItem}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl border ${t.border} ${t.soft} ${t.text} text-xs outline-none`}
            />
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className={`text-center py-10 text-sm ${t.muted}`}>
            Loading staff...
          </div>
        ) : list.length === 0 ? (
          <div
            className={`rounded-2xl border ${t.card} ${t.border} p-8 text-center text-sm ${t.muted}`}
          >
            No staff found for the selected filter.
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((s) => (
              <div
                key={s._id}
                className={`rounded-2xl border ${t.card} ${t.border} p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-base ${t.text}`}>
                      {s.staffTitle ? `${s.staffTitle} ` : ""}
                      {s.name}
                    </h3>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        s.isActive
                          ? "bg-green-500/15 text-green-500"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 ${t.muted}`}>{s.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${t.accentText} ${t.soft} ${t.hover} transition`}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggle(s)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                      s.isActive
                        ? "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25"
                        : "bg-green-500/15 text-green-500 hover:bg-green-500/25"
                    }`}
                  >
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    onClick={() => handleDelete(s._id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-500 hover:bg-red-500/25 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className={`flex justify-between items-center mt-6 rounded-2xl border ${t.card} ${t.border} p-4`}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover}`}
            >
              ← Previous
            </button>

            <span className={`text-xs font-medium ${t.muted}`}>
              Page <strong className={t.accentText}>{pagination.page}</strong> of{" "}
              {pagination.totalPages} ({pagination.total} total)
            </span>

            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.border} ${t.soft} ${t.text} disabled:opacity-50 ${t.hover}`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManager;
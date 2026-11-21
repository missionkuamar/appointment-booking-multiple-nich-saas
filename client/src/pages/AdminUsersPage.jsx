import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { FaPlus, FaSearch, FaUserPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout";
import { themes } from "../constants/themes";

export default function AdminUsersPage() {
  const { user } = useSelector((s) => s.auth || {});

  const [theme] = useState(
    () => localStorage.getItem("dashboard-theme") || "day"
  );
  const t = themes[theme] || themes.day;

  // Sidebar option state: default 'users'
  const [activeSection, setActiveSection] = useState("users");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    staffTitle: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { search: search.trim() || undefined },
      });
      setUsers(res.data?.users || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (activeSection === "users") {
      fetchUsers();
    }
  }, [fetchUsers, activeSection]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/users", form);
      toast.success("User added successfully!");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "staff",
        staffTitle: "",
      });
      setShowCreate(false);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      await api.patch(`/admin/users/${targetUser._id}`, {
        isActive: !targetUser.isActive,
      });
      toast.success("User status updated");
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const renderRightMainSection = () => {
    if (activeSection !== "users") {
      const sectionLabels = {
        overview: "Admin Overview",
        super_admin: "Super Admin Users",
        doctors: "Doctors Management",
        affiliate: "Affiliate Management",
        subscription: "Subscription Management",
      };

      return (
        <div className={`rounded-2xl border ${t.card} ${t.border} p-6 space-y-3`}>
          <h2 className={`text-xl font-bold ${t.text}`}>
            {sectionLabels[activeSection] || "Section"}
          </h2>
          <p className={`text-sm ${t.muted}`}>
            Active sidebar section: <strong>{activeSection}</strong>. Yahan aap is
            section ka component render kar sakte hain ya sidebar se{" "}
            <strong>Admin Users</strong> par click karke users table dekh sakte hain.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>
              Admin — Users Management
            </h1>
            <p className={`text-sm ${t.muted}`}>
              Manage clinic staff and team accounts ({user?.role || "admin"})
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate((p) => !p)}
            className={`${t.accent} text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition cursor-pointer`}
          >
            <FaPlus />
            {showCreate ? "Close Form" : "Add User"}
          </button>
        </div>

        {/* Create User Form */}
        {showCreate && (
          <form
            onSubmit={handleCreateUser}
            className={`rounded-2xl border ${t.card} ${t.border} p-5 space-y-4`}
          >
            <h2
              className={`text-base font-bold ${t.text} flex items-center gap-2`}
            >
              <FaUserPlus className={t.accentText} />
              Create New Team Member
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                required
              />

              <input
                type="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                required
              />

              <input
                type="password"
                placeholder="Password (min 6 chars) *"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
                required
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
              >
                <option value="staff" className={`${t.card} ${t.text}`}>
                  Staff
                </option>
                <option value="owner" className={`${t.card} ${t.text}`}>
                  Owner
                </option>
                <option value="admin" className={`${t.card} ${t.text}`}>
                  Admin
                </option>
              </select>

              <input
                type="text"
                placeholder="Title (e.g. Receptionist, Dr.)"
                value={form.staffTitle}
                onChange={(e) =>
                  setForm({ ...form, staffTitle: e.target.value })
                }
                className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
              />

              <button
                type="submit"
                disabled={submitting}
                className={`${t.accent} text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:opacity-90 transition disabled:opacity-50 cursor-pointer`}
              >
                {submitting ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className={`rounded-2xl border ${t.card} ${t.border} p-4`}>
          <div className="relative">
            <FaSearch
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${t.muted} text-sm`}
            />
            <input
              type="text"
              placeholder="Search by name, email, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div
          className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}
        >
          {loading ? (
            <p className={`text-center py-10 text-sm ${t.muted}`}>
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p className={`text-center py-10 text-sm ${t.muted}`}>
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${t.soft} border-b ${t.border}`}>
                    <th
                      className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}
                    >
                      User
                    </th>
                    <th
                      className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}
                    >
                      Role
                    </th>
                    <th
                      className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}
                    >
                      Title
                    </th>
                    <th
                      className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-5 py-3.5 text-right text-xs font-semibold uppercase ${t.muted}`}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${t.border}`}>
                  {users.map((u) => (
                    <tr key={u._id} className={`${t.hover} transition`}>
                      <td className="px-5 py-4">
                        <p className={`text-sm font-bold ${t.text}`}>
                          {u.name}
                        </p>
                        <p className={`text-xs ${t.muted}`}>{u.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${t.soft} ${t.accentText} border ${t.border}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-xs ${t.muted}`}>
                        {u.staffTitle || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.isActive !== false
                              ? "bg-green-500/15 text-green-500"
                              : "bg-red-500/15 text-red-500"
                          }`}
                        >
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} text-xs font-semibold transition cursor-pointer`}
                        >
                          {u.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
    >
      {renderRightMainSection()}
    </AdminLayout>
  );
} 
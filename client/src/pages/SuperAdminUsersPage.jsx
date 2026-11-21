import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSearch, FaTrash, FaUserShield } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../api/axios";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { themes } from "../constants/themes";

const ALL_ROLES = ["user", "staff", "owner", "admin", "super_admin"];

export default function SuperAdminUsersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});

  const [theme, setTheme] = useState(
    () => localStorage.getItem("dashboard-theme") || "day"
  );
  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/superadmin/users", {
        params: {
          search: search.trim() || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(res.data?.users || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load super admin users"
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleRoleChange = async (targetUser, newRole) => {
    try {
      await api.patch(`/superadmin/users/${targetUser._id}`, {
        role: newRole,
      });
      toast.success(`Role updated to ${newRole}`);
      fetchAllUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Role update failed");
    }
  };

  const handleToggleActive = async (targetUser) => {
    try {
      await api.patch(`/superadmin/users/${targetUser._id}`, {
        isActive: targetUser.isActive === false ? true : false,
      });
      toast.success("Status updated");
      fetchAllUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Status update failed");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const ok = window.confirm(
      `Are you sure you want to delete ${targetUser.email}?`
    );
    if (!ok) return;

    try {
      await api.delete(`/superadmin/users/${targetUser._id}`);
      toast.success("User deleted");
      fetchAllUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div
      className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}
    >
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-6 items-start">
        <AdminSidebar
          t={t}
          user={user}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2.5 rounded-xl border ${t.border} ${t.card} ${t.text}`}
                aria-label="Open sidebar"
              >
                <FaBars />
              </button>

              <div>
                <h1
                  className={`text-2xl font-bold ${t.text} flex items-center gap-2`}
                >
                  <FaUserShield className={t.accentText} />
                  Super Admin — All Users
                </h1>
                <p className={`text-sm ${t.muted}`}>
                  Global user & role control across all clinics (`/superadmin/users`)
                </p>
              </div>
            </div>
          </div>

          {/* Search + Role Filter */}
          <div
            className={`rounded-2xl border ${t.card} ${t.border} p-4 grid grid-cols-1 sm:grid-cols-3 gap-3`}
          >
            <div className="relative sm:col-span-2">
              <FaSearch
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${t.muted} text-sm`}
              />
              <input
                type="text"
                placeholder="Search any user by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`p-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none`}
            >
              <option value="" className={`${t.card} ${t.text}`}>
                All Roles
              </option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r} className={`${t.card} ${t.text}`}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div
            className={`rounded-2xl border ${t.card} ${t.border} overflow-hidden`}
          >
            {loading ? (
              <p className={`text-center py-10 text-sm ${t.muted}`}>
                Loading platform users...
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
                      <th className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}>
                        User
                      </th>
                      <th className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}>
                        Business
                      </th>
                      <th className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}>
                        Role
                      </th>
                      <th className={`px-5 py-3.5 text-xs font-semibold uppercase ${t.muted}`}>
                        Status
                      </th>
                      <th className={`px-5 py-3.5 text-right text-xs font-semibold uppercase ${t.muted}`}>
                        Actions
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

                        <td className={`px-5 py-4 text-xs ${t.muted}`}>
                          {u.businessId?.name || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={u.role || "user"}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg border ${t.border} ${t.soft} ${t.text} text-xs font-bold outline-none`}
                          >
                            {ALL_ROLES.map((r) => (
                              <option
                                key={r}
                                value={r}
                                className={`${t.card} ${t.text}`}
                              >
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
                              u.isActive !== false
                                ? "bg-green-500/15 text-green-500"
                                : "bg-red-500/15 text-red-500"
                            }`}
                          >
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </button>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/15 transition"
                            title="Delete User"
                          >
                            <FaTrash className="text-sm" />
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
      </div>
    </div>
  );
}
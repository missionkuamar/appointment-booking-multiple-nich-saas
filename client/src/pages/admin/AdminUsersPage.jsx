import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchAdminUsers,
  addUser,
  toggleUserStatus,
  deleteAdminUser,
} from "../../features/admin/adminSlice";
import { FaPlus, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

const ROLE_BADGES = {
  admin: "bg-purple-100 text-purple-700",
  owner: "bg-indigo-100 text-indigo-700",
  staff: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-700",
};

const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const { users, pagination, loading } = useSelector((s) => s.admin);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "owner", staffTitle: "" });

  // Fetch on mount & when filters change
  useEffect(() => {
    dispatch(fetchAdminUsers({ search, role: roleFilter, page: 1, limit: 10 }));
  }, [dispatch, search, roleFilter]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      dispatch(fetchAdminUsers({ search, role: roleFilter, page: newPage, limit: 10 }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await dispatch(addUser(form));
    if (addUser.fulfilled.match(res)) {
      toast.success("User created!");
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "owner", staffTitle: "" });
    } else {
      toast.error(res.payload);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    const res = await dispatch(deleteAdminUser(id));
    if (deleteAdminUser.fulfilled.match(res)) toast.success("Deleted");
    else toast.error(res.payload);
  };

  const handleToggle = async (id, currentStatus) => {
    dispatch(toggleUserStatus({ id, isActive: !currentStatus }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
            <p className="text-sm text-gray-500">Manage platform admins, owners & staff.</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90"
          >
            <FaPlus /> {showAdd ? "Close" : "Add User"}
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" placeholder="Name" required className="p-2 border rounded-lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="Email" required className="p-2 border rounded-lg" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="Password" required className="p-2 border rounded-lg" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            
            <select className="p-2 border rounded-lg" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="owner">Clinic Owner</option>
              <option value="staff">Doctor / Staff</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="bg-secondary text-white rounded-lg font-bold">Save</button>
          </form>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border">
          <input type="text" placeholder="Search name or email..." className="flex-1 p-2.5 border rounded-xl outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="p-2.5 border rounded-xl font-medium outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="owner">Owners</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-500">No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${ROLE_BADGES[u.role] || "bg-gray-100"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleToggle(u._id, u.isActive)} className={`p-2 rounded-lg border ${u.isActive ? "border-orange-200 text-orange-600" : "border-green-200 text-green-600"}`}>
                        {u.isActive ? <FaTimes /> : <FaCheck />}
                      </button>
                      <button onClick={() => handleDelete(u._id)} className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t flex justify-between items-center bg-gray-50 text-sm">
              <span className="text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50">Prev</button>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
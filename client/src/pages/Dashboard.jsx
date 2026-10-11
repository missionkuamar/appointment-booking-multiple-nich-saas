import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import { fetchStats } from "../features/appointment/appointmentSlice";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: business } = useSelector((state) => state.business);
  const { stats, statsLoading } = useSelector((state) => state.appointment);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const bookingUrl = `${window.location.origin}/book/${business?.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    alert("Link copied!");
  };

  const maxTrend = Math.max(...(stats?.trend?.map((t) => t.count) || [1]), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">BookEasy</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Welcome, {business?.businessName} 👋
          </h2>
          <p className="text-gray-600 mb-2">Your public booking page:</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-gray-100 px-4 py-2 rounded-lg text-sm break-all">
              {bookingUrl}
            </code>
            <button
              onClick={copyLink}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">Today</p>
            <p className="text-3xl font-bold text-primary">
              {statsLoading ? "..." : stats?.today || 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">This Week</p>
            <p className="text-3xl font-bold text-primary">
              {statsLoading ? "..." : stats?.week || 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">This Month</p>
            <p className="text-3xl font-bold text-primary">
              {statsLoading ? "..." : stats?.month || 0}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {statsLoading ? "..." : stats?.pending || 0}
            </p>
          </div>
        </div>

        {/* Trend Chart */}
        {stats?.trend && stats.trend.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-4">Last 7 Days</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {stats.trend.map((t) => (
                <div key={t.date} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary rounded-t-lg transition-all"
                    style={{
                      height: `${(t.count / maxTrend) * 100}%`,
                      minHeight: t.count > 0 ? "8px" : "2px",
                    }}
                    title={`${t.count} appointments`}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(t.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link
            to="/slots"
            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">🗓️</div>
            <h3 className="font-bold">Slots</h3>
          </Link>

          <Link
            to="/appointments"
            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold">Appointments</h3>
          </Link>

          <Link
            to="/staff"
            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold">Staff</h3>
          </Link>

          <Link
            to="/settings"
            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold">Settings</h3>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
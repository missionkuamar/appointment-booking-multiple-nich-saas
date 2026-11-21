import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearBusiness } from "../features/business/businessSlice";
import {
  fetchStats,
  fetchMyAppointments,
} from "../features/appointment/appointmentSlice";
import { fetchMyDoctors } from "../features/doctor/doctorSlice";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const formatTrendDate = (rawDate) => {
  if (!rawDate) return "";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return String(rawDate);
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, token } = useSelector((s) => s.auth || {});
  const { data: business } = useSelector((s) => s.business || {});
  const {
    stats,
    statsLoading,
    list: appointments,
  } = useSelector((s) => s.appointment || {});
  const { list: doctors } = useSelector((s) => s.doctor || {});
  const { status: subStatus } = useSelector((s) => s.subscription || {});

  const [chartRange, setChartRange] = useState("7");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;


  
useEffect(() => {
    const reloadKey = "dashboard_reloaded_once";
    const alreadyReloaded = sessionStorage.getItem(reloadKey);

    if (!alreadyReloaded) {
      sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    }
  }, []);









  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  useEffect(() => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) return;

    dispatch(fetchMyDoctors());
    dispatch(
      fetchMyAppointments({
        status: "all",
        page: 1,
        limit: 5,
      })
    );
  }, [dispatch, token]);

  useEffect(() => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken) return;

    dispatch(fetchStats(chartRange));
  }, [dispatch, chartRange, token]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const bookingUrl = business?.slug
    ? `${window.location.origin}/book/${business.slug}`
    : `${window.location.origin}/book`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      alert("Booking link copied!");
    } catch {
      alert("Unable to copy link");
    }
  };

  const trendItems = Array.isArray(stats?.trend) ? stats.trend : [];
  const maxTrend = Math.max(
    ...(trendItems.map((item) => Number(item?.count) || 0)),
    1
  );

  const ranges = [
    { label: "7D", value: "7" },
    { label: "15D", value: "15" },
    { label: "1M", value: "30" },
    { label: "3M", value: "90" },
    { label: "6M", value: "180" },
  ];

  const statusColors = {
    pending: "bg-yellow-500/15 text-yellow-500",
    confirmed: "bg-green-500/15 text-green-500",
    cancelled: "bg-red-500/15 text-red-500",
    completed: "bg-blue-500/15 text-blue-500",
  };

  const quickActions = [
    {
      to: "/doctors",
      icon: "🩺",
      title: "Doctors",
      desc: `${doctors?.length || 0} active`,
    },
    {
      to: "/slots",
      icon: "🗓️",
      title: "Slots",
      desc: "Manage times",
    },
    {
      to: "/appointments",
      icon: "📋",
      title: "Appointments",
      desc: "View all",
    },
    {
      to: "/staff",
      icon: "👥",
      title: "Staff",
      desc: "Manage team",
    },
    {
      to: "/settings",
      icon: "⚙️",
      title: "Settings",
      desc: "Configure",
    },
  ];

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {subStatus !== "active" && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="font-bold">No Active Subscription</h3>
              <p className="text-sm opacity-90">
                Subscribe to keep your booking page live.
              </p>
            </div>

            <Link
              to="/subscription"
              className="bg-white text-red-500 px-4 py-2 rounded-lg text-sm font-bold"
            >
              Subscribe Now
            </Link>
          </div>
        )}

        <section
          className={`rounded-2xl border ${t.card} p-5 md:p-6 mb-6 flex flex-col md:flex-row justify-between gap-5`}
        >
          <div>
            <h2 className={`text-2xl font-bold ${t.text}`}>
              Welcome, {business?.businessName || user?.name || "User"} 👋
            </h2>
            <p className={`text-sm mt-2 ${t.muted}`}>
              Here's what's happening with your clinic today.
            </p>
          </div>

          <div className="w-full md:max-w-md">
            <p className={`text-xs font-semibold mb-2 ${t.muted}`}>
              Your public booking link
            </p>

            <div className="flex gap-2">
              <code
                className={`flex-1 min-w-0 ${t.soft} ${t.text} px-3 py-3 rounded-lg text-xs truncate`}
              >
                {bookingUrl}
              </code>

              <button
                onClick={copyLink}
                className={`${t.accent} text-white px-4 rounded-lg text-sm font-semibold`}
              >
                Copy
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Today's Appointments",
              value: stats?.today || 0,
              icon: "📅",
              color: "text-blue-500",
            },
            {
              label: "Pending Approvals",
              value: stats?.pending || 0,
              icon: "⏳",
              color: "text-yellow-500",
            },
            {
              label: "Total Appointments",
              value: stats?.total || 0,
              icon: "📊",
              color: "text-green-500",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border ${t.card} p-5`}
            >
              <div className="flex justify-between items-center">
                <p className={`text-sm font-medium ${t.muted}`}>
                  {item.label}
                </p>
                <span className="text-xl">{item.icon}</span>
              </div>

              <h3 className={`text-3xl font-bold mt-3 ${item.color}`}>
                {statsLoading ? "..." : item.value}
              </h3>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className={`lg:col-span-2 rounded-2xl border ${t.card} p-5 md:p-6`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-7">
              <h3 className={`font-bold text-lg ${t.text}`}>
                Appointments Trend
              </h3>

              <div className={`flex gap-1 p-1 rounded-lg ${t.soft}`}>
                {ranges.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setChartRange(r.value)}
                    className={`px-3 py-2 rounded-md text-xs font-bold ${
                      chartRange === r.value
                        ? t.selected
                        : `${t.muted} ${t.hover}`
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {trendItems.length > 0 ? (
              <div className="flex items-end justify-between h-48 gap-2 overflow-x-auto pb-4">
                {trendItems.map((item, index) => {
                  const count = Number(item?.count) || 0;
                  const showLabel =
                    trendItems.length <= 15 ||
                    index % Math.max(Math.floor(trendItems.length / 7), 1) === 0;

                  return (
                    <div
                      key={item?.date || index}
                      className="flex-1 min-w-[20px] h-full flex flex-col items-center justify-end group relative"
                    >
                      <div
                        className={`absolute bottom-full mb-2 ${t.soft} ${t.text} text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10`}
                      >
                        {item?.date}: {count}
                      </div>

                      <div
                        className={`w-full ${t.chart} rounded-t-md transition-all hover:opacity-70`}
                        style={{
                          height: `${Math.max(
                            (count / maxTrend) * 100,
                            count > 0 ? 10 : 2
                          )}%`,
                        }}
                      />

                      {showLabel && (
                        <span
                          className={`text-[10px] mt-2 ${t.muted} whitespace-nowrap`}
                        >
                          {formatTrendDate(item?.date)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className={`h-48 flex items-center justify-center text-sm ${t.muted}`}
              >
                No data available for this period
              </div>
            )}
          </div>

          <div className={`rounded-2xl border ${t.card} p-5 flex flex-col`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`font-bold ${t.text}`}>Recent Bookings</h3>

              <Link
                to="/appointments"
                className={`text-xs font-semibold ${t.accentText}`}
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {appointments?.length > 0 ? (
                appointments.slice(0, 5).map((appt) => (
                  <div
                    key={appt._id}
                    className={`rounded-xl border ${t.border} ${t.soft} p-3`}
                  >
                    <div className="flex justify-between gap-2 items-center">
                      <p className={`text-sm font-bold ${t.text}`}>
                        {appt.clientName}
                      </p>

                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          statusColors[appt.status] || t.soft
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <p className={`text-xs mt-2 ${t.muted}`}>
                      📅 {appt.date} | 🕐 {appt.time}
                    </p>

                    <p className={`text-xs mt-2 ${t.accentText}`}>
                      🩺 {appt.doctorId?.name || "Any Doctor"}
                    </p>
                  </div>
                ))
              ) : (
                <p className={`text-sm text-center py-10 ${t.muted}`}>
                  No recent bookings.
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className={`text-lg font-bold mb-4 ${t.text}`}>Quick Actions</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-2xl border ${t.card} p-5 transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="text-3xl mb-3">{item.icon}</div>

                <h4 className={`font-bold text-sm ${t.text}`}>{item.title}</h4>

                <p className={`text-xs mt-1 ${t.muted}`}>{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
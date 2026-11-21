// src/pages/admin/AdminDashboard.jsx

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaBuilding,
  FaUserMd,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaClock,
} from "react-icons/fa";

const DEFAULT_THEME = {
  text: "text-gray-800",
  muted: "text-gray-500",
  card: "bg-white",
  border: "border-gray-100",
};

export default function AdminDashboard({ t }) {
  const theme = { ...DEFAULT_THEME, ...(t || {}) };
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`p-8 text-center ${theme.muted}`}>
        Loading dashboard...
      </div>
    );
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers,
      icon: FaUsers,
      color: "text-blue-500",
      bg: "bg-blue-100",
    },
    {
      title: "Total Businesses",
      value: stats?.totalBusinesses,
      icon: FaBuilding,
      color: "text-indigo-500",
      bg: "bg-indigo-100",
    },
    {
      title: "Total Doctors",
      value: stats?.totalDoctors,
      icon: FaUserMd,
      color: "text-teal-500",
      bg: "bg-teal-100",
    },
    {
      title: "Total Appointments",
      value: stats?.totalAppointments,
      icon: FaCalendarCheck,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeSubscriptions,
      icon: FaMoneyBillWave,
      color: "text-green-500",
      bg: "bg-green-100",
    },
    {
      title: "Monthly Revenue",
      value: `₹${stats?.monthlyRevenue?.toLocaleString() || 0}`,
      icon: FaClock,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Admin Dashboard</h1>
          <p className={`text-sm ${theme.muted}`}>
            Welcome back! Here's what's happening on your platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border ${theme.card} ${theme.border} flex items-center gap-4 shadow-sm`}
          >
            <div className={`p-4 rounded-xl ${c.bg} ${c.color} text-2xl`}>
              <c.icon />
            </div>
            <div>
              <p className={`text-sm font-medium ${theme.muted}`}>{c.title}</p>
              <p className={`text-3xl font-bold ${theme.text}`}>
                {c.value || 0}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`p-6 rounded-2xl border ${theme.card} ${theme.border} shadow-sm mt-8`}
      >
        <h2 className={`text-lg font-bold ${theme.text} mb-2`}>
          Platform Revenue Estimate
        </h2>
        <p className="text-4xl font-extrabold text-primary">
          ₹{stats?.monthlyRevenue?.toLocaleString() || 0}{" "}
          <span className="text-sm text-gray-500 font-normal">/ month</span>
        </p>
        <p className={`text-sm ${theme.muted} mt-1`}>
          Based on active subscriptions (Razorpay)
        </p>
      </div>
    </div>
  );
}
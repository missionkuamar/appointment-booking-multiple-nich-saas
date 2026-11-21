import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { fetchMyBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";
import { themes } from "../constants/themes";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const theme = localStorage.getItem("dashboard-theme") || "day";
  const t = themes[theme] || themes.day;

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref")?.trim();
      console.log("[Login:refEffect] Query search:", location.search, "| Extracted ref:", ref || "NONE");

      if (ref) {
        localStorage.setItem("affiliateRef", ref);
        console.log("[Login:refEffect] Saved affiliateRef to localStorage:", ref);
      }
    } catch (error) {
      console.error("❌ [Login:refEffect] Failed to save affiliate ref:", error);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const affiliateRef = localStorage.getItem("affiliateRef") || "";
    console.log("🚀 [Login:handleSubmit] Submitting login:", {
      email: form.email,
      hasPassword: !!form.password,
      affiliateRef: affiliateRef || "NONE",
    });

    try {
      const result = await dispatch(
        loginUser({
          ...form,
          ref: affiliateRef,
        })
      );

      console.log("📦 [Login:handleSubmit] loginUser result:", {
        fulfilled: loginUser.fulfilled.match(result),
        rejected: loginUser.rejected.match(result),
        payload: result.payload,
      });

      if (loginUser.fulfilled.match(result)) {
        if (affiliateRef) {
          localStorage.removeItem("affiliateRef");
          console.log("🧹 [Login:handleSubmit] Cleared affiliateRef from localStorage");
        }

        const user = result.payload?.user || result.payload || {};
        const userRole = user.role || "owner";
        console.log("👤 [Login:handleSubmit] Resolved user & role:", {
          userId: user._id || user.id,
          userRole,
        });

        toast.success("Welcome back!");

        if (userRole === "super_admin") {
          console.log("➡️ [Login:handleSubmit] Navigating to /superadmin/users");
          navigate("/superadmin", { replace: true });
          return;
        }

        if (userRole === "admin") {
          console.log("➡️ [Login:handleSubmit] Navigating to /admin/users");
          navigate("/admin", { replace: true });
          return;
        }

        if (userRole === "staff") {
          console.log("➡️ [Login:handleSubmit] Navigating to /doctor-dashboard");
          navigate("/doctor-dashboard", { replace: true });
          return;
        }

        console.log("🏢 [Login:handleSubmit] Owner role detected -> fetching business...");
        const bizRes = await dispatch(fetchMyBusiness());
        console.log("📦 [Login:handleSubmit] fetchMyBusiness result:", {
          fulfilled: fetchMyBusiness.fulfilled.match(bizRes),
          payload: bizRes.payload,
          error: bizRes.error,
        });

        if (fetchMyBusiness.fulfilled.match(bizRes)) {
          console.log("➡️ [Login:handleSubmit] Business found -> navigating to /dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.warn("⚠️ [Login:handleSubmit] Business not found -> navigating to /onboarding");
          navigate("/onboarding", { replace: true });
        }
      } else {
        console.warn("⚠️ [Login:handleSubmit] Login failed:", result.payload || result.error);
        toast.error(result.payload || "Login failed");
      }
    } catch (error) {
      console.error("❌ [Login:handleSubmit] Unexpected error:", error);
      toast.error("Something went wrong during login");
    }
  };

  return (
    <div
      className={`min-h-screen ${t.page} flex items-center justify-center px-4 transition-colors duration-300`}
    >
      <div
        className={`w-full max-w-md rounded-2xl border ${t.card} ${t.border} p-8 shadow-lg`}
      >
        <h1 className={`text-3xl font-bold text-center mb-2 ${t.text}`}>
          Welcome Back
        </h1>
        <p className={`text-center mb-6 ${t.muted}`}>Login to your dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${t.accent} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={`text-center mt-6 ${t.muted}`}>
          New here?{" "}
          <Link to="/register" className={`${t.accentText} font-semibold`}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
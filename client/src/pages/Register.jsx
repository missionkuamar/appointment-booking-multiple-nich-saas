import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { themes } from "../constants/themes";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useSelector((state) => state.auth);

  const theme = localStorage.getItem("dashboard-theme") || "day";
  const t = themes[theme] || themes.day;

  // ============================================
  // CAPTURE AFFILIATE REF FROM URL
  // ============================================
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref")?.trim();
      console.log("[Register] location.search:", location.search, "| extracted ref:", ref);

      if (ref) {
        localStorage.setItem("affiliateRef", ref);
        console.log("[Register] Saved affiliateRef to localStorage:", ref);
      } else {
        console.log("[Register] No ref in URL; existing localStorage affiliateRef:", localStorage.getItem("affiliateRef"));
      }
    } catch (error) {
      console.error("❌ Failed to save affiliate ref:", error);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const affiliateRef = localStorage.getItem("affiliateRef") || "";
    const payload = {
      name: form.name,
      email: form.email,
      ref: affiliateRef,
    };
    console.log("[Register] Submitting registration payload (password omitted):", payload);

    try {
      const result = await dispatch(
        registerUser({
          ...form,
          ref: affiliateRef,
        })
      );
      console.log("[Register] registerUser result:", result);

      if (registerUser.fulfilled.match(result)) {
        if (affiliateRef) {
          localStorage.removeItem("affiliateRef");
          console.log("[Register] Cleared affiliateRef from localStorage after registration");
        }

        toast.success("Account created!");
        console.log("[Register] Navigating to /onboarding");
        navigate("/onboarding");
      } else {
        console.warn("[Register] Registration rejected/failed:", result.payload || result.error);
        toast.error(result.payload || "Registration failed");
      }
    } catch (error) {
      console.error("[Register] Unexpected error during handleSubmit:", error);
      toast.error("Something went wrong during registration");
    }
  };

  return (
    <div
      className={`min-h-screen ${t.page} flex items-center justify-center px-4 transition-colors duration-300`}
    >
      <div
        className={`w-full max-w-md rounded-2xl border ${t.card} ${t.border} p-8 shadow-lg`}
      >
        {/* Back to Landing Page Link */}
        <div className="mb-4">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${t.muted} hover:${t.text} transition`}
          >
            <span aria-hidden="true">←</span>
            <span>Back to Home</span>
          </Link>
        </div>

        <h1 className={`text-3xl font-bold text-center mb-2 ${t.text}`}>
          Create Account
        </h1>
        <p className={`text-center mb-6 ${t.muted}`}>
          Start your booking system in minutes
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
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
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={`w-full px-4 py-3 border ${t.border} ${t.soft} ${t.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${t.accent} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50`}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className={`text-center mt-6 ${t.muted}`}>
          Already have an account?{" "}
          <Link
            to={`/login${location.search}`}
            className={`${t.accentText} font-semibold`}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
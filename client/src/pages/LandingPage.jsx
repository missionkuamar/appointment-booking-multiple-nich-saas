import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PERSONAL_SITE_URL = "https://www.codewithmission.site/";
const WHATSAPP_NUMBER = "919354689368";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi Mission! I visited CodeWithMission and want to know more about your SaaS & appointment system."
)}`;

const SAAS_DEMOS = [
  {
    title: "SlotFlow Appointment & Clinic SaaS",
    badge: "Live App Demo",
    description:
      "Public booking pages, time slots, doctor/staff dashboards, holidays, and instant booking confirmations.",
    ctaLabel: "Try Booking Demo",
    to: "/login",
  },
  {
    title: "Multi-Role Admin & Team Portal",
    badge: "Role-Based Access",
    description:
      "Dedicated workspaces for Business Owners, Doctors/Staff, Super Admins, and Subscription management.",
    ctaLabel: "Create Account",
    to: "/register",
  },
  {
    title: "Affiliate & Payout Tracking",
    badge: "Growth Module",
    description:
      "Referral link tracking (`?ref=`), affiliate dashboard, and withdrawal workflows built into the platform.",
    ctaLabel: "Open Affiliate View",
    to: "/affiliate",
  },
];

export default function LandingPage() {
  const { user, token } = useSelector((state) => state.auth || {});

  // Agar user already logged in hai, toh role ke hisab se redirect karein
  if (token && user) {
    if (user.role === "admin" || user.role === "super_admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "staff") {
      return <Navigate to="/doctor-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="h-9 w-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                M
              </span>
              <span className="font-bold text-base sm:text-xl tracking-tight text-slate-900 truncate">
                CodeWithMission
              </span>
            </Link>
            <a
              href={PERSONAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              Personal Site ↗
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#demos" className="hover:text-indigo-600 transition">
              SaaS Demos
            </a>
            <a href="#features" className="hover:text-indigo-600 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">
              How It Works
            </a>
            <a href="#contact" className="hover:text-indigo-600 transition">
              Contact &amp; Social
            </a>
          </nav>

          {/* Login & Sign Up Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="px-3 sm:px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3.5 sm:px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-18 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  CodeWithMission • SaaS &amp; Appointment Hub
                </span>
                <a
                  href={PERSONAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 transition"
                >
                  codewithmission.site ↗
                </a>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Manage appointments, slots &amp; SaaS demos{" "}
                <span className="text-indigo-600">in one place.</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Welcome to <strong>CodeWithMission</strong>. Explore live SaaS
                workflows, share public booking links, manage doctors, staff,
                and schedules, or connect directly for custom builds and support.
              </p>

              {/* Primary CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 text-center text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  Get Started Free — Sign Up
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 text-center text-base font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition"
                >
                  Login to Account
                </Link>
                <a
                  href={PERSONAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3.5 text-center text-base font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition"
                >
                  Visit Personal Web ↗
                </a>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-slate-500">
                Instant access to SaaS demos • WhatsApp &amp; Email support available
              </p>
            </div>

            {/* Right Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase">
                      Personal Hub &amp; Booking Link
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                      codewithmission.site • /book/your-clinic-slug
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">SaaS Modules</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">3+</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500">Active Slots</p>
                    <p className="text-xl font-bold text-indigo-600 mt-1">24</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-indigo-50/60">
                    <span className="font-medium text-slate-800">
                      Doctor &amp; Staff Scheduling
                    </span>
                    <span className="text-xs font-semibold text-indigo-700">
                      Synced
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50">
                    <span className="font-medium text-slate-800">
                      Rescheduling &amp; Confirmations
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Automated
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
                  >
                    Chat on WhatsApp (9354689368)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SaaS Demos Section */}
        <section
          id="demos"
          className="bg-white border-y border-slate-200 py-14 sm:py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Interactive SaaS Demos
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Explore SaaS products &amp; workflows
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
                  Test appointment booking, role dashboards, and affiliate flows,
                  or visit CodeWithMission for more projects and builds.
                </p>
              </div>
              <a
                href={PERSONAL_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition self-start md:self-auto"
              >
                All Demos on codewithmission.site ↗
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SAAS_DEMOS.map((demo) => (
                <div
                  key={demo.title}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700">
                      {demo.badge}
                    </span>
                    <h3 className="mt-3.5 text-lg font-bold text-slate-900">
                      {demo.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {demo.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3">
                    <Link
                      to={demo.to}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      {demo.ctaLabel} →
                    </Link>
                    <a
                      href={PERSONAL_SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                    >
                      Site ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Everything you need to run bookings smoothly
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                Built for growing businesses, clinics, and multi-staff teams.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80">
                <h3 className="text-lg font-semibold text-slate-900">
                  Public Booking Pages
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Share a dedicated booking link so customers can pick open
                  slots and get instant confirmation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80">
                <h3 className="text-lg font-semibold text-slate-900">
                  Slot &amp; Holiday Control
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Configure working hours, time slots, and holidays effortlessly
                  without double bookings.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  Multi-Role Team Access
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Dedicated views for owners, doctors/staff, affiliates, and
                  administrators.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works & CTA */}
        <section
          id="how-it-works"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Start in 3 simple steps
              </h3>
              <ol className="space-y-3.5 text-sm sm:text-base text-slate-600 list-decimal list-inside">
                <li>
                  <strong className="text-slate-900">Sign Up</strong> and
                  complete your business onboarding.
                </li>
                <li>
                  <strong className="text-slate-900">Add team &amp; slots</strong>{" "}
                  for doctors, staff, and daily availability.
                </li>
                <li>
                  <strong className="text-slate-900">Share &amp; manage</strong>{" "}
                  bookings from your dashboard.
                </li>
              </ol>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-indigo-600 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Ready to launch or test the platform?
                </h3>
                <p className="mt-2.5 text-sm sm:text-base text-indigo-100 leading-relaxed">
                  Create a free account to explore the workspace, log in to your
                  dashboard, or visit CodeWithMission for more SaaS demos.
                </p>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link
                  to="/register"
                  className="px-5 py-3 text-center text-sm font-semibold bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                >
                  Create Free Account (Sign Up)
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-3 text-center text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400 rounded-xl transition"
                >
                  Login
                </Link>
                <a
                  href={PERSONAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 text-center text-sm font-semibold bg-indigo-800/70 hover:bg-indigo-800 text-white rounded-xl transition"
                >
                  CodeWithMission ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Social / Connect Section */}
        <section
          id="contact"
          className="bg-white border-t border-slate-200 py-14 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Connect &amp; Support
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Get in touch with CodeWithMission
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  Reach out on WhatsApp or email for SaaS demos, custom web/app
                  development, or account assistance.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp Card */}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 transition block"
                >
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    WhatsApp Direct
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-slate-900">
                    +91 9354689368
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 font-medium">
                    Tap to start WhatsApp chat ↗
                  </p>
                </a>

                {/* Personal Website Card */}
                <a
                  href={PERSONAL_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 transition block"
                >
                  <p className="text-xs font-semibold uppercase text-indigo-700">
                    Personal Website &amp; Social Hub
                  </p>
                  <p className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 break-all">
                    codewithmission.site
                  </p>
                  <p className="mt-1 text-xs text-indigo-800 font-medium">
                    Explore all demos &amp; social links ↗
                  </p>
                </a>

                {/* Email 1 */}
                <a
                  href="mailto:missionk935@gmail.com"
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition block"
                >
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Primary Email
                  </p>
                  <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 break-all">
                    missionk935@gmail.com
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Send email directly
                  </p>
                </a>

                {/* Email 2 */}
                <a
                  href="mailto:missionk408@gmail.com"
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition block"
                >
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Secondary Email
                  </p>
                  <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 break-all">
                    missionk408@gmail.com
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Send email directly
                  </p>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            <a
              href={PERSONAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 hover:text-indigo-600"
            >
              CodeWithMission
            </a>
            . All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
            <a
              href={PERSONAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800"
            >
              Personal Web
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800"
            >
              WhatsApp: 9354689368
            </a>
            <a
              href="mailto:missionk935@gmail.com"
              className="hover:text-slate-800"
            >
              missionk935@gmail.com
            </a>
            <Link to="/login" className="hover:text-slate-800">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-800">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
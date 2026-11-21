import {
  FaUsers,
  FaUserShield,
  FaTachometerAlt,
  FaUserMd,
  FaHandshake,
  FaCreditCard,
  FaTimes,
  FaCalendarAlt,
  FaClinicMedical,
  FaCalendarTimes,
  FaClock,
  FaMoneyBillWave,
  FaBell,
} from "react-icons/fa";

export default function AdminSidebar({
  t,
  user,
  activeSection,
  onSelectSection = () => {},
  isOpen = true,
  onClose = () => {},
}) {
  const isSuperAdmin = user?.role === "super_admin";

  const navItems = [
    { id: "overview", label: "Overview", icon: FaTachometerAlt },
    { id: "users", label: "Users", icon: FaUsers },
    ...(isSuperAdmin
      ? [{ id: "super_admin", label: "Super Admins", icon: FaUserShield }]
      : []),
    { id: "businesses", label: "Businesses / Clinics", icon: FaClinicMedical },
    { id: "doctors", label: "Doctors", icon: FaUserMd },
    { id: "appointments", label: "Appointments", icon: FaCalendarAlt },
    { id: "slots", label: "Slots", icon: FaClock },
    { id: "holidays", label: "Holidays", icon: FaCalendarTimes },
    { id: "subscriptions", label: "Subscriptions", icon: FaCreditCard },
    { id: "withdrawals", label: "Withdrawals", icon: FaMoneyBillWave },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "affiliate", label: "Affiliate", icon: FaHandshake },
  ];

  const handleOptionClick = (sectionId, isMobile) => {
    if (typeof onSelectSection === "function") onSelectSection(sectionId);
    if (isMobile && typeof onClose === "function") onClose();
  };

  const renderContent = (isMobile = false) => (
    <aside
      className={`w-64 shrink-0 rounded-2xl border ${t.card} ${t.border} p-4 h-[calc(100vh-2rem)] overflow-y-auto sticky top-4 transition-colors duration-200`}
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-inherit">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${t.muted}`}>
            Admin Sections
          </p>
          <p className={`text-xs font-bold mt-0.5 ${t.accentText}`}>
            Role: {(user?.role || "admin").toUpperCase()}
          </p>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${t.soft} ${t.text} ${t.hover} transition cursor-pointer`}
          >
            <FaTimes />
          </button>
        )}
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOptionClick(item.id, isMobile)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer ${
                isActive ? `${t.accent} text-white shadow-sm` : `${t.text} ${t.hover}`
              }`}
            >
              <Icon className="text-sm shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="hidden lg:block">{renderContent(false)}</div>
      <div className="fixed inset-0 z-50 lg:hidden flex">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px]" onClick={onClose} />
        <div className="relative z-10 p-3">{renderContent(true)}</div>
      </div>
    </>
  );
}
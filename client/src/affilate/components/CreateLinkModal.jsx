import { useEffect, useState } from "react";
import { FaLink, FaTimes, FaPlus, FaSpinner } from "react-icons/fa";
import { themes } from "../../constants/themes";

const CreateLinkModal = ({
  isOpen,
  onClose,
  newLink,
  setNewLink,
  onSubmit,
  isCreating,
  theme: propTheme,
}) => {
  const [activeThemeName, setActiveThemeName] = useState(() => {
    if (typeof propTheme === "string" && themes[propTheme]) {
      return propTheme;
    }
    return localStorage.getItem("dashboard-theme") || "day";
  });

  useEffect(() => {
    if (typeof propTheme === "string" && themes[propTheme]) {
      setActiveThemeName(propTheme);
      return;
    }
    const saved = localStorage.getItem("dashboard-theme");
    if (saved && themes[saved]) {
      setActiveThemeName(saved);
    }
  }, [propTheme, isOpen]);

  if (!isOpen) return null;

  const t =
    propTheme && typeof propTheme === "object"
      ? propTheme
      : themes[activeThemeName] || themes.day;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 md:px-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
          onClick={onClose}
        />

        <div
          className={`relative ${t.card} rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 border ${t.border} transition-colors duration-200`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-bold ${t.text} flex items-center gap-2`}
            >
              <FaLink className={t.accentText} />
              Create Affiliate Link
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`${t.muted} hover:opacity-100 transition`}
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
                >
                  Link Name *
                </label>
                <input
                  type="text"
                  value={newLink.name}
                  onChange={(e) =>
                    setNewLink({ ...newLink, name: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., Clinic Booking Page Link"
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
                >
                  Destination URL *
                </label>
                <input
                  type="url"
                  value={newLink.destination}
                  onChange={(e) =>
                    setNewLink({ ...newLink, destination: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="http://localhost:5173/subscription"
                  required
                />
                <p className={`text-xs ${t.muted} mt-1`}>
                  Where users will be redirected after clicking
                </p>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wide ${t.muted} mb-1.5`}
                >
                  Custom Slug (Optional)
                </label>
                <input
                  type="text"
                  value={newLink.slug}
                  onChange={(e) =>
                    setNewLink({ ...newLink, slug: e.target.value })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} text-sm outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="my-clinic-promo"
                />
                <p className={`text-xs ${t.muted} mt-1`}>
                  Leave blank for auto-generated slug
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} transition-colors text-xs font-semibold w-full sm:w-auto`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCreating}
                className={`${t.accent} text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-xs font-bold w-full sm:w-auto disabled:opacity-50`}
              >
                {isCreating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus /> Create Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLinkModal;
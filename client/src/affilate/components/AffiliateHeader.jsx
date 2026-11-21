import { useEffect, useState } from "react";
import { FaHistory, FaWallet, FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";
import { themes } from "../../constants/themes";

const AffiliateHeader = ({
  affiliate,
  onToggleHistory,
  showHistory,
  onWithdraw,
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
  }, [propTheme]);

  const t =
    propTheme && typeof propTheme === "object"
      ? propTheme
      : themes[activeThemeName] || themes.day;

  const handleCopyCode = async () => {
    if (!affiliate?.affiliateCode) return;
    try {
      await navigator.clipboard.writeText(affiliate.affiliateCode);
      toast.success("Affiliate code copied!");
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div
      className={`${t.card} rounded-2xl p-4 md:p-6 border ${t.border} transition-colors duration-200`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${t.text}`}>
            🤝 Affiliate Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase ${t.muted}`}>
              Code:
            </span>
            <code
              className={`${t.soft} border ${t.border} px-2.5 md:px-3 py-1 rounded-lg text-sm font-mono font-bold ${t.accentText}`}
            >
              {affiliate?.affiliateCode || "—"}
            </code>
            {affiliate?.affiliateCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                className={`p-1.5 rounded-lg border ${t.border} ${t.soft} ${t.text} ${t.hover} transition`}
                title="Copy Affiliate Code"
              >
                <FaCopy className="text-xs" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onToggleHistory}
            className={`flex items-center justify-center gap-2 px-3.5 md:px-4 py-2.5 rounded-xl border ${t.border} ${t.soft} ${t.text} ${t.hover} transition-colors text-xs font-semibold flex-1 md:flex-initial`}
          >
            <FaHistory /> {showHistory ? "Hide" : "Show"} History
          </button>

          <button
            type="button"
            onClick={onWithdraw}
            className={`${t.accent} text-white px-4 md:px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all text-xs font-bold flex-1 md:flex-initial`}
          >
            <FaWallet /> Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;
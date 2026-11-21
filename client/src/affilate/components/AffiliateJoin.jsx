import { useEffect, useState } from "react";
import { FaRocket, FaGift, FaShare, FaWallet } from "react-icons/fa";
import { themes } from "../../constants/themes";

const AffiliateJoin = ({ onJoin, stats, theme: propTheme }) => {
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

  const rate = stats?.commissionRate || 10;

  return (
    <div className={`${t.page} p-4 md:p-6 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div
          className={`${t.accent} rounded-2xl p-6 md:p-8 text-white text-center shadow-lg`}
        >
          <FaRocket className="text-5xl md:text-6xl mx-auto mb-4 opacity-95" />
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Join Affiliate Program
          </h2>
          <p className="text-base md:text-lg opacity-90 mb-6">
            Earn {rate}% commission on every referral
          </p>
          <button
            type="button"
            onClick={onJoin}
            className="bg-white text-gray-900 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold hover:opacity-95 transition-all shadow-md hover:scale-105 transform duration-200"
          >
            Join Now - It&apos;s Free!
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
          <div
            className={`${t.card} p-4 md:p-6 rounded-xl border ${t.border} transition-colors duration-200`}
          >
            <FaGift className={`text-3xl ${t.accentText} mx-auto mb-3`} />
            <h3 className={`font-bold text-center ${t.text}`}>
              Earn Commission
            </h3>
            <p className={`text-sm text-center ${t.muted} mt-1`}>
              {rate}% on every sale you refer
            </p>
          </div>

          <div
            className={`${t.card} p-4 md:p-6 rounded-xl border ${t.border} transition-colors duration-200`}
          >
            <FaShare className="text-3xl text-blue-500 mx-auto mb-3" />
            <h3 className={`font-bold text-center ${t.text}`}>Share Easily</h3>
            <p className={`text-sm text-center ${t.muted} mt-1`}>
              Create links and share anywhere
            </p>
          </div>

          <div
            className={`${t.card} p-4 md:p-6 rounded-xl border ${t.border} transition-colors duration-200`}
          >
            <FaWallet className="text-3xl text-green-500 mx-auto mb-3" />
            <h3 className={`font-bold text-center ${t.text}`}>Get Paid</h3>
            <p className={`text-sm text-center ${t.muted} mt-1`}>
              Withdraw your earnings anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateJoin;
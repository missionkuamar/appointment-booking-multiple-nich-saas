import { useEffect, useState } from "react";
import {
  FaPlus,
  FaCopy,
  FaTrash,
  FaLink,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { themes } from "../../constants/themes";

const AffiliateLinks = ({
  links = [],
  affiliateCode = "",
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  onPageChange,
  onLimitChange,
  onCopyLink,
  onDeleteLink,
  onCreateLink,
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

  const currentPage = Number(pagination?.page) || 1;
  const currentLimit = Number(pagination?.limit) || 10;
  const total = Number(pagination?.total) || 0;
  const totalPages = Math.max(1, Number(pagination?.pages) || 1);

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page) => {
    const newPage = Number(page);
    if (
      !Number.isInteger(newPage) ||
      newPage < 1 ||
      newPage > totalPages ||
      newPage === currentPage
    ) {
      return;
    }
    onPageChange?.(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    if (!newLimit) return;
    onLimitChange?.(newLimit);
  };

  const startItem =
    total === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, total);

  const isEmpty = links.length === 0;

  const baseButtonClass =
    "flex items-center justify-center transition-all duration-200 rounded-lg";

  return (
    <section
      className={`${t.card} rounded-2xl border ${t.border} overflow-hidden transition-colors duration-200`}
    >
      {/* HEADER */}
      <div
        className={`px-4 sm:px-6 py-4 border-b ${t.border} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2">
            <FaLink className={t.accentText} />
            <h2 className={`text-lg sm:text-xl font-bold ${t.text}`}>
              Affiliate Links
            </h2>
          </div>
          <p className={`text-xs sm:text-sm ${t.muted} mt-1`}>
            Create and manage your affiliate links
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateLink}
          className={`${t.accent} text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all hover:opacity-90 active:scale-[0.98] w-full sm:w-auto`}
        >
          <FaPlus />
          Create Link
        </button>
      </div>

      {/* CONTENT */}
      {isEmpty ? (
        <div className="px-6 py-14 text-center">
          <div
            className={`w-16 h-16 rounded-2xl ${t.soft} border ${t.border} flex items-center justify-center mx-auto mb-4`}
          >
            <FaLink className={`text-2xl ${t.accentText}`} />
          </div>

          <h3 className={`text-base font-bold ${t.text} mb-2`}>
            No affiliate links yet
          </h3>

          <p className={`text-sm ${t.muted} mb-5`}>
            Create your first affiliate link to start tracking referrals.
          </p>

          <button
            type="button"
            onClick={onCreateLink}
            className={`${t.accent} text-white px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-xs font-bold hover:opacity-90 transition`}
          >
            <FaPlus />
            Create Your First Link
          </button>
        </div>
      ) : (
        <>
          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className={`${t.soft} border-b ${t.border}`}>
                  <th
                    className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide ${t.muted}`}
                  >
                    Link
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${t.muted}`}
                  >
                    Slug
                  </th>
                  <th
                    className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${t.muted}`}
                  >
                    Clicks
                  </th>
                  <th
                    className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide ${t.muted}`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-4 sm:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide ${t.muted}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={`divide-y ${t.border}`}>
                {links.map((link) => {
                  const clicks = Number(link.clicks) || 0;

                  return (
                    <tr
                      key={link._id}
                      className={`${t.hover} transition-colors`}
                    >
                      {/* LINK */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="max-w-[260px]">
                          <p
                            className={`text-sm font-semibold ${t.text} truncate`}
                            title={link.name}
                          >
                            {link.name || "Unnamed Link"}
                          </p>
                          <p
                            className={`text-xs ${t.muted} truncate mt-1`}
                            title={link.destination}
                          >
                            {link.destination || "-"}
                          </p>
                        </div>
                      </td>

                      {/* SLUG */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-mono ${t.soft} ${t.text} border ${t.border}`}
                        >
                          /{link.slug || "-"}
                        </span>
                      </td>

                      {/* CLICKS */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-semibold ${t.text}`}>
                          {clicks}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            link.status === "active"
                              ? "bg-green-500/15 text-green-500"
                              : "bg-red-500/15 text-red-500"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                          {link.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onCopyLink?.(link.slug, affiliateCode)
                            }
                            className={`${baseButtonClass} w-9 h-9 ${t.hover} ${t.text} hover:scale-105`}
                            title="Copy affiliate link"
                            aria-label="Copy affiliate link"
                          >
                            <FaCopy className="text-sm opacity-80" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteLink?.(link._id)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105 hover:bg-red-500/15"
                            title="Delete link"
                            aria-label="Delete affiliate link"
                          >
                            <FaTrash className="text-sm text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div
            className={`px-4 sm:px-6 py-4 border-t ${t.border} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-3 text-xs sm:text-sm ${t.muted}`}
            >
              <span>
                Showing <strong className={t.text}>{startItem}</strong> to{" "}
                <strong className={t.text}>{endItem}</strong> of{" "}
                <strong className={t.text}>{total}</strong> links
              </span>

              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <select
                  value={currentLimit}
                  onChange={handleLimitChange}
                  className={`px-2.5 py-1.5 rounded-lg border ${t.border} ${t.card} ${t.text} text-xs sm:text-sm outline-none cursor-pointer`}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={!hasPrevious}
                onClick={() => handlePageChange(1)}
                className={`${baseButtonClass} w-9 h-9 border ${t.border} ${t.text} ${
                  !hasPrevious
                    ? "opacity-30 cursor-not-allowed"
                    : `${t.hover} hover:scale-105`
                }`}
                title="First page"
                aria-label="First page"
              >
                <FaAngleDoubleLeft className="text-xs" />
              </button>

              <button
                type="button"
                disabled={!hasPrevious}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`${baseButtonClass} w-9 h-9 border ${t.border} ${t.text} ${
                  !hasPrevious
                    ? "opacity-30 cursor-not-allowed"
                    : `${t.hover} hover:scale-105`
                }`}
                title="Previous page"
                aria-label="Previous page"
              >
                <FaChevronLeft className="text-xs" />
              </button>

              <div className="flex items-center gap-1">
                {pageNumbers.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`dots-${index}`}
                        className={`w-9 h-9 flex items-center justify-center text-sm ${t.muted}`}
                      >
                        ...
                      </span>
                    );
                  }

                  const active = page === currentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`${baseButtonClass} w-9 h-9 text-sm font-bold ${
                        active
                          ? `${t.accent} text-white shadow-sm`
                          : `${t.text} ${t.hover}`
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`${baseButtonClass} w-9 h-9 border ${t.border} ${t.text} ${
                  hasNext
                    ? `${t.hover} hover:scale-105`
                    : "opacity-30 cursor-not-allowed"
                }`}
                title="Next page"
                aria-label="Next page"
              >
                <FaChevronRight className="text-xs" />
              </button>

              <button
                type="button"
                disabled={!hasNext}
                onClick={() => handlePageChange(totalPages)}
                className={`${baseButtonClass} w-9 h-9 border ${t.border} ${t.text} ${
                  !hasNext
                    ? "opacity-30 cursor-not-allowed"
                    : `${t.hover} hover:scale-105`
                }`}
                title="Last page"
                aria-label="Last page"
              >
                <FaAngleDoubleRight className="text-xs" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AffiliateLinks;
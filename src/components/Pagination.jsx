import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, search, setPage }) {
  if (search || totalPages <= 1) return null;

  const pages = [];

  // ============================================================
  // DYNAMIC DISPLAY LIMIT
  //
  // Start by showing up to page 100.
  // Once the user goes beyond 100, expand dynamically.
  // ============================================================

  const visibleTotalPages = Math.min(totalPages, Math.max(100, page));

  // ============================================================
  // PREVIOUS
  // ============================================================

  pages.push(
    <button
      key="prev"
      className="page-btn"
      disabled={page === 1}
      onClick={() => setPage(Math.max(page - 1, 1))}
    >
      <ChevronLeft size={18} />
    </button>,
  );

  // ============================================================
  // VISIBLE RANGE
  // ============================================================

  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(visibleTotalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // ============================================================
  // FIRST PAGE
  // ============================================================

  if (startPage > 1) {
    pages.push(
      <button
        key="first"
        className={`page-btn ${page === 1 ? "active" : ""}`}
        onClick={() => setPage(1)}
      >
        1
      </button>,
    );

    if (startPage > 2) {
      pages.push(
        <span key="start-dots" className="page-dots">
          ...
        </span>,
      );
    }
  }

  // ============================================================
  // MIDDLE PAGES
  // ============================================================

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        className={`page-btn ${page === i ? "active" : ""}`}
        onClick={() => {
          setPage(i);

          document.querySelector(".games-section")?.scrollIntoView({
            behavior: "auto",
            block: "start",
          });
        }}
      >
        {i}
      </button>,
    );
  }

  // ============================================================
  // DYNAMIC END
  //
  // If there are more pages than currently exposed,
  // show dots + the current known boundary.
  // ============================================================

  if (visibleTotalPages < totalPages) {
    pages.push(
      <span key="end-dots" className="page-dots">
        ...
      </span>,
    );

    pages.push(
      <button
        key="dynamic-end"
        className="page-btn"
        onClick={() => setPage(visibleTotalPages)}
      >
        {visibleTotalPages}
      </button>,
    );
  }

  // ============================================================
  // NEXT
  // ============================================================

  pages.push(
    <button
      key="next"
      className="page-btn"
      disabled={page >= totalPages}
      onClick={() => {
        if (page < totalPages) {
          setPage(page + 1);
        }
      }}
    >
      <ChevronRight size={18} />
    </button>,
  );

  return <div id="pagination">{pages}</div>;
}

export default Pagination;

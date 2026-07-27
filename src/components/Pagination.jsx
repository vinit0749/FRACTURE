import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, search, setPage }) {
  if (search) return null;

  const pages = [];

  // Previous button
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

  // Visible range
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // First page
  if (startPage > 1) {
    pages.push(
      <button key="first" className="page-btn" onClick={() => setPage(1)}>
        1
      </button>,
    );
    ``;

    if (startPage > 2) {
      pages.push(
        <span key="start-dots" className="page-dots">
          ...
        </span>,
      );
    }
  }

  // Middle pages
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

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="end-dots" className="page-dots">
          ...
        </span>,
      );
    }

    pages.push(
      <button
        key="last"
        className="page-btn"
        onClick={() => setPage(totalPages)}
      >
        {totalPages}
      </button>,
    );
  }

  // Next button
  pages.push(
    <button
      key="next"
      className="page-btn"
      disabled={page === totalPages}
      onClick={() => setPage(Math.min(page + 1, totalPages))}
    >
      <ChevronRight size={18} />
    </button>,
  );

  return <div id="pagination">{pages}</div>;
}

export default Pagination;

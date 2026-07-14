import { useRef, useState } from "react";

import Header from "../components/Layout/Header";
import ExploreSection from "../components/Explore/ExploreSection";

function TopRatedPage() {
  const exploreRef = useRef(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sort] = useState("-rating");

  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");

  const section = "top-rated";

  function changePage(newPage) {
    setPage(newPage);

    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 100);
  }

  function updateSearchInput(value) {
    setSearchInput(value);

    if (value.trim() === "") {
      setSearch("");
      setPage(1);
    }
  }

  function performSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");

    setGenre("");
    setPlatform("");

    setPage(1);
  }

  return (
    <>
      <Header
        searchInput={searchInput}
        updateSearchInput={updateSearchInput}
        performSearch={performSearch}
      />

      <div className="container">
        <div ref={exploreRef}>
          <ExploreSection
            title="Top Rated Games"
            subtitle="Discover the highest-rated games across every platform."
            page={page}
            setPage={changePage}
            totalPages={totalPages}
            setTotalPages={setTotalPages}
            search={search}
            setSearch={setSearch}
            searchInput={searchInput}
            updateSearchInput={updateSearchInput}
            performSearch={performSearch}
            sort={sort}
            genre={genre}
            setGenre={setGenre}
            platform={platform}
            setPlatform={setPlatform}
            section={section}
            resetFilters={resetFilters}
          />
        </div>
      </div>
    </>
  );
}

export default TopRatedPage;

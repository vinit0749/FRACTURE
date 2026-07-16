import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Header from "../components/Layout/Header";
import Hero from "../components/Hero/Hero";
import HomeCarousels from "../components/Home/HomeCarousels";
import HomeSkeleton from "../components/Home/HomeSkeleton";
import ExploreSection from "../components/Explore/ExploreSection";
import Footer from "../components/Layout/Footer";

import useHero from "../hooks/useHero";
import useHomeCarousels from "../hooks/useHomeCarousels";

function HomePage() {
  const {
    featuredGame,
    heroImages,
    heroMeta,
    loading: heroLoading,
  } = useHero();

  const { loading: carouselLoading } = useHomeCarousels();

  const exploreRef = useRef(null);

  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [searchSource, setSearchSource] = useState("");

  const [sort, setSort] = useState("-added");

  const [genre, setGenre] = useState("");

  const [platform, setPlatform] = useState("");

  const [section, setSection] = useState("explore");

  useEffect(() => {
    const query = searchParams.get("search")?.trim() || "";

    setSearchInput(query);

    setSearch(query);

    setSearchSource(query ? "header" : "");

    setPage(1);

    if (query) {
      setTimeout(() => {
        exploreRef.current?.scrollIntoView({
          behavior: "smooth",

          block: "start",
        });
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    function resetHome() {
      setPage(1);

      setSearchInput("");

      setSearch("");

      setSearchSource("");

      setSort("-added");

      setGenre("");

      setPlatform("");

      setSection("explore");
    }

    window.addEventListener("resetHome", resetHome);

    return () => {
      window.removeEventListener("resetHome", resetHome);
    };
  }, []);

  function changePage(newPage) {
    setPage(newPage);

    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "auto",

        block: "start",
      });
    }, 100);
  }

  function updateSearchInput(value, source) {
    setSearchInput(value);

    if (value.trim() === "") {
      setSearch("");

      setSearchSource(source);

      setPage(1);
    }
  }

  function performSearch(source) {
    setSearch(searchInput.trim());

    setSearchSource(source);

    setPage(1);
  }

  function resetFilters() {
    setSearchInput("");

    setSearch("");

    setSort("-added");

    setGenre("");

    setPlatform("");

    setPage(1);

    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "smooth",

        block: "start",
      });
    }, 0);
  }

  const showHomeContent =
    section === "explore" &&
    page === 1 &&
    search === "" &&
    sort === "-added" &&
    genre === "" &&
    platform === "" &&
    (searchSource === "" || searchSource === "header");

  const showHomeSkeleton = showHomeContent && (heroLoading || carouselLoading);

  return (
    <>
      <Header
        searchInput={searchInput}
        updateSearchInput={updateSearchInput}
        performSearch={performSearch}
      />

      <div className="container">
        {showHomeSkeleton && <HomeSkeleton />}

        {showHomeContent && !showHomeSkeleton && featuredGame && (
          <>
            <div className="hero-wrapper">
              <Hero
                hero={featuredGame}
                heroImages={heroImages}
                heroMeta={heroMeta}
              />
            </div>

            <HomeCarousels />
          </>
        )}

        <div ref={exploreRef}>
          <ExploreSection
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
            setSort={setSort}
            genre={genre}
            setGenre={setGenre}
            platform={platform}
            setPlatform={setPlatform}
            section={section}
            setSection={setSection}
            resetFilters={resetFilters}
          />
        </div>
      </div>

      <Footer />
    </>
  );
}

export default HomePage;

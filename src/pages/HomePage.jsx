import { useRef, useState } from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import ExploreSection from "../components/Explore/ExploreSection";
import Footer from "../components/Footer";

import useHero from "../hooks/useHero";

function HomePage() {
  const { featuredGame, screenshots } = useHero();

  const exploreRef = useRef(null);

  const [page, setPage] = useState(1);
  const [totalPages] = useState(100);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-added");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [section, setSection] = useState("explore");

  function changePage(newPage) {
    setPage(newPage);

    setTimeout(() => {
      exploreRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 100);
  }

  const showHero = section === "explore" && page === 1 && search.trim() === "";

  return (
    <>
      <Header />

      <div className="container">
        <div className={`hero-wrapper ${showHero ? "visible" : "hidden"}`}>
          <Hero hero={featuredGame} screenshots={screenshots} />
        </div>

        <div ref={exploreRef}>
          <ExploreSection
            page={page}
            setPage={changePage}
            totalPages={totalPages}
            search={search}
            setSearch={setSearch}
            sort={sort}
            setSort={setSort}
            genre={genre}
            setGenre={setGenre}
            platform={platform}
            setPlatform={setPlatform}
            section={section}
            setSection={setSection}
          />
        </div>
      </div>

      <Footer />
    </>
  );
}

export default HomePage;

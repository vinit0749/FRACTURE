import { useEffect, useState } from "react";
import { fetchGenres, fetchPlatforms } from "../../api/rawg";

import ExploreToolbar from "./ExploreToolbar";
import GameGrid from "./GameGrid";
import Pagination from "../Pagination/Pagination";

function ExploreSection(props) {
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const genreData = await fetchGenres();
        const platformData = await fetchPlatforms();

        setGenres(genreData.results);
        setPlatforms(platformData.results);
      } catch (error) {
        console.error(error);
      }
    }

    loadFilters();
  }, []);

  return (
    <section className="games-section">
      <div className="section-header">
        <h2>Explore Games</h2>

        <ExploreToolbar {...props} genres={genres} platforms={platforms} />
      </div>

      <GameGrid {...props} />

      <Pagination
        page={props.page}
        totalPages={props.totalPages}
        search={props.search}
        setPage={props.setPage}
      />
    </section>
  );
}

export default ExploreSection;

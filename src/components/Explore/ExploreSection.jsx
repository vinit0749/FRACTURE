import useFilters from "../../hooks/useFilters";
import useGames from "../../hooks/useGames";

import ExploreToolbar from "./ExploreToolbar";
import GameGrid from "./GameGrid";
import Pagination from "../Pagination";

function ExploreSection(props) {
  const { genres, platforms } = useFilters();

  const { games, loading } = useGames({
    page: props.page,
    search: props.search,
    sort: props.sort,
    genre: props.genre,
    platform: props.platform,
    section: props.section,
    setTotalPages: props.setTotalPages,
  });

  return (
    <section className="games-section">
      <div className="section-header">
        <h2>{props.title || "Explore Games"}</h2>

        {props.subtitle && <p className="section-subtitle">{props.subtitle}</p>}

        <ExploreToolbar {...props} genres={genres} platforms={platforms} />
      </div>

      <GameGrid games={games} loading={loading} />

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

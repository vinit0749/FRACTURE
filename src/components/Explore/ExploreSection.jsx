import useFilters from "../../hooks/useFilters";

import ExploreToolbar from "./ExploreToolbar";
import GameGrid from "./GameGrid";
import Pagination from "../Pagination/Pagination";

function ExploreSection(props) {
  const { genres, platforms } = useFilters();

  return (
    <section className="games-section">
      <div className="section-header">
        <h2>{props.title || "Explore Games"}</h2>

        {props.subtitle && <p className="section-subtitle">{props.subtitle}</p>}

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

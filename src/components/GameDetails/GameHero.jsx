function GameHero({ game }) {
  if (!game) return null;

  let description =
    game.description_raw || game.description || "No description available.";

  const cut = description.indexOf("Español");

  if (cut !== -1) {
    description = description.slice(0, cut);
  }

  return (
    <>
      <div className="cover-wrap">
        <img
          id="game-image"
          className="game-image"
          src={game.background_image}
          alt={game.name}
        />
      </div>

      <div className="description-wrap">
        <div className="section-label">ABOUT THIS GAME</div>

        <p id="game-description">{description.trim()}</p>
      </div>
    </>
  );
}

export default GameHero;

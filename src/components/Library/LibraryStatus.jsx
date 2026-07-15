import { updateLibraryStatus } from "../../utils/storage";

function LibraryStatus({ game, onStatusChange }) {
  function handleStatusChange(e) {
    e.stopPropagation();

    updateLibraryStatus(game.id, e.target.value);

    onStatusChange?.();
  }

  return (
    <div
      className="library-status"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <label htmlFor={`status-${game.id}`} className="library-status-label">
        Collection Status
      </label>

      <select
        id={`status-${game.id}`}
        className="library-status-select"
        value={game.status || "backlog"}
        onChange={handleStatusChange}
      >
        <option value="backlog">Backlog</option>

        <option value="playing">Playing</option>

        <option value="completed">Completed</option>
      </select>
    </div>
  );
}

export default LibraryStatus;

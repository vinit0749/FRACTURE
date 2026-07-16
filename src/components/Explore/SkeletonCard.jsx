function SkeletonCard() {
  return (
    <div className="card-skeleton">
      <div className="card-skeleton-image skeleton-shimmer" />

      <div className="card-skeleton-content">
        <div className="card-skeleton-title skeleton-shimmer" />

        <div className="card-skeleton-meta">
          <span className="skeleton-shimmer" />

          <span className="skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;

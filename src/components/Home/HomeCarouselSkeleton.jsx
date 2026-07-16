function HomeCarouselSkeleton() {
  return (
    <section className="home-carousel-skeleton">
      <div className="home-carousel-skeleton-header">
        <span className="skeleton-shimmer" />
        <span className="skeleton-shimmer" />
      </div>

      <div className="home-carousel-skeleton-row">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="home-carousel-skeleton-card skeleton-shimmer"
          />
        ))}
      </div>
    </section>
  );
}

export default HomeCarouselSkeleton;

import HomeHeroSkeleton from "./HomeHeroSkeleton";
import HomeCarouselSkeleton from "./HomeCarouselSkeleton";

function HomeSkeleton() {
  return (
    <div className="home-skeleton">
      <HomeHeroSkeleton />

      <HomeCarouselSkeleton />

      <HomeCarouselSkeleton />

      <HomeCarouselSkeleton />
    </div>
  );
}

export default HomeSkeleton;

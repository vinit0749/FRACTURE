import Header from "./components/Header";
import Hero from "./components/Hero";
import GamesSection from "./components/GamesSection";
import Footer from "./components/Footer";

import useHero from "./hooks/useHero";

function App() {
  const { featuredGame, screenshots } = useHero();

  return (
    <>
      <Header />

      <div className="container">
        <Hero hero={featuredGame} screenshots={screenshots} />
        <GamesSection />
      </div>

      <Footer />
    </>
  );
}

export default App;

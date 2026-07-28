import { useEffect, useRef, useState } from "react";

import { useFortuna } from "../hooks/useFortuna.js";

import Header from "../components/Layout/Header.jsx";
import GameCard from "../components/Explore/GameCard.jsx";

import "../styles/fortuna.css";

function FortunaPage() {
  const [searchInput, setSearchInput] = useState("");

  const messagesEndRef = useRef(null);

  const {
    timeline = [],
    input = "",
    setInput,
    sendMessage,
    loading = false,
    intent = null,
    error = null,
    resetFortuna,
  } = useFortuna();

  // ============================================
  // SAFE TIMELINE
  // ============================================

  const safeTimeline = Array.isArray(timeline) ? timeline : [];

  const safeMessages = safeTimeline.filter(
    (item) =>
      item &&
      (item.role === "user" || item.role === "model") &&
      typeof item.content === "string",
  );

  const discoveryBlocks = safeTimeline.filter(
    (item) => item && item.type === "discovery",
  );

  // ============================================
  // HEADER SEARCH
  // ============================================

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  // ============================================
  // AUTO SCROLL
  // ============================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [safeTimeline.length, loading]);

  // ============================================
  // SEND MESSAGE
  // ============================================

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedInput = input?.trim();

    if (!trimmedInput || loading) {
      return;
    }

    sendMessage(trimmedInput);
  }

  // ============================================
  // PROMPT SUGGESTION
  // ============================================

  function handlePromptSelect(prompt) {
    if (loading) {
      return;
    }

    setInput(prompt);
  }

  // ============================================
  // DISCOVERY PROFILE
  // ============================================

  function renderIntentTags(discoveryIntent) {
    if (!discoveryIntent) {
      return null;
    }

    const tags = [];

    if (Array.isArray(discoveryIntent.genres)) {
      discoveryIntent.genres.forEach((genre) => {
        if (genre) {
          tags.push(genre);
        }
      });
    }

    if (discoveryIntent.setting) {
      tags.push(discoveryIntent.setting);
    }

    if (discoveryIntent.worldStructure) {
      tags.push(discoveryIntent.worldStructure);
    }

    if (discoveryIntent.exploration) {
      tags.push(`${discoveryIntent.exploration} exploration`);
    }

    if (discoveryIntent.storyImportance) {
      tags.push(`${discoveryIntent.storyImportance} story`);
    }

    if (tags.length === 0) {
      return null;
    }

    return (
      <div className="fortuna-discovery-profile">
        <span className="fortuna-discovery-profile-label">
          DISCOVERY PROFILE
        </span>

        <div className="fortuna-discovery-profile-tags">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>{tag}</span>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // DISCOVERY RESULT BLOCK
  // ============================================

  function renderDiscoveryBlock(discovery, discoveryIndex) {
    if (!discovery) {
      return null;
    }

    const recommendations = Array.isArray(discovery.recommendations)
      ? discovery.recommendations
      : [];

    const games = Array.isArray(discovery.games) ? discovery.games : [];

    const discoveryAnalysis = discovery.analysis || "";

    const discoveryIntent = discovery.intent || null;

    if (games.length === 0) {
      return null;
    }

    return (
      <section
        key={discovery.id || `discovery-${discoveryIndex}`}
        className="fortuna-discovery-results"
      >
        {/* ========================================
            DISCOVERY INTRO
        ======================================== */}

        <div className="fortuna-discovery-intro">
          <div className="fortuna-discovery-heading">
            <span className="fortuna-discovery-eyebrow">
              FORTUNA'S DISCOVERY
            </span>

            <h2>I think I found something for you.</h2>

            {discoveryAnalysis && <p>{discoveryAnalysis}</p>}
          </div>

          {renderIntentTags(discoveryIntent)}
        </div>

        {/* ========================================
            AI ANALYSIS
        ======================================== */}

        {recommendations.length > 0 && (
          <div className="fortuna-analysis">
            <div className="fortuna-analysis-header">
              <span className="fortuna-analysis-number">01</span>

              <div>
                <span className="fortuna-section-eyebrow">
                  FORTUNA'S ANALYSIS
                </span>

                <h3>Why these games stood out</h3>
              </div>
            </div>

            <div className="fortuna-analysis-list">
              {recommendations.slice(0, 6).map((recommendation, index) => (
                <article
                  key={`${recommendation?.gameName || "game"}-${index}`}
                  className="fortuna-analysis-item"
                >
                  <span className="fortuna-analysis-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="fortuna-analysis-content">
                    <h4>{recommendation?.gameName || "Recommended game"}</h4>

                    <p>
                      {recommendation?.reason ||
                        "This game matches the experience you described."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ========================================
            GAME CARDS
        ======================================== */}

        <div className="fortuna-games">
          <div className="fortuna-games-header">
            <span className="fortuna-section-number">02</span>

            <div>
              <span className="fortuna-section-eyebrow">YOUR MATCHES</span>

              <h3>Explore these worlds</h3>

              <p>
                These are the games I think fit what you've described. You can
                open one to explore it, or keep talking to me and I'll refine
                the search.
              </p>
            </div>
          </div>

          <div className="fortuna-results-grid">
            {games.map((game) => (
              <GameCard key={game.id} game={game} showLibraryStatus={false} />
            ))}
          </div>
        </div>

        {/* ========================================
            CONTINUE CONVERSATION
        ======================================== */}

        <div className="fortuna-continue">
          <div className="fortuna-continue-symbol">✦</div>

          <div>
            <strong>Keep talking to FORTUNA</strong>

            <p>
              Tell me what you liked, what you didn't, or ask me to find
              something completely different. Your discovery continues here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fortuna-page">
      {/* ==========================================
          GLOBAL HEADER
      ========================================== */}

      <Header searchInput={searchInput} updateSearchInput={updateSearchInput} />

      {/* ==========================================
          FORTUNA EXPERIENCE
      ========================================== */}

      <main className="fortuna-main">
        <div className="fortuna-shell">
          {/* ========================================
              TOP BAR
          ======================================== */}

          <header className="fortuna-topbar">
            <div className="fortuna-brand">
              <div className="fortuna-brand-symbol">✦</div>

              <div>
                <span className="fortuna-brand-eyebrow">FRACTURE AI</span>

                <h1>FORTUNA</h1>
              </div>
            </div>

            {safeMessages.length > 0 && (
              <button
                type="button"
                className="fortuna-new-chat"
                onClick={resetFortuna}
                disabled={loading}
              >
                <span>＋</span>
                New discovery
              </button>
            )}
          </header>

          {/* ========================================
              MAIN CONTENT
          ======================================== */}

          <div className="fortuna-content">
            {safeMessages.length === 0 ? (
              /* ======================================
                 EMPTY / WELCOME STATE
              ====================================== */

              <section className="fortuna-welcome">
                <div className="fortuna-welcome-mark">
                  <span>✦</span>
                </div>

                <span className="fortuna-welcome-eyebrow">
                  AI-POWERED GAME DISCOVERY
                </span>

                <h2>
                  What do you
                  <br />
                  want to play?
                </h2>

                <p className="fortuna-welcome-description">
                  Don't search for a title. Tell me about the experience you
                  want, and we'll figure it out together.
                </p>

                <div className="fortuna-suggestions">
                  <button
                    type="button"
                    onClick={() =>
                      handlePromptSelect(
                        "I want an RPG with a great story that I can really get lost in.",
                      )
                    }
                  >
                    <span className="fortuna-suggestion-icon">✦</span>

                    <span>
                      <strong>A story I can get lost in</strong>

                      <small>
                        Find an RPG with characters and a world worth caring
                        about.
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePromptSelect(
                        "I want a huge open world where exploration is the main focus.",
                      )
                    }
                  >
                    <span className="fortuna-suggestion-icon">◈</span>

                    <span>
                      <strong>A world to disappear into</strong>

                      <small>
                        Massive worlds, exploration, secrets and discovery.
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePromptSelect(
                        "I want something difficult but rewarding that feels great to master.",
                      )
                    }
                  >
                    <span className="fortuna-suggestion-icon">◆</span>

                    <span>
                      <strong>Something worth mastering</strong>

                      <small>
                        Challenging combat, skill and satisfying progression.
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePromptSelect(
                        "I loved Cyberpunk 2077. Find me something with a similar feeling but more exploration.",
                      )
                    }
                  >
                    <span className="fortuna-suggestion-icon">◇</span>

                    <span>
                      <strong>Something like a game I love</strong>

                      <small>
                        Start with a game you already know and we'll go from
                        there.
                      </small>
                    </span>
                  </button>
                </div>
              </section>
            ) : (
              /* ======================================
                 ACTIVE CONVERSATION
              ====================================== */

              <section className="fortuna-conversation">
                <div className="fortuna-message-list">
                  {safeTimeline.map((item, index) => {
                    /* ==================================
                       DISCOVERY BLOCK
                    ================================== */

                    if (item?.type === "discovery") {
                      return renderDiscoveryBlock(item, index);
                    }

                    /* ==================================
                       CHAT MESSAGE
                    ================================== */

                    if (item?.role !== "user" && item?.role !== "model") {
                      return null;
                    }

                    const isUser = item.role === "user";

                    return (
                      <div
                        key={`${item.role}-${index}`}
                        className={`fortuna-message ${
                          isUser
                            ? "fortuna-message-user"
                            : "fortuna-message-assistant"
                        }`}
                      >
                        {isUser ? (
                          <div className="fortuna-user-message">
                            <p>{item.content}</p>
                          </div>
                        ) : (
                          <div className="fortuna-assistant-message">
                            <div className="fortuna-assistant-avatar">✦</div>

                            <div className="fortuna-assistant-body">
                              <span className="fortuna-assistant-name">
                                FORTUNA
                              </span>

                              <p>{item.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ==================================
                      THINKING
                  ================================== */}

                  {loading && (
                    <div className="fortuna-message fortuna-message-assistant">
                      <div className="fortuna-assistant-message">
                        <div className="fortuna-assistant-avatar">✦</div>

                        <div className="fortuna-assistant-body">
                          <span className="fortuna-assistant-name">
                            FORTUNA
                          </span>

                          <div className="fortuna-thinking">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ==================================
                    ERROR
                ================================== */}

                {error && (
                  <div className="fortuna-error">
                    <div className="fortuna-error-icon">!</div>

                    <div>
                      <strong>Something went wrong.</strong>

                      <p>{error}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        sendMessage("Please try the discovery again.")
                      }
                      disabled={loading}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* ==================================
                    NO RESULTS
                ================================== */}

                {!loading &&
                  intent?.readyForDiscovery === true &&
                  safeMessages.length > 0 &&
                  discoveryBlocks.length === 0 &&
                  !error && (
                    <div className="fortuna-no-results">
                      <div className="fortuna-no-results-symbol">✦</div>

                      <h3>I couldn't find the right matches yet.</h3>

                      <p>
                        Tell me what you want to change and I'll keep looking.
                      </p>
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </section>
            )}
          </div>

          {/* ========================================
              INPUT
          ======================================== */}

          <div className="fortuna-input-wrapper">
            <form className="fortuna-input-container" onSubmit={handleSubmit}>
              <div className="fortuna-input-icon">✦</div>

              <input
                type="text"
                value={input || ""}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  safeMessages.length === 0
                    ? "Describe the game you're looking for..."
                    : "Tell FORTUNA what you think, or ask for something else..."
                }
                disabled={loading}
                aria-label="Message FORTUNA"
                autoComplete="off"
              />

              <button
                type="submit"
                disabled={!input?.trim() || loading}
                aria-label="Send message"
              >
                <span>↑</span>
              </button>
            </form>

            <div className="fortuna-input-footer">
              <span>
                FORTUNA learns what you're looking for through conversation.
              </span>

              {safeMessages.length > 0 && (
                <button type="button" onClick={resetFortuna} disabled={loading}>
                  Start a new discovery
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FortunaPage;

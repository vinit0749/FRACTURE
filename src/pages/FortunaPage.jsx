import { useEffect, useRef, useState } from "react";

import { useFortuna } from "../hooks/useFortuna.js";

import Header from "../components/Layout/Header.jsx";
import GameCard from "../components/Explore/GameCard.jsx";

import "../styles/fortuna.css";

function FortunaPage() {
  const [searchInput, setSearchInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    timeline = [],
    conversationId = null,

    conversations = [],

    input = "",
    setInput,

    sendMessage,

    loadConversation,
    removeConversation,

    isAuthenticated = false,

    loading = false,
    isHistoryLoading = false,

    error = null,
    historyError = null,

    resetFortuna,
  } = useFortuna();

  const safeTimeline = Array.isArray(timeline) ? timeline : [];

  const safeMessages = safeTimeline.filter(
    (item) =>
      item &&
      (item.role === "user" || item.role === "model") &&
      typeof item.content === "string",
  );

  function updateSearchInput(value) {
    setSearchInput(value);
  }

  /* ============================================================
     AUTO SCROLL
  ============================================================ */

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [safeTimeline.length, loading]);

  /* ============================================================
     AUTO FOCUS
  ============================================================ */

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading, conversationId]);

  /* ============================================================
     SEND MESSAGE
  ============================================================ */

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedInput = input?.trim();

    if (!trimmedInput || loading) {
      return;
    }

    sendMessage(trimmedInput);
  }

  /* ============================================================
     LOAD CONVERSATION
  ============================================================ */

  async function handleLoadConversation(id) {
    if (!id || loading) {
      return;
    }

    if (String(id) === String(conversationId)) {
      return;
    }

    try {
      await loadConversation(id);
    } catch (error) {
      console.error("Failed to open FORTUNA conversation:", error);
    }
  }

  /* ============================================================
     DELETE CONVERSATION
  ============================================================ */

  async function handleDeleteConversation(event, id) {
    event.stopPropagation();

    if (!id || deletingConversationId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this FORTUNA conversation permanently?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingConversationId(id);

    try {
      await removeConversation(id);
    } catch (error) {
      console.error("Failed to delete FORTUNA conversation:", error);
    } finally {
      setDeletingConversationId(null);
    }
  }

  /* ============================================================
     NEW DISCOVERY
  ============================================================ */

  function handleNewDiscovery() {
    if (loading) {
      return;
    }

    resetFortuna();

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  /* ============================================================
     FORMAT DATE
  ============================================================ */

  function formatConversationDate(date) {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* ============================================================
     DISCOVERY RESULTS
  ============================================================ */

  function renderDiscoveryBlock(discovery, discoveryIndex) {
    if (!discovery) {
      return null;
    }

    const recommendations = Array.isArray(discovery.recommendations)
      ? discovery.recommendations
      : [];

    const games = Array.isArray(discovery.games) ? discovery.games : [];

    if (games.length === 0) {
      return null;
    }

    return (
      <section
        key={discovery.id || `discovery-${discoveryIndex}`}
        className="fortuna-discovery-results"
      >
        <div className="fortuna-discovery-intro">
          <span className="fortuna-discovery-eyebrow">FORTUNA'S DISCOVERY</span>

          <h2>I think I found something for you.</h2>
        </div>

        {recommendations.length > 0 && (
          <div className="fortuna-analysis">
            <div className="fortuna-section-header">
              <span className="fortuna-section-number">01</span>

              <div>
                <span className="fortuna-section-eyebrow">
                  FORTUNA'S ANALYSIS
                </span>

                <h3>Why these games stood out</h3>
              </div>
            </div>

            <div className="fortuna-analysis-list">
              {recommendations.slice(0, 6).map((recommendation, index) => {
                if (!recommendation) {
                  return null;
                }

                return (
                  <article
                    key={`${recommendation.title || "game"}-${index}`}
                    className="fortuna-analysis-item"
                  >
                    <span className="fortuna-analysis-rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="fortuna-analysis-content">
                      <h4>{recommendation.title || "Recommended game"}</h4>

                      <p>
                        {recommendation.reason ||
                          "This game matches the experience you described."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="fortuna-games">
          <div className="fortuna-section-header">
            <span className="fortuna-section-number">02</span>

            <div>
              <span className="fortuna-section-eyebrow">YOUR MATCHES</span>

              <h3>Explore these worlds</h3>

              <p>
                These are the games I think fit what you've described. Open one
                to explore it, or keep talking to me and I'll refine the search.
              </p>
            </div>
          </div>

          <div className="fortuna-results-grid">
            {games.map((game) => {
              if (!game || !game.id) {
                return null;
              }

              return (
                <GameCard key={game.id} game={game} showLibraryStatus={false} />
              );
            })}
          </div>
        </div>

        <div className="fortuna-continue">
          <div className="fortuna-continue-symbol">✦</div>

          <div>
            <strong>Keep talking to FORTUNA</strong>

            <p>
              Tell me what you liked, what you didn't, or ask me to find
              something completely different.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="fortuna-page">
      {/* ==========================================================
          GLOBAL FRACTURE HEADER
      ========================================================== */}

      <Header searchInput={searchInput} updateSearchInput={updateSearchInput} />

      {/* ==========================================================
          FORTUNA APP
      ========================================================== */}

      <main className="fortuna-app">
        <div
          className={`fortuna-layout ${
            isHistoryOpen ? "history-is-open" : "history-is-closed"
          }`}
        >
          {/* ======================================================
              HISTORY SIDEBAR
          ====================================================== */}

          <aside className="fortuna-history">
            <div className="fortuna-history-inner">
              <div className="fortuna-history-header">
                <div>
                  <span className="fortuna-history-eyebrow">FORTUNA</span>

                  <h2>Discoveries</h2>
                </div>

                <button
                  type="button"
                  className="fortuna-history-close"
                  onClick={() => setIsHistoryOpen(false)}
                  aria-label="Close discovery history"
                >
                  ×
                </button>
              </div>

              <button
                type="button"
                className="fortuna-history-new"
                onClick={handleNewDiscovery}
                disabled={loading}
              >
                <span>＋</span>
                New discovery
              </button>

              {/* ====================================================
                  GUEST HISTORY MESSAGE
              ==================================================== */}

              {!isAuthenticated ? (
                <div className="fortuna-history-empty">
                  <strong>
                    Sign in to access your FORTUNA conversation history.
                  </strong>

                  <p>
                    You can still use FORTUNA as a guest. Sign in to save and
                    revisit your past discoveries.
                  </p>
                </div>
              ) : (
                <>
                  {historyError && (
                    <div className="fortuna-history-error">{historyError}</div>
                  )}

                  <div className="fortuna-history-list">
                    {isHistoryLoading ? (
                      <div className="fortuna-history-empty">
                        Loading discoveries...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="fortuna-history-empty">
                        Your saved discoveries will appear here.
                      </div>
                    ) : (
                      conversations.map((conversation) => {
                        if (!conversation?._id) {
                          return null;
                        }

                        const isActive =
                          String(conversation._id) === String(conversationId);

                        return (
                          <div
                            key={conversation._id}
                            className={`fortuna-history-item ${
                              isActive ? "fortuna-history-item-active" : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="fortuna-history-item-main"
                              onClick={() =>
                                handleLoadConversation(conversation._id)
                              }
                              disabled={loading}
                            >
                              <strong>
                                {conversation.title || "New Discovery"}
                              </strong>

                              <span>
                                {formatConversationDate(
                                  conversation.updatedAt ||
                                    conversation.createdAt,
                                )}
                              </span>
                            </button>

                            <button
                              type="button"
                              className="fortuna-history-delete"
                              onClick={(event) =>
                                handleDeleteConversation(
                                  event,
                                  conversation._id,
                                )
                              }
                              disabled={
                                deletingConversationId === conversation._id
                              }
                              aria-label={`Delete ${
                                conversation.title || "conversation"
                              }`}
                            >
                              {deletingConversationId === conversation._id
                                ? "..."
                                : "×"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* ======================================================
              CHAT WORKSPACE
          ====================================================== */}

          <section className="fortuna-workspace">
            {/* ====================================================
                FLOATING FORTUNA BAR
            ==================================================== */}

            <header className="fortuna-topbar">
              <div className="fortuna-brand">
                <button
                  type="button"
                  className="fortuna-menu-button"
                  onClick={() => setIsHistoryOpen(true)}
                  aria-label="Open discovery history"
                >
                  ☰
                </button>

                <div className="fortuna-brand-symbol">✦</div>

                <div className="fortuna-brand-copy">
                  <span className="fortuna-brand-eyebrow">FRACTURE AI</span>

                  <h1>FORTUNA</h1>
                </div>
              </div>

              {safeMessages.length > 0 && (
                <button
                  type="button"
                  className="fortuna-new-chat"
                  onClick={handleNewDiscovery}
                  disabled={loading}
                >
                  <span>＋</span>
                  New discovery
                </button>
              )}
            </header>

            {/* ====================================================
                CONTENT
            ==================================================== */}

            <div className="fortuna-content">
              {safeMessages.length === 0 ? (
                <section className="fortuna-welcome">
                  <div className="fortuna-welcome-mark">✦</div>

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
                </section>
              ) : (
                <section className="fortuna-conversation">
                  <div className="fortuna-message-list">
                    {safeTimeline.map((item, index) => {
                      if (item?.type === "discovery") {
                        return renderDiscoveryBlock(item, index);
                      }

                      if (item?.role !== "user" && item?.role !== "model") {
                        return null;
                      }

                      if (typeof item.content !== "string") {
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
                  </div>

                  {error && (
                    <div className="fortuna-error">
                      <div className="fortuna-error-icon">!</div>

                      <div className="fortuna-error-content">
                        <strong>Something went wrong.</strong>

                        <p>{error}</p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="fortuna-scroll-anchor" />
                </section>
              )}
            </div>

            {/* ====================================================
                STICKY CHAT INPUT
            ==================================================== */}

            <div className="fortuna-input-wrapper">
              <form className="fortuna-input-container" onSubmit={handleSubmit}>
                <div className="fortuna-input-icon">✦</div>

                <input
                  ref={inputRef}
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
                  ↑
                </button>
              </form>

              <div className="fortuna-input-footer">
                <span>
                  FORTUNA learns what you're looking for through conversation.
                </span>

                {safeMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleNewDiscovery}
                    disabled={loading}
                  >
                    Start a new discovery
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default FortunaPage;

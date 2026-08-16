function FortunaSidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  loading,
  handleNewDiscovery,
  isAuthenticated,
  historyError,
  isHistoryLoading,
  conversations,
  conversationId,
  handleLoadConversation,
  handleDeleteConversation,
  deletingConversationId,
  formatConversationDate,
}) {
  return (
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
              You can still use FORTUNA as a guest. Sign in to save and revisit
              your past discoveries.
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
                        onClick={() => handleLoadConversation(conversation._id)}
                        disabled={loading}
                      >
                        <strong>{conversation.title || "New Discovery"}</strong>

                        <span>
                          {formatConversationDate(
                            conversation.updatedAt || conversation.createdAt,
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="fortuna-history-delete"
                        onClick={(event) =>
                          handleDeleteConversation(event, conversation._id)
                        }
                        disabled={deletingConversationId === conversation._id}
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
  );
}

export default FortunaSidebar;

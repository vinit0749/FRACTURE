function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-main">
        <div className="toast-icon-wrapper">
          <span className="toast-icon">{toast.icon}</span>
        </div>

        <div className="toast-text">
          <div className="toast-title">{toast.title}</div>

          {toast.description && (
            <div className="toast-description">{toast.description}</div>
          )}
        </div>
      </div>

      <button
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        ×
      </button>

      <div
        className="toast-progress"
        style={{
          animationDuration: `${toast.duration}ms`,
        }}
      />
    </div>
  );
}

export default Toast;

// ============================================
// SHARED CHAT UTILITIES
// ============================================

/**
 * Format timestamp for display in chat
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Sort messages by latest activity (considering both message and reply timestamps)
 * @param {Array} messages - Array of message objects
 * @returns {Array} Sorted messages (oldest activity first)
 */
export const sortMessagesByActivity = (messages) => {
  return [...messages].sort((a, b) => {
    const aLatest = a.replyTime ? new Date(a.replyTime) : new Date(a.timestamp);
    const bLatest = b.replyTime ? new Date(b.replyTime) : new Date(b.timestamp);
    return aLatest - bLatest;
  });
};

/**
 * Get unread message count (messages without replies)
 * @param {Array} messages - Array of message objects
 * @returns {number} Count of unread messages
 */
export const getUnreadCount = (messages) => {
  return messages.filter((m) => !m.reply).length;
};

// ============================================
// SHARED CHAT STYLES
// ============================================

export const chatStyles = {
  // Floating button position
  floatingButton: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
  },

  // Chat button styles
  buttonStyle: {
    width: "60px",
    height: "60px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "24px",
    border: "none",
  },

  // Chat tray container
  trayContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    background: "#fff",
    transition: "width 0.3s ease-in-out",
    overflow: "hidden",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  },

  // Overlay backdrop
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 998,
  },

  // Header section
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Message bubble - worker/sender
  messageBubbleWorker: {
    background: "#f0f0f0",
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "8px",
  },

  // Message bubble - admin/reply
  messageBubbleReply: {
    background: "#1890ff",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    marginLeft: "20px",
  },

  // Message text
  messageText: {
    fontSize: "13px",
    marginBottom: "4px",
  },

  // Timestamp
  timestamp: {
    fontSize: "11px",
    color: "#999",
  },
};

// ============================================
// CHAT CONFIGURATION
// ============================================

export const chatConfig = {
  maxWidth: "380px",
  maxWidthMobile: "90vw",
  headerHeight: "64px",
  inputHeight: "auto",
};

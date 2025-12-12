/**
 * Security utilities: session timeout, activity tracking, etc.
 */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_KEY = "breeza_last_activity";
const SESSION_KEY = "breeza_session_start";

let timeoutId = null;

/**
 * Initialize session management - should be called in main.jsx or App.jsx
 */
export const initializeSession = () => {
  recordActivity();
  document.addEventListener("mousedown", recordActivity);
  document.addEventListener("keydown", recordActivity);
  document.addEventListener("scroll", recordActivity);
};

/**
 * Record user activity timestamp
 */
export const recordActivity = () => {
  sessionStorage.setItem(ACTIVITY_KEY, Date.now());
  resetSessionTimeout();
};

/**
 * Reset the session timeout
 */
export const resetSessionTimeout = () => {
  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    const lastActivity = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0);
    if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      handleSessionTimeout();
    }
  }, SESSION_TIMEOUT_MS);
};

/**
 * Handle session timeout - clear sensitive data
 */
export const handleSessionTimeout = () => {
  sessionStorage.removeItem("breeza_pass_authorized");
  sessionStorage.removeItem(ACTIVITY_KEY);
  console.warn("Session expired due to inactivity.");
  // Optionally show a toast/alert
};

/**
 * Check if session is still valid
 */
export const isSessionValid = () => {
  const lastActivity = Number(sessionStorage.getItem(ACTIVITY_KEY) || 0);
  return lastActivity && Date.now() - lastActivity < SESSION_TIMEOUT_MS;
};

/**
 * Clean up session on logout or page unload
 */
export const cleanupSession = () => {
  if (timeoutId) clearTimeout(timeoutId);
  sessionStorage.removeItem("breeza_pass_authorized");
  sessionStorage.removeItem(ACTIVITY_KEY);
};

export default {
  initializeSession,
  recordActivity,
  resetSessionTimeout,
  handleSessionTimeout,
  isSessionValid,
  cleanupSession,
};

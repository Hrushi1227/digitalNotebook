# Worker Portal Feature Setup

## Overview

The app now has a complete worker portal system that separates admin and worker views:

### Admin Portal

- **Login**: Admin passcode (default: `1234`)
- **Features**: Full CRUD operations on Workers, Tasks, Materials, Payments, etc.
- **Messaging**: View all worker messages and reply to them

### Worker Portal

- **Login**: Worker ID or Name (any 3+ characters)
- **Features**:
  - View assigned tasks (read-only)
  - View payment history (read-only)
  - See total earnings
  - Send messages to owner
  - View owner's replies

## How to Test

### 1. Admin Login

```
URL: http://localhost:5173/
Passcode: 1234
```

### 2. Worker Login

```
URL: http://localhost:5173/worker-login
Worker ID: (any name, e.g., "John" or "WRK-001")
```

### 3. Send Messages

- As a worker, compose and send messages from the Worker Portal
- As admin, go to "Messages" page to view and reply

## Files Added/Modified

### New Files

- `src/pages/WorkerPortal.jsx` - Worker dashboard with tasks, payments, messaging
- `src/pages/WorkerLogin.jsx` - Worker login screen
- `src/pages/Messages.jsx` - Admin messages dashboard
- `src/store/messagesSlice.js` - Redux slice for messages (with reply support)

### Modified Files

- `src/App.jsx` - Added routing for both admin/worker portals
- `src/store/authSlice.js` - Added workerId field, selectWorkerId & selectIsWorker selectors
- `src/store/store.js` - Added messages to Firestore sync
- `src/pages/Login.jsx` - Added link to worker login

## Database Structure

### Firestore Collection: `messages`

```javascript
{
  id: "auto-generated",
  workerId: "WRK-001",
  workerName: "John Doe",
  message: "I need more clarity on task...",
  isFromWorker: true,
  reply: "Admin response here", // null if no reply yet
  timestamp: "2024-01-15T10:30:00Z",
  replyTime: "2024-01-15T11:00:00Z"
}
```

## Session Management

- Both admin and worker sessions expire after 30 minutes of inactivity
- Auto-logout redirects to login screen
- Session activity is tracked via `utils/security.js`

## Architecture

```
Admin Flow:
Login (Admin Passcode) → Admin Dashboard (Full CRUD) → Messages Admin Panel

Worker Flow:
Login (Worker ID) → Worker Portal (Read-only) → Send Messages → View Replies
```

## Future Enhancements

- Real-time typing indicators in messages
- Message search/filter
- Worker task status updates (mark as complete)
- Notification badges for unread messages
- Payment request workflow

# Worker Portal Testing Guide

## Quick Start

### Prerequisites

- npm dependencies installed (`npm install`)
- Firebase credentials configured in `src/firebase.js`
- App running on `localhost:5173`

### Test Case 1: Admin Login & Messaging

**Steps:**

1. Open http://localhost:5173
2. Enter passcode: `1234`
3. Click "Login as Admin"
4. ✅ Should see admin dashboard with all menus

**Expected Result:**

- Dashboard displays with full CRUD functionality
- Sidebar shows all menu items including "Messages"
- Logout button visible in header

---

### Test Case 2: Worker Registration & Portal Access

**Steps:**

1. From login page, click "Are you a worker? Login here"
2. Enter Worker ID: `John Doe` (any 3+ chars)
3. Click "Login as Worker"
4. ✅ Should see Worker Portal

**Expected Result:**

- Shows personal dashboard with stats
  - Total Earned: ₹ amount
  - Tasks Assigned: count
  - Tasks Completed: count/total
- Three sections visible:
  - Payment History (table)
  - Your Tasks (table)
  - Messages to Owner (message panel)

---

### Test Case 3: Worker Sends Message

**Steps:**

1. On Worker Portal, scroll to "Messages to Owner"
2. Type message: "I need clarification on task details"
3. Click "Send" or press Enter
4. ✅ Message appears in message history

**Expected Result:**

- Message shows with timestamp
- Text input clears
- Message persists on page reload (Firebase synced)
- Message visible to admin

---

### Test Case 4: Admin Views & Replies to Message

**Prerequisite:** Worker must have sent a message (Test Case 3)

**Steps:**

1. Admin login with passcode `1234`
2. Click "Messages" in sidebar
3. See worker name and message listed
4. Click "Reply" button
5. Type response: "I'll clarify this in our next meeting"
6. Click "Send Reply"
7. ✅ Reply appears below original message

**Expected Result:**

- Message grouped under worker name
- Reply button visible only for unreplied messages
- Reply modal shows original message for context
- Reply appears in green box with timestamp
- Reply button changes to "Replied" tag

---

### Test Case 5: Worker Sees Admin Reply

**Prerequisite:** Admin must have replied to worker message (Test Case 4)

**Steps:**

1. Worker login with same ID from Test Case 2
2. Scroll to Messages section
3. ✅ See original message with admin's reply below

**Expected Result:**

- Message shows with original timestamp
- Reply appears in blue/highlighted box below
- Reply labeled "Owner's Reply"
- Reply timestamp visible
- Message history preserved

---

### Test Case 6: Session Timeout

**Steps:**

1. Admin login with passcode `1234`
2. Wait 30+ minutes without activity
3. Try to navigate or interact
4. ✅ Redirected to login screen

**Expected Result:**

- Session expires after 30 minutes
- Auto-logout occurs silently
- Next interaction triggers login screen
- No data is lost (already synced to Firebase)

---

### Test Case 7: Mobile Responsiveness

**Steps:**

1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Login as worker
4. ✅ Portal is fully readable

**Expected Result:**

- Stats cards stack vertically
- Tables scroll horizontally
- Message panel is readable
- Logout button accessible
- No overflow or horizontal scroll

---

### Test Case 8: Multiple Workers

**Steps:**

1. Admin login and add multiple workers in Workers page
2. Assign tasks to different workers
3. Create payments for each worker
4. Worker 1 login: `Alice`
   - See only Alice's tasks & payments
5. Worker 2 login: `Bob`
   - See only Bob's tasks & payments

**Expected Result:**

- Each worker sees only their own data
- Stats reflect correct personal totals
- Messages are worker-specific
- No cross-contamination of data

---

### Test Case 9: Navigation Between Portals

**Steps:**

1. Admin login
2. Click "Are you a worker? Login here" (if button visible)
   - OR manually go to `/worker-login`
3. Login as worker
4. Click "Back to Admin Login"
5. Admin login again

**Expected Result:**

- Seamless switching between portals
- No data loss
- Each portal shows appropriate UI
- Auth state properly manages roles

---

### Test Case 10: Message Persistence

**Steps:**

1. Worker sends message "Test message 123"
2. Refresh page (F5)
3. ✅ Message still visible

**Expected Result:**

- Messages persist in Firebase
- Real-time listener updates on refresh
- Message history complete
- Timestamps accurate

---

## Verification Checklist

- [ ] Admin can login with passcode
- [ ] Worker can login with name/ID
- [ ] Worker sees only their data
- [ ] Admin sees all worker data
- [ ] Messages send successfully
- [ ] Admin can reply to messages
- [ ] Worker sees admin replies
- [ ] Session timeout works (30 min)
- [ ] Mobile layout is responsive
- [ ] Messages sync with Firebase
- [ ] Multiple workers can coexist
- [ ] Navigation between portals works
- [ ] Logout clears authentication
- [ ] Build completes without errors
- [ ] No console errors in browser

---

## Debugging Tips

### Messages not appearing?

1. Check Firebase console for `messages` collection
2. Verify Firestore sync in `store.js` includes messages
3. Check browser console for errors
4. Clear browser cache and reload

### Worker can see other worker's data?

1. Check filter logic in WorkerPortal.jsx
2. Verify workerId is properly stored in Redux (selectWorkerId)
3. Check if workers have unique IDs in database

### Admin reply not showing to worker?

1. Check updateItem() returns successfully
2. Verify Firebase rule allows updates to messages
3. Check if Firestore listener is active
4. Verify replyTime field is being set

### Session timeout not working?

1. Check initializeSession() is called in App.jsx useEffect
2. Verify recordActivity() is called on user actions
3. Check session timeout set to 30 min in security.js
4. Monitor localStorage for session data

---

## Firebase Firestore Rules

Ensure your Firestore rules allow these operations:

```javascript
// messages collection should allow:
- read: for authenticated users
- write: for both admin and workers
- update: for admin (replies)
```

Optional rule example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

**Last Updated:** December 2025
**Status:** Ready for Testing ✅

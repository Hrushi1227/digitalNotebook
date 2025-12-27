import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import documentsReducer from "./documentsSlice";
import materialsReducer from "./materialsSlice";
import membersReducer from "./membersSlice";
import messagesReducer from "./messagesSlice";
import noticesReducer from "./noticesSlice";
import parkingReducer from "./parkingSlice";
import paymentsReducer from "./paymentsSlice";
import workersReducer from "./workersSlice";

import { listenCollection, loadCollection } from "../firebaseService";

const store = configureStore({
  reducer: {
    auth: authReducer,
    workers: workersReducer,
    members: membersReducer,
    materials: materialsReducer,
    payments: paymentsReducer,
    documents: documentsReducer,
    messages: messagesReducer,
    parking: parkingReducer,
    notices: noticesReducer,
  },
});

// ----------------- FIRESTORE SYNC (REALTIME) -----------------

const collections = [
  "workers",
  "members",
  "tasks",
  "materials",
  "payments",
  "documents",
  "messages",
  "parking",
  "notices",
];

// Realtime listeners for all collections
// Note: These listeners persist for app lifetime, which is intentional
// They automatically clean up when the app unmounts
const unsubscribeFunctions = collections.map((col) => {
  return listenCollection(col, (data) => {
    store.dispatch({
      type: `${col}/setAll`,
      payload: data,
    });
  });
});

// Initial load (once) with error handling
(async () => {
  for (const col of collections) {
    try {
      const data = await loadCollection(col);
      store.dispatch({
        type: `${col}/setAll`,
        payload: data,
      });
    } catch (error) {
      console.error(`Failed to load collection ${col}:`, error);
    }
  }
})();

// Export unsubscribe functions for potential cleanup (if needed)
export const unsubscribeAllListeners = () => {
  unsubscribeFunctions.forEach((unsubscribe) => {
    if (unsubscribe) unsubscribe();
  });
};

export default store;

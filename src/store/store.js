import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import budgetsReducer from "./budgetsSlice";
import documentsReducer from "./documentsSlice";
import invoicesReducer from "./invoicesSlice";
import ledgerReducer from "./ledgerSlice";
import materialsReducer from "./materialsSlice";
import messagesReducer from "./messagesSlice";
import paymentsReducer from "./paymentsSlice";
import schedulesReducer from "./schedulesSlice";
import tasksReducer from "./tasksSlice";
import workersReducer from "./workersSlice";

import { listenCollection, loadCollection } from "../firebaseService";

const store = configureStore({
  reducer: {
    auth: authReducer,
    workers: workersReducer,
    tasks: tasksReducer,
    materials: materialsReducer,
    payments: paymentsReducer,
    budgets: budgetsReducer,
    documents: documentsReducer,
    invoices: invoicesReducer,
    schedules: schedulesReducer,
    ledger: ledgerReducer,
    messages: messagesReducer,
  },
});

// ----------------- FIRESTORE SYNC (REALTIME) -----------------

const collections = [
  "workers",
  "tasks",
  "materials",
  "payments",
  "budgets",
  "documents",
  "invoices",
  "schedules",
  "ledger",
  "messages",
];

// Realtime listeners for all collections
collections.forEach((col) => {
  listenCollection(col, (data) => {
    store.dispatch({
      type: `${col}/setAll`,
      payload: data,
    });
  });
});

// Initial load (once)
(async () => {
  for (const col of collections) {
    const data = await loadCollection(col);
    store.dispatch({
      type: `${col}/setAll`,
      payload: data,
    });
  }
})();

export default store;

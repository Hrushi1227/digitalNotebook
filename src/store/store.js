import { configureStore } from "@reduxjs/toolkit";

import budgetsReducer from "./budgetsSlice";
import invoicesReducer from "./invoicesSlice";
import ledgerReducer from "./ledgerSlice";
import materialsReducer from "./materialsSlice";
import paymentsReducer from "./paymentsSlice";
import schedulesReducer from "./schedulesSlice";
import tasksReducer from "./tasksSlice";
import workersReducer from "./workersSlice";

import { listenCollection, loadCollection } from "../firebaseService";

const store = configureStore({
  reducer: {
    workers: workersReducer,
    tasks: tasksReducer,
    materials: materialsReducer,
    payments: paymentsReducer,
    budgets: budgetsReducer,
    invoices: invoicesReducer,
    schedules: schedulesReducer,
    ledger: ledgerReducer,
  },
});

// ----------------- FIRESTORE SYNC (REALTIME) -----------------

const collections = [
  "workers",
  "tasks",
  "materials",
  "payments",
  "budgets",
  "invoices",
  "schedules",
  "ledger",
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

import { configureStore } from "@reduxjs/toolkit";
import budgetsReducer from "./budgetsSlice";
import invoicesReducer from "./invoicesSlice";
import ledgerReducer from "./ledgerSlice";
import materialsReducer from "./materialsSlice";
import paymentsReducer from "./paymentsSlice";
import schedulesReducer from "./schedulesSlice";
import tasksReducer from "./tasksSlice";
import workersReducer from "./workersSlice";

const PERSIST_KEY = "reno_state_v1";

const loadState = () => {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {}
};

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    workers: workersReducer,
    tasks: tasksReducer,
    materials: materialsReducer,
    payments: paymentsReducer,

    // NEW SLICES
    budgets: budgetsReducer,
    invoices: invoicesReducer,
    schedules: schedulesReducer,
    ledger: ledgerReducer,
  },
  preloadedState,
});

// Persist EVERYTHING safely
store.subscribe(() => {
  const s = store.getState();
  saveState({
    workers: s.workers,
    tasks: s.tasks,
    materials: s.materials,
    payments: s.payments,
    budgets: s.budgets,
    invoices: s.invoices,
    schedules: s.schedules,
    ledger: s.ledger,
  });
});

export default store;

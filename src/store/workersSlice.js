import { createSelector, createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  list: [
    {
      id: "w1",
      name: "Raj (Electrician)",
      type: "Electrician",
      phone: "9876543210",
      totalAmount: 80000,
      paidAmount: 30000,
      notes: "",
    },
    {
      id: "w2",
      name: "Aman (POP)",
      type: "POP",
      phone: "9898989898",
      totalAmount: 60000,
      paidAmount: 15000,
      notes: "",
    },
  ],
};

const workersSlice = createSlice({
  name: "workers",
  initialState,
  reducers: {
    addWorker: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateWorker(state, { payload }) {
      const i = state.list.findIndex((w) => w.id === payload.id);
      if (i >= 0) state.list[i] = { ...state.list[i], ...payload };
    },
    deleteWorker(state, { payload }) {
      state.list = state.list.filter((w) => w.id !== payload);
    },
    applyPaymentToWorker(state, { payload }) {
      const { workerId, amount } = payload;
      const w = state.list.find((x) => x.id === workerId);
      if (w) w.paidAmount = (w.paidAmount || 0) + Number(amount);
    },
  },
});

export const { addWorker, updateWorker, deleteWorker, applyPaymentToWorker } =
  workersSlice.actions;
export default workersSlice.reducer;

export const selectWorkers = (s) => s.workers.list;
export const selectWorkerById = (id) => (s) =>
  s.workers.list.find((w) => w.id === id);
export const selectWorkerTotals = createSelector([selectWorkers], (list) => {
  const totals = list.reduce(
    (acc, w) => {
      acc.budget += Number(w.totalAmount || 0);
      acc.paid += Number(w.paidAmount || 0);
      return acc;
    },
    { budget: 0, paid: 0 }
  );
  return { ...totals, pending: totals.budget - totals.paid };
});

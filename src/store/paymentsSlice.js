import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  list: [
    {
      id: "p1",
      workerId: "w1",
      amount: 20000,
      date: "2025-12-04",
      method: "UPI",
      phase: "Advance",
    },
  ],
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    addPayment: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    deletePayment(state, { payload }) {
      state.list = state.list.filter((p) => p.id !== payload);
    },
  },
});

export const { addPayment, deletePayment } = paymentsSlice.actions;
export default paymentsSlice.reducer;
export const selectPayments = (s) => s.payments.list;

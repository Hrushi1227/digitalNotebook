import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const paymentsSlice = createSlice({
  name: "payments",
  initialState: [],
  reducers: {
    setAll(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      const map = new Map();
      for (const it of arr) {
        if (it && it.id) map.set(it.id, it);
      }
      return Array.from(map.values());
    },
    addPayment: {
      reducer(state, action) {
        const i = state.findIndex((p) => p.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    deletePayment(state, action) {
      return state.filter((p) => p.id !== action.payload);
    },
    updatePayment(state, action) {
      const index = state.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state[index] = { ...state[index], ...action.payload };
      }
    },
  },
});

export const { setAll, addPayment, deletePayment, updatePayment } =
  paymentsSlice.actions;
export const selectPayments = (s) => s.payments;
export default paymentsSlice.reducer;

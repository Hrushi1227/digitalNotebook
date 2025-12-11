import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const invoicesSlice = createSlice({
  name: "invoices",
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
    addInvoice: {
      reducer(state, action) {
        const i = state.findIndex((t) => t.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    deleteInvoice(state, action) {
      return state.filter((i) => i.id !== action.payload);
    },
  },
});

export const { setAll, addInvoice, deleteInvoice } = invoicesSlice.actions;
export const selectInvoices = (s) => s.invoices;
export default invoicesSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const ledgerSlice = createSlice({
  name: "ledger",
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
    addEntry: {
      reducer(state, action) {
        const i = state.findIndex((t) => t.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return {
          payload: { id: nanoid(), ...data },
        };
      },
    },
  },
});

export const { setAll, addEntry } = ledgerSlice.actions;
export const selectLedger = (s) => s.ledger;
export default ledgerSlice.reducer;

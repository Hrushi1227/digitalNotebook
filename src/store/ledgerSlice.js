import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = { list: [] };

const ledgerSlice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    addEntry: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
  },
});

export const { addEntry } = ledgerSlice.actions;
export default ledgerSlice.reducer;

export const selectLedger = (s) => s.ledger.list;

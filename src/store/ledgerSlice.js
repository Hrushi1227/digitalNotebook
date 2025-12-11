import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const ledgerSlice = createSlice({
  name: "ledger",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addEntry: {
      reducer(state, action) {
        state.push(action.payload);
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

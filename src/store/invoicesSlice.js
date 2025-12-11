import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const invoicesSlice = createSlice({
  name: "invoices",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addInvoice: {
      reducer(state, action) {
        state.push(action.payload);
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

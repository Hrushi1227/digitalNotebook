import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = { list: [] };

const invoicesSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    addInvoice: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return {
          payload: { id: nanoid(), ...data },
        };
      },
    },
    deleteInvoice(state, { payload }) {
      state.list = state.list.filter((i) => i.id !== payload);
    },
  },
});

export const { addInvoice, deleteInvoice } = invoicesSlice.actions;
export default invoicesSlice.reducer;

export const selectInvoices = (s) => s.invoices.list;

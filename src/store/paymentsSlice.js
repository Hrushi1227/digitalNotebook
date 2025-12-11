import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const paymentsSlice = createSlice({
  name: "payments",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addPayment: {
      reducer(state, action) {
        state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    deletePayment(state, action) {
      return state.filter((p) => p.id !== action.payload);
    },
  },
});

export const { setAll, addPayment, deletePayment } = paymentsSlice.actions;
export const selectPayments = (s) => s.payments;
export default paymentsSlice.reducer;

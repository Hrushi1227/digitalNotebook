import { createSlice } from "@reduxjs/toolkit";

const budgetsSlice = createSlice({
  name: "budgets",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    updateBudget(state, action) {
      const i = state.findIndex((b) => b.key === action.payload.key);
      if (i >= 0) state[i].allocated = action.payload.allocated;
    },
  },
});

export const { setAll, updateBudget } = budgetsSlice.actions;
export const selectBudgets = (s) => s.budgets;
export default budgetsSlice.reducer;

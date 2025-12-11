import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [
    { key: "Electrical", allocated: 80000 },
    { key: "POP", allocated: 60000 },
    { key: "Furniture", allocated: 120000 },
    { key: "Paint", allocated: 40000 },
    { key: "Other", allocated: 20000 },
  ],
};

const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    setAllocation(state, { payload }) {
      const i = state.categories.findIndex((c) => c.key === payload.key);
      if (i >= 0) state.categories[i].allocated = payload.allocated;
    },
  },
});

export const { setAllocation } = budgetsSlice.actions;
export default budgetsSlice.reducer;

export const selectBudgets = (s) => s.budgets.categories;

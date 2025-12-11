import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  list: [], // { id, workerId, phase, dueDate, amount, status }
};

const schedulesSlice = createSlice({
  name: "schedules",
  initialState,
  reducers: {
    addSchedule: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return {
          payload: { id: nanoid(), status: "pending", ...data },
        };
      },
    },
    updateSchedule(state, { payload }) {
      const i = state.list.findIndex((s) => s.id === payload.id);
      if (i >= 0) state.list[i] = { ...state.list[i], ...payload };
    },
  },
});

export const { addSchedule, updateSchedule } = schedulesSlice.actions;
export default schedulesSlice.reducer;

export const selectSchedules = (s) => s.schedules.list;

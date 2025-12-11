import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const schedulesSlice = createSlice({
  name: "schedules",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addSchedule: {
      reducer(state, action) {
        state.push(action.payload);
      },
      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            status: "pending",
            ...data,
          },
        };
      },
    },
    updateSchedule(state, action) {
      const i = state.findIndex((s) => s.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
    },
  },
});

export const { setAll, addSchedule, updateSchedule } = schedulesSlice.actions;
export const selectSchedules = (s) => s.schedules;
export default schedulesSlice.reducer;

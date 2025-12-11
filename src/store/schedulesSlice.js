import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const schedulesSlice = createSlice({
  name: "schedules",
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
    addSchedule: {
      reducer(state, action) {
        const i = state.findIndex((s) => s.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
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
      else state.push(action.payload);
    },
  },
});

export const { setAll, addSchedule, updateSchedule } = schedulesSlice.actions;
export const selectSchedules = (s) => s.schedules;
export default schedulesSlice.reducer;

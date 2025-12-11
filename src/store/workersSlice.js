import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const workersSlice = createSlice({
  name: "workers",
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
    addWorker: {
      reducer(state, action) {
        const i = state.findIndex((w) => w.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateWorker(state, action) {
      const i = state.findIndex((w) => w.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
      else state.push(action.payload);
    },
    deleteWorker(state, action) {
      return state.filter((w) => w.id !== action.payload);
    },
  },
});

export const { setAll, addWorker, updateWorker, deleteWorker } =
  workersSlice.actions;
export const selectWorkers = (s) => s.workers;
export default workersSlice.reducer;

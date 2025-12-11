import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  list: [
    {
      id: "t1",
      name: "False Ceiling POP",
      status: "in-progress",
      workerId: "w2",
      cost: 25000,
      startDate: "2025-12-01",
      endDate: "",
    },
    {
      id: "t2",
      name: "Rewiring Living Room",
      status: "pending",
      workerId: "w1",
      cost: 15000,
      startDate: "",
      endDate: "",
    },
  ],
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTask: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateTask(state, { payload }) {
      const i = state.list.findIndex((t) => t.id === payload.id);
      if (i >= 0) state.list[i] = { ...state.list[i], ...payload };
    },
    deleteTask(state, { payload }) {
      state.list = state.list.filter((t) => t.id !== payload);
    },
  },
});

export const { addTask, updateTask, deleteTask } = tasksSlice.actions;
export default tasksSlice.reducer;
export const selectTasks = (s) => s.tasks.list;

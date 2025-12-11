import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const tasksSlice = createSlice({
  name: "tasks",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addTask: {
      reducer(state, action) {
        state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateTask(state, action) {
      const i = state.findIndex((t) => t.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
    },
    deleteTask(state, action) {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setAll, addTask, updateTask, deleteTask } = tasksSlice.actions;
export const selectTasks = (s) => s.tasks;
export default tasksSlice.reducer;

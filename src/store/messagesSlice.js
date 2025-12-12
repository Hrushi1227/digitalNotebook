import { createSlice } from "@reduxjs/toolkit";

const messagesSlice = createSlice({
  name: "messages",
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
    addMessage: {
      reducer(state, action) {
        const i = state.findIndex((m) => m.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return {
          payload: {
            id: Math.random().toString(36).substr(2, 9),
            ...data,
            timestamp: new Date().toISOString(),
          },
        };
      },
    },
    deleteMessage(state, action) {
      return state.filter((m) => m.id !== action.payload);
    },
  },
});

export const { setAll, addMessage, deleteMessage } = messagesSlice.actions;
export const selectMessages = (s) => s.messages || [];
export const selectWorkerMessages = (s, workerId) =>
  (s.messages || []).filter((m) => m.workerId === workerId);
export default messagesSlice.reducer;

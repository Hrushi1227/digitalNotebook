import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setAll: (state, action) => {
      return action.payload || [];
    },
    addDocument: (state, action) => {
      state.push(action.payload);
    },
    updateDocument: (state, action) => {
      const { id, changes } = action.payload;
      const idx = state.findIndex((d) => d.id === id);
      if (idx !== -1) {
        state[idx] = { ...state[idx], ...changes }; // IMPORTANT FIX
      }
    },
    deleteDocument: (state, action) => {
      return state.filter((d) => d.id !== action.payload);
    },
  },
});

export const { setAll, addDocument, updateDocument, deleteDocument } =
  documentsSlice.actions;

export const selectDocuments = (state) => state.documents;

export default documentsSlice.reducer;

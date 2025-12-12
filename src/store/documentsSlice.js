import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const documentsSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    setAll: (state, action) => {
      // Replace all documents (from Firestore) - matches store.js dispatch pattern
      return action.payload || [];
    },
    addDocument: (state, action) => {
      state.push(action.payload);
    },
    updateDocument: (state, action) => {
      const idx = state.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) {
        state[idx] = action.payload;
      }
    },
    deleteDocument: (state, action) => {
      return state.filter((d) => d.id !== action.payload);
    },
  },
});

export const {
  setAll,
  addDocument,
  updateDocument,
  deleteDocument,
} = documentsSlice.actions;

export const selectDocuments = (state) => state.documents;

export default documentsSlice.reducer;

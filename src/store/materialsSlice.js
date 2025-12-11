import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const materialsSlice = createSlice({
  name: "materials",
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
    addMaterial: {
      reducer(state, action) {
        const i = state.findIndex((m) => m.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateMaterial(state, action) {
      const i = state.findIndex((m) => m.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
      else state.push(action.payload);
    },
    deleteMaterial(state, action) {
      return state.filter((m) => m.id !== action.payload);
    },
  },
});

export const { setAll, addMaterial, updateMaterial, deleteMaterial } =
  materialsSlice.actions;
export const selectMaterials = (s) => s.materials;
export default materialsSlice.reducer;

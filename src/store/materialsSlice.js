import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const materialsSlice = createSlice({
  name: "materials",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return action.payload;
    },
    addMaterial: {
      reducer(state, action) {
        state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateMaterial(state, action) {
      const i = state.findIndex((m) => m.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
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

import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  list: [
    {
      id: "m1",
      name: "Cement (50kg)",
      qty: 10,
      price: 4500,
      vendor: "Sharma Traders",
      category: "Cement",
      date: "2025-12-02",
      invoiceFile: "",
    },
    {
      id: "m2",
      name: "LED Panel Light",
      qty: 6,
      price: 7200,
      vendor: "Light World",
      category: "Electrical",
      date: "2025-12-03",
      invoiceFile: "",
    },
  ],
};

const materialsSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    addMaterial: {
      reducer(state, { payload }) {
        state.list.push(payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateMaterial(state, { payload }) {
      const i = state.list.findIndex((m) => m.id === payload.id);
      if (i >= 0) state.list[i] = { ...state.list[i], ...payload };
    },
    deleteMaterial(state, { payload }) {
      state.list = state.list.filter((m) => m.id !== payload);
    },
  },
});

export const { addMaterial, updateMaterial, deleteMaterial } =
  materialsSlice.actions;
export default materialsSlice.reducer;
export const selectMaterials = (s) => s.materials.list;

import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const membersSlice = createSlice({
  name: "members",
  initialState: [],
  reducers: {
    setAll(state, action) {
      return Array.isArray(action.payload) ? action.payload : [];
    },
    addMember: {
      reducer(state, action) {
        const i = state.findIndex((m) => m.id === action.payload.id);
        if (i >= 0) state[i] = { ...state[i], ...action.payload };
        else state.push(action.payload);
      },
      prepare(data) {
        return { payload: { id: nanoid(), ...data } };
      },
    },
    updateMember(state, action) {
      const i = state.findIndex((m) => m.id === action.payload.id);
      if (i >= 0) state[i] = { ...state[i], ...action.payload };
    },
    deleteMember(state, action) {
      return state.filter((m) => m.id !== action.payload);
    },
  },
});

export const { setAll, addMember, updateMember, deleteMember } =
  membersSlice.actions;
export const selectMembers = (s) => s.members;
export default membersSlice.reducer;

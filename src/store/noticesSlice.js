import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { addItem, listenCollection } from "../firebaseService";

export const addNotice = createAsyncThunk("notices/addNotice", async (data) => {
  const docRef = await addItem("notices", data);
  return { ...data, id: docRef.id };
});

const noticesSlice = createSlice({
  name: "notices",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setNotices(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addNotice.pending, (state) => {
        state.loading = true;
      })
      .addCase(addNotice.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setNotices } = noticesSlice.actions;
export default noticesSlice.reducer;

export const listenNotices = () => (dispatch) => {
  return listenCollection("notices", (data) => {
    dispatch(setNotices(data));
  });
};

export const selectNotices = (state) => state.notices.items;

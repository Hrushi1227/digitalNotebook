import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addItem,
  deleteItem,
  listenCollection,
  updateItem,
} from "../firebaseService";

// Thunks for Firestore CRUD
export const addParking = createAsyncThunk(
  "parking/addParking",
  async (data) => {
    const docRef = await addItem("parking", data);
    return { ...data, id: docRef.id };
  }
);

export const updateParking = createAsyncThunk(
  "parking/updateParking",
  async ({ id, data }) => {
    await updateItem("parking", id, data);
    return { id, data };
  }
);

export const deleteParking = createAsyncThunk(
  "parking/deleteParking",
  async (id) => {
    await deleteItem("parking", id);
    return id;
  }
);

const parkingSlice = createSlice({
  name: "parking",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setParking(state, action) {
      state.items = action.payload;
    },
    setAll(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addParking.pending, (state) => {
        state.loading = true;
      })
      .addCase(addParking.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addParking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateParking.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload.data };
        }
      })
      .addCase(deleteParking.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      });
  },
});

export const { setParking } = parkingSlice.actions;
export default parkingSlice.reducer;

// Real-time Firestore listener
export const listenParking = () => (dispatch) => {
  return listenCollection("parking", (data) => {
    console.log("[Firestore] Parking listener fired:", data);
    dispatch(setParking(data));
  });
};

// Selector
export const selectParking = (state) => state.parking.items;

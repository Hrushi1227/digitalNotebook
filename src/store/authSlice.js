import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    userRole: null, // "superadmin", "admin", "worker"
    loginTime: null,
    workerId: null, // Store worker ID for worker portal
  },
  reducers: {
    login(state, action) {
      state.isAuthenticated = true;
      state.userRole = action.payload.role || "admin";
      state.workerId = action.payload.workerId || null;
      state.loginTime = Date.now();
    },
    logout(state) {
      state.isAuthenticated = false;
      state.userRole = null;
      state.workerId = null;
      state.loginTime = null;
    },
    checkSession(state) {
      // Session expires after 30 mins
      if (state.isAuthenticated && state.loginTime) {
        const elapsed = Date.now() - state.loginTime;
        if (elapsed > 30 * 60 * 1000) {
          state.isAuthenticated = false;
          state.userRole = null;
          state.workerId = null;
          state.loginTime = null;
        }
      }
    },
  },
});

export const { login, logout, checkSession } = authSlice.actions;
export const selectIsAuthenticated = (state) =>
  state.auth?.isAuthenticated || false;
export const selectUserRole = (state) => state.auth?.userRole;
export const selectIsAdmin = (state) =>
  ["admin", "superadmin"].includes(state.auth?.userRole);
export const selectIsSuperAdmin = (state) =>
  state.auth?.userRole === "superadmin";
export const selectWorkerId = (state) => state.auth?.workerId;
export const selectIsWorker = (state) => state.auth?.userRole === "worker";
export default authSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isMenuOpen: false, // قائمة الـ more اللي في السايدبار
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMenu: (state) => {
      state.isMenuOpen = !state.isMenuOpen;
    },
    closeMenu: (state) => {
      state.isMenuOpen = false;
    },
    openMenu: (state) => {
      state.isMenuOpen = true;
    }
  }
});

export const { toggleMenu, closeMenu, openMenu } = uiSlice.actions;
export default uiSlice.reducer;
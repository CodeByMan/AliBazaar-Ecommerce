import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type NotificationState = {
  id: number;
  message: string;
  visible: boolean;
};

const initialState: NotificationState = {
  id: 0,
  message: "",
  visible: false,
};

export const notification = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification: (state, action: PayloadAction<string>) => {
      state.id += 1;
      state.message = action.payload;
      state.visible = true;
    },
    hideNotification: (state) => {
      state.visible = false;
    },
  },
});

export const { showNotification, hideNotification } = notification.actions;
export default notification.reducer;

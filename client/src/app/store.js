import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import businessReducer from "../features/business/businessSlice";
import slotReducer from "../features/slot/slotSlice";
import appointmentReducer from "../features/appointment/appointmentSlice";
import staffReducer from "../features/staff/staffSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    slot: slotReducer,
    appointment: appointmentReducer,
    staff: staffReducer,
  },
});
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import businessReducer from "../features/business/businessSlice";
import slotReducer from "../features/slot/slotSlice";
import appointmentReducer from "../features/appointment/appointmentSlice";
import staffReducer from "../features/staff/staffSlice";
import doctorReducer from "../features/doctor/doctorSlice";
import subscriptionReducer from "../features/subscription/subscriptionSlice";
import adminReducer from "../features/admin/adminSlice";
import affiliateReducer from "../features/affiliate/affiliateSlice";
import withdrawalReducer from "../features/withdrawal/withdrawalSlice";



export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    slot: slotReducer,
    appointment: appointmentReducer,
    staff: staffReducer,
    doctor: doctorReducer,
    subscription: subscriptionReducer,
    admin: adminReducer,
    affiliate: affiliateReducer,
    withdrawal: withdrawalReducer,
  },
});
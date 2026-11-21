import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import { initRazorpayPlans } from "./src/utils/razorpay.js";


dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initRazorpayPlans();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
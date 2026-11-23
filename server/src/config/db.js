import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config()
const connectDB = async () => {
  try {
   const uri = process.env.MONGO_URI;
    console.log("ENV URI:", uri);

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
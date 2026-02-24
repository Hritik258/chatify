import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("db connected successfully");
  } catch (error) {
    console.error("db connection error:", error.message);
    process.exit(1);
  }
};

export default connectDb;

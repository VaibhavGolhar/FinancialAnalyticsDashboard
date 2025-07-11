import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = 'mongodb+srv://vaibhav22210180:Y5lVgL1d9jFhTV07@cluster1.mtytsry.mongodb.net/FinancialAnalyticsDashboard?retryWrites=true&w=majority&appName=Cluster1';

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
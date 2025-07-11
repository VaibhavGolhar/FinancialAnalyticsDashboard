import mongoose, { Document, Schema } from 'mongoose';

// Define interface for Transaction
export interface ITransaction extends Document {
  id: string;
  date: string;
  amount: number;
  category: string;
  status: string;
  user_id: string;
  user_profile: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Transaction schema
const TransactionSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: [true, 'ID is required'],
      unique: true
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
    },
    user_id: {
      type: String,
      required: [true, 'User ID is required'],
      index: true
    },
    user_profile: {
      type: String,
      required: [true, 'User profile URL is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Transaction model
export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

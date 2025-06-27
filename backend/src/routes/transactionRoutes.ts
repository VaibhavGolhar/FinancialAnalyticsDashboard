import express from 'express';
import { getTransactions, getTransactionReport } from '../controllers/transactionController';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

// Get transactions for the current user (protected route)
router.get('/get-transactions', authenticate, getTransactions);

// Generate PDF report with selected columns (protected route)
router.post('/get-report', authenticate, getTransactionReport);

export default router;

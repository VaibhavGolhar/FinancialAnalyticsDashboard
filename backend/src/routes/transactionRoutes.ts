import express from 'express';
import { getTransactions, getTransactionReport } from '../controllers/transactionController';
import authenticate from '../middleware/authMiddleware';
import { logInfo } from '../utils/logger';

const router = express.Router();

// Log every API call (method and URL)
router.use((req, res, next) => {
  logInfo('API called', { method: req.method, url: req.originalUrl });
  next();
});

// Get transactions for the current user (protected route)
router.get('/get-transactions', authenticate, getTransactions);

// Generate PDF report with selected columns (protected route)
router.post('/get-report', authenticate, getTransactionReport);

export default router;

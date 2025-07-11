import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';
import { logInfo, logError } from '../utils/logger';

// Get transactions for the current user
export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  logInfo('Function called: getTransactions', { userId: req.user?.userId });
  try {
    // Get user ID from the authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Fetch transactions for the user
    let query = {};
    if (userId === 'admin') {
      query = { user_profile: 'https://thispersondoesnotexist.com/' };
    } else {
      query = { user_profile: userId };
    }
    const transactions = await Transaction.find(query)
      .sort({ date: -1 }) // Sort by date descending (newest first)
      .exec();

    logInfo('getTransactions output', { count: transactions.length, userId });
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    logError('Error fetching transactions', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions' 
    });
  }
};

// Generate CSV report with selected columns
export const getTransactionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  logInfo('Function called: getTransactionReport', { userId: req.user?.userId });
  try {
    // Get user ID from the authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get selected columns from request body
    const { columns } = req.body;

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      res.status(400).json({ 
        success: false,
        message: 'Please provide at least one column to include in the report' 
      });
      return;
    }

    // Validate columns against the transaction schema
    const validColumns = ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_profile', 'createdAt', 'updatedAt'];
    const invalidColumns = columns.filter(col => !validColumns.includes(col));

    if (invalidColumns.length > 0) {
      res.status(400).json({ 
        success: false,
        message: `Invalid column(s): ${invalidColumns.join(', ')}` 
      });
      return;
    }

    // Fetch transactions for the user
    let query: any = {};
    // Apply category filter
    if (req.body.filterCategory && req.body.filterCategory !== 'all') {
      query.category = { $regex: new RegExp(`^${req.body.filterCategory}$`, 'i') };
    }
    // Apply status filter
    if (req.body.filterStatus && req.body.filterStatus !== 'all') {
      query.status = { $regex: new RegExp(`^${req.body.filterStatus}$`, 'i') };
    }

    // Determine sort option
    let sort: any = { date: -1 };
    if (req.body.sort) {
      switch (req.body.sort) {
        case 'date-asc': sort = { date: 1 }; break;
        case 'date-desc': sort = { date: -1 }; break;
        case 'amount-asc': sort = { amount: 1 }; break;
        case 'amount-desc': sort = { amount: -1 }; break;
        case 'user-asc': sort = { user_id: 1 }; break;
        case 'user-desc': sort = { user_id: -1 }; break;
        default: break;
      }
    }

    const transactions = await Transaction.find(query)
      .sort(sort)
      .exec();

    if (transactions.length === 0) {
      res.status(404).json({ 
        success: false,
        message: 'No transactions found for this user' 
      });
      return;
    }

    // Create a CSV
    const csvRows = [];
    // Add header row, with special label for amount
    const headerRow = columns.map(col => col === 'amount' ? 'Amount (in $)' : col);
    csvRows.push(headerRow.join(','));
    // Add data rows
    for (const tx of transactions) {
      const row = columns.map(col => {
        let val = tx[col as keyof typeof tx];
        // Format date values
        if (col === 'createdAt' || col === 'updatedAt') {
          val = new Date(val as string).toLocaleDateString();
        }
        // Format amount values: just the number
        if (col === 'amount') {
          val = typeof val === 'number' ? val : Number(val);
        }
        if (val === undefined || val === null) return '';
        return String(val).replace(/,/g, ''); // Remove commas to avoid CSV issues
      });
      csvRows.push(row.join(','));
    }
    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.csv"');
    res.send(csvContent);

    logInfo('getTransactionReport output', { columns, transactionCount: transactions.length });

    return;
  } catch (error) {
    logError('Error generating transaction report', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating transaction report' 
    });
  }
};

export default {
  getTransactions,
  getTransactionReport
};

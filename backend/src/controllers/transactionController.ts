import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';
import PDFDocument from 'pdfkit';
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
    const transactions = await Transaction.find({})
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

// Generate PDF report with selected columns
export const getTransactionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  logInfo('Function called: getTransactionReport', { userId: req.user?.id });
  try {
    // Get user ID from the authenticated request
    const userId = req.user?.id;

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
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ date: -1 }) // Sort by date descending (newest first)
      .exec();

    if (transactions.length === 0) {
      res.status(404).json({ 
        success: false,
        message: 'No transactions found for this user' 
      });
      return;
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transaction-report.pdf');

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add title to the PDF
    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();

    // Define table layout
    const tableTop = 150;
    const columnSpacing = 20;
    let columnPositions: number[] = [];
    let columnWidths: number[] = [];

    // Calculate column positions and widths based on selected columns
    const pageWidth = doc.page.width - 100; // Margins on both sides
    const columnWidth = pageWidth / columns.length;

    columns.forEach((col, i) => {
      columnPositions[i] = 50 + (i * columnWidth);
      columnWidths[i] = columnWidth - columnSpacing;
    });

    // Draw table headers
    doc.fontSize(12);
    doc.font('Helvetica-Bold');

    columns.forEach((col, i) => {
      doc.text(col.charAt(0).toUpperCase() + col.slice(1), columnPositions[i], tableTop);
    });

    // Draw horizontal line below headers
    doc.moveTo(50, tableTop + 20)
       .lineTo(doc.page.width - 50, tableTop + 20)
       .stroke();

    // Draw table rows
    doc.font('Helvetica');
    let rowTop = tableTop + 30;

    transactions.forEach((transaction, rowIndex) => {
      // Check if we need a new page
      if (rowTop > doc.page.height - 50) {
        doc.addPage();
        rowTop = 50;

        // Redraw headers on new page
        doc.font('Helvetica-Bold');
        columns.forEach((col, i) => {
          doc.text(col.charAt(0).toUpperCase() + col.slice(1), columnPositions[i], rowTop);
        });

        doc.moveTo(50, rowTop + 20)
           .lineTo(doc.page.width - 50, rowTop + 20)
           .stroke();

        doc.font('Helvetica');
        rowTop += 30;
      }

      // Draw row data
      columns.forEach((col, i) => {
        let value = transaction[col as keyof typeof transaction];

        // Format date values
        if (col === 'createdAt' || col === 'updatedAt') {
          value = new Date(value as string).toLocaleDateString();
        }

        // Format amount values
        if (col === 'amount') {
          value = `$${(value as number).toFixed(2)}`;
        }

        doc.text(String(value), columnPositions[i], rowTop);
      });

      rowTop += 20;
    });

    // Finalize the PDF
    doc.end();

    logInfo('getTransactionReport output', { columns, transactionCount: transactions.length, userId });
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

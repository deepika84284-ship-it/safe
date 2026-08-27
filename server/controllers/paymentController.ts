import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth';
import { analyzeVpaSecurity } from '../services/paymentProvider';

export async function createDemoPayment(req: AuthRequest, res: Response) {
  try {
    const { domain, websiteId, productName, amount, currency, paymentMethod, upiId, merchantVpa, utrNumber } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain name is required to initiate protected checkout.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const userId = req.user?.id || 'usr_demo_shopper';
    const userName = req.user?.name || 'Demo Shopper';
    const userEmail = req.user?.email || 'demo.shopper@safecart.security';

    const result = await db.paymentProvider.createPayment({
      userId,
      userName,
      userEmail,
      websiteId: websiteId || 'web_' + domain.replace(/\./g, '_'),
      domain,
      productName: productName || 'Protected E-Commerce Item',
      amount: Number(amount) || 49.99,
      currency: currency || (paymentMethod === 'GPAY_UPI' ? 'INR' : 'USD'),
      paymentMethod: paymentMethod || 'GPAY_UPI',
      upiId: upiId || `${userName.toLowerCase().replace(/\s+/g, '')}@okaxis`,
      merchantVpa: merchantVpa || `store.${domain.replace(/[^a-zA-Z0-9]/g, '')}@escrow.safecart`,
      utrNumber
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      transaction: result.transaction,
      demoNotice: result.demoNotice
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate mock protected checkout.',
      error: error.message
    });
  }
}

export async function verifyVpa(req: AuthRequest, res: Response) {
  try {
    const vpa = req.body?.vpa || req.query?.vpa;
    if (!vpa || typeof vpa !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A UPI VPA ID (e.g. merchant@okaxis) is required.',
        errorCode: 'INVALID_VPA'
      });
    }

    const analysis = analyzeVpaSecurity(vpa);

    return res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze UPI VPA.',
      error: error.message
    });
  }
}

export async function requestRefund(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.paymentProvider.requestRefund(id, reason || 'Dispute regarding delivery or seller responsiveness.');

    return res.json({
      success: true,
      message: result.message,
      transaction: result.transaction,
      refundReference: result.refundReference,
      demoNotice: 'This is a demo sandbox refund request. No actual funds were moved.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to request refund.',
      errorCode: 'REFUND_FAILED'
    });
  }
}

export async function processAdminRefund(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const result = await db.paymentProvider.processRefund(id, approved !== false);

    return res.json({
      success: true,
      message: result.message,
      transaction: result.transaction,
      refundReference: result.refundReference,
      demoNotice: 'Demo refund processed in sandbox environment.'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to process refund in sandbox.',
      errorCode: 'REFUND_PROCESS_FAILED'
    });
  }
}

export async function getMyPayments(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const all = db.paymentProvider.getAllTransactions();
    const userTransactions = userId ? all.filter((t) => t.userId === userId || t.userEmail === req.user?.email) : all.slice(0, 5);

    return res.json({
      success: true,
      transactions: userTransactions,
      demoNotice: 'These are mock transactions for safe demonstration purposes.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions.',
      error: error.message
    });
  }
}

export async function getAllPayments(req: AuthRequest, res: Response) {
  try {
    const all = db.paymentProvider.getAllTransactions();
    return res.json({
      success: true,
      count: all.length,
      transactions: all,
      demoNotice: 'All transactions listed are sandbox mock objects.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all transactions.',
      error: error.message
    });
  }
}

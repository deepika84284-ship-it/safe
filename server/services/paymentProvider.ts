import { MockTransaction, TransactionStatus, VpaAnalysisResult, RiskLevel } from '../types';

export interface PaymentIntentOptions {
  userId: string;
  userName: string;
  userEmail: string;
  websiteId: string;
  domain: string;
  productName: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'GPAY_UPI' | 'PHONEPE' | 'PAYTM' | 'CREDIT_DEBIT_CARD';
  upiId?: string;
  merchantVpa?: string;
  utrNumber?: string;
  notes?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction: MockTransaction;
  message: string;
  demoNotice: string;
}

export interface RefundResult {
  success: boolean;
  transaction: MockTransaction;
  message: string;
  refundReference: string;
}

/**
 * Analyzes a given UPI VPA (e.g., target@okaxis, fake_shop@ybl) for anti-fraud signals
 */
export function analyzeVpaSecurity(vpa: string): VpaAnalysisResult {
  const cleanVpa = (vpa || '').trim().toLowerCase();
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const isValidFormat = vpaRegex.test(cleanVpa);

  if (!cleanVpa || !isValidFormat) {
    return {
      vpa: cleanVpa,
      isValidFormat: false,
      bankHandle: '',
      isFlaggedForScam: false,
      isPersonalMasqueradingAsBusiness: false,
      riskScore: 75,
      threatLevel: 'HIGH_RISK',
      trustVerdict: 'Invalid UPI format. Must be formatted like name@bankhandle (e.g. store@okaxis).',
      riskReasons: ['Malformed UPI ID / VPA format']
    };
  }

  const [handle, bank] = cleanVpa.split('@');
  const riskReasons: string[] = [];
  let riskScore = 10;
  let isFlaggedForScam = false;
  let isPersonalMasqueradingAsBusiness = false;

  // Check known suspicious patterns
  const suspiciousKeywords = ['lottery', 'winner', 'cashback', 'customs', 'refund_desk', 'kyc', 'courier_charge', 'helpline', 'prize', 'giftcard'];
  for (const kw of suspiciousKeywords) {
    if (handle.includes(kw)) {
      riskReasons.push(`UPI handle contains high-scam deceptive keyword "${kw}"`);
      riskScore += 45;
      isFlaggedForScam = true;
    }
  }

  // Check if personal phone number or random string is masquerading as a company store
  const isPhoneNumber = /^\d{10}$/.test(handle);
  const isPersonalHandle = /^[a-z]+[0-9]{2,5}$/.test(handle) || ['okaxis', 'oksbi', 'okhdfcbank', 'okicici', 'ybl'].includes(bank);

  if (isPhoneNumber) {
    riskReasons.push('Personal 10-digit mobile number used as UPI ID instead of registered business merchant VPA');
    riskScore += 25;
    isPersonalMasqueradingAsBusiness = true;
  }

  // High risk known scam handles
  const knownBlacklistedVpas = [
    'customs.clearance@okaxis',
    'fastcourier.fee@ybl',
    'instagram.order.pay@paytm',
    'support.refund.kyc@oksbi'
  ];

  if (knownBlacklistedVpas.includes(cleanVpa)) {
    riskReasons.push('UPI ID found in SafeCart Community Scam Registry with multiple dispute reports');
    riskScore = 95;
    isFlaggedForScam = true;
  }

  let threatLevel: 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_SCAM' = 'LOW_RISK';
  if (riskScore >= 70) threatLevel = 'CONFIRMED_SCAM';
  else if (riskScore >= 40) threatLevel = 'HIGH_RISK';
  else if (riskScore >= 20) threatLevel = 'SUSPICIOUS';
  else threatLevel = 'SAFE';

  const trustVerdict = isFlaggedForScam
    ? 'High scam risk detected on this UPI ID. Proceeding with unshielded direct payment may result in permanent loss.'
    : isPersonalMasqueradingAsBusiness
    ? 'Personal UPI handle detected for commercial transaction. SafeCart Escrow Lock is strongly recommended.'
    : 'Valid UPI VPA. Eligible for instant SafeCart Escrow Protected Checkout.';

  return {
    vpa: cleanVpa,
    isValidFormat: true,
    bankHandle: bank,
    isFlaggedForScam,
    isPersonalMasqueradingAsBusiness,
    riskScore,
    threatLevel,
    trustVerdict,
    riskReasons
  };
}

export abstract class PaymentProvider {
  abstract createPayment(options: PaymentIntentOptions): Promise<PaymentResult>;
  abstract verifyPayment(transactionId: string): Promise<PaymentResult>;
  abstract requestRefund(transactionId: string, reason: string): Promise<RefundResult>;
  abstract processRefund(transactionId: string, adminApproved: boolean): Promise<RefundResult>;
  abstract getPaymentStatus(transactionId: string): Promise<MockTransaction | null>;
}

export class MockSandboxPaymentProvider extends PaymentProvider {
  private transactions: Map<string, MockTransaction> = new Map();

  constructor(initialTransactions: MockTransaction[] = []) {
    super();
    for (const tx of initialTransactions) {
      this.transactions.set(tx.id, tx);
    }
  }

  async createPayment(options: PaymentIntentOptions): Promise<PaymentResult> {
    const isGpay = options.paymentMethod === 'GPAY_UPI' || options.paymentMethod === 'PHONEPE' || options.paymentMethod === 'PAYTM';
    const prefix = isGpay ? 'tx_gpay_' : 'tx_sandbox_';
    const id = prefix + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const utr = options.utrNumber || 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);

    const tx: MockTransaction = {
      id,
      userId: options.userId,
      userName: options.userName,
      userEmail: options.userEmail,
      websiteId: options.websiteId,
      domain: options.domain,
      productName: options.productName || 'Protected E-Commerce Item',
      amount: options.amount > 0 ? options.amount : 49.99,
      currency: options.currency || (isGpay ? 'INR' : 'USD'),
      paymentMethod: options.paymentMethod || 'GPAY_UPI',
      upiId: options.upiId || (options.userName ? `${options.userName.toLowerCase().replace(/\s+/g, '')}@okaxis` : 'shopper@okaxis'),
      merchantVpa: options.merchantVpa || `store.${options.domain.replace(/[^a-zA-Z0-9]/g, '')}@escrow.safecart`,
      utrNumber: utr,
      status: 'PROTECTED',
      escrowProtection: true,
      protectionReference: 'SAFE-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'PENDING',
          timestamp: now,
          note: isGpay
            ? `Google Pay UPI transaction initiated via ${options.upiId || 'GPay'}. UTR: ${utr}`
            : 'Sandbox transaction initiated.'
        },
        {
          status: 'PROTECTED',
          timestamp: now,
          note: 'SafeCart Escrow Protection Locked. Funds held safely until buyer confirms order delivery.'
        }
      ]
    };

    this.transactions.set(id, tx);

    return {
      success: true,
      transaction: tx,
      message: isGpay
        ? 'Google Pay (GPay) Protected UPI Payment completed successfully in Escrow Vault.'
        : 'Demo protected transaction established successfully.',
      demoNotice: 'This is a demo protected transaction sandbox. No real bank debits occur.'
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    return {
      success: true,
      transaction: tx,
      message: `Transaction status is currently ${tx.status}.`,
      demoNotice: 'This is a demo transaction. No real money was moved.'
    };
  }

  async requestRefund(transactionId: string, reason: string): Promise<RefundResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const now = new Date().toISOString();
    tx.status = 'REFUND_REQUESTED';
    tx.updatedAt = now;
    tx.timeline.push({
      status: 'REFUND_REQUESTED',
      timestamp: now,
      note: `1-Click Refund requested by buyer. Reason: ${reason}`
    });

    this.transactions.set(transactionId, tx);

    return {
      success: true,
      transaction: tx,
      message: 'Refund request registered in SafeCart Escrow.',
      refundReference: 'REF-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  async processRefund(transactionId: string, adminApproved: boolean): Promise<RefundResult> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const now = new Date().toISOString();
    tx.status = adminApproved ? 'REFUNDED' : 'PROTECTED';
    tx.updatedAt = now;
    tx.timeline.push({
      status: tx.status,
      timestamp: now,
      note: adminApproved
        ? `Refund processed back to buyer's GPay UPI VPA (${tx.upiId || 'Google Pay'}) instantly.`
        : 'Refund dispute reviewed and status reverted to Protected.'
    });

    this.transactions.set(transactionId, tx);

    return {
      success: true,
      transaction: tx,
      message: adminApproved ? 'GPay Escrow refund credited back successfully.' : 'Dispute updated.',
      refundReference: 'REF-COMPLETED-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  async getPaymentStatus(transactionId: string): Promise<MockTransaction | null> {
    return this.transactions.get(transactionId) || null;
  }

  getAllTransactions(): MockTransaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  seedTransactions(txs: MockTransaction[]) {
    for (const tx of txs) {
      this.transactions.set(tx.id, tx);
    }
  }
}

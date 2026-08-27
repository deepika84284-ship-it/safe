import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MockTransaction } from '../types';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  X,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Smartphone
} from 'lucide-react';

interface ProtectedCheckoutModalProps {
  domain: string;
  websiteId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProtectedCheckoutModal: React.FC<ProtectedCheckoutModalProps> = ({
  domain,
  websiteId,
  isOpen,
  onClose
}) => {
  const { success, error, info } = useToast();
  const [step, setStep] = useState<'INITIAL' | 'PROCESSING' | 'ACTIVE_ESCROW' | 'REFUND_FLOW'>('INITIAL');
  const [productName, setProductName] = useState('Standard E-Commerce Test Item');
  const [amount, setAmount] = useState('1499');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [paymentMethod, setPaymentMethod] = useState<'GPAY_UPI' | 'PHONEPE' | 'PAYTM' | 'CREDIT_DEBIT_CARD'>('GPAY_UPI');
  const [upiId, setUpiId] = useState('shopper@okaxis');
  const [transaction, setTransaction] = useState<MockTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('Non-responsive seller / unverified tracking number');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartProtectedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStep('PROCESSING');

    try {
      // Simulate gateway latency
      await new Promise((r) => setTimeout(r, 900));

      const utr = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
      const res = await api.createDemoPayment({
        domain,
        websiteId,
        productName,
        amount: parseFloat(amount) || (currency === 'INR' ? 1499 : 49.99),
        currency,
        paymentMethod,
        upiId: paymentMethod !== 'CREDIT_DEBIT_CARD' ? upiId : undefined,
        utrNumber: utr
      });

      if (res.success && res.transaction) {
        setTransaction(res.transaction);
        setStep('ACTIVE_ESCROW');
        success('Protected Sandbox Order Active', 'Mock escrow transaction generated securely.');
      }
    } catch (err: any) {
      error('Checkout Error', err.response?.data?.message || 'Failed to initiate mock protected checkout');
      setStep('INITIAL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!transaction) return;
    setIsSubmitting(true);

    try {
      const res = await api.requestRefund(transaction.id, refundReason);
      if (res.success && res.transaction) {
        setTransaction(res.transaction);
        info('Refund Requested', 'Sandbox mock refund request registered.');

        // Automatically simulate instant sandbox admin approval for demo satisfaction
        setTimeout(async () => {
          try {
            const refundRes = await api.processAdminRefund(transaction.id, true);
            if (refundRes.success && refundRes.transaction) {
              setTransaction(refundRes.transaction);
              success('Demo Refund Processed', 'Mock escrow balance successfully returned to buyer.');
            }
          } catch (e) {
            // ignore
          }
        }, 1500);
      }
    } catch (err: any) {
      error('Refund Failed', err.response?.data?.message || 'Could not process refund request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden"
        id="protected-checkout-modal"
      >
        {/* Top Sandbox Notice Banner */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-3 flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Demo sandbox only. No real money collected or transferred.</span>
        </div>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Payment Escrow Sandbox</h3>
              <p className="text-xs text-slate-400 font-mono font-medium">Buyer Escrow & Anti-Fraud Simulator for {domain}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {step === 'INITIAL' && (
            <form onSubmit={handleStartProtectedCheckout} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  How Protected Checkout Works:
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside font-medium">
                  <li>Payment is held in a simulated buyer escrow vault</li>
                  <li>Merchant must provide verified delivery proof before release</li>
                  <li>Buyer can trigger a 1-click mock refund if suspicious activity arises</li>
                </ul>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  Select Protected Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GPAY_UPI')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      paymentMethod === 'GPAY_UPI'
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase">Google Pay (GPay)</div>
                      <div className="text-[10px] text-slate-400">Instant UPI Escrow</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PHONEPE')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      paymentMethod === 'PHONEPE'
                        ? 'bg-purple-950/60 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase">PhonePe / Paytm</div>
                      <div className="text-[10px] text-slate-400">UPI QR Shield</div>
                    </div>
                  </button>
                </div>
              </div>

              {paymentMethod !== 'CREDIT_DEBIT_CARD' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Your UPI VPA (for auto-refunds)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    placeholder="shopper@okaxis"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Simulated Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Amount & Currency
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="px-2.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-xs font-mono text-emerald-400 font-bold"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500 font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Merchant Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border-2 border-slate-700 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    Pay with Google Pay Shield ({currency === 'INR' ? '₹' : '$'}{amount})
                  </span>
                </button>
              </div>
            </form>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div>
                <h4 className="text-white font-black uppercase tracking-tight text-sm">Securing Transaction Sandbox...</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono font-medium">Establishing Google Pay Escrow protections for {domain}</p>
              </div>
            </div>
          )}

          {(step === 'ACTIVE_ESCROW' || step === 'REFUND_FLOW') && transaction && (
            <div className="space-y-4">
              {/* Status Header */}
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between ${
                  transaction.status === 'REFUNDED'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : transaction.status === 'REFUND_REQUESTED'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {transaction.status === 'REFUNDED' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : transaction.status === 'REFUND_REQUESTED' ? (
                    <RotateCcw className="w-6 h-6 text-amber-400 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  )}
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider font-black">
                      Status: {transaction.status}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">Ref: {transaction.protectionReference}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-white font-mono">
                    {transaction.currency === 'INR' ? '₹' : '$'}{transaction.amount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    {transaction.paymentMethod || 'GPAY_UPI'}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Item:</span>
                  <span className="text-white font-mono">{transaction.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seller Domain:</span>
                  <span className="text-white font-mono">{transaction.domain}</span>
                </div>
                {transaction.utrNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank UTR / Reference:</span>
                    <span className="text-white font-mono">{transaction.utrNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Escrow Security:</span>
                  <span className="text-emerald-400 font-bold uppercase tracking-wider font-mono text-[11px]">Active Anti-Fraud Lock</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-300">Transaction History:</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {transaction.timeline.map((entry, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5"
                    >
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-slate-200 font-medium">{entry.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {transaction.status === 'PROTECTED' && (
                <div className="pt-2">
                  <div className="mb-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                      Simulate Dispute / Trigger Instant GPay Refund:
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      placeholder="Enter dispute reason"
                    />
                  </div>
                  <button
                    onClick={handleRequestRefund}
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-red-600/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Request 1-Click GPay Refund (Sandbox Test)
                  </button>
                </div>
              )}

              {transaction.status === 'REFUNDED' && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center text-xs text-emerald-300 font-black uppercase tracking-wider font-mono">
                  ✓ Demo refund processed successfully. Mock funds returned to GPay UPI.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Pay UPI Escrow Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-wider text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


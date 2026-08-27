import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { IssueCategory } from '../types';
import { AlertOctagon, X, Send, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  initialDomain?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  'No transaction',
  'Payment requested',
  'Product not delivered',
  'Fake product',
  'Refund issue',
  'Seller stopped responding',
  'Phishing or Credential Harvesting',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  initialDomain = '',
  isOpen,
  onClose,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [url, setUrl] = useState(initialDomain ? `https://${initialDomain}` : '');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [transactionIssue, setTransactionIssue] = useState<IssueCategory>('Product not delivered');
  const [financialLossAmount, setFinancialLossAmount] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !reason || !description) {
      error('Missing Information', 'Please fill in the website URL, reason, and detailed description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitReport({
        url,
        reason,
        description,
        transactionIssue,
        financialLossAmount: parseFloat(financialLossAmount) || 0,
        evidenceUrl
      });

      if (res.success) {
        success('Report Submitted', 'Your report has been logged and queued for cybersecurity moderation.');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      error('Report Submission Failed', err.response?.data?.message || 'Failed to submit report. Please check the URL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        id="report-website-modal"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Report Scam Domain</h3>
              <p className="text-xs text-slate-400 font-mono font-medium">Submit incident evidence for security analysis</p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
              Website URL / Domain *
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://suspicious-store.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
              Transaction Issue Category *
            </label>
            <select
              value={transactionIssue}
              onChange={(e) => setTransactionIssue(e.target.value as IssueCategory)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-red-500"
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
              Summary of Suspicious Activity *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Counterfeit product received, seller stopped responding"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
              Detailed Description & Timeline *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened: payment method requested, communication breakdown, delivery status, etc."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
                Financial Loss ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={financialLossAmount}
                onChange={(e) => setFinancialLossAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-200 mb-1.5">
                Evidence URL Link
              </label>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://imgur.com/..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting Report...' : 'Submit Community Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

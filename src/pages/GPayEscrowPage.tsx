import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { MockTransaction, VpaAnalysisResult } from '../types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Smartphone,
  CreditCard,
  RotateCcw,
  ExternalLink,
  Search,
  Zap,
  Info,
  Check,
  PhoneCall,
  Clock,
  Download,
  Share2
} from 'lucide-react';

export const GPayEscrowPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { success, error, info } = useToast();
  const [searchParams] = useSearchParams();

  // Tab mode
  const [activeTab, setActiveTab] = useState<'PAY' | 'VERIFY' | 'VAULT'>('PAY');

  // Payment Form States
  const initialDomain = searchParams.get('domain') || 'instagram-deals.shop';
  const [domain, setDomain] = useState(initialDomain);
  const [productName, setProductName] = useState('Premium Sneakers / Social Order');
  const [amount, setAmount] = useState('1499');
  const [currency, setCurrency] = useState('INR');
  const [sellerVpa, setSellerVpa] = useState('orders.dealzone@okaxis');
  const [buyerUpi, setBuyerUpi] = useState('myname@okaxis');

  // VPA Scanner States
  const [scanVpaInput, setScanVpaInput] = useState('9876543210@paytm');
  const [vpaAnalysis, setVpaAnalysis] = useState<VpaAnalysisResult | null>(null);
  const [isAnalyzingVpa, setIsAnalyzingVpa] = useState(false);

  // Payment Process States
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpayModalOpen, setGpayModalOpen] = useState(false);
  const [gpayStep, setGpayStep] = useState<'CHECK_VPA' | 'QR_INTENT' | 'PIN_ENTRY' | 'SUCCESS'>('CHECK_VPA');
  const [enteredPin, setEnteredPin] = useState('');
  const [activeTx, setActiveTx] = useState<MockTransaction | null>(null);

  // Vault / Transactions State
  const [vaultTxs, setVaultTxs] = useState<MockTransaction[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [refundReason, setRefundReason] = useState('Seller not responding / Fake courier tracking');
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<MockTransaction | null>(null);

  useEffect(() => {
    loadVaultTransactions();
  }, []);

  const loadVaultTransactions = async () => {
    setIsLoadingVault(true);
    try {
      const res = await api.getMyPayments();
      if (res.success) {
        setVaultTxs(res.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const handleVerifyVpa = async (vpaToTest?: string) => {
    const target = vpaToTest || scanVpaInput;
    if (!target.trim()) return;
    setIsAnalyzingVpa(true);
    try {
      const res = await api.verifyVpa(target.trim());
      if (res.success) {
        setVpaAnalysis(res.analysis);
      }
    } catch (err: any) {
      error('Analysis Failed', err.response?.data?.message || 'Could not verify UPI ID');
    } finally {
      setIsAnalyzingVpa(false);
    }
  };

  const handleInitiateGPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerVpa.trim()) {
      error('Missing UPI ID', 'Please enter seller or merchant UPI ID');
      return;
    }
    setGpayStep('CHECK_VPA');
    setGpayModalOpen(true);
    setEnteredPin('');

    // Step 1: Run automated anti-fraud check on seller VPA
    try {
      const vpaRes = await api.verifyVpa(sellerVpa.trim());
      if (vpaRes.success) {
        setVpaAnalysis(vpaRes.analysis);
      }
    } catch {
      // continue
    }
  };

  const handleProceedToQR = () => {
    setGpayStep('QR_INTENT');
  };

  const handleProceedToPin = () => {
    setGpayStep('PIN_ENTRY');
  };

  const handlePinSubmit = async () => {
    if (enteredPin.length < 4) {
      error('Invalid PIN', 'Please enter a 4 or 6 digit UPI PIN');
      return;
    }
    setIsProcessing(true);

    try {
      await new Promise((r) => setTimeout(r, 1200));

      const utr = 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000);
      const res = await api.createDemoPayment({
        domain: domain.trim() || 'instagram-store.in',
        productName: productName.trim() || 'Online Order',
        amount: parseFloat(amount) || 1499,
        currency,
        paymentMethod: 'GPAY_UPI',
        upiId: buyerUpi.trim() || 'shopper@okaxis',
        merchantVpa: sellerVpa.trim() || 'merchant@okaxis',
        utrNumber: utr
      });

      if (res.success && res.transaction) {
        setActiveTx(res.transaction);
        setGpayStep('SUCCESS');
        success(
          language === 'ta' ? 'GPay எஸ்க்ரோ பேமெண்ட் வெற்றி!' : 'GPay Escrow Payment Active!',
          language === 'ta'
            ? 'பணம் SafeCart எஸ்க்ரோவில் பாதுகாப்பாக வைக்கப்பட்டுள்ளது.'
            : 'Funds locked securely in SafeCart Escrow Vault.'
        );
        loadVaultTransactions();
      }
    } catch (err: any) {
      error('Payment Failed', err.response?.data?.message || 'Could not complete GPay transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handle1ClickRefund = async (txId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.requestRefund(txId, refundReason);
      if (res.success && res.transaction) {
        success(
          language === 'ta' ? 'ரீஃபண்ட் கோரிக்கை அனுப்பப்பட்டது' : 'Refund Initiated',
          language === 'ta' ? 'உடனடி ஒப்புதல் செயலாக்கப்படுகிறது...' : 'Simulating instant escrow refund...'
        );

        // Auto-approve in sandbox for instant demo feedback
        setTimeout(async () => {
          try {
            const refundRes = await api.processAdminRefund(txId, true);
            if (refundRes.success) {
              success(
                language === 'ta' ? 'GPay ரீஃபண்ட் வெற்றிகரமாக வரவு வைக்கப்பட்டது!' : 'GPay Refund Credited!',
                language === 'ta'
                  ? `₹${refundRes.transaction.amount} தொகை உங்கள் UPI கணக்கிற்கு திரும்ப அனுப்பப்பட்டது.`
                  : `₹${refundRes.transaction.amount} refunded back to ${refundRes.transaction.upiId || 'GPay'}.`
              );
              loadVaultTransactions();
              setSelectedTxForRefund(null);
            }
          } catch (e) {
            // ignore
          }
        }, 1200);
      }
    } catch (err: any) {
      error('Refund Failed', err.response?.data?.message || 'Could not request refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const upiIntentString = `upi://pay?pa=${encodeURIComponent(sellerVpa)}&pn=${encodeURIComponent(
    'SafeCart Escrow Protection'
  )}&am=${amount}&cu=${currency}&tn=${encodeURIComponent('SafeCart Protected Order ' + domain)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8" id="gpay-escrow-page">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Pay (GPay) UPI Shield & Escrow Protection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            {language === 'ta' ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400">
                  Google Pay (GPay)
                </span>{' '}
                மூலம் பாதுகாப்பான UPI பேமெண்ட்
              </>
            ) : (
              <>
                Pay Safely with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400">
                  Google Pay (GPay)
                </span>{' '}
                Escrow Shield
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
            {language === 'ta'
              ? 'Instagram கடைகள், WhatsApp விற்பனையாளர்கள் மற்றும் அறிமுகமில்லாத இணையதளங்களுக்கு பணம் அனுப்பும்போது, SafeCart எஸ்க்ரோ உங்கள் பணத்தை பாதுகாக்கிறது. பொருள் வரும் வரை பணம் விற்பனையாளருக்கு செல்லாது.'
              : 'Never lose money to Instagram sellers, WhatsApp advance fee traps, or fake stores. SafeCart holds your funds in Escrow until your parcel arrives safely. 1-Click instant UPI refunds.'}
          </p>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">100% Locked</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Escrow Protection</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-blue-400 uppercase">AI Pre-Scan</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">VPA Scam Check</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase">Instant 1-Click</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">UPI Auto Refund</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs font-mono font-bold text-purple-400 uppercase">₹ INR / $ USD</div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">UPI 2.0 Ready</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('PAY')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'PAY'
                ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'ta' ? 'GPay பேமெண்ட்' : 'Pay via GPay'}</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFY')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'VERIFY'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{language === 'ta' ? 'UPI ID சரிபார்ப்பு' : 'Verify UPI ID'}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('VAULT');
              loadVaultTransactions();
            }}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'VAULT'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>
              {language === 'ta' ? 'எஸ்க்ரோ கணக்குகள்' : 'Escrow Vault'} ({vaultTxs.length})
            </span>
          </button>
        </div>

        {/* TAB 1: SEND GPAY ESCROW PAYMENT */}
        {activeTab === 'PAY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Payment Form */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md p-1.5">
                    {/* Google GPay Brand Icon representation */}
                    <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center font-black text-xs text-white">
                      <span className="text-blue-400 font-black">G</span>
                      <span className="text-red-400 font-black">P</span>
                      <span className="text-amber-400 font-black">a</span>
                      <span className="text-emerald-400 font-black">y</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-tight">
                      {language === 'ta' ? 'GPay எஸ்க்ரோ பேமெண்ட் துவக்கம்' : 'Initiate GPay Escrow Payment'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {language === 'ta'
                        ? 'விற்பனையாளரின் UPI ஐடி & தொகையை உள்ளிட்டு பாதுகாப்பாக செலுத்துங்கள்'
                        : 'Simulate instant UPI checkout with automated anti-fraud security'}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase font-mono tracking-wider">
                  Escrow Vault Active
                </span>
              </div>

              {/* Quick Preset Scenarios */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === 'ta' ? 'மாதிரி டெஸ்ட் தேர்வுகள் (Quick Presets):' : 'Test Scenarios:'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDomain('trendy-sneakers.shop');
                      setProductName('Air Jordan Retro (Instagram Deal)');
                      setAmount('1999');
                      setSellerVpa('sneakerzone99@okaxis');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
                  >
                    👟 Insta Sneaker Store (₹1,999)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDomain('advance-courier-desk.in');
                      setProductName('Customs Clearance Fee (Suspicious)');
                      setAmount('499');
                      setSellerVpa('customs.clearance@okaxis');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold transition border border-red-800/40 cursor-pointer"
                  >
                    ⚠️ Blacklisted Courier VPA (₹499)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDomain('official-brand-hub.in');
                      setProductName('Smart Bluetooth Watch');
                      setAmount('2499');
                      setSellerVpa('store.brandhub@oksbi');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition border border-emerald-800/40 cursor-pointer"
                  >
                    ✅ Verified Merchant VPA (₹2,499)
                  </button>
                </div>
              </div>

              <form onSubmit={handleInitiateGPay} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seller UPI ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>{language === 'ta' ? 'விற்பனையாளர் UPI VPA' : 'Seller UPI ID / VPA'}</span>
                      <span className="text-[10px] text-blue-400 font-mono">e.g. name@okaxis</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerVpa}
                      onChange={(e) => setSellerVpa(e.target.value)}
                      placeholder="merchant@okaxis or 9876543210@paytm"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Buyer UPI ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                      <span>{language === 'ta' ? 'உங்கள் GPay UPI ID' : 'Your GPay UPI ID'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">For Auto-Refund</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerUpi}
                      onChange={(e) => setBuyerUpi(e.target.value)}
                      placeholder="shopper@okaxis"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Website / Platform */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {language === 'ta' ? 'இணையதளம் அல்லது இன்ஸ்டா பக்கம்' : 'Store Website / Instagram Handle'}
                    </label>
                    <input
                      type="text"
                      required
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="instagram-shop.in or @sneakers_india"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Amount and Currency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      {language === 'ta' ? 'செலுத்தும் தொகை' : 'Payment Amount'}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 focus:outline-none"
                      >
                        <option value="INR">₹ INR</option>
                        <option value="USD">$ USD</option>
                      </select>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Product / Order Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {language === 'ta' ? 'பொருள் அல்லது ஆர்டர் விவரம்' : 'Item / Order Details'}
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Trendy Cotton Shirt, Air Jordan Shoes"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Escrow Guarantee Callout */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-black text-emerald-300 uppercase tracking-wider">
                      {language === 'ta' ? 'SafeCart எஸ்க்ரோ உத்தரவாதம்' : 'SafeCart 100% Escrow Guarantee'}
                    </div>
                    <div className="text-slate-300 leading-relaxed text-[11px]">
                      {language === 'ta'
                        ? 'உங்கள் பணம் நேரடியாக விற்பனையாளருக்கு செல்லாது. பார்சல் வந்து சேரும் வரை SafeCart பாதுகாப்பில் இருக்கும். ஏதேனும் பிரச்சனை என்றால் 1-கிளிக் மூலம் உங்கள் GPay கணக்கிற்கே பணம் உடனடியாக திரும்ப வரும்.'
                        : 'Your payment will be held safely in escrow. If the seller does not deliver the promised goods or blocks your number, you can initiate an instant 1-Click full refund back to your GPay VPA.'}
                    </div>
                  </div>
                </div>

                {/* Submit GPay Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-700 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {language === 'ta'
                      ? `Google Pay மூலம் ${currency === 'INR' ? '₹' : '$'}${amount} செலுத்த தொடர்க`
                      : `Proceed with Google Pay (${currency === 'INR' ? '₹' : '$'}${amount})`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Right: How Escrow Works & Anti-Fraud Visual */}
            <div className="lg:col-span-5 space-y-6">
              {/* Flow Steps */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'ta' ? 'GPay எஸ்க்ரோ எப்படி செயல்படுகிறது?' : 'How GPay Escrow Shield Works'}</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white uppercase">
                        {language === 'ta' ? 'AI UPI ஸ்கேனிங்' : 'AI Pre-Payment Scan'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {language === 'ta'
                          ? 'விற்பனையாளர் UPI ஐடி ஏதேனும் மோசடி புகாரில் உள்ளதா என உடனே பரிசோதிக்கிறது.'
                          : 'SafeCart AI checks if the recipient VPA is flagged for previous complaints or disguised handles.'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white uppercase">
                        {language === 'ta' ? 'எஸ்க்ரோ பூட்டு (Escrow Lock)' : 'Escrow Protection Lock'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {language === 'ta'
                          ? 'பணம் நேரடியாக விற்பனையாளருக்கு செல்லாமல் நடுநிலையான சேஃப்கார்ட் கணக்கில் பாதுகாப்பாக தங்கும்.'
                          : 'Funds are securely deposited in escrow instead of going directly to the unverified seller.'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-white uppercase">
                        {language === 'ta' ? 'பார்சல் வந்ததும் அனுமதி அல்லது ரீஃபண்ட்' : 'Parcel Delivery or 1-Click Refund'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {language === 'ta'
                          ? 'சரியான பார்சல் வந்தால் பணத்தை விடுவிக்கலாம். போலி கூரியர் அல்லது ஏமாற்றினால் 1-கிளிக் ரீஃபண்ட் செய்யலாம்.'
                          : 'Approve release upon verified delivery, or tap 1-Click Refund to get money back to your GPay instantly.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* National Cyber Helpline Callout */}
              <div className="p-6 rounded-3xl bg-red-950/30 border border-red-800/40 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider">
                  <PhoneCall className="w-4 h-4" />
                  <span>National Cyber Crime Helpline: 1930</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ta'
                    ? 'நீங்கள் ஏற்கனவே நேரடி UPI மூலம் ஏமாற்றப்பட்டிருந்தால், உடனடியாக 1930 எண்ணை அழைத்து பரிவர்த்தனை UTR எண்ணை கூறி பணப் பரிமாற்றத்தை முடக்க கோருங்கள்.'
                    : 'If you have already transferred money directly without escrow protection, immediately dial 1930 or submit details at cybercrime.gov.in within the 2-hour golden window.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFY ANY UPI ID (VPA SCANNER) */}
        {activeTab === 'VERIFY' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <span>{language === 'ta' ? 'UPI ID மோசடி பரிசோதனை' : 'AI Pre-Payment UPI VPA Auditor'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ta'
                    ? 'வாட்ஸ்அப் அல்லது இன்ஸ்டாகிராமில் ஒருவர் கொடுத்த UPI ஐடியை (VPA) பணம் அனுப்புவதற்கு முன் சரிபாருங்கள்.'
                    : 'Analyze any Google Pay, PhonePe, or Paytm UPI ID for fraud indicators, suspicious handles, and scam registries.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={scanVpaInput}
                  onChange={(e) => setScanVpaInput(e.target.value)}
                  placeholder="e.g. 9876543210@paytm or customs.refund@okaxis"
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyVpa()}
                  disabled={isAnalyzingVpa}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAnalyzingVpa ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>{language === 'ta' ? 'ஆராய்கிறது...' : 'Auditing...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{language === 'ta' ? 'சரிபார்க்க' : 'Analyze VPA'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample test buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Try Samples:</span>
                <button
                  onClick={() => {
                    setScanVpaInput('customs.clearance@okaxis');
                    handleVerifyVpa('customs.clearance@okaxis');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-mono cursor-pointer"
                >
                  customs.clearance@okaxis
                </button>
                <button
                  onClick={() => {
                    setScanVpaInput('9841234567@paytm');
                    handleVerifyVpa('9841234567@paytm');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] font-mono cursor-pointer"
                >
                  9841234567@paytm (Personal Phone)
                </button>
                <button
                  onClick={() => {
                    setScanVpaInput('official.brandstore@okaxis');
                    handleVerifyVpa('official.brandstore@okaxis');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-mono cursor-pointer"
                >
                  official.brandstore@okaxis
                </button>
              </div>

              {/* Analysis Result Card */}
              {vpaAnalysis && (
                <div
                  className={`p-6 rounded-2xl border space-y-4 ${
                    vpaAnalysis.threatLevel === 'CONFIRMED_SCAM' || vpaAnalysis.threatLevel === 'HIGH_RISK'
                      ? 'bg-red-950/30 border-red-500/40 text-red-200'
                      : vpaAnalysis.threatLevel === 'SUSPICIOUS'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 font-mono font-black text-sm">
                      <span className="text-white">{vpaAnalysis.vpa}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                        {vpaAnalysis.bankHandle}
                      </span>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase font-mono">
                      Risk Score: {vpaAnalysis.riskScore}/100 ({vpaAnalysis.threatLevel})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-white text-xs uppercase tracking-wider">AI Verdict:</div>
                    <p className="text-xs leading-relaxed text-slate-200">{vpaAnalysis.trustVerdict}</p>
                  </div>

                  {vpaAnalysis.riskReasons.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Detected Signals:
                      </div>
                      <ul className="space-y-1 text-xs list-disc list-inside text-slate-300">
                        {vpaAnalysis.riskReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSellerVpa(vpaAnalysis.vpa);
                        setActiveTab('PAY');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ta' ? 'இந்த VPA-க்கு எஸ்க்ரோ மூலம் செலுத்தவும்' : 'Pay Safely via GPay Escrow'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY GPAY ESCROW VAULT & 1-CLICK REFUNDS */}
        {activeTab === 'VAULT' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>{language === 'ta' ? 'GPay எஸ்க்ரோ பரிவர்த்தனைகள்' : 'Active Escrow Vault Orders'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {language === 'ta'
                    ? 'பார்சல் கிடைத்ததை உறுதிப்படுத்தவும் அல்லது பிரச்சனை என்றால் 1-கிளிக் ரீஃபண்ட் பெறவும்.'
                    : 'Manage protected sandbox transactions, approve order delivery, or initiate 1-click UPI refunds.'}
                </p>
              </div>

              <button
                onClick={loadVaultTransactions}
                disabled={isLoadingVault}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingVault ? 'animate-spin' : ''}`} />
                <span>{language === 'ta' ? 'புதுப்பிக்க' : 'Refresh Vault'}</span>
              </button>
            </div>

            {vaultTxs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <Lock className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white uppercase">
                  {language === 'ta' ? 'எஸ்க்ரோ பரிவர்த்தனைகள் எதுவும் இல்லை' : 'No Escrow Transactions Yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {language === 'ta'
                    ? 'நீங்கள் GPay எஸ்க்ரோ மூலம் ஆர்டர் செய்யும்போது உங்கள் பரிவர்த்தனைகள் இங்கே தோன்றும்.'
                    : 'Initiate a demo payment with Google Pay above to simulate holding funds safely in Escrow.'}
                </p>
                <button
                  onClick={() => setActiveTab('PAY')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {language === 'ta' ? 'GPay பேமெண்ட் செய்ய' : 'Make GPay Payment'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                              tx.status === 'PROTECTED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : tx.status === 'REFUNDED'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                          <span className="text-xs font-mono text-slate-400 font-bold">
                            {tx.protectionReference}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">{tx.productName}</h4>
                        <div className="text-xs font-mono text-slate-400">{tx.domain}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-emerald-400 font-mono">
                          {tx.currency === 'INR' ? '₹' : '$'}
                          {tx.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">
                          {tx.paymentMethod || 'GPAY_UPI'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400 text-[11px]">
                      <div>
                        <strong className="text-slate-300">Buyer UPI:</strong> {tx.upiId || 'shopper@okaxis'}
                      </div>
                      <div>
                        <strong className="text-slate-300">Merchant VPA:</strong> {tx.merchantVpa || 'merchant@okaxis'}
                      </div>
                      <div>
                        <strong className="text-slate-300">UTR / Reference:</strong> {tx.utrNumber || 'UPI129849204910'}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </div>

                      <div className="flex items-center gap-2">
                        {tx.status === 'PROTECTED' && (
                          <button
                            onClick={() => setSelectedTxForRefund(tx)}
                            className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? '1-கிளிக் ரீஃபண்ட்' : '1-Click Refund'}</span>
                          </button>
                        )}

                        {tx.status === 'REFUNDED' && (
                          <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'ரீஃபண்ட் முடிந்தது' : 'Refund Completed'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REFUND MODAL */}
        {selectedTxForRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <RotateCcw className="w-6 h-6" />
                <h3 className="text-base font-black text-white uppercase">
                  {language === 'ta' ? '1-கிளிக் GPay ரீஃபண்ட் கோரிக்கை' : '1-Click GPay Escrow Refund'}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'ta'
                  ? 'விற்பனையாளர் அனுப்பிய பார்சல் போலி அல்லது பதிலளிக்கவில்லை என்றால், எஸ்க்ரோவில் உள்ள உங்கள் பணம் உடனே உங்கள் UPI கணக்கிற்கு திரும்ப அனுப்பப்படும்.'
                  : 'Since your money is protected in SafeCart Escrow Vault, requesting a refund immediately reverses the transaction back to your GPay UPI ID.'}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {language === 'ta' ? 'ரீஃபண்ட் காரணம்' : 'Dispute Reason'}
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="Non-responsive seller / unverified tracking number">
                    Non-responsive seller / unverified tracking number
                  </option>
                  <option value="Fake DTDC/Bluedart courier receipt sent">Fake DTDC/Bluedart courier receipt sent</option>
                  <option value="Seller asked for additional advance fee">Seller asked for additional advance fee</option>
                  <option value="Incorrect or damaged product delivered">Incorrect or damaged product delivered</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxForRefund(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handle1ClickRefund(selectedTxForRefund.id)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
                >
                  {isProcessing ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{language === 'ta' ? 'ரீஃபண்ட் பெறுக' : 'Execute Instant Refund'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GPAY PAYMENT SIMULATION MODAL */}
        {gpayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
              {/* GPay Header Bar */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-[11px]">
                    <span className="text-blue-500">G</span>
                    <span className="text-red-500">P</span>
                    <span className="text-amber-500">a</span>
                    <span className="text-emerald-500">y</span>
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Google Pay Safe Escrow
                  </span>
                </div>
                <button
                  onClick={() => setGpayModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-bold uppercase"
                >
                  ✕
                </button>
              </div>

              {/* STEP 1: PRE-PAYMENT VPA ANALYSIS */}
              {gpayStep === 'CHECK_VPA' && (
                <div className="p-6 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-white uppercase">
                      {language === 'ta' ? 'UPI பாதுகாப்பு சரிபார்ப்பு' : 'Pre-Payment VPA Scan'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'ta'
                        ? 'விற்பனையாளரின் UPI ஐடி சரிபார்க்கப்படுகிறது'
                        : 'Verifying recipient credentials before activating escrow'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient VPA:</span>
                      <span className="font-mono text-white font-bold">{sellerVpa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Amount:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {currency === 'INR' ? '₹' : '$'}
                        {amount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Escrow Guarantee:</span>
                      <span className="text-emerald-400 font-bold">ACTIVE (100% Protected)</span>
                    </div>
                  </div>

                  {vpaAnalysis && (
                    <div
                      className={`p-3 rounded-xl border text-xs ${
                        vpaAnalysis.isFlaggedForScam
                          ? 'bg-red-950/40 border-red-500/40 text-red-300'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      }`}
                    >
                      <strong>Verdict:</strong> {vpaAnalysis.trustVerdict}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGpayModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToQR}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: QR CODE OR INTENT LINK */}
              {gpayStep === 'QR_INTENT' && (
                <div className="p-6 space-y-4 text-center">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase">
                      {language === 'ta' ? 'GPay UPI QR கோடு அல்லது நேரடி இணைப்பு' : 'Scan with GPay or Pay Directly'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Paying <strong className="text-emerald-400">{currency === 'INR' ? '₹' : '$'}{amount}</strong> for {productName}
                    </p>
                  </div>

                  {/* Simulated QR Code Box */}
                  <div className="p-4 rounded-2xl bg-white text-slate-950 max-w-[200px] mx-auto space-y-2 shadow-xl">
                    <div className="aspect-square bg-slate-100 rounded-xl p-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-400">
                      <QrCode className="w-28 h-28 text-slate-900" />
                      <div className="text-[9px] font-mono font-black uppercase tracking-wider text-slate-700">
                        SafeCart Escrow UPI
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 break-all px-2 bg-slate-950 py-2 rounded-xl border border-slate-800">
                    {upiIntentString.substring(0, 55)}...
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGpayStep('CHECK_VPA')}
                      className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPin}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Enter UPI PIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SIMULATE GOOGLE PAY UPI PIN ENTRY */}
              {gpayStep === 'PIN_ENTRY' && (
                <div className="p-6 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Google Pay UPI Security
                    </div>
                    <h3 className="text-lg font-black text-white">
                      ENTER {enteredPin.length > 0 ? enteredPin.length : '4 or 6'} DIGIT UPI PIN
                    </h3>
                    <div className="text-xs text-emerald-400 font-mono font-bold">
                      Paying {currency === 'INR' ? '₹' : '$'}{amount} to SafeCart Escrow Vault
                    </div>
                  </div>

                  {/* PIN Display dots */}
                  <div className="flex justify-center gap-3 py-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          enteredPin.length > idx
                            ? 'bg-blue-400 border-blue-400 scale-110 shadow-md shadow-blue-500/50'
                            : 'border-slate-600 bg-slate-950'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Simulated NumPad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (enteredPin.length < 6) setEnteredPin((prev) => prev + num);
                        }}
                        className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-black text-lg border border-slate-800 transition cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEnteredPin('')}
                      className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-red-400 font-mono font-bold text-xs uppercase border border-slate-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (enteredPin.length < 6) setEnteredPin((prev) => prev + '0');
                      }}
                      className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-mono font-black text-lg border border-slate-800 transition cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnteredPin((prev) => prev.slice(0, -1))}
                      className="py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-amber-400 font-mono font-bold text-xs uppercase border border-slate-800 transition cursor-pointer"
                    >
                      ⌫
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing || enteredPin.length < 4}
                    onClick={handlePinSubmit}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        <span>Authorizing with Bank UPI...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Lock in Escrow</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION & RECEIPT */}
              {gpayStep === 'SUCCESS' && activeTx && (
                <div className="p-6 space-y-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white uppercase">
                      {language === 'ta' ? 'GPay பேமெண்ட் பாதுகாக்கப்பட்டது!' : 'GPay Escrow Payment Locked!'}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">
                      Transaction Ref: <strong className="text-white font-mono">{activeTx.protectionReference}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-left font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="text-emerald-400 font-bold">
                        {activeTx.currency === 'INR' ? '₹' : '$'}
                        {activeTx.amount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment App:</span>
                      <span className="text-white">Google Pay (GPay)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank UTR:</span>
                      <span className="text-white">{activeTx.utrNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vault Status:</span>
                      <span className="text-emerald-400 font-bold">ESCROW PROTECTED</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGpayModalOpen(false);
                        setActiveTab('VAULT');
                      }}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      View in Escrow Vault
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGpayModalOpen(false);
                        setGpayStep('CHECK_VPA');
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

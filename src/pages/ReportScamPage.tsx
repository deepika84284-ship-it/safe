import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { IssueCategory, AudioTranscriptionResult, Report } from '../types';
import { VoiceReportRecorder } from '../components/VoiceReportRecorder';
import {
  ShieldAlert,
  Send,
  Lock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Globe,
  DollarSign,
  FileText,
  RefreshCcw,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const ISSUE_CATEGORIES: IssueCategory[] = [
  'Instagram DM to WhatsApp Redirection Trap',
  'WhatsApp UPI / Advance Payment Fraud',
  'Fake Instagram Shopping Store',
  'Fake Courier Tracking Receipt',
  'Product not delivered',
  'Fake product',
  'Refund issue',
  'Seller stopped responding',
  'Payment requested',
  'Phishing or Credential Harvesting',
  'No transaction',
  'Other'
];

export const ReportScamPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t, language } = useLanguage();

  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [transactionIssue, setTransactionIssue] = useState<IssueCategory>('Product not delivered');
  const [financialLossAmount, setFinancialLossAmount] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [lastAutoFilledByAi, setLastAutoFilledByAi] = useState(false);

  // Callback when voice recording is transcribed and analyzed by AI
  const handleVoiceTranscribed = (result: AudioTranscriptionResult) => {
    if (result.extractedUrl) {
      setUrl(result.extractedUrl);
    }

    if (result.extractedReason) {
      setReason(result.extractedReason);
    }

    if (result.extractedDescription) {
      setDescription(result.extractedDescription);
    }

    if (result.suggestedCategory) {
      setTransactionIssue(result.suggestedCategory);
    }

    if (typeof result.financialLossAmount === 'number' && result.financialLossAmount > 0) {
      setFinancialLossAmount(String(result.financialLossAmount));
    }

    setLastAutoFilledByAi(true);
    success(
      language === 'ta' ? 'குரல் பதிவு மாற்றப்பட்டது' : 'Voice Transcribed Successfully',
      language === 'ta'
        ? 'உங்கள் குரல் புகார் AI மூலம் படிவத்தில் நிரப்பப்பட்டுள்ளது. விவரங்களை சரிபார்த்து சமர்ப்பிக்கவும்.'
        : 'AI has extracted your voice report into the form fields. Please review and submit.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!url.trim() || !reason.trim() || !description.trim()) {
      const msg = language === 'ta' ? 'தயவுசெய்து தேவையான அனைத்து கட்டங்களையும் நிரப்பவும்.' : 'Please complete all required fields (URL, summary, and detailed description).';
      setSubmissionError(msg);
      error(language === 'ta' ? 'விடுபட்ட விவரங்கள்' : 'Missing Fields', msg);
      return;
    }

    setIsSubmitting(true);
    const lossVal = parseFloat(financialLossAmount) || 0;

    try {
      const res = await api.submitReport({
        url: url.trim(),
        reason: reason.trim(),
        description: description.trim(),
        transactionIssue,
        financialLossAmount: lossVal,
        evidenceUrl: evidenceUrl.trim()
      });

      if (res && res.success) {
        const createdReport: Report = res.report || {
          id: res.reportId || `REP-${Date.now()}`,
          url: url.trim(),
          reason: reason.trim(),
          description: description.trim(),
          transactionIssue,
          financialLossAmount: lossVal,
          evidenceUrl: evidenceUrl.trim(),
          status: 'USER_REPORTED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setSubmittedReport(createdReport);
        success(
          language === 'ta' ? 'மோசடி புகார் பதிவு செய்யப்பட்டது' : 'Incident Report Recorded',
          language === 'ta'
            ? 'பொதுமக்களை காக்க உதவியதற்கு நன்றி! உங்கள் புகார் பெறப்பட்டு பதியப்பட்டது.'
            : 'Thank you for protecting fellow consumers. Your report has been recorded successfully.'
        );
      } else {
        const errMsg = res?.message || (language === 'ta' ? 'புகாரை சமர்ப்பிக்க இயலவில்லை.' : 'Failed to submit report. Please check input syntax.');
        setSubmissionError(errMsg);
        error(language === 'ta' ? 'பிழை ஏற்பட்டது' : 'Submission Error', errMsg);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || (language === 'ta' ? 'புகாரை சமர்ப்பிக்க இயலவில்லை. இணைய இணைப்பை சரிபார்க்கவும்.' : 'Failed to submit report. Please check URL syntax or try again.');
      setSubmissionError(errMsg);
      error(language === 'ta' ? 'பிழை ஏற்பட்டது' : 'Submission Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'சமூக பாதுகாப்பு தரவுத்தளம்' : 'Community Threat Intelligence'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            {t('report.title')}
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto font-medium">
            {t('report.subtitle')}
          </p>
        </div>

        {/* Success Confirmation Card View */}
        {submittedReport ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black uppercase tracking-widest">
                <span>Report Reference ID: {submittedReport.id}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {language === 'ta' ? 'மோசடி புகார் வெற்றிகரமாக பெறப்பட்டது' : 'Scam Report Recorded Successfully'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
                {language === 'ta'
                  ? 'உங்கள் புகார் பெறப்பட்டு SafeCart பாதுகாப்பு தரவுத்தளத்தில் பதிவு செய்யப்பட்டுள்ளது. பிற நுகர்வோரை காக்க உதவியதற்கு நன்றி!'
                  : 'Your incident report has been securely registered in the SafeCart Community Threat Registry under review. Thank you for protecting the community!'}
              </p>
            </div>

            {/* Anonymized Incident Summary Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 font-mono text-xs max-w-xl mx-auto">
              <div className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800 pb-1.5">
                Reported Incident Summary
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Target URL / Domain:</span>
                <span className="text-white font-bold truncate max-w-xs">{submittedReport.url}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Category of Issue:</span>
                <span className="text-amber-400 font-bold">{submittedReport.transactionIssue}</span>
              </div>
              {submittedReport.financialLossAmount ? (
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Financial Loss Amount:</span>
                  <span className="text-red-400 font-bold">₹{submittedReport.financialLossAmount.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Moderation Status:</span>
                <span className="text-emerald-400 font-bold">{submittedReport.status || 'USER_REPORTED'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Submission Time:</span>
                <span className="text-slate-300">{new Date(submittedReport.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Emergency Helpline Box */}
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-left flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-black text-red-300 uppercase font-mono">National Cyber Crime Helpline: 1930</span>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  {language === 'ta'
                    ? 'பணம் இழந்திருந்தால் முதல் 2 மணி நேரத்திற்குள் 1930 எண்ணை அழைத்து வங்கி கணக்கை முடக்கக் கோரவும்.'
                    : 'If you transferred money to this scammer via UPI or card within the last 2 hours, call 1930 immediately to freeze fraudulent transfers.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/my-reports')}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'ta' ? 'என் புகார்களை பார்க்க' : 'View Report'}</span>
              </button>

              <button
                onClick={() => {
                  setSubmittedReport(null);
                  setUrl('');
                  setReason('');
                  setDescription('');
                  setFinancialLossAmount('');
                  setEvidenceUrl('');
                  setLastAutoFilledByAi(false);
                }}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCcw className="w-4 h-4 text-slate-400" />
                <span>{language === 'ta' ? 'மற்றொரு புகார் சமர்ப்பிக்க' : 'Submit Another Report'}</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>{language === 'ta' ? 'முகப்பு பக்கம்' : 'Back to Home'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Voice Recording Assistant Card */}
            <VoiceReportRecorder onTranscribeComplete={handleVoiceTranscribed} />

            {/* Form Card */}
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl space-y-6 relative">
              {/* Submission Error Banner */}
              {submissionError && (
                <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-3 font-semibold animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* AI Auto-fill indicator badge */}
              {lastAutoFilledByAi && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">
                      {language === 'ta' ? 'படிவம் AI குரல் பதிவினால் தானாக நிரப்பப்பட்டது' : 'Form Auto-Filled by Gemini Voice AI'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400/80">
                    {language === 'ta' ? 'நீங்கள் விரும்பினால் மாற்றங்களை செய்யலாம்' : 'You can edit fields before submitting'}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-red-400" />
                      {language === 'ta' ? 'இணையதள URL அல்லது இன்ஸ்டாகிராம்/வாட்ஸ்அப் அடையாளம் *' : 'Website URL or Domain Name *'}
                    </span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">{language === 'ta' ? 'கட்டாய புலம்' : 'required'}</span>
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://scam-store-example.com or @fraud_store"
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-red-500 transition"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                    {language === 'ta'
                      ? 'மோசடி நடந்த இணையதள முகவரி, இன்ஸ்டா பக்கம் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்.'
                      : 'Enter the full website URL, store handle, or domain where the incident occurred.'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                    <span>{language === 'ta' ? 'மோசடி வகை *' : 'Category of Issue *'}</span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">{language === 'ta' ? 'கட்டாய புலம்' : 'required'}</span>
                  </label>
                  <select
                    value={transactionIssue}
                    onChange={(e) => setTransactionIssue(e.target.value as IssueCategory)}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-red-500 font-mono"
                  >
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                    <span>{language === 'ta' ? 'சுருக்கமான தலைப்பு / காரணம் *' : 'Brief Summary of Violation *'}</span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">{language === 'ta' ? 'கட்டாய புலம்' : 'required'}</span>
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={language === 'ta' ? 'எ.கா: ரூ. 1,500 செலுத்திய பின் போலி டிராக்கிங் எண் கொடுத்து வாட்ஸ்அப்பில் பிளாக் செய்தனர்' : 'e.g. Paid $120, seller went offline and tracking number was bogus'}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-400" />
                      {language === 'ta' ? 'முழுமையான விரிவான புகார் விவரம் *' : 'Detailed Incident Description *'}
                    </span>
                    <span className="text-[10px] text-slate-500 lowercase font-normal">{language === 'ta' ? 'கட்டாய புலம்' : 'required'}</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'ta' ? 'நடந்த நிகழ்வுகளை வரிசையாக விவரிக்கவும்: ஆர்டர் செய்யப்பட்ட பொருள், கேட்கப்பட்ட கட்டணம், வாட்ஸ்அப்/UPI பரிவர்த்தனை விவரங்கள் மற்றும் ஏமாற்றப்பட்ட விதம்.' : 'Please describe chronological events: product ordered, payment method requested (e.g. UPI, card), seller responses, and why you believe this store is fraudulent.'}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      {t('report.amountLabel')} ({language === 'ta' ? 'விருப்பத்திற்கேற்ப' : 'optional'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={financialLossAmount}
                      onChange={(e) => setFinancialLossAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 font-mono">
                      {language === 'ta' ? 'சான்று / ஸ்கிரீன்ஷாட் இணைப்பு (விருப்பத்திற்கேற்ப)' : 'Evidence / Screenshot Link (optional)'}
                    </label>
                    <input
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://imgur.com/screenshot"
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border-2 border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Emergency 1930 Helper Callout */}
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
                  <PhoneCall className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-black text-red-300 uppercase tracking-wider font-mono">
                      {language === 'ta' ? 'அவசர உதவி: பணம் இழந்திருந்தால் உடனடியாக 1930 அழைக்கவும்' : 'Emergency Notice: Call 1930 if funds debited'}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {language === 'ta'
                        ? 'UPI அல்லது வங்கி மூலம் மோசடி நபருக்கு பணம் அனுப்பியிருந்தால், முதல் 2 மணி நேரத்திற்குள் (Golden Hour) 1930 எண்ணை அழைத்து வங்கி கணக்கை முடக்கக் கோரவும்.'
                        : 'If money was transferred via UPI or card, immediately call the National Cyber Helpline 1930 within the golden hour to freeze fraudulent bank transfers.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ta' ? 'தனியுரிமை மற்றும் ரகசியக் காப்பு' : 'Privacy & Anonymity Guarantee'}</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    {language === 'ta'
                      ? 'உங்கள் தனிப்பட்ட அடையாளங்கள் பொதுவெளியில் வெளியிடப்படாது. சமூகப் பதிவேட்டில் அடையாளம் மறைக்கப்பட்ட சுருக்கங்கள் மட்டுமே இடம்பெறும்.'
                      : 'Your personal identity is never published publicly. Community reports display anonymized summaries to protect user privacy.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting
                      ? (language === 'ta' ? 'புகார் சமர்ப்பிக்கப்படுகிறது...' : 'Submitting Report...')
                      : (language === 'ta' ? 'SafeCart தளத்தில் மோசடி புகாரை சமர்ப்பிக்க' : 'Submit Scam Report to SafeCart Network')}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

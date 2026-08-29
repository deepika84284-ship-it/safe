import React, { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { JobScamAnalysisResult } from '../types';
import { RiskGauge } from '../components/RiskGauge';
import {
  Briefcase,
  Mail,
  Building2,
  Globe,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCcw,
  Sparkles,
  Lock,
  PhoneCall,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const JobScamScannerPage: React.FC = () => {
  const { language } = useLanguage();
  const { error, success } = useToast();

  const [emailContent, setEmailContent] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<JobScamAnalysisResult | null>(null);

  const sampleScenarios = language === 'ta' ? [
    {
      title: 'அங்கீகரிக்கப்பட்ட நிறுவனம் (TCS HR)',
      sender: 'careers.recruitment@tcs.com',
      company: 'Tata Consultancy Services (TCS)',
      url: 'https://www.tcs.com/careers',
      content: 'Dear Candidate,\nWe are pleased to invite you for a technical interview round for the Software Engineer role at TCS Chennai. Please confirm your availability. Note: TCS does not charge any registration fee or security deposit at any stage of recruitment.'
    },
    {
      title: 'கட்டணம் கேட்கும் மோசடி (Registration Fee Scam)',
      sender: 'hr-tcs-selection@gmail.com',
      company: 'TCS Global Recruitment',
      url: 'http://tcs-jobs-portal.xyz',
      content: 'Congratulations! You have been selected for Data Entry Operator. Salary Rs 45,000/month. To issue your official offer letter and laptop kit, please transfer Rs 2,499 as refundable registration fee via GPay to hr.tcs@okaxis immediately.'
    },
    {
      title: 'ரகசிய தகவல் கேட்கும் மோசடி (OTP / PIN Trap)',
      sender: 'verification@tech-hiring-hub.shop',
      company: 'Global Digital Solutions',
      url: 'http://tech-hiring-hub.shop/verify',
      content: 'URGENT: For background check verification, send your Bank Account Number, Net Banking Password, and Aadhaar OTP to complete background verification before onboarding.'
    },
    {
      title: 'சந்தேகத்திற்குரிய Gmail HR (Suspicious Recruiter)',
      sender: 'google.hr.recruiter99@gmail.com',
      company: 'Google India Careers',
      url: '',
      content: 'We saw your profile on job portal. Google is offering Work From Home typing job earning $500 per day. Join Telegram group @google_job_deals to chat with Hiring Manager.'
    }
  ] : [
    {
      title: 'Authentic Enterprise HR Offer (TCS)',
      sender: 'careers.recruitment@tcs.com',
      company: 'Tata Consultancy Services (TCS)',
      url: 'https://www.tcs.com/careers',
      content: 'Dear Candidate,\nWe are pleased to invite you for a technical interview round for the Software Engineer position at TCS. Please confirm your availability for the video interview. Note: TCS never charges any registration fee, security deposit, or processing fee during recruitment.'
    },
    {
      title: 'Registration / Processing Fee Demand Scam',
      sender: 'hr-tcs-selection@gmail.com',
      company: 'TCS Global Recruitment',
      url: 'http://tcs-jobs-portal.xyz',
      content: 'Congratulations! You have been shortlisted for WFH Data Entry Operator. Package $600/week. To dispatch your company laptop and gate pass, pay a refundable processing fee of $49 via UPI/wire transfer immediately.'
    },
    {
      title: 'Bank OTP & Credential Harvesting Trap',
      sender: 'verification@tech-hiring-hub.shop',
      company: 'Global Tech Staffing',
      url: 'http://tech-hiring-hub.shop/verify',
      content: 'URGENT: To complete mandatory identity verification, send your Net Banking Password, UPI PIN, and 6-digit Aadhaar OTP to our verification desk link below.'
    },
    {
      title: 'Suspicious Gmail Recruiter (Google Impersonation)',
      sender: 'google.hr.recruiter99@gmail.com',
      company: 'Google India Careers',
      url: '',
      content: 'Hi! Google is hiring Work From Home typing assistants earning $500/day. No technical interview required. Contact Hiring Manager on Telegram handle @google_hiring_manager.'
    }
  ];

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailContent.trim() && !senderEmail.trim()) {
      error(
        language === 'ta' ? 'விவரம் தேவை' : 'Input Required',
        language === 'ta' ? 'தயவுசெய்து மின்னஞ்சல் உள்ளடக்கம் அல்லது அனுப்பியவர் முகவரியை உள்ளிடவும்.' : 'Please enter the email text or sender email address to analyze.'
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.analyzeJobEmail({
        emailContent: emailContent.trim(),
        senderEmail: senderEmail.trim(),
        companyName: companyName.trim(),
        jobUrl: jobUrl.trim()
      });

      if (res.success && res.analysis) {
        setResult(res.analysis);
        success(
          language === 'ta' ? 'பகுப்பாய்வு முடிந்தது' : 'Analysis Complete',
          language === 'ta' ? 'வேலைவாய்ப்பு மின்னஞ்சல் பரிசோதனை முடிந்தது.' : 'Job offer security analysis completed.'
        );
      }
    } catch (err: any) {
      error(
        language === 'ta' ? 'பகுப்பாய்வு தோல்வி' : 'Analysis Failed',
        err.response?.data?.message || (language === 'ta' ? 'மின்னஞ்சலை சரிபார்க்க முடியவில்லை.' : 'Could not analyze job email right now.')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'LIKELY_LEGIT':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          title: language === 'ta' ? 'உண்மையான வேலைவாய்ப்பு' : 'Likely Authentic Job Recruitment'
        };
      case 'LIKELY_JOB_SCAM':
        return {
          bg: 'bg-red-950/60 border-red-500/50 text-red-300',
          icon: <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />,
          title: language === 'ta' ? 'வேலைவாய்ப்பு மோசடி ஆபத்து' : 'HIGH RISK: Likely Job Offer Scam'
        };
      case 'SUSPICIOUS':
        return {
          bg: 'bg-amber-950/60 border-amber-500/50 text-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          title: language === 'ta' ? 'சந்தேகத்திற்குரிய மின்னஞ்சல்' : 'Elevated Risk – Suspicious Recruitment'
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          icon: <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />,
          title: language === 'ta' ? 'குறைந்த தகவல்' : 'Unable to Verify – Insufficient Data'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'போலி வேலைவாய்ப்பு கண்டுபிடிப்பான்' : 'Recruitment Fraud Shield'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            {language === 'ta' ? 'வேலைவாய்ப்பு மின்னஞ்சல் ஸ்கேனர்' : 'Job Scam Email Scanner'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-medium">
            {language === 'ta'
              ? 'போலி வேலைவாய்ப்பு அறிவிப்புகள், முன்பணம் கேட்கும் மோசடிகள் மற்றும் போலி HR மின்னஞ்சல்களை கண்டறியவும்.'
              : 'Inspect job offer emails, recruitment letters, sender domains, and interview requests for advance fee traps and HR impersonation.'}
          </p>
        </div>

        {/* Input Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'ta' ? 'அனுப்பியவர் மின்னஞ்சல் (Sender Email)' : 'Sender Email Address'}</span>
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. hr@company-careers.com or recruiter@gmail.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'ta' ? 'நிறுவனத்தின் பெயர் (Company Name)' : 'Company Name'}</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tata Consultancy Services, Google, Amazon"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'ta' ? 'வேலைவாய்ப்பு மின்னஞ்சல் உரை (Job Email Text)' : 'Job Offer / Interview Email Content'}</span>
              </label>
              <textarea
                rows={5}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'வேலைவாய்ப்பு மின்னஞ்சலின் முழு உரையை இங்கு ஒட்டவும் (உதாரணம்: "Congratulations! You have been selected. Pay Rs 2500 registration fee...")'
                    : 'Paste full job offer email or selection letter text here...'
                }
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'ta' ? 'வேலைவாய்ப்பு இணையதள இணைப்பு (Job Offer URL)' : 'Job Application / Career Link (Optional)'}</span>
              </label>
              <input
                type="text"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="e.g. https://careers.company.com/jobs/123"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>{language === 'ta' ? 'பரிசோதிக்கப்படுகிறது...' : 'Analyzing Offer...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'ta' ? 'வேலைவாய்ப்பு மின்னஞ்சலை சோதிக்கவும்' : 'Analyze Job Offer Email'}</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Sample Scenarios */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {language === 'ta' ? 'உதாரண சோதனைகள் (Quick Test Presets):' : 'Sample Test Presets:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSenderEmail(sc.sender);
                    setCompanyName(sc.company);
                    setJobUrl(sc.url);
                    setEmailContent(sc.content);
                  }}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition hover:bg-slate-800/60 cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 truncate">
                    {sc.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{sc.sender}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        {result && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in">
            {/* Verdict Header Banner */}
            {(() => {
              const badge = getVerdictBadge(result.verdict);
              return (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${badge.bg}`}>
                  <div className="flex items-center gap-3">
                    {badge.icon}
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-white">
                        {language === 'ta' ? result.verdictTamil : result.verdictEnglish}
                      </h3>
                      <div className="text-xs opacity-90 font-mono mt-0.5">
                        Category: {result.scamCategory}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider block">
                      Risk Score
                    </span>
                    <span className="text-2xl font-black font-mono tracking-tight">{result.riskScore} / 100</span>
                  </div>
                </div>
              );
            })()}

            {/* Risk Gauge & Sender Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 items-center">
              <div className="flex justify-center md:border-r md:border-slate-800 md:pr-6">
                <RiskGauge
                  score={result.riskScore}
                  level={
                    result.riskScore >= 75
                      ? 'VERY HIGH'
                      : result.riskScore >= 40
                      ? 'HIGH'
                      : 'LOW'
                  }
                  confidence="HIGH"
                  size="md"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Sender Domain Breakdown
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Sender Email:</span>
                    <span className="text-white font-bold">{result.senderAnalysis.senderEmail || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Domain Provider:</span>
                    <span className={result.senderAnalysis.isPublicEmailProvider ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {result.senderAnalysis.isPublicEmailProvider ? 'Free Public Domain (@gmail/@yahoo)' : 'Custom Corporate Domain'}
                    </span>
                  </div>
                  {result.senderAnalysis.isImpersonatingEnterprise && (
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Impersonation Flag:</span>
                      <span className="text-red-400 font-bold">Public Email Impersonating Enterprise</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Red Flags List */}
            {result.redFlags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Detected Threat Indicators ({result.redFlags.length})</span>
                </h4>
                <div className="space-y-2">
                  {result.redFlags.map((flag, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200 text-xs font-semibold flex items-start gap-2.5">
                      <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Indicators */}
            {result.positiveIndicators.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Passing Authenticity Signals ({result.positiveIndicators.length})</span>
                </h4>
                <div className="space-y-2">
                  {result.positiveIndicators.map((pos, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Checklist */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Job Security Action Checklist</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside font-medium leading-relaxed">
                {result.recommendedActions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Helpline Footer */}
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-bold text-white">National Cyber Crime Helpline: 1930</span>
              </div>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 font-bold hover:underline"
              >
                Report Job Fraud on cybercrime.gov.in →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

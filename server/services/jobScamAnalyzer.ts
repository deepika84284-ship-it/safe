export interface JobEmailInput {
  emailContent: string;
  senderEmail?: string;
  companyName?: string;
  jobUrl?: string;
}

export interface JobScamAnalysisResult {
  verdict: 'LIKELY_LEGIT' | 'SUSPICIOUS' | 'LIKELY_JOB_SCAM' | 'UNABLE_TO_VERIFY';
  verdictEnglish: string;
  verdictTamil: string;
  riskScore: number;
  threatLevel: 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_SCAM';
  scamCategory: string;
  redFlags: string[];
  positiveIndicators: string[];
  recommendedActions: string[];
  senderAnalysis: {
    senderEmail: string;
    domain: string;
    isPublicEmailProvider: boolean;
    isImpersonatingEnterprise: boolean;
  };
  helplineInfo: {
    cyberHelpline: string;
    reportingPortal: string;
    note: string;
  };
}

const PUBLIC_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'rediffmail.com',
  'yandex.com',
  'protonmail.com',
  'icloud.com',
  'gmx.com'
];

const KNOWN_ENTERPRISES = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'TCS', domain: 'tcs.com' },
  { name: 'Tata Consultancy Services', domain: 'tcs.com' },
  { name: 'Infosys', domain: 'infosys.com' },
  { name: 'Wipro', domain: 'wipro.com' },
  { name: 'HCL Tech', domain: 'hcltech.com' },
  { name: 'Accenture', domain: 'accenture.com' },
  { name: 'Cognizant', domain: 'cognizant.com' },
  { name: 'IBM', domain: 'ibm.com' },
  { name: 'Deloitte', domain: 'deloitte.com' },
  { name: 'Capgemini', domain: 'capgemini.com' },
  { name: 'Reliance', domain: 'ril.com' }
];

export function analyzeJobScamEmail(input: JobEmailInput): JobScamAnalysisResult {
  const content = String(input.emailContent || '').trim();
  const sender = String(input.senderEmail || '').trim().toLowerCase();
  const company = String(input.companyName || '').trim();
  const url = String(input.jobUrl || '').trim();

  const senderDomain = sender.includes('@') ? sender.split('@')[1] : '';
  const isPublicProvider = PUBLIC_EMAIL_PROVIDERS.includes(senderDomain);

  let isImpersonatingEnterprise = false;
  let matchedEnterpriseName = '';

  if (isPublicProvider || (senderDomain && !KNOWN_ENTERPRISES.some((e) => senderDomain.endsWith(e.domain)))) {
    for (const ent of KNOWN_ENTERPRISES) {
      const lowerContent = (content + ' ' + company + ' ' + sender).toLowerCase();
      if (lowerContent.includes(ent.name.toLowerCase())) {
        isImpersonatingEnterprise = true;
        matchedEnterpriseName = ent.name;
        break;
      }
    }
  }

  const isVerifiedCorporateDomain = KNOWN_ENTERPRISES.some(
    (e) => senderDomain === e.domain || senderDomain.endsWith('.' + e.domain)
  );

  const lowerContent = content.toLowerCase();
  const redFlags: string[] = [];
  const positiveIndicators: string[] = [];
  let riskScore = 10;

  // Insufficient / Empty Input Check
  if (content.length < 20 && !sender && !url) {
    return {
      verdict: 'UNABLE_TO_VERIFY',
      verdictEnglish: 'Unable to Verify – Insufficient Job Information',
      verdictTamil: 'சரிபார்க்க முடியவில்லை - குறைந்த தகவல்',
      riskScore: 25,
      threatLevel: 'LOW_RISK',
      scamCategory: 'Insufficient Recruitment Data',
      redFlags: ['Email content or offer details were too short for automated heuristic evaluation.'],
      positiveIndicators: [],
      recommendedActions: [
        'Paste the full text of the job offer or interview email.',
        'Include the sender email address (e.g. recruiter@company.com).',
        'Verify the job posting on the company’s official careers page.'
      ],
      senderAnalysis: {
        senderEmail: sender,
        domain: senderDomain,
        isPublicEmailProvider: isPublicProvider,
        isImpersonatingEnterprise: false
      },
      helplineInfo: {
        cyberHelpline: '1930',
        reportingPortal: 'cybercrime.gov.in',
        note: 'Legitimate employers will NEVER ask candidates to pay money for job offers.'
      }
    };
  }

  // 1. Fee Demands with Negation Handling ("never charges fee", "does not require fee")
  const feeKeywords = [
    'registration fee',
    'processing fee',
    'processing charge',
    'security deposit',
    'refundable deposit',
    'laptop fee',
    'equipment fee',
    'training fee',
    'badge fee',
    'paperwork fee',
    'interview charge',
    'documentation fee',
    'pay rs',
    'pay $'
  ];

  let actualFeeDemands: string[] = [];
  let isFeeNegated = false;

  for (const k of feeKeywords) {
    const idx = lowerContent.indexOf(k);
    if (idx !== -1) {
      const precedingText = lowerContent.substring(Math.max(0, idx - 45), idx);
      if (/never\s+charges?|does\s+not\s+charge|no\s+fee|free\s+of\s+cost|never\s+asks?|does\s+not\s+ask/i.test(precedingText)) {
        isFeeNegated = true;
      } else {
        actualFeeDemands.push(k);
      }
    }
  }

  if (actualFeeDemands.length > 0) {
    redFlags.push(`Demands advance payment for recruitment (${actualFeeDemands.join(', ')})`);
    riskScore += 65;
  } else if (isFeeNegated) {
    positiveIndicators.push('Explicitly clarifies that employer never demands recruitment/registration fees');
    riskScore -= 10;
  }

  // 2. Credential & Financial Info Theft (OTP, PIN, Password)
  const credentialKeywords = [
    'bank account password',
    'upi pin',
    'otp',
    'net banking password',
    'credit card details',
    'cvv',
    'aadhaar otp'
  ];

  const matchedCreds = credentialKeywords.filter((k) => lowerContent.includes(k));
  if (matchedCreds.length > 0) {
    redFlags.push(`Requests sensitive financial credentials or OTP (${matchedCreds.join(', ')})`);
    riskScore += 70;
  }

  // 3. Unrealistic Earnings / Immediate Selection
  if (
    /earn\s+(\$|rs\.?)\s?\d{3,}/i.test(lowerContent) ||
    /daily income|work from home typing|data entry rs|no interview required|instant selection letter/i.test(lowerContent)
  ) {
    redFlags.push('Promises unrealistic daily income or instant selection without formal technical interview');
    riskScore += 25;
  }

  // 4. Free Public Email Provider for Enterprise HR
  if (isPublicProvider && (company || isImpersonatingEnterprise)) {
    redFlags.push(
      `Recruiter email uses free public domain (@${senderDomain}) instead of official corporate domain for ${matchedEnterpriseName || company || 'enterprise'}`
    );
    riskScore += 35;
  }

  // 5. Telegram / WhatsApp Interview Redirection
  if (/telegram|wa\.me|whatsapp interview|chat interview/i.test(lowerContent)) {
    redFlags.push('Directs candidate to Telegram or WhatsApp for confidential interview or offer processing');
    riskScore += 20;
  }

  // 6. Positive Indicator: Verified Corporate Email Domain
  if (isVerifiedCorporateDomain) {
    positiveIndicators.push(`Sender email (@${senderDomain}) belongs to verified official corporate domain`);
    riskScore -= 35;
  }

  // 7. Positive Indicator: Official Corporate Career Portal Link
  if (url && /careers|jobs|corporate|workday|greenhouse|lever\.co/i.test(url)) {
    positiveIndicators.push('Includes link to official corporate career portal or ATS platform');
    riskScore -= 15;
  }

  // Normalize risk score between 0 and 100
  riskScore = Math.max(5, Math.min(100, riskScore));

  let verdict: 'LIKELY_LEGIT' | 'SUSPICIOUS' | 'LIKELY_JOB_SCAM' | 'UNABLE_TO_VERIFY' = 'SUSPICIOUS';
  let verdictEnglish = 'Suspicious Job Offer – Exercise Caution';
  let verdictTamil = 'சந்தேகத்திற்குரிய வேலை வாய்ப்பு - எச்சரிக்கையாக இருக்கவும்';
  let threatLevel: 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_SCAM' = 'SUSPICIOUS';

  if (riskScore >= 75) {
    verdict = 'LIKELY_JOB_SCAM';
    verdictEnglish = 'HIGH RISK: Likely Fraudulent Job Scam';
    verdictTamil = 'அதிக ஆபத்து: இது ஒரு வேலைவாய்ப்பு மோசடியாக இருக்கலாம்';
    threatLevel = 'CONFIRMED_SCAM';
  } else if (riskScore >= 40) {
    verdict = 'SUSPICIOUS';
    verdictEnglish = 'Elevated Risk – Suspicious Recruitment Pattern';
    verdictTamil = 'சந்தேகத்திற்குரிய வேலைவாய்ப்பு தொடர்பு';
    threatLevel = 'HIGH_RISK';
  } else {
    verdict = 'LIKELY_LEGIT';
    verdictEnglish = 'Likely Authentic Job Recruitment Email';
    verdictTamil = 'உண்மையான வேலைவாய்ப்பு அறிவிப்பு';
    threatLevel = 'SAFE';
  }

  const recommendedActions = [
    'NEVER pay any registration fee, security deposit, or laptop charge for job selection.',
    'Verify job vacancies directly on the employer’s official website (e.g. company.com/careers).',
    'Do not share bank OTPs, UPI PINs, or card CVVs under any pretext.',
    'If you paid money to a fake recruiter, call 1930 National Cyber Crime Helpline immediately.'
  ];

  return {
    verdict,
    verdictEnglish,
    verdictTamil,
    riskScore,
    threatLevel,
    scamCategory: actualFeeDemands.length > 0 ? 'Advance Recruitment Fee Scam' : matchedCreds.length > 0 ? 'Credential & OTP Harvesting Trap' : isPublicProvider ? 'HR Domain Impersonation' : 'Job Security Analysis',
    redFlags,
    positiveIndicators,
    recommendedActions,
    senderAnalysis: {
      senderEmail: sender,
      domain: senderDomain,
      isPublicEmailProvider: isPublicProvider,
      isImpersonatingEnterprise
    },
    helplineInfo: {
      cyberHelpline: '1930',
      reportingPortal: 'cybercrime.gov.in',
      note: 'Legitimate corporate employers will NEVER ask candidates for advance payments.'
    }
  };
}

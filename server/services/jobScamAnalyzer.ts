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
  const rawJobUrl = String(input.jobUrl || '').trim();

  // Extract URL from content if jobUrl parameter is empty
  let targetUrl = rawJobUrl;
  if (!targetUrl) {
    const urlMatch = content.match(/https?:\/\/[^\s<"']+/i);
    if (urlMatch) targetUrl = urlMatch[0];
  }

  const senderDomain = sender.includes('@') ? sender.split('@')[1] : '';
  const isPublicProvider = PUBLIC_EMAIL_PROVIDERS.includes(senderDomain);

  let isImpersonatingEnterprise = false;
  let matchedEnterprise: { name: string; domain: string } | null = null;

  const combinedSearchText = (content + ' ' + company + ' ' + sender).toLowerCase();
  for (const ent of KNOWN_ENTERPRISES) {
    if (combinedSearchText.includes(ent.name.toLowerCase())) {
      matchedEnterprise = ent;
      if (isPublicProvider || (senderDomain && !senderDomain.endsWith(ent.domain))) {
        isImpersonatingEnterprise = true;
      }
      break;
    }
  }

  const isVerifiedCorporateDomain = matchedEnterprise
    ? senderDomain === matchedEnterprise.domain || senderDomain.endsWith('.' + matchedEnterprise.domain)
    : KNOWN_ENTERPRISES.some((e) => senderDomain === e.domain || senderDomain.endsWith('.' + e.domain));

  const lowerContent = content.toLowerCase();
  const redFlags: string[] = [];
  const positiveIndicators: string[] = [];
  let riskScore = 10;

  // Empty / Insufficient Data Check
  if (content.length < 15 && !sender && !targetUrl) {
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
        'Include the sender email address (e.g. recruiter@company.com).'
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

  // ----------------------------------------------------
  // SIGNAL 1: ADVANCE RECRUITMENT / PAYMENT FEE DEMAND
  // ----------------------------------------------------
  const feeKeywords = [
    'background verification fee',
    'verification fee',
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
    'pay ₹',
    'pay $'
  ];

  let detectedFeePhrases: string[] = [];
  let isFeeNegated = false;

  for (const kw of feeKeywords) {
    const idx = lowerContent.indexOf(kw);
    if (idx !== -1) {
      const precedingText = lowerContent.substring(Math.max(0, idx - 45), idx);
      if (/never\s+charges?|does\s+not\s+charge|no\s+fee|free\s+of\s+cost|never\s+asks?|does\s+not\s+ask/i.test(precedingText)) {
        isFeeNegated = true;
      } else {
        detectedFeePhrases.push(kw);
      }
    }
  }

  const feeAmountMatch = lowerContent.match(/(?:rs\.?|₹|\$)\s?\d+(?:,\d+)*(?:\s*(?:fee|charge|deposit|payment|verification))/i) ||
                         lowerContent.match(/(?:background verification|registration|processing|laptop|training)\s+(?:fee|charge|deposit)?\s*(?:of|is)?\s*(?:rs\.?|₹|\$)\s?\d+(?:,\d+)*/i);

  if (detectedFeePhrases.length > 0 || feeAmountMatch) {
    const feeText = feeAmountMatch ? feeAmountMatch[0] : detectedFeePhrases.join(', ');
    redFlags.push(`Demands advance payment for recruitment (${feeText})`);
    riskScore += 35;
  } else if (isFeeNegated) {
    positiveIndicators.push('Explicitly clarifies that employer never demands recruitment/registration fees');
    riskScore -= 10;
  }

  // ----------------------------------------------------
  // SIGNAL 2: ENTERPRISE HR IMPERSONATION
  // ----------------------------------------------------
  if (isImpersonatingEnterprise && matchedEnterprise) {
    redFlags.push(`Enterprise HR Impersonation: Claims to represent ${matchedEnterprise.name} while communicating from an unauthorized email address (${sender || 'unverified domain'})`);
    riskScore += 30;
  }

  // ----------------------------------------------------
  // SIGNAL 3: FREE PUBLIC EMAIL PROVIDER FOR RECRUITMENT
  // ----------------------------------------------------
  if (isPublicProvider) {
    if (isImpersonatingEnterprise || detectedFeePhrases.length > 0 || feeAmountMatch || targetUrl) {
      redFlags.push(`Recruiter email uses a free public domain (@${senderDomain}) instead of official corporate domain`);
      riskScore += 15;
    } else {
      positiveIndicators.push(`Recruiter uses standard public email provider (@${senderDomain})`);
    }
  }

  // ----------------------------------------------------
  // SIGNAL 4: SUSPICIOUS / NON-OFFICIAL CAREER URL
  // ----------------------------------------------------
  if (targetUrl) {
    try {
      const parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
      const urlDomain = parsedUrl.hostname.toLowerCase();

      const expectedDomain = matchedEnterprise ? matchedEnterprise.domain : '';
      const isOfficialUrl = expectedDomain ? (urlDomain === expectedDomain || urlDomain.endsWith('.' + expectedDomain)) : false;

      const suspiciousTlds = ['.xyz', '.shop', '.top', '.click', '.site', '.info', '.work', '.club', '.online'];
      const hasSuspiciousTld = suspiciousTlds.some((tld) => urlDomain.endsWith(tld));

      if (matchedEnterprise && !isOfficialUrl) {
        redFlags.push(`Suspicious Job Link: Provided URL (${urlDomain}) does not belong to official ${matchedEnterprise.name} corporate domain (${matchedEnterprise.domain})`);
        riskScore += 25;
      } else if (hasSuspiciousTld) {
        redFlags.push(`Suspicious Job Domain: Provided link (${urlDomain}) uses a high-risk suspicious TLD`);
        riskScore += 20;
      } else if (isOfficialUrl || /careers|workday|greenhouse|lever\.co/i.test(urlDomain)) {
        positiveIndicators.push(`Job link (${urlDomain}) belongs to verified corporate/ATS portal`);
        riskScore -= 15;
      }
    } catch {
      redFlags.push(`Malformed or invalid job link URL: ${targetUrl}`);
      riskScore += 10;
    }
  }

  // ----------------------------------------------------
  // SIGNAL 5: HIGH-PRESSURE URGENCY LANGUAGE
  // ----------------------------------------------------
  const urgencyKeywords = [
    'urgent',
    'immediately',
    'within 2 hours',
    'within 24 hours',
    'offer expires today',
    'limited slots',
    'pay today',
    'action required immediately',
    'last chance'
  ];

  const matchedUrgency = urgencyKeywords.filter((u) => lowerContent.includes(u));
  if (matchedUrgency.length > 0) {
    redFlags.push(`Employs high-pressure urgency tactics requiring immediate response/payment (${matchedUrgency.join(', ')})`);
    riskScore += 15;
  }

  // ----------------------------------------------------
  // SIGNAL 6: CREDENTIAL & FINANCIAL INFORMATION THEFT
  // ----------------------------------------------------
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
    riskScore += 40;
  }

  // ----------------------------------------------------
  // SIGNAL 7: UNREALISTIC SALARY / NO-INTERVIEW OFFER
  // ----------------------------------------------------
  if (
    /earn\s+(\$|rs\.?|\u20B9)\s?\d{3,}/i.test(lowerContent) ||
    /daily income|work from home typing|data entry rs|no interview required|instant selection letter/i.test(lowerContent)
  ) {
    redFlags.push('Promises unrealistic income or instant selection letter without formal interview');
    riskScore += 20;
  }

  // ----------------------------------------------------
  // SIGNAL 8: TELEGRAM / WHATSAPP REDIRECTION
  // ----------------------------------------------------
  if (/telegram|wa\.me|whatsapp interview|chat interview/i.test(lowerContent)) {
    redFlags.push('Directs candidate to off-platform messaging apps (Telegram/WhatsApp) for confidential recruitment');
    riskScore += 20;
  }

  // ----------------------------------------------------
  // POSITIVE SIGNALS
  // ----------------------------------------------------
  if (isVerifiedCorporateDomain) {
    positiveIndicators.push(`Sender email (@${senderDomain}) belongs to official corporate domain`);
    riskScore -= 35;
  }

  // Normalize risk score between 5 and 100
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

  return {
    verdict,
    verdictEnglish,
    verdictTamil,
    riskScore,
    threatLevel,
    scamCategory: detectedFeePhrases.length > 0 || feeAmountMatch ? 'Advance Recruitment Fee Scam' : isImpersonatingEnterprise ? 'Enterprise HR Impersonation' : matchedCreds.length > 0 ? 'Credential Harvesting Trap' : 'Job Security Analysis',
    redFlags,
    positiveIndicators,
    recommendedActions: [
      'NEVER pay any registration fee, background verification charge, or security deposit for job selection.',
      'Verify job vacancies directly on the employer’s official careers website (e.g. company.com/careers).',
      'Do not share bank OTPs, UPI PINs, or card CVVs under any pretext.',
      'If you paid money to a fake recruiter, call 1930 National Cyber Crime Helpline immediately.'
    ],
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

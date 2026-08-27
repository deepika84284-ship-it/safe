import { RiskLevel, ConfidenceLevel, RiskSignal } from '../types';

export interface RawAnalysisSignals {
  domain: string;
  url: string;
  hasHttps: boolean;
  hasValidSsl: boolean;
  tld: string;
  domainLength: number;
  hyphenCount: number;
  numberCount: number;
  isTypoSquatted: boolean;
  impersonatedBrand?: string;
  domainAgeMonths?: number;
  hasPrivacyPolicy: boolean;
  hasRefundPolicy: boolean;
  hasTermsOfService: boolean;
  hasPhysicalAddress: boolean;
  hasPhoneOrEmailContact: boolean;
  hasSuspiciousPaymentInstructions: boolean; // e.g. "Wire transfer only", "Direct UPI / crypto only", "No card payment"
  hasExcessiveUrgency: boolean; // "Only 2 left! 90% off expires in 3 minutes!"
  hasBrokenSocialLinks: boolean;
  redirectCount: number;
  communityReportsCount: number;
  confirmedReportsCount: number;
  pendingReportsCount: number;
  disputeRate?: number;
  manualOverrideScore?: number;
  manualOverrideLevel?: RiskLevel;
  manualOverrideReason?: string;
}

export interface RiskScoreEvaluation {
  score: number;
  level: RiskLevel;
  confidence: ConfidenceLevel;
  signals: RiskSignal[];
  recommendations: string[];
  summaryNote: string;
}

export function calculateRiskScore(raw: RawAnalysisSignals): RiskScoreEvaluation {
  const signals: RiskSignal[] = [];
  let calculatedScore = 0;
  const recommendations: string[] = [];

  // If manual admin override is present, give weight to it while displaying signals
  if (raw.manualOverrideScore !== undefined && raw.manualOverrideScore >= 0) {
    calculatedScore = raw.manualOverrideScore;
  } else {
    // Base score start at 5
    let scoreAccumulator = 5;

    // 1. SSL & HTTPS Protocols
    if (!raw.hasHttps) {
      scoreAccumulator += 28;
      signals.push({
        id: 'no-https',
        category: 'SSL_SECURITY',
        title: 'Missing HTTPS Encryption',
        description: 'The website does not enforce secure HTTPS communication. Data entered on this site could be intercepted.',
        severity: 'HIGH',
        points: 28,
        detected: true,
        evidence: 'Connection is plain HTTP without transport security.'
      });
      recommendations.push('Do not enter any payment details, passwords, or personal identity on non-HTTPS websites.');
    } else if (!raw.hasValidSsl) {
      scoreAccumulator += 20;
      signals.push({
        id: 'invalid-ssl',
        category: 'SSL_SECURITY',
        title: 'Unverified or Self-Signed SSL Certificate',
        description: 'SSL certificate failed validation or is issued by an untrusted authority.',
        severity: 'HIGH',
        points: 20,
        detected: true,
        evidence: 'Certificate validation returned an error.'
      });
    } else {
      signals.push({
        id: 'valid-https',
        category: 'SSL_SECURITY',
        title: 'Valid HTTPS & SSL Security',
        description: 'Website uses authenticated TLS/SSL encryption for data in transit.',
        severity: 'SAFE',
        points: 0,
        detected: false,
        evidence: 'Valid trusted SSL certificate active.'
      });
    }

    // 2. Domain Name Signals & TypoSquatting
    if (raw.isTypoSquatted && raw.impersonatedBrand) {
      scoreAccumulator += 35;
      signals.push({
        id: 'typosquat-brand',
        category: 'DOMAIN_INTEGRITY',
        title: `Possible Brand Impersonation (${raw.impersonatedBrand})`,
        description: `The domain name strongly resembles popular trademark "${raw.impersonatedBrand}" with deceptive character substitutions or added suffixes.`,
        severity: 'CRITICAL',
        points: 35,
        detected: true,
        evidence: `Matches lookalike pattern targeting ${raw.impersonatedBrand}.`
      });
      recommendations.push(`Verify that you are visiting the authentic official website for ${raw.impersonatedBrand}, not a cloned mimic.`);
    }

    // Suspicious TLD / High-risk free domains
    const highRiskTlds = ['.top', '.xyz', '.shop', '.click', '.buzz', '.loan', '.work', '.rest', '.cfd', '.sbs'];
    if (highRiskTlds.includes(raw.tld.toLowerCase())) {
      scoreAccumulator += 12;
      signals.push({
        id: 'high-risk-tld',
        category: 'DOMAIN_INTEGRITY',
        title: `Disposable or High-Risk TLD Extension (${raw.tld})`,
        description: `The domain uses an extension frequently associated with short-lived disposable shopping websites and spam operations.`,
        severity: 'MEDIUM',
        points: 12,
        detected: true,
        evidence: `Extension ${raw.tld} registered.`
      });
    }

    // Hyphen / Numeric spam in domain
    if (raw.hyphenCount >= 3 || raw.numberCount >= 4) {
      scoreAccumulator += 10;
      signals.push({
        id: 'suspicious-domain-structure',
        category: 'DOMAIN_INTEGRITY',
        title: 'Deceptive Domain Structure',
        description: 'Excessive hyphens or numeric strings in the domain are commonly observed in programmatic scam campaigns.',
        severity: 'MEDIUM',
        points: 10,
        detected: true,
        evidence: `Found ${raw.hyphenCount} hyphens and ${raw.numberCount} digits in domain name.`
      });
    }

    // Domain Age
    if (raw.domainAgeMonths !== undefined) {
      if (raw.domainAgeMonths < 3) {
        scoreAccumulator += 20;
        signals.push({
          id: 'newly-registered-domain',
          category: 'DOMAIN_INTEGRITY',
          title: 'Newly Registered Domain (< 90 Days)',
          description: 'This domain was created very recently. A high percentage of e-commerce fraud originates from freshly minted domains.',
          severity: 'HIGH',
          points: 20,
          detected: true,
          evidence: `Estimated age: ~${raw.domainAgeMonths} month(s).`
        });
        recommendations.push('Exercise elevated caution with new domains with no established business track record.');
      } else if (raw.domainAgeMonths > 24) {
        scoreAccumulator -= 10;
        signals.push({
          id: 'established-domain-age',
          category: 'DOMAIN_INTEGRITY',
          title: 'Established Domain History',
          description: 'The domain has been active and maintained for over 2 years.',
          severity: 'SAFE',
          points: -10,
          detected: false,
          evidence: `Estimated age: ~${Math.floor(raw.domainAgeMonths / 12)} years.`
        });
      }
    }

    // 3. Website Policies Transparency
    if (!raw.hasRefundPolicy) {
      scoreAccumulator += 14;
      signals.push({
        id: 'missing-refund-policy',
        category: 'POLICY_TRANSPARENCY',
        title: 'Missing or Obscured Refund Policy',
        description: 'No clear return, cancellation, or refund policy could be located on standard policy routes.',
        severity: 'HIGH',
        points: 14,
        detected: true,
        evidence: 'Refund / Return Policy page was absent or unreachable.'
      });
      recommendations.push('Do not order without knowing the exact cancellation and return terms.');
    } else {
      signals.push({
        id: 'has-refund-policy',
        category: 'POLICY_TRANSPARENCY',
        title: 'Transparent Refund Policy Available',
        description: 'Website publishes clear guidelines regarding returns, order cancellations, and refunds.',
        severity: 'SAFE',
        points: 0,
        detected: false,
        evidence: 'Refund policy found.'
      });
    }

    if (!raw.hasPrivacyPolicy || !raw.hasTermsOfService) {
      scoreAccumulator += 8;
      signals.push({
        id: 'missing-terms-privacy',
        category: 'POLICY_TRANSPARENCY',
        title: 'Incomplete Legal Disclosures',
        description: 'Privacy policy or terms of service documentation is incomplete or missing.',
        severity: 'LOW',
        points: 8,
        detected: true,
        evidence: 'Legal disclosures missing or incomplete.'
      });
    }

    // 4. Contact and Business Identity
    if (!raw.hasPhoneOrEmailContact && !raw.hasPhysicalAddress) {
      scoreAccumulator += 18;
      signals.push({
        id: 'unreachable-merchant',
        category: 'POLICY_TRANSPARENCY',
        title: 'Unverified Merchant Identity & Contact Details',
        description: 'No direct customer service email, verified phone number, or registered physical business location could be detected.',
        severity: 'HIGH',
        points: 18,
        detected: true,
        evidence: 'No verifiable contact channels found.'
      });
      recommendations.push('Attempt to contact customer support before placing an order to verify responsiveness.');
    }

    // 5. Payment Method & Checkout Red Flags
    if (raw.hasSuspiciousPaymentInstructions) {
      scoreAccumulator += 26;
      signals.push({
        id: 'suspicious-payment-methods',
        category: 'PAYMENT_RISK',
        title: 'High-Risk Payment Instructions Detected',
        description: 'Website prompts for direct bank transfer, untraceable gift cards, or unverified advance payment without escrow/buyer protection.',
        severity: 'CRITICAL',
        points: 26,
        detected: true,
        evidence: 'Unprotected or peer-to-peer payment instructions detected.'
      });
      recommendations.push('Never send money via direct peer-to-peer wire transfers or unverified QR codes to unknown merchants.');
    } else {
      signals.push({
        id: 'standard-checkout',
        category: 'PAYMENT_RISK',
        title: 'Standard Payment Gateway Integration',
        description: 'Site routes checkouts through standard encrypted payment flows supporting consumer dispute rights.',
        severity: 'SAFE',
        points: 0,
        detected: false,
        evidence: 'Standard payment gateway integration identified.'
      });
    }

    // 6. Content & Deceptive Urgency Heuristics
    if (raw.hasExcessiveUrgency) {
      scoreAccumulator += 12;
      signals.push({
        id: 'fake-urgency-triggers',
        category: 'CONTENT_HEURISTICS',
        title: 'Artificial Scarcity & Fake Urgency Timers',
        description: 'Site deploys aggressive countdowns and extreme discounts (e.g. 90% off) designed to induce impulsive buying without due diligence.',
        severity: 'MEDIUM',
        points: 12,
        detected: true,
        evidence: 'Pressure tactics and abnormal discounting patterns detected.'
      });
      recommendations.push('Be cautious of "limited time 90% clearance" promotions from unverified sellers on social media.');
    }

    // 7. Community Reports & Feedback History
    if (raw.confirmedReportsCount > 0) {
      const penalty = Math.min(30, raw.confirmedReportsCount * 12);
      scoreAccumulator += penalty;
      signals.push({
        id: 'confirmed-community-reports',
        category: 'COMMUNITY_SIGNALS',
        title: `${raw.confirmedReportsCount} Verified Scam/Fraud Community Report(s)`,
        description: 'Multiple independent shoppers have filed verified dispute reports regarding undelivered items, counterfeit goods, or unauthorized charges.',
        severity: 'CRITICAL',
        points: penalty,
        detected: true,
        evidence: `${raw.confirmedReportsCount} confirmed reports on file.`
      });
      recommendations.push('Review specific user reports below regarding delivery and non-responsive seller claims.');
    } else if (raw.pendingReportsCount > 0) {
      const penalty = Math.min(15, raw.pendingReportsCount * 4);
      scoreAccumulator += penalty;
      signals.push({
        id: 'pending-community-reports',
        category: 'COMMUNITY_SIGNALS',
        title: `${raw.pendingReportsCount} Recent Community Report(s) Under Review`,
        description: 'Shoppers have recently reported disputes with this merchant that are currently undergoing staff moderation.',
        severity: 'MEDIUM',
        points: penalty,
        detected: true,
        evidence: `${raw.pendingReportsCount} community report(s) under review.`
      });
    } else {
      signals.push({
        id: 'clean-community-history',
        category: 'COMMUNITY_SIGNALS',
        title: 'No Negative Community Reports',
        description: 'No complaints or dispute reports currently logged against this merchant.',
        severity: 'SAFE',
        points: 0,
        detected: false,
        evidence: '0 negative reports.'
      });
    }

    // 8. Redirects
    if (raw.redirectCount > 3) {
      scoreAccumulator += 10;
      signals.push({
        id: 'excessive-redirects',
        category: 'DOMAIN_INTEGRITY',
        title: 'Excessive Network Redirects',
        description: 'The requested URL underwent multiple redirects across differing subdomains or destinations.',
        severity: 'MEDIUM',
        points: 10,
        detected: true,
        evidence: `${raw.redirectCount} redirects observed.`
      });
    }

    // Clamp score between 0 and 100
    calculatedScore = Math.max(0, Math.min(100, Math.round(scoreAccumulator)));
  }

  // Determine Risk Level according to specifications:
  // 0 - 29: LOW RISK
  // 30 - 59: MEDIUM RISK
  // 60 - 79: HIGH RISK
  // 80 - 100: VERY HIGH RISK
  let level: RiskLevel = 'LOW';
  if (calculatedScore >= 80) {
    level = 'VERY HIGH';
  } else if (calculatedScore >= 60) {
    level = 'HIGH';
  } else if (calculatedScore >= 30) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  // Determine Confidence
  let confidence: ConfidenceLevel = 'HIGH';
  if (raw.domainAgeMonths === undefined && raw.redirectCount === 0) {
    confidence = 'MEDIUM';
  }
  if (signals.length < 4) {
    confidence = 'LOW';
  }

  // Fallback recommendation if empty
  if (recommendations.length === 0) {
    if (level === 'LOW') {
      recommendations.push('Standard safe online shopping precautions apply. Keep track of order confirmations and receipts.');
    } else {
      recommendations.push('Review seller terms carefully and use a protected payment method that provides buyer fraud resolution.');
    }
  }

  // Generate concise summary note
  let summaryNote = '';
  if (level === 'LOW') {
    summaryNote = 'This website exhibits standard security characteristics, clear merchant disclosures, and no confirmed scam reports.';
  } else if (level === 'MEDIUM') {
    summaryNote = 'Some risk factors or incomplete business disclosures were identified. Exercise caution before placing large orders.';
  } else if (level === 'HIGH') {
    summaryNote = 'Multiple high-risk indicators detected. Do not make an advance payment until you independently verify the seller.';
  } else {
    summaryNote = 'Severe risk signals identified. High likelihood of deceptive practices, brand impersonation, or unfulfilled orders.';
  }

  return {
    score: calculatedScore,
    level,
    confidence,
    signals,
    recommendations,
    summaryNote
  };
}

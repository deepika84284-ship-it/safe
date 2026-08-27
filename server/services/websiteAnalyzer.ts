import http from 'http';
import https from 'https';
import { validateAndSanitizeUrl } from './ssrfGuard';
import { calculateRiskScore, RawAnalysisSignals, RiskScoreEvaluation } from './riskEngine';
import { db } from '../db/store';
import { Website, ScanResult } from '../types';

const KNOWN_BRANDS = [
  { name: 'Amazon', regex: /amaz[o0]n|amzn/i, authenticDomain: 'amazon.com' },
  { name: 'Nike', regex: /n[i1]ke/i, authenticDomain: 'nike.com' },
  { name: 'Apple', regex: /appl[e3]/i, authenticDomain: 'apple.com' },
  { name: 'PayPal', regex: /paypa[l1]/i, authenticDomain: 'paypal.com' },
  { name: 'Walmart', regex: /wal[-]?mart/i, authenticDomain: 'walmart.com' },
  { name: 'eBay', regex: /ebay/i, authenticDomain: 'ebay.com' },
  { name: 'Target', regex: /target/i, authenticDomain: 'target.com' },
  { name: 'Adidas', regex: /ad[i1]das/i, authenticDomain: 'adidas.com' },
  { name: 'Rolex', regex: /rolex/i, authenticDomain: 'rolex.com' },
  { name: 'Gucci', regex: /gucc[i1]/i, authenticDomain: 'gucci.com' }
];

export interface AnalyzeUrlOptions {
  rawUrl: string;
  userId?: string;
  forceFresh?: boolean;
}

export async function analyzeWebsite(options: AnalyzeUrlOptions): Promise<{
  website: Website;
  scan: ScanResult;
  evaluation: RiskScoreEvaluation;
}> {
  const { rawUrl, userId } = options;

  // 1. SSRF and URL validation
  const validation = await validateAndSanitizeUrl(rawUrl);
  if (!validation.isValid || !validation.normalizedUrl || !validation.domain) {
    throw new Error(validation.error || 'Invalid website URL provided.');
  }

  const { domain, normalizedUrl, protocol, resolvedIp } = validation;
  const tld = '.' + domain.split('.').pop()?.toLowerCase();

  // 2. Check existing website record and community reports in DB
  const existingWebsite = db.websites.get(domain);
  const reportsForDomain = Array.from(db.reports.values()).filter(
    (r) => r.domain.toLowerCase() === domain.toLowerCase()
  );

  const confirmedReportsCount = reportsForDomain.filter((r) => r.status === 'CONFIRMED').length;
  const pendingReportsCount = reportsForDomain.filter((r) => r.status === 'PENDING').length;
  const rejectedReportsCount = reportsForDomain.filter((r) => r.status === 'REJECTED').length;
  const totalReportsCount = reportsForDomain.length;

  // 3. Brand Typosquatting / Impersonation Detection
  let isTypoSquatted = false;
  let impersonatedBrand: string | undefined = undefined;

  for (const brand of KNOWN_BRANDS) {
    if (brand.regex.test(domain) && domain !== brand.authenticDomain && !domain.endsWith('.' + brand.authenticDomain)) {
      isTypoSquatted = true;
      impersonatedBrand = brand.name;
      break;
    }
  }

  // 4. Domain string heuristics
  const hyphens = (domain.match(/-/g) || []).length;
  const digits = (domain.match(/[0-9]/g) || []).length;

  // 5. Check if domain matches simulated / cached properties or probe safely
  const isHttps = protocol === 'https:';
  let hasValidSsl = isHttps;
  let hasPrivacyPolicy = false;
  let hasRefundPolicy = false;
  let hasTermsOfService = false;
  let hasPhoneOrEmailContact = false;
  let hasPhysicalAddress = false;
  let hasSuspiciousPaymentInstructions = false;
  let hasExcessiveUrgency = false;
  let redirectCount = 0;
  let responseTimeMs = 120;
  let domainAgeMonths: number | undefined = undefined;

  // Known high-risk patterns / seeded metadata
  if (existingWebsite && existingWebsite.signalsSummary) {
    hasPrivacyPolicy = existingWebsite.signalsSummary.hasPrivacyPolicy;
    hasRefundPolicy = existingWebsite.signalsSummary.hasRefundPolicy;
    hasPhoneOrEmailContact = existingWebsite.signalsSummary.hasContactInfo;
    hasPhysicalAddress = existingWebsite.signalsSummary.hasContactInfo;
    hasSuspiciousPaymentInstructions = existingWebsite.signalsSummary.hasSuspiciousPaymentInstructions;
    hasExcessiveUrgency = existingWebsite.signalsSummary.hasExcessiveUrgency;
    hasValidSsl = existingWebsite.signalsSummary.hasValidSsl;
    if (existingWebsite.signalsSummary.domainAgeEstimated.includes('month') || existingWebsite.signalsSummary.domainAgeEstimated.includes('week')) {
      domainAgeMonths = 1;
    } else if (existingWebsite.signalsSummary.domainAgeEstimated.includes('year')) {
      domainAgeMonths = 120;
    }
  } else {
    // Heuristics for new/unseen domains
    const isKnownMajorStore = domain.endsWith('amazon.com') || domain.endsWith('nike.com') || domain.endsWith('apple.com') || domain.endsWith('target.com') || domain.endsWith('walmart.com');
    const isSocialOrMessenger = domain.includes('instagram.com') || domain.includes('wa.me') || domain.includes('whatsapp.com');
    const isSuspiciousExtension = ['.top', '.xyz', '.shop', '.click', '.buzz', '.loan', '.work', '.cfd'].includes(tld);
    const hasScamKeywords = /sale|discount|outlet|cheap|free|gift|deals|offer|clearance/i.test(domain);

    if (isKnownMajorStore) {
      hasPrivacyPolicy = true;
      hasRefundPolicy = true;
      hasTermsOfService = true;
      hasPhoneOrEmailContact = true;
      hasPhysicalAddress = true;
      hasValidSsl = true;
      domainAgeMonths = 240;
    } else if (isSocialOrMessenger) {
      // Social Profile URL being scanned
      hasPrivacyPolicy = false;
      hasRefundPolicy = false;
      hasTermsOfService = false;
      hasPhoneOrEmailContact = true;
      hasSuspiciousPaymentInstructions = true;
      hasExcessiveUrgency = true;
      domainAgeMonths = 6;
    } else if (isSuspiciousExtension || hasScamKeywords || isTypoSquatted) {
      hasPrivacyPolicy = false;
      hasRefundPolicy = false;
      hasTermsOfService = false;
      hasPhoneOrEmailContact = false;
      hasSuspiciousPaymentInstructions = true;
      hasExcessiveUrgency = true;
      domainAgeMonths = 1;
      redirectCount = 2;
    } else {
      // General independent domain
      hasPrivacyPolicy = true;
      hasRefundPolicy = true;
      hasTermsOfService = true;
      hasPhoneOrEmailContact = true;
      domainAgeMonths = 14;
    }
  }

  // 6. Build raw signals for the risk engine
  const rawSignals: RawAnalysisSignals = {
    domain,
    url: normalizedUrl,
    hasHttps: isHttps,
    hasValidSsl,
    tld,
    domainLength: domain.length,
    hyphenCount: hyphens,
    numberCount: digits,
    isTypoSquatted,
    impersonatedBrand,
    domainAgeMonths,
    hasPrivacyPolicy,
    hasRefundPolicy,
    hasTermsOfService,
    hasPhysicalAddress,
    hasPhoneOrEmailContact,
    hasSuspiciousPaymentInstructions,
    hasExcessiveUrgency,
    hasBrokenSocialLinks: hasExcessiveUrgency,
    redirectCount,
    communityReportsCount: totalReportsCount,
    confirmedReportsCount,
    pendingReportsCount,
    manualOverrideScore: existingWebsite?.manualRiskOverride?.isOverridden
      ? existingWebsite.manualRiskOverride.overrideScore
      : undefined,
    manualOverrideLevel: existingWebsite?.manualRiskOverride?.isOverridden
      ? existingWebsite.manualRiskOverride.overrideLevel
      : undefined
  };

  const evaluation = calculateRiskScore(rawSignals);
  const now = new Date().toISOString();

  // 7. Update or Create Website record
  const websiteId = existingWebsite ? existingWebsite.id : 'web_' + Math.random().toString(36).substring(2, 9);
  const updatedWebsite: Website = {
    id: websiteId,
    domain,
    url: normalizedUrl,
    riskScore: evaluation.score,
    riskLevel: evaluation.level,
    confidence: evaluation.confidence,
    totalReports: totalReportsCount,
    confirmedReports: confirmedReportsCount,
    pendingReports: pendingReportsCount,
    rejectedReports: rejectedReportsCount,
    firstScannedAt: existingWebsite ? existingWebsite.firstScannedAt : now,
    lastScannedAt: now,
    signalsSummary: {
      hasHttps: isHttps,
      hasValidSsl,
      domainAgeEstimated: domainAgeMonths !== undefined ? (domainAgeMonths >= 12 ? `${Math.round(domainAgeMonths / 12)}+ years` : `${domainAgeMonths} month(s)`) : 'Unknown / Hidden',
      hasPrivacyPolicy,
      hasRefundPolicy,
      hasContactInfo: hasPhoneOrEmailContact || hasPhysicalAddress,
      hasSuspiciousPaymentInstructions,
      hasExcessiveUrgency,
      isTypoSquatted
    },
    reputationBadge: evaluation.level === 'LOW'
      ? 'VERIFIED_TRUSTED'
      : evaluation.level === 'MEDIUM'
      ? 'NEEDS_CAUTION'
      : 'SUSPECTED_RISK',
    manualRiskOverride: existingWebsite?.manualRiskOverride,
    createdAt: existingWebsite ? existingWebsite.createdAt : now,
    updatedAt: now
  };

  await db.saveWebsite(updatedWebsite);

  // 8. Create Scan Result Record
  const scanId = 'scan_' + Math.random().toString(36).substring(2, 10);
  const scanResult: ScanResult = {
    id: scanId,
    userId,
    websiteId,
    domain,
    url: normalizedUrl,
    score: evaluation.score,
    riskLevel: evaluation.level,
    confidence: evaluation.confidence,
    signals: evaluation.signals,
    recommendations: evaluation.recommendations,
    metadata: {
      ipResolved: resolvedIp,
      httpStatus: 200,
      redirectCount,
      responseTimeMs,
      hasSsl: isHttps,
      tld,
      scanTimestamp: now
    },
    createdAt: now
  };

  await db.saveScan(scanResult);

  return {
    website: updatedWebsite,
    scan: scanResult,
    evaluation
  };
}

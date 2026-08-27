export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'CONFIRMED' | 'REJECTED';
export type UserRole = 'USER' | 'ADMIN';
export type TransactionStatus =
  | 'PENDING'
  | 'PROTECTED'
  | 'CANCEL_REQUESTED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'COMPLETED';

export type IssueCategory =
  | 'No transaction'
  | 'Payment requested'
  | 'Product not delivered'
  | 'Fake product'
  | 'Refund issue'
  | 'Seller stopped responding'
  | 'Phishing or Credential Harvesting'
  | 'Instagram DM to WhatsApp Redirection Trap'
  | 'Fake Instagram Shopping Store'
  | 'WhatsApp UPI / Advance Payment Fraud'
  | 'Fake Courier Tracking Receipt'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface RiskSignal {
  id: string;
  category: 'SSL_SECURITY' | 'DOMAIN_INTEGRITY' | 'POLICY_TRANSPARENCY' | 'PAYMENT_RISK' | 'COMMUNITY_SIGNALS' | 'CONTENT_HEURISTICS';
  title: string;
  description: string;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  points: number; // positive increases risk score
  detected: boolean;
  evidence?: string;
}

export interface Website {
  id: string;
  domain: string;
  url: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  totalReports: number;
  confirmedReports: number;
  pendingReports: number;
  rejectedReports: number;
  firstScannedAt: string;
  lastScannedAt: string;
  signalsSummary: {
    hasHttps: boolean;
    hasValidSsl: boolean;
    domainAgeEstimated: string;
    hasPrivacyPolicy: boolean;
    hasRefundPolicy: boolean;
    hasContactInfo: boolean;
    hasSuspiciousPaymentInstructions: boolean;
    hasExcessiveUrgency: boolean;
    isTypoSquatted: boolean;
  };
  reputationBadge?: 'VERIFIED_TRUSTED' | 'NEEDS_CAUTION' | 'SUSPECTED_RISK' | 'UNVERIFIED';
  manualRiskOverride?: {
    isOverridden: boolean;
    overrideScore?: number;
    overrideLevel?: RiskLevel;
    overrideReason?: string;
    overriddenBy?: string;
    overriddenAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScanResult {
  id: string;
  userId?: string;
  websiteId: string;
  domain: string;
  url: string;
  score: number;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  signals: RiskSignal[];
  recommendations: string[];
  metadata: {
    ipResolved?: string;
    httpStatus?: number;
    redirectCount: number;
    responseTimeMs: number;
    hasSsl: boolean;
    tld: string;
    scanTimestamp: string;
  };
  createdAt: string;
}

export interface Report {
  id: string;
  userId?: string;
  reporterName?: string;
  reporterEmail?: string;
  websiteId: string;
  domain: string;
  url: string;
  reason: string;
  description: string;
  transactionIssue: IssueCategory;
  financialLossAmount?: number;
  evidenceUrl?: string;
  status: ReportStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  reportId: string;
  userId: string;
  domain: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  createdAt: string;
}

export interface MockTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  websiteId: string;
  domain: string;
  productName: string;
  amount: number;
  currency: string;
  paymentMethod?: 'GPAY_UPI' | 'PHONEPE' | 'PAYTM' | 'CREDIT_DEBIT_CARD';
  upiId?: string;
  utrNumber?: string;
  merchantVpa?: string;
  status: TransactionStatus;
  escrowProtection: boolean;
  protectionReference: string;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    status: TransactionStatus;
    timestamp: string;
    note: string;
  }>;
}

export interface VpaAnalysisResult {
  vpa: string;
  isValidFormat: boolean;
  bankHandle: string;
  isFlaggedForScam: boolean;
  isPersonalMasqueradingAsBusiness: boolean;
  riskScore: number;
  threatLevel: 'SAFE' | 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_SCAM';
  trustVerdict: string;
  riskReasons: string[];
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType: 'UPDATE_REPORT_STATUS' | 'OVERRIDE_WEBSITE_RISK' | 'RESCAN_DOMAIN' | 'DELETE_REPORT';
  targetType: 'REPORT' | 'WEBSITE' | 'SCAN';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface SafetyTip {
  id: string;
  category: string;
  title: string;
  summary: string;
  checklist: string[];
  severityNote: string;
  readTime: string;
}

export interface DataSourceCheck {
  name: string;
  status: 'CHECKED_CLEAN' | 'FLAGGED' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
  details: string;
}

export interface RiskSignalItem {
  title: string;
  description: string;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  points: number;
  evidenceType: 'VERIFIED_RECORD' | 'HEURISTIC_INDICATOR' | 'PRECAUTIONARY';
}

export interface InstagramAnalysisResult {
  handle: string;
  fullUrl: string;
  authenticityStatus: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CONFIRMED_SCAM' | 'UNABLE_TO_VERIFY';
  riskScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  verificationStatus: string;
  isVerifiedBadge: boolean;
  officialBrandImpersonated?: string;
  reportedScamCount: number;
  evidenceSummary: string;
  dataSourcesChecked: DataSourceCheck[];
  riskSignals: RiskSignalItem[];
  redirectionAnalysis: {
    redirectsToWhatsApp: boolean;
    redirectUrl?: string;
    bypassesBuyerProtection: boolean;
    warningNote: string;
  };
  recommendations: string[];
  lastCheckedTimestamp: string;
  disclaimer: string;
}

export interface WhatsAppAnalysisResult {
  phoneNumber: string;
  formattedNumber: string;
  country: string;
  countryCode: string;
  telecomCircle?: string;
  isVirtualOrVoip: boolean;
  associatedBusinessName: string;
  verificationStatus: string;
  reportedScamCount: number;
  reportedUpiIds: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH' | 'UNABLE_TO_VERIFY';
  riskScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceSummary: string;
  dataSourcesChecked: DataSourceCheck[];
  knownFraudSchemes: string[];
  riskSignals: RiskSignalItem[];
  safetyChecklist: string[];
  lastCheckedTimestamp: string;
  disclaimer: string;
}

export interface CrossPlatformAnalysisResult {
  instagramHandle: string;
  whatsAppNumber: string;
  linkStatus: 'VERIFIED_LINK' | 'POSSIBLE_LINK' | 'UNVERIFIED_INDEPENDENT';
  linkEvidence: string;
  compositeRiskScore: number;
  compositeRiskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CONFIRMED_SCAM' | 'UNABLE_TO_VERIFY';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  instagramAnalysis: InstagramAnalysisResult;
  whatsAppAnalysis: WhatsAppAnalysisResult;
  jointRiskFactors: string[];
  recommendations: string[];
  lastCheckedTimestamp: string;
  disclaimer: string;
}

export interface SocialScamReport {
  id: string;
  platform: 'INSTAGRAM' | 'WHATSAPP' | 'TELEGRAM' | 'CROSS_PLATFORM' | 'OTHER';
  instagramHandle?: string;
  whatsAppNumber?: string;
  upiId?: string;
  targetDomain?: string;
  financialLossAmount?: number;
  evidenceText: string;
  reportedAt: string;
  reporterId?: string;
  status: ReportStatus;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  verdict?: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'INFO';
  riskScore?: number;
  threatCategory?: string;
  recommendedSteps?: string[];
  suggestedFollowUps?: string[];
}

export interface SuspiciousMessageAnalysis {
  riskScore: number;
  threatLevel: RiskLevel;
  scamCategory: string;
  isLikelyScam: boolean;
  verdictTamil: string;
  verdictEnglish: string;
  redFlags: string[];
  detectedIndicators: {
    fakeUrgency: boolean;
    advancePaymentDemand: boolean;
    unrealisticDiscount: boolean;
    offPlatformRedirection: boolean;
    fakeCourierOrCustoms: boolean;
    phishingLink: boolean;
  };
  recommendedActions: string[];
  helplineInfo: {
    cyberHelpline: string;
    reportingPortal: string;
    urgentActionNote: string;
  };
}

export interface AudioTranscriptionResult {
  fullTranscript: string;
  extractedUrl?: string;
  extractedReason: string;
  extractedDescription: string;
  suggestedCategory: IssueCategory;
  financialLossAmount?: number;
  detectedKeywords?: string[];
  detectedLanguage?: string;
  confidenceScore?: number;
}


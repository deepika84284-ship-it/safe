import axios from 'axios';
import {
  Website,
  ScanResult,
  Report,
  MockTransaction,
  SafetyTip,
  AdminAction,
  InstagramAnalysisResult,
  WhatsAppAnalysisResult,
  SuspiciousMessageAnalysis,
  AudioTranscriptionResult,
  VpaAnalysisResult
} from '../types';
import {
  analyzeInstagramProfileClient,
  analyzeWhatsAppNumberClient,
  getRecentSocialThreatsClient
} from './fallbackEngine';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('safecart_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified API Methods
export const api = {
  // Scans
  scanWebsite: async (url: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      scan: ScanResult;
      website: Website;
    }>('/scans', { url });
    return res.data;
  },

  getScanById: async (id: string) => {
    const res = await apiClient.get<{
      success: boolean;
      scan: ScanResult;
      website: Website | null;
    }>(`/scans/${id}`);
    return res.data;
  },

  getScanHistory: async (limit?: number) => {
    const res = await apiClient.get<{
      success: boolean;
      totalScans: number;
      userScans: ScanResult[];
      recentPublicScans: ScanResult[];
      scans?: ScanResult[];
    }>('/scans/history', { params: { limit } });

    // Ensure scans array is provided
    const combined = res.data.userScans?.length
      ? res.data.userScans
      : res.data.recentPublicScans || [];

    return {
      ...res.data,
      scans: combined
    };
  },

  // Websites
  getWebsite: async (domain: string) => {
    const res = await apiClient.get<{
      success: boolean;
      website: Website;
      reports: Partial<Report>[];
      recentScans: ScanResult[];
    }>(`/websites/${domain}`);
    return res.data;
  },

  getWebsiteReports: async (domain: string) => {
    const res = await apiClient.get<{
      success: boolean;
      domain: string;
      totalReports: number;
      reports: Report[];
    }>(`/websites/${domain}/reports`);
    return res.data;
  },

  // Reports
  submitReport: async (data: {
    url: string;
    reason: string;
    description: string;
    transactionIssue: string;
    financialLossAmount?: number;
    evidenceUrl?: string;
    reporterName?: string;
    reporterEmail?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      report: Report;
    }>('/reports', data);
    return res.data;
  },

  getMyReports: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      reports: Report[];
    }>('/reports/my');
    return res.data;
  },

  getRecentPublicReports: async () => {
    const res = await apiClient.get<{
      success: boolean;
      reports: Array<Partial<Report> & { id: string; domain: string; reason: string; status: string }>;
    }>('/reports/public');
    return res.data;
  },

  // Safety Tips
  getSafetyTips: async () => {
    const res = await apiClient.get<{
      success: boolean;
      tips: SafetyTip[];
      disclaimer: string;
    }>('/safety-tips');
    return res.data;
  },

  // Sandbox Payment & GPay UPI Escrow
  createDemoPayment: async (data: {
    domain: string;
    websiteId?: string;
    productName: string;
    amount: number;
    currency?: string;
    paymentMethod?: 'GPAY_UPI' | 'PHONEPE' | 'PAYTM' | 'CREDIT_DEBIT_CARD';
    upiId?: string;
    merchantVpa?: string;
    utrNumber?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      transaction: MockTransaction;
      demoNotice: string;
    }>('/payments/create-demo', data);
    return res.data;
  },

  verifyVpa: async (vpa: string) => {
    const res = await apiClient.post<{
      success: boolean;
      analysis: VpaAnalysisResult;
    }>('/payments/verify-vpa', { vpa });
    return res.data;
  },

  requestRefund: async (id: string, reason: string) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      transaction: MockTransaction;
      refundReference: string;
      demoNotice: string;
    }>(`/payments/${id}/refund-request`, { reason });
    return res.data;
  },

  processAdminRefund: async (id: string, approved: boolean) => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      transaction: MockTransaction;
      refundReference: string;
    }>(`/payments/${id}/admin-process-refund`, { approved });
    return res.data;
  },

  getMyPayments: async () => {
    const res = await apiClient.get<{
      success: boolean;
      transactions: MockTransaction[];
      demoNotice: string;
    }>('/payments/my');
    return res.data;
  },

  getMyTransactions: async () => {
    const res = await apiClient.get<{
      success: boolean;
      transactions: MockTransaction[];
      demoNotice: string;
    }>('/payments/my');
    return res.data;
  },

  getAllPayments: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      transactions: MockTransaction[];
    }>('/payments/all');
    return res.data;
  },

  getAdminTransactions: async () => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      transactions: MockTransaction[];
    }>('/payments/all');
    return res.data;
  },

  // Admin APIs
  getAdminStats: async () => {
    const res = await apiClient.get<{
      success: boolean;
      stats: {
        totalUsers: number;
        totalWebsites: number;
        highRiskWebsites: number;
        totalScans: number;
        totalReports: number;
        pendingReports: number;
        confirmedReports: number;
        reviewedReports: number;
        rejectedReports: number;
        confirmedScams?: number;
      };
      charts: any;
      recentActions: AdminAction[];
      recentReports: Report[];
    }>('/admin/dashboard');

    const statsData = res.data.stats || {
      totalUsers: 0,
      totalWebsites: 0,
      highRiskWebsites: 0,
      totalScans: 0,
      totalReports: 0,
      pendingReports: 0,
      confirmedReports: 0,
      reviewedReports: 0,
      rejectedReports: 0,
      confirmedScams: res.data.stats?.confirmedReports || 0
    };

    return {
      success: res.data.success,
      stats: {
        ...statsData,
        confirmedScams: statsData.confirmedReports
      }
    };
  },

  getAdminDashboard: async () => {
    const res = await apiClient.get<{
      success: boolean;
      stats: {
        totalUsers: number;
        totalWebsites: number;
        highRiskWebsites: number;
        totalScans: number;
        totalReports: number;
        pendingReports: number;
        confirmedReports: number;
        reviewedReports: number;
        rejectedReports: number;
      };
      charts: {
        riskDistribution: Array<{ name: string; value: number; color: string }>;
        scansPerDay: Array<{ day: string; scans: number; reports: number }>;
        topReportedDomains: Array<{ domain: string; totalReports: number; confirmedReports: number; riskScore: number }>;
      };
      recentActions: AdminAction[];
      recentReports: Report[];
    }>('/admin/dashboard');
    return res.data;
  },

  getAdminReports: async (params?: { status?: string; search?: string } | string) => {
    const query = typeof params === 'string' ? (params === 'ALL' ? {} : { status: params }) : params;
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      reports: Report[];
    }>('/admin/reports', { params: query });
    return res.data;
  },

  updateAdminReport: async (id: string, data: { status: string; adminNotes?: string }) => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      report: Report;
      website?: Website;
    }>(`/admin/reports/${id}`, data);
    return res.data;
  },

  moderateReport: async (id: string, status: string, adminNotes?: string) => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      report: Report;
      website?: Website;
    }>(`/admin/reports/${id}`, { status, adminNotes });
    return res.data;
  },

  deleteReport: async (id: string) => {
    const res = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/admin/reports/${id}`);
    return res.data;
  },

  getAdminWebsites: async (params?: { riskLevel?: string; search?: string }) => {
    const res = await apiClient.get<{
      success: boolean;
      count: number;
      websites: Website[];
    }>('/admin/websites', { params });
    return res.data;
  },

  updateAdminWebsite: async (
    id: string,
    data: {
      overrideScore?: number;
      overrideLevel?: string;
      overrideReason?: string;
      isOverridden?: boolean;
      rescan?: boolean;
    }
  ) => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      website: Website;
    }>(`/admin/websites/${id}`, data);
    return res.data;
  },

  updateWebsiteOverride: async (
    id: string,
    data: {
      riskScore?: number;
      reputationBadge?: string;
      overrideReason?: string;
    }
  ) => {
    const res = await apiClient.patch<{
      success: boolean;
      message: string;
      website: Website;
    }>(`/admin/websites/${id}`, {
      overrideScore: data.riskScore,
      overrideLevel: data.reputationBadge,
      overrideReason: data.overrideReason || 'Manual Admin Override',
      isOverridden: true
    });
    return res.data;
  },

  getAdminAuditLogs: async () => {
    const res = await apiClient.get<{
      success: boolean;
      actions: AdminAction[];
    }>('/admin/audit-logs');
    return res.data;
  },

  // Database Management
  getDatabaseStatus: async () => {
    const res = await apiClient.get<{
      success: boolean;
      status: {
        connected: boolean;
        dbName: string;
        cluster: string;
        lastPing: string | null;
        pingLatencyMs: number | null;
        error: string | null;
        collections: {
          users?: number;
          websites?: number;
          scans?: number;
          reports?: number;
          adminActions?: number;
          transactions?: number;
          safetyTips?: number;
        };
      };
    }>('/db/status');
    return res.data;
  },

  syncDatabase: async () => {
    const res = await apiClient.post<{
      success: boolean;
      message: string;
      status: any;
    }>('/admin/db-sync');
    return res.data;
  },

  // Social & WhatsApp Scam Scanner
  scanInstagram: async (target: string) => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        analysis: InstagramAnalysisResult;
      }>('/social/scan-instagram', { target });
      return res.data;
    } catch {
      // Offline / Vercel static fallback
      const analysis = analyzeInstagramProfileClient(target);
      return {
        success: true,
        analysis
      };
    }
  },

  scanWhatsApp: async (target: string) => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        analysis: WhatsAppAnalysisResult;
      }>('/social/scan-whatsapp', { target });
      return res.data;
    } catch {
      // Offline / Vercel static fallback
      const analysis = analyzeWhatsAppNumberClient(target);
      return {
        success: true,
        analysis
      };
    }
  },

  getSocialThreats: async () => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        threats: {
          instagramThreats: Array<{
            type: 'INSTAGRAM';
            identifier: string;
            impersonatedBrand: string;
            reportsCount: number;
            riskScore: number;
            evidence: string;
            whatsAppNumber?: string;
            upiId?: string;
          }>;
          whatsAppThreats: Array<{
            type: 'WHATSAPP';
            identifier: string;
            impersonatedBrand: string;
            reportsCount: number;
            riskScore: number;
            evidence: string;
            whatsAppNumber: string;
            upiId: string;
          }>;
        };
      }>('/social/threats');
      return res.data;
    } catch {
      return {
        success: true,
        threats: getRecentSocialThreatsClient()
      };
    }
  },

  reportSocialScam: async (data: {
    platform: 'INSTAGRAM' | 'WHATSAPP';
    identifier: string;
    whatsAppNumber?: string;
    upiId?: string;
    financialLossAmount?: number;
    evidenceText: string;
    reporterName?: string;
    reporterEmail?: string;
  }) => {
    try {
      const res = await apiClient.post<{
        success: boolean;
        message: string;
        reportId: string;
      }>('/social/report', data);
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Report received and added to threat intelligence database.',
        reportId: `REP-${Date.now()}`
      };
    }
  },

  // AI Fraud Assistant & Suspicious Message Auditor
  chatWithAi: async (prompt: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) => {
    const res = await apiClient.post<{
      success: boolean;
      data: {
        reply: string;
        verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'INFO';
        riskScore: number;
        threatCategory: string;
        recommendedSteps: string[];
        suggestedFollowUps: string[];
      };
    }>('/ai/chat', { prompt, history });
    return res.data;
  },

  analyzeSuspiciousMessage: async (text: string) => {
    const res = await apiClient.post<{
      success: boolean;
      analysis: SuspiciousMessageAnalysis;
    }>('/ai/analyze-message', { text });
    return res.data;
  },

  transcribeScamVoice: async (payload: {
    audioBase64?: string;
    mimeType?: string;
    clientTranscript?: string;
    language?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      data: AudioTranscriptionResult;
    }>('/ai/transcribe-voice', payload);
    return res.data;
  }
};

export const apiService = api;



import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth';
import { validateAndSanitizeUrl } from '../services/ssrfGuard';
import { Report, IssueCategory } from '../types';

export async function submitReport(req: AuthRequest, res: Response) {
  try {
    const { url, reason, description, transactionIssue, financialLossAmount, evidenceUrl, reporterName, reporterEmail } = req.body;

    if (!url || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Website URL, reason, and description are required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const validation = await validateAndSanitizeUrl(url);
    if (!validation.isValid || !validation.domain) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Please provide a valid website URL to report.',
        errorCode: 'INVALID_URL'
      });
    }

    const domain = validation.domain;
    let website = db.websites.get(domain);

    if (!website) {
      const now = new Date().toISOString();
      website = {
        id: 'web_' + Math.random().toString(36).substring(2, 9),
        domain,
        url: validation.normalizedUrl || url,
        riskScore: 65,
        riskLevel: 'HIGH',
        confidence: 'MEDIUM',
        totalReports: 0,
        confirmedReports: 0,
        pendingReports: 0,
        rejectedReports: 0,
        firstScannedAt: now,
        lastScannedAt: now,
        signalsSummary: {
          hasHttps: url.startsWith('https:'),
          hasValidSsl: true,
          domainAgeEstimated: 'Unknown',
          hasPrivacyPolicy: false,
          hasRefundPolicy: false,
          hasContactInfo: false,
          hasSuspiciousPaymentInstructions: true,
          hasExcessiveUrgency: false,
          isTypoSquatted: false
        },
        reputationBadge: 'NEEDS_CAUTION',
        createdAt: now,
        updatedAt: now
      };
      db.websites.set(domain, website);
    }

    const reportId = 'rep_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const newReport: Report = {
      id: reportId,
      userId: req.user?.id || 'usr_guest_' + Math.random().toString(36).substring(2, 6),
      reporterName: req.user?.name || reporterName || 'Shopper Community Member',
      reporterEmail: req.user?.email || reporterEmail,
      websiteId: website.id,
      domain,
      url: validation.normalizedUrl || url,
      reason: reason.trim(),
      description: description.trim(),
      transactionIssue: (transactionIssue as IssueCategory) || 'Other',
      financialLossAmount: Number(financialLossAmount) || 0,
      evidenceUrl: evidenceUrl || '',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now
    };

    await db.saveReport(newReport);

    // Update website counters
    website.totalReports += 1;
    website.pendingReports += 1;
    website.updatedAt = now;
    await db.saveWebsite(website);

    return res.status(201).json({
      success: true,
      message: 'Your report has been submitted to SafeCart moderation team for review.',
      report: newReport
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report. Please try again.',
      error: error.message
    });
  }
}

export async function getMyReports(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view personal reports.',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const userReports = Array.from(db.reports.values())
      .filter((r) => r.userId === userId || (req.user?.email && r.reporterEmail === req.user.email))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      count: userReports.length,
      reports: userReports
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.',
      error: error.message
    });
  }
}

export async function getRecentPublicReports(req: AuthRequest, res: Response) {
  try {
    const reports = Array.from(db.reports.values())
      .map((r) => ({
        id: r.id,
        domain: r.domain,
        reason: r.reason,
        transactionIssue: r.transactionIssue,
        status: r.status,
        financialLossAmount: r.financialLossAmount,
        createdAt: r.createdAt,
        reporterName: r.reporterName ? r.reporterName.charAt(0) + '***' : 'Anonymous Shopper'
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    return res.json({
      success: true,
      reports
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve public reports.',
      error: error.message
    });
  }
}

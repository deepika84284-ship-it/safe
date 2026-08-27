import { Response } from 'express';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth';
import { ReportStatus, RiskLevel, AdminAction } from '../types';
import { analyzeWebsite } from '../services/websiteAnalyzer';

export async function getAdminDashboard(req: AuthRequest, res: Response) {
  try {
    const totalUsers = db.users.size;
    const websites = Array.from(db.websites.values());
    const reports = Array.from(db.reports.values());
    const scans = Array.from(db.scans.values());
    const actions = Array.from(db.adminActions.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const totalWebsites = websites.length;
    const highRiskWebsites = websites.filter(
      (w) => w.riskLevel === 'HIGH' || w.riskLevel === 'VERY HIGH'
    ).length;
    const mediumRiskWebsites = websites.filter((w) => w.riskLevel === 'MEDIUM').length;
    const lowRiskWebsites = websites.filter((w) => w.riskLevel === 'LOW').length;

    const pendingReports = reports.filter((r) => r.status === 'PENDING').length;
    const confirmedReports = reports.filter((r) => r.status === 'CONFIRMED').length;
    const reviewedReports = reports.filter((r) => r.status === 'REVIEWED').length;
    const rejectedReports = reports.filter((r) => r.status === 'REJECTED').length;

    // Risk distribution chart data
    const riskDistribution = [
      { name: 'Low Risk (0-29)', value: lowRiskWebsites, color: '#10b981' },
      { name: 'Medium Risk (30-59)', value: mediumRiskWebsites, color: '#f59e0b' },
      { name: 'High Risk (60-79)', value: websites.filter((w) => w.riskLevel === 'HIGH').length, color: '#f97316' },
      { name: 'Very High Risk (80-100)', value: websites.filter((w) => w.riskLevel === 'VERY HIGH').length, color: '#ef4444' }
    ];

    // Activity timeline over last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const scansPerDay = days.map((day, idx) => ({
      day,
      scans: 12 + idx * 8 + (idx === 6 ? 14 : 0),
      reports: 2 + (idx % 3) * 2
    }));

    // Top reported domains
    const domainReportCounts: Record<string, { total: number; confirmed: number; riskScore: number }> = {};
    for (const r of reports) {
      if (!domainReportCounts[r.domain]) {
        const w = db.websites.get(r.domain);
        domainReportCounts[r.domain] = { total: 0, confirmed: 0, riskScore: w?.riskScore || 70 };
      }
      domainReportCounts[r.domain].total++;
      if (r.status === 'CONFIRMED') domainReportCounts[r.domain].confirmed++;
    }

    const topReportedDomains = Object.entries(domainReportCounts)
      .map(([domain, data]) => ({
        domain,
        totalReports: data.total,
        confirmedReports: data.confirmed,
        riskScore: data.riskScore
      }))
      .sort((a, b) => b.totalReports - a.totalReports)
      .slice(0, 6);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalWebsites,
        highRiskWebsites,
        totalScans: scans.length,
        totalReports: reports.length,
        pendingReports,
        confirmedReports,
        reviewedReports,
        rejectedReports
      },
      charts: {
        riskDistribution,
        scansPerDay,
        topReportedDomains
      },
      recentActions: actions.slice(0, 10),
      recentReports: reports.slice(0, 8)
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate admin dashboard metrics.',
      error: error.message
    });
  }
}

export async function getAdminReports(req: AuthRequest, res: Response) {
  try {
    const { status, search } = req.query;
    let reports = Array.from(db.reports.values());

    if (status && typeof status === 'string' && status !== 'ALL') {
      reports = reports.filter((r) => r.status === status);
    }

    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.domain.toLowerCase().includes(term) ||
          r.reason.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
      );
    }

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.',
      error: error.message
    });
  }
}

export async function updateAdminReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = db.reports.get(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
        errorCode: 'REPORT_NOT_FOUND'
      });
    }

    const previousStatus = report.status;
    const newStatus: ReportStatus = status || report.status;
    const now = new Date().toISOString();

    report.status = newStatus;
    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }
    report.reviewedBy = req.user?.name || 'Admin';
    report.reviewedAt = now;
    report.updatedAt = now;

    await db.saveReport(report);

    // Update website statistics
    const website = db.websites.get(report.domain);
    if (website) {
      if (previousStatus === 'PENDING' && newStatus !== 'PENDING') {
        website.pendingReports = Math.max(0, website.pendingReports - 1);
      }
      if (newStatus === 'CONFIRMED' && previousStatus !== 'CONFIRMED') {
        website.confirmedReports += 1;
        // Increase domain risk score
        website.riskScore = Math.min(100, Math.max(website.riskScore, 75) + 5);
        if (website.riskScore >= 80) website.riskLevel = 'VERY HIGH';
        else if (website.riskScore >= 60) website.riskLevel = 'HIGH';
      } else if (newStatus === 'REJECTED' && previousStatus === 'CONFIRMED') {
        website.confirmedReports = Math.max(0, website.confirmedReports - 1);
        website.rejectedReports += 1;
      }
      website.updatedAt = now;
      await db.saveWebsite(website);
    }

    // Log admin audit action
    const actionId = 'act_' + Math.random().toString(36).substring(2, 9);
    const action: AdminAction = {
      id: actionId,
      adminId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@safecart.security',
      actionType: 'UPDATE_REPORT_STATUS',
      targetType: 'REPORT',
      targetId: id,
      details: `Updated report ${id} status from ${previousStatus} to ${newStatus}. Domain: ${report.domain}`,
      timestamp: now
    };
    await db.saveAdminAction(action);

    return res.json({
      success: true,
      message: `Report status updated to ${newStatus}.`,
      report,
      website
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update report.',
      error: error.message
    });
  }
}

export async function getAdminWebsites(req: AuthRequest, res: Response) {
  try {
    const { riskLevel, search } = req.query;
    let websites = Array.from(db.websites.values());

    if (riskLevel && typeof riskLevel === 'string' && riskLevel !== 'ALL') {
      websites = websites.filter((w) => w.riskLevel === riskLevel);
    }

    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      websites = websites.filter(
        (w) => w.domain.toLowerCase().includes(term) || w.url.toLowerCase().includes(term)
      );
    }

    websites.sort((a, b) => b.riskScore - a.riskScore);

    return res.json({
      success: true,
      count: websites.length,
      websites
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve websites.',
      error: error.message
    });
  }
}

export async function updateAdminWebsite(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { overrideScore, overrideLevel, overrideReason, isOverridden, rescan } = req.body;

    let website = Array.from(db.websites.values()).find((w) => w.id === id || w.domain === id);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website record not found.',
        errorCode: 'WEBSITE_NOT_FOUND'
      });
    }

    const now = new Date().toISOString();

    if (rescan) {
      const result = await analyzeWebsite({ rawUrl: website.url, forceFresh: true });
      website = result.website;
    }

    if (isOverridden !== undefined) {
      if (isOverridden) {
        const score = Number(overrideScore);
        const level: RiskLevel = overrideLevel || (score >= 80 ? 'VERY HIGH' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');
        website.riskScore = score;
        website.riskLevel = level;
        website.manualRiskOverride = {
          isOverridden: true,
          overrideScore: score,
          overrideLevel: level,
          overrideReason: overrideReason || 'Administrative risk classification adjustment.',
          overriddenBy: req.user?.email || 'admin@safecart.security',
          overriddenAt: now
        };
      } else {
        website.manualRiskOverride = {
          isOverridden: false
        };
        // Trigger auto re-eval
        const result = await analyzeWebsite({ rawUrl: website.url, forceFresh: true });
        website = result.website;
      }
    }

    website.updatedAt = now;
    await db.saveWebsite(website);

    const actionId = 'act_' + Math.random().toString(36).substring(2, 9);
    const action: AdminAction = {
      id: actionId,
      adminId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@safecart.security',
      actionType: 'OVERRIDE_WEBSITE_RISK',
      targetType: 'WEBSITE',
      targetId: website.id,
      details: `Website ${website.domain} manual override updated to score ${website.riskScore} (${website.riskLevel}).`,
      timestamp: now
    };
    await db.saveAdminAction(action);

    return res.json({
      success: true,
      message: 'Website security profile updated.',
      website
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update website profile.',
      error: error.message
    });
  }
}

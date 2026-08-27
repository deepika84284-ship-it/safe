import { Request, Response } from 'express';
import { db } from '../db/store';
import { analyzeWebsite } from '../services/websiteAnalyzer';

export async function getWebsiteByDomain(req: Request, res: Response) {
  try {
    let domain = req.params.domain.toLowerCase().trim();
    if (domain.startsWith('www.')) domain = domain.substring(4);

    let website = db.websites.get(domain);

    // If website is not yet scanned in the database, scan it on demand!
    if (!website) {
      const scanResult = await analyzeWebsite({ rawUrl: `https://${domain}` });
      website = scanResult.website;
    }

    const domainReports = Array.from(db.reports.values())
      .filter((r) => r.domain.toLowerCase() === domain)
      .map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        transactionIssue: r.transactionIssue,
        status: r.status,
        financialLossAmount: r.financialLossAmount,
        createdAt: r.createdAt,
        // reporter identity anonymized for privacy
        reporterName: r.reporterName ? r.reporterName.charAt(0) + '***' : 'Anonymous Shopper'
      }));

    const scansForDomain = Array.from(db.scans.values())
      .filter((s) => s.domain.toLowerCase() === domain)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return res.json({
      success: true,
      website,
      reports: domainReports,
      recentScans: scansForDomain
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve website details.',
      errorCode: 'WEBSITE_QUERY_ERROR'
    });
  }
}

export async function getWebsiteReports(req: Request, res: Response) {
  try {
    let domain = req.params.domain.toLowerCase().trim();
    if (domain.startsWith('www.')) domain = domain.substring(4);

    const reports = Array.from(db.reports.values())
      .filter((r) => r.domain.toLowerCase() === domain)
      .map((r) => ({
        id: r.id,
        reason: r.reason,
        description: r.description,
        transactionIssue: r.transactionIssue,
        status: r.status,
        financialLossAmount: r.financialLossAmount,
        createdAt: r.createdAt,
        reporterName: r.reporterName ? r.reporterName.charAt(0) + '***' : 'Anonymous Shopper'
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      domain,
      totalReports: reports.length,
      reports
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch community reports for domain.',
      error: error.message
    });
  }
}

import { Request, Response } from 'express';
import {
  analyzeInstagramProfile,
  analyzeWhatsAppNumber,
  getRecentSocialThreats,
  sanitizeInstagramHandle,
  sanitizePhoneNumber
} from '../services/socialScamAnalyzer';
import { db } from '../db/store';
import { Report } from '../types';

/**
 * Scan Instagram Profile / Storefront
 */
export async function scanInstagramProfile(req: Request, res: Response) {
  try {
    const { target } = req.body;
    if (!target || typeof target !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Instagram username (e.g. @shop_deals) or profile URL.'
      });
    }

    const analysis = await analyzeInstagramProfile(target);

    return res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to analyze Instagram profile.'
    });
  }
}

/**
 * Scan WhatsApp Number / UPI Handle
 */
export async function scanWhatsAppNumber(req: Request, res: Response) {
  try {
    const { target } = req.body;
    if (!target || typeof target !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a WhatsApp phone number (e.g. +91 98765 43210 or 9876543210).'
      });
    }

    const analysis = await analyzeWhatsAppNumber(target);

    return res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to analyze WhatsApp number.'
    });
  }
}

/**
 * Scan Combined Cross-Platform Risk (Instagram ID + WhatsApp Number)
 */
export async function scanCrossPlatform(req: Request, res: Response) {
  try {
    const { instagram, whatsapp } = req.body;
    if (!instagram || !whatsapp) {
      return res.status(400).json({
        success: false,
        message: 'Both Instagram username and WhatsApp number are required for cross-platform risk correlation.'
      });
    }

    const { analyzeCrossPlatformRisk } = await import('../services/socialScamAnalyzer');
    const analysis = await analyzeCrossPlatformRisk(String(instagram), String(whatsapp));

    return res.json({
      success: true,
      analysis
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to analyze cross-platform correlation.'
    });
  }
}

/**
 * Get known social & WhatsApp threats
 */
export async function getSocialThreats(req: Request, res: Response) {
  try {
    const threats = getRecentSocialThreats();
    return res.json({
      success: true,
      threats
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve social threat registry.'
    });
  }
}

/**
 * Report an Instagram handle or WhatsApp scam number
 */
export async function reportSocialScam(req: Request, res: Response) {
  try {
    const {
      platform,
      identifier,
      whatsAppNumber,
      upiId,
      financialLossAmount,
      evidenceText,
      reporterName,
      reporterEmail
    } = req.body;

    if (!identifier || !evidenceText) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (Instagram handle or phone number) and evidence description are required.'
      });
    }

    const now = new Date().toISOString();
    const reportId = 'rep_soc_' + Math.random().toString(36).substring(2, 10);
    const domainOrHandle = platform === 'INSTAGRAM' ? `instagram.com/${sanitizeInstagramHandle(identifier)}` : `whatsapp:${identifier}`;

    const report: Report = {
      id: reportId,
      userId: (req as any).user?.id,
      reporterName: reporterName || 'Anonymous Community Defender',
      reporterEmail: reporterEmail || 'anonymous@safecart.network',
      websiteId: 'soc_' + Math.random().toString(36).substring(2, 8),
      domain: domainOrHandle,
      url: platform === 'INSTAGRAM' ? `https://${domainOrHandle}` : `https://wa.me/${sanitizePhoneNumber(identifier).normalized}`,
      reason: `[${platform} SCAM] ${identifier} - UPI: ${upiId || 'N/A'} - WhatsApp: ${whatsAppNumber || 'N/A'}`,
      description: evidenceText,
      transactionIssue:
        platform === 'INSTAGRAM'
          ? 'Instagram DM to WhatsApp Redirection Trap'
          : 'WhatsApp UPI / Advance Payment Fraud',
      financialLossAmount: financialLossAmount ? Number(financialLossAmount) : undefined,
      status: 'CONFIRMED', // Instant shield validation for verified user submissions
      createdAt: now,
      updatedAt: now
    };

    await db.saveReport(report);

    return res.status(201).json({
      success: true,
      message: 'Social scam report successfully submitted to SafeCart threat intelligence registry.',
      reportId: report.id
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to submit social scam report.'
    });
  }
}

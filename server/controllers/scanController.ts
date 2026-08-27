import { Request, Response } from 'express';
import { analyzeWebsite } from '../services/websiteAnalyzer';
import { db } from '../db/store';
import { AuthRequest } from '../middleware/auth';

export async function createScan(req: AuthRequest, res: Response) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website URL to scan.',
        errorCode: 'INVALID_URL'
      });
    }

    const userId = req.user?.id;
    const result = await analyzeWebsite({ rawUrl: url, userId });

    return res.status(200).json({
      success: true,
      message: 'Website security analysis completed.',
      scan: result.scan,
      website: result.website,
      evaluation: result.evaluation
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to analyze website. Please check the URL format and try again.',
      errorCode: 'SCAN_FAILED'
    });
  }
}

export async function getScanById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const scan = db.scans.get(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan result not found or has expired.',
        errorCode: 'SCAN_NOT_FOUND'
      });
    }

    const website = db.websites.get(scan.domain);

    return res.json({
      success: true,
      scan,
      website: website || null
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve scan record.',
      error: error.message
    });
  }
}

export async function getScanHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const allScans = Array.from(db.scans.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // If authenticated user requested history, we can show their scans or public scans
    const userScans = userId ? allScans.filter((s) => s.userId === userId) : [];

    return res.json({
      success: true,
      totalScans: allScans.length,
      userScans,
      recentPublicScans: allScans.slice(0, 20)
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve scan history.',
      error: error.message
    });
  }
}

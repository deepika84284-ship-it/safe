import { Request, Response } from 'express';
import { db } from '../db/store';

export async function getSafetyTips(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      tips: db.safetyTips,
      disclaimer: 'SafeCart provides risk indicators and safety guidance. It does not guarantee that a website is safe or fraudulent.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve safety tips.',
      error: error.message
    });
  }
}

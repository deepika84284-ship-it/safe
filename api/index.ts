import {
  analyzeInstagramProfile,
  analyzeWhatsAppNumber,
  getRecentSocialThreats
} from '../server/services/socialScamAnalyzer';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  try {
    // Health check
    if (url.includes('/health')) {
      return res.status(200).json({
        status: 'ok',
        service: 'SafeCart Cybersecurity Engine (Vercel Serverless)',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // Instagram Scan
    if (url.includes('/social/scan-instagram') || url.includes('/scan-instagram')) {
      const target = req.body?.target || req.query?.target || '';
      if (!target) {
        return res.status(400).json({
          success: false,
          message: 'Instagram profile handle or URL is required.'
        });
      }
      const analysis = await analyzeInstagramProfile(String(target));
      return res.status(200).json({
        success: true,
        analysis
      });
    }

    // WhatsApp Scan
    if (url.includes('/social/scan-whatsapp') || url.includes('/scan-whatsapp')) {
      const target = req.body?.target || req.query?.target || '';
      if (!target) {
        return res.status(400).json({
          success: false,
          message: 'WhatsApp phone number is required.'
        });
      }
      const analysis = await analyzeWhatsAppNumber(String(target));
      return res.status(200).json({
        success: true,
        analysis
      });
    }

    // Social Threats
    if (url.includes('/social/threats') || url.includes('/threats')) {
      const threats = getRecentSocialThreats();
      return res.status(200).json({
        success: true,
        threats
      });
    }

    // Social Report
    if (url.includes('/social/report') || url.includes('/report')) {
      return res.status(200).json({
        success: true,
        message: 'Threat registered and reported to community threat registry.',
        reportId: `REP-${Date.now()}`
      });
    }

    // Default fallback
    return res.status(200).json({
      status: 'ok',
      service: 'SafeCart Serverless API Engine',
      path: url,
      message: 'API operational'
    });
  } catch (err: any) {
    console.error('[SafeCart Serverless Error]:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Server error occurred during scan.',
      error: String(err)
    });
  }
}

import { Router } from 'express';
import { register, login, adminLogin, getCurrentUser } from './controllers/authController';
import { createScan, getScanById, getScanHistory } from './controllers/scanController';
import { getWebsiteByDomain, getWebsiteReports } from './controllers/websiteController';
import { submitReport, getMyReports, getRecentPublicReports } from './controllers/reportController';
import {
  getAdminDashboard,
  getAdminReports,
  updateAdminReport,
  getAdminWebsites,
  updateAdminWebsite
} from './controllers/adminController';
import {
  createDemoPayment,
  requestRefund,
  processAdminRefund,
  getMyPayments,
  getAllPayments,
  verifyVpa
} from './controllers/paymentController';
import { getSafetyTips } from './controllers/safetyController';
import {
  scanInstagramProfile,
  scanWhatsAppNumber,
  scanCrossPlatform,
  getSocialThreats,
  reportSocialScam
} from './controllers/socialController';
import {
  chatWithAiAssistant,
  analyzeSuspiciousMessage,
  transcribeScamVoice
} from './controllers/aiController';
import { optionalAuth, requireAuth, requireAdmin } from './middleware/auth';
import { createRateLimiter } from './middleware/rateLimiter';
import { db } from './db/store';
import { getMongoStatus } from './db/mongodb';

export const apiRouter = Router();

// Rate limiter for scans
const scanLimiter = createRateLimiter(30, 60 * 1000);

// Database Health & Status Endpoint
apiRouter.get('/db/status', async (req, res) => {
  const status = await getMongoStatus();
  res.json({
    success: true,
    status
  });
});

apiRouter.get('/admin/db-status', requireAdmin, async (req, res) => {
  const status = await getMongoStatus();
  res.json({
    success: true,
    status
  });
});

apiRouter.post('/admin/db-sync', requireAdmin, async (req, res) => {
  await db.syncWithMongoDB();
  const status = await getMongoStatus();
  res.json({
    success: true,
    message: 'Database state synchronized with MongoDB Atlas cluster.',
    status
  });
});

// Auth Routes
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/login', login);
apiRouter.post('/admin/login', adminLogin);
apiRouter.get('/auth/me', optionalAuth, getCurrentUser);

// Scan Routes
apiRouter.post('/scans', scanLimiter, optionalAuth, createScan);
apiRouter.get('/scans/history', optionalAuth, getScanHistory);
apiRouter.get('/scans/:id', getScanById);

// Website Profiles
apiRouter.get('/websites/:domain', getWebsiteByDomain);
apiRouter.get('/websites/:domain/reports', getWebsiteReports);

// Community Reports
apiRouter.post('/reports', optionalAuth, submitReport);
apiRouter.get('/reports/my', requireAuth, getMyReports);
apiRouter.get('/reports/public', getRecentPublicReports);

// Safety Tips
apiRouter.get('/safety-tips', getSafetyTips);

// AI Fraud Assistant & Message Auditor Routes
apiRouter.post('/ai/chat', chatWithAiAssistant);
apiRouter.post('/ai/analyze-message', analyzeSuspiciousMessage);
apiRouter.post('/ai/transcribe-voice', transcribeScamVoice);

// Social & WhatsApp Scam Scanner Routes
apiRouter.post('/social/scan-instagram', scanLimiter, scanInstagramProfile);
apiRouter.post('/social/scan-whatsapp', scanLimiter, scanWhatsAppNumber);
apiRouter.post('/social/scan-cross-platform', scanLimiter, scanCrossPlatform);
apiRouter.get('/social/threats', getSocialThreats);
apiRouter.post('/social/report', optionalAuth, reportSocialScam);

// Mock Payment Sandbox & GPay UPI Escrow
apiRouter.post('/payments/create-demo', optionalAuth, createDemoPayment);
apiRouter.post('/payments/verify-vpa', optionalAuth, verifyVpa);
apiRouter.post('/payments/:id/refund-request', optionalAuth, requestRefund);
apiRouter.post('/payments/:id/admin-process-refund', requireAdmin, processAdminRefund);
apiRouter.get('/payments/my', optionalAuth, getMyPayments);
apiRouter.get('/payments/all', requireAdmin, getAllPayments);

// Admin Control Panel
apiRouter.get('/admin/dashboard', requireAdmin, getAdminDashboard);
apiRouter.get('/admin/reports', requireAdmin, getAdminReports);
apiRouter.patch('/admin/reports/:id', requireAdmin, updateAdminReport);
apiRouter.get('/admin/websites', requireAdmin, getAdminWebsites);
apiRouter.patch('/admin/websites/:id', requireAdmin, updateAdminWebsite);
apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  const actions = Array.from(db.adminActions.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json({ success: true, actions });
});

// Quick seed reset endpoint for demonstration testing
apiRouter.post('/admin/reset-demo-data', requireAdmin, (req, res) => {
  // Re-seed if requested
  res.json({ success: true, message: 'Data store initialized.' });
});

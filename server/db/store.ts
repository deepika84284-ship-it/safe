import bcrypt from 'bcryptjs';
import {
  User,
  Website,
  ScanResult,
  Report,
  MockTransaction,
  AdminAction,
  SafetyTip,
  RiskLevel,
  ConfidenceLevel
} from '../types';
import { MockSandboxPaymentProvider } from '../services/paymentProvider';
import {
  getUsersCollection,
  getWebsitesCollection,
  getScansCollection,
  getReportsCollection,
  getAdminActionsCollection,
  getTransactionsCollection,
  getSafetyTipsCollection,
  isMongoConnected
} from './mongodb';

export class DataStore {
  public users: Map<string, User> = new Map();
  public websites: Map<string, Website> = new Map();
  public scans: Map<string, ScanResult> = new Map();
  public reports: Map<string, Report> = new Map();
  public adminActions: Map<string, AdminAction> = new Map();
  public safetyTips: SafetyTip[] = [];
  public paymentProvider: MockSandboxPaymentProvider;
  private isInitialized = false;

  constructor() {
    this.paymentProvider = new MockSandboxPaymentProvider();
    this.seedInitialData();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const adminPassHash = bcrypt.hashSync('Admin@123456', salt);
    const userPassHash = bcrypt.hashSync('User@123456', salt);
    const ramyaPassHash = bcrypt.hashSync('ramya200', salt);
    const demoConsumerHash = bcrypt.hashSync('User123!', salt);
    const demoAdminHash = bcrypt.hashSync('Admin123!', salt);

    // 1. Pre-seeded Users
    const demoConsumer: User = {
      id: 'usr_consumer_demo',
      name: 'SafeCart Demo Consumer',
      email: 'user@safecart.local',
      passwordHash: demoConsumerHash,
      role: 'USER',
      createdAt: '2025-01-01T00:00:00.000Z'
    };

    const demoAdmin: User = {
      id: 'usr_admin_demo',
      name: 'SafeCart Demo Administrator',
      email: 'admin@safecart.local',
      passwordHash: demoAdminHash,
      role: 'ADMIN',
      createdAt: '2025-01-01T00:00:00.000Z'
    };

    const adminUser: User = {
      id: 'usr_admin_01',
      name: 'Cyber Security Admin',
      email: 'admin@safecart.security',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      createdAt: '2025-01-10T10:00:00.000Z'
    };

    const ramyaAdmin: User = {
      id: 'usr_ramya_01',
      name: 'Ramya Admin',
      email: 'ramya@safecart.security',
      passwordHash: ramyaPassHash,
      role: 'ADMIN',
      createdAt: '2025-01-01T00:00:00.000Z'
    };

    const regularUser: User = {
      id: 'usr_shopper_01',
      name: 'Elena Rostova',
      email: 'user@safecart.security',
      passwordHash: userPassHash,
      role: 'USER',
      createdAt: '2025-02-15T14:30:00.000Z'
    };

    this.users.set(demoConsumer.id, demoConsumer);
    this.users.set(demoAdmin.id, demoAdmin);
    this.users.set(adminUser.id, adminUser);
    this.users.set(ramyaAdmin.id, ramyaAdmin);
    this.users.set(regularUser.id, regularUser);

    // 2. Pre-seeded Websites
    const sampleWebsites: Website[] = [
      {
        id: 'web_amazon_01',
        domain: 'amazon.com',
        url: 'https://www.amazon.com',
        riskScore: 6,
        riskLevel: 'LOW',
        confidence: 'HIGH',
        totalReports: 1,
        confirmedReports: 0,
        pendingReports: 0,
        rejectedReports: 1,
        firstScannedAt: '2025-01-01T08:00:00.000Z',
        lastScannedAt: '2026-08-20T11:20:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: true,
          domainAgeEstimated: '28+ years',
          hasPrivacyPolicy: true,
          hasRefundPolicy: true,
          hasContactInfo: true,
          hasSuspiciousPaymentInstructions: false,
          hasExcessiveUrgency: false,
          isTypoSquatted: false
        },
        reputationBadge: 'VERIFIED_TRUSTED',
        createdAt: '2025-01-01T08:00:00.000Z',
        updatedAt: '2026-08-20T11:20:00.000Z'
      },
      {
        id: 'web_nike_01',
        domain: 'nike.com',
        url: 'https://www.nike.com',
        riskScore: 8,
        riskLevel: 'LOW',
        confidence: 'HIGH',
        totalReports: 0,
        confirmedReports: 0,
        pendingReports: 0,
        rejectedReports: 0,
        firstScannedAt: '2025-01-05T09:15:00.000Z',
        lastScannedAt: '2026-08-22T16:45:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: true,
          domainAgeEstimated: '24+ years',
          hasPrivacyPolicy: true,
          hasRefundPolicy: true,
          hasContactInfo: true,
          hasSuspiciousPaymentInstructions: false,
          hasExcessiveUrgency: false,
          isTypoSquatted: false
        },
        reputationBadge: 'VERIFIED_TRUSTED',
        createdAt: '2025-01-05T09:15:00.000Z',
        updatedAt: '2026-08-22T16:45:00.000Z'
      },
      {
        id: 'web_scam_sneaker88',
        domain: 'mega-discounts-direct88.shop',
        url: 'https://mega-discounts-direct88.shop',
        riskScore: 88,
        riskLevel: 'VERY HIGH',
        confidence: 'HIGH',
        totalReports: 14,
        confirmedReports: 9,
        pendingReports: 3,
        rejectedReports: 2,
        firstScannedAt: '2026-06-12T12:00:00.000Z',
        lastScannedAt: '2026-08-24T09:30:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: false,
          domainAgeEstimated: '1 month (Recent)',
          hasPrivacyPolicy: false,
          hasRefundPolicy: false,
          hasContactInfo: false,
          hasSuspiciousPaymentInstructions: true,
          hasExcessiveUrgency: true,
          isTypoSquatted: false
        },
        reputationBadge: 'SUSPECTED_RISK',
        createdAt: '2026-06-12T12:00:00.000Z',
        updatedAt: '2026-08-24T09:30:00.000Z'
      },
      {
        id: 'web_scam_luxury_top',
        domain: 'luxury-watches-clearance.top',
        url: 'https://luxury-watches-clearance.top',
        riskScore: 78,
        riskLevel: 'HIGH',
        confidence: 'HIGH',
        totalReports: 8,
        confirmedReports: 5,
        pendingReports: 2,
        rejectedReports: 1,
        firstScannedAt: '2026-07-01T15:00:00.000Z',
        lastScannedAt: '2026-08-23T14:10:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: true,
          domainAgeEstimated: '2 months',
          hasPrivacyPolicy: false,
          hasRefundPolicy: false,
          hasContactInfo: false,
          hasSuspiciousPaymentInstructions: true,
          hasExcessiveUrgency: true,
          isTypoSquatted: false
        },
        reputationBadge: 'SUSPECTED_RISK',
        createdAt: '2026-07-01T15:00:00.000Z',
        updatedAt: '2026-08-23T14:10:00.000Z'
      },
      {
        id: 'web_typo_nike_xyz',
        domain: 'official-nike-sale-outlet.xyz',
        url: 'https://official-nike-sale-outlet.xyz',
        riskScore: 92,
        riskLevel: 'VERY HIGH',
        confidence: 'HIGH',
        totalReports: 19,
        confirmedReports: 12,
        pendingReports: 4,
        rejectedReports: 3,
        firstScannedAt: '2026-05-20T10:00:00.000Z',
        lastScannedAt: '2026-08-25T03:15:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: true,
          domainAgeEstimated: '2 weeks',
          hasPrivacyPolicy: false,
          hasRefundPolicy: false,
          hasContactInfo: false,
          hasSuspiciousPaymentInstructions: true,
          hasExcessiveUrgency: true,
          isTypoSquatted: true
        },
        reputationBadge: 'SUSPECTED_RISK',
        createdAt: '2026-05-20T10:00:00.000Z',
        updatedAt: '2026-08-25T03:15:00.000Z'
      },
      {
        id: 'web_boutique_caution',
        domain: 'artisan-crafts-studio.net',
        url: 'https://artisan-crafts-studio.net',
        riskScore: 42,
        riskLevel: 'MEDIUM',
        confidence: 'MEDIUM',
        totalReports: 2,
        confirmedReports: 0,
        pendingReports: 1,
        rejectedReports: 1,
        firstScannedAt: '2026-04-10T14:00:00.000Z',
        lastScannedAt: '2026-08-21T18:00:00.000Z',
        signalsSummary: {
          hasHttps: true,
          hasValidSsl: true,
          domainAgeEstimated: '6 months',
          hasPrivacyPolicy: true,
          hasRefundPolicy: false,
          hasContactInfo: true,
          hasSuspiciousPaymentInstructions: false,
          hasExcessiveUrgency: false,
          isTypoSquatted: false
        },
        reputationBadge: 'NEEDS_CAUTION',
        createdAt: '2026-04-10T14:00:00.000Z',
        updatedAt: '2026-08-21T18:00:00.000Z'
      }
    ];

    for (const w of sampleWebsites) {
      this.websites.set(w.domain, w);
    }

    // 3. Pre-seeded Community Reports
    const sampleReports: Report[] = [
      {
        id: 'rep_001',
        userId: 'usr_shopper_01',
        reporterName: 'Elena Rostova',
        reporterEmail: 'user@safecart.security',
        websiteId: 'web_scam_sneaker88',
        domain: 'mega-discounts-direct88.shop',
        url: 'https://mega-discounts-direct88.shop',
        reason: 'Paid for designer sneakers, merchant stopped replying and order never arrived.',
        description:
          'I saw an ad on Instagram advertising 80% off sneakers. They demanded direct payment via bank transfer/wire or gift card. After sending $89.00, tracking number was fake and support email bounced.',
        transactionIssue: 'Product not delivered',
        financialLossAmount: 89.0,
        status: 'CONFIRMED',
        adminNotes: 'Verified via multiple matching user complaints and unresolvable contact address.',
        reviewedBy: 'Cyber Security Admin',
        reviewedAt: '2026-08-20T10:00:00.000Z',
        createdAt: '2026-08-18T14:20:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z'
      },
      {
        id: 'rep_002',
        userId: 'usr_anon_02',
        reporterName: 'Anonymous Shopper',
        websiteId: 'web_typo_nike_xyz',
        domain: 'official-nike-sale-outlet.xyz',
        url: 'https://official-nike-sale-outlet.xyz',
        reason: 'Brand impersonation phishing store cloning official layout.',
        description:
          'Cloned the official Nike homepage completely down to images and logos. Only payment option was direct crypto or personal peer-to-peer link.',
        transactionIssue: 'Phishing or Credential Harvesting',
        financialLossAmount: 120.0,
        status: 'CONFIRMED',
        adminNotes: 'Confirmed trademark infringement and rogue payment redirect.',
        reviewedBy: 'Cyber Security Admin',
        reviewedAt: '2026-08-24T12:00:00.000Z',
        createdAt: '2026-08-23T11:00:00.000Z',
        updatedAt: '2026-08-24T12:00:00.000Z'
      },
      {
        id: 'rep_003',
        userId: 'usr_shopper_01',
        reporterName: 'Elena Rostova',
        reporterEmail: 'user@safecart.security',
        websiteId: 'web_boutique_caution',
        domain: 'artisan-crafts-studio.net',
        url: 'https://artisan-crafts-studio.net',
        reason: 'Order delivery delayed by 3 weeks, refund policy unclear.',
        description:
          'Ordered handmade ceramic vase. Still pending dispatch after 20 days. Seller claims backlog but return page is 404.',
        transactionIssue: 'Refund issue',
        financialLossAmount: 45.0,
        status: 'PENDING',
        createdAt: '2026-08-24T16:00:00.000Z',
        updatedAt: '2026-08-24T16:00:00.000Z'
      },
      {
        id: 'rep_004',
        userId: 'usr_anon_03',
        reporterName: 'David K.',
        websiteId: 'web_scam_luxury_top',
        domain: 'luxury-watches-clearance.top',
        url: 'https://luxury-watches-clearance.top',
        reason: 'Received plastic replica instead of advertised chronograph watch.',
        description:
          'Advertised authentic automatic watches for $119. Received cheap plastic toy watch in bubble envelope with no return label or invoice.',
        transactionIssue: 'Fake product',
        financialLossAmount: 119.0,
        status: 'CONFIRMED',
        adminNotes: 'Fraudulent product substitution pattern confirmed.',
        reviewedBy: 'Cyber Security Admin',
        reviewedAt: '2026-08-21T09:00:00.000Z',
        createdAt: '2026-08-19T08:30:00.000Z',
        updatedAt: '2026-08-21T09:00:00.000Z'
      }
    ];

    for (const r of sampleReports) {
      this.reports.set(r.id, r);
    }

    // 4. Pre-seeded Sandbox Transactions
    const sampleTxs: MockTransaction[] = [
      {
        id: 'tx_sandbox_1001',
        userId: 'usr_shopper_01',
        userName: 'Elena Rostova',
        userEmail: 'user@safecart.security',
        websiteId: 'web_boutique_caution',
        domain: 'artisan-crafts-studio.net',
        productName: 'Handcrafted Ceramic Planter',
        amount: 45.0,
        currency: 'USD',
        status: 'PROTECTED',
        escrowProtection: true,
        protectionReference: 'SAFE-849201',
        createdAt: '2026-08-24T10:00:00.000Z',
        updatedAt: '2026-08-24T10:00:00.000Z',
        timeline: [
          {
            status: 'PENDING',
            timestamp: '2026-08-24T10:00:00.000Z',
            note: 'Sandbox transaction started.'
          },
          {
            status: 'PROTECTED',
            timestamp: '2026-08-24T10:00:15.000Z',
            note: 'SafeCart Mock Escrow Protection Activated. Funds held safely in sandbox.'
          }
        ]
      },
      {
        id: 'tx_sandbox_1002',
        userId: 'usr_shopper_01',
        userName: 'Elena Rostova',
        userEmail: 'user@safecart.security',
        websiteId: 'web_scam_luxury_top',
        domain: 'luxury-watches-clearance.top',
        productName: 'Vintage Chronograph Watch Demo',
        amount: 119.0,
        currency: 'USD',
        status: 'REFUNDED',
        escrowProtection: true,
        protectionReference: 'SAFE-392184',
        createdAt: '2026-08-22T11:00:00.000Z',
        updatedAt: '2026-08-23T15:00:00.000Z',
        timeline: [
          {
            status: 'PROTECTED',
            timestamp: '2026-08-22T11:00:00.000Z',
            note: 'Sandbox demo transaction protected.'
          },
          {
            status: 'REFUND_REQUESTED',
            timestamp: '2026-08-23T09:30:00.000Z',
            note: 'Refund requested: Seller failed to supply valid tracking.'
          },
          {
            status: 'REFUNDED',
            timestamp: '2026-08-23T15:00:00.000Z',
            note: 'Demo refund processed and mock balance returned to buyer.'
          }
        ]
      }
    ];

    this.paymentProvider.seedTransactions(sampleTxs);

    // 5. Pre-seeded Admin Audit Actions
    const sampleActions: AdminAction[] = [
      {
        id: 'act_001',
        adminId: 'usr_admin_01',
        adminEmail: 'admin@safecart.security',
        actionType: 'UPDATE_REPORT_STATUS',
        targetType: 'REPORT',
        targetId: 'rep_001',
        details: 'Confirmed report rep_001 for mega-discounts-direct88.shop as fraudulent seller.',
        timestamp: '2026-08-20T10:00:00.000Z'
      },
      {
        id: 'act_002',
        adminId: 'usr_admin_01',
        adminEmail: 'admin@safecart.security',
        actionType: 'OVERRIDE_WEBSITE_RISK',
        targetType: 'WEBSITE',
        targetId: 'web_scam_sneaker88',
        details: 'Updated risk rating to 88 (VERY HIGH) based on corroborated non-delivery claims.',
        timestamp: '2026-08-20T10:05:00.000Z'
      }
    ];

    for (const a of sampleActions) {
      this.adminActions.set(a.id, a);
    }

    // 6. Educational Safety Tips
    this.safetyTips = [
      {
        id: 'tip_01',
        category: 'Domain & URL Verification',
        title: 'Spotting Lookalike & Typosquatted Domains',
        summary: 'Scammers frequently register domains that differ by a single character or add deceptive words to mimic reputable brands.',
        checklist: [
          'Carefully check the browser address bar for character substitutions (e.g. "arnazon.com", "paypa1.com", "nike-deals-shop.xyz").',
          'Beware of high-risk disposable TLD extensions (.top, .xyz, .buzz, .shop, .click) offering 90% brand clearances.',
          'Always bookmark your primary retailers rather than clicking links in unsolicited promotional emails or social ads.'
        ],
        severityNote: 'Critical',
        readTime: '3 min read'
      },
      {
        id: 'tip_02',
        category: 'Payment Safety',
        title: 'Dangerous Payment Methods & Advance Transfer Risks',
        summary: 'Legitimate e-commerce retailers will never demand that you bypass their standard payment gateway for direct wire transfers or gift cards.',
        checklist: [
          'Never pay via direct wire transfer, unverified peer-to-peer QR code, or cryptocurrency if buyer protection is absent.',
          'Use credit cards or buyer-protected payment platforms that offer dispute and chargeback resolution rights.',
          'Never reveal bank OTPs, UPI PINs, or card CVVs to anyone claiming to be "customer care verifying your refund".'
        ],
        severityNote: 'Critical',
        readTime: '4 min read'
      },
      {
        id: 'tip_03',
        category: 'Policy & Merchant Due Diligence',
        title: 'Identifying Missing Business Disclosures & Fake Urgency',
        summary: 'Deceptive online storefronts often lack verifiable contact details, physical corporate addresses, and transparent refund terms.',
        checklist: [
          'Look for an accessible Refund & Return Policy page stating clear return windows and warehouse return addresses.',
          'Test contact channels: send a brief query to the customer support email or test their listed phone number before ordering.',
          'Be skeptical of aggressive scarcity pressure (e.g. "Only 1 item remaining at 95% discount! Clock ends in 02:00").'
        ],
        severityNote: 'Moderate',
        readTime: '3 min read'
      },
      {
        id: 'tip_04',
        category: 'Dispute Resolution',
        title: 'What to Do if You Suspect an Online Shopping Scam',
        summary: 'Step-by-step action plan to recover funds, document evidence, and report the merchant to cybersecurity authorities.',
        checklist: [
          'Immediately contact your bank or credit card company to dispute the charge and freeze compromised cards.',
          'Preserve all digital evidence: take screenshots of the website, receipt, payment confirmations, and chat logs.',
          'File an incident report on SafeCart and report the URL to national cybercrime reporting portals.'
        ],
        severityNote: 'High',
        readTime: '5 min read'
      }
    ];
  }

  /**
   * Sync and hydrate data between in-memory store and MongoDB
   */
  public async syncWithMongoDB() {
    if (!isMongoConnected()) return;

    try {
      const usersCol = getUsersCollection();
      const websitesCol = getWebsitesCollection();
      const scansCol = getScansCollection();
      const reportsCol = getReportsCollection();
      const actionsCol = getAdminActionsCollection();
      const txCol = getTransactionsCollection();
      const tipsCol = getSafetyTipsCollection();

      if (!usersCol || !websitesCol || !scansCol || !reportsCol || !actionsCol || !txCol) {
        return;
      }

      // Check if MongoDB has existing data
      const userCount = await usersCol.countDocuments();

      if (userCount > 0) {
        // Hydrate from MongoDB
        console.log('[SafeCart MongoDB Sync] Hydrating application state from MongoDB Atlas...');

        const [dbUsers, dbWebsites, dbScans, dbReports, dbActions, dbTxs, dbTips] =
          await Promise.all([
            usersCol.find().toArray(),
            websitesCol.find().toArray(),
            scansCol.find().toArray(),
            reportsCol.find().toArray(),
            actionsCol.find().toArray(),
            txCol.find().toArray(),
            tipsCol ? tipsCol.find().toArray() : []
          ]);

        for (const u of dbUsers) this.users.set(u.id, u as User);
        for (const w of dbWebsites) this.websites.set(w.domain, w as Website);
        for (const s of dbScans) this.scans.set(s.id, s as ScanResult);
        for (const r of dbReports) this.reports.set(r.id, r as Report);
        for (const a of dbActions) this.adminActions.set(a.id, a as AdminAction);
        if (dbTxs.length > 0) {
          this.paymentProvider.seedTransactions(dbTxs as MockTransaction[]);
        }
        if (dbTips && dbTips.length > 0) {
          this.safetyTips = dbTips as SafetyTip[];
        }

        console.log(
          `[SafeCart MongoDB Sync] Hydration completed: ${this.users.size} users, ${this.websites.size} websites, ${this.reports.size} reports, ${this.scans.size} scans loaded.`
        );
      } else {
        // Seed MongoDB from initial memory state
        console.log('[SafeCart MongoDB Sync] Seeding fresh MongoDB Atlas database collections...');

        const userDocs = Array.from(this.users.values());
        const websiteDocs = Array.from(this.websites.values());
        const reportDocs = Array.from(this.reports.values());
        const actionDocs = Array.from(this.adminActions.values());
        const txDocs = this.paymentProvider.getAllTransactions();

        if (userDocs.length > 0) await usersCol.insertMany(userDocs);
        if (websiteDocs.length > 0) await websitesCol.insertMany(websiteDocs);
        if (reportDocs.length > 0) await reportsCol.insertMany(reportDocs);
        if (actionDocs.length > 0) await actionsCol.insertMany(actionDocs);
        if (txDocs.length > 0) await txCol.insertMany(txDocs);
        if (tipsCol && this.safetyTips.length > 0) await tipsCol.insertMany(this.safetyTips);

        console.log('[SafeCart MongoDB Sync] Initial seed completed to MongoDB Atlas.');
      }

      this.isInitialized = true;
    } catch (err: any) {
      console.warn('[SafeCart MongoDB Sync Error]', err?.message);
    }
  }

  // --- Async Persistent Mutators ---

  public async saveUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    try {
      const col = getUsersCollection();
      if (col) {
        await col.updateOne({ id: user.id }, { $set: user }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save User Warning]:', err?.message);
    }
    return user;
  }

  public async saveWebsite(website: Website): Promise<Website> {
    this.websites.set(website.domain, website);
    try {
      const col = getWebsitesCollection();
      if (col) {
        await col.updateOne({ domain: website.domain }, { $set: website }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save Website Warning]:', err?.message);
    }
    return website;
  }

  public async saveScan(scan: ScanResult): Promise<ScanResult> {
    this.scans.set(scan.id, scan);
    try {
      const col = getScansCollection();
      if (col) {
        await col.updateOne({ id: scan.id }, { $set: scan }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save Scan Warning]:', err?.message);
    }
    return scan;
  }

  public async saveReport(report: Report): Promise<Report> {
    this.reports.set(report.id, report);
    try {
      const col = getReportsCollection();
      if (col) {
        await col.updateOne({ id: report.id }, { $set: report }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save Report Warning]:', err?.message);
    }
    return report;
  }

  public async saveAdminAction(action: AdminAction): Promise<AdminAction> {
    this.adminActions.set(action.id, action);
    try {
      const col = getAdminActionsCollection();
      if (col) {
        await col.updateOne({ id: action.id }, { $set: action }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save Admin Action Warning]:', err?.message);
    }
    return action;
  }

  public async saveTransaction(tx: MockTransaction): Promise<MockTransaction> {
    try {
      const col = getTransactionsCollection();
      if (col) {
        await col.updateOne({ id: tx.id }, { $set: tx }, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Save Transaction Warning]:', err?.message);
    }
    return tx;
  }
}

export const db = new DataStore();

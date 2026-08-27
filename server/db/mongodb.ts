import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';
import {
  User,
  Website,
  ScanResult,
  Report,
  MockTransaction,
  AdminAction,
  SafetyTip
} from '../types';

// Default MongoDB URI provided for SafeCart Atlas deployment
const DEFAULT_MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb://ramya:ramya200@ac-dh5qxdk-shard-00-00.qjtkz6v.mongodb.net:27017,ac-dh5qxdk-shard-00-01.qjtkz6v.mongodb.net:27017,ac-dh5qxdk-shard-00-02.qjtkz6v.mongodb.net:27017/safecart?replicaSet=atlas-dh5qxd-shard-0&ssl=true&authSource=admin';

const DB_NAME = 'safecart';

let mongoClient: MongoClient | null = null;
let database: Db | null = null;
let isConnected = false;
let lastPingTime: string | null = null;
let lastPingLatencyMs: number | null = null;
let lastError: string | null = null;

export interface MongoStatusInfo {
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
}

/**
 * Initialize and connect to MongoDB Atlas
 */
export async function connectToMongoDB(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  try {
    console.log('[SafeCart MongoDB] Initializing MongoDB connection to Atlas cluster...');

    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      },
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    const startTime = Date.now();
    await mongoClient.connect();
    
    // Send a ping to confirm a successful connection as per Atlas guidelines
    await mongoClient.db('admin').command({ ping: 1 });
    const latency = Date.now() - startTime;
    
    lastPingLatencyMs = latency;
    lastPingTime = new Date().toISOString();
    isConnected = true;
    lastError = null;

    database = mongoClient.db(DB_NAME);

    console.log(
      `[SafeCart MongoDB] Pinged your deployment. You successfully connected to MongoDB! (${latency}ms)`
    );

    // Ensure necessary indexes
    await ensureIndexes();

    return database;
  } catch (err: any) {
    isConnected = false;
    lastError = err?.message || 'Failed to connect to MongoDB';
    console.warn(
      `[SafeCart MongoDB Warning] MongoDB Atlas connection notice: ${err?.message}. Operating with in-memory resilient storage.`
    );
    return null;
  }
}

/**
 * Ensure collection indexes for performance and uniqueness
 */
async function ensureIndexes() {
  if (!database) return;
  try {
    const usersCol = database.collection('users');
    await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });
    await usersCol.createIndex({ id: 1 }, { unique: true });

    const websitesCol = database.collection('websites');
    await websitesCol.createIndex({ domain: 1 }, { unique: true });
    await websitesCol.createIndex({ id: 1 }, { unique: true });
    await websitesCol.createIndex({ riskScore: 1 });

    const scansCol = database.collection('scans');
    await scansCol.createIndex({ id: 1 }, { unique: true });
    await scansCol.createIndex({ domain: 1 });
    await scansCol.createIndex({ createdAt: -1 });

    const reportsCol = database.collection('reports');
    await reportsCol.createIndex({ id: 1 }, { unique: true });
    await reportsCol.createIndex({ domain: 1 });
    await reportsCol.createIndex({ status: 1 });
    await reportsCol.createIndex({ createdAt: -1 });

    const txCol = database.collection('transactions');
    await txCol.createIndex({ id: 1 }, { unique: true });
    await txCol.createIndex({ userId: 1 });

    const actionsCol = database.collection('adminActions');
    await actionsCol.createIndex({ id: 1 }, { unique: true });
    await actionsCol.createIndex({ timestamp: -1 });

    console.log('[SafeCart MongoDB] Collection indexes verified successfully.');
  } catch (err: any) {
    console.warn('[SafeCart MongoDB] Index setup notice:', err?.message);
  }
}

export function getDatabase(): Db | null {
  return database;
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export async function getMongoStatus(): Promise<MongoStatusInfo> {
  let counts: MongoStatusInfo['collections'] = {};

  if (database && isConnected) {
    try {
      const pingStart = Date.now();
      await mongoClient?.db('admin').command({ ping: 1 });
      lastPingLatencyMs = Date.now() - pingStart;
      lastPingTime = new Date().toISOString();

      const [users, websites, scans, reports, adminActions, transactions, safetyTips] =
        await Promise.all([
          database.collection('users').countDocuments().catch(() => 0),
          database.collection('websites').countDocuments().catch(() => 0),
          database.collection('scans').countDocuments().catch(() => 0),
          database.collection('reports').countDocuments().catch(() => 0),
          database.collection('adminActions').countDocuments().catch(() => 0),
          database.collection('transactions').countDocuments().catch(() => 0),
          database.collection('safetyTips').countDocuments().catch(() => 0)
        ]);

      counts = {
        users,
        websites,
        scans,
        reports,
        adminActions,
        transactions,
        safetyTips
      };
    } catch (err: any) {
      lastError = err?.message;
    }
  }

  return {
    connected: isConnected,
    dbName: DB_NAME,
    cluster: 'cluster0.qjtkz6v.mongodb.net',
    lastPing: lastPingTime,
    pingLatencyMs: lastPingLatencyMs,
    error: lastError,
    collections: counts
  };
}

// Typed collection getters
export function getUsersCollection(): Collection<User> | null {
  return database ? database.collection<User>('users') : null;
}

export function getWebsitesCollection(): Collection<Website> | null {
  return database ? database.collection<Website>('websites') : null;
}

export function getScansCollection(): Collection<ScanResult> | null {
  return database ? database.collection<ScanResult>('scans') : null;
}

export function getReportsCollection(): Collection<Report> | null {
  return database ? database.collection<Report>('reports') : null;
}

export function getAdminActionsCollection(): Collection<AdminAction> | null {
  return database ? database.collection<AdminAction>('adminActions') : null;
}

export function getTransactionsCollection(): Collection<MockTransaction> | null {
  return database ? database.collection<MockTransaction>('transactions') : null;
}

export function getSafetyTipsCollection(): Collection<SafetyTip> | null {
  return database ? database.collection<SafetyTip>('safetyTips') : null;
}

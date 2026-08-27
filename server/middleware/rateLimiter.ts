import { Request, Response, NextFunction } from 'express';

interface RateRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateRecord>();

export function createRateLimiter(maxRequests = 60, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment before trying again.',
        errorCode: 'RATE_LIMIT_EXCEEDED'
      });
    }

    record.count++;
    next();
  };
}

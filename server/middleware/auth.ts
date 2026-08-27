import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store';
import { UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'safecard_JWT_2026_8FK2XP9MQ7';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export function generateToken(user: { id: string; email: string; role: UserRole; name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole; name: string };
    const existing = db.users.get(decoded.id);
    if (existing) {
      req.user = {
        id: existing.id,
        email: existing.email,
        role: existing.role,
        name: existing.name
      };
    }
  } catch (err) {
    // Ignore expired or invalid optional token
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
      errorCode: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole; name: string };
    const existing = db.users.get(decoded.id);
    if (!existing) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user no longer exists.',
        errorCode: 'INVALID_SESSION'
      });
    }

    req.user = {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      name: existing.name
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
      errorCode: 'TOKEN_EXPIRED'
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required.',
        errorCode: 'ADMIN_FORBIDDEN'
      });
    }
    next();
  });
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/index.js';
import { UserRepository } from '../repositories/UserRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supplysync_b2b_secret_key_2026';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const userRepository = new UserRepository();

/**
 * Authentication Middleware
 * Supports standard Bearer JWT token or 'x-demo-role' header for demo ergonomics.
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const demoRole = req.headers['x-demo-role'] as string | undefined;

  // 1. If Bearer token is provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
      return next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  }

  // 2. Demo Mode Ergonomics: Support seamless role simulation via x-demo-role header
  if (demoRole) {
    const users = await userRepository.findByRole(demoRole.toUpperCase());
    if (users.length > 0) {
      req.user = {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        name: users[0].name,
      };
      return next();
    }
  }

  res.status(401).json({ error: 'Authentication required' });
};

/**
 * RBAC Middleware: Require specific user roles
 * e.g., requireRole(['BROKER'])
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

/**
 * Optional Authentication: Populates req.user if token is present, but doesn't block unauthenticated calls
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    } catch {}
  }
  next();
};

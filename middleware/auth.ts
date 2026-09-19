import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true, branch: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

export function isPlatformOwner(req: AuthRequest): boolean {
  return req.user?.company?.isPlatformOwner === true;
}

// A company can manage its own data; the platform-owner company can manage any company's.
export function hasCompanyAccess(req: AuthRequest, targetCompanyId: number): boolean {
  return req.user?.companyId === targetCompanyId || isPlatformOwner(req);
}

export const requirePlatformOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!isPlatformOwner(req)) {
    return res.status(403).json({ error: 'Forbidden: platform owner access required' });
  }
  next();
};















































































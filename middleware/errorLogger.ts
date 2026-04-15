import type { NextFunction, Response } from 'express';
import type { AuthRequest } from './auth';
import { prisma } from '../lib/prisma';
import { createExceptionLog } from '../controllers/exceptionLogController';

function getClientIp(req: any): string | undefined {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]?.trim();
  return req.ip || req.socket?.remoteAddress;
}

export async function errorLoggerMiddleware(
  err: any,
  req: AuthRequest,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  try {
    const userId = req.userId ?? null;
    let companyId: number | null = null;
    let branchId: number | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, branchId: true }
      });
      companyId = user?.companyId ?? null;
      branchId = user?.branchId ?? null;
    }

    const type = err?.name || 'Error';
    const message = err?.message || 'Unknown error';
    const stack = err?.stack || null;

    // naive severity mapping; can be expanded later
    const severity =
      err?.status >= 500 ? 'critical' :
      err?.status >= 400 ? 'medium' :
      'high';

    await createExceptionLog(
      type,
      severity,
      message,
      stack,
      'Backend',
      userId,
      companyId,
      branchId,
      req.originalUrl,
      req.method,
      req.headers['user-agent']?.toString(),
      getClientIp(req),
      {
        status: err?.status,
        body: req.body,
        query: req.query,
        params: req.params
      }
    );
  } catch (e) {
    // Never block response if logging fails
    console.error('Error logger middleware failed:', e);
  }

  const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    error: err?.message || 'Internal server error'
  });
}




















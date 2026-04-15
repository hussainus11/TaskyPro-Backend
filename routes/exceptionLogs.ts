import express from 'express';
import { authenticate } from '../middleware/auth';
import { getExceptionLogs, updateExceptionLog, deleteExceptionLog } from '../controllers/exceptionLogController';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.use(authenticate);

router.get('/', getExceptionLogs);

// Client-side exception capture endpoint
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).userId as number | undefined;
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true, branchId: true } })
      : null;

    const {
      type,
      severity,
      message,
      stack,
      source,
      requestUrl,
      requestMethod,
      userAgent,
      ipAddress,
      metadata,
    } = req.body ?? {};

    const log = await prisma.exceptionLog.create({
      data: {
        type: type || 'Error',
        severity: severity || 'high',
        message: message || 'Unknown client error',
        stack: stack || null,
        source: source || 'Frontend',
        userId: userId ?? null,
        companyId: user?.companyId ?? null,
        branchId: user?.branchId ?? null,
        requestUrl: requestUrl || null,
        requestMethod: requestMethod || null,
        userAgent: userAgent || req.headers['user-agent']?.toString() || null,
        ipAddress: ipAddress || req.ip || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      }
    });

    res.status(201).json(log);
  } catch (error: any) {
    console.error('Create exception log error:', error);
    res.status(500).json({ error: 'Failed to create exception log', details: error.message });
  }
});

router.put('/:id', updateExceptionLog);
router.delete('/:id', deleteExceptionLog);

export default router;




















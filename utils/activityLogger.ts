import { prisma } from '../lib/prisma';

export interface ActivityLogParams {
  type: string;
  message: string;
  userId?: number;
  companyId?: number;
  branchId?: number;
  entityType?: string;
  entityId?: number;
}

/**
 * Utility function to log activities automatically
 * This should be called whenever a user performs an action that should be tracked
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type: params.type,
        message: params.message,
        userId: params.userId || null,
        companyId: params.companyId || null,
        branchId: params.branchId || null,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
      },
    });
  } catch (error: any) {
    // Don't throw error - activity logging should not break the main operation
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper to get user and company/branch info for activity logging
 */
export async function getUserContext(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        companyId: true,
        branchId: true,
      }
    });
    return user;
  } catch (error) {
    console.error('Failed to get user context:', error);
    return null;
  }
}





























































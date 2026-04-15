import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// Get all permissions for a section
export const getSectionPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = user.companyId;
    const branchId = user.branchId;

    const permissions = await prisma.formSectionPermission.findMany({
      where: {
        sectionId: parseInt(sectionId),
        companyId: companyId || null,
        branchId: branchId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    res.json(permissions);
  } catch (error: any) {
    console.error('Error fetching section permissions:', error);
    res.status(500).json({ error: 'Failed to fetch section permissions', details: error.message });
  }
};

// Update or create section permission for a user
export const updateSectionPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { userId, canView } = req.body;
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = currentUser.companyId;
    const branchId = currentUser.branchId;

    if (!companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Verify the section exists and belongs to the company
    const section = await prisma.formSection.findUnique({
      where: { id: parseInt(sectionId) },
      select: { companyId: true },
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (section.companyId !== companyId) {
      return res.status(403).json({ error: 'You can only manage permissions for sections in your company' });
    }

    // Verify the target user belongs to the same company/branch
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { companyId: true, branchId: true },
    });

    if (!targetUser || targetUser.companyId !== companyId) {
      return res.status(400).json({ error: 'User must belong to the same company' });
    }

    if (branchId && targetUser.branchId !== branchId) {
      return res.status(400).json({ error: 'User must belong to the same branch' });
    }

    // Find existing permission
    const existingPermission = await prisma.formSectionPermission.findFirst({
      where: {
        sectionId: parseInt(sectionId),
        userId: parseInt(userId),
        companyId: companyId,
        branchId: branchId || null,
      },
    });

    // Update or create permission
    const permission = existingPermission
      ? await prisma.formSectionPermission.update({
          where: { id: existingPermission.id },
          data: {
            canView: canView === true || canView === 'true',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        })
      : await prisma.formSectionPermission.create({
          data: {
            sectionId: parseInt(sectionId),
            userId: parseInt(userId),
            companyId: companyId,
            branchId: branchId || null,
            canView: canView === true || canView === 'true',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

    res.json(permission);
  } catch (error: any) {
    console.error('Error updating section permission:', error);
    res.status(500).json({ error: 'Failed to update section permission', details: error.message });
  }
};

// Get all permissions for a field
export const getFieldPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = user.companyId;
    const branchId = user.branchId;

    const permissions = await prisma.formFieldPermission.findMany({
      where: {
        fieldId: parseInt(fieldId),
        companyId: companyId || null,
        branchId: branchId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    res.json(permissions);
  } catch (error: any) {
    console.error('Error fetching field permissions:', error);
    res.status(500).json({ error: 'Failed to fetch field permissions', details: error.message });
  }
};

// Update or create field permission for a user
export const updateFieldPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const { userId, canView } = req.body;
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = currentUser.companyId;
    const branchId = currentUser.branchId;

    if (!companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Verify the field exists and belongs to a section in the company
    const field = await prisma.formField.findUnique({
      where: { id: parseInt(fieldId) },
      include: {
        section: {
          select: { companyId: true },
        },
      },
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field.section.companyId !== companyId) {
      return res.status(403).json({ error: 'You can only manage permissions for fields in your company' });
    }

    // Verify the target user belongs to the same company/branch
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { companyId: true, branchId: true },
    });

    if (!targetUser || targetUser.companyId !== companyId) {
      return res.status(400).json({ error: 'User must belong to the same company' });
    }

    if (branchId && targetUser.branchId !== branchId) {
      return res.status(400).json({ error: 'User must belong to the same branch' });
    }

    // Find existing permission
    const existingPermission = await prisma.formFieldPermission.findFirst({
      where: {
        fieldId: parseInt(fieldId),
        userId: parseInt(userId),
        companyId: companyId,
        branchId: branchId || null,
      },
    });

    // Update or create permission
    const permission = existingPermission
      ? await prisma.formFieldPermission.update({
          where: { id: existingPermission.id },
          data: {
            canView: canView === true || canView === 'true',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        })
      : await prisma.formFieldPermission.create({
          data: {
            fieldId: parseInt(fieldId),
            userId: parseInt(userId),
            companyId: companyId,
            branchId: branchId || null,
            canView: canView === true || canView === 'true',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

    res.json(permission);
  } catch (error: any) {
    console.error('Error updating field permission:', error);
    res.status(500).json({ error: 'Failed to update field permission', details: error.message });
  }
};

// Bulk update section permissions for multiple users
export const bulkUpdateSectionPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId } = req.params;
    const { permissions } = req.body; // Array of { userId, canView }
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = currentUser.companyId;
    const branchId = currentUser.branchId;

    if (!companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Verify the section exists and belongs to the company
    const section = await prisma.formSection.findUnique({
      where: { id: parseInt(sectionId) },
      select: { companyId: true },
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    if (section.companyId !== companyId) {
      return res.status(403).json({ error: 'You can only manage permissions for sections in your company' });
    }

    // Update all permissions
    const results = await Promise.all(
      permissions.map(async (perm: { userId: number; canView: boolean }) => {
        // Find existing permission (can't use upsert with null in unique constraint)
        const existing = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: parseInt(sectionId),
            userId: perm.userId,
            companyId: companyId,
            branchId: branchId || null,
          },
        });

        // Update or create
        if (existing) {
          return await prisma.formSectionPermission.update({
            where: { id: existing.id },
            data: {
              canView: perm.canView === true || perm.canView === 'true',
            },
          });
        } else {
          return await prisma.formSectionPermission.create({
            data: {
              sectionId: parseInt(sectionId),
              userId: perm.userId,
              companyId: companyId,
              branchId: branchId || null,
              canView: perm.canView === true || perm.canView === 'true',
            },
          });
        }
      })
    );

    res.json({ success: true, updated: results.length });
  } catch (error: any) {
    console.error('Error bulk updating section permissions:', error);
    res.status(500).json({ error: 'Failed to update section permissions', details: error.message });
  }
};

// Bulk update field permissions for multiple users
export const bulkUpdateFieldPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const { permissions } = req.body; // Array of { userId, canView }
    const currentUser = req.user;
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = currentUser.companyId;
    const branchId = currentUser.branchId;

    if (!companyId) {
      return res.status(400).json({ error: 'User must belong to a company' });
    }

    // Verify the field exists and belongs to a section in the company
    const field = await prisma.formField.findUnique({
      where: { id: parseInt(fieldId) },
      include: {
        section: {
          select: { companyId: true },
        },
      },
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field.section.companyId !== companyId) {
      return res.status(403).json({ error: 'You can only manage permissions for fields in your company' });
    }

    // Update all permissions
    const results = await Promise.all(
      permissions.map(async (perm: { userId: number; canView: boolean }) => {
        // Find existing permission (can't use upsert with null in unique constraint)
        const existing = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: parseInt(fieldId),
            userId: perm.userId,
            companyId: companyId,
            branchId: branchId || null,
          },
        });

        // Update or create
        if (existing) {
          return await prisma.formFieldPermission.update({
            where: { id: existing.id },
            data: {
              canView: perm.canView === true || perm.canView === 'true',
            },
          });
        } else {
          return await prisma.formFieldPermission.create({
            data: {
              fieldId: parseInt(fieldId),
              userId: perm.userId,
              companyId: companyId,
              branchId: branchId || null,
              canView: perm.canView === true || perm.canView === 'true',
            },
          });
        }
      })
    );

    res.json({ success: true, updated: results.length });
  } catch (error: any) {
    console.error('Error bulk updating field permissions:', error);
    res.status(500).json({ error: 'Failed to update field permissions', details: error.message });
  }
};


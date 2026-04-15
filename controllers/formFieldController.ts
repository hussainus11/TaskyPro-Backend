import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getFields = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sectionId } = req.query;
    const companyId = user.companyId;
    const branchId = user.branchId;
    
    if (!sectionId) {
      return res.status(400).json({ error: 'sectionId is required' });
    }

    const sectionIdNum = parseInt(sectionId as string);
    
    // First check if user has access to the section
    const sectionPermission = await prisma.formSectionPermission.findFirst({
      where: {
        sectionId: sectionIdNum,
        userId: userId,
        companyId: companyId || null,
        branchId: branchId || null,
      },
    });

    // If no permission exists or canView is false, user doesn't have access
    if (sectionPermission && !sectionPermission.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this section' });
    }

    // Get all fields for the section
    const allFields = await prisma.formField.findMany({
      where: { sectionId: sectionIdNum },
      orderBy: { order: 'asc' }
    });

    // Filter fields based on user permissions
    const fieldsWithPermissions = await Promise.all(
      allFields.map(async (field) => {
        const fieldPermission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: field.id,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId || null,
          },
        });

        // Default behavior: if no permission record exists, user has access
        const hasAccess = !fieldPermission || fieldPermission.canView;
        return hasAccess ? field : null;
      })
    );

    // Filter out null fields
    const accessibleFields = fieldsWithPermissions.filter((f) => f !== null);
    
    res.json(accessibleFields);
  } catch (error: any) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields', details: error.message });
  }
};

export const getFieldById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const companyId = user.companyId;
    const branchId = user.branchId;
    
    const field = await prisma.formField.findUnique({
      where: { id: parseInt(id) },
      include: { section: true },
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // First check if user has access to the section
    const sectionPermission = await prisma.formSectionPermission.findFirst({
      where: {
        sectionId: field.sectionId,
        userId: userId,
        companyId: companyId || null,
        branchId: branchId || null,
      },
    });

    // If section permission exists and canView is false, user doesn't have access
    if (sectionPermission && !sectionPermission.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this section' });
    }

    // Check field permission
    const fieldPermission = await prisma.formFieldPermission.findFirst({
      where: {
        fieldId: field.id,
        userId: userId,
        companyId: companyId || null,
        branchId: branchId || null,
      },
    });

    // If field permission exists and canView is false, user doesn't have access
    if (fieldPermission && !fieldPermission.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this field' });
    }

    res.json(field);
  } catch (error: any) {
    console.error('Error fetching field:', error);
    res.status(500).json({ error: 'Failed to fetch field', details: error.message });
  }
};

export const createField = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { label, type, value, options, required, sectionId, order } = req.body;
    
    // Get the section to determine company/branch
    const section = await prisma.formSection.findUnique({
      where: { id: parseInt(sectionId) },
      select: { companyId: true },
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const companyId = section.companyId || user.companyId;
    const branchId = user.branchId;
    
    const field = await prisma.formField.create({
      data: {
        label,
        type,
        value: value || null,
        options: options || [],
        required: required || false,
        sectionId: parseInt(sectionId),
        order: order || 0,
      }
    });

    // Create default permissions for all users in the company/branch
    if (companyId) {
      const users = await prisma.user.findMany({
        where: {
          companyId: companyId,
          ...(branchId ? { branchId: branchId } : { branchId: null }),
        },
        select: { id: true },
      });

      // Create field permissions for all users
      await prisma.formFieldPermission.createMany({
        data: users.map((u) => ({
          fieldId: field.id,
          userId: u.id,
          companyId: companyId,
          branchId: branchId || null,
          canView: true,
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json(field);
  } catch (error: any) {
    console.error('Error creating field:', error);
    res.status(500).json({ error: 'Failed to create field', details: error.message });
  }
};

export const updateField = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, type, value, options, required, order } = req.body;
    
    const field = await prisma.formField.update({
      where: { id: parseInt(id) },
      data: { label, type, value, options, required, order }
    });
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update field' });
  }
};

export const deleteField = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.formField.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete field' });
  }
};

export const reorderFields = async (req: Request, res: Response) => {
  try {
    const { fieldIds } = req.body; // Array of field IDs in new order
    
    const updates = fieldIds.map((fieldId: number, index: number) =>
      prisma.formField.update({
        where: { id: fieldId },
        data: { order: index }
      })
    );
    
    await Promise.all(updates);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder fields' });
  }
};



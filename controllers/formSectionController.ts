import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const companyId = user.companyId;
    const branchId = user.branchId;
    const { companyId: queryCompanyId } = req.query;
    
    const filterCompanyId = queryCompanyId ? parseInt(queryCompanyId as string) : companyId;
    const where: any = filterCompanyId ? { companyId: filterCompanyId } : {};
    
    // Get all sections for the company
    const allSections = await prisma.formSection.findMany({
      where,
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Filter sections based on user permissions
    const sectionsWithPermissions = await Promise.all(
      allSections.map(async (section) => {
        // Check if user has permission to view this section
        // Try branch-specific permission first, then company-wide (branchId: null)
        let permission = null;
        
        // First, try to find branch-specific permission
        if (branchId) {
          permission = await prisma.formSectionPermission.findFirst({
            where: {
              sectionId: section.id,
              userId: userId,
              companyId: filterCompanyId || null,
              branchId: branchId,
            },
          });
        }
        
        // If not found, try company-wide permission (branchId: null)
        if (!permission) {
          permission = await prisma.formSectionPermission.findFirst({
            where: {
              sectionId: section.id,
              userId: userId,
              companyId: filterCompanyId || null,
              branchId: null,
            },
          });
        }

        // If no explicit permission exists, check if there's a default permission (all users have access)
        // Default behavior: if no permission record exists, user has access
        // If permission exists and canView is false, deny access
        const hasAccess = !permission || permission.canView;

        if (!hasAccess) {
          return null; // User doesn't have access to this section
        }

        // Filter fields based on user permissions
        const fieldsWithPermissions = await Promise.all(
          section.fields.map(async (field) => {
            // Try branch-specific permission first, then company-wide (branchId: null)
            let fieldPermission = null;
            
            // First, try to find branch-specific permission
            if (branchId) {
              fieldPermission = await prisma.formFieldPermission.findFirst({
                where: {
                  fieldId: field.id,
                  userId: userId,
                  companyId: filterCompanyId || null,
                  branchId: branchId,
                },
              });
            }
            
            // If not found, try company-wide permission (branchId: null)
            if (!fieldPermission) {
              fieldPermission = await prisma.formFieldPermission.findFirst({
                where: {
                  fieldId: field.id,
                  userId: userId,
                  companyId: filterCompanyId || null,
                  branchId: null,
                },
              });
            }

            // Default behavior: if no permission record exists, user has access
            // If permission exists and canView is false, deny access
            const fieldHasAccess = !fieldPermission || fieldPermission.canView;
            return fieldHasAccess ? field : null;
          })
        );

        // Return section with filtered fields
        return {
          ...section,
          fields: fieldsWithPermissions.filter((f) => f !== null),
        };
      })
    );

    // Filter out null sections (sections user doesn't have access to)
    const accessibleSections = sectionsWithPermissions.filter((s) => s !== null);
    
    res.json(accessibleSections);
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections', details: error.message });
  }
};

export const getSectionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const companyId = user.companyId;
    const branchId = user.branchId;
    
    const section = await prisma.formSection.findUnique({
      where: { id: parseInt(id) },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Check if user has permission to view this section
    const permission = await prisma.formSectionPermission.findFirst({
      where: {
        sectionId: section.id,
        userId: userId,
        companyId: companyId || null,
        branchId: branchId || null,
      },
    });

    // If no permission exists or canView is false, user doesn't have access
    if (permission && !permission.canView) {
      return res.status(403).json({ error: 'You do not have permission to view this section' });
    }

    // Filter fields based on user permissions
    const fieldsWithPermissions = await Promise.all(
      section.fields.map(async (field) => {
        const fieldPermission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: field.id,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId || null,
          },
        });

        // Default behavior: if no permission record exists, user has access
        const fieldHasAccess = !fieldPermission || fieldPermission.canView;
        return fieldHasAccess ? field : null;
      })
    );

    // Return section with filtered fields
    res.json({
      ...section,
      fields: fieldsWithPermissions.filter((f) => f !== null),
    });
  } catch (error: any) {
    console.error('Error fetching section:', error);
    res.status(500).json({ error: 'Failed to fetch section', details: error.message });
  }
};

export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = req.user;
    
    if (!userId || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, companyId, isDefault, order, fields } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Section title is required' });
    }
    
    const finalCompanyId = companyId ? parseInt(companyId) : user.companyId;
    const finalBranchId = user.branchId;
    
    // Create section with fields
    const section = await prisma.formSection.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        companyId: finalCompanyId || null,
        isDefault: isDefault || false,
        order: order || 0,
        fields: {
          create: (fields || []).map((field: any, index: number) => ({
            label: field.label,
            type: field.type, // Prisma will validate enum
            value: field.value || null,
            options: field.options || [],
            required: field.required || false,
            order: field.order !== undefined ? field.order : index,
          }))
        }
      },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    // Create default permissions for all users in the company/branch
    if (finalCompanyId) {
      const users = await prisma.user.findMany({
        where: {
          companyId: finalCompanyId,
          ...(finalBranchId ? { branchId: finalBranchId } : { branchId: null }),
        },
        select: { id: true },
      });

      // Create section permissions for all users
      await prisma.formSectionPermission.createMany({
        data: users.map((u) => ({
          sectionId: section.id,
          userId: u.id,
          companyId: finalCompanyId,
          branchId: finalBranchId || null,
          canView: true,
        })),
        skipDuplicates: true,
      });

      // Create field permissions for all users
      if (section.fields.length > 0) {
        const fieldPermissions = users.flatMap((u) =>
          section.fields.map((field) => ({
            fieldId: field.id,
            userId: u.id,
            companyId: finalCompanyId,
            branchId: finalBranchId || null,
            canView: true,
          }))
        );

        await prisma.formFieldPermission.createMany({
          data: fieldPermissions,
          skipDuplicates: true,
        });
      }
    }

    res.status(201).json(section);
  } catch (error: any) {
    console.error('Error creating section:', error);
    res.status(500).json({ 
      error: 'Failed to create section', 
      details: error.message,
      code: error.code 
    });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, order, companyId } = req.body;
    
    const section = await prisma.formSection.update({
      where: { id: parseInt(id) },
      data: { 
        title, 
        description, 
        order,
        companyId: companyId !== undefined ? (companyId ? parseInt(companyId) : null) : undefined
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.formSection.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
};


import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all custom fields for a company/branch
export const getCustomFields = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      // If company but no branch, get company-wide custom fields
      where.branchId = null;
    }

    const customFields = await prisma.customField.findMany({
      where,
      orderBy: [
        { entity: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get form designer fields from FormSection/FormField
    // FormSection only has companyId (no branchId), so we get company-wide sections
    const formSections = await prisma.formSection.findMany({
      where: {
        companyId: filterCompanyId || undefined,
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Transform FormField to CustomField format
    const formDesignerFields: any[] = [];
    for (const section of formSections) {
      for (const field of section.fields) {
        // Map FormField type to CustomField type
        let fieldType = field.type.toLowerCase();
        // Handle different field type mappings
        if (fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') {
          fieldType = 'select';
        } else if (fieldType === 'textarea') {
          fieldType = 'textarea';
        } else if (fieldType === 'email') {
          fieldType = 'email';
        } else if (fieldType === 'phone' || fieldType === 'tel') {
          fieldType = 'phone';
        } else if (fieldType === 'date' || fieldType === 'datetime') {
          fieldType = 'date';
        } else if (fieldType === 'number') {
          fieldType = 'number';
        } else {
          fieldType = 'text';
        }

        // Try to determine entity from section title or use a default
        // You may need to adjust this based on how your form designer stores entity info
        const entity = 'custom'; // Default entity, adjust based on your form designer structure

        formDesignerFields.push({
          id: 1000000 + field.id, // Use large offset to avoid conflicts with CustomField IDs
          name: field.label,
          type: fieldType,
          entity: entity,
          required: field.required || false,
          includeInReports: false, // Form designer fields don't have this flag
          options: field.options && field.options.length > 0 ? field.options : null,
          companyId: section.companyId,
          branchId: null, // FormSection doesn't have branchId
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
          _source: 'form_designer', // Flag to identify source
          _sectionId: section.id,
          _sectionTitle: section.title,
        });
      }
    }

    // Merge both arrays
    const allFields = [...customFields, ...formDesignerFields];

    // Sort by entity and name
    allFields.sort((a, b) => {
      if (a.entity !== b.entity) {
        return a.entity.localeCompare(b.entity);
      }
      return a.name.localeCompare(b.name);
    });

    res.json(allFields);
  } catch (error: any) {
    console.error('Get custom fields error:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields', details: error.message });
  }
};

// Create a custom field
export const createCustomField = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { name, type, entity, required, includeInReports, options } = req.body;
    const userId = req.userId;

    if (!name || !type || !entity) {
      return res.status(400).json({ error: 'Name, type, and entity are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customField = await prisma.customField.create({
      data: {
        name,
        type,
        entity,
        required: required !== undefined ? required : false,
        includeInReports: includeInReports !== undefined ? includeInReports : false,
        options: options ? options : null,
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    // Log activity for custom field creation
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'custom_field_created',
        message: `${userContext.name || 'User'} created custom field "${name}"`,
        userId: userContext.id,
        companyId: customField.companyId || userContext.companyId || undefined,
        branchId: customField.branchId || userContext.branchId || undefined,
        entityType: 'CUSTOM_FIELD',
        entityId: customField.id,
      });
    }

    res.status(201).json(customField);
  } catch (error: any) {
    console.error('Create custom field error:', error);
    res.status(500).json({ error: 'Failed to create custom field', details: error.message });
  }
};

// Update a custom field
export const updateCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, entity, required, includeInReports, options } = req.body;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: parseInt(id) }
    });

    if (!customField) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    // Check if custom field belongs to user's company/branch
    if (customField.companyId !== user.companyId || 
        (customField.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (entity !== undefined) updateData.entity = entity;
    if (required !== undefined) updateData.required = required;
    if (includeInReports !== undefined) updateData.includeInReports = includeInReports;
    if (options !== undefined) updateData.options = options || null;

    const updatedCustomField = await prisma.customField.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Log activity for custom field update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'custom_field_updated',
        message: `${userContext.name || 'User'} updated custom field "${updatedCustomField.name}"`,
        userId: userContext.id,
        companyId: updatedCustomField.companyId || userContext.companyId || undefined,
        branchId: updatedCustomField.branchId || userContext.branchId || undefined,
        entityType: 'CUSTOM_FIELD',
        entityId: updatedCustomField.id,
      });
    }

    res.json(updatedCustomField);
  } catch (error: any) {
    console.error('Update custom field error:', error);
    res.status(500).json({ error: 'Failed to update custom field', details: error.message });
  }
};

// Delete a custom field
export const deleteCustomField = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customField = await prisma.customField.findUnique({
      where: { id: parseInt(id) }
    });

    if (!customField) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    // Check if custom field belongs to user's company/branch
    if (customField.companyId !== user.companyId || 
        (customField.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for custom field deletion
    const userContext = await getUserContext(userId);
    if (userContext && customField) {
      await logActivity({
        type: 'custom_field_deleted',
        message: `${userContext.name || 'User'} deleted custom field "${customField.name}"`,
        userId: userContext.id,
        companyId: customField.companyId || userContext.companyId || undefined,
        branchId: customField.branchId || userContext.branchId || undefined,
        entityType: 'CUSTOM_FIELD',
        entityId: parseInt(id),
      });
    }

    await prisma.customField.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete custom field error:', error);
    res.status(500).json({ error: 'Failed to delete custom field', details: error.message });
  }
};









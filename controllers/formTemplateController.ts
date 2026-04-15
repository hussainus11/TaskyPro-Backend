import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { createCustomEntityTable } from "../utils/customEntityTable";
import { logActivity, getUserContext } from '../utils/activityLogger';

// Helper function to sync sections and fields to database and return updated JSON with dbIds
async function syncSectionsAndFieldsToDatabase(
  sections: any[],
  formFields: any[],
  companyId: number | null,
  branchId: number | null
): Promise<{ sections: any[], formFields: any[] }> {
  const updatedSections: any[] = [];
  const updatedFields: any[] = [];

  // Sync sections first
  for (const section of sections || []) {
    let sectionDbId = section.dbId;

    if (sectionDbId) {
      // Update existing section
      try {
        await prisma.formSection.update({
          where: { id: sectionDbId },
          data: {
            title: section.title,
            description: section.description || null,
            order: section.order || 0,
          },
        });
        console.log(`Updated section ${sectionDbId}: ${section.title}`);
      } catch (error: any) {
        console.error(`Error updating section ${sectionDbId}:`, error);
        // If update fails (section might have been deleted), create a new one
        sectionDbId = null;
      }
    }
    
    if (!sectionDbId) {
      // Create new section
      const newSection = await prisma.formSection.create({
        data: {
          title: section.title,
          description: section.description || null,
          order: section.order || 0,
          companyId: companyId || null,
          isDefault: false,
        },
      });
      sectionDbId = newSection.id;
      console.log(`Created new section ${sectionDbId}: ${section.title}`);

      // Create default permissions for all users in the company/branch
      if (companyId) {
        const users = await prisma.user.findMany({
          where: {
            companyId: companyId,
            ...(branchId ? { branchId: branchId } : { branchId: null }),
          },
          select: { id: true },
        });

        if (users.length > 0) {
          await prisma.formSectionPermission.createMany({
            data: users.map((u) => ({
              sectionId: sectionDbId,
              userId: u.id,
              companyId: companyId,
              branchId: branchId || null,
              canView: true,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    updatedSections.push({
      ...section,
      dbId: sectionDbId,
    });
  }

  // Sync fields
  for (const field of formFields || []) {
    let fieldDbId = field.dbId;
    // Try to find the section's dbId by matching the section's string id with field's sectionId
    let sectionDbId = null;
    if (field.sectionId) {
      const matchingSection = updatedSections.find(s => s.id === field.sectionId);
      sectionDbId = matchingSection?.dbId || null;
      
      // If not found in updated sections, try to find existing section in database
      if (!sectionDbId && fieldDbId) {
        const existingField = await prisma.formField.findUnique({
          where: { id: fieldDbId },
          select: { sectionId: true },
        });
        if (existingField) {
          sectionDbId = existingField.sectionId;
        }
      }
    }

    // Map form template field type to database FieldType enum
    const fieldTypeMap: Record<string, string> = {
      'text': 'text',
      'email': 'email',
      'phone': 'phone',
      'textarea': 'textarea',
      'select': 'select',
      'number': 'number',
      'url': 'url',
      'image': 'image',
    };
    
    const dbFieldType = fieldTypeMap[field.type] || 'text'; // Default to 'text' if type not found
    
    // Convert options array to string array if needed
    const optionsArray = Array.isArray(field.options) 
      ? field.options.map((opt: any) => typeof opt === 'string' ? opt : (opt.value || opt.label || String(opt)))
      : [];

    if (fieldDbId) {
      // Update existing field
      try {
        await prisma.formField.update({
          where: { id: fieldDbId },
          data: {
            label: field.label,
            type: dbFieldType as any,
            value: field.value || field.defaultValue || null,
            options: optionsArray,
            required: field.required || false,
            order: field.order || 0,
            ...(sectionDbId ? { sectionId: sectionDbId } : {}),
          },
        });
        console.log(`Updated field ${fieldDbId}: ${field.label}`);
      } catch (error: any) {
        console.error(`Error updating field ${fieldDbId}:`, error);
        // If update fails (field might have been deleted), create a new one
        fieldDbId = null;
      }
    }
    
    if (!fieldDbId) {
      // Create new field
      if (!sectionDbId) {
        // Field without section - skip or create in a default section
        console.warn('Field without section, skipping database sync:', field.label);
        updatedFields.push({
          ...field,
          dbId: undefined, // Keep original field without dbId
        });
        continue;
      }

      const newField = await prisma.formField.create({
        data: {
          label: field.label,
          type: dbFieldType as any,
          value: field.value || field.defaultValue || null,
          options: optionsArray,
          required: field.required || false,
          sectionId: sectionDbId,
          order: field.order || 0,
        },
      });
      fieldDbId = newField.id;
      console.log(`Created new field ${fieldDbId}: ${field.label}`);

      // Create default permissions for all users in the company/branch
      if (companyId) {
        const users = await prisma.user.findMany({
          where: {
            companyId: companyId,
            ...(branchId ? { branchId: branchId } : { branchId: null }),
          },
          select: { id: true },
        });

        if (users.length > 0) {
          await prisma.formFieldPermission.createMany({
            data: users.map((u) => ({
              fieldId: fieldDbId,
              userId: u.id,
              companyId: companyId,
              branchId: branchId || null,
              canView: true,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    updatedFields.push({
      ...field,
      dbId: fieldDbId,
    });
  }

  return {
    sections: updatedSections,
    formFields: updatedFields,
  };
}

// Get all form templates
export const getFormTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { companyId, branchId, entityType, isActive } = req.query;

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      where.branchId = null;
    }
    if (entityType) where.entityType = entityType;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const templates = await prisma.formTemplate.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { entityType: "asc" },
        { createdAt: "desc" }
      ]
    });

    // Helper function to check section permission
    const checkSectionPermission = async (sectionDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
      }
      
      return permission;
    };

    // Helper function to check field permission
    const checkFieldPermission = async (fieldDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
      }
      
      return permission;
    };

    // Filter each template's sections and fields based on user permissions
    const filteredTemplates = await Promise.all(
      templates.map(async (template) => {
        const settings = template.settings as any || {};
        const sections = Array.isArray(settings.sections) ? settings.sections : [];
        const formFields = Array.isArray(template.formFields) ? template.formFields : [];

        const companyId = user.companyId;
        const branchId = user.branchId;

        // Filter sections based on permissions
        const accessibleSections = await Promise.all(
          sections.map(async (section: any) => {
            // If section has no dbId, try to find it in database
            if (!section.dbId) {
              const dbSection = await prisma.formSection.findFirst({
                where: {
                  title: section.title,
                  companyId: companyId || null,
                },
                orderBy: { createdAt: 'desc' },
              });
              
              if (dbSection) {
                section.dbId = dbSection.id;
              } else {
                return section; // Backward compatibility
              }
            }

            // Check if user has permission to view this section
            const permission = await checkSectionPermission(section.dbId, userId, companyId, branchId);

            // Default behavior: if no permission record exists, user has access
            // If permission exists and canView is false, deny access
            const hasAccess = !permission || permission.canView;

            if (!hasAccess) {
              return null; // User doesn't have access to this section
            }

            return section;
          })
        );

        // Filter out null sections
        const filteredSections = accessibleSections.filter((s) => s !== null);
        const accessibleSectionIds = new Set(filteredSections.map((s: any) => s.id));

        // Filter fields based on permissions
        const accessibleFields = await Promise.all(
          formFields.map(async (field: any) => {
            // If field belongs to a section, check if section is accessible first
            if (field.sectionId && !accessibleSectionIds.has(field.sectionId)) {
              return null; // Section is not accessible, so field is not accessible
            }

            // If field has no dbId, include it (for backward compatibility)
            if (!field.dbId) {
              return field;
            }

            // Check if user has permission to view this field
            const fieldPermission = await checkFieldPermission(field.dbId, userId, companyId, branchId);

            // Default behavior: if no permission record exists, user has access
            // If permission exists and canView is false, deny access
            const fieldHasAccess = !fieldPermission || fieldPermission.canView;

            return fieldHasAccess ? field : null;
          })
        );

        // Filter out null fields
        const filteredFields = accessibleFields.filter((f) => f !== null);

        // Return template with filtered sections and fields
        return {
          ...template,
          settings: {
            ...settings,
            sections: filteredSections,
          },
          formFields: filteredFields,
        };
      })
    );

    res.json(filteredTemplates);
  } catch (error: any) {
    console.error("Error fetching form templates:", error);
    res.status(500).json({ error: error.message || "Failed to fetch form templates" });
  }
};

// Get single form template
export const getFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`[getFormTemplate] Called for userId: ${userId}`);

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id } = req.params;
    console.log(`[getFormTemplate] Loading template ID: ${id} for user ${userId} (companyId: ${user.companyId}, branchId: ${user.branchId})`);

    const template = await prisma.formTemplate.findUnique({
      where: { id: parseInt(id) },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true,
            steps: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    // Filter sections and fields based on user permissions
    const settings = template.settings as any || {};
    const sections = Array.isArray(settings.sections) ? settings.sections : [];
    const formFields = Array.isArray(template.formFields) ? template.formFields : [];

    console.log(`[getFormTemplate] Template loaded. Sections: ${sections.length}, Fields: ${formFields.length}`);
    console.log(`[getFormTemplate] Sections with dbIds:`, sections.map((s: any) => ({ id: s.id, dbId: s.dbId, title: s.title })));

    const companyId = user.companyId;
    const branchId = user.branchId;

    console.log(`[getFormTemplate] User context - companyId: ${companyId}, branchId: ${branchId}`);

    // Helper function to check section permission
    const checkSectionPermission = async (sectionDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      console.log(`[checkSectionPermission] Checking permission for section ${sectionDbId}, userId: ${userId}, companyId: ${companyId}, branchId: ${branchId}`);
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
        console.log(`[checkSectionPermission] Branch-specific check result:`, permission ? { found: true, canView: permission.canView } : { found: false });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
        console.log(`[checkSectionPermission] Company-wide check result:`, permission ? { found: true, canView: permission.canView } : { found: false });
      }
      
      return permission;
    };

    // Helper function to check field permission
    const checkFieldPermission = async (fieldDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
      }
      
      return permission;
    };

    // Filter sections based on permissions
    const accessibleSections = await Promise.all(
      sections.map(async (section: any) => {
        // If section has no dbId, log and try to find it in database
        if (!section.dbId) {
          console.log(`[getFormTemplate] WARNING: Section "${section.title}" (id: ${section.id}) has no dbId`);
          // Try to find the section in the database by matching title and company
          const dbSection = await prisma.formSection.findFirst({
            where: {
              title: section.title,
              companyId: companyId || null,
            },
            orderBy: { createdAt: 'desc' }, // Get the most recent one
          });
          
          if (dbSection) {
            console.log(`[getFormTemplate] Found section in DB with id: ${dbSection.id}, will check permissions`);
            section.dbId = dbSection.id;
          } else {
            console.log(`[getFormTemplate] Section not found in DB, allowing access (backward compatibility)`);
            return section; // Backward compatibility - allow if no dbId and not in DB
          }
        }

        console.log(`[getFormTemplate] Checking permissions for section: ${section.title} (dbId: ${section.dbId})`);

        // Check if user has permission to view this section
        const permission = await checkSectionPermission(section.dbId, userId, companyId, branchId);

        console.log(`[Permission Check] Section ${section.dbId} (${section.title}):`, {
          userId,
          companyId,
          branchId,
          permissionFound: !!permission,
          canView: permission?.canView,
          hasAccess: !permission || permission.canView
        });

        // Default behavior: if no permission record exists, user has access
        // If permission exists and canView is false, deny access
        const hasAccess = !permission || permission.canView;

        if (!hasAccess) {
          console.log(`[Permission Denied] User ${userId} cannot view section ${section.dbId} (${section.title})`);
          return null; // User doesn't have access to this section
        }

        return section;
      })
    );

    // Filter out null sections (sections user doesn't have access to)
    const filteredSections = accessibleSections.filter((s) => s !== null);
    const accessibleSectionIds = new Set(filteredSections.map((s: any) => s.id));

    // Filter fields based on permissions
    const accessibleFields = await Promise.all(
      formFields.map(async (field: any) => {
        // If field belongs to a section, check if section is accessible first
        if (field.sectionId && !accessibleSectionIds.has(field.sectionId)) {
          return null; // Section is not accessible, so field is not accessible
        }

        // If field has no dbId, include it (for backward compatibility)
        if (!field.dbId) {
          return field;
        }

        // Check if user has permission to view this field
        const fieldPermission = await checkFieldPermission(field.dbId, userId, companyId, branchId);

        // Default behavior: if no permission record exists, user has access
        // If permission exists and canView is false, deny access
        const fieldHasAccess = !fieldPermission || fieldPermission.canView;

        return fieldHasAccess ? field : null;
      })
    );

    // Filter out null fields (fields user doesn't have access to)
    const filteredFields = accessibleFields.filter((f) => f !== null);

    // Return template with filtered sections and fields
    const filteredTemplate = {
      ...template,
      settings: {
        ...settings,
        sections: filteredSections,
      },
      formFields: filteredFields,
    };

    res.json(filteredTemplate);
  } catch (error: any) {
    console.error("Error fetching form template:", error);
    res.status(500).json({ error: error.message || "Failed to fetch form template" });
  }
};

// Get form template by path
export const getFormTemplateByPath = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { path } = req.params;
    
    const template = await prisma.formTemplate.findFirst({
      where: {
        path: `/${path}`,
        isActive: true
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true,
            steps: true
          }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    // Filter sections and fields based on user permissions
    const settings = template.settings as any || {};
    const sections = Array.isArray(settings.sections) ? settings.sections : [];
    const formFields = Array.isArray(template.formFields) ? template.formFields : [];

    const companyId = user.companyId;
    const branchId = user.branchId;

    // Helper function to check section permission
    const checkSectionPermission = async (sectionDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formSectionPermission.findFirst({
          where: {
            sectionId: sectionDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
      }
      
      return permission;
    };

    // Helper function to check field permission
    const checkFieldPermission = async (fieldDbId: number, userId: number, companyId: number | null, branchId: number | null) => {
      let permission = null;
      
      // First, try to find branch-specific permission
      if (branchId) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: branchId,
          },
        });
      }
      
      // If not found, try company-wide permission (branchId: null)
      if (!permission) {
        permission = await prisma.formFieldPermission.findFirst({
          where: {
            fieldId: fieldDbId,
            userId: userId,
            companyId: companyId || null,
            branchId: null,
          },
        });
      }
      
      return permission;
    };

    // Filter sections based on permissions
    const accessibleSections = await Promise.all(
      sections.map(async (section: any) => {
        // If section has no dbId, include it (for backward compatibility)
        if (!section.dbId) {
          return section;
        }

        // Check if user has permission to view this section
        const permission = await checkSectionPermission(section.dbId, userId, companyId, branchId);

        console.log(`[Permission Check] Section ${section.dbId} (${section.title}):`, {
          userId,
          companyId,
          branchId,
          permissionFound: !!permission,
          canView: permission?.canView,
          hasAccess: !permission || permission.canView
        });

        // Default behavior: if no permission record exists, user has access
        // If permission exists and canView is false, deny access
        const hasAccess = !permission || permission.canView;

        if (!hasAccess) {
          console.log(`[Permission Denied] User ${userId} cannot view section ${section.dbId} (${section.title})`);
          return null; // User doesn't have access to this section
        }

        return section;
      })
    );

    // Filter out null sections (sections user doesn't have access to)
    const filteredSections = accessibleSections.filter((s) => s !== null);
    const accessibleSectionIds = new Set(filteredSections.map((s: any) => s.id));

    // Filter fields based on permissions
    const accessibleFields = await Promise.all(
      formFields.map(async (field: any) => {
        // If field belongs to a section, check if section is accessible first
        if (field.sectionId && !accessibleSectionIds.has(field.sectionId)) {
          return null; // Section is not accessible, so field is not accessible
        }

        // If field has no dbId, include it (for backward compatibility)
        if (!field.dbId) {
          return field;
        }

        // Check if user has permission to view this field
        const fieldPermission = await checkFieldPermission(field.dbId, userId, companyId, branchId);

        // Default behavior: if no permission record exists, user has access
        // If permission exists and canView is false, deny access
        const fieldHasAccess = !fieldPermission || fieldPermission.canView;

        return fieldHasAccess ? field : null;
      })
    );

    // Filter out null fields (fields user doesn't have access to)
    const filteredFields = accessibleFields.filter((f) => f !== null);

    // Return template with filtered sections and fields
    const filteredTemplate = {
      ...template,
      settings: {
        ...settings,
        sections: filteredSections,
      },
      formFields: filteredFields,
    };

    res.json(filteredTemplate);
  } catch (error: any) {
    console.error("Error fetching form template by path:", error);
    res.status(500).json({ error: error.message || "Failed to fetch form template" });
  }
};

// Create form template
export const createFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      name,
      description,
      entityType,
      customEntityName,
      formFields,
      workflowId,
      path,
      isActive,
      settings,
      companyId,
      branchId
    } = req.body;

    const finalCompanyId = companyId || user.companyId;
    const finalBranchId = branchId || user.branchId;

    // Validate custom entity requirements
    if (entityType === "CUSTOM") {
      if (!customEntityName || !customEntityName.trim()) {
        return res.status(400).json({ error: "Custom entity name is required when entity type is CUSTOM" });
      }
      if (!formFields || !Array.isArray(formFields) || formFields.length === 0) {
        return res.status(400).json({ error: "At least one form field is required for custom entities" });
      }
    }

    // Check for duplicate name
    const existing = await prisma.formTemplate.findFirst({
      where: {
        name,
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Template with this name already exists" });
    }

    // Check for duplicate path if provided
    if (path) {
      const pathExists = await prisma.formTemplate.findFirst({
        where: {
          path: path.startsWith("/") ? path : `/${path}`,
          companyId: finalCompanyId || null,
          branchId: finalBranchId || null,
          NOT: { id: existing?.id }
        }
      });

      if (pathExists) {
        return res.status(400).json({ error: "Template with this path already exists" });
      }
    }

    // Validate workflow if provided
    if (workflowId) {
      const workflow = await prisma.businessProcess.findUnique({
        where: { id: workflowId }
      });
      if (!workflow) {
        return res.status(400).json({ error: "Workflow not found" });
      }
    }

    // Create database table for custom entity if applicable
    if (entityType === "CUSTOM" && customEntityName && formFields && formFields.length > 0) {
      try {
        await createCustomEntityTable(
          customEntityName,
          formFields,
          finalCompanyId || null,
          finalBranchId || null
        );
      } catch (error: any) {
        console.error("Error creating custom entity table:", error);
        return res.status(500).json({ 
          error: `Failed to create database table for custom entity: ${error.message}` 
        });
      }
    }

    // Sync sections and fields to database and get updated JSON with dbIds
    const templateSections = (settings as any)?.sections || [];
    const syncedData = await syncSectionsAndFieldsToDatabase(
      templateSections,
      formFields || [],
      finalCompanyId || null,
      finalBranchId || null
    );

    // Update settings with synced sections (with dbIds)
    const updatedSettings = {
      ...(settings || {}),
      sections: syncedData.sections,
    };

    const template = await prisma.formTemplate.create({
      data: {
        name,
        description: description || null,
        entityType,
        customEntityName: entityType === "CUSTOM" ? customEntityName : null,
        formFields: syncedData.formFields, // Use synced fields with dbIds
        workflowId: workflowId || null,
        path: path ? (path.startsWith("/") ? path : `/${path}`) : null,
        isActive: isActive !== undefined ? isActive : true,
        settings: updatedSettings, // Use updated settings with dbIds
        companyId: finalCompanyId || null,
        branchId: finalBranchId || null
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        }
      }
    });

    // If this is a CUSTOM entity template, create a custom entity page
    if (entityType === "CUSTOM" && customEntityName) {
      try {
        // Generate slug from custom entity name (lowercase, replace spaces with hyphens)
        const slug = customEntityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Check if page already exists
        const existingPage = await prisma.customEntityPage.findFirst({
          where: {
            slug,
            companyId: finalCompanyId || null,
            branchId: finalBranchId || null
          }
        });

        // Only create if it doesn't exist
        if (!existingPage) {
          await prisma.customEntityPage.create({
            data: {
              name: customEntityName,
              slug,
              templateId: template.id,
              customEntityName,
              description: description || `Manage ${customEntityName.toLowerCase()}`,
              isActive: true,
              order: 0,
              companyId: finalCompanyId || null,
              branchId: finalBranchId || null
            }
          });
        }
      } catch (error: any) {
        console.error("Error creating custom entity page:", error);
        // Don't fail the template creation if page creation fails
      }
    }

    res.status(201).json(template);
  } catch (error: any) {
    console.error("Error creating form template:", error);
    res.status(500).json({ error: error.message || "Failed to create form template" });
  }
};

// Update form template
export const updateFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      description,
      entityType,
      customEntityName,
      formFields,
      workflowId,
      path,
      isActive,
      settings,
      companyId,
      branchId
    } = req.body;

    // Check if template exists
    const existing = await prisma.formTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Form template not found" });
    }

    // Check for duplicate name (excluding current template)
    if (name && name !== existing.name) {
      const duplicate = await prisma.formTemplate.findFirst({
        where: {
          name,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: "Template with this name already exists" });
      }
    }

    // Check for duplicate path if provided
    if (path && path !== existing.path) {
      const pathExists = await prisma.formTemplate.findFirst({
        where: {
          path: path.startsWith("/") ? path : `/${path}`,
          companyId: companyId || existing.companyId || null,
          branchId: branchId || existing.branchId || null,
          NOT: { id: parseInt(id) }
        }
      });

      if (pathExists) {
        return res.status(400).json({ error: "Template with this path already exists" });
      }
    }

    // Validate workflow if provided
    if (workflowId && workflowId !== existing.workflowId) {
      const workflow = await prisma.businessProcess.findUnique({
        where: { id: workflowId }
      });
      if (!workflow) {
        return res.status(400).json({ error: "Workflow not found" });
      }
    }

    // Sync sections and fields to database and get updated JSON with dbIds
    // Always use the latest sections/fields (from request or existing)
    const currentSettings = settings !== undefined ? settings : (existing.settings as any || {});
    const templateSections = (currentSettings as any)?.sections || [];
    const currentFormFields = formFields !== undefined ? formFields : (existing.formFields as any[] || []);
    
    const finalCompanyId = companyId || existing.companyId;
    const finalBranchId = branchId !== undefined ? branchId : existing.branchId;
    
    const syncedData = await syncSectionsAndFieldsToDatabase(
      templateSections,
      currentFormFields,
      finalCompanyId || null,
      finalBranchId || null
    );

    // Always update settings with synced sections (with dbIds) - merge with existing settings
    const updatedSettings = {
      ...(currentSettings || {}),
      sections: syncedData.sections,
    };

    const template = await prisma.formTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(entityType && { entityType }),
        ...(customEntityName !== undefined && { customEntityName: entityType === "CUSTOM" ? customEntityName : null }),
        // Always update formFields with synced data (includes dbIds)
        formFields: syncedData.formFields,
        ...(workflowId !== undefined && { workflowId: workflowId || null }),
        ...(path !== undefined && { path: path ? (path.startsWith("/") ? path : `/${path}`) : null }),
        ...(isActive !== undefined && { isActive }),
        // Always update settings with synced sections (includes dbIds)
        settings: updatedSettings,
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(branchId !== undefined && { branchId: branchId || null })
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        }
      }
    });

    // Log activity for form template update
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'form_template_updated',
        message: `${userContext.name || 'User'} updated form template "${template.name}"`,
        userId: userContext.id,
        companyId: template.companyId || userContext.companyId || undefined,
        branchId: template.branchId || userContext.branchId || undefined,
        entityType: 'FORM_TEMPLATE',
        entityId: template.id,
      });
    }

    res.json(template);
  } catch (error: any) {
    console.error("Error updating form template:", error);
    res.status(500).json({ error: error.message || "Failed to update form template" });
  }
};

// Delete form template
export const deleteFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.formTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    // Log activity for form template deletion
    const userContext = await getUserContext(userId);
    if (userContext) {
      await logActivity({
        type: 'form_template_deleted',
        message: `${userContext.name || 'User'} deleted form template "${template.name}"`,
        userId: userContext.id,
        companyId: template.companyId || userContext.companyId || undefined,
        branchId: template.branchId || userContext.branchId || undefined,
        entityType: 'FORM_TEMPLATE',
        entityId: parseInt(id),
      });
    }

    await prisma.formTemplate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Form template deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting form template:", error);
    res.status(500).json({ error: error.message || "Failed to delete form template" });
  }
};

// Toggle active status
export const toggleFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.formTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    const updated = await prisma.formTemplate.update({
      where: { id: parseInt(id) },
      data: { isActive: !template.isActive },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Error toggling form template:", error);
    res.status(500).json({ error: error.message || "Failed to toggle form template" });
  }
};

// Duplicate form template
export const duplicateFormTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const template = await prisma.formTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: "Form template not found" });
    }

    const duplicated = await prisma.formTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        description: template.description,
        entityType: template.entityType,
        formFields: template.formFields,
        workflowId: template.workflowId,
        path: null, // Duplicated templates don't get the same path
        isActive: false, // Duplicated templates start as inactive
        settings: template.settings,
        companyId: template.companyId,
        branchId: template.branchId
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true
          }
        }
      }
    });

    res.status(201).json(duplicated);
  } catch (error: any) {
    console.error("Error duplicating form template:", error);
    res.status(500).json({ error: error.message || "Failed to duplicate form template" });
  }
};

// Get available database tables/models for dropdown configuration
export const getDatabaseModels = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all models dynamically from Prisma DMMF (Data Model Meta Format)
    // This ensures all models are included automatically
    const dmmf = (prisma as any)._dmmf || (prisma as any).$dmmf;
    
    let models: Array<{ name: string; label: string; fields: string[] }> = [];
    
    if (dmmf && dmmf.datamodel && dmmf.datamodel.models) {
      // Get all models from Prisma schema dynamically
      const allModels = dmmf.datamodel.models;
      
      // Helper function to get common fields from a model
      const getModelFields = (model: any): string[] => {
        const fields: string[] = [];
        if (model.fields) {
          model.fields.forEach((field: any) => {
            // Include scalar fields (not relations)
            if (field.kind === 'scalar' && field.type !== 'Json') {
              fields.push(field.name);
            }
          });
        }
        return fields.length > 0 ? fields : ["id", "name"];
      };

      // Helper function to create a human-readable label
      const createLabel = (modelName: string): string => {
        // Convert PascalCase to Title Case with spaces
        return modelName
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^./, (str) => str.toUpperCase());
      };

      // Filter out internal/system models and create model list
      const excludedModels = ['FormSection', 'FormField', 'FormSectionPermission', 'FormFieldPermission', 
        'Activity', 'Comment', 'Message', 'Chat', 'ChatParticipant', 'ChatMessage', 'ChatAccess',
        'Todo', 'TodoComment', 'TodoFile', 'TodoSubTask', 'UserSettings', 'PasswordResetToken',
        'Note', 'NoteLabel', 'NoteChecklistItem', 'UserConnection', 'AccessControl', 'Security',
        'CustomField', 'AnalyticalReport', 'AutoNumbering', 'PermissionSetting', 'BusinessProcess',
        'EmailTemplate', 'SmtpSetting', 'Mail', 'EmailNotification', 'EmailSignature', 'FormTemplate',
        'PricingPlan', 'CustomEntityPage', 'EntityData', 'FeedPost', 'FeedLike', 'FeedComment',
        'Notification', 'Collab', 'CollabMember', 'CollabInvitation', 'WorkGroup', 'WorkGroupMember',
        'Document', 'CalendarEvent', 'FitnessActivity', 'NutritionEntry', 'SleepRecord', 'Product',
        'Order', 'OrderItem', 'Folder', 'File', 'ProjectMember', 'MenuItem', 'DealPipeline',
        'PipelineStage', 'PipelineConnection'];
      
      allModels.forEach((model: any) => {
        if (!excludedModels.includes(model.name)) {
          const fields = getModelFields(model);
          models.push({
            name: model.name,
            label: createLabel(model.name),
            fields: fields
          });
        }
      });

      // Sort models alphabetically by label
      models.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      // Fallback: Comprehensive list of all available models
      // This ensures models are available even if DMMF introspection fails
      models = [
        { name: "Branch", label: "Branches", fields: ["id", "name", "address", "phone", "email"] },
        { name: "CallStatus", label: "Call Statuses", fields: ["id", "name", "color"] },
        { name: "Company", label: "Companies", fields: ["id", "name", "email", "phone", "website"] },
        { name: "CompanyType", label: "Company Types", fields: ["id", "name", "color"] },
        { name: "ContactType", label: "Contact Types", fields: ["id", "name", "color"] },
        { name: "Currency", label: "Currencies", fields: ["id", "name", "code", "symbol"] },
        { name: "Customer", label: "Customers", fields: ["id", "name", "email", "phone"] },
        { name: "DealType", label: "Deal Types", fields: ["id", "name", "color"] },
        { name: "DocumentStage", label: "Document Stages", fields: ["id", "name", "color", "order"] },
        { name: "Employee", label: "Employees", fields: ["id", "name", "color"] },
        { name: "EstimateStage", label: "Estimate Stages", fields: ["id", "name", "color", "order"] },
        { name: "Industry", label: "Industries", fields: ["id", "name", "color"] },
        { name: "InvoiceStage", label: "Invoice Stages", fields: ["id", "name", "color", "order"] },
        { name: "LeadStage", label: "Lead Stages", fields: ["id", "name", "color", "order"] },
        { name: "Location", label: "Locations", fields: ["id", "name", "city", "state", "country"] },
        { name: "ProductCategory", label: "Product Categories", fields: ["id", "name", "description"] },
        { name: "ProductProperty", label: "Product Properties", fields: ["id", "name", "type"] },
        { name: "ProductSubCategory", label: "Product Sub Categories", fields: ["id", "name", "description"] },
        { name: "Project", label: "Projects", fields: ["id", "title", "subtitle", "description", "status", "progress", "startDate", "endDate", "deadline", "budget", "spent", "clientName"] },
        { name: "Role", label: "User Roles", fields: ["id", "name", "description"] },
        { name: "Salutation", label: "Salutations", fields: ["id", "name", "color"] },
        { name: "Source", label: "Sources", fields: ["id", "name", "color"] },
        { name: "Tax", label: "Taxes", fields: ["id", "name", "rate"] },
        { name: "UnitOfMeasurement", label: "Units", fields: ["id", "name", "symbol", "code"] },
        { name: "User", label: "Users", fields: ["id", "name", "email", "phone"] }
      ];
    }

    res.json(models);
  } catch (error: any) {
    console.error("Error fetching database models:", error);
    res.status(500).json({ error: error.message || "Failed to fetch database models" });
  }
};

// Get list of custom entities
export const getCustomEntities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const where: any = {
      entityType: "CUSTOM"
    };

    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    const customEntities = await prisma.formTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        customEntityName: true,
        description: true,
        formFields: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        customEntityName: "asc"
      }
    });

    // Extract unique custom entity names
    const uniqueEntities = Array.from(
      new Map(
        customEntities
          .filter((t: any) => t.customEntityName)
          .map((t: any) => [t.customEntityName, t])
      ).values()
    );

    res.json(uniqueEntities);
  } catch (error: any) {
    console.error("Error fetching custom entities:", error);
    res.status(500).json({ error: error.message || "Failed to fetch custom entities" });
  }
};

// Get data from a specific model for dropdown
export const getModelData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { modelName } = req.params;
    const { displayField, valueField, filter } = req.query;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Map model names to Prisma models - dynamically get from prisma client
    // This ensures all models are available automatically
    const modelMap: Record<string, any> = {
      Branch: prisma.branch,
      CallStatus: prisma.callStatus,
      Company: prisma.company,
      CompanyType: prisma.companyType,
      ContactType: prisma.contactType,
      Currency: prisma.currency,
      Customer: prisma.customer,
      DealType: prisma.dealType,
      DocumentStage: prisma.documentStage,
      Employee: prisma.employee,
      EstimateStage: prisma.estimateStage,
      Industry: prisma.industry,
      InvoiceStage: prisma.invoiceStage,
      LeadStage: prisma.leadStage,
      Location: prisma.location,
      ProductCategory: prisma.productCategory,
      ProductProperty: prisma.productProperty,
      ProductSubCategory: prisma.productSubCategory,
      Project: prisma.project,
      Role: prisma.role,
      Salutation: prisma.salutation,
      Source: prisma.source,
      Tax: prisma.tax,
      UnitOfMeasurement: prisma.unitOfMeasurement,
      User: prisma.user
    };

    const model = modelMap[modelName];
    if (!model) {
      return res.status(400).json({ error: "Invalid model name" });
    }

    // Build where clause
    const where: any = {};
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }
    if (filter) {
      // Add filter logic if needed
    }

    const data = await model.findMany({
      where,
      orderBy: { id: "asc" },
      take: 1000 // Limit to prevent huge responses
    });

    // Format response with display and value fields
    const formattedData = data.map((item: any) => {
      // Handle different models that might use different field names for display
      let displayValue = item.id;
      if (displayField && item[displayField]) {
        displayValue = item[displayField];
      } else if (item.name) {
        displayValue = item.name;
      } else if (item.title) {
        displayValue = item.title;
      } else if (item.email) {
        displayValue = item.email;
      }
      
      return {
        value: valueField ? item[valueField as string] : item.id,
        label: displayValue,
        ...item
      };
    });

    res.json(formattedData);
  } catch (error: any) {
    console.error("Error fetching model data:", error);
    res.status(500).json({ error: error.message || "Failed to fetch model data" });
  }
};




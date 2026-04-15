import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user to determine companyId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'User company not found' });
    }

    // Only return the logged-in user's company
    const companies = await prisma.company.findMany({
      where: { id: user.companyId }
    });
    
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: { branches: true, users: true }
    });
    if (company) {
      res.json(company);
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

export const getCompanyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: { branches: true, users: true }
    });
    if (company) {
      res.json(company);
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

// Helper function to generate slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.company.findUnique({
      where: { slug }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Helper function to clone default form templates for a company
async function createDefaultTemplates(companyId: number) {
  try {
    // Find master templates (templates with companyId = null) for LEAD, DEAL, and CONTACT
    const masterTemplates = await prisma.formTemplate.findMany({
      where: {
        companyId: null,
        entityType: {
          in: ['LEAD', 'DEAL', 'CONTACT']
        }
      }
    });

    if (masterTemplates.length === 0) {
      console.log(`No master templates found. Skipping template creation for company ${companyId}`);
      return;
    }

    // Clone each master template for the new company
    const templateCopies = masterTemplates.map(template => ({
      name: template.name,
      description: template.description,
      entityType: template.entityType,
      customEntityName: template.customEntityName,
      formFields: template.formFields, // Copy form fields as-is
      workflowId: template.workflowId,
      path: template.path, // Keep the same path (companies can modify if needed)
      isActive: template.isActive,
      settings: template.settings,
      companyId: companyId, // Assign to the new company
      branchId: null // Company-level templates, not branch-specific
    }));

    // Create all template copies
    await prisma.formTemplate.createMany({
      data: templateCopies
    });

    console.log(`Cloned ${templateCopies.length} default templates for company ${companyId}`);
  } catch (error: any) {
    console.error(`Error cloning default templates for company ${companyId}:`, error);
    // Don't throw error - template creation failure shouldn't fail company creation
  }
}

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      industry, 
      branches, 
      plan,
      // Additional fields (stored for future use, even if not in schema yet)
      city,
      state,
      country,
      zipCode,
      companySize,
      taxId,
      registrationNumber,
      description,
      foundedYear,
      timezone,
      currency
    } = req.body;
    
    // Generate and ensure unique slug
    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);
    
    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    
    // Only include fields that exist in the schema
    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        website: website || null,
        industry: industry || null,
        slug,
        plan: 'Free', // Always set to Free for new companies
        subscriptionStatus: 'Active',
        trialEndDate: trialEndDate, // Set 14-day trial
        branches: {
          create: branches || []
        }
        // Note: Additional fields (city, state, country, zipCode, companySize, taxId, 
        // registrationNumber, description, foundedYear, timezone, currency) can be added 
        // to the schema in a future migration if needed
      },
      include: { branches: true }
    });

    // Create default form templates for the company
    await createDefaultTemplates(company.id);

    // Log activity for company creation (get userId from request if available)
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'company_created',
          message: `${userContext.name || 'Admin'} created company "${name}"`,
          userId: userContext.id,
          companyId: company.id,
          branchId: userContext.branchId || undefined,
          entityType: 'COMPANY',
          entityId: company.id,
        });
      }
    }

    res.status(201).json(company);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Company with this email or slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create company', details: error.message });
    }
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, website, industry, customFieldsSectionTitle } = req.body;

    // Get company before updating for activity logging
    const existingCompany = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      select: { name: true }
    });

    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data: { name, email, phone, address, website, industry, customFieldsSectionTitle }
    });

    // Log activity for company update (get userId from request if available)
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId && existingCompany) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'company_updated',
          message: `${userContext.name || 'Admin'} updated company "${company.name}"`,
          userId: userContext.id,
          companyId: company.id,
          branchId: userContext.branchId || undefined,
          entityType: 'COMPANY',
          entityId: company.id,
        });
      }
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get company details before deleting for activity logging
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true }
    });

    if (company) {
      // Log activity for company deletion (get userId from request if available)
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (userId) {
        const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
        if (userContext) {
          await logActivity({
            type: 'company_deleted',
            message: `${userContext.name || 'Admin'} deleted company "${company.name}"`,
            userId: userContext.id,
            companyId: parseInt(id),
            branchId: userContext.branchId || undefined,
            entityType: 'COMPANY',
            entityId: parseInt(id),
          });
        }
      }
    }

    await prisma.company.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company' });
  }
};
import { Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  userAllowedByResourceAccessForAction,
} from '../utils/resource-access';
import { AuthRequest } from '../middleware/auth';
import { Module, ResourceType } from '../generated/prisma/enums';
import { logActivity, getUserContext } from '../utils/activityLogger';

/** Optional query `action`: read|add|write|edit|delete|manage|export|import; omitted → any capability */
function hasResourceCapability(
  p: {
    canRead: boolean;
    canWrite: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManage: boolean;
    canExport: boolean;
    canImport: boolean;
  },
  action: string | undefined
): boolean {
  const a = action?.toLowerCase();
  if (!a) {
    return !!(
      p.canRead ||
      p.canWrite ||
      p.canEdit ||
      p.canDelete ||
      p.canManage ||
      p.canExport ||
      p.canImport
    );
  }
  if (a === 'read') return p.canRead;
  if (a === 'write' || a === 'add') return p.canWrite;
  if (a === 'edit') return p.canEdit;
  if (a === 'delete') return p.canDelete;
  if (a === 'manage') return p.canManage;
  if (a === 'export') return p.canExport;
  if (a === 'import') return p.canImport;
  return !!(
    p.canRead ||
    p.canWrite ||
    p.canEdit ||
    p.canDelete ||
    p.canManage ||
    p.canExport ||
    p.canImport
  );
}

function capabilityFlags(p: {
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  canExport: boolean;
  canImport: boolean;
}) {
  return {
    canRead: p.canRead,
    canWrite: p.canWrite,
    canEdit: p.canEdit,
    canDelete: p.canDelete,
    canManage: p.canManage,
    canExport: p.canExport,
    canImport: p.canImport,
  };
}

// Get all permission settings for a company/branch
export const getPermissionSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId, roleId } = req.query;
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
    const filterRoleId = roleId ? parseInt(roleId as string) : undefined;

    const where: any = {};
    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      // If company but no branch, get company-wide permission settings
      where.branchId = null;
    }
    if (filterRoleId) {
      where.roleId = filterRoleId;
    }

    const permissionSettings = await prisma.permissionSetting.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { roleId: 'asc' },
        { module: 'asc' }
      ]
    });

    res.json(permissionSettings);
  } catch (error: any) {
    console.error('Get permission settings error:', error);
    res.status(500).json({ error: 'Failed to fetch permission settings', details: error.message });
  }
};

// Get permission settings matrix (grouped by role and module)
export const getPermissionSettingsMatrix = async (req: AuthRequest, res: Response) => {
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
      where.branchId = null;
    }

    // Get all roles
    const roles = await prisma.role.findMany({
      where: {
        companyId: filterCompanyId,
        branchId: filterBranchId || null,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    // Get all permission settings
    const permissionSettings = await prisma.permissionSetting.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get all modules
    const allModules = Object.values(Module);

    // Build matrix structure
    const matrix = roles.map(role => {
      const rolePermissions = allModules.map(module => {
        const setting = permissionSettings.find(
          ps => ps.roleId === role.id && ps.module === module
        );

        return {
          module,
          canRead: setting?.canRead || false,
          canWrite: setting?.canWrite || false,
          canDelete: setting?.canDelete || false,
          canManage: setting?.canManage || false,
          canExport: setting?.canExport || false,
          canImport: setting?.canImport || false,
          settingId: setting?.id || null
        };
      });

      return {
        role: {
          id: role.id,
          name: role.name
        },
        permissions: rolePermissions
      };
    });

    res.json({
      roles,
      modules: allModules,
      matrix
    });
  } catch (error: any) {
    console.error('Get permission settings matrix error:', error);
    res.status(500).json({ error: 'Failed to fetch permission settings matrix', details: error.message });
  }
};

// Create or update permission settings (bulk)
export const upsertPermissionSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { roleId, permissions } = req.body; // permissions is array of { module, canRead, canWrite, etc. }
    const userId = req.userId;

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Role ID and permissions array are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify role exists and belongs to user's company/branch
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.companyId !== user.companyId || 
        (role.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Upsert each permission setting
    const results = await Promise.all(
      permissions.map(async (perm: any) => {
        const { module, canRead, canWrite, canDelete, canManage, canExport, canImport, settingId } = perm;

        if (!module) {
          throw new Error('Module is required for each permission');
        }

        const data = {
          roleId: parseInt(roleId),
          module: module as Module,
          canRead: canRead || false,
          canWrite: canWrite || false,
          canDelete: canDelete || false,
          canManage: canManage || false,
          canExport: canExport || false,
          canImport: canImport || false,
          companyId: user.companyId,
          branchId: user.branchId
        };

        if (settingId) {
          // Update existing
          return await prisma.permissionSetting.update({
            where: { id: settingId },
            data
          });
        } else {
          // Create new
          return await prisma.permissionSetting.create({
            data
          });
        }
      })
    );

    res.json(results);
  } catch (error: any) {
    console.error('Upsert permission settings error:', error);
    res.status(500).json({ error: 'Failed to save permission settings', details: error.message });
  }
};

// Delete a permission setting
export const deletePermissionSetting = async (req: AuthRequest, res: Response) => {
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

    const permissionSetting = await prisma.permissionSetting.findUnique({
      where: { id: parseInt(id) }
    });

    if (!permissionSetting) {
      return res.status(404).json({ error: 'Permission setting not found' });
    }

    // Check if permission setting belongs to user's company/branch
    if (permissionSetting.companyId !== user.companyId || 
        (permissionSetting.branchId !== user.branchId && user.branchId !== null)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Log activity for permission setting deletion
    const userContext = await getUserContext(userId);
    if (userContext && permissionSetting) {
      await logActivity({
        type: 'permission_setting_deleted',
        message: `${userContext.name || 'User'} deleted permission setting`,
        userId: userContext.id,
        companyId: permissionSetting.companyId || userContext.companyId || undefined,
        branchId: permissionSetting.branchId || userContext.branchId || undefined,
        entityType: 'PERMISSION_SETTING',
        entityId: parseInt(id),
      });
    }

    await prisma.permissionSetting.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Delete permission setting error:', error);
    res.status(500).json({ error: 'Failed to delete permission setting', details: error.message });
  }
};

// Get hierarchical permissions for a role
export const getHierarchicalPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId, companyId, branchId } = req.query;
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
    const filterRoleId = roleId ? parseInt(roleId as string) : undefined;

    if (!filterRoleId) {
      return res.status(400).json({ error: 'Role ID is required' });
    }

    const where: any = {
      roleId: filterRoleId
    };

    if (filterCompanyId) {
      where.companyId = filterCompanyId;
    }
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      where.branchId = null;
    }

    const permissionSettings = await prisma.permissionSetting.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            resourcePath: true
          }
        }
      },
      orderBy: [
        { resourcePath: 'asc' }
      ]
    });

    // Always return an array, even if empty
    res.json(permissionSettings || []);
  } catch (error: any) {
    console.error('Get hierarchical permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchical permissions', details: error.message });
  }
};

// Upsert hierarchical permissions
export const upsertHierarchicalPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { roleId, permissions } = req.body;
    const userId = req.userId;

    if (!roleId || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Role ID and permissions array are required' });
    }

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Build a map of existing permissions by resourcePath
    const existingPermissions = await prisma.permissionSetting.findMany({
      where: {
        roleId: parseInt(roleId),
        companyId: user.companyId,
        branchId: user.branchId
      }
    });

    const existingMap = new Map(existingPermissions.map(p => [p.resourcePath || '', p]));
    
    // Track which resource paths are being saved
    const incomingResourcePaths = new Set<string>();
    permissions.forEach((perm: any) => {
      if (perm.resourcePath) {
        incomingResourcePaths.add(perm.resourcePath);
      }
    });

    // Upsert each permission
    const results = await Promise.all(
      permissions.map(async (perm: any) => {
        const {
          resourcePath,
          resourceType,
          resourceName,
          parentId,
          canRead,
          canWrite,
          canEdit,
          canDelete,
          canManage,
          canExport,
          canImport,
          fieldPermissions,
          sectionPermissions,
          settingId
        } = perm;

        if (!resourcePath) {
          throw new Error('Resource path is required for hierarchical permissions');
        }

        // Find parent permission if parentPath is provided
        let actualParentId = parentId;
        if (!actualParentId && perm.parentPath) {
          const parentPerm = existingPermissions.find(p => p.resourcePath === perm.parentPath);
          if (parentPerm) {
            actualParentId = parentPerm.id;
          }
        }

        const data: any = {
          roleId: parseInt(roleId),
          resourcePath,
          resourceType: resourceType ? (resourceType as ResourceType) : ResourceType.MENU,
          resourceName: resourceName || resourcePath.split('.').pop() || resourcePath,
          parentId: actualParentId || null,
          canRead: canRead || false,
          canWrite: canWrite || false,
          canEdit: canEdit || false,
          canDelete: canDelete || false,
          canManage: canManage || false,
          canExport: canExport || false,
          canImport: canImport || false,
          fieldPermissions: fieldPermissions || null,
          sectionPermissions: sectionPermissions || null,
          companyId: user.companyId,
          branchId: user.branchId
        };

        const existing = existingMap.get(resourcePath);

        if (existing) {
          // Update existing
          return await prisma.permissionSetting.update({
            where: { id: existing.id },
            data
          });
        } else {
          // Create new
          return await prisma.permissionSetting.create({
            data
          });
        }
      })
    );

    // Delete permissions that exist in the database but are not in the incoming array
    // This ensures the saved permissions match exactly what the user sees in the UI
    const permissionsToDelete = existingPermissions.filter(
      existing => !incomingResourcePaths.has(existing.resourcePath || '')
    );

    if (permissionsToDelete.length > 0) {
      await Promise.all(
        permissionsToDelete.map(perm => 
          prisma.permissionSetting.delete({
            where: { id: perm.id }
          })
        )
      );
    }

    res.json(results);
  } catch (error: any) {
    console.error('Upsert hierarchical permissions error:', error);
    res.status(500).json({ error: 'Failed to save hierarchical permissions', details: error.message });
  }
};

// Check if user has permission for a resource path
export const checkResourcePermission = async (req: AuthRequest, res: Response) => {
  try {
    const { resourcePath } = req.query;
    const userId = req.userId;

    if (!resourcePath || typeof resourcePath !== 'string') {
      return res.status(400).json({ error: 'Resource path is required' });
    }

    const action =
      typeof req.query.action === 'string' && req.query.action.length > 0
        ? req.query.action
        : undefined;

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        roleId: true,
        companyId: true,
        branchId: true,
        customRole: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admin users have full access
    if (user.role === 'admin') {
      return res.json({ hasPermission: true, reason: 'admin' });
    }

    // If user has a custom role, check permissions
    if (user.roleId) {
      // Normalize resource path (remove /dashboard prefix if present)
      const normalizedPath = resourcePath.replace(/^\/dashboard\//, '').replace(/\//g, '.');
      
      console.log(`[Permission Check] User ${userId}, Role ${user.roleId}, Checking path: ${normalizedPath}`);
      
      // Check hierarchical permissions - try exact match first, then parent paths, then child paths
      const pathParts = normalizedPath.split('.');
      let permissionFound = false;
      let hasPermission = false;

      // Try to find permission for this resource or any parent
      for (let i = pathParts.length; i > 0; i--) {
        const checkPath = pathParts.slice(0, i).join('.');
        
        const permission = await prisma.permissionSetting.findFirst({
          where: {
            roleId: user.roleId,
            resourcePath: checkPath,
            companyId: user.companyId,
            branchId: user.branchId || null,
            OR: [
              { canRead: true },
              { canWrite: true },
              { canEdit: true },
              { canDelete: true },
              { canManage: true },
              { canExport: true },
              { canImport: true },
            ]
          }
        });

        if (permission) {
          permissionFound = true;
          hasPermission =
            hasResourceCapability(permission, action) &&
            userAllowedByResourceAccessForAction(
              permission.fieldPermissions,
              userId,
              action,
              capabilityFlags(permission)
            );
          console.log(`[Permission Check] Found permission for path: ${checkPath}, hasPermission: ${hasPermission}`);
          break;
        }
      }

      // If not found with exact/parent match, try to find permissions for child resources
      // This handles cases where parent menus were removed but children still have permissions
      if (!permissionFound) {
        // Get all permissions for this role to check for partial matches
        const allPermissions = await prisma.permissionSetting.findMany({
          where: {
            roleId: user.roleId,
            companyId: user.companyId,
            branchId: user.branchId || null,
            OR: [
              { canRead: true },
              { canWrite: true },
              { canEdit: true },
              { canDelete: true },
              { canManage: true },
              { canExport: true },
              { canImport: true },
            ]
          }
        });

        console.log(`[Permission Check] Found ${allPermissions.length} total permissions for role, checking for matches...`);

        // Check if any permission path matches:
        // 1. Permission path ends with the normalized path (e.g., "collaboration.messenger" ends with ".messenger")
        // 2. Normalized path ends with permission path (e.g., "messenger" matches "collaboration.messenger")
        // 3. Last part of normalized path matches permission path (e.g., "messenger" from "collaboration.messenger")
        const lastPart = pathParts[pathParts.length - 1];
        
        for (const perm of allPermissions) {
          const permPath = perm.resourcePath;
          
          // Check if permission path ends with normalized path or vice versa
          if (permPath.endsWith(`.${normalizedPath}`) || 
              normalizedPath.endsWith(`.${permPath}`) ||
              permPath === lastPart ||
              normalizedPath === permPath.split('.').pop() ||
              permPath === normalizedPath) {
            permissionFound = true;
            hasPermission =
              hasResourceCapability(perm, action) &&
              userAllowedByResourceAccessForAction(
                perm.fieldPermissions,
                userId,
                action,
                capabilityFlags(perm)
              );
            console.log(`[Permission Check] Matched permission path: ${permPath} with normalized path: ${normalizedPath}, hasPermission: ${hasPermission}`);
            break;
          }
        }

        // If still not found, try more flexible matching
        if (!permissionFound) {
          // Try matching by last segment of path (e.g., "messenger" from "collaboration.messenger")
          const lastSegment = pathParts[pathParts.length - 1];
          const matchingPerm = allPermissions.find(perm => {
            const permParts = perm.resourcePath.split('.');
            return permParts[permParts.length - 1] === lastSegment;
          });
          
          if (matchingPerm) {
            permissionFound = true;
            hasPermission =
              hasResourceCapability(matchingPerm, action) &&
              userAllowedByResourceAccessForAction(
                matchingPerm.fieldPermissions,
                userId,
                action,
                capabilityFlags(matchingPerm)
              );
            console.log(`[Permission Check] Matched by last segment: ${lastSegment}, permission path: ${matchingPerm.resourcePath}`);
          }
        }

        // If still not found and user has ANY permissions with all flags set to true, grant access
        // This is a fallback for users with "full access" who might have permissions saved differently
        if (!permissionFound && allPermissions.length > 0) {
          const hasFullAccess = allPermissions.some(perm => 
            perm.canRead && perm.canWrite && perm.canEdit && perm.canDelete && perm.canManage && perm.canExport && perm.canImport
          );
          
          if (hasFullAccess) {
            console.log(`[Permission Check] User has full access permissions, granting access`);
            permissionFound = true;
            hasPermission = true;
          }
        }
      }

      // If no permission found, check if user has any permissions at all
      // If they have permissions but none match, it might be a path mismatch issue
      // In that case, if they have full access on any resource, grant access
      if (!permissionFound) {
        const anyPermissions = await prisma.permissionSetting.findFirst({
          where: {
            roleId: user.roleId,
            companyId: user.companyId,
            branchId: user.branchId || null,
          }
        });

        if (anyPermissions) {
          // User has permissions configured, but path didn't match
          // Check if they have full access on any resource
          const fullAccessPerm = await prisma.permissionSetting.findFirst({
            where: {
              roleId: user.roleId,
              companyId: user.companyId,
              branchId: user.branchId || null,
              canRead: true,
              canWrite: true,
              canEdit: true,
              canDelete: true,
              canManage: true,
              canExport: true,
              canImport: true
            }
          });

          if (fullAccessPerm) {
            console.log(`[Permission Check] User has full access on at least one resource, granting access`);
            return res.json({ hasPermission: true, reason: 'full_access_fallback' });
          }
        }

        console.log(`[Permission Check] No permission found, denying access`);
        return res.json({ hasPermission: false, reason: 'no_permission_setting' });
      }

      console.log(`[Permission Check] Final result: hasPermission=${hasPermission}`);
      return res.json({ 
        hasPermission, 
        reason: hasPermission ? 'granted' : 'denied'
      });
    }

    // Default: no custom role, check basic role permissions
    // For now, manager and employee have limited access
    // You can customize this logic based on your needs
    
    // If user has no roleId but is not admin, check if they should have default access
    // For now, grant access to all if no roleId is set (this can be customized)
    if (!user.roleId) {
      console.log(`[Permission Check] User has no roleId, granting default access`);
      return res.json({ hasPermission: true, reason: 'no_role_default_access' });
    }

    const allowedPaths: Record<string, string[]> = {
      'manager': ['default', 'crm', 'apps', 'pages'],
      'employee': ['default', 'apps']
    };

    const normalizedPath = resourcePath.replace(/^\/dashboard\//, '').split('/')[0];
    const allowedForRole = allowedPaths[user.role] || [];
    const hasPermission = allowedForRole.some(path => normalizedPath.startsWith(path));

    console.log(`[Permission Check] Basic role check: role=${user.role}, path=${normalizedPath}, hasPermission=${hasPermission}`);
    return res.json({ 
      hasPermission, 
      reason: hasPermission ? 'basic_role' : 'insufficient_permissions'
    });
  } catch (error: any) {
    console.error('Check resource permission error:', error);
    res.status(500).json({ error: 'Failed to check permission', details: error.message });
  }
};


import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getCustomEntityTableName } from "../utils/customEntityTable";
import { logActivity, getUserContext } from '../utils/activityLogger';

/**
 * Create entity data from form submission
 */
export const createEntityData = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, templateId, data, customEntityName } = req.body;
    const companyId = req.user?.companyId || null;
    const branchId = req.user?.branchId || null;

    if (!entityType) {
      return res.status(400).json({ error: "Entity type is required" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Entity data is required" });
    }

    // If entityType is CUSTOM, save to custom entity table using parameterized query
    if (entityType === "CUSTOM" && customEntityName) {
      const tableName = getCustomEntityTableName(customEntityName);
      
      // Build dynamic insert query using parameterized values
      const sanitizedData: Record<string, any> = {
        company_id: companyId,
        branch_id: branchId
      };

      // Map form data to column names
      for (const [key, value] of Object.entries(data)) {
        // Skip companyId and branchId from form data as we already set them above
        if (key.toLowerCase() === 'companyid' || key.toLowerCase() === 'company_id' || 
            key.toLowerCase() === 'branchid' || key.toLowerCase() === 'branch_id') {
          continue;
        }
        const columnName = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        sanitizedData[columnName] = value;
      }

      // Build SQL query with proper escaping
      // Escape function for SQL strings
      const escapeString = (str: string): string => {
        return "'" + str.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
      };

      const columnNames = Object.keys(sanitizedData);
      const columnValues = Object.values(sanitizedData);
      
      // Build column names (already sanitized, so safe to quote)
      const columnsSQL = columnNames.map(name => `"${name}"`).join(", ");
      
      // Build values with proper escaping
      const valuesSQL = columnValues.map(val => {
        if (val === null || val === undefined) return "NULL";
        if (typeof val === "string") return escapeString(val);
        if (typeof val === "number") return String(val);
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        if (val instanceof Date) return escapeString(val.toISOString());
        if (typeof val === "object") return escapeString(JSON.stringify(val));
        return escapeString(String(val));
      }).join(", ");

      // Build the full SQL query
      const insertSQL = `INSERT INTO "${tableName}" (${columnsSQL}, created_at, updated_at) VALUES (${valuesSQL}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`;

      const result = await prisma.$queryRawUnsafe(insertSQL);
      const insertedRow = Array.isArray(result) && result.length > 0 ? result[0] : null;

      if (!insertedRow || !insertedRow.id) {
        throw new Error("Failed to create custom entity record");
      }

      // Also save reference in EntityData table
      const entityData = await prisma.entityData.create({
        data: {
          entityType,
          customEntityName,
          templateId: templateId || null,
          data: data as any,
          companyId,
          branchId
        }
      });

      // Log activity for custom entity data creation
      const userId = req.userId;
      if (userId) {
        const userContext = await getUserContext(userId);
        if (userContext) {
          await logActivity({
            type: 'entity_data_created',
            message: `${userContext.name || 'User'} created ${entityType.toLowerCase()}`,
            userId: userContext.id,
            companyId: companyId || userContext.companyId || undefined,
            branchId: branchId || userContext.branchId || undefined,
            entityType: entityType.toUpperCase(),
            entityId: insertedRow.id,
          });
        }
      }

      // Return the created entity data
      return res.status(201).json({
        id: insertedRow.id,
        entityType,
        customEntityName,
        templateId: templateId || null,
        data: { ...sanitizedData, id: insertedRow.id },
        companyId,
        branchId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // For standard entity types, save to EntityData table
    const entityData = await prisma.entityData.create({
      data: {
        entityType,
        customEntityName: entityType === "CUSTOM" ? customEntityName : null,
        templateId: templateId || null,
        data: data as any,
        companyId,
        branchId
      }
    });

    // Deals: if created in a stage that has outgoing connections, auto-copy to connected stage(s).
    if (entityType === "DEAL") {
      const createdStageIdRaw = (data as any)?.stageId;
      const createdStageId = createdStageIdRaw != null ? parseInt(String(createdStageIdRaw), 10) : NaN;
      if (!Number.isNaN(createdStageId)) {
        const conns = await prisma.pipelineConnection.findMany({
          where: { fromStageId: createdStageId },
          select: { id: true, toStageId: true }
        });

        for (const c of conns) {
          const exists = await prisma.entityData.findFirst({
            where: {
              entityType: "DEAL",
              companyId,
              branchId,
              AND: [
                {
                  data: {
                    path: ["__copiedFromId"],
                    equals: entityData.id
                  } as any
                },
                {
                  data: {
                    path: ["__copiedViaConnectionId"],
                    equals: c.id
                  } as any
                },
                {
                  data: {
                    path: ["stageId"],
                    equals: c.toStageId
                  } as any
                }
              ]
            }
          });
          if (exists) continue;

          const copied = {
            ...(data as any),
            stageId: Number(c.toStageId),
            __copiedFromId: entityData.id,
            __copiedViaConnectionId: c.id,
            __copiedAt: new Date().toISOString()
          };
          await prisma.entityData.create({
            data: {
              entityType: "DEAL",
              customEntityName: null,
              templateId: templateId || null,
              data: copied as any,
              companyId,
              branchId
            }
          });
        }
      }
    }

    // Log activity for entity data creation (get userId from authenticated request)
    const userId = req.userId;
    if (userId) {
      const userContext = await getUserContext(userId);
      if (userContext) {
        await logActivity({
          type: 'entity_data_created',
          message: `${userContext.name || 'User'} created ${entityType.toLowerCase()}`,
          userId: userContext.id,
          companyId: companyId || userContext.companyId || undefined,
          branchId: branchId || userContext.branchId || undefined,
          entityType: entityType.toUpperCase(),
          entityId: entityData.id,
        });
      }
    }

    res.status(201).json(entityData);
  } catch (error: any) {
    console.error("Error creating entity data:", error);
    res.status(500).json({ error: "Failed to create entity data", details: error.message });
  }
};

/**
 * Update entity data
 */
export const updateEntityData = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const companyId = req.user?.companyId || null;
    const branchId = req.user?.branchId || null;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Entity data is required" });
    }

    const entityId = parseInt(id);
    if (isNaN(entityId)) {
      return res.status(400).json({ error: "Invalid entity ID" });
    }

    // Check if entity exists and get its type
    const existingEntity = await prisma.entityData.findUnique({
      where: { id: entityId }
    });

    if (!existingEntity) {
      return res.status(404).json({ error: "Entity not found" });
    }

    // If it's a CUSTOM entity, update the custom table
    if (existingEntity.entityType === "CUSTOM" && existingEntity.customEntityName) {
      const tableName = getCustomEntityTableName(existingEntity.customEntityName);
      
      // Escape function for SQL strings
      const escapeString = (str: string): string => {
        return "'" + str.replace(/'/g, "''").replace(/\\/g, "\\\\") + "'";
      };

      // Build dynamic update query with proper escaping
      const updates: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        const columnName = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
        let sqlValue: string;
        if (value === null || value === undefined) {
          sqlValue = "NULL";
        } else if (typeof value === "string") {
          sqlValue = escapeString(value);
        } else if (typeof value === "number") {
          sqlValue = String(value);
        } else if (typeof value === "boolean") {
          sqlValue = value ? "TRUE" : "FALSE";
        } else if (value instanceof Date) {
          sqlValue = escapeString(value.toISOString());
        } else if (typeof value === "object") {
          sqlValue = escapeString(JSON.stringify(value));
        } else {
          sqlValue = escapeString(String(value));
        }
        updates.push(`"${columnName}" = ${sqlValue}`);
      }

      updates.push(`"updated_at" = CURRENT_TIMESTAMP`);

      const updateSQL = `UPDATE "${tableName}" SET ${updates.join(", ")} WHERE id = ${entityId} RETURNING id, company_id, branch_id, created_at, updated_at`;

      const result = await prisma.$queryRawUnsafe(updateSQL);
      const updatedRow = Array.isArray(result) && result.length > 0 ? result[0] : null;

      if (!updatedRow) {
        return res.status(404).json({ error: "Custom entity record not found" });
      }

      // Also update EntityData record
      await prisma.entityData.update({
        where: { id: entityId },
        data: {
          data: data as any,
          updatedAt: new Date()
        }
      });

      // Log activity for entity data update
      const userId = req.userId;
      if (userId) {
        const userContext = await getUserContext(userId);
        if (userContext) {
          await logActivity({
            type: 'entity_data_updated',
            message: `${userContext.name || 'User'} updated ${existingEntity.entityType.toLowerCase()}`,
            userId: userContext.id,
            companyId: companyId || userContext.companyId || undefined,
            branchId: branchId || userContext.branchId || undefined,
            entityType: existingEntity.entityType,
            entityId: entityId,
          });
        }
      }

      return res.json({
        id: updatedRow.id,
        entityType: existingEntity.entityType,
        customEntityName: existingEntity.customEntityName,
        data: { ...data, id: updatedRow.id },
        companyId,
        branchId,
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at
      });
    }

    // For standard entity types, update EntityData table
    const updatedEntity = await prisma.entityData.update({
      where: { id: entityId },
      data: {
        data: data as any,
        updatedAt: new Date()
      }
    });

    // Deals: when a deal is moved into a stage with outgoing connections, copy it to the connected stage(s).
    if (existingEntity.entityType === "DEAL") {
      const prevStageIdRaw = (existingEntity.data as any)?.stageId;
      const nextStageIdRaw = (data as any)?.stageId;
      const prevStageId = prevStageIdRaw != null ? parseInt(String(prevStageIdRaw), 10) : NaN;
      const nextStageId = nextStageIdRaw != null ? parseInt(String(nextStageIdRaw), 10) : NaN;

      if (!Number.isNaN(nextStageId) && (Number.isNaN(prevStageId) || prevStageId !== nextStageId)) {
        const conns = await prisma.pipelineConnection.findMany({
          where: { fromStageId: nextStageId },
          select: { id: true, toStageId: true }
        });

        for (const c of conns) {
          const alreadyCopied = await prisma.entityData.findFirst({
            where: {
              entityType: "DEAL",
              companyId,
              branchId,
              AND: [
                {
                  data: {
                    path: ["__copiedFromId"],
                    equals: entityId
                  } as any
                },
                {
                  data: {
                    path: ["__copiedViaConnectionId"],
                    equals: c.id
                  } as any
                },
                {
                  data: {
                    path: ["stageId"],
                    equals: c.toStageId
                  } as any
                }
              ]
            }
          });
          if (alreadyCopied) continue;

          const copied = {
            ...(data as any),
            stageId: Number(c.toStageId),
            __copiedFromId: entityId,
            __copiedViaConnectionId: c.id,
            __copiedAt: new Date().toISOString()
          };
          await prisma.entityData.create({
            data: {
              entityType: "DEAL",
              customEntityName: null,
              templateId: existingEntity.templateId || null,
              data: copied as any,
              companyId,
              branchId
            }
          });
        }
      }
    }

    // Log activity for entity data update
    const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
    if (userId) {
      const userContext = await getUserContext(typeof userId === 'string' ? parseInt(userId) : userId);
      if (userContext) {
        await logActivity({
          type: 'entity_data_updated',
          message: `${userContext.name || 'User'} updated ${existingEntity.entityType.toLowerCase()}`,
          userId: userContext.id,
          companyId: companyId || userContext.companyId || undefined,
          branchId: branchId || userContext.branchId || undefined,
          entityType: existingEntity.entityType,
          entityId: entityId,
        });
      }
    }

    // Create activity for entity update
    try {
      await prisma.activity.create({
        data: {
          type: "updated",
          message: `Updated the ${existingEntity.entityType.toLowerCase()}`,
          entityType: existingEntity.entityType,
          entityId: updatedEntity.id,
          companyId,
          branchId
        }
      });
    } catch (activityError) {
      console.error("Error creating activity:", activityError);
      // Don't fail the update if activity creation fails
    }

    res.json(updatedEntity);
  } catch (error: any) {
    console.error("Error updating entity data:", error);
    res.status(500).json({ error: "Failed to update entity data", details: error.message });
  }
};

/**
 * Get entity data by ID
 */
export const getEntityData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entityId = parseInt(id);

    if (isNaN(entityId)) {
      return res.status(400).json({ error: "Invalid entity ID" });
    }

    const entityData = await prisma.entityData.findUnique({
      where: { id: entityId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true,
            customEntityName: true
          }
        }
      }
    });

    if (!entityData) {
      return res.status(404).json({ error: "Entity not found" });
    }

    // If it's a CUSTOM entity, fetch from custom table
    if (entityData.entityType === "CUSTOM" && entityData.customEntityName) {
      const tableName = getCustomEntityTableName(entityData.customEntityName);
      const customData = await prisma.$queryRawUnsafe(
        `SELECT * FROM "${tableName}" WHERE id = ${entityId}`
      );
      
      const customRow = Array.isArray(customData) ? customData[0] : customData;
      if (customRow) {
        return res.json({
          ...entityData,
          data: customRow
        });
      }
    }

    res.json(entityData);
  } catch (error: any) {
    console.error("Error fetching entity data:", error);
    res.status(500).json({ error: "Failed to fetch entity data", details: error.message });
  }
};

/**
 * Get all entity data by type
 */
export const getEntityDataByType = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType } = req.params;
    const user = req.user;
    const companyId = user?.companyId || null;
    const branchId = user?.branchId || null;

    if (!entityType) {
      return res.status(400).json({ error: "Entity type is required" });
    }

    const where: any = {
      entityType: entityType.toUpperCase()
    };

    if (companyId) {
      where.companyId = companyId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const entityDataList = await prisma.entityData.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            entityType: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(entityDataList);
  } catch (error: any) {
    console.error("Error fetching entity data by type:", error);
    res.status(500).json({ error: "Failed to fetch entity data", details: error.message });
  }
};

/**
 * Delete entity data
 */
export const deleteEntityData = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const entityId = parseInt(id);

    if (isNaN(entityId)) {
      return res.status(400).json({ error: "Invalid entity ID" });
    }

    const existingEntity = await prisma.entityData.findUnique({
      where: { id: entityId }
    });

    if (!existingEntity) {
      return res.status(404).json({ error: "Entity not found" });
    }

    // Log activity for entity data deletion (get userId from authenticated request)
    const userId = req.userId;
    if (userId) {
      const userContext = await getUserContext(userId);
      if (userContext) {
        await logActivity({
          type: 'entity_data_deleted',
          message: `${userContext.name || 'User'} deleted ${existingEntity.entityType.toLowerCase()}`,
          userId: userContext.id,
          companyId: existingEntity.companyId || userContext.companyId || undefined,
          branchId: existingEntity.branchId || userContext.branchId || undefined,
          entityType: existingEntity.entityType,
          entityId: entityId,
        });
      }
    }

    // If it's a CUSTOM entity, delete from custom table
    if (existingEntity.entityType === "CUSTOM" && existingEntity.customEntityName) {
      const tableName = getCustomEntityTableName(existingEntity.customEntityName);
      await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE id = ${entityId}`);
    }

    // Delete from EntityData table
    await prisma.entityData.delete({
      where: { id: entityId }
    });

    res.json({ message: "Entity deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting entity data:", error);
    res.status(500).json({ error: "Failed to delete entity data", details: error.message });
  }
};


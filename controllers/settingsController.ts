import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get user settings
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    // If settings don't exist, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to fetch user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings', details: error.message });
  }
};

// Update profile settings
export const updateProfileSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { username, email, bio, urls, avatar, skills } = req.body;

    // Update user email and image if provided
    const userUpdateData: any = {};
    if (email) userUpdateData.email = email;
    if (avatar) userUpdateData.image = avatar; // Update User.image when avatar is set in settings

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: userIdNum },
        data: userUpdateData
      });
    }

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (urls !== undefined) updateData.profileUrls = urls;
    if (avatar !== undefined) updateData.avatar = avatar;
    // Always update skills if provided (including empty array)
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) ? skills : [];
    }

    // Only proceed with update if there's data to update
    if (Object.keys(updateData).length === 0) {
      // If no data to update, just return existing settings
      const existingSettings = await prisma.userSettings.findUnique({
        where: { userId: userIdNum },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
      if (existingSettings) {
        return res.json({
          ...existingSettings,
          skills: (existingSettings as any).skills || []
        });
      }
      return res.json({ skills: [] });
    }

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for profile settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'profile_settings_updated',
        message: `${userContext.name || 'User'} updated their profile settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.id,
      });
    }

    // Return the updated settings with skills included
    res.json({
      ...settings,
      skills: (settings as any).skills || []
    });
  } catch (error: any) {
    console.error('Failed to update profile settings:', error);
    res.status(500).json({ error: 'Failed to update profile settings', details: error.message });
  }
};

// Update account settings
export const updateAccountSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { name, dob, language } = req.body;

    // Update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: userIdNum },
        data: { name }
      });
    }

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (dob !== undefined) updateData.dateOfBirth = dob ? new Date(dob) : null;
    if (language !== undefined) updateData.language = language;

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for account settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'settings_updated',
        message: `${userContext.name || 'User'} updated account settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.userId,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to update account settings:', error);
    res.status(500).json({ error: 'Failed to update account settings', details: error.message });
  }
};

// Update billing settings
export const updateBillingSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { billingPlan, nextPaymentDate, paymentMethods } = req.body;

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (billingPlan !== undefined) updateData.billingPlan = billingPlan;
    if (nextPaymentDate !== undefined) updateData.nextPaymentDate = nextPaymentDate ? new Date(nextPaymentDate) : null;
    if (paymentMethods !== undefined) updateData.paymentMethods = paymentMethods;

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for billing settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'settings_updated',
        message: `${userContext.name || 'User'} updated billing settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.userId,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to update billing settings:', error);
    res.status(500).json({ error: 'Failed to update billing settings', details: error.message });
  }
};

// Get billing transactions (this would typically come from a separate transactions table)
export const getBillingTransactions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    // For now, return empty array. In a real app, this would query a transactions table
    res.json([]);
  } catch (error: any) {
    console.error('Failed to fetch billing transactions:', error);
    res.status(500).json({ error: 'Failed to fetch billing transactions', details: error.message });
  }
};

// Update appearance settings
export const updateAppearanceSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { theme, font } = req.body;

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (font !== undefined) updateData.font = font;

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for appearance settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'settings_updated',
        message: `${userContext.name || 'User'} updated appearance settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.userId,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to update appearance settings:', error);
    res.status(500).json({ error: 'Failed to update appearance settings', details: error.message });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { 
      type, 
      mobile, 
      communication_emails, 
      social_emails, 
      marketing_emails, 
      security_emails 
    } = req.body;

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (type !== undefined) updateData.notificationType = type;
    if (mobile !== undefined) updateData.mobileNotifications = mobile;
    if (communication_emails !== undefined) updateData.communicationEmails = communication_emails;
    if (social_emails !== undefined) updateData.socialEmails = social_emails;
    if (marketing_emails !== undefined) updateData.marketingEmails = marketing_emails;
    if (security_emails !== undefined) updateData.securityEmails = security_emails;

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for notification settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'settings_updated',
        message: `${userContext.name || 'User'} updated notification settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.userId,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to update notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings', details: error.message });
  }
};

// Update display settings
export const updateDisplaySettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { items } = req.body;

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    const updateData: any = {};
    if (items !== undefined) updateData.sidebarItems = items;

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      });
    }

    // Log activity for display settings update
    const userContext = await getUserContext(userIdNum);
    if (userContext) {
      await logActivity({
        type: 'settings_updated',
        message: `${userContext.name || 'User'} updated display settings`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'USER_SETTINGS',
        entityId: settings.userId,
      });
    }

    res.json(settings);
  } catch (error: any) {
    console.error('Failed to update display settings:', error);
    res.status(500).json({ error: 'Failed to update display settings', details: error.message });
  }
};

// Update table preferences (column visibility, sorting, etc.)
export const updateTablePreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { tableName, preferences } = req.body; // tableName: "companies", preferences: { name: true, email: false, ... }

    // Get or create settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: userIdNum }
    });

    let currentTablePreferences: any = {};
    if (settings?.tablePreferences) {
      try {
        currentTablePreferences = typeof settings.tablePreferences === 'string' 
          ? JSON.parse(settings.tablePreferences as string)
          : settings.tablePreferences;
      } catch (e) {
        currentTablePreferences = {};
      }
    }

    // Update preferences for the specific table
    const updatedPreferences = {
      ...currentTablePreferences,
      [tableName]: preferences
    };

    const updateData: any = {
      tablePreferences: updatedPreferences
    };

    if (settings) {
      settings = await prisma.userSettings.update({
        where: { userId: userIdNum },
        data: updateData
      });
    } else {
      settings = await prisma.userSettings.create({
        data: {
          userId: userIdNum,
          ...updateData
        }
      });
    }

    res.json({ success: true, tablePreferences: updatedPreferences });
  } catch (error: any) {
    console.error('Failed to update table preferences:', error);
    res.status(500).json({ error: 'Failed to update table preferences', details: error.message });
  }
};




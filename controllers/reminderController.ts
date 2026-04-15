import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

// Get all reminders
export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const where: any = {};
    if (user.companyId) {
      where.companyId = user.companyId;
    }
    if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.companyId) {
      where.branchId = null;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        dueDate: "asc"
      }
    });

    res.json(reminders);
  } catch (error: any) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reminders" });
  }
};

// Get a single reminder by ID
export const getReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.json(reminder);
  } catch (error: any) {
    console.error("Error fetching reminder:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reminder" });
  }
};

// Create a new reminder
export const createReminder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { note, priority, category, dueDate, isCompleted } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reminder = await prisma.reminder.create({
      data: {
        note,
        priority: priority || "MEDIUM",
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        isCompleted: isCompleted || false,
        userId,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    res.status(201).json(reminder);
  } catch (error: any) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ error: error.message || "Failed to create reminder" });
  }
};

// Update a reminder
export const updateReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { note, priority, category, dueDate, isCompleted } = req.body;

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        note,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isCompleted
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    res.json(reminder);
  } catch (error: any) {
    console.error("Error updating reminder:", error);
    res.status(500).json({ error: error.message || "Failed to update reminder" });
  }
};

// Delete a reminder
export const deleteReminder = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.reminder.delete({
      where: { id }
    });

    res.json({ message: "Reminder deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting reminder:", error);
    res.status(500).json({ error: error.message || "Failed to delete reminder" });
  }
};

























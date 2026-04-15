import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

export const getNoteLabels = async (req: Request, res: Response) => {
  try {
    const noteLabel = await prisma.noteLabel.findMany();
    res.json(noteLabel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note Labels' });
  }
};

export const getNoteLabelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const noteLabel = await prisma.noteLabel.findUnique({
      where: { id: parseInt(id) }
    });
    if (noteLabel) {
      res.json(noteLabel);
    } else {
      res.status(404).json({ error: 'Note Label not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Note Label' });
  }
};

export const createNoteLabel = async (req: Request, res: Response) => {
  try {
    const { title, color, userId } = req.body;
    const noteLabel = await prisma.noteLabel.create({
      data: { title, color, userId: userId ? parseInt(userId) : null }
    });

    // Log activity for note label creation
    if (noteLabel.userId) {
      const userContext = await getUserContext(noteLabel.userId);
      if (userContext) {
        await logActivity({
          type: 'note_label_created',
          message: `${userContext.name || 'User'} created note label "${title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE_LABEL',
          entityId: noteLabel.id,
        });
      }
    }

    res.status(201).json(noteLabel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note Label' });
  }
};
export const updateNoteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;

    // Get note label before updating for activity logging
    const existingLabel = await prisma.noteLabel.findUnique({
      where: { id: parseInt(id) },
      select: { title: true, userId: true }
    });

    const noteLabel = await prisma.noteLabel.update({
      where: { id: parseInt(id) },
      data: { title, color }
    });

    // Log activity for note label update
    if (noteLabel.userId && existingLabel) {
      const userContext = await getUserContext(noteLabel.userId);
      if (userContext) {
        await logActivity({
          type: 'note_label_updated',
          message: `${userContext.name || 'User'} updated note label "${noteLabel.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE_LABEL',
          entityId: noteLabel.id,
        });
      }
    }

    res.json(noteLabel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note Label' });
  }
};
export const deleteNoteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get note label details before deleting for activity logging
    const noteLabel = await prisma.noteLabel.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true, userId: true }
    });

    if (noteLabel && noteLabel.userId) {
      const userContext = await getUserContext(noteLabel.userId);
      if (userContext) {
        await logActivity({
          type: 'note_label_deleted',
          message: `${userContext.name || 'User'} deleted note label "${noteLabel.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE_LABEL',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.noteLabel.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note Label' });
  }
};
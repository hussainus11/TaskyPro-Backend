import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all notes for a user (or all notes if no userId provided)
export const getNotes = async (req: Request, res: Response) => {
  try {
    console.log('GET /notes called');
    const { userId } = req.query;
    console.log('Query params:', { userId });
    
    const where = userId ? { userId: parseInt(userId as string) } : {};
    
    const notes = await prisma.note.findMany({
      where,
      include: {
        labels: true,
        checklistItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.json(notes);
  } catch (error: any) {
    console.error('Failed to fetch notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', details: error.message });
  }
};

// Get all notes for a specific user (from route param)
export const getNotesForUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        labels: true,
        checklistItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    res.json(notes);
  } catch (error: any) {
    console.error('Failed to fetch notes for user:', error);
    res.status(500).json({ error: 'Failed to fetch notes', details: error.message });
  }
};

// Create a note for a specific user (from route param)
export const createNoteForUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { title, content, type, isArchived, image, labelIds, checklistItems } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Note type is required' });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content || null,
        type,
        isArchived: isArchived || false,
        image: image || null,
        userId,
        labels: labelIds && labelIds.length > 0 ? {
          connect: labelIds.map((id: number) => ({ id: parseInt(id.toString()) }))
        } : undefined,
        checklistItems: checklistItems && checklistItems.length > 0 ? {
          create: checklistItems.map((item: { text: string; checked?: boolean }) => ({
            text: item.text,
            checked: item.checked || false
          }))
        } : undefined
      },
      include: {
        labels: true,
        checklistItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for note creation
    const user = note.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'note_created',
          message: `${userContext.name || 'User'} created note "${title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE',
          entityId: note.id,
        });
      }
    }
    
    res.status(201).json(note);
  } catch (error: any) {
    console.error('Failed to create note:', error);
    res.status(500).json({ error: 'Failed to create note', details: error.message });
  }
};

// Get a single note by ID
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: {
        labels: true,
        checklistItems: true
      }
    });
    if (note) {
      res.json(note);
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

// Create a new note
export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, content, type, isArchived, image, userId, labelIds, checklistItems } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Note type is required' });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content || null,
        type,
        isArchived: isArchived || false,
        image: image || null,
        userId: parseInt(userId),
        labels: labelIds && labelIds.length > 0 ? {
          connect: labelIds.map((id: number) => ({ id: parseInt(id.toString()) }))
        } : undefined,
        checklistItems: checklistItems && checklistItems.length > 0 ? {
          create: checklistItems.map((item: { text: string; checked?: boolean }) => ({
            text: item.text,
            checked: item.checked || false
          }))
        } : undefined
      },
      include: {
        labels: true,
        checklistItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for note creation (for createNote route)
    const user = note.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'note_created',
          message: `${userContext.name || 'User'} created note "${title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE',
          entityId: note.id,
        });
      }
    }
    
    res.status(201).json(note);
  } catch (error: any) {
    console.error('Failed to create note:', error);
    res.status(500).json({ error: 'Failed to create note', details: error.message });
  }
};

// Update a note
export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, type, isArchived, image, labelIds, checklistItems } = req.body;

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (image !== undefined) updateData.image = image;

    // Handle labels update
    if (labelIds !== undefined) {
      updateData.labels = {
        set: labelIds && labelIds.length > 0 
          ? labelIds.map((id: number) => ({ id: parseInt(id.toString()) }))
          : []
      };
    }

    // Handle checklist items update
    if (checklistItems !== undefined) {
      // Delete existing checklist items
      await prisma.noteChecklistItem.deleteMany({
        where: { noteId: parseInt(id) }
      });
      
      // Create new checklist items if provided
      if (checklistItems && checklistItems.length > 0) {
        updateData.checklistItems = {
          create: checklistItems.map((item: { text: string; checked?: boolean }) => ({
            text: item.text,
            checked: item.checked || false
          }))
        };
      }
    }

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        labels: true,
        checklistItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for note update
    const user = note.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'note_updated',
          message: `${userContext.name || 'User'} updated note "${note.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE',
          entityId: note.id,
        });
      }
    }
    
    res.json(note);
  } catch (error: any) {
    console.error('Failed to update note:', error);
    res.status(500).json({ error: 'Failed to update note', details: error.message });
  }
};

// Delete a note
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get note details before deleting for activity logging
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      select: { 
        id: true,
        title: true,
        userId: true
      }
    });

    if (note && note.userId) {
      const userContext = await getUserContext(note.userId);
      if (userContext) {
        await logActivity({
          type: 'note_deleted',
          message: `${userContext.name || 'User'} deleted note "${note.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'NOTE',
          entityId: note.id,
        });
      }
    }

    await prisma.note.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
};

// Get all note labels for a user (or all labels if no userId provided)
export const getNoteLabels = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const where = userId ? { userId: parseInt(userId as string) } : {};
    
    const labels = await prisma.noteLabel.findMany({
      where,
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(labels);
  } catch (error: any) {
    console.error('Failed to fetch note labels:', error);
    res.status(500).json({ error: 'Failed to fetch note labels', details: error.message });
  }
};

// Get all note labels for a specific user (from route param)
export const getNoteLabelsForUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    const labels = await prisma.noteLabel.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(labels);
  } catch (error: any) {
    console.error('Failed to fetch note labels for user:', error);
    res.status(500).json({ error: 'Failed to fetch note labels', details: error.message });
  }
};

// Create a new note label
export const createNoteLabel = async (req: Request, res: Response) => {
  try {
    const { title, color, userId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!color) {
      return res.status(400).json({ error: 'Color is required' });
    }

    const label = await prisma.noteLabel.create({
      data: {
        title,
        color,
        userId: parseInt(userId)
      },
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    });
    
    res.status(201).json(label);
  } catch (error: any) {
    console.error('Failed to create note label:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Note label with this title already exists for this user' });
    } else {
      res.status(500).json({ error: 'Failed to create note label', details: error.message });
    }
  }
};

// Update a note label
export const updateNoteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;

    // Check if label exists
    const existingLabel = await prisma.noteLabel.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLabel) {
      return res.status(404).json({ error: 'Note label not found' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (color !== undefined) updateData.color = color;

    const label = await prisma.noteLabel.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    });
    
    res.json(label);
  } catch (error: any) {
    console.error('Failed to update note label:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Note label with this title already exists for this user' });
    } else {
      res.status(500).json({ error: 'Failed to update note label', details: error.message });
    }
  }
};

// Delete a note label
export const deleteNoteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.noteLabel.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note label' });
  }
};
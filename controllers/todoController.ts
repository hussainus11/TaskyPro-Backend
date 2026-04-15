import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all todos for a user (or all todos if no userId provided)
export const getTodos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const where = userId ? { userId: parseInt(userId as string) } : {};
    
    const todos = await prisma.todo.findMany({
      where,
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        subTasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Map status from backend format (inProgress) to frontend format (in-progress)
    const mappedTodos = todos.map(todo => ({
      ...todo,
      status: todo.status === 'inProgress' ? 'in-progress' : todo.status
    }));
    
    res.json(mappedTodos);
  } catch (error: any) {
    console.error('Failed to fetch todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
};

// Get all todos for a specific user (from route param)
export const getTodosForUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    const todos = await prisma.todo.findMany({
      where: { userId },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        subTasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Map status from backend format (inProgress) to frontend format (in-progress)
    const mappedTodos = todos.map(todo => ({
      ...todo,
      status: todo.status === 'inProgress' ? 'in-progress' : todo.status
    }));
    
    res.json(mappedTodos);
  } catch (error: any) {
    console.error('Failed to fetch todos for user:', error);
    res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
};

// Get a single todo by ID
export const getTodoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        subTasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (todo) {
      // Map status from backend format (inProgress) to frontend format (in-progress)
      const mappedTodo = {
        ...todo,
        status: todo.status === 'inProgress' ? 'in-progress' : todo.status
      };
      res.json(mappedTodo);
    } else {
      res.status(404).json({ error: 'Todo not found' });
    }
  } catch (error: any) {
    console.error('Failed to fetch todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo', details: error.message });
  }
};

// Create a new todo
export const createTodo = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      starred, 
      dueDate, 
      reminderDate,
      userId,
      assignedTo,
      comments,
      files,
      subTasks,
      position
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Get max position for ordering
    const maxPosition = await prisma.todo.aggregate({
      where: userId ? { userId: parseInt(userId) } : {},
      _max: {
        position: true
      }
    });

    const todo = await prisma.todo.create({
      data: {
        id: randomUUID(),
        title,
        description: description || null,
        status: status || 'pending',
        priority: priority || 'medium',
        starred: starred || false,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        userId: userId ? parseInt(userId) : null,
        assignedTo: assignedTo || [],
        position: position !== undefined ? position : (maxPosition._max.position ?? 0) + 1,
        comments: comments && comments.length > 0 ? {
          create: comments.map((comment: { text: string }) => ({
            id: randomUUID(),
            text: comment.text
          }))
        } : undefined,
        files: files && files.length > 0 ? {
          create: files.map((file: { name: string; url: string; type: string; size: number }) => ({
            id: randomUUID(),
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size
          }))
        } : undefined,
        subTasks: subTasks && subTasks.length > 0 ? {
          create: subTasks.map((subTask: { title: string; completed?: boolean }) => ({
            id: randomUUID(),
            title: subTask.title,
            completed: subTask.completed || false
          }))
        } : undefined
      },
      include: {
        comments: true,
        files: true,
        subTasks: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for todo creation
    const user = todo.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'todo_created',
          message: `${userContext.name || 'User'} created todo "${title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'TODO',
          entityId: todo.id,
        });
      }
    }
    
    // Map status from backend format (inProgress) to frontend format (in-progress)
    const mappedTodo = {
      ...todo,
      status: todo.status === 'inProgress' ? 'in-progress' : todo.status
    };
    
    res.status(201).json(mappedTodo);
  } catch (error: any) {
    console.error('Failed to create todo:', error);
    res.status(500).json({ error: 'Failed to create todo', details: error.message });
  }
};

// Update a todo
export const updateTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      status, 
      priority, 
      starred, 
      dueDate, 
      reminderDate,
      assignedTo,
      position
    } = req.body;

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (starred !== undefined) updateData.starred = starred;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (reminderDate !== undefined) updateData.reminderDate = reminderDate ? new Date(reminderDate) : null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (position !== undefined) updateData.position = position;

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        files: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        subTasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for todo update
    const user = todo.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'todo_updated',
          message: `${userContext.name || 'User'} updated todo "${todo.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'TODO',
          entityId: todo.id,
        });
      }
    }
    
    // Map status from backend format (inProgress) to frontend format (in-progress)
    const mappedTodo = {
      ...todo,
      status: todo.status === 'inProgress' ? 'in-progress' : todo.status
    };
    
    res.json(mappedTodo);
  } catch (error: any) {
    console.error('Failed to update todo:', error);
    res.status(500).json({ error: 'Failed to update todo', details: error.message });
  }
};

// Delete a todo
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Log activity for todo deletion
    if (existingTodo.userId) {
      const userContext = await getUserContext(existingTodo.userId);
      if (userContext) {
        await logActivity({
          type: 'todo_deleted',
          message: `${userContext.name || 'User'} deleted todo "${existingTodo.title}"`,
          userId: userContext.id,
          companyId: userContext.companyId || undefined,
          branchId: userContext.branchId || undefined,
          entityType: 'TODO',
          entityId: id,
        });
      }
    }

    await prisma.todo.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete todo:', error);
    res.status(500).json({ error: 'Failed to delete todo', details: error.message });
  }
};

// Reorder todos
export const reorderTodos = async (req: Request, res: Response) => {
  try {
    const { todoPositions } = req.body;

    if (!Array.isArray(todoPositions)) {
      return res.status(400).json({ error: 'todoPositions must be an array' });
    }

    // Update positions in a transaction
    await prisma.$transaction(
      todoPositions.map(({ id, position }: { id: string; position: number }) =>
        prisma.todo.update({
          where: { id },
          data: { position }
        })
      )
    );

    res.json({ message: 'Todos reordered successfully' });
  } catch (error: any) {
    console.error('Failed to reorder todos:', error);
    res.status(500).json({ error: 'Failed to reorder todos', details: error.message });
  }
};

// Add a comment to a todo
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const comment = await prisma.todoComment.create({
      data: {
        id: randomUUID(),
        text,
        todoId: id
      }
    });

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;

    // Check if comment exists
    const existingComment = await prisma.todoComment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.todoId !== id) {
      return res.status(400).json({ error: 'Comment does not belong to this todo' });
    }

    await prisma.todoComment.delete({
      where: { id: commentId }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete comment', details: error.message });
  }
};

// Add a file to a todo
export const addFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, type, size } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'File name and URL are required' });
    }

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const file = await prisma.todoFile.create({
      data: {
        id: randomUUID(),
        name,
        url,
        type: type || 'application/octet-stream',
        size: size || 0,
        todoId: id
      }
    });

    res.status(201).json(file);
  } catch (error: any) {
    console.error('Failed to add file:', error);
    res.status(500).json({ error: 'Failed to add file', details: error.message });
  }
};

// Remove a file from a todo
export const removeFile = async (req: Request, res: Response) => {
  try {
    const { id, fileId } = req.params;

    // Check if file exists
    const existingFile = await prisma.todoFile.findUnique({
      where: { id: fileId }
    });

    if (!existingFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (existingFile.todoId !== id) {
      return res.status(400).json({ error: 'File does not belong to this todo' });
    }

    await prisma.todoFile.delete({
      where: { id: fileId }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to remove file:', error);
    res.status(500).json({ error: 'Failed to remove file', details: error.message });
  }
};

// Add a subtask to a todo
export const addSubTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id }
    });

    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const subTask = await prisma.todoSubTask.create({
      data: {
        id: randomUUID(),
        title,
        completed: false,
        todoId: id
      }
    });

    res.status(201).json(subTask);
  } catch (error: any) {
    console.error('Failed to add subtask:', error);
    res.status(500).json({ error: 'Failed to add subtask', details: error.message });
  }
};

// Update a subtask
export const updateSubTask = async (req: Request, res: Response) => {
  try {
    const { id, subTaskId } = req.params;
    const { title, completed } = req.body;

    // Check if subtask exists
    const existingSubTask = await prisma.todoSubTask.findUnique({
      where: { id: subTaskId }
    });

    if (!existingSubTask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    if (existingSubTask.todoId !== id) {
      return res.status(400).json({ error: 'Subtask does not belong to this todo' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    const subTask = await prisma.todoSubTask.update({
      where: { id: subTaskId },
      data: updateData
    });

    res.json(subTask);
  } catch (error: any) {
    console.error('Failed to update subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask', details: error.message });
  }
};

// Remove a subtask from a todo
export const removeSubTask = async (req: Request, res: Response) => {
  try {
    const { id, subTaskId } = req.params;

    // Check if subtask exists
    const existingSubTask = await prisma.todoSubTask.findUnique({
      where: { id: subTaskId }
    });

    if (!existingSubTask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    if (existingSubTask.todoId !== id) {
      return res.status(400).json({ error: 'Subtask does not belong to this todo' });
    }

    await prisma.todoSubTask.delete({
      where: { id: subTaskId }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to remove subtask:', error);
    res.status(500).json({ error: 'Failed to remove subtask', details: error.message });
  }
};


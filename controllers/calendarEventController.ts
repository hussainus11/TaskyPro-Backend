import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createNotification } from './notificationController';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Helper function to check if calendarEvent model is available
function checkCalendarEventModel() {
  try {
    // Try to access the model
    if (!prisma || !(prisma as any).calendarEvent) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Get all calendar events for a user (or all events if no userId provided)
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    // Check if model is available
    if (!checkCalendarEventModel()) {
      console.error('CalendarEvent model not found on prisma client');
      console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
      return res.status(500).json({ 
        error: 'CalendarEvent model not available on Prisma client',
        hint: 'Please restart the backend server after running: npx prisma generate && npx prisma db push'
      });
    }

    const { userId, startDate, endDate } = req.query;
    
    const where: any = {};
    
    if (userId) {
      where.userId = parseInt(userId as string);
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      where.OR = [];
      if (startDate && endDate) {
        // Events that overlap with the date range
        where.OR.push({
          AND: [
            { start: { lte: new Date(endDate as string) } },
            { end: { gte: new Date(startDate as string) } }
          ]
        });
      } else if (startDate) {
        where.end = { gte: new Date(startDate as string) };
      } else if (endDate) {
        where.start = { lte: new Date(endDate as string) };
      }
    }
    
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    });
    
    // Convert to frontend format
    const mappedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      color: event.color || 'sky',
      location: event.location || undefined,
    }));
    
    res.json(mappedEvents);
  } catch (error: any) {
    console.error('Failed to fetch calendar events:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    const errorMessage = error.message || 'Failed to fetch calendar events';
    
    // Check if it's a Prisma model access error
    if (errorMessage.includes('findMany') || errorMessage.includes('undefined') || errorMessage.includes('Cannot read properties')) {
      console.error('Prisma client issue detected. CalendarEvent model may not be available.');
      return res.status(500).json({ 
        error: 'CalendarEvent model not available. Please ensure: 1) Database migration is applied (npx prisma db push), 2) Prisma client is regenerated (npx prisma generate), 3) Backend server is restarted',
        details: errorMessage,
        code: error.code
      });
    }
    res.status(500).json({ error: 'Failed to fetch calendar events', details: errorMessage, code: error.code });
  }
};

// Get a single calendar event by ID
export const getCalendarEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    
    res.json({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      color: event.color || 'sky',
      location: event.location || undefined,
    });
  } catch (error: any) {
    console.error('Failed to fetch calendar event:', error);
    res.status(500).json({ error: 'Failed to fetch calendar event', details: error.message });
  }
};

// Create a new calendar event
export const createCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, start, end, allDay, color, location, userId, companyId, branchId } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Title, start, and end are required' });
    }
    
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
        color: color || 'sky',
        location: location || null,
        userId: userId ? parseInt(userId) : null,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for calendar event creation
    const user = event.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'calendar_event_created',
          message: `${userContext.name || 'User'} created calendar event "${title}"`,
          userId: userContext.id,
          companyId: companyId ? parseInt(companyId) : userContext.companyId || undefined,
          branchId: branchId ? parseInt(branchId) : userContext.branchId || undefined,
          entityType: 'CALENDAR_EVENT',
          entityId: event.id,
        });
      }
    }
    
    res.status(201).json({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      color: event.color || 'sky',
      location: event.location || undefined,
    });
  } catch (error: any) {
    console.error('Failed to create calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event', details: error.message });
  }
};

// Update a calendar event
export const updateCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, allDay, color, location, userId, companyId, branchId } = req.body;
    
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (start !== undefined) updateData.start = new Date(start);
    if (end !== undefined) updateData.end = new Date(end);
    if (allDay !== undefined) updateData.allDay = allDay;
    if (color !== undefined) updateData.color = color;
    if (location !== undefined) updateData.location = location || null;
    if (userId !== undefined) updateData.userId = userId ? parseInt(userId) : null;
    if (companyId !== undefined) updateData.companyId = companyId ? parseInt(companyId) : null;
    if (branchId !== undefined) updateData.branchId = branchId ? parseInt(branchId) : null;
    
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Log activity for calendar event update
    const user = event.user;
    if (user) {
      const userContext = await getUserContext(user.id);
      if (userContext) {
        await logActivity({
          type: 'calendar_event_updated',
          message: `${userContext.name || 'User'} updated calendar event "${event.title}"`,
          userId: userContext.id,
          companyId: event.companyId || userContext.companyId || undefined,
          branchId: event.branchId || userContext.branchId || undefined,
          entityType: 'CALENDAR_EVENT',
          entityId: event.id,
        });
      }
    }
    
    res.json({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      color: event.color || 'sky',
      location: event.location || undefined,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    console.error('Failed to update calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event', details: error.message });
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get event details before deleting for activity logging
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { id: true, title: true, userId: true, companyId: true, branchId: true }
    });

    if (event && event.userId) {
      const userContext = await getUserContext(event.userId);
      if (userContext) {
        await logActivity({
          type: 'calendar_event_deleted',
          message: `${userContext.name || 'User'} deleted calendar event "${event.title}"`,
          userId: userContext.id,
          companyId: event.companyId || userContext.companyId || undefined,
          branchId: event.branchId || userContext.branchId || undefined,
          entityType: 'CALENDAR_EVENT',
          entityId: id,
        });
      }
    }
    
    await prisma.calendarEvent.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Calendar event not found' });
    }
    console.error('Failed to delete calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event', details: error.message });
  }
};

// Get upcoming events for notifications
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    // Check if model is available
    if (!checkCalendarEventModel()) {
      console.error('CalendarEvent model not found on prisma client');
      console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
      return res.status(500).json({ 
        error: 'CalendarEvent model not available on Prisma client',
        hint: 'Please restart the backend server after running: npx prisma generate && npx prisma db push'
      });
    }

    const { userId, minutes = 15 } = req.query;
    const minutesUntil = parseInt(minutes as string);
    
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesUntil * 60 * 1000);
    
    const where: any = {
      start: {
        gte: now,
        lte: futureTime
      }
    };
    
    if (userId) {
      where.userId = parseInt(userId as string);
    }
    
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    });
    
    const mappedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      color: event.color || 'sky',
      location: event.location || undefined,
    }));
    
    res.json(mappedEvents);
  } catch (error: any) {
    console.error('Failed to fetch upcoming events:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    const errorMessage = error.message || 'Failed to fetch upcoming events';
    
    // Check if it's a Prisma model access error
    if (errorMessage.includes('findMany') || errorMessage.includes('undefined') || errorMessage.includes('Cannot read properties')) {
      console.error('Prisma client issue detected. CalendarEvent model may not be available.');
      return res.status(500).json({ 
        error: 'CalendarEvent model not available. Please ensure: 1) Database migration is applied (npx prisma db push), 2) Prisma client is regenerated (npx prisma generate), 3) Backend server is restarted',
        details: errorMessage,
        code: error.code
      });
    }
    res.status(500).json({ error: 'Failed to fetch upcoming events', details: errorMessage, code: error.code });
  }
};

// Check for upcoming events and create notifications
export const checkAndCreateEventNotifications = async (req: Request, res: Response) => {
  try {
    if (!checkCalendarEventModel()) {
      return res.status(500).json({ 
        error: 'CalendarEvent model not available on Prisma client'
      });
    }

    const now = new Date();
    const futureTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    // Find events starting within the next 15 minutes
    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        start: {
          gte: now,
          lte: futureTime
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyId: true,
            branchId: true,
          }
        }
      }
    });

    const notificationsCreated = [];
    const notificationIds = new Set<string>(); // Track events we've already notified about

    for (const event of upcomingEvents) {
      // Only create notification for events that have a user assigned
      if (!event.userId) continue;

      // Check if we've already created a notification for this event in the last 15 minutes
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: event.userId,
          type: 'CALENDAR_EVENT_STARTING',
          title: {
            contains: event.title
          },
          createdAt: {
            gte: new Date(now.getTime() - 15 * 60 * 1000) // Within last 15 minutes
          }
        }
      });

      if (existingNotification) {
        continue; // Skip if notification already exists
      }

      const minutesUntil = Math.round((event.start.getTime() - now.getTime()) / (1000 * 60));
      const locationText = event.location ? ` at ${event.location}` : '';
      const timeText = minutesUntil <= 0 
        ? 'is starting now' 
        : minutesUntil === 1 
        ? 'starts in 1 minute' 
        : `starts in ${minutesUntil} minutes`;

      try {
        const notification = await createNotification({
          type: 'CALENDAR_EVENT_STARTING',
          title: `Event: ${event.title}`,
          message: `${event.title}${locationText} ${timeText}.${event.description ? ` ${event.description}` : ''}`,
          userId: event.userId,
          companyId: event.user?.companyId || undefined,
          branchId: event.user?.branchId || undefined,
        });

        notificationsCreated.push({
          eventId: event.id,
          eventTitle: event.title,
          notificationId: notification.id
        });
        notificationIds.add(event.id);
      } catch (error: any) {
        console.error(`Failed to create notification for event ${event.id}:`, error);
      }
    }

    res.json({
      success: true,
      eventsChecked: upcomingEvents.length,
      notificationsCreated: notificationsCreated.length,
      notifications: notificationsCreated
    });
  } catch (error: any) {
    console.error('Failed to check and create event notifications:', error);
    res.status(500).json({ error: 'Failed to check and create event notifications', details: error.message });
  }
};


import { Router } from 'express';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
  checkAndCreateEventNotifications
} from '../controllers/calendarEventController';

const router = Router();

// Get all calendar events (with optional filters)
router.get('/', getCalendarEvents);

// Get upcoming events for notifications
router.get('/upcoming', getUpcomingEvents);

// Check for upcoming events and create notifications (called by background job)
router.post('/check-notifications', checkAndCreateEventNotifications);

// Get a single calendar event by ID
router.get('/:id', getCalendarEventById);

// Create a new calendar event
router.post('/', createCalendarEvent);

// Update a calendar event
router.put('/:id', updateCalendarEvent);

// Delete a calendar event
router.delete('/:id', deleteCalendarEvent);

export default router;


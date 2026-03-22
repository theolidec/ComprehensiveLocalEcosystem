const Event = require('../models/Event');
const RecurringEventService = require('../services/recurringEventService');
const logger = require('../config/logger');

const extractOriginalEventId = (id) => {
  if (!id) return id;
  const match = id.match(/^([a-fA-F0-9]+)_\d{4}-\d{2}-\d{2}$/);
  return match ? match[1] : id;
};

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      attendees,
      reminder,
      isRecurring,
      recurringPattern
    } = req.body;

    const event = new Event({
      title,
      description,
      date: new Date(date),
      time,
      location,
      category: category || 'work',
      attendees: attendees || [],
      reminder: reminder || 15,
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      user: req.user._id
    });

    await event.save();

    logger.info(`Event created: ${event.title} by ${req.user.email}`);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    logger.error('Event creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      error: 'Failed to create event',
      code: 'EVENT_CREATE_ERROR'
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const { startDate, endDate, category, search, includeRecurring } = req.query;
    const userId = req.user._id;

    let query = { user: userId };

    // For recurring events, we need to fetch all recurring events that might have
    // instances in the date range, plus non-recurring events in the range
    if (startDate && endDate) {
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);

      if (includeRecurring !== 'false') {
        // Fetch both:
        // 1. Non-recurring events within the date range
        // 2. All recurring events (they might have instances in the range)
        query.$or = [
          {
            // Non-recurring events in date range
            isRecurring: false,
            date: {
              $gte: rangeStart,
              $lte: rangeEnd
            }
          },
          {
            // Recurring events with start date on or before range end
            isRecurring: true,
            date: { $lte: rangeEnd }
          }
        ];
      } else {
        query.date = {
          $gte: rangeStart,
          $lte: rangeEnd
        };
      }
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      // If we already have $or for date filtering, we need to use $and
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ]
      };

      if (query.$or) {
        query = {
          $and: [
            { $or: query.$or },
            searchQuery
          ]
        };
        // Add other conditions
        if (category && category !== 'all') {
          query.$and.push({ category: category });
        }
        if (userId) {
          query.$and.push({ user: userId });
        }
      } else {
        query.$or = searchQuery.$or;
      }
    }

    const events = await Event.find(query).sort({ date: 1, time: 1 });

    // Expand recurring events if date range is provided
    let finalEvents = events;
    if (startDate && endDate && includeRecurring !== 'false') {
      finalEvents = RecurringEventService.expandRecurringEvents(
        events,
        new Date(startDate),
        new Date(endDate)
      );
    }

    res.status(200).json({ events: finalEvents });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      code: 'EVENTS_FETCH_ERROR'
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await Event.findOne({ _id: id, user: userId });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    res.status(200).json({ event });
  } catch (error) {
    logger.error('Get event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        code: 'INVALID_EVENT_ID'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch event',
      code: 'EVENT_FETCH_ERROR'
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const originalEventId = extractOriginalEventId(id);

    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const event = await Event.findOneAndUpdate(
      { _id: originalEventId, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    logger.info(`Event updated: ${event.title} by ${req.user.email}`);

    res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    logger.error('Event update error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        code: 'INVALID_EVENT_ID'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      error: 'Failed to update event',
      code: 'EVENT_UPDATE_ERROR'
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const originalEventId = extractOriginalEventId(id);

    const event = await Event.findOneAndDelete({ _id: originalEventId, user: userId });

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    logger.info(`Event deleted: ${event.title} by ${req.user.email}`);

    res.status(200).json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    logger.error('Event deletion error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid event ID',
        code: 'INVALID_EVENT_ID'
      });
    }

    res.status(500).json({
      error: 'Failed to delete event',
      code: 'EVENT_DELETE_ERROR'
    });
  }
};

const getUpcomingEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const events = await Event.findUpcomingByUser(userId, limit);

    res.status(200).json({ events });
  } catch (error) {
    logger.error('Get upcoming events error:', error);
    res.status(500).json({
      error: 'Failed to fetch upcoming events',
      code: 'UPCOMING_EVENTS_ERROR'
    });
  }
};

const getEventStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const stats = await Event.getStatsByUser(userId, targetMonth, targetYear);

    res.status(200).json(stats);
  } catch (error) {
    logger.error('Get event stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch event statistics',
      code: 'EVENT_STATS_ERROR'
    });
  }
};

const exportEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    const events = await Event.find({ user: userId }).sort({ date: 1 });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: req.user.email,
      totalEvents: events.length,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        color: event.color,
        attendees: event.attendees,
        reminder: event.reminder,
        isRecurring: event.isRecurring,
        recurringPattern: event.recurringPattern,
        isCompleted: event.isCompleted,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="calendar-export-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.status(200).json(exportData);
  } catch (error) {
    logger.error('Export events error:', error);
    res.status(500).json({
      error: 'Failed to export events',
      code: 'EVENT_EXPORT_ERROR'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventStats,
  exportEvents
};

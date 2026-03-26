const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventStats,
  exportEvents,
  importEvents
} = require('../controllers/calendarController');

router.use(authenticateToken);

router.post('/events', createEvent);

router.get('/events', getEvents);

router.get('/events/export', exportEvents);

router.post('/events/import', importEvents);

router.get('/events/upcoming', getUpcomingEvents);

router.get('/events/stats', getEventStats);

router.get('/events/:id', getEventById);

router.put('/events/:id', updateEvent);

router.delete('/events/:id', deleteEvent);

module.exports = router;

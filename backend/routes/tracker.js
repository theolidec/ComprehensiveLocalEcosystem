const express = require('express');
const mongoose = require('mongoose');
const { body, param, query } = require('express-validator');
const TrackerTask = require('../models/TrackerTask');
const TrackerQuestion = require('../models/TrackerQuestion');
const TrackerResponse = require('../models/TrackerResponse');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const logger = require('../config/logger');
const { escapeRegex } = require('../utils/regex');

const router = express.Router();

// ========================
// TASK ROUTES
// ========================

router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, recurrence, priority, category, search, sort = 'order', page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };

    if (status && ['active', 'paused', 'completed', 'archived'].includes(status)) {
      query.status = status;
    }
    if (recurrence && ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'].includes(recurrence)) {
      query.recurrence = recurrence;
    }
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      query.priority = priority;
    }
    if (category) {
      query.category = category;
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    if (sort === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      sortOptions.priority = 1;
    } else if (sort === 'dueDate') {
      sortOptions.dueDate = 1;
    } else if (sort === 'createdAt') {
      sortOptions.createdAt = -1;
    } else {
      sortOptions.order = 1;
      sortOptions.createdAt = -1;
    }

    const [tasks, total] = await Promise.all([
      TrackerTask.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      TrackerTask.countDocuments(query)
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get tracker tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', code: 'SERVER_ERROR' });
  }
});

router.get('/tasks/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()];

    const tasks = await TrackerTask.find({
      user: req.user._id,
      status: 'active'
    }).sort({ order: 1, createdAt: -1 });

    const todayTasks = tasks.filter(task => {
      if (task.recurrence === 'none') {
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          due.setHours(0, 0, 0, 0);
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          return due.getTime() === todayStart.getTime();
        }
        return !task.isCompleted;
      }
      if (task.recurrence === 'daily') return true;
      if (task.recurrence === 'weekly') return task.weeklyDays?.includes(dayName);
      if (task.recurrence === 'biweekly') {
        const start = new Date(task.startDate);
        const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        return diffDays % 14 < 7;
      }
      if (task.recurrence === 'monthly') {
        return today.getDate() === (task.startDate?.getDate() || 1);
      }
      if (task.recurrence === 'quarterly') {
        const start = new Date(task.startDate);
        const diffMonths = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
        return diffMonths % 3 === 0 && today.getDate() === start.getDate();
      }
      if (task.recurrence === 'yearly') {
        const start = new Date(task.startDate);
        return today.getDate() === start.getDate() && today.getMonth() === start.getMonth();
      }
      if (task.recurrence === 'custom' && task.customRecurrenceDays) {
        const start = new Date(task.startDate);
        const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        return diffDays % task.customRecurrenceDays === 0;
      }
      return false;
    });

    const todayStr = today.toISOString().split('T')[0];
    let response = await TrackerResponse.findOne({
      user: req.user._id,
      date: { $gte: new Date(todayStr), $lt: new Date(new Date(todayStr).getTime() + 86400000) }
    });

    const taskCompletionsMap = {};
    if (response) {
      response.taskCompletions.forEach(tc => {
        taskCompletionsMap[tc.task.toString()] = tc;
      });
    }

    const enrichedTasks = todayTasks.map(task => ({
      ...task.toObject(),
      todayCompletion: taskCompletionsMap[task._id.toString()] || { completed: false, completedAt: null, notes: null, durationMinutes: null }
    }));

    res.json({ tasks: enrichedTasks, response: response || null });
  } catch (error) {
    logger.error('Get today tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch today tasks', code: 'SERVER_ERROR' });
  }
});

router.post('/tasks', authenticateToken, [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('recurrence').optional().isIn(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  body('customRecurrenceDays').optional().isInt({ min: 1 }),
  body('weeklyDays').optional().isArray(),
  body('dueDate').optional().isISO8601(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('estimatedMinutes').optional().isInt({ min: 1 }),
  body('tags').optional().isArray()
], handleValidationErrors, async (req, res) => {
  try {
    const taskData = {
      title: req.body.title,
      description: req.body.description,
      user: req.user._id,
      category: req.body.category || 'General',
      priority: req.body.priority || 'medium',
      recurrence: req.body.recurrence || 'none',
      customRecurrenceDays: req.body.customRecurrenceDays,
      weeklyDays: req.body.weeklyDays,
      dueDate: req.body.dueDate,
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate,
      estimatedMinutes: req.body.estimatedMinutes,
      tags: req.body.tags || []
    };

    const task = new TrackerTask(taskData);
    await task.save();

    logger.info(`Tracker task created: ${task.title} by ${req.user.email}`);
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    logger.error('Create tracker task error:', error);
    res.status(500).json({ error: 'Failed to create task', code: 'SERVER_ERROR' });
  }
});

router.put('/tasks/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid task ID')
], handleValidationErrors, async (req, res) => {
  try {
    const task = await TrackerTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
    }

    const allowedFields = ['title', 'description', 'category', 'priority', 'recurrence',
      'customRecurrenceDays', 'weeklyDays', 'dueDate', 'startDate', 'endDate',
      'estimatedMinutes', 'status', 'isCompleted', 'completedAt', 'order', 'tags'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    logger.info(`Tracker task updated: ${task.title} by ${req.user.email}`);
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    logger.error('Update tracker task error:', error);
    res.status(500).json({ error: 'Failed to update task', code: 'SERVER_ERROR' });
  }
});

router.delete('/tasks/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid task ID')
], handleValidationErrors, async (req, res) => {
  try {
    const task = await TrackerTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
    }

    await TrackerResponse.updateMany(
      { user: req.user._id, 'taskCompletions.task': task._id },
      { $pull: { taskCompletions: { task: task._id } } }
    );

    await task.deleteOne();
    logger.info(`Tracker task deleted: ${task.title} by ${req.user.email}`);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Delete tracker task error:', error);
    res.status(500).json({ error: 'Failed to delete task', code: 'SERVER_ERROR' });
  }
});

// ========================
// QUESTION ROUTES
// ========================

router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = { user: req.user._id };

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const questions = await TrackerQuestion.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ questions });
  } catch (error) {
    logger.error('Get tracker questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions', code: 'SERVER_ERROR' });
  }
});

router.post('/questions', authenticateToken, [
  body('question').trim().notEmpty().withMessage('Question text is required')
    .isLength({ max: 500 }).withMessage('Question cannot exceed 500 characters'),
  body('responseType').optional().isIn(['yesno', 'yesnomaybe', 'scale', 'text', 'number']),
  body('scaleMin').optional().isInt({ min: 0 }),
  body('scaleMax').optional().isInt({ min: 2 }),
  body('category').optional().trim(),
  body('isRequired').optional().isBoolean(),
  body('icon').optional().trim(),
  body('color').optional().trim()
], handleValidationErrors, async (req, res) => {
  try {
    const questionData = {
      question: req.body.question,
      user: req.user._id,
      responseType: req.body.responseType || 'yesno',
      scaleMin: req.body.scaleMin,
      scaleMax: req.body.scaleMax,
      scaleLabels: req.body.scaleLabels,
      category: req.body.category || 'General',
      isRequired: req.body.isRequired !== undefined ? req.body.isRequired : true,
      order: req.body.order || 0,
      icon: req.body.icon,
      color: req.body.color,
      reminderTime: req.body.reminderTime
    };

    const question = new TrackerQuestion(questionData);
    await question.save();

    logger.info(`Tracker question created: "${question.question}" by ${req.user.email}`);
    res.status(201).json({ message: 'Question created successfully', question });
  } catch (error) {
    logger.error('Create tracker question error:', error);
    res.status(500).json({ error: 'Failed to create question', code: 'SERVER_ERROR' });
  }
});

router.put('/questions/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid question ID')
], handleValidationErrors, async (req, res) => {
  try {
    const question = await TrackerQuestion.findOne({ _id: req.params.id, user: req.user._id });
    if (!question) {
      return res.status(404).json({ error: 'Question not found', code: 'NOT_FOUND' });
    }

    const allowedFields = ['question', 'responseType', 'scaleMin', 'scaleMax', 'scaleLabels',
      'category', 'isActive', 'isRequired', 'order', 'icon', 'color', 'reminderTime'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    await question.save();
    logger.info(`Tracker question updated: "${question.question}" by ${req.user.email}`);
    res.json({ message: 'Question updated successfully', question });
  } catch (error) {
    logger.error('Update tracker question error:', error);
    res.status(500).json({ error: 'Failed to update question', code: 'SERVER_ERROR' });
  }
});

router.delete('/questions/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid question ID')
], handleValidationErrors, async (req, res) => {
  try {
    const question = await TrackerQuestion.findOne({ _id: req.params.id, user: req.user._id });
    if (!question) {
      return res.status(404).json({ error: 'Question not found', code: 'NOT_FOUND' });
    }

    await TrackerResponse.updateMany(
      { user: req.user._id, 'questionResponses.question': question._id },
      { $pull: { questionResponses: { question: question._id } } }
    );

    await question.deleteOne();
    logger.info(`Tracker question deleted by ${req.user.email}`);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    logger.error('Delete tracker question error:', error);
    res.status(500).json({ error: 'Failed to delete question', code: 'SERVER_ERROR' });
  }
});

// ========================
// RESPONSE / CHECK-IN ROUTES
// ========================

router.get('/responses', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = { user: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const responses = await TrackerResponse.find(query)
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('taskCompletions.task', 'title category priority recurrence')
      .populate('questionResponses.question', 'question responseType icon color');

    const total = await TrackerResponse.countDocuments(query);

    res.json({
      responses,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    logger.error('Get tracker responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses', code: 'SERVER_ERROR' });
  }
});

router.get('/responses/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let response = await TrackerResponse.findOne({
      user: req.user._id,
      date: { $gte: new Date(todayStr), $lt: new Date(new Date(todayStr).getTime() + 86400000) }
    }).populate('taskCompletions.task', 'title category priority recurrence')
      .populate('questionResponses.question', 'question responseType icon color scaleMin scaleMax scaleLabels');

    res.json({ response: response || null });
  } catch (error) {
    logger.error('Get today response error:', error);
    res.status(500).json({ error: 'Failed to fetch today response', code: 'SERVER_ERROR' });
  }
});

router.post('/responses', authenticateToken, [
  body('date').optional().isISO8601(),
  body('taskCompletions').optional().isArray(),
  body('questionResponses').optional().isArray(),
  body('mood').optional().isInt({ min: 1, max: 5 }),
  body('overallNotes').optional().trim().isLength({ max: 2000 })
], handleValidationErrors, async (req, res) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const dateStr = date.toISOString().split('T')[0];

    let response = await TrackerResponse.findOne({
      user: req.user._id,
      date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).getTime() + 86400000) }
    });

    if (response) {
      if (req.body.taskCompletions) {
        req.body.taskCompletions.forEach(tc => {
          const existing = response.taskCompletions.find(
            e => e.task.toString() === tc.task
          );
          if (existing) {
            existing.completed = tc.completed;
            if (tc.completedAt !== undefined) existing.completedAt = tc.completedAt;
            if (tc.notes !== undefined) existing.notes = tc.notes;
            if (tc.durationMinutes !== undefined) existing.durationMinutes = tc.durationMinutes;
          } else {
            response.taskCompletions.push(tc);
          }
        });
      }

      if (req.body.questionResponses) {
        req.body.questionResponses.forEach(qr => {
          const existing = response.questionResponses.find(
            e => e.question.toString() === qr.question
          );
          if (existing) {
            existing.value = qr.value;
            if (qr.notes !== undefined) existing.notes = qr.notes;
          } else {
            response.questionResponses.push(qr);
          }
        });
      }

      if (req.body.mood !== undefined) response.mood = req.body.mood;
      if (req.body.overallNotes !== undefined) response.overallNotes = req.body.overallNotes;

      await response.save();
    } else {
      const responseData = {
        user: req.user._id,
        date: date,
        taskCompletions: req.body.taskCompletions || [],
        questionResponses: req.body.questionResponses || [],
        mood: req.body.mood,
        overallNotes: req.body.overallNotes
      };
      response = new TrackerResponse(responseData);
      await response.save();
    }

    if (req.body.taskCompletions) {
      const completedTaskIds = req.body.taskCompletions
        .filter(tc => tc.completed)
        .map(tc => tc.task);

      if (completedTaskIds.length > 0) {
        await TrackerTask.updateMany(
          { _id: { $in: completedTaskIds }, user: req.user._id, recurrence: 'none' },
          { isCompleted: true, completedAt: new Date(), status: 'completed' }
        );
      }
    }

    logger.info(`Tracker response saved for ${req.user.email} on ${dateStr}`);
    res.json({ message: 'Response saved successfully', response });
  } catch (error) {
    logger.error('Save tracker response error:', error);
    res.status(500).json({ error: 'Failed to save response', code: 'SERVER_ERROR' });
  }
});

// ========================
// STATISTICS & ANALYTICS
// ========================

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [taskStats, streak, completionRate] = await Promise.all([
      TrackerTask.getStatsByUser(req.user._id),
      TrackerResponse.getStreakByUser(req.user._id),
      TrackerResponse.getCompletionRateByUser(req.user._id, 30)
    ]);

    const activeQuestions = await TrackerQuestion.countDocuments({
      user: req.user._id,
      isActive: true
    });

    const totalResponses = await TrackerResponse.countDocuments({ user: req.user._id });

    res.json({
      stats: {
        ...taskStats,
        activeQuestions,
        totalResponses,
        streak,
        completionRate
      }
    });
  } catch (error) {
    logger.error('Get tracker stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', code: 'SERVER_ERROR' });
  }
});

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const analytics = await TrackerResponse.getAnalyticsByUser(req.user._id);
    res.json({ analytics });
  } catch (error) {
    logger.error('Get tracker analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', code: 'SERVER_ERROR' });
  }
});

router.get('/heatmap', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    const heatmapData = await TrackerResponse.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          tasksCompleted: {
            $sum: {
              $size: {
                $filter: {
                  input: '$taskCompletions',
                  cond: { $eq: ['$$this.completed', true] }
                }
              }
            }
          },
          questionsAnswered: { $sum: { $size: '$questionResponses' } },
          mood: { $avg: '$mood' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ heatmap: heatmapData, year: targetYear });
  } catch (error) {
    logger.error('Get heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap', code: 'SERVER_ERROR' });
  }
});

// ========================
// EXPORT
// ========================

router.get('/export', authenticateToken, async (req, res) => {
  try {
    const [tasks, questions, responses] = await Promise.all([
      TrackerTask.find({ user: req.user._id }).lean(),
      TrackerQuestion.find({ user: req.user._id }).lean(),
      TrackerResponse.find({ user: req.user._id }).lean()
    ]);

    res.json({
      export: {
        tasks,
        questions,
        responses,
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Export tracker data error:', error);
    res.status(500).json({ error: 'Failed to export data', code: 'SERVER_ERROR' });
  }
});

router.post('/import', authenticateToken, [
  body('tasks').optional().isArray(),
  body('questions').optional().isArray(),
  body('responses').optional().isArray()
], handleValidationErrors, async (req, res) => {
  try {
    let imported = { tasks: 0, questions: 0, responses: 0 };

    if (req.body.tasks && req.body.tasks.length > 0) {
      const tasks = req.body.tasks.map(t => ({
        ...t,
        user: req.user._id,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      }));
      const created = await TrackerTask.insertMany(tasks);
      imported.tasks = created.length;
    }

    if (req.body.questions && req.body.questions.length > 0) {
      const questions = req.body.questions.map(q => ({
        ...q,
        user: req.user._id,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      }));
      const created = await TrackerQuestion.insertMany(questions);
      imported.questions = created.length;
    }

    if (req.body.responses && req.body.responses.length > 0) {
      const responses = req.body.responses.map(r => ({
        ...r,
        user: req.user._id,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      }));
      const created = await TrackerResponse.insertMany(responses, { ordered: false });
      imported.responses = created.length;
    }

    logger.info(`Tracker data imported by ${req.user.email}: ${JSON.stringify(imported)}`);
    res.json({ message: 'Data imported successfully', imported });
  } catch (error) {
    logger.error('Import tracker data error:', error);
    res.status(500).json({ error: 'Failed to import data', code: 'SERVER_ERROR' });
  }
});

module.exports = router;

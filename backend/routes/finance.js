const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const controller = require('../controllers/financeController');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array(), code: 'VALIDATION_ERROR' });
  }
  next();
};

// ─── Accounts ────────────────────────────────────────────────────────────────

router.get('/accounts', authenticateToken, controller.getAccounts);

router.post('/accounts',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('type').optional().isIn(['checking', 'savings', 'investment', 'income', 'expense', 'cash', 'credit', 'bridge']),
    body('balance').optional().isNumeric(),
    body('color').optional().isString(),
    body('description').optional().isLength({ max: 500 })
  ],
  handleValidation,
  controller.createAccount
);

router.put('/accounts/:id',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ max: 100 }),
    body('type').optional().isIn(['checking', 'savings', 'investment', 'income', 'expense', 'cash', 'credit', 'bridge']),
    body('balance').optional().isNumeric(),
    body('color').optional().isString(),
    body('description').optional().isLength({ max: 500 }),
    body('groupId').optional({ nullable: true })
  ],
  handleValidation,
  controller.updateAccount
);

router.put('/accounts/:id/position',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('x').isNumeric(),
    body('y').isNumeric()
  ],
  handleValidation,
  controller.updateAccountPosition
);

router.delete('/accounts/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.deleteAccount
);

router.put('/accounts/:id/archive',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('isArchived').isBoolean()
  ],
  handleValidation,
  controller.archiveAccount
);

// ─── Groups ───────────────────────────────────────────────────────────────

router.get('/groups', authenticateToken, controller.getGroups);

router.post('/groups',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('color').optional().isString()
  ],
  handleValidation,
  controller.createGroup
);

router.put('/groups/:id',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ max: 100 }),
    body('color').optional().isString()
  ],
  handleValidation,
  controller.updateGroup
);

router.delete('/groups/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.deleteGroup
);

// ─── Rules ───────────────────────────────────────────────────────────────────

router.get('/rules', authenticateToken, controller.getRules);

router.post('/rules',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
    body('type').isIn(['percentage', 'fixed', 'threshold']),
    body('targetAccountId').isMongoId().withMessage('Target account is required'),
    body('trigger').isIn(['on_inflow', 'on_outflow', 'threshold', 'recurring']),
    body('value').isNumeric().isFloat({ min: 0 }),
    body('sourceAccountId').optional({ nullable: true }).isMongoId(),
    body('thresholdAmount').optional({ nullable: true }).isNumeric(),
    body('thresholdDirection').optional().isIn(['above', 'below']),
    body('recurringSchedule').optional({ nullable: true }).isIn(['daily', 'weekly', 'monthly']),
    body('recurringDay').optional({ nullable: true }).isNumeric(),
    body('description').optional().isLength({ max: 500 })
  ],
  handleValidation,
  controller.createRule
);

router.put('/rules/reorder',
  authenticateToken,
  [body('order').isArray({ min: 1 })],
  handleValidation,
  controller.reorderRules
);

router.put('/rules/:id',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ max: 150 }),
    body('type').optional().isIn(['percentage', 'fixed', 'threshold']),
    body('targetAccountId').optional().isMongoId(),
    body('trigger').optional().isIn(['on_inflow', 'on_outflow', 'threshold', 'recurring']),
    body('value').optional().isNumeric().isFloat({ min: 0 }),
    body('sourceAccountId').optional({ nullable: true }).isMongoId(),
    body('isActive').optional().isBoolean()
  ],
  handleValidation,
  controller.updateRule
);

router.delete('/rules/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.deleteRule
);

router.post('/rules/:id/trigger',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.triggerRule
);

router.post('/rules/:id/dryrun',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('amount').optional().isNumeric().isFloat({ min: 0.01 })
  ],
  handleValidation,
  controller.dryRunRule
);

// ─── Transactions ─────────────────────────────────────────────────────────────

router.get('/transactions',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('status').optional().isIn(['pending', 'completed', 'cancelled']),
    query('type').optional().isIn(['deposit', 'withdrawal', 'transfer', 'rule_triggered'])
  ],
  handleValidation,
  controller.getTransactions
);

router.post('/transactions',
  authenticateToken,
  [
    body('type').isIn(['deposit', 'withdrawal', 'transfer', 'rule_triggered']),
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('fromAccountId').optional({ nullable: true }).isMongoId(),
    body('toAccountId').optional({ nullable: true }).isMongoId(),
    body('description').optional().isLength({ max: 500 }),
    body('date').optional().isISO8601(),
    body('status').optional().isIn(['pending', 'completed', 'cancelled'])
  ],
  handleValidation,
  controller.createTransaction
);

router.put('/transactions/:id/status',
  authenticateToken,
  [
    param('id').isMongoId(),
    body('status').isIn(['pending', 'completed', 'cancelled'])
  ],
  handleValidation,
  controller.updateTransactionStatus
);

router.delete('/transactions/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.deleteTransaction
);

router.post('/transactions/bulk',
  authenticateToken,
  [body('transactions').isArray({ min: 1, max: 500 })],
  handleValidation,
  controller.bulkCreateTransactions
);

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics',
  authenticateToken,
  [query('days').optional().isInt({ min: 7, max: 365 })],
  handleValidation,
  controller.getAnalytics
);

router.get('/analytics/net-worth',
  authenticateToken,
  controller.getNetWorthHistory
);

// ─── Budgets ─────────────────────────────────────────────────────────────────

router.get('/budgets',
  authenticateToken,
  [query('month').optional().isString()],
  handleValidation,
  controller.getBudgets
);

router.put('/budgets',
  authenticateToken,
  [
    body('month').isString().matches(/^\d{4}-\d{2}$/),
    body('monthlyTarget').isNumeric().isFloat({ min: 0 }),
    body('accountId').optional({ nullable: true }).isMongoId(),
    body('accountType').optional({ nullable: true }).isString(),
    body('note').optional().isLength({ max: 500 })
  ],
  handleValidation,
  controller.upsertBudget
);

router.delete('/budgets/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidation,
  controller.deleteBudget
);

module.exports = router;

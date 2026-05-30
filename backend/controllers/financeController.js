const FinanceAccount = require('../models/FinanceAccount');
const FinanceGroup = require('../models/FinanceGroup');
const FinanceRule = require('../models/FinanceRule');
const FinanceTransaction = require('../models/FinanceTransaction');
const FinanceBalanceSnapshot = require('../models/FinanceBalanceSnapshot');
const FinanceBudget = require('../models/FinanceBudget');
const logger = require('../config/logger');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Evaluate active rules for a given account + event type and create pending
 * rule_triggered transactions. Returns the array of created transactions.
 */
async function evaluateRules(userId, accountId, eventType, triggerAmount) {
  const query = {
    userId,
    isActive: true,
    trigger: eventType,
    sourceAccountId: accountId
  };

  const rules = await FinanceRule.find(query);
  const pending = [];

  for (const rule of rules) {
    let amount = 0;
    if (rule.type === 'percentage') {
      amount = parseFloat(((rule.value / 100) * triggerAmount).toFixed(2));
    } else if (rule.type === 'fixed') {
      amount = rule.value;
    }
    if (amount <= 0) continue;

    const tx = await FinanceTransaction.create({
      userId,
      type: 'rule_triggered',
      fromAccountId: accountId,
      toAccountId: rule.targetAccountId,
      amount,
      description: `Rule: ${rule.name}`,
      status: 'pending',
      ruleId: rule._id
    });
    pending.push(tx);
  }
  return pending;
}

/**
 * Evaluate threshold rules after a balance update.
 */
async function evaluateThresholdRules(userId, accountId, newBalance) {
  const rules = await FinanceRule.find({
    userId,
    isActive: true,
    trigger: 'threshold',
    sourceAccountId: accountId,
    type: { $in: ['fixed', 'percentage'] }
  });

  const pending = [];

  for (const rule of rules) {
    if (!rule.thresholdAmount) continue;
    const crossed =
      rule.thresholdDirection === 'above'
        ? newBalance > rule.thresholdAmount
        : newBalance < rule.thresholdAmount;
    if (!crossed) continue;

    let amount = 0;
    if (rule.type === 'fixed') {
      amount = rule.value;
    } else if (rule.type === 'percentage') {
      amount = parseFloat(((rule.value / 100) * newBalance).toFixed(2));
    }
    if (amount <= 0) continue;

    const tx = await FinanceTransaction.create({
      userId,
      type: 'rule_triggered',
      fromAccountId: accountId,
      toAccountId: rule.targetAccountId,
      amount,
      description: `Threshold rule: ${rule.name}`,
      status: 'pending',
      ruleId: rule._id
    });
    pending.push(tx);
  }
  return pending;
}

/**
 * When a transaction lands on a Bridge account, immediately execute all its
 * active on_inflow rules as completed transactions and apply balance changes.
 * Recursively cascades through nested bridge accounts (max depth 5).
 * Returns all created transactions (completed rule_triggered + any further pending).
 */
async function cascadeBridge(userId, bridgeAccountId, incomingAmount, depth = 0) {
  if (depth > 5) return [];

  const rules = await FinanceRule.find({
    userId,
    isActive: true,
    trigger: 'on_inflow',
    sourceAccountId: bridgeAccountId
  });

  const created = [];

  for (const rule of rules) {
    let amount = 0;
    if (rule.type === 'percentage') {
      amount = parseFloat(((rule.value / 100) * incomingAmount).toFixed(2));
    } else if (rule.type === 'fixed') {
      amount = rule.value;
    }
    if (amount <= 0) continue;

    const tx = await FinanceTransaction.create({
      userId,
      type: 'rule_triggered',
      fromAccountId: bridgeAccountId,
      toAccountId: rule.targetAccountId,
      amount,
      description: `Bridge: ${rule.name}`,
      status: 'completed',
      ruleId: rule._id
    });
    created.push(tx);

    await FinanceAccount.updateOne(
      { _id: bridgeAccountId, userId },
      { $inc: { balance: -amount } }
    );

    const target = await FinanceAccount.findOneAndUpdate(
      { _id: rule.targetAccountId, userId },
      { $inc: { balance: amount } },
      { new: true }
    );

    if (target) {
      if (target.type === 'bridge') {
        const nested = await cascadeBridge(userId, rule.targetAccountId, amount, depth + 1);
        created.push(...nested);
      } else {
        const inflowPending = await evaluateRules(userId, rule.targetAccountId, 'on_inflow', amount);
        const thresholdPending = await evaluateThresholdRules(userId, rule.targetAccountId, target.balance);
        created.push(...inflowPending, ...thresholdPending);
      }
    }
  }

  return created;
}

// ─── Groups ────────────────────────────────────────────────────────────────

exports.getGroups = async (req, res) => {
  try {
    const groups = await FinanceGroup.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json({ groups });
  } catch (error) {
    logger.error('getGroups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups', code: 'FETCH_ERROR' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, color } = req.body;
    const group = await FinanceGroup.create({ userId: req.user._id, name, color });
    res.status(201).json({ group });
  } catch (error) {
    logger.error('createGroup error:', error);
    res.status(500).json({ error: 'Failed to create group', code: 'CREATE_ERROR' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, color } = req.body;
    const group = await FinanceGroup.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, color },
      { new: true, runValidators: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found', code: 'NOT_FOUND' });
    res.json({ group });
  } catch (error) {
    logger.error('updateGroup error:', error);
    res.status(500).json({ error: 'Failed to update group', code: 'UPDATE_ERROR' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await FinanceGroup.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!group) return res.status(404).json({ error: 'Group not found', code: 'NOT_FOUND' });
    await FinanceAccount.updateMany(
      { userId: req.user._id, groupId: req.params.id },
      { groupId: null }
    );
    res.json({ message: 'Group deleted' });
  } catch (error) {
    logger.error('deleteGroup error:', error);
    res.status(500).json({ error: 'Failed to delete group', code: 'DELETE_ERROR' });
  }
};

// ─── Accounts ───────────────────────────────────────────────────────────────

exports.getAccounts = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const filter = { userId: req.user._id };
    if (includeArchived !== 'true') filter.isArchived = { $ne: true };
    const accounts = await FinanceAccount.find(filter).sort({ createdAt: 1 });
    res.json({ accounts });
  } catch (error) {
    logger.error('getAccounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts', code: 'FETCH_ERROR' });
  }
};

exports.archiveAccount = async (req, res) => {
  try {
    const { isArchived } = req.body;
    const account = await FinanceAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isArchived: !!isArchived },
      { new: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found', code: 'NOT_FOUND' });
    res.json({ account });
  } catch (error) {
    logger.error('archiveAccount error:', error);
    res.status(500).json({ error: 'Failed to archive account', code: 'UPDATE_ERROR' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { name, type, balance, description, color, position } = req.body;
    const account = await FinanceAccount.create({
      userId: req.user._id,
      name,
      type,
      balance: balance || 0,
      description,
      color,
      position
    });
    res.status(201).json({ account });
  } catch (error) {
    logger.error('createAccount error:', error);
    res.status(500).json({ error: 'Failed to create account', code: 'CREATE_ERROR' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { name, type, balance, description, color } = req.body;
    const update = { name, type, balance, description, color };
    if ('groupId' in req.body) update.groupId = req.body.groupId || null;
    const account = await FinanceAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found', code: 'NOT_FOUND' });
    res.json({ account });
  } catch (error) {
    logger.error('updateAccount error:', error);
    res.status(500).json({ error: 'Failed to update account', code: 'UPDATE_ERROR' });
  }
};

exports.updateAccountPosition = async (req, res) => {
  try {
    const { x, y } = req.body;
    const account = await FinanceAccount.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 'position.x': x, 'position.y': y },
      { new: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found', code: 'NOT_FOUND' });
    res.json({ account });
  } catch (error) {
    logger.error('updateAccountPosition error:', error);
    res.status(500).json({ error: 'Failed to update position', code: 'UPDATE_ERROR' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await FinanceAccount.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!account) return res.status(404).json({ error: 'Account not found', code: 'NOT_FOUND' });
    // Clean up rules that reference this account
    await FinanceRule.deleteMany({
      userId: req.user._id,
      $or: [{ sourceAccountId: req.params.id }, { targetAccountId: req.params.id }]
    });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    logger.error('deleteAccount error:', error);
    res.status(500).json({ error: 'Failed to delete account', code: 'DELETE_ERROR' });
  }
};

// ─── Rules ──────────────────────────────────────────────────────────────────

exports.getRules = async (req, res) => {
  try {
    const rules = await FinanceRule.find({ userId: req.user._id })
      .populate('sourceAccountId', 'name color type')
      .populate('targetAccountId', 'name color type')
      .sort({ priority: 1, createdAt: 1 });
    res.json({ rules });
  } catch (error) {
    logger.error('getRules error:', error);
    res.status(500).json({ error: 'Failed to fetch rules', code: 'FETCH_ERROR' });
  }
};

exports.reorderRules = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, priority }]
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array', code: 'VALIDATION_ERROR' });
    await Promise.all(order.map(({ id, priority }) =>
      FinanceRule.findOneAndUpdate({ _id: id, userId: req.user._id }, { priority: parseInt(priority) })
    ));
    res.json({ message: 'Rules reordered' });
  } catch (error) {
    logger.error('reorderRules error:', error);
    res.status(500).json({ error: 'Failed to reorder rules', code: 'UPDATE_ERROR' });
  }
};

exports.dryRunRule = async (req, res) => {
  try {
    const rule = await FinanceRule.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('sourceAccountId', 'name color type balance')
      .populate('targetAccountId', 'name color type balance');
    if (!rule) return res.status(404).json({ error: 'Rule not found', code: 'NOT_FOUND' });

    const triggerAmount = parseFloat(req.body.amount) || 1000;
    let transferAmount = 0;
    if (rule.type === 'percentage') {
      transferAmount = parseFloat(((rule.value / 100) * triggerAmount).toFixed(2));
    } else if (rule.type === 'fixed') {
      transferAmount = rule.value;
    }

    res.json({
      dryRun: {
        rule: { _id: rule._id, name: rule.name, type: rule.type, trigger: rule.trigger, value: rule.value },
        simulatedTriggerAmount: triggerAmount,
        simulatedTransferAmount: transferAmount,
        from: rule.sourceAccountId,
        to: rule.targetAccountId,
        projectedFromBalance: rule.sourceAccountId?.balance != null ? rule.sourceAccountId.balance - transferAmount : null,
        projectedToBalance: rule.targetAccountId?.balance != null ? rule.targetAccountId.balance + transferAmount : null
      }
    });
  } catch (error) {
    logger.error('dryRunRule error:', error);
    res.status(500).json({ error: 'Failed to dry-run rule', code: 'DRYRUN_ERROR' });
  }
};

exports.createRule = async (req, res) => {
  try {
    const {
      name, description, type, sourceAccountId, targetAccountId,
      trigger, value, thresholdAmount, thresholdDirection,
      recurringSchedule, recurringDay, isActive
    } = req.body;

    const rule = await FinanceRule.create({
      userId: req.user._id,
      name, description, type, sourceAccountId, targetAccountId,
      trigger, value, thresholdAmount, thresholdDirection,
      recurringSchedule, recurringDay,
      isActive: isActive !== undefined ? isActive : true
    });

    const populated = await rule.populate([
      { path: 'sourceAccountId', select: 'name color type' },
      { path: 'targetAccountId', select: 'name color type' }
    ]);
    res.status(201).json({ rule: populated });
  } catch (error) {
    logger.error('createRule error:', error);
    res.status(500).json({ error: 'Failed to create rule', code: 'CREATE_ERROR' });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const {
      name, description, type, sourceAccountId, targetAccountId,
      trigger, value, thresholdAmount, thresholdDirection,
      recurringSchedule, recurringDay, isActive
    } = req.body;

    const rule = await FinanceRule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        name, description, type, sourceAccountId, targetAccountId,
        trigger, value, thresholdAmount, thresholdDirection,
        recurringSchedule, recurringDay, isActive
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'sourceAccountId', select: 'name color type' },
      { path: 'targetAccountId', select: 'name color type' }
    ]);
    if (!rule) return res.status(404).json({ error: 'Rule not found', code: 'NOT_FOUND' });
    res.json({ rule });
  } catch (error) {
    logger.error('updateRule error:', error);
    res.status(500).json({ error: 'Failed to update rule', code: 'UPDATE_ERROR' });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const rule = await FinanceRule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!rule) return res.status(404).json({ error: 'Rule not found', code: 'NOT_FOUND' });
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    logger.error('deleteRule error:', error);
    res.status(500).json({ error: 'Failed to delete rule', code: 'DELETE_ERROR' });
  }
};

// Manually trigger a recurring rule (creates a pending transaction)
exports.triggerRule = async (req, res) => {
  try {
    const rule = await FinanceRule.findOne({ _id: req.params.id, userId: req.user._id });
    if (!rule) return res.status(404).json({ error: 'Rule not found', code: 'NOT_FOUND' });
    if (rule.type !== 'fixed') {
      return res.status(400).json({ error: 'Only fixed-amount rules can be manually triggered', code: 'INVALID_TRIGGER' });
    }
    const tx = await FinanceTransaction.create({
      userId: req.user._id,
      type: 'rule_triggered',
      fromAccountId: rule.sourceAccountId,
      toAccountId: rule.targetAccountId,
      amount: rule.value,
      description: `Recurring rule: ${rule.name}`,
      status: 'pending',
      ruleId: rule._id
    });
    await FinanceRule.findByIdAndUpdate(rule._id, { lastTriggeredAt: new Date() });
    res.status(201).json({ transaction: tx });
  } catch (error) {
    logger.error('triggerRule error:', error);
    res.status(500).json({ error: 'Failed to trigger rule', code: 'TRIGGER_ERROR' });
  }
};

// ─── Transactions ────────────────────────────────────────────────────────────

exports.getTransactions = async (req, res) => {
  try {
    const { status, accountId, type, page = 1, limit = 50, dateFrom, dateTo, amountMin, amountMax, ruleId } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (accountId) {
      filter.$or = [{ fromAccountId: accountId }, { toAccountId: accountId }];
    }
    if (ruleId) filter.ruleId = ruleId;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); filter.date.$lte = end; }
    }
    if (amountMin || amountMax) {
      filter.amount = {};
      if (amountMin) filter.amount.$gte = parseFloat(amountMin);
      if (amountMax) filter.amount.$lte = parseFloat(amountMax);
    }

    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (parseInt(page) - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      FinanceTransaction.find(filter)
        .populate('fromAccountId', 'name color type')
        .populate('toAccountId', 'name color type')
        .populate('ruleId', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      FinanceTransaction.countDocuments(filter)
    ]);

    res.json({ transactions, total, page: parseInt(page), limit: limitNum });
  } catch (error) {
    logger.error('getTransactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', code: 'FETCH_ERROR' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { type, fromAccountId, toAccountId, amount, description, date, status } = req.body;
    const txStatus = status || 'completed';

    const tx = await FinanceTransaction.create({
      userId: req.user._id,
      type,
      fromAccountId: fromAccountId || null,
      toAccountId: toAccountId || null,
      amount,
      description,
      date: date || new Date(),
      status: txStatus
    });

    let pendingRuleTxs = [];

    // If completed, apply balance changes and evaluate rules
    if (txStatus === 'completed') {
      if (fromAccountId) {
        const from = await FinanceAccount.findOneAndUpdate(
          { _id: fromAccountId, userId: req.user._id },
          { $inc: { balance: -amount } },
          { new: true }
        );
        if (from) {
          const outflowPending = await evaluateRules(req.user._id, fromAccountId, 'on_outflow', amount);
          const thresholdPending = await evaluateThresholdRules(req.user._id, fromAccountId, from.balance);
          pendingRuleTxs = pendingRuleTxs.concat(outflowPending, thresholdPending);
        }
      }
      if (toAccountId) {
        const to = await FinanceAccount.findOneAndUpdate(
          { _id: toAccountId, userId: req.user._id },
          { $inc: { balance: amount } },
          { new: true }
        );
        if (to) {
          if (to.type === 'bridge') {
            const bridgeTxs = await cascadeBridge(req.user._id, toAccountId, amount);
            pendingRuleTxs = pendingRuleTxs.concat(bridgeTxs);
          } else {
            const inflowPending = await evaluateRules(req.user._id, toAccountId, 'on_inflow', amount);
            const thresholdPending = await evaluateThresholdRules(req.user._id, toAccountId, to.balance);
            pendingRuleTxs = pendingRuleTxs.concat(inflowPending, thresholdPending);
          }
        }
      }
    }

    const populated = await tx.populate([
      { path: 'fromAccountId', select: 'name color type' },
      { path: 'toAccountId', select: 'name color type' }
    ]);

    res.status(201).json({ transaction: populated, pendingRuleTransactions: pendingRuleTxs });
  } catch (error) {
    logger.error('createTransaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction', code: 'CREATE_ERROR' });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tx = await FinanceTransaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });

    const wasCompleted = status === 'completed' && tx.status === 'pending';
    tx.status = status;
    await tx.save();

    let pendingRuleTxs = [];

    // Apply balance changes when a pending transaction is confirmed
    if (wasCompleted) {
      if (tx.fromAccountId) {
        const from = await FinanceAccount.findOneAndUpdate(
          { _id: tx.fromAccountId, userId: req.user._id },
          { $inc: { balance: -tx.amount } },
          { new: true }
        );
        if (from) {
          pendingRuleTxs = pendingRuleTxs.concat(
            await evaluateThresholdRules(req.user._id, tx.fromAccountId, from.balance)
          );
        }
      }
      if (tx.toAccountId) {
        const to = await FinanceAccount.findOneAndUpdate(
          { _id: tx.toAccountId, userId: req.user._id },
          { $inc: { balance: tx.amount } },
          { new: true }
        );
        if (to) {
          if (to.type === 'bridge') {
            pendingRuleTxs = pendingRuleTxs.concat(
              await cascadeBridge(req.user._id, tx.toAccountId, tx.amount)
            );
          } else {
            pendingRuleTxs = pendingRuleTxs.concat(
              await evaluateThresholdRules(req.user._id, tx.toAccountId, to.balance)
            );
          }
        }
      }
    }

    const populated = await tx.populate([
      { path: 'fromAccountId', select: 'name color type' },
      { path: 'toAccountId', select: 'name color type' },
      { path: 'ruleId', select: 'name' }
    ]);

    res.json({ transaction: populated, pendingRuleTransactions: pendingRuleTxs });
  } catch (error) {
    logger.error('updateTransactionStatus error:', error);
    res.status(500).json({ error: 'Failed to update transaction', code: 'UPDATE_ERROR' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const tx = await FinanceTransaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found', code: 'NOT_FOUND' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    logger.error('deleteTransaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction', code: 'DELETE_ERROR' });
  }
};

exports.bulkCreateTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0)
      return res.status(400).json({ error: 'No transactions provided', code: 'VALIDATION_ERROR' });
    if (transactions.length > 500)
      return res.status(400).json({ error: 'Cannot import more than 500 transactions at once', code: 'VALIDATION_ERROR' });
    const VALID_TYPES = ['deposit', 'withdrawal', 'transfer'];
    const docs = transactions
      .map(t => ({
        userId: req.user._id,
        type: VALID_TYPES.includes(t.type) ? t.type : 'deposit',
        fromAccountId: t.fromAccountId || null,
        toAccountId: t.toAccountId || null,
        amount: Math.abs(parseFloat(t.amount)),
        description: (t.description || '').slice(0, 500),
        date: t.date ? new Date(t.date) : new Date(),
        status: 'completed'
      }))
      .filter(t => t.amount > 0);
    const created = await FinanceTransaction.insertMany(docs);
    res.status(201).json({ created: created.length, message: `Imported ${created.length} transactions. Account balances were not automatically updated — confirm each transaction in the Transactions tab if needed.` });
  } catch (error) {
    logger.error('bulkCreateTransactions error:', error);
    res.status(500).json({ error: 'Failed to bulk import transactions', code: 'CREATE_ERROR' });
  }
};

// ─── Analytics ───────────────────────────────────────────────────────────────

exports.getNetWorthHistory = async (req, res) => {
  try {
    const snapshots = await FinanceBalanceSnapshot.find({ userId: req.user._id })
      .sort({ date: 1 })
      .limit(365)
      .select('date totalBalance accountBalances');
    res.json({ snapshots });
  } catch (error) {
    logger.error('getNetWorthHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch net worth history', code: 'FETCH_ERROR' });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = { userId: req.user._id };
    if (month) filter.month = month;
    const budgets = await FinanceBudget.find(filter).sort({ month: -1, createdAt: 1 });
    res.json({ budgets });
  } catch (error) {
    logger.error('getBudgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets', code: 'FETCH_ERROR' });
  }
};

exports.upsertBudget = async (req, res) => {
  try {
    const { accountId, accountType, month, monthlyTarget, note } = req.body;
    const filter = { userId: req.user._id, month, accountId: accountId || null, accountType: accountType || null };
    const budget = await FinanceBudget.findOneAndUpdate(
      filter,
      { monthlyTarget, note: note || '' },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ budget });
  } catch (error) {
    logger.error('upsertBudget error:', error);
    res.status(500).json({ error: 'Failed to save budget', code: 'UPSERT_ERROR' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const budget = await FinanceBudget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ error: 'Budget not found', code: 'NOT_FOUND' });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    logger.error('deleteBudget error:', error);
    res.status(500).json({ error: 'Failed to delete budget', code: 'DELETE_ERROR' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 90 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [accounts, flowSummary, dailyFlow] = await Promise.all([
      FinanceAccount.find({ userId }),

      // Per-account total inflow and outflow from completed transactions
      FinanceTransaction.aggregate([
        { $match: { userId, status: 'completed', date: { $gte: since } } },
        {
          $facet: {
            inflows: [
              { $match: { toAccountId: { $ne: null } } },
              { $group: { _id: '$toAccountId', total: { $sum: '$amount' } } }
            ],
            outflows: [
              { $match: { fromAccountId: { $ne: null } } },
              { $group: { _id: '$fromAccountId', total: { $sum: '$amount' } } }
            ]
          }
        }
      ]),

      // Daily net flow grouped by date (last N days)
      FinanceTransaction.aggregate([
        { $match: { userId, status: 'completed', date: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalIn: {
              $sum: { $cond: [{ $ne: ['$toAccountId', null] }, '$amount', 0] }
            },
            totalOut: {
              $sum: { $cond: [{ $ne: ['$fromAccountId', null] }, '$amount', 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Build account map for labelling
    const accountMap = {};
    accounts.forEach(a => { accountMap[a._id.toString()] = a; });

    const inflowMap = {};
    const outflowMap = {};
    if (flowSummary[0]) {
      flowSummary[0].inflows.forEach(i => { inflowMap[i._id.toString()] = i.total; });
      flowSummary[0].outflows.forEach(o => { outflowMap[o._id.toString()] = o.total; });
    }

    const accountSummary = accounts.map(a => ({
      _id: a._id,
      name: a.name,
      color: a.color,
      type: a.type,
      balance: a.balance,
      totalIn: inflowMap[a._id.toString()] || 0,
      totalOut: outflowMap[a._id.toString()] || 0
    }));

    // Bridge throughput: total inflow routed through bridge accounts in the period
    const bridgeThroughput = {};
    accounts.filter(a => a.type === 'bridge').forEach(a => {
      bridgeThroughput[a._id.toString()] = inflowMap[a._id.toString()] || 0;
    });

    res.json({ accountSummary, dailyFlow, bridgeThroughput });
  } catch (error) {
    logger.error('getAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', code: 'FETCH_ERROR' });
  }
};

// Snapshot all account balances for net-worth-over-time tracking.
// Called by the daily scheduler.
exports.snapshotBalances = async (userId) => {
  try {
    const accounts = await FinanceAccount.find({ userId, isArchived: { $ne: true } });
    if (accounts.length === 0) return;
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const accountBalances = accounts.map(a => ({ accountId: a._id, name: a.name, balance: a.balance }));
    const today = new Date().toISOString().slice(0, 10);
    await FinanceBalanceSnapshot.findOneAndUpdate(
      { userId, date: today },
      { totalBalance, accountBalances },
      { upsert: true, new: true }
    );
  } catch (error) {
    logger.error('snapshotBalances error:', error);
  }
};

// Fire all due recurring rules for a user. Called by the daily scheduler.
exports.processRecurringRules = async (userId) => {
  try {
    const now = new Date();
    const todayDow = now.getDay(); // 0=Sun
    const todayDom = now.getDate(); // 1-31
    const rules = await FinanceRule.find({ userId, isActive: true, trigger: 'recurring', type: 'fixed' });
    for (const rule of rules) {
      let shouldFire = false;
      if (rule.recurringSchedule === 'daily') shouldFire = true;
      else if (rule.recurringSchedule === 'weekly' && rule.recurringDay === todayDow) shouldFire = true;
      else if (rule.recurringSchedule === 'monthly' && rule.recurringDay === todayDom) shouldFire = true;
      if (!shouldFire) continue;
      // Avoid double-firing on the same day
      if (rule.lastTriggeredAt) {
        const last = new Date(rule.lastTriggeredAt).toISOString().slice(0, 10);
        if (last === now.toISOString().slice(0, 10)) continue;
      }
      await FinanceTransaction.create({
        userId,
        type: 'rule_triggered',
        fromAccountId: rule.sourceAccountId,
        toAccountId: rule.targetAccountId,
        amount: rule.value,
        description: `Auto: ${rule.name}`,
        status: 'pending',
        ruleId: rule._id
      });
      await FinanceRule.findByIdAndUpdate(rule._id, { lastTriggeredAt: now });
    }
  } catch (error) {
    logger.error('processRecurringRules error:', error);
  }
};

/**
 * Escape a user-supplied string so it can be safely used as a literal inside a MongoDB
 * `$regex` query (or a `RegExp`). Without escaping, an attacker can craft patterns
 * that trigger catastrophic backtracking (ReDoS) and pin a CPU core.
 *
 * Usage:
 *   const { escapeRegex } = require('../utils/regex');
 *   filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };
 */
const escapeRegex = (value) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };

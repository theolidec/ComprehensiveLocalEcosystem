# Finance Module

## Overview

The Finance module (`/finance`) lets users visualise and simulate the flow of money across bank accounts, define automated transfer rules, and track transaction history. All data is stored locally — no external banking API is connected by default, but the data model is designed to accommodate future integration (e.g. Plaid).

---

## Features

- **Flow Map** — SVG canvas with draggable account cards and animated rule-based flow edges. Positions persist to the database. Supports:
  - Scroll-to-zoom and drag-to-pan (transform group)
  - Read-only lock mode (positions cannot be moved while locked)
  - Auto-layout button — BFS topological sort of the account graph, positions saved immediately
  - Mini-map overlay (toggle button) showing viewport position relative to full canvas
  - Edge labels shown on hover only
  - Bridge throughput displayed on bridge cards (30-day routed volume)
- **Money Flow Rules** — Full rule engine supporting:
  - *Percentage* — e.g. "10% of every inflow to Salary → Savings"
  - *Fixed amount* — e.g. "Transfer €200 on the 1st of every month"
  - *Threshold* — fires when a balance crosses a defined level (above or below)
  - *Recurring* — manual trigger button in the UI (daily/weekly/monthly scheduling metadata stored)
  - **Priority ordering** — up/down arrows reorder rules; priority persisted to `FinanceRule.priority`
  - **Dry-run preview** — simulate a rule's effect on account balances without creating a transaction
  - **Rule history** — inline panel showing the last 10 triggered transactions for a rule
  - **Bridge balance enforcement warning** — warns when percentage outflow rules for a bridge account exceed 100%
- **Transaction Log** — log deposits, withdrawals, and transfers. Supports:
  - Pagination, status/type/account/date-range/amount-range filtering
  - CSV export (current filter applied)
  - Bulk CSV import with parse-preview step
  - Inline confirm/cancel for pending transactions
- **Analytics** — balance KPIs, net worth over time chart, per-account inflow/outflow bar chart, daily flow line chart, account breakdown table, and budget tracking. Time window: 30 / 90 / 180 / 365 days.
- **Budgets** — create named spending budgets (weekly / monthly / yearly) with a progress bar showing outflow vs. limit.
- **Account archiving** — soft-delete accounts with Archive/Unarchive in the edit modal. Archived accounts are hidden by default; toggle with *Show Archived* in the header.
- **Daily scheduler** (server-side) — runs at 03:30 server time: takes a `FinanceBalanceSnapshot` of all accounts and fires due recurring rules.
- **Currency** — single currency per user, set in Settings (`/settings`). Supported: USD, EUR, GBP, NOK, SEK, DKK, CAD, AUD, CHF, JPY.
- **GDPR** — finance accounts and transactions are included in the user data export and are cascade-deleted on account deletion.

---

## Account Types

| Value | Label |
|-------|-------|
| `checking` | Checking |
| `savings` | Savings |
| `investment` | Investment |
| `income` | Income Source |
| `expense` | Expense Bucket |
| `cash` | Cash |
| `credit` | Credit |
| `bridge` | Bridge (routing hub) |

---

## Backend

### Models

#### `FinanceAccount` (`backend/models/FinanceAccount.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `name` | String | max 100 chars |
| `type` | String | `checking` / `savings` / `investment` / `income` / `expense` / `cash` / `credit` / `bridge` |
| `balance` | Number | updated by transactions |
| `description` | String | optional |
| `color` | String | hex color for card/edge |
| `position.x` / `position.y` | Number | canvas position |
| `groupId` | ObjectId | ref: FinanceGroup, nullable — canvas group membership |
| `isArchived` | Boolean | soft-delete; archived accounts excluded from active view by default |
| `isExternal` | Boolean | reserved for future API |
| `externalAccountId` | String | reserved for future API |

#### `FinanceGroup` (`backend/models/FinanceGroup.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `name` | String | max 100 chars |
| `color` | String | hex color for the group border/label |

> **Bridge accounts** are passthrough routing hubs. On the flow map they render with a dashed border and `↔ Routing Hub` instead of a balance. Their distribution behaviour is defined entirely through normal `FinanceRule` records — one rule routes funds *into* the bridge and further rules route funds *out* to each destination account, enabling fan-out distributions (e.g. an investment bridge that proportionally splits inflows across multiple investment accounts).
>
> When a transaction lands on a Bridge account (either created as `completed` or confirmed from `pending`), the backend **automatically** executes all active `on_inflow` rules for that bridge as completed `rule_triggered` transactions and applies the balance changes immediately — no user confirmation needed. If a bridge output targets another bridge, the cascade recurses (max depth 5). Final non-bridge destinations receive normal pending inflow / threshold rules as usual.

#### `FinanceRule` (`backend/models/FinanceRule.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `name` | String | max 150 chars |
| `type` | String | `percentage` / `fixed` / `threshold` |
| `sourceAccountId` | ObjectId | ref: FinanceAccount, nullable |
| `targetAccountId` | ObjectId | ref: FinanceAccount, required |
| `trigger` | String | `on_inflow` / `on_outflow` / `threshold` / `recurring` |
| `value` | Number | % for percentage, flat for others |
| `thresholdAmount` | Number | for threshold trigger |
| `thresholdDirection` | String | `above` / `below` |
| `recurringSchedule` | String | `daily` / `weekly` / `monthly` |
| `recurringDay` | Number | day of week / month |
| `priority` | Number | sort order for rule evaluation; lower = higher priority |
| `isActive` | Boolean | inactive rules are not evaluated |
| `lastTriggeredAt` | Date | updated on manual recurring trigger |

#### `FinanceBalanceSnapshot` (`backend/models/FinanceBalanceSnapshot.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `date` | String | ISO date `YYYY-MM-DD`; unique per user per day |
| `totalBalance` | Number | sum of all non-archived account balances |
| `accountBalances` | Array | `{ accountId, name, balance }` per-account snapshot |

#### `FinanceBudget` (`backend/models/FinanceBudget.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `accountId` | ObjectId | ref: FinanceAccount, nullable — target specific account |
| `accountType` | String | nullable — target a broad account type instead of a specific account |
| `month` | String | `YYYY-MM` (e.g. `"2026-05"`) |
| `monthlyTarget` | Number | spending / inflow target for the month (min 0) |
| `note` | String | optional label, max 500 chars |

#### `FinanceTransaction` (`backend/models/FinanceTransaction.js`)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref: User |
| `type` | String | `deposit` / `withdrawal` / `transfer` / `rule_triggered` |
| `fromAccountId` | ObjectId | nullable (external source) |
| `toAccountId` | ObjectId | nullable (external destination) |
| `amount` | Number | min 0.01 |
| `description` | String | optional |
| `date` | Date | defaults to now |
| `status` | String | `pending` / `completed` / `cancelled` |
| `ruleId` | ObjectId | ref: FinanceRule, set for rule-triggered transactions |

### Controller (`backend/controllers/financeController.js`)

Key behaviours:
- **`createTransaction`** — if `status: completed`, immediately increments/decrements affected account balances and evaluates `on_inflow` / `on_outflow` / `threshold` rules to create pending transactions.
- **`updateTransactionStatus`** — confirming a `pending` transaction applies balance changes and re-evaluates threshold rules.
- **`deleteAccount`** — cascade-deletes all rules that reference the account.
- **`archiveAccount`** — sets `isArchived` flag (soft-delete).
- **`triggerRule`** — manually triggers a `recurring` / `fixed` rule, creating a pending transaction.
- **`dryRunRule`** — simulates rule execution without persisting, returns `simulatedTransferAmount`, `projectedFromBalance`, `projectedToBalance`.
- **`reorderRules`** — bulk updates `priority` field for a list of rules.
- **`bulkCreateTransactions`** — inserts multiple transactions in one request (used by CSV import).
- **`getAnalytics`** — aggregation pipeline returning per-account inflow/outflow summary, daily flow totals, and bridge throughput map for a configurable window.
- **`getNetWorthHistory`** — returns `FinanceBalanceSnapshot` records for the requested window.
- **Budget CRUD** — `getBudgets`, `upsertBudget` (PUT, creates or updates by month+account key), `deleteBudget`.
- **Daily scheduler** (`server.js`) — runs at 03:30: takes `FinanceBalanceSnapshot` for every user and fires any due `recurring` rules.

### Routes (`backend/routes/finance.js`)

Mounted at `/api/finance`. All routes require JWT authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts` | List accounts (`?includeArchived=true` to include archived) |
| POST | `/accounts` | Create account |
| PUT | `/accounts/:id` | Update account metadata (also accepts `groupId`) |
| PUT | `/accounts/:id/position` | Save canvas x/y position |
| PUT | `/accounts/:id/archive` | Archive / unarchive account (`{ isArchived: bool }`) |
| DELETE | `/accounts/:id` | Delete account + cascade rules |
| GET | `/groups` | List all groups |
| POST | `/groups` | Create group |
| PUT | `/groups/:id` | Update group (name, color) |
| DELETE | `/groups/:id` | Delete group (clears groupId on all member accounts) |
| GET | `/rules` | List all rules (populated, sorted by priority) |
| POST | `/rules` | Create rule |
| PUT | `/rules/reorder` | Bulk-update `priority` for multiple rules (`{ order: [{ id, priority }] }`) |
| PUT | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |
| POST | `/rules/:id/trigger` | Manually trigger a `fixed` recurring rule (creates pending tx) |
| POST | `/rules/:id/dryrun` | Simulate rule with `{ amount }`, returns projected balances |
| GET | `/transactions` | List transactions (filterable, paginated) |
| POST | `/transactions` | Create transaction |
| POST | `/transactions/bulk` | Bulk-create transactions from CSV import (max 500 rows) |
| PUT | `/transactions/:id/status` | Update transaction status |
| DELETE | `/transactions/:id` | Delete transaction |
| GET | `/analytics` | Analytics summary (`?days=90`), includes `bridgeThroughput` map |
| GET | `/analytics/net-worth` | Net worth history from balance snapshots (up to 365 entries) |
| GET | `/budgets` | List budgets (`?month=YYYY-MM` optional filter) |
| PUT | `/budgets` | Upsert budget by `{ month, accountId?, accountType?, monthlyTarget, note? }` |
| DELETE | `/budgets/:id` | Delete budget |

### Settings Integration

A `finance.currency` block is added to the `Settings` model. Updated via `PUT /api/settings/finance`. Supported values: `USD EUR GBP NOK SEK DKK CAD AUD CHF JPY`.

---

## Frontend

### Files

| File | Purpose |
|------|---------|
| `frontend/src/components/Pages/Finance.js` | Main page — all four tabs |
| `frontend/src/services/financeAPI.js` | API wrapper (accounts, rules, transactions, analytics, settings) |

### Component Structure (`Finance.js`)

```
Finance (root)
├── FlowchartTab
│   ├── MiniMap (SVG overview, togglable)
│   ├── GroupBox (SVG rect + label, rendered behind cards, zoom-aware drag)
│   ├── AccountCard (SVG foreignObject, zoom-aware drag, readOnly mode, throughput display)
│   ├── FlowEdge (SVG path with hover-only label + arrowhead marker)
│   └── GroupsPanel (absolute side panel — create/edit/delete groups, assign accounts)
├── RulesTab
│   └── RuleForm (includes bridge balance enforcement warning)
├── TransactionsTab
│   ├── TransactionForm
│   └── CSV import modal
└── AnalyticsTab
    ├── NetWorthChart (SVG area chart over snapshot history)
    ├── BarChart (pure SVG, per-account inflow/outflow)
    ├── LineChart (pure SVG, daily flow)
    └── Budget list with progress bars
```

### Flowchart Implementation

- Built entirely with native SVG — no external diagram library.
- **Zoom / Pan** — all SVG content is wrapped in a single `<g transform="translate(dx,dy) scale(s)">`. Scroll wheel adjusts scale (0.15–4×, zooms towards cursor). Background `<rect>` drag pans the view. Zoom buttons and reset available in toolbar. Both `AccountCard` and `GroupBox` compute mouse→SVG coordinates using the live `vtRef` transform so drag positions are always accurate at any zoom level.
- **Read-only mode** — a toolbar lock button sets `readOnly` on `AccountCard` and `GroupBox`, preventing mousedown drag and showing a `default` cursor.
- **Auto-layout** — BFS topological sort from root nodes (zero in-degree). Each BFS level is a row; accounts within a row are distributed horizontally. Resulting positions are saved to the backend immediately.
- **Mini-map** — a 180×110 SVG thumbnail in the bottom-right corner renders all account positions scaled down. A blue rectangle shows the current viewport window.
- **Groups** — accounts can be assigned to a named, coloured `FinanceGroup`. `GroupBox` computes the bounding rect of all group members from the live `positions` map and renders a dashed border with a filled label pill. Groups are rendered in the SVG layer below edges and cards so they never obscure interactions.
- **`GroupsPanel`** — a togglable side drawer (triggered by the *Groups* toolbar button) that lets the user create, rename, delete, and recolour groups, and assign each account to a group via a dropdown. Group CRUD is handled entirely within the panel; account assignment calls `PUT /api/finance/accounts/:id` with `{ groupId }` and then triggers a parent refresh.
- **`groupMembers`** — computed inline in `FlowchartTab` as `{ [groupId]: [accountId, ...] }` from the current `accounts` prop. No extra state needed.
- **Position state is owned by `FlowchartTab`** as a `positions` map (`{ [accountId]: { x, y } }`). Both `AccountCard` rendering and `FlowEdge` rendering consume this same map, guaranteeing edges track cards in real-time during drag.
- `AccountCard` receives `pos` as a prop and calls `onDragMove(id, x, y)` on every `mousemove` event, which updates `FlowchartTab`'s `positions` state immediately. A `latestPos` ref inside `AccountCard` captures the final position for the `mouseup` handler (closing-over-stale-state is avoided this way).
- Drag-end fires `onDragEnd(id, x, y)`. Position saving works in two modes controlled by a `positionsCommitted` ref:
  - **First drag (auto-layout state):** all cards are still at the DB default (100, 100), so the auto-layout is a client-side approximation only. On the first drag, the positions of **all** cards (their current auto-layout coordinates, plus the dragged card's new position) are batch-saved in one pass so none snap back on reload.
  - **Subsequent drags:** only the moved card's position is debounce-saved (600 ms) to `PUT /api/finance/accounts/:id/position`.
- `positions` and `positionsCommitted` are re-synced from the server `accounts` prop whenever `accounts` changes (e.g. after a manual refresh), so a reload always reflects the latest persisted state.
- When all accounts are at the default position (100, 100), an auto-layout grid is applied client-side to give a usable starting arrangement before the user has placed cards manually.
- Flow edges are `<path>` bezier curves with `<marker>` arrowheads. Edges for `on_inflow` / `on_outflow` rules use `stroke-dasharray` to hint at directionality. Edge labels (rule name + value) are shown only on hover via a wider invisible hit-target path.
- **Viewport height** — the Finance page root uses `min-h-screen` so the `flex-1` tab content wrapper can expand to fill the available viewport. The SVG canvas inside `FlowchartTab` sets `minHeight: 700` as a floor to keep the flowmap usable even when the container collapses.

### Rule Evaluation Flow

```
createTransaction (completed)
  → update fromAccount.balance  → evaluateRules(outflow) + evaluateThresholdRules
  → update toAccount.balance    → evaluateRules(inflow) + evaluateThresholdRules
  → return { transaction, pendingRuleTransactions[] }
```

Frontend receives `pendingRuleTransactions` in the create-transaction response but currently only refreshes the account list. The pending items become visible in the Transactions tab automatically.

### Context / Settings

- `SettingsContext` exposes `updateFinanceSettings(finance)` which calls `PUT /api/settings/finance`.
- `Finance.js` reads `settings.finance.currency` from `useSettings()` to derive the display symbol.

### Navigation Integration

- `/finance` redirects to `/finance/flowmap` (via `<Navigate replace />`).
- `/finance/:tab` is the active route — tab slugs: `flowmap`, `rules`, `transactions`, `analytics`.
- The active tab is derived from the URL param (`useParams`); clicking a tab calls `useNavigate` to update the URL.
- Listed in the Header apps dropdown (desktop and mobile).
- Available as a Quick Action in `Home.js` and `HomeLayoutEditor.js`.

---

## GDPR Compliance

- **Export** (`GET /api/user/export`): includes `finance.accounts` and `finance.transactions` arrays.
- **Delete** (`DELETE /api/user/account`): cascade-deletes `FinanceTransaction`, `FinanceRule`, and `FinanceAccount` documents in the same transaction session.

---

## Future: Banking API Integration

The `FinanceAccount` model includes `isExternal: Boolean` and `externalAccountId: String` fields reserved for a future banking API layer (e.g. Plaid). The controller's rule evaluation and analytics aggregation are account-agnostic and will work without changes once real balances are synced.

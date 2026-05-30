import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronUp, Check, X,
  ArrowRight, ArrowDown, Zap, RefreshCw, DollarSign, TrendingUp,
  TrendingDown, AlertCircle, Clock, BarChart2, GitBranch, Settings,
  CreditCard, PiggyBank, Briefcase, Landmark, Wallet, Coins, Eye, EyeOff,
  Layers, Share2, Lock, Unlock, ZoomIn, ZoomOut, RotateCcw, Map,
  Download, Upload, History, Play, Target, ArrowUp, GripVertical, Archive, Filter
} from 'lucide-react';
import * as financeAPI from '../../services/financeAPI';
import { useSettings } from '../../contexts/SettingsContext';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking', icon: CreditCard, color: '#3B82F6' },
  { value: 'savings', label: 'Savings', icon: PiggyBank, color: '#10B981' },
  { value: 'investment', label: 'Investment', icon: TrendingUp, color: '#8B5CF6' },
  { value: 'income', label: 'Income Source', icon: Briefcase, color: '#F59E0B' },
  { value: 'expense', label: 'Expense Bucket', icon: DollarSign, color: '#EF4444' },
  { value: 'cash', label: 'Cash', icon: Wallet, color: '#6B7280' },
  { value: 'credit', label: 'Credit', icon: Landmark, color: '#EC4899' },
  { value: 'bridge', label: 'Bridge', icon: Share2, color: '#06B6D4' },
];

const RULE_TRIGGERS = [
  { value: 'on_inflow', label: 'On Inflow', desc: 'Fires when money enters the source account' },
  { value: 'on_outflow', label: 'On Outflow', desc: 'Fires when money leaves the source account' },
  { value: 'threshold', label: 'Threshold', desc: 'Fires when balance crosses a set amount' },
  { value: 'recurring', label: 'Recurring', desc: 'Fires on a scheduled basis (trigger manually)' },
];

const RULE_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'threshold', label: 'Threshold-based' },
];

const TX_TYPES = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer', label: 'Transfer' },
];

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', NOK: 'kr', SEK: 'kr',
  DKK: 'kr', CAD: 'C$', AUD: 'A$', CHF: 'Fr', JPY: '¥',
};

const ACCOUNT_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#6B7280', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];

// ─── Utility helpers ─────────────────────────────────────────────────────────

function fmt(amount, symbol) {
  return `${symbol}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function accountTypeInfo(type) {
  return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
}

// ─── SVG Flowchart ───────────────────────────────────────────────────────────

const CARD_W = 200;
const CARD_H = 100;
const GROUP_PAD = 28;
const GROUP_LABEL_H = 22;

function FlowEdge({ from, to, label, color, animated }) {
  const [hovered, setHovered] = useState(false);
  const fx = from.position.x + CARD_W / 2;
  const fy = from.position.y + CARD_H / 2;
  const tx = to.position.x + CARD_W / 2;
  const ty = to.position.y + CARD_H / 2;
  const mx = (fx + tx) / 2;
  const my = (fy + ty) / 2;
  const id = `edge-${from._id}-${to._id}`;

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <defs>
        <marker id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color || '#6B7280'} />
        </marker>
      </defs>
      {/* Wide invisible path for easier hover detection */}
      <path d={`M${fx},${fy} Q${mx},${my - 40} ${tx},${ty}`} fill="none" stroke="transparent" strokeWidth="14" />
      <path
        d={`M${fx},${fy} Q${mx},${my - 40} ${tx},${ty}`}
        fill="none"
        stroke={color || '#6B7280'}
        strokeWidth={hovered ? 3 : 2}
        strokeDasharray={animated ? '8 4' : undefined}
        markerEnd={`url(#arrow-${id})`}
        opacity={hovered ? 1 : 0.7}
      />
      {label && hovered && (
        <>
          <rect
            x={mx - label.length * 3.2 - 8} y={my - 66}
            width={label.length * 6.4 + 16} height={20}
            rx="4" fill="rgba(17,24,39,0.88)"
          />
          <text x={mx} y={my - 51} textAnchor="middle" fontSize="11" fill="white">{label}</text>
        </>
      )}
    </g>
  );
}

function AccountCard({ account, pos, onDragMove, onDragEnd, onEdit, onDelete, currencySymbol, selected, onClick, vtRef, readOnly, throughput }) {
  const typeInfo = accountTypeInfo(account.type);
  const isNegative = account.balance < 0;
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const latestPos = useRef(pos);

  useEffect(() => { latestPos.current = pos; }, [pos]);

  const handleMouseDown = (e) => {
    if (readOnly || e.target.closest('button')) return;
    e.preventDefault();
    dragging.current = true;
    const vt = vtRef?.current || { scale: 1, dx: 0, dy: 0 };
    const svgEl = e.currentTarget.closest('svg');
    const rect = svgEl.getBoundingClientRect();
    const svgX = (e.clientX - rect.left - vt.dx) / vt.scale;
    const svgY = (e.clientY - rect.top - vt.dy) / vt.scale;
    dragOffset.current = { x: svgX - pos.x, y: svgY - pos.y };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const cvt = vtRef?.current || { scale: 1, dx: 0, dy: 0 };
      const cX = (ev.clientX - rect.left - cvt.dx) / cvt.scale;
      const cY = (ev.clientY - rect.top - cvt.dy) / cvt.scale;
      const newX = Math.max(0, cX - dragOffset.current.x);
      const newY = Math.max(0, cY - dragOffset.current.y);
      latestPos.current = { x: newX, y: newY };
      onDragMove(account._id, newX, newY);
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      onDragEnd(account._id, latestPos.current.x, latestPos.current.y);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <g transform={`translate(${pos.x},${pos.y})`} style={{ cursor: readOnly ? 'default' : 'grab' }} onMouseDown={handleMouseDown} onClick={onClick}>
      {/* Card shadow */}
      <rect x="3" y="3" width={CARD_W} height={CARD_H} rx="10" fill="rgba(0,0,0,0.1)" />
      {/* Card background */}
      <rect
        width={CARD_W} height={CARD_H} rx="10"
        fill={selected ? account.color : 'white'}
        stroke={account.color}
        strokeWidth={selected ? 3 : 2}
        strokeDasharray={account.type === 'bridge' ? '7 3' : undefined}
        className={selected ? '' : 'dark:fill-gray-800'}
      />
      {/* Left color bar */}
      <rect x="0" y="0" width="6" height={CARD_H} rx="10" fill={account.color} />
      <rect x="0" y="10" width="6" height={CARD_H - 20} fill={account.color} />

      {/* Account name */}
      <text x="18" y="28" fontSize="13" fontWeight="600" className="fill-gray-800 dark:fill-white" fill={selected ? 'white' : undefined}>
        {account.name.length > 20 ? account.name.slice(0, 18) + '\u2026' : account.name}
      </text>

      {/* Type badge */}
      <text x="18" y="46" fontSize="10" fill={selected ? 'rgba(255,255,255,0.8)' : typeInfo.color}>
        {typeInfo.label.toUpperCase()}
      </text>

      {/* Balance or Bridge throughput */}
      {account.type === 'bridge' ? (
        <text x="18" y="68" fontSize="11" fontStyle="italic"
          fill={selected ? 'rgba(255,255,255,0.85)' : typeInfo.color}>
          {throughput != null ? `\u2194 ${fmt(throughput, currencySymbol)}/30d` : '\u2194 Routing Hub'}
        </text>
      ) : (
        <text
          x="18" y="70"
          fontSize="16" fontWeight="700"
          fill={isNegative ? '#EF4444' : (selected ? 'white' : '#111827')}
        >
          {isNegative ? '-' : ''}{fmt(account.balance, currencySymbol)}
        </text>
      )}

      {/* Edit / Delete buttons */}
      <g transform={`translate(${CARD_W - 52}, 6)`}>
        <rect
          x="0" y="0" width="22" height="22" rx="4"
          fill="rgba(255,255,255,0.2)"
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onEdit(account); }}
        />
        <foreignObject x="3" y="3" width="16" height="16">
          <button
            xmlns="http://www.w3.org/1999/xhtml"
            onClick={(e) => { e.stopPropagation(); onEdit(account); }}
            className="w-4 h-4 text-gray-500 hover:text-blue-600 dark:text-gray-300"
          >
            <Edit2 size={14} />
          </button>
        </foreignObject>
        <rect
          x="26" y="0" width="22" height="22" rx="4"
          fill="rgba(255,255,255,0.2)"
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onDelete(account._id); }}
        />
        <foreignObject x="29" y="3" width="16" height="16">
          <button
            xmlns="http://www.w3.org/1999/xhtml"
            onClick={(e) => { e.stopPropagation(); onDelete(account._id); }}
            className="w-4 h-4 text-gray-500 hover:text-red-600 dark:text-gray-300"
          >
            <Trash2 size={14} />
          </button>
        </foreignObject>
      </g>
    </g>
  );
}

function GroupBox({ group, accountIds, positions, onGroupDragMove, onGroupDragEnd, vtRef, readOnly }) {
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, startPositions: {} });

  const pts = accountIds.map(id => positions[id]).filter(Boolean);
  if (pts.length === 0) return null;

  const minX = Math.min(...pts.map(p => p.x)) - GROUP_PAD;
  const minY = Math.min(...pts.map(p => p.y)) - GROUP_PAD - GROUP_LABEL_H;
  const maxX = Math.max(...pts.map(p => p.x + CARD_W)) + GROUP_PAD;
  const maxY = Math.max(...pts.map(p => p.y + CARD_H)) + GROUP_PAD;
  const w = maxX - minX;
  const h = maxY - minY;
  const labelText = group.name.length > 22 ? group.name.slice(0, 20) + '\u2026' : group.name;
  const labelW = Math.min(labelText.length * 7 + 20, 200);

  const handleMouseDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    dragging.current = true;
    const vt = vtRef?.current || { scale: 1, dx: 0, dy: 0 };
    const svgEl = e.currentTarget.closest('svg');
    const rect = svgEl.getBoundingClientRect();
    const startPositions = {};
    accountIds.forEach(id => {
      if (positions[id]) startPositions[id] = { ...positions[id] };
    });
    const svgX = (e.clientX - rect.left - vt.dx) / vt.scale;
    const svgY = (e.clientY - rect.top - vt.dy) / vt.scale;
    dragStart.current = { mouseX: svgX, mouseY: svgY, startPositions };

    const onMove = (ev) => {
      if (!dragging.current) return;
      const cvt = vtRef?.current || { scale: 1, dx: 0, dy: 0 };
      const cX = (ev.clientX - rect.left - cvt.dx) / cvt.scale;
      const cY = (ev.clientY - rect.top - cvt.dy) / cvt.scale;
      const dx = cX - dragStart.current.mouseX;
      const dy = cY - dragStart.current.mouseY;
      const newPositions = {};
      Object.entries(dragStart.current.startPositions).forEach(([id, sp]) => {
        newPositions[id] = { x: Math.max(0, sp.x + dx), y: Math.max(0, sp.y + dy) };
      });
      onGroupDragMove(newPositions);
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      onGroupDragEnd(Object.keys(dragStart.current.startPositions));
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <g>
      <rect
        x={minX} y={minY}
        width={w} height={h}
        rx="14"
        fill={group.color + '18'}
        stroke={group.color}
        strokeWidth="2"
        strokeDasharray="8 4"
      />
      <g onMouseDown={handleMouseDown} style={{ cursor: readOnly ? 'default' : 'grab' }}>
        <rect
          x={minX + 10} y={minY}
          width={labelW} height={GROUP_LABEL_H}
          rx="5"
          fill={group.color}
        />
        <text
          x={minX + 20} y={minY + 14}
          fontSize="11"
          fontWeight="600"
          fill="white"
          style={{ pointerEvents: 'none' }}
        >
          {labelText}
        </text>
      </g>
    </g>
  );
}

function GroupsPanel({ groups, accounts, onClose, onGroupsChange, onAssignAccount }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await financeAPI.createGroup({ name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#6B7280');
      onGroupsChange();
    } catch (e) { setError(e.message || 'Failed to create group'); }
  };

  const handleUpdate = async (id) => {
    try {
      await financeAPI.updateGroup(id, editForm);
      setEditingId(null);
      onGroupsChange();
    } catch (e) { setError(e.message || 'Failed to update group'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group? Accounts in it will be unassigned.')) return;
    try {
      await financeAPI.deleteGroup(id);
      onGroupsChange();
    } catch (e) { setError(e.message || 'Failed to delete group'); }
  };

  return (
    <div className="absolute right-0 top-0 w-72 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-10">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
          <Layers size={14} className="text-blue-500" /> Groups
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New Group</p>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Group name…"
            maxLength={100}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex gap-1 flex-wrap">
            {ACCOUNT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${newColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={handleCreate} disabled={!newName.trim()}
            className="w-full py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md flex items-center justify-center gap-1">
            <Plus size={12} /> Create Group
          </button>
        </div>

        {groups.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Existing Groups</p>
            {groups.map(g => {
              const memberCount = accounts.filter(a => (a.groupId?._id || a.groupId) === g._id).length;
              return (
                <div key={g._id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1.5">
                  {editingId === g._id ? (
                    <>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        maxLength={100}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      <div className="flex gap-1 flex-wrap">
                        {ACCOUNT_COLORS.map(c => (
                          <button key={c} type="button" onClick={() => setEditForm(f => ({ ...f, color: c }))}
                            className={`w-5 h-5 rounded-full border-2 ${editForm.color === c ? 'border-gray-800 dark:border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdate(g._id)}
                          className="flex-1 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white truncate">{g.name}</span>
                      <span className="text-xs text-gray-400">{memberCount}</span>
                      <button onClick={() => { setEditingId(g._id); setEditForm({ name: g.name, color: g.color }); }}
                        className="text-gray-400 hover:text-blue-500"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(g._id)}
                        className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {accounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Assign Accounts</p>
            <div className="space-y-1.5">
              {accounts.map(a => {
                const currentGroupId = a.groupId?._id || a.groupId || '';
                return (
                  <div key={a._id} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{a.name}</span>
                    <select
                      value={currentGroupId}
                      onChange={e => onAssignAccount(a._id, e.target.value || null)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-1 py-0.5 max-w-[100px]"
                    >
                      <option value="">None</option>
                      {groups.map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Flowchart ──────────────────────────────────────────────────────────

function MiniMap({ positions, accounts, vt, containerRef }) {
  const MAP_W = 180, MAP_H = 110;
  const allPos = Object.values(positions);
  if (allPos.length === 0) return null;
  const maxX = Math.max(...allPos.map(p => p.x + CARD_W)) + 40;
  const maxY = Math.max(...allPos.map(p => p.y + CARD_H)) + 40;
  const s = Math.min((MAP_W - 6) / maxX, (MAP_H - 6) / maxY) * 0.92;
  const cont = containerRef?.current;
  const vpW = cont ? (cont.clientWidth / vt.scale) * s : MAP_W;
  const vpH = cont ? (cont.clientHeight / vt.scale) * s : MAP_H;
  const vpX = (-vt.dx / vt.scale) * s;
  const vpY = (-vt.dy / vt.scale) * s;
  return (
    <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-20 pointer-events-none">
      <svg width={MAP_W} height={MAP_H}>
        <rect width={MAP_W} height={MAP_H} rx="4" fill="rgba(156,163,175,0.08)" />
        {accounts.map(a => {
          const p = positions[a._id] || a.position;
          return <rect key={a._id} x={p.x * s + 2} y={p.y * s + 2} width={Math.max(4, CARD_W * s)} height={Math.max(3, CARD_H * s)} rx="1" fill={a.color} opacity="0.65" />;
        })}
        <rect
          x={Math.max(0, vpX)} y={Math.max(0, vpY)}
          width={Math.min(MAP_W, vpW)} height={Math.min(MAP_H, vpH)}
          fill="rgba(59,130,246,0.1)" stroke="#3B82F6" strokeWidth="1.5" rx="2"
        />
      </svg>
    </div>
  );
}

function FlowchartTab({ accounts, rules, onRefresh, currencySymbol, onEditAccount, onDeleteAccount, bridgeThroughput }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const saveTimer = useRef({});

  // View transform: zoom scale + pan offset
  const vtRef = useRef({ scale: 1, dx: 0, dy: 0 });
  const [vt, setVt] = useState({ scale: 1, dx: 0, dy: 0 });
  const updateVt = useCallback((updater) => {
    setVt(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      vtRef.current = next;
      return next;
    });
  }, []);

  const [readOnly, setReadOnly] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Groups
  const [groups, setGroups] = useState([]);
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const data = await financeAPI.getGroups();
      setGroups(data.groups || []);
    } catch (_) {}
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleAssignAccountToGroup = useCallback(async (accountId, groupId) => {
    try {
      await financeAPI.updateAccount(accountId, { groupId });
      onRefresh();
    } catch (_) {}
  }, [onRefresh]);

  const allDefault = accounts.length > 0 && accounts.every(a => a.position.x === 100 && a.position.y === 100);

  const [positions, setPositions] = useState(() => {
    const map = {};
    accounts.forEach((a, i) => {
      map[a._id] = allDefault
        ? { x: 60 + (i % 4) * 240, y: 80 + Math.floor(i / 4) * 160 }
        : { x: a.position.x, y: a.position.y };
    });
    return map;
  });

  const positionsRef = useRef(positions);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  const positionsCommitted = useRef(!allDefault);

  useEffect(() => {
    const allDef = accounts.length > 0 && accounts.every(a => a.position.x === 100 && a.position.y === 100);
    const map = {};
    accounts.forEach((a, i) => {
      map[a._id] = allDef
        ? { x: 60 + (i % 4) * 240, y: 80 + Math.floor(i / 4) * 160 }
        : { x: a.position.x, y: a.position.y };
    });
    setPositions(map);
    positionsCommitted.current = !allDef;
  }, [accounts]);

  // Wheel zoom (non-passive to allow preventDefault)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      updateVt(prev => {
        const newScale = Math.max(0.15, Math.min(4, prev.scale * factor));
        const newDx = mx - (mx - prev.dx) * newScale / prev.scale;
        const newDy = my - (my - prev.dy) * newScale / prev.scale;
        return { scale: newScale, dx: newDx, dy: newDy };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateVt]);

  // Background pan handler
  const panRef = useRef({ active: false, startX: 0, startY: 0, startDx: 0, startDy: 0 });
  const handleBgMouseDown = useCallback((e) => {
    e.preventDefault();
    const cur = vtRef.current;
    panRef.current = { active: true, startX: e.clientX, startY: e.clientY, startDx: cur.dx, startDy: cur.dy };
    const onMove = (ev) => {
      if (!panRef.current.active) return;
      updateVt(prev => ({
        ...prev,
        dx: panRef.current.startDx + ev.clientX - panRef.current.startX,
        dy: panRef.current.startDy + ev.clientY - panRef.current.startY,
      }));
    };
    const onUp = () => {
      panRef.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [updateVt]);

  // Auto-layout: BFS levels from roots
  const autoLayout = useCallback(() => {
    const inDeg = {};
    const outEdges = {};
    accounts.forEach(a => { inDeg[a._id] = 0; outEdges[a._id] = []; });
    rules.filter(r => r.isActive && r.sourceAccountId && r.targetAccountId).forEach(r => {
      const src = r.sourceAccountId?._id || r.sourceAccountId;
      const tgt = r.targetAccountId?._id || r.targetAccountId;
      if (outEdges[src] !== undefined) outEdges[src].push(tgt);
      if (inDeg[tgt] !== undefined) inDeg[tgt]++;
    });
    const levels = {};
    let queue = accounts.filter(a => inDeg[a._id] === 0).map(a => a._id);
    if (queue.length === 0) queue = accounts.map(a => a._id);
    let lv = 0;
    const visited = new Set();
    while (queue.length > 0 && lv < 20) {
      queue.forEach(id => { if (!visited.has(id)) { levels[id] = lv; visited.add(id); } });
      const next = [];
      queue.forEach(id => (outEdges[id] || []).forEach(tgt => { if (!visited.has(tgt)) next.push(tgt); }));
      queue = [...new Set(next)];
      lv++;
    }
    accounts.forEach(a => { if (levels[a._id] === undefined) levels[a._id] = lv; });
    const levelCounts = {};
    Object.values(levels).forEach(l => { levelCounts[l] = (levelCounts[l] || 0) + 1; });
    const levelIdxs = {};
    const newPositions = {};
    Object.entries(levels).forEach(([id, l]) => {
      const idx = levelIdxs[l] || 0;
      levelIdxs[l] = idx + 1;
      const count = levelCounts[l];
      const startX = Math.max(60, 500 - (count * 250) / 2) + idx * 250;
      newPositions[id] = { x: startX, y: 80 + l * 170 };
    });
    setPositions(newPositions);
    positionsCommitted.current = true;
    Object.entries(newPositions).forEach(([id, p]) => {
      financeAPI.updateAccountPosition(id, p.x, p.y).catch(() => {});
    });
    updateVt({ scale: 1, dx: 0, dy: 0 });
  }, [accounts, rules, updateVt]);

  const handleDragMove = useCallback((accountId, x, y) => {
    setPositions(prev => ({ ...prev, [accountId]: { x, y } }));
  }, []);

  const handleDragEnd = useCallback(async (accountId, x, y) => {
    if (!positionsCommitted.current) {
      positionsCommitted.current = true;
      const snap = { ...positionsRef.current, [accountId]: { x, y } };
      accounts.forEach(a => {
        const p = snap[a._id];
        if (p) financeAPI.updateAccountPosition(a._id, p.x, p.y).catch(() => {});
      });
      return;
    }
    clearTimeout(saveTimer.current[accountId]);
    saveTimer.current[accountId] = setTimeout(async () => {
      try { await financeAPI.updateAccountPosition(accountId, x, y); }
      catch (_) {}
    }, 600);
  }, [accounts]);

  const handleGroupDragMove = useCallback((newPositions) => {
    setPositions(prev => ({ ...prev, ...newPositions }));
  }, []);

  const handleGroupDragEnd = useCallback((movedAccountIds) => {
    if (!positionsCommitted.current) {
      positionsCommitted.current = true;
      const snap = positionsRef.current;
      accounts.forEach(a => {
        const p = snap[a._id];
        if (p) financeAPI.updateAccountPosition(a._id, p.x, p.y).catch(() => {});
      });
      return;
    }
    movedAccountIds.forEach(accountId => {
      clearTimeout(saveTimer.current[accountId]);
      saveTimer.current[accountId] = setTimeout(async () => {
        const p = positionsRef.current[accountId];
        if (!p) return;
        try { await financeAPI.updateAccountPosition(accountId, p.x, p.y); }
        catch (_) {}
      }, 600);
    });
  }, [accounts]);

  const groupMembers = {};
  accounts.forEach(a => {
    const gid = a.groupId?._id || a.groupId;
    if (gid) {
      if (!groupMembers[gid]) groupMembers[gid] = [];
      groupMembers[gid].push(a._id);
    }
  });

  const edges = rules
    .filter(r => r.sourceAccountId && r.targetAccountId && r.isActive)
    .map(rule => {
      const from = accounts.find(a => a._id === (rule.sourceAccountId?._id || rule.sourceAccountId));
      const to = accounts.find(a => a._id === (rule.targetAccountId?._id || rule.targetAccountId));
      if (!from || !to) return null;
      const labelParts = [rule.name];
      if (rule.type === 'percentage') labelParts.push(`${rule.value}%`);
      else if (rule.type === 'fixed') labelParts.push(`${currencySymbol}${rule.value}`);
      return {
        from: { ...from, position: positions[from._id] || from.position },
        to: { ...to, position: positions[to._id] || to.position },
        label: labelParts.join(' \u00b7 '),
        color: from.color,
        rule
      };
    })
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {readOnly ? '\uD83D\uDD12 Read-only — positions locked' : 'Scroll to zoom \u00b7 Drag background to pan \u00b7 Hover edges for labels'}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={autoLayout} title="Auto-arrange layout"
            className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <GitBranch size={11} /> Auto-layout
          </button>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
            <button onClick={() => updateVt(prev => ({ ...prev, scale: Math.min(4, prev.scale * 1.25) }))} title="Zoom in"
              className="px-1.5 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ZoomIn size={12} />
            </button>
            <span className="px-1.5 text-xs text-gray-500 border-x border-gray-300 dark:border-gray-600 tabular-nums">{Math.round(vt.scale * 100)}%</span>
            <button onClick={() => updateVt(prev => ({ ...prev, scale: Math.max(0.15, prev.scale / 1.25) }))} title="Zoom out"
              className="px-1.5 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ZoomOut size={12} />
            </button>
          </div>
          <button onClick={() => updateVt({ scale: 1, dx: 0, dy: 0 })} title="Reset view"
            className="p-1 border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <RotateCcw size={12} />
          </button>
          <button onClick={() => setReadOnly(v => !v)} title={readOnly ? 'Unlock positions' : 'Lock positions'}
            className={`p-1 border rounded ${readOnly ? 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {readOnly ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button onClick={() => setShowMiniMap(v => !v)} title="Toggle mini-map"
            className={`p-1 border rounded ${showMiniMap ? 'border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Map size={12} />
          </button>
          <button onClick={() => setShowGroupsPanel(v => !v)}
            className={`flex items-center gap-1 text-sm ${showGroupsPanel ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}>
            <Layers size={14} /> Groups
          </button>
          <button onClick={onRefresh} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <GitBranch size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No accounts yet</p>
            <p className="text-sm">Add your first account to start building your flow map.</p>
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              className="select-none"
              style={{ display: 'block', width: '100%', height: '100%', minHeight: 1000 }}
            >
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(156,163,175,0.15)" strokeWidth="1" />
                </pattern>
              </defs>
              {/* Background rect catches pan mousedown */}
              <rect width="100%" height="100%" fill="url(#grid)" onMouseDown={handleBgMouseDown} style={{ cursor: 'grab' }} />
              {/* Transform group — all content zooms/pans together */}
              <g transform={`translate(${vt.dx},${vt.dy}) scale(${vt.scale})`}>
                {groups.map(g => (
                  <GroupBox
                    key={g._id}
                    group={g}
                    accountIds={groupMembers[g._id] || []}
                    positions={positions}
                    onGroupDragMove={handleGroupDragMove}
                    onGroupDragEnd={handleGroupDragEnd}
                    vtRef={vtRef}
                    readOnly={readOnly}
                  />
                ))}
                {edges.map((edge, i) => (
                  <FlowEdge
                    key={i}
                    from={edge.from}
                    to={edge.to}
                    label={edge.label}
                    color={edge.color}
                    animated={edge.rule.trigger === 'on_inflow' || edge.rule.trigger === 'on_outflow'}
                  />
                ))}
                {accounts.map(account => (
                  <AccountCard
                    key={account._id}
                    account={account}
                    pos={positions[account._id] || account.position}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onEdit={onEditAccount}
                    onDelete={onDeleteAccount}
                    currencySymbol={currencySymbol}
                    selected={selected === account._id}
                    onClick={() => setSelected(selected === account._id ? null : account._id)}
                    vtRef={vtRef}
                    readOnly={readOnly}
                    throughput={bridgeThroughput?.[account._id] ?? null}
                  />
                ))}
              </g>
            </svg>
            {showMiniMap && (
              <MiniMap positions={positions} accounts={accounts} vt={vt} containerRef={containerRef} />
            )}
            {showGroupsPanel && (
              <GroupsPanel
                groups={groups}
                accounts={accounts}
                onClose={() => setShowGroupsPanel(false)}
                onGroupsChange={loadGroups}
                onAssignAccount={handleAssignAccountToGroup}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Rules ───────────────────────────────────────────────────────────────

function RuleForm({ accounts, rules, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', type: 'percentage', trigger: 'on_inflow',
    sourceAccountId: '', targetAccountId: '', value: '',
    thresholdAmount: '', thresholdDirection: 'above',
    recurringSchedule: 'monthly', recurringDay: 1, isActive: true
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Bridge balance enforcement: warn if outflow % rules for this bridge > 100%
  const bridgeWarning = useMemo(() => {
    if (!form.sourceAccountId || form.type !== 'percentage' || form.trigger !== 'on_inflow') return null;
    const src = accounts.find(a => a._id === form.sourceAccountId);
    if (!src || src.type !== 'bridge') return null;
    const existingSum = (rules || [])
      .filter(r => r.isActive && r.type === 'percentage' && r.trigger === 'on_inflow' &&
        (r.sourceAccountId?._id || r.sourceAccountId) === form.sourceAccountId &&
        r._id !== initial?._id)
      .reduce((s, r) => s + r.value, 0);
    const total = existingSum + parseFloat(form.value || 0);
    if (total > 100) return `⚠️ Outflow rules for this bridge sum to ${total.toFixed(1)}% (>100%). Excess will have no funds.`;
    if (total > 90) return `Note: Outflow rules sum to ${total.toFixed(1)}% — approaching 100%.`;
    return null;
  }, [form.sourceAccountId, form.type, form.trigger, form.value, accounts, rules, initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, value: parseFloat(form.value) };
    if (!payload.sourceAccountId) delete payload.sourceAccountId;
    if (!payload.thresholdAmount) delete payload.thresholdAmount;
    if (payload.trigger !== 'recurring') { delete payload.recurringSchedule; delete payload.recurringDay; }
    if (payload.trigger !== 'threshold') { delete payload.thresholdAmount; delete payload.thresholdDirection; }
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rule Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type *</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Trigger *</label>
          <select value={form.trigger} onChange={e => set('trigger', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            {RULE_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">{RULE_TRIGGERS.find(t => t.value === form.trigger)?.desc}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {form.type === 'percentage' ? 'Percentage (0–100) *' : 'Amount *'}
          </label>
          <input type="number" min="0" step="0.01" value={form.value} onChange={e => set('value', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Source Account {form.trigger === 'recurring' ? '(optional)' : '*'}
          </label>
          <select value={form.sourceAccountId} onChange={e => set('sourceAccountId', e.target.value)}
            required={form.trigger !== 'recurring'}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">— None (external) —</option>
            {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target Account *</label>
          <select value={form.targetAccountId} onChange={e => set('targetAccountId', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">— Select —</option>
            {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        {form.trigger === 'threshold' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Threshold Amount</label>
              <input type="number" step="0.01" value={form.thresholdAmount} onChange={e => set('thresholdAmount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Direction</label>
              <select value={form.thresholdDirection} onChange={e => set('thresholdDirection', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="above">Above threshold</option>
                <option value="below">Below threshold</option>
              </select>
            </div>
          </>
        )}
        {form.trigger === 'recurring' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Schedule</label>
              <select value={form.recurringSchedule} onChange={e => set('recurringSchedule', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {form.recurringSchedule === 'weekly' ? 'Day of Week (0=Sun)' : 'Day of Month'}
              </label>
              <input type="number" min="0" max={form.recurringSchedule === 'weekly' ? 6 : 31}
                value={form.recurringDay} onChange={e => set('recurringDay', parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
          <label htmlFor="isActive" className="text-sm text-gray-600 dark:text-gray-400">Rule is active</label>
        </div>
        {bridgeWarning && (
          <div className={`md:col-span-2 p-2 rounded text-xs ${bridgeWarning.startsWith('\u26a0') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
            {bridgeWarning}
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
          {initial ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}

function RulesTab({ rules, accounts, onRefresh, currencySymbol }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dryRun, setDryRun] = useState(null); // { loading, result, ruleId }
  const [dryRunAmount, setDryRunAmount] = useState(1000);
  const [historyOpen, setHistoryOpen] = useState(new Set());
  const [historyCache, setHistoryCache] = useState({});

  const handleCreate = async (data) => {
    setLoading(true); setError(null);
    try { await financeAPI.createRule(data); onRefresh(); setShowForm(false); }
    catch (e) { setError(e.message || 'Failed to create rule'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (data) => {
    setLoading(true); setError(null);
    try { await financeAPI.updateRule(editingRule._id, data); onRefresh(); setEditingRule(null); }
    catch (e) { setError(e.message || 'Failed to update rule'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await financeAPI.deleteRule(id); onRefresh(); }
    catch (e) { setError(e.message || 'Failed to delete rule'); }
  };

  const handleToggle = async (rule) => {
    try { await financeAPI.updateRule(rule._id, { isActive: !rule.isActive }); onRefresh(); }
    catch (e) { setError(e.message || 'Failed to toggle rule'); }
  };

  const handleTrigger = async (rule) => {
    try { await financeAPI.triggerRule(rule._id); onRefresh(); }
    catch (e) { setError(e.message || 'Failed to trigger rule'); }
  };

  const handleReorder = async (ruleId, direction) => {
    const idx = rules.findIndex(r => r._id === ruleId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rules.length) return;
    const order = rules.map((r, i) => ({ id: r._id, priority: i * 10 }));
    const tmp = order[idx].priority;
    order[idx].priority = order[swapIdx].priority;
    order[swapIdx].priority = tmp;
    try { await financeAPI.reorderRules(order); onRefresh(); }
    catch (e) { setError(e.message || 'Failed to reorder rules'); }
  };

  const handleDryRun = async (rule) => {
    setDryRun({ loading: true, ruleId: rule._id, result: null });
    try {
      const data = await financeAPI.dryRunRule(rule._id, dryRunAmount);
      setDryRun({ loading: false, ruleId: rule._id, result: data.dryRun });
    } catch (e) {
      setDryRun({ loading: false, ruleId: rule._id, result: null, error: e.message });
    }
  };

  const toggleHistory = async (ruleId) => {
    const next = new Set(historyOpen);
    if (next.has(ruleId)) { next.delete(ruleId); setHistoryOpen(next); return; }
    next.add(ruleId);
    setHistoryOpen(next);
    if (!historyCache[ruleId]) {
      try {
        const data = await financeAPI.getTransactions({ ruleId, limit: 10 });
        setHistoryCache(c => ({ ...c, [ruleId]: data.transactions || [] }));
      } catch (_) { setHistoryCache(c => ({ ...c, [ruleId]: [] })); }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Money Flow Rules</h3>
        <button onClick={() => { setShowForm(true); setEditingRule(null); }}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
          <Plus size={14} /> New Rule
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md">{error}</div>}

      {/* Dry-run modal */}
      {dryRun && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDryRun(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Play size={15} className="text-blue-500" /> Dry Run</h4>
              <button onClick={() => setDryRun(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-xs text-gray-500 shrink-0">Simulate inflow of:</label>
              <input type="number" value={dryRunAmount} min="0.01" step="0.01"
                onChange={e => setDryRunAmount(parseFloat(e.target.value))}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <button onClick={() => handleDryRun(rules.find(r => r._id === dryRun.ruleId))}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">
                Run
              </button>
            </div>
            {dryRun.loading && <p className="text-sm text-gray-400">Simulating…</p>}
            {dryRun.error && <p className="text-sm text-red-500">{dryRun.error}</p>}
            {dryRun.result && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Transfer amount</span><span className="font-bold text-blue-600">{fmt(dryRun.result.simulatedTransferAmount, currencySymbol)}</span></div>
                {dryRun.result.from && <div className="flex justify-between"><span className="text-gray-500">From balance after</span><span className={dryRun.result.projectedFromBalance < 0 ? 'text-red-500 font-semibold' : 'font-medium'}>{dryRun.result.projectedFromBalance != null ? fmt(dryRun.result.projectedFromBalance, currencySymbol) : '—'}</span></div>}
                {dryRun.result.to && <div className="flex justify-between"><span className="text-gray-500">To balance after</span><span className="font-medium">{dryRun.result.projectedToBalance != null ? fmt(dryRun.result.projectedToBalance, currencySymbol) : '—'}</span></div>}
              </div>
            )}
          </div>
        </div>
      )}

      {(showForm && !editingRule) && (
        <RuleForm accounts={accounts} rules={rules} onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {rules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Zap size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No rules yet</p>
          <p className="text-sm">Create a rule to automate money flows between accounts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, ruleIdx) => (
            <div key={rule._id}>
              {editingRule?._id === rule._id ? (
                <RuleForm
                  accounts={accounts}
                  rules={rules}
                  initial={{
                    ...rule,
                    sourceAccountId: rule.sourceAccountId?._id || rule.sourceAccountId || '',
                    targetAccountId: rule.targetAccountId?._id || rule.targetAccountId || '',
                  }}
                  onSave={handleUpdate}
                  onCancel={() => setEditingRule(null)}
                />
              ) : (
                <div className={`rounded-lg border ${rule.isActive ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                        <span className="text-xs text-gray-400 tabular-nums leading-none">{ruleIdx + 1}</span>
                        <button onClick={() => handleReorder(rule._id, 'up')} disabled={ruleIdx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed">
                          <ArrowUp size={11} />
                        </button>
                        <button onClick={() => handleReorder(rule._id, 'down')} disabled={ruleIdx === rules.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed">
                          <ArrowDown size={11} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{rule.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${rule.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {RULE_TRIGGERS.find(t => t.value === rule.trigger)?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="font-medium" style={{ color: rule.sourceAccountId?.color || '#6B7280' }}>
                            {rule.sourceAccountId?.name || 'External'}
                          </span>
                          <ArrowRight size={13} />
                          <span className="font-medium" style={{ color: rule.targetAccountId?.color || '#6B7280' }}>
                            {rule.targetAccountId?.name || '\u2014'}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">\u00b7</span>
                          <span>{rule.type === 'percentage' ? `${rule.value}%` : `${currencySymbol}${rule.value}`}</span>
                        </div>
                        {rule.description && <p className="text-xs text-gray-400 mt-1">{rule.description}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {rule.trigger === 'recurring' && rule.type === 'fixed' && (
                          <button onClick={() => handleTrigger(rule)} title="Trigger now"
                            className="p-1.5 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded">
                            <Zap size={14} />
                          </button>
                        )}
                        <button onClick={() => { setDryRun({ loading: false, ruleId: rule._id, result: null }); }} title="Dry run"
                          className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">
                          <Play size={14} />
                        </button>
                        <button onClick={() => toggleHistory(rule._id)} title="Rule history"
                          className={`p-1.5 rounded ${historyOpen.has(rule._id) ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          <History size={14} />
                        </button>
                        <button onClick={() => handleToggle(rule)} title={rule.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          {rule.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setEditingRule(rule)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(rule._id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {historyOpen.has(rule._id) && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 bg-gray-50/60 dark:bg-gray-900/40 rounded-b-lg">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Recent activity</p>
                      {!historyCache[rule._id] ? (
                        <p className="text-xs text-gray-400">Loading\u2026</p>
                      ) : historyCache[rule._id].length === 0 ? (
                        <p className="text-xs text-gray-400">No history yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {historyCache[rule._id].map(tx => (
                            <div key={tx._id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 gap-2">
                              <span className="text-gray-400 shrink-0">{new Date(tx.date).toLocaleDateString()}</span>
                              <span className="truncate flex-1">{tx.description}</span>
                              <span className="font-medium shrink-0">{fmt(tx.amount, currencySymbol)}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${tx.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'}`}>{tx.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Transactions ────────────────────────────────────────────────────────

function TransactionForm({ accounts, onSave, onCancel }) {
  const [form, setForm] = useState({ type: 'deposit', fromAccountId: '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10), status: 'completed' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (!payload.fromAccountId) delete payload.fromAccountId;
    if (!payload.toAccountId) delete payload.toAccountId;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type *</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount *</label>
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        {(form.type === 'withdrawal' || form.type === 'transfer') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Account</label>
            <select value={form.fromAccountId} onChange={e => set('fromAccountId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">— External —</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        )}
        {(form.type === 'deposit' || form.type === 'transfer') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To Account</label>
            <select value={form.toAccountId} onChange={e => set('toAccountId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">— External —</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
          <input value={form.description} onChange={e => set('description', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
          Add Transaction
        </button>
      </div>
    </form>
  );
}

const TX_TYPE_COLORS = { deposit: 'text-green-600', withdrawal: 'text-red-600', transfer: 'text-blue-600', rule_triggered: 'text-amber-600' };
const TX_STATUS_STYLES = {
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  cancelled: 'bg-gray-200 dark:bg-gray-700 text-gray-500',
};

function TransactionsTab({ accounts, onRefresh, currencySymbol }) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importError, setImportError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 20;

  const buildParams = useCallback(() => ({
    status: filterStatus || undefined,
    type: filterType || undefined,
    accountId: filterAccount || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    amountMin: filterAmountMin ? parseFloat(filterAmountMin) : undefined,
    amountMax: filterAmountMax ? parseFloat(filterAmountMax) : undefined,
    page, limit,
  }), [filterStatus, filterType, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, page]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeAPI.getTransactions(buildParams());
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const resetFilters = () => {
    setFilterStatus(''); setFilterType(''); setFilterAccount('');
    setFilterDateFrom(''); setFilterDateTo(''); setFilterAmountMin(''); setFilterAmountMax('');
    setPage(1);
  };

  const handleCreate = async (data) => {
    try {
      await financeAPI.createTransaction(data);
      setShowForm(false); setPage(1); loadTransactions(); onRefresh();
    } catch (e) { setError(e.message); }
  };

  const handleStatusChange = async (txId, status) => {
    try { await financeAPI.updateTransactionStatus(txId, status); loadTransactions(); onRefresh(); }
    catch (e) { setError(e.message); }
  };

  const handleDelete = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    try { await financeAPI.deleteTransaction(txId); loadTransactions(); onRefresh(); }
    catch (e) { setError(e.message); }
  };

  const handleExportCSV = async () => {
    try {
      const data = await financeAPI.getTransactions({ ...buildParams(), page: 1, limit: 5000 });
      const header = ['Date', 'Type', 'Status', 'Amount', 'From', 'To', 'Description'];
      const rows = data.transactions.map(tx => [
        new Date(tx.date).toISOString().slice(0, 10), tx.type, tx.status, tx.amount,
        tx.fromAccountId?.name || 'External', tx.toAccountId?.name || 'External', tx.description || ''
      ]);
      const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  };

  const parseImportCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) { setImportError('CSV must have a header row and at least one data row.'); return; }
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)/g) || [];
      const obj = {};
      header.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/"/g, '').trim(); });
      return obj;
    });
    const preview = rows.map(r => ({
      date: r.date || new Date().toISOString().slice(0, 10),
      type: r.type || 'deposit',
      amount: parseFloat(r.amount) || 0,
      description: r.description || '',
      status: r.status || 'completed',
    })).filter(r => r.amount > 0);
    if (!preview.length) { setImportError('No valid rows found.'); return; }
    setImportError('');
    setImportPreview(preview);
  };

  const handleBulkImport = async () => {
    try {
      await financeAPI.bulkCreateTransactions(importPreview);
      setShowImport(false); setImportText(''); setImportPreview([]);
      loadTransactions(); onRefresh();
    } catch (e) { setImportError(e.message); }
  };

  const pages = Math.ceil(total / limit);
  const hasActiveFilters = filterStatus || filterType || filterAccount || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-sm border rounded-md ${hasActiveFilters ? 'border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Filter size={13} /> Filters {hasActiveFilters && `(active)`}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} transactions</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} title="Export CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowImport(true)} title="Import CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Upload size={13} /> Import
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            <Plus size={14} /> New
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Status</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Type</label>
            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Account</label>
            <select value={filterAccount} onChange={e => { setFilterAccount(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All accounts</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Date from</label>
            <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Date to</label>
            <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Min amount</label>
            <input type="number" min="0" step="0.01" value={filterAmountMin} onChange={e => { setFilterAmountMin(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Max amount</label>
            <input type="number" min="0" step="0.01" value={filterAmountMax} onChange={e => { setFilterAmountMax(e.target.value); setPage(1); }}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <button onClick={resetFilters} className="w-full px-2 py-1 text-xs text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md">{error}</div>}

      {showForm && <TransactionForm accounts={accounts} onSave={handleCreate} onCancel={() => setShowForm(false)} />}

      {/* Bulk import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Upload size={15} className="text-blue-500" /> Bulk Import CSV</h4>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-2">CSV columns: <code>date, type, amount, description, status</code></p>
            <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportPreview([]); }}
              rows={5} placeholder="date,type,amount,description,status&#10;2024-01-15,deposit,500,Salary,completed"
              className="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2" />
            {importError && <p className="text-xs text-red-500 mb-2">{importError}</p>}
            {importPreview.length > 0 && (
              <div className="mb-3 max-h-36 overflow-auto">
                <p className="text-xs text-gray-400 mb-1">{importPreview.length} rows to import:</p>
                {importPreview.slice(0, 5).map((r, i) => (
                  <div key={i} className="text-xs text-gray-600 dark:text-gray-300">{r.date} · {r.type} · {currencySymbol}{r.amount} · {r.description}</div>
                ))}
                {importPreview.length > 5 && <div className="text-xs text-gray-400">…and {importPreview.length - 5} more</div>}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => parseImportCSV(importText)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Parse
              </button>
              <button onClick={handleBulkImport} disabled={importPreview.length === 0}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded">
                Import {importPreview.length > 0 ? `(${importPreview.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Coins size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No transactions found</p>
          {hasActiveFilters && <button onClick={resetFilters} className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div key={tx._id} className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium capitalize ${TX_TYPE_COLORS[tx.type] || 'text-gray-600'}`}>{tx.type.replace('_', ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TX_STATUS_STYLES[tx.status]}`}>{tx.status}</span>
                  {tx.ruleId && <span className="text-xs text-amber-600 dark:text-amber-400">\u26a1 {tx.ruleId.name}</span>}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span style={{ color: tx.fromAccountId?.color }}>{tx.fromAccountId?.name || 'External'}</span>
                  <ArrowRight size={10} />
                  <span style={{ color: tx.toAccountId?.color }}>{tx.toAccountId?.name || 'External'}</span>
                  {tx.description && <><span>\u00b7</span><span className="truncate max-w-xs">{tx.description}</span></>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(tx.date).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-semibold text-sm ${tx.type === 'deposit' || (tx.type === 'transfer' && !tx.fromAccountId) ? 'text-green-600' : 'text-red-600'}`}>
                  {currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {tx.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusChange(tx._id, 'completed')} title="Mark completed"
                      className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded">
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleStatusChange(tx._id, 'cancelled')} title="Cancel"
                      className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <X size={14} />
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(tx._id)}
                  className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            \u2039 Prev
          </button>
          <span className="text-sm text-gray-500">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
            Next \u203a
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Analytics ───────────────────────────────────────────────────────────

function BarChart({ data, currencySymbol }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const maxVal = Math.max(...data.map(d => Math.max(d.totalIn, d.totalOut, 0.01)));

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-3 h-48 min-w-max px-2 pb-2">
        {data.map(account => (
          <div key={account._id} className="flex flex-col items-center gap-1" style={{ minWidth: 64 }}>
            <div className="flex items-end gap-1 h-36">
              <div
                className="w-6 rounded-t"
                style={{ height: `${Math.max(4, (account.totalIn / maxVal) * 144)}px`, backgroundColor: account.color, opacity: 0.85 }}
                title={`In: ${currencySymbol}${account.totalIn.toFixed(2)}`}
              />
              <div
                className="w-6 rounded-t"
                style={{ height: `${Math.max(4, (account.totalOut / maxVal) * 144)}px`, backgroundColor: account.color, opacity: 0.4 }}
                title={`Out: ${currencySymbol}${account.totalOut.toFixed(2)}`}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center" style={{ maxWidth: 64, wordBreak: 'break-word' }}>{account.name}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400 px-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 opacity-85 inline-block" /> Inflow</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 opacity-40 inline-block" /> Outflow</span>
      </div>
    </div>
  );
}

function LineChart({ dailyFlow, currencySymbol }) {
  if (!dailyFlow || dailyFlow.length === 0) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const W = 600, H = 160, PAD = 40;
  const maxNet = Math.max(...dailyFlow.map(d => Math.max(d.totalIn, d.totalOut)), 0.01);

  const xStep = (W - PAD * 2) / Math.max(dailyFlow.length - 1, 1);

  const inPoints = dailyFlow.map((d, i) => `${PAD + i * xStep},${H - PAD - (d.totalIn / maxNet) * (H - PAD * 2)}`).join(' ');
  const outPoints = dailyFlow.map((d, i) => `${PAD + i * xStep},${H - PAD - (d.totalOut / maxNet) * (H - PAD * 2)}`).join(' ');

  const labelEvery = Math.max(1, Math.floor(dailyFlow.length / 5));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i} x1={PAD} y1={PAD + pct * (H - PAD * 2)} x2={W - PAD} y2={PAD + pct * (H - PAD * 2)}
            stroke="rgba(156,163,175,0.2)" strokeWidth="1" />
        ))}
        {/* Lines */}
        <polyline points={inPoints} fill="none" stroke="#10B981" strokeWidth="2" />
        <polyline points={outPoints} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 2" />
        {/* X-axis labels */}
        {dailyFlow.map((d, i) => i % labelEvery === 0 && (
          <text key={i} x={PAD + i * xStep} y={H - 4} textAnchor="middle" fontSize="9" className="fill-gray-400">
            {d._id.slice(5)}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-green-500 inline-block" /> Inflow</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 bg-red-500 inline-block" style={{ borderStyle: 'dashed' }} /> Outflow</span>
      </div>
    </div>
  );
}

function NetWorthChart({ history, currencySymbol }) {
  if (!history || history.length === 0) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No snapshot data</div>;
  const W = 600, H = 140, PAD = 40;
  const vals = history.map(h => h.totalBalance);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals, minV + 0.01);
  const xStep = (W - PAD * 2) / Math.max(history.length - 1, 1);
  const toY = v => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD * 2);
  const points = history.map((h, i) => `${PAD + i * xStep},${toY(h.totalBalance)}`).join(' ');
  const areaPath = `M${PAD},${H - PAD} ` + history.map((h, i) => `L${PAD + i * xStep},${toY(h.totalBalance)}`).join(' ') + ` L${PAD + (history.length - 1) * xStep},${H - PAD} Z`;
  const labelEvery = Math.max(1, Math.floor(history.length / 5));
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
        {[0, 0.5, 1].map((pct, i) => (
          <line key={i} x1={PAD} y1={PAD + pct * (H - PAD * 2)} x2={W - PAD} y2={PAD + pct * (H - PAD * 2)}
            stroke="rgba(156,163,175,0.2)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="rgba(59,130,246,0.08)" />
        <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="2" />
        {history.map((h, i) => i % labelEvery === 0 && (
          <text key={i} x={PAD + i * xStep} y={H - 4} textAnchor="middle" fontSize="9" className="fill-gray-400">
            {h.date?.slice(5) || h._id?.slice(5)}
          </text>
        ))}
        <text x={PAD - 4} y={PAD + 4} textAnchor="end" fontSize="8" className="fill-gray-400">
          {currencySymbol}{Math.round(maxV).toLocaleString()}
        </text>
        <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" fontSize="8" className="fill-gray-400">
          {currencySymbol}{Math.round(minV).toLocaleString()}
        </text>
      </svg>
    </div>
  );
}

function AnalyticsTab({ currencySymbol }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ name: '', amount: '', period: 'monthly' });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [d, nwh, bdg] = await Promise.all([
        financeAPI.getAnalytics(days),
        financeAPI.getNetWorthHistory(days).catch(() => ({ history: [] })),
        financeAPI.getBudgets().catch(() => ({ budgets: [] })),
      ]);
      setData(d);
      setNetWorthHistory(nwh.history || []);
      setBudgets(bdg.budgets || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const handleSaveBudget = async () => {
    try {
      const payload = { ...budgetForm, amount: parseFloat(budgetForm.amount) };
      if (editingBudget?._id) { await financeAPI.updateBudget(editingBudget._id, payload); }
      else { await financeAPI.createBudget(payload); }
      setEditingBudget(null);
      setBudgetForm({ name: '', amount: '', period: 'monthly' });
      loadAnalytics();
    } catch (e) { setError(e.message); }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try { await financeAPI.deleteBudget(id); loadAnalytics(); }
    catch (e) { setError(e.message); }
  };

  const totalBalance = data?.accountSummary?.reduce((s, a) => s + a.balance, 0) || 0;
  const totalIn = data?.accountSummary?.reduce((s, a) => s + a.totalIn, 0) || 0;
  const totalOut = data?.accountSummary?.reduce((s, a) => s + a.totalOut, 0) || 0;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Analytics</h3>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 text-sm rounded-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Balance', value: totalBalance, icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Total Inflow', value: totalIn, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Total Outflow', value: totalOut, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(kpi => (
              <div key={kpi.label} className={`p-4 rounded-lg ${kpi.bg}`}>
                <div className={`flex items-center gap-2 mb-1 ${kpi.color}`}><kpi.icon size={16} /><span className="text-xs font-medium">{kpi.label}</span></div>
                <div className={`text-xl font-bold ${kpi.color}`}>{currencySymbol}{Math.abs(kpi.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>

          {/* Net worth over time */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><TrendingUp size={14} /> Net Worth Over Time</h4>
            <NetWorthChart history={netWorthHistory} currencySymbol={currencySymbol} />
          </div>

          {/* Per-account bar chart */}
          {data?.accountSummary?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Flow by Account</h4>
              <BarChart data={data.accountSummary} currencySymbol={currencySymbol} />
            </div>
          )}

          {/* Daily flow line chart */}
          {data?.dailyFlow?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Daily Flow</h4>
              <LineChart dailyFlow={data.dailyFlow} currencySymbol={currencySymbol} />
            </div>
          )}

          {/* Budgets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Target size={14} /> Budgets</h4>
              <button onClick={() => { setEditingBudget({}); setBudgetForm({ name: '', amount: '', period: 'monthly' }); }}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus size={11} /> Add Budget
              </button>
            </div>
            {editingBudget && (
              <div className="p-3 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Name</label>
                  <input value={budgetForm.name} onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Amount</label>
                  <input type="number" min="0.01" step="0.01" value={budgetForm.amount} onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-28" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Period</label>
                  <select value={budgetForm.period} onChange={e => setBudgetForm(f => ({ ...f, period: e.target.value }))}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button onClick={handleSaveBudget}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">
                    {editingBudget._id ? 'Update' : 'Create'}
                  </button>
                  <button onClick={() => setEditingBudget(null)}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {budgets.length === 0 ? (
              <p className="text-xs text-gray-400">No budgets set. Add a budget to track spending limits.</p>
            ) : (
              <div className="space-y-2">
                {budgets.map(b => {
                  const spent = totalOut;
                  const pct = Math.min(100, (spent / b.amount) * 100);
                  return (
                    <div key={b._id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{b.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{b.period}</span>
                          <button onClick={() => { setEditingBudget(b); setBudgetForm({ name: b.name, amount: b.amount, period: b.period }); }}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Edit2 size={11} /></button>
                          <button onClick={() => handleDeleteBudget(b._id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${pct >= 100 ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                          {fmt(totalOut, currencySymbol)} / {fmt(b.amount, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-account detail table */}
          {data?.accountSummary?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Account Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-2 pr-4 font-medium">Account</th>
                      <th className="pb-2 pr-4 font-medium text-right">Balance</th>
                      <th className="pb-2 pr-4 font-medium text-right">Inflow</th>
                      <th className="pb-2 font-medium text-right">Outflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.accountSummary.map(a => (
                      <tr key={a._id}>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                            <span className="text-gray-900 dark:text-white">{a.name}</span>
                          </div>
                        </td>
                        <td className={`py-2 pr-4 text-right font-medium ${a.balance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {a.balance < 0 ? '-' : ''}{currencySymbol}{Math.abs(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 pr-4 text-right text-green-600">{currencySymbol}{a.totalIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2 text-right text-red-600">{currencySymbol}{a.totalOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Account Modal ────────────────────────────────────────────────────────────

function AccountModal({ initial, onSave, onClose, onArchive }) {
  const [form, setForm] = useState(initial || { name: '', type: 'checking', balance: 0, description: '', color: '#3B82F6' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, balance: parseFloat(form.balance) || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{initial ? 'Edit Account' : 'New Account'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={e => { set('type', e.target.value); set('color', accountTypeInfo(e.target.value).color); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Opening Balance</label>
              <input type="number" step="0.01" value={form.balance} onChange={e => set('balance', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full border-2 ${form.color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex gap-2 justify-between pt-2">
            <div>
              {initial?._id && onArchive && (
                <button type="button" onClick={() => onArchive(initial._id, !initial.isArchived)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-md ${initial.isArchived ? 'border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20' : 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                  <Archive size={13} /> {initial.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                {initial ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Finance Page ────────────────────────────────────────────────────────

const TABS = [
  { id: 'flowchart', slug: 'flowmap', label: 'Flow Map', icon: GitBranch },
  { id: 'rules', slug: 'rules', label: 'Rules', icon: Zap },
  { id: 'transactions', slug: 'transactions', label: 'Transactions', icon: ArrowRight },
  { id: 'analytics', slug: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Finance() {
  const { tab: tabSlug } = useParams();
  const navigate = useNavigate();
  const activeTabDef = TABS.find(t => t.slug === tabSlug) || TABS[0];
  const activeTab = activeTabDef.id;
  const [accounts, setAccounts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountModal, setAccountModal] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [bridgeThroughput, setBridgeThroughput] = useState({});

  const { settings } = useSettings();
  const currency = settings?.finance?.currency || 'USD';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const loadData = useCallback(async () => {
    try {
      const [accData, ruleData, analyticsData] = await Promise.all([
        financeAPI.getAccounts({ includeArchived: showArchived }),
        financeAPI.getRules(),
        financeAPI.getAnalytics(30).catch(() => null),
      ]);
      setAccounts(accData.accounts || []);
      setRules(ruleData.rules || []);
      if (analyticsData?.bridgeThroughput) setBridgeThroughput(analyticsData.bridgeThroughput);
    } catch (e) {
      setError(e.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveAccount = async (data) => {
    try {
      if (accountModal?._id) { await financeAPI.updateAccount(accountModal._id, data); }
      else { await financeAPI.createAccount(data); }
      setAccountModal(null);
      loadData();
    } catch (e) { setError(e.message || 'Failed to save account'); }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Delete this account? All associated rules will also be removed.')) return;
    try { await financeAPI.deleteAccount(id); loadData(); }
    catch (e) { setError(e.message || 'Failed to delete account'); }
  };

  const handleArchiveAccount = async (id, archive) => {
    try { await financeAPI.archiveAccount(id, archive); setAccountModal(null); loadData(); }
    catch (e) { setError(e.message || 'Failed to archive account'); }
  };

  const totalBalance = accounts.filter(a => !a.isArchived).reduce((s, a) => s + a.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-300-rm flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign size={22} className="text-green-600" /> Finance
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {accounts.filter(a => !a.isArchived).length} accounts · Net balance:&nbsp;
              <span className={`font-semibold ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {currencySymbol}{Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowArchived(v => !v)}
              className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg ${showArchived ? 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <Archive size={14} /> {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
            <button onClick={() => setAccountModal({})}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              <Plus size={16} /> Add Account
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md flex items-center gap-2">
            <AlertCircle size={14} /> {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(`/finance/${tab.slug}`)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className={activeTab === 'flowchart' ? 'flex-1 flex flex-col min-h-0' : 'min-h-96'}>
        {activeTab === 'flowchart' && (
          <FlowchartTab
            accounts={accounts.filter(a => !a.isArchived)}
            rules={rules}
            onRefresh={loadData}
            currencySymbol={currencySymbol}
            onEditAccount={(a) => setAccountModal(a)}
            onDeleteAccount={handleDeleteAccount}
            bridgeThroughput={bridgeThroughput}
          />
        )}
        {activeTab === 'rules' && (
          <RulesTab accounts={accounts} rules={rules} onRefresh={loadData} currencySymbol={currencySymbol} />
        )}
        {activeTab === 'transactions' && (
          <TransactionsTab accounts={accounts} onRefresh={loadData} currencySymbol={currencySymbol} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab currencySymbol={currencySymbol} />
        )}
      </div>

      {/* Account modal */}
      {accountModal !== null && (
        <AccountModal
          initial={accountModal?._id ? accountModal : null}
          onSave={handleSaveAccount}
          onClose={() => setAccountModal(null)}
          onArchive={handleArchiveAccount}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Plus, Trash2, Edit3, RotateCcw, MapPin, BarChart3,
  TrendingUp, Calendar, ChevronLeft, ChevronRight, Search, X, Save,
  AlertTriangle, Globe, Lock, Settings
} from 'lucide-react';
import { usePageActions } from '../../contexts/PageActionsContext';
import { useSettings } from '../../contexts/SettingsContext';
import radiationAPI from '../../services/radiationAPI';
import {
  fromUSvH, toUSvH, levelColorClass, levelTextColorClass,
  levelHeatmapClass, RADIATION_UNITS
} from '../../utils/radiationUnits';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['Draft', 'Verified', 'Flagged', 'Archived'];
const STATUS_COLORS = {
  Draft:    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Verified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  Flagged:  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  Archived: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const toInputDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

// ─── Measurement Form Modal ────────────────────────────────────────────────────
const MeasurementModal = ({ measurement, locations, unit, cpmFactor, onSave, onClose }) => {
  const isEdit = !!measurement?._id;
  const [form, setForm] = useState({
    date:         toInputDate(measurement?.date) || toInputDate(new Date()),
    timeStart:    measurement?.timeStart || '',
    timeEnd:      measurement?.timeEnd || '',
    locationId:   measurement?.locationId || '',
    averageLevel: measurement ? fromUSvH(measurement.averageLevel, unit, cpmFactor) ?? '' : '',
    peakLevel:    measurement ? (measurement.peakLevel !== null ? fromUSvH(measurement.peakLevel, unit, cpmFactor) : '') : '',
    comments:     measurement?.comments || '',
    notes:        measurement?.notes || '',
    tags:         measurement?.tags?.join(', ') || '',
    status:       measurement?.status || 'Draft',
    isPublic:     measurement?.isPublic || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const normalizeDecimal = (v) => {
    if (typeof v === 'string') return v.replace(',', '.');
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.averageLevel && form.averageLevel !== 0) { setError('Average level is required'); return; }
    setSaving(true);
    try {
      const avgUSvH = toUSvH(normalizeDecimal(form.averageLevel), unit, cpmFactor);
      const peakUSvH = form.peakLevel !== '' ? toUSvH(normalizeDecimal(form.peakLevel), unit, cpmFactor) : null;
      const payload = {
        date: form.date,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        locationId: form.locationId || null,
        averageLevel: avgUSvH,
        peakLevel: peakUSvH,
        comments: form.comments,
        notes: form.notes,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: form.status,
        isPublic: form.isPublic,
      };
      if (isEdit) {
        await radiationAPI.updateMeasurement(measurement._id, payload);
      } else {
        await radiationAPI.createMeasurement(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save measurement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Measurement' : 'New Measurement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Start</label>
              <input type="time" value={form.timeStart} onChange={e => set('timeStart', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time End</label>
              <input type="time" value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <select value={form.locationId} onChange={e => set('locationId', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">— No location —</option>
              {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Average Level ({unit}) *
              </label>
              <input type="text" inputMode="decimal" pattern="[0-9.,]*" min="0" value={form.averageLevel}
                onChange={e => set('averageLevel', e.target.value)} required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peak Level ({unit})
              </label>
              <input type="text" inputMode="decimal" pattern="[0-9.,]*" min="0" value={form.peakLevel}
                onChange={e => set('peakLevel', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="outdoor, sensor-a, ..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments</label>
            <textarea value={form.comments} onChange={e => set('comments', e.target.value)} rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={e => set('isPublic', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600" />
            <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">Make this measurement public</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ onConfirm, onClose, hard = false }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {hard ? 'Permanently Delete?' : 'Delete Measurement?'}
          </h3>
        </div>
        {!hard && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        )}
        {hard && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This cannot be undone.</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">
            {hard ? 'Delete Permanently' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Locations Tab ────────────────────────────────────────────────────────────
const LocationsTab = ({ locations, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', lat: '', lng: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => { setForm({ name: '', description: '', lat: '', lng: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (loc) => {
    setForm({ name: loc.name, description: loc.description || '', lat: loc.coordinates?.lat ?? '', lng: loc.coordinates?.lng ?? '' });
    setEditing(loc); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        coordinates: { lat: form.lat !== '' ? parseFloat(form.lat) : null, lng: form.lng !== '' ? parseFloat(form.lng) : null }
      };
      if (editing) { await radiationAPI.updateLocation(editing._id, payload); }
      else { await radiationAPI.createLocation(payload); }
      setShowForm(false); onRefresh();
    } catch (err) { setError(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try { await radiationAPI.deleteLocation(id); onRefresh(); }
    catch (err) { alert(err.message || 'Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Locations</h3>
        <button onClick={openNew}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
          <Plus className="h-4 w-4" /> New Location
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-600">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input type="number" step="any" min="-90" max="90" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                placeholder="e.g. 59.9139"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input type="number" step="any" min="-180" max="180" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                placeholder="e.g. 10.7522"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {locations.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No locations yet. Add one to attach to measurements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map(loc => (
            <div key={loc._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{loc.name}</p>
                  {loc.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{loc.description}</p>}
                  {(loc.coordinates?.lat != null) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(loc)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Edit3 className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(loc._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Simple SVG Line Chart ─────────────────────────────────────────────────────
const LineChart = ({ series, unit, cpmFactor, width = 600, height = 180 }) => {
  if (!series || series.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No data for selected range</div>;
  }

  const padX = 48, padY = 16, padRight = 16, padBottom = 32;
  const W = width - padX - padRight;
  const H = height - padY - padBottom;

  const avgVals = series.map(d => fromUSvH(d.averageLevel, unit, cpmFactor) ?? 0);
  const peakVals = series.map(d => d.peakLevel != null ? (fromUSvH(d.peakLevel, unit, cpmFactor) ?? 0) : null);
  const allVals = [...avgVals, ...peakVals.filter(v => v !== null)];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  const xScale = (i) => padX + (i / (series.length - 1 || 1)) * W;
  const yScale = (v) => padY + H - ((v - minV) / range) * H;

  const avgPath = avgVals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`).join(' ');
  const peakPath = peakVals
    .map((v, i) => v !== null ? `${i === 0 || peakVals[i - 1] === null ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}` : null)
    .filter(Boolean).join(' ');

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minV + (range * i) / ticks);

  const labelEvery = Math.max(1, Math.floor(series.length / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padX} x2={padX + W} y1={yScale(v)} y2={yScale(v)} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
          <text x={padX - 4} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.5">{v.toFixed(2)}</text>
        </g>
      ))}
      {series.map((d, i) => i % labelEvery === 0 && (
        <text key={i} x={xScale(i)} y={height - 4} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.5">
          {new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </text>
      ))}
      {peakPath && <path d={peakPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />}
      <path d={avgPath} fill="none" stroke="#22c55e" strokeWidth="2" />
      {avgVals.map((v, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(v)} r="3" fill="#22c55e">
          <title>{fmtDate(series[i].date)}: {v.toFixed(3)} {unit}</title>
        </circle>
      ))}
      <text x={padX + W / 2} y={height} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.4">— avg  ── peak</text>
    </svg>
  );
};

// ─── Bar Chart by Location ─────────────────────────────────────────────────────
const BarChart = ({ data, unit, cpmFactor }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No location data</div>;
  }

  const maxVal = Math.max(...data.map(d => fromUSvH(d.avgLevel, unit, cpmFactor) ?? 0));
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const val = fromUSvH(d.avgLevel, unit, cpmFactor) ?? 0;
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 text-xs text-gray-600 dark:text-gray-400 text-right truncate flex-shrink-0" title={d._id}>{d._id}</div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
              <div className={`h-5 rounded-full ${levelColorClass(d.avgLevel)}`} style={{ width: `${pct}%`, minWidth: '4px' }} />
            </div>
            <div className={`w-28 text-xs font-mono ${levelTextColorClass(d.avgLevel)} flex-shrink-0`}>
              {val.toFixed(3)} {unit}
              <span className="text-gray-400 dark:text-gray-500 ml-1">({d.count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Heatmap Calendar ─────────────────────────────────────────────────────────
const HeatmapCalendar = ({ heatmap, year, onYearChange }) => {
  const map = {};
  (heatmap || []).forEach(d => { map[d._id] = d; });

  const startDate = new Date(year, 0, 1);
  const endDate   = new Date(year, 11, 31);
  const weeks = [];
  let currentWeek = Array(startDate.getDay()).fill(null);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const str = d.toISOString().split('T')[0];
    currentWeek.push({ date: str, data: map[str] || null });
    if (d.getDay() === 6) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onYearChange(year - 1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-center">{year}</span>
        <button onClick={() => onYearChange(Math.min(year + 1, new Date().getFullYear()))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px] min-w-[700px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div key={di}
                  className={`w-3 h-3 rounded-sm ${day ? levelHeatmapClass(day.data?.avgLevel ?? null) : 'opacity-0'}`}
                  title={day?.date ? `${day.date}${day.data ? `: avg ${day.data.avgLevel?.toFixed(3)} µSv/h (${day.data.count} readings)` : ''}` : ''} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px] mt-1 min-w-[700px]">
          {months.map((m, mi) => {
            const firstWeek = weeks.findIndex(w => w.some(d => d && d.date?.startsWith(`${year}-${String(mi + 1).padStart(2, '0')}`)));
            return <div key={m} style={{ marginLeft: firstWeek === 0 ? 0 : undefined, width: `${(53 / 12) * 15}px` }}
              className="text-xs text-gray-400 dark:text-gray-500">{m}</div>;
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Low</span>
        {['bg-green-200 dark:bg-green-900','bg-green-400 dark:bg-green-700','bg-yellow-400 dark:bg-yellow-600','bg-orange-500','bg-red-600'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const AnalyticsTab = ({ unit, cpmFactor }) => {
  const [timeSeries, setTimeSeries]   = useState(null);
  const [byLocation, setByLocation]   = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [tsRange, setTsRange] = useState({ from: '', to: '' });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (tsRange.from) params.dateFrom = tsRange.from;
      if (tsRange.to)   params.dateTo   = tsRange.to;
      const [ts, bl, hm] = await Promise.all([
        radiationAPI.getTimeSeries(params),
        radiationAPI.getByLocation(),
        radiationAPI.getHeatmap(heatmapYear),
      ]);
      setTimeSeries(ts?.series || []);
      setByLocation(bl?.data || []);
      setHeatmapData(hm?.heatmap || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tsRange, heatmapYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading && !timeSeries) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Series */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" /> Radiation Level Over Time
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={tsRange.from} onChange={e => setTsRange(r => ({ ...r, from: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-500">to</span>
            <input type="date" value={tsRange.to} onChange={e => setTsRange(r => ({ ...r, to: e.target.value }))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <LineChart series={timeSeries || []} unit={unit} cpmFactor={cpmFactor} />
      </div>

      {/* Per-Location Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" /> Average Level by Location
        </h3>
        <BarChart data={byLocation || []} unit={unit} cpmFactor={cpmFactor} />
      </div>

      {/* Heatmap Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-purple-600" /> Daily Average Heatmap
        </h3>
        <HeatmapCalendar heatmap={heatmapData} year={heatmapYear} onYearChange={(y) => setHeatmapYear(y)} />
      </div>
    </div>
  );
};

// ─── Measurements Table Tab ───────────────────────────────────────────────────
const MeasurementsTab = ({ locations, unit, cpmFactor, showDeleted }) => {
  const [measurements, setMeasurements] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', locationId: '', dateFrom: '', dateTo: '' });
  const [page, setPage]       = useState(1);
  const limit = 25;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, showDeleted: showDeleted ? 'true' : 'false' };
      if (filters.search)     params.search     = filters.search;
      if (filters.status)     params.status     = filters.status;
      if (filters.locationId) params.locationId = filters.locationId;
      if (filters.dateFrom)   params.dateFrom   = filters.dateFrom;
      if (filters.dateTo)     params.dateTo     = filters.dateTo;
      const data = await radiationAPI.getMeasurements(params);
      setMeasurements(data.measurements || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, showDeleted]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSoftDelete = async (reason) => {
    try { await radiationAPI.softDelete(deleteTarget._id, reason); setDeleteTarget(null); fetch(); }
    catch (err) { alert(err.message || 'Delete failed'); }
  };

  const handleHardDelete = async () => {
    try { await radiationAPI.hardDelete(hardDeleteTarget._id); setHardDeleteTarget(null); fetch(); }
    catch (err) { alert(err.message || 'Delete failed'); }
  };

  const handleRestore = async (id) => {
    try { await radiationAPI.restore(id); fetch(); }
    catch (err) { alert(err.message || 'Restore failed'); }
  };

  const handleToggleVisibility = async (id) => {
    try { await radiationAPI.toggleVisibility(id); fetch(); }
    catch (err) { alert(err.message || 'Failed'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search…" value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-44" />
          </div>
          <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.locationId} onChange={e => { setFilters(f => ({ ...f, locationId: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Locations</option>
            {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => { setFilters(f => ({ ...f, dateFrom: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <input type="date" value={filters.dateTo} onChange={e => { setFilters(f => ({ ...f, dateTo: e.target.value })); setPage(1); }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        {!showDeleted && (
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
            <Plus className="h-4 w-4" /> New
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading…</div>
      ) : measurements.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{showDeleted ? 'No deleted measurements.' : 'No measurements yet. Click "New" to add one.'}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Date', 'Time', 'Location', `Avg (${unit})`, `Peak (${unit})`, 'Status', 'Visibility', 'Tags', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {measurements.map(m => (
                  <tr key={m._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-900 dark:text-white">{fmtDate(m.date)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">
                      {m.timeStart || '—'}{m.timeStart && m.timeEnd ? ` – ${m.timeEnd}` : ''}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{m.locationName || '—'}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap font-mono font-medium ${levelTextColorClass(m.averageLevel)}`}>
                      {fromUSvH(m.averageLevel, unit, cpmFactor)?.toFixed(3) ?? '—'}
                    </td>
                    <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${m.peakLevel != null ? levelTextColorClass(m.peakLevel) : 'text-gray-400'}`}>
                      {m.peakLevel != null ? fromUSvH(m.peakLevel, unit, cpmFactor)?.toFixed(3) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {!showDeleted && (
                        <button onClick={() => handleToggleVisibility(m._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={m.isPublic ? 'Public — click to make private' : 'Private — click to make public'}>
                          {m.isPublic ? <Globe className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-gray-400" />}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(m.tags || []).slice(0, 2).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">{t}</span>
                        ))}
                        {m.tags?.length > 2 && <span className="text-xs text-gray-400">+{m.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {showDeleted ? (
                          <>
                            <button onClick={() => handleRestore(m._id)} title="Restore"
                              className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                              <RotateCcw className="h-4 w-4 text-green-600" />
                            </button>
                            <button onClick={() => setHardDeleteTarget(m)} title="Delete Permanently"
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditTarget(m); setShowModal(true); }} title="Edit"
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                              <Edit3 className="h-4 w-4 text-gray-500" />
                            </button>
                            <button onClick={() => setDeleteTarget(m)} title="Delete"
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{total} total</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <MeasurementModal
          measurement={editTarget}
          locations={locations}
          unit={unit}
          cpmFactor={cpmFactor}
          onSave={() => { setShowModal(false); setEditTarget(null); fetch(); }}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
      {deleteTarget && <DeleteModal onConfirm={handleSoftDelete} onClose={() => setDeleteTarget(null)} />}
      {hardDeleteTarget && <DeleteModal hard onConfirm={handleHardDelete} onClose={() => setHardDeleteTarget(null)} />}
    </div>
  );
};

// ─── Public Tab ───────────────────────────────────────────────────────────────
const PublicTab = ({ unit, cpmFactor }) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    radiationAPI.getPublicMeasurements().then(d => {
      setMeasurements(d?.measurements || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading…</div>;
  if (measurements.length === 0) return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>No public measurements yet.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {['Date', 'Location', `Avg (${unit})`, `Peak (${unit})`, 'Status', 'Tags'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {measurements.map(m => (
            <tr key={m._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="px-3 py-2.5 text-gray-900 dark:text-white whitespace-nowrap">{fmtDate(m.date)}</td>
              <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{m.locationName || '—'}</td>
              <td className={`px-3 py-2.5 font-mono font-medium whitespace-nowrap ${levelTextColorClass(m.averageLevel)}`}>
                {fromUSvH(m.averageLevel, unit, cpmFactor)?.toFixed(3) ?? '—'}
              </td>
              <td className={`px-3 py-2.5 font-mono text-xs whitespace-nowrap ${m.peakLevel != null ? levelTextColorClass(m.peakLevel) : 'text-gray-400'}`}>
                {m.peakLevel != null ? fromUSvH(m.peakLevel, unit, cpmFactor)?.toFixed(3) : '—'}
              </td>
              <td className="px-3 py-2.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {(m.tags || []).slice(0, 3).map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">{t}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Settings Panel ───────────────────────────────────────────────────────────
const SettingsPanel = ({ radiationSettings, onSave }) => {
  const [form, setForm] = useState({
    preferredUnit: radiationSettings?.preferredUnit || 'µSv/h',
    cpmConversionFactor: radiationSettings?.cpmConversionFactor || 151,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ preferredUnit: form.preferredUnit, cpmConversionFactor: parseFloat(form.cpmConversionFactor) });
      setMsg('Saved!');
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md space-y-4">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Radiation Preferences</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Display Unit</label>
        <select value={form.preferredUnit} onChange={e => setForm(f => ({ ...f, preferredUnit: e.target.value }))}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          {RADIATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Values are always stored as µSv/h internally.</p>
      </div>
      {form.preferredUnit === 'CPM' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPM Conversion Factor (CPM per µSv/h)</label>
          <input type="number" min="1" max="10000" step="any" value={form.cpmConversionFactor}
            onChange={e => setForm(f => ({ ...f, cpmConversionFactor: e.target.value }))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">SBM-20 tube default: 151. J305 tube: ~123.</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
        {msg && <span className="text-sm text-green-600 dark:text-green-400">{msg}</span>}
      </div>
    </form>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'measurements', label: 'Measurements', icon: Activity },
  { id: 'analytics',    label: 'Analytics',    icon: BarChart3 },
  { id: 'locations',    label: 'Locations',    icon: MapPin },
  { id: 'public',       label: 'Public',       icon: Globe },
  { id: 'deleted',      label: 'Trash',        icon: Trash2 },
  { id: 'settings',     label: 'Settings',     icon: Settings },
];

const RadiationPage = () => {
  const { settings, updateRadiationSettings } = useSettings();
  const { registerPageActions, clearPageActions } = usePageActions();
  const [activeTab, setActiveTab] = useState('measurements');
  const [locations, setLocations] = useState([]);

  const radiationSettings = settings?.radiation || { preferredUnit: 'µSv/h', cpmConversionFactor: 151 };
  const unit      = radiationSettings.preferredUnit || 'µSv/h';
  const cpmFactor = radiationSettings.cpmConversionFactor || 151;

  const fetchLocations = useCallback(async () => {
    try {
      const data = await radiationAPI.getLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  useEffect(() => {
    registerPageActions(
      TABS.map(t => ({
        icon: <t.icon size={18} />,
        label: t.label,
        onClick: () => setActiveTab(t.id),
        variant: activeTab === t.id ? 'primary' : 'default',
      }))
    );
    return () => clearPageActions();
  }, [activeTab, registerPageActions, clearPageActions]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Radiation Monitor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Log and analyse radiation measurements · Displaying in <strong>{unit}</strong></p>
        </div>
      </div>

      {/* Mobile tab strip */}
      <div className="flex overflow-x-auto gap-1 mb-6 pb-1 sm:hidden">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === t.id ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="hidden sm:flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === t.id ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'measurements' && (
        <MeasurementsTab locations={locations} unit={unit} cpmFactor={cpmFactor} showDeleted={false} />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab unit={unit} cpmFactor={cpmFactor} />
      )}
      {activeTab === 'locations' && (
        <LocationsTab locations={locations} onRefresh={fetchLocations} />
      )}
      {activeTab === 'public' && (
        <PublicTab unit={unit} cpmFactor={cpmFactor} />
      )}
      {activeTab === 'deleted' && (
        <MeasurementsTab locations={locations} unit={unit} cpmFactor={cpmFactor} showDeleted={true} />
      )}
      {activeTab === 'settings' && (
        <SettingsPanel radiationSettings={radiationSettings} onSave={updateRadiationSettings} />
      )}
    </div>
  );
};

export default RadiationPage;

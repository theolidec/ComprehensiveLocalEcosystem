// All measurements are stored internally in µSv/h.
// This util converts to/from any supported display unit.

export const RADIATION_UNITS = ['µSv/h', 'mSv/h', 'nSv/h', 'µGy/h', 'mGy/h', 'mR/h', 'CPM'];

// Conversion factors from µSv/h to each unit (for non-CPM units).
// CPM is handled separately with a user-defined factor.
const TO_UNIT = {
  'µSv/h':  1,
  'mSv/h':  0.001,
  'nSv/h':  1000,
  'µGy/h':  1,        // ≈ 1:1 for photon radiation (γ, X)
  'mGy/h':  0.001,
  'mR/h':   0.1145,   // 1 µSv/h ≈ 0.1145 mR/h  (1 R ≈ 8.73 mSv)
};

/**
 * Convert a value from µSv/h (storage unit) to the user's preferred display unit.
 * @param {number|null} uSvH  Value in µSv/h
 * @param {string} unit        Target unit
 * @param {number} cpmFactor   CPM per µSv/h (user setting, default 151)
 * @returns {number|null}
 */
export const fromUSvH = (uSvH, unit, cpmFactor = 151) => {
  if (uSvH === null || uSvH === undefined) return null;
  if (unit === 'CPM') return +(uSvH * cpmFactor).toFixed(2);
  const factor = TO_UNIT[unit] ?? 1;
  return +(uSvH * factor).toFixed(4);
};

/**
 * Convert a value from the user's preferred unit back to µSv/h for storage.
 * @param {number|null} value  Value in display unit
 * @param {string} unit        Source unit
 * @param {number} cpmFactor   CPM per µSv/h
 * @returns {number|null}
 */
export const toUSvH = (value, unit, cpmFactor = 151) => {
  if (value === null || value === undefined || value === '') return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  if (unit === 'CPM') return +(v / cpmFactor).toFixed(6);
  const factor = TO_UNIT[unit] ?? 1;
  return +(v / factor).toFixed(6);
};

/**
 * Format a µSv/h value for display, including unit label.
 */
export const formatLevel = (uSvH, unit, cpmFactor = 151, decimals = 3) => {
  if (uSvH === null || uSvH === undefined) return '—';
  const converted = fromUSvH(uSvH, unit, cpmFactor);
  if (converted === null) return '—';
  return `${converted.toFixed(decimals)} ${unit}`;
};

/**
 * Return a background colour class for a µSv/h level (for table rows / heatmap cells).
 * Thresholds based on typical background / elevated / high dose-rate guidelines.
 */
export const levelColorClass = (uSvH) => {
  if (uSvH === null || uSvH === undefined) return 'bg-gray-100 dark:bg-gray-700';
  if (uSvH < 0.3)   return 'bg-green-100 dark:bg-green-900';
  if (uSvH < 1.0)   return 'bg-yellow-100 dark:bg-yellow-900';
  if (uSvH < 10)    return 'bg-orange-100 dark:bg-orange-900';
  return 'bg-red-100 dark:bg-red-900';
};

export const levelTextColorClass = (uSvH) => {
  if (uSvH === null || uSvH === undefined) return 'text-gray-500';
  if (uSvH < 0.3)   return 'text-green-700 dark:text-green-300';
  if (uSvH < 1.0)   return 'text-yellow-700 dark:text-yellow-300';
  if (uSvH < 10)    return 'text-orange-700 dark:text-orange-300';
  return 'text-red-700 dark:text-red-300';
};

export const levelHeatmapClass = (uSvH) => {
  if (uSvH === null || uSvH === undefined) return 'bg-gray-100 dark:bg-gray-700';
  if (uSvH < 0.1)   return 'bg-green-200 dark:bg-green-900';
  if (uSvH < 0.3)   return 'bg-green-400 dark:bg-green-700';
  if (uSvH < 1.0)   return 'bg-yellow-400 dark:bg-yellow-600';
  if (uSvH < 10)    return 'bg-orange-500 dark:bg-orange-500';
  return 'bg-red-600 dark:bg-red-500';
};

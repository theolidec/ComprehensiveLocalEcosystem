/**
 * Display formatters shared across components.
 *
 * Usage:
 *   import { formatTime, formatFileSize } from '../utils/format';
 */

/** Seconds to `m:ss` — used by the audio players. */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Bytes to a binary unit string, e.g. `1.46 MB`.
 * `emptyValue` is returned for a falsy byte count.
 */
export const formatFileSize = (bytes, emptyValue = '0 B') => {
  if (!bytes) return emptyValue;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

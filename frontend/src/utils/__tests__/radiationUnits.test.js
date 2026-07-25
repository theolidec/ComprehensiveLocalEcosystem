import {
  RADIATION_UNITS,
  fromUSvH,
  toUSvH,
  formatLevel,
  levelColorClass,
  levelTextColorClass,
  levelHeatmapClass,
} from '../radiationUnits';

describe('RADIATION_UNITS', () => {
  it('lists every supported display unit', () => {
    expect(RADIATION_UNITS).toEqual(['µSv/h', 'mSv/h', 'nSv/h', 'µGy/h', 'mGy/h', 'mR/h', 'CPM']);
  });
});

describe('fromUSvH', () => {
  it('returns null for null/undefined values', () => {
    expect(fromUSvH(null, 'µSv/h')).toBeNull();
    expect(fromUSvH(undefined, 'µSv/h')).toBeNull();
  });

  it('converts to each SI unit', () => {
    expect(fromUSvH(2.5, 'µSv/h')).toBe(2.5);
    expect(fromUSvH(2.5, 'mSv/h')).toBe(0.0025);
    expect(fromUSvH(2.5, 'nSv/h')).toBe(2500);
    expect(fromUSvH(2.5, 'µGy/h')).toBe(2.5);
    expect(fromUSvH(2.5, 'mGy/h')).toBe(0.0025);
    expect(fromUSvH(2.5, 'mR/h')).toBe(0.2863);
  });

  it('converts to CPM using the configured factor', () => {
    expect(fromUSvH(1, 'CPM')).toBe(151);
    expect(fromUSvH(2, 'CPM', 100)).toBe(200);
  });

  it('treats an unknown unit as µSv/h', () => {
    expect(fromUSvH(3.14159, 'rem/h')).toBe(3.1416);
  });

  it('rounds to 4 decimals (2 for CPM)', () => {
    expect(fromUSvH(0.123456, 'µSv/h')).toBe(0.1235);
    expect(fromUSvH(0.123456, 'CPM', 3)).toBe(0.37);
  });

  it('handles zero and negative values', () => {
    expect(fromUSvH(0, 'CPM')).toBe(0);
    expect(fromUSvH(-1.5, 'nSv/h')).toBe(-1500);
  });
});

describe('toUSvH', () => {
  it('returns null for empty input', () => {
    expect(toUSvH(null, 'µSv/h')).toBeNull();
    expect(toUSvH(undefined, 'µSv/h')).toBeNull();
    expect(toUSvH('', 'µSv/h')).toBeNull();
  });

  it('returns null for values that are not numbers', () => {
    expect(toUSvH('abc', 'µSv/h')).toBeNull();
    expect(toUSvH(NaN, 'µSv/h')).toBeNull();
  });

  it('parses numeric strings', () => {
    expect(toUSvH('0.5', 'µSv/h')).toBe(0.5);
    expect(toUSvH('1500', 'nSv/h')).toBe(1.5);
  });

  it('converts each unit back to µSv/h', () => {
    expect(toUSvH(0.0025, 'mSv/h')).toBe(2.5);
    expect(toUSvH(2500, 'nSv/h')).toBe(2.5);
    expect(toUSvH(0.0025, 'mGy/h')).toBe(2.5);
    expect(toUSvH(0.1145, 'mR/h')).toBe(1);
  });

  it('converts CPM using the configured factor', () => {
    expect(toUSvH(151, 'CPM')).toBe(1);
    expect(toUSvH(200, 'CPM', 100)).toBe(2);
  });

  it('treats an unknown unit as µSv/h', () => {
    expect(toUSvH(7, 'rem/h')).toBe(7);
  });

  it('round-trips a value through the units that keep full precision', () => {
    ['µSv/h', 'nSv/h', 'µGy/h', 'mR/h', 'CPM'].forEach((unit) => {
      expect(toUSvH(fromUSvH(1.25, unit), unit)).toBeCloseTo(1.25, 3);
    });
  });

  it('loses precision round-tripping small values through milli-units', () => {
    // fromUSvH rounds to 4 decimals, so 1.25 µSv/h becomes 0.0013 mSv/h.
    expect(fromUSvH(1.25, 'mSv/h')).toBe(0.0013);
    expect(toUSvH(fromUSvH(1.25, 'mSv/h'), 'mSv/h')).toBe(1.3);
    expect(toUSvH(fromUSvH(1250, 'mSv/h'), 'mSv/h')).toBe(1250);
  });

  it('keeps zero as zero', () => {
    expect(toUSvH(0, 'mSv/h')).toBe(0);
  });
});

describe('formatLevel', () => {
  it('renders an em dash for missing values', () => {
    expect(formatLevel(null, 'µSv/h')).toBe('—');
    expect(formatLevel(undefined, 'µSv/h')).toBe('—');
  });

  it('formats the converted value with its unit', () => {
    expect(formatLevel(0.25, 'µSv/h')).toBe('0.250 µSv/h');
    expect(formatLevel(1, 'CPM')).toBe('151.000 CPM');
    expect(formatLevel(2.5, 'nSv/h')).toBe('2500.000 nSv/h');
  });

  it('honours the decimals argument and a custom CPM factor', () => {
    expect(formatLevel(0.25, 'µSv/h', 151, 1)).toBe('0.3 µSv/h');
    expect(formatLevel(0.25, 'µSv/h', 151, 0)).toBe('0 µSv/h');
    expect(formatLevel(1, 'CPM', 100, 1)).toBe('100.0 CPM');
  });
});

describe('level colour helpers', () => {
  it.each([
    [null, 'bg-gray-100 dark:bg-gray-700'],
    [undefined, 'bg-gray-100 dark:bg-gray-700'],
    [0, 'bg-green-100 dark:bg-green-900'],
    [0.29, 'bg-green-100 dark:bg-green-900'],
    [0.3, 'bg-yellow-100 dark:bg-yellow-900'],
    [0.99, 'bg-yellow-100 dark:bg-yellow-900'],
    [1, 'bg-orange-100 dark:bg-orange-900'],
    [9.99, 'bg-orange-100 dark:bg-orange-900'],
    [10, 'bg-red-100 dark:bg-red-900'],
    [1000, 'bg-red-100 dark:bg-red-900'],
  ])('levelColorClass(%s)', (level, expected) => {
    expect(levelColorClass(level)).toBe(expected);
  });

  it.each([
    [null, 'text-gray-500'],
    [0.1, 'text-green-700 dark:text-green-300'],
    [0.5, 'text-yellow-700 dark:text-yellow-300'],
    [5, 'text-orange-700 dark:text-orange-300'],
    [50, 'text-red-700 dark:text-red-300'],
  ])('levelTextColorClass(%s)', (level, expected) => {
    expect(levelTextColorClass(level)).toBe(expected);
  });

  it.each([
    [null, 'bg-gray-100 dark:bg-gray-700'],
    [0.05, 'bg-green-200 dark:bg-green-900'],
    [0.1, 'bg-green-400 dark:bg-green-700'],
    [0.3, 'bg-yellow-400 dark:bg-yellow-600'],
    [1, 'bg-orange-500 dark:bg-orange-500'],
    [10, 'bg-red-600 dark:bg-red-500'],
  ])('levelHeatmapClass(%s)', (level, expected) => {
    expect(levelHeatmapClass(level)).toBe(expected);
  });
});

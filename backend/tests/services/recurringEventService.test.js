jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}));

const RecurringEventService = require('../../services/recurringEventService');

const makeEvent = (overrides = {}) => ({
  _id: 'evt1',
  title: 'Standup',
  date: new Date('2024-01-01T09:00:00Z'),
  time: '09:00',
  isRecurring: true,
  recurringPattern: 'daily',
  ...overrides
});

const dates = (instances) => instances.map((i) => i.date.toISOString().split('T')[0]);

describe('RecurringEventService.getNextOccurrence', () => {
  it('advances daily and weekly patterns', () => {
    const base = new Date(2024, 0, 1);
    expect(RecurringEventService.getNextOccurrence(base, 'daily')).toEqual(new Date(2024, 0, 2));
    expect(RecurringEventService.getNextOccurrence(base, 'weekly')).toEqual(new Date(2024, 0, 8));
  });

  it('advances monthly and clamps to the last day of shorter months', () => {
    expect(RecurringEventService.getNextOccurrence(new Date(2024, 0, 15), 'monthly'))
      .toEqual(new Date(2024, 1, 15));
    expect(RecurringEventService.getNextOccurrence(new Date(2024, 0, 31), 'monthly'))
      .toEqual(new Date(2024, 1, 29));
    expect(RecurringEventService.getNextOccurrence(new Date(2023, 0, 31), 'monthly'))
      .toEqual(new Date(2023, 1, 28));
  });

  it('advances yearly and clamps Feb 29 on non-leap years', () => {
    expect(RecurringEventService.getNextOccurrence(new Date(2024, 5, 10), 'yearly'))
      .toEqual(new Date(2025, 5, 10));
    expect(RecurringEventService.getNextOccurrence(new Date(2024, 1, 29), 'yearly'))
      .toEqual(new Date(2025, 1, 28));
  });

  it('returns an unchanged copy for an unknown pattern', () => {
    const base = new Date(2024, 0, 1);
    const next = RecurringEventService.getNextOccurrence(base, 'hourly');
    expect(next).toEqual(base);
    expect(next).not.toBe(base);
  });
});

describe('RecurringEventService.isLeapYear', () => {
  it.each([
    [2024, true],
    [2023, false],
    [1900, false],
    [2000, true]
  ])('%i -> %s', (year, expected) => {
    expect(RecurringEventService.isLeapYear(year)).toBe(expected);
  });
});

describe('RecurringEventService.getPatternDescription', () => {
  it('describes the known patterns', () => {
    expect(RecurringEventService.getPatternDescription('daily')).toBe('Every day');
    expect(RecurringEventService.getPatternDescription('weekly')).toBe('Every week');
    expect(RecurringEventService.getPatternDescription('monthly')).toBe('Every month');
    expect(RecurringEventService.getPatternDescription('yearly')).toBe('Every year');
  });

  it('falls back for unknown or missing patterns', () => {
    expect(RecurringEventService.getPatternDescription('hourly')).toBe('Does not repeat');
    expect(RecurringEventService.getPatternDescription(undefined)).toBe('Does not repeat');
  });
});

describe('RecurringEventService.getOccurrenceCount', () => {
  it('counts occurrences strictly before the target date', () => {
    expect(RecurringEventService.getOccurrenceCount(new Date(2024, 0, 1), new Date(2024, 0, 5), 'daily')).toBe(4);
    expect(RecurringEventService.getOccurrenceCount(new Date(2024, 0, 1), new Date(2024, 0, 29), 'weekly')).toBe(4);
  });

  it('returns 0 when the target is not after the start or inputs are missing', () => {
    const day = new Date(2024, 0, 1);
    expect(RecurringEventService.getOccurrenceCount(day, day, 'daily')).toBe(0);
    expect(RecurringEventService.getOccurrenceCount(new Date(2024, 0, 5), day, 'daily')).toBe(0);
    expect(RecurringEventService.getOccurrenceCount(null, day, 'daily')).toBe(0);
    expect(RecurringEventService.getOccurrenceCount(day, null, 'daily')).toBe(0);
  });
});

describe('RecurringEventService.findFirstOccurrenceInRange', () => {
  it('returns the event date when it is already on or after the target', () => {
    const event = makeEvent({ date: new Date(2024, 0, 10) });
    expect(RecurringEventService.findFirstOccurrenceInRange(event, new Date(2024, 0, 1)))
      .toEqual(new Date(2024, 0, 10));
  });

  it('walks the pattern forward to the first occurrence at/after the target', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringPattern: 'weekly' });
    expect(RecurringEventService.findFirstOccurrenceInRange(event, new Date(2024, 0, 10)))
      .toEqual(new Date(2024, 0, 15));
  });
});

describe('RecurringEventService.generateInstances', () => {
  it('returns the event untouched when it is not recurring', () => {
    const event = makeEvent({ isRecurring: false, recurringPattern: null });
    expect(RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2024, 0, 31)))
      .toEqual([event]);
  });

  it('expands a daily event across the range', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1) });
    const instances = RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2024, 0, 5));
    expect(dates(instances)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']);
  });

  it('stops at recurringEndDate when it precedes the range end', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringEndDate: new Date(2024, 0, 3) });
    expect(dates(RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2024, 0, 31))))
      .toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });

  it('respects recurringOccurrences', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringOccurrences: 3 });
    expect(RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2024, 0, 31)))
      .toHaveLength(3);
  });

  it('counts occurrences before the range against recurringOccurrences', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringOccurrences: 5 });
    // Jan 1-9 already used 9 occurrences, so nothing is left for the range.
    expect(RecurringEventService.generateInstances(event, new Date(2024, 0, 10), new Date(2024, 0, 31)))
      .toEqual([]);
  });

  it('starts at the first occurrence inside the range for older events', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringPattern: 'weekly' });
    expect(dates(RecurringEventService.generateInstances(event, new Date(2024, 0, 10), new Date(2024, 1, 1))))
      .toEqual(['2024-01-15', '2024-01-22', '2024-01-29']);
  });

  it('returns nothing when the event starts after the range', () => {
    const event = makeEvent({ date: new Date(2024, 5, 1) });
    expect(RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2024, 0, 31)))
      .toEqual([]);
  });

  it('caps the expansion at 100 instances', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1) });
    expect(RecurringEventService.generateInstances(event, new Date(2024, 0, 1), new Date(2025, 0, 1)))
      .toHaveLength(100);
  });
});

describe('RecurringEventService.createEventInstance', () => {
  it('derives a dated id and marks the instance', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1) });
    const instance = RecurringEventService.createEventInstance(event, new Date('2024-03-04T00:00:00Z'));

    expect(instance._id).toBe('evt1_2024-03-04');
    expect(instance.originalEventId).toBe('evt1');
    expect(instance.isRecurringInstance).toBe(true);
    expect(instance.title).toBe('Standup');
  });

  it('unwraps mongoose documents via toObject', () => {
    const doc = {
      _id: 'evt1',
      recurringPattern: 'daily',
      toObject: () => ({ _id: 'evt1', title: 'From doc' })
    };
    const instance = RecurringEventService.createEventInstance(doc, new Date('2024-03-04T00:00:00Z'));
    expect(instance.title).toBe('From doc');
    expect(instance.toObject).toBeUndefined();
  });
});

describe('RecurringEventService.expandRecurringEvents', () => {
  it('returns an empty array for non-array input', () => {
    expect(RecurringEventService.expandRecurringEvents(null, new Date(), new Date())).toEqual([]);
    expect(RecurringEventService.expandRecurringEvents(undefined, new Date(), new Date())).toEqual([]);
    expect(RecurringEventService.expandRecurringEvents('nope', new Date(), new Date())).toEqual([]);
  });

  it('expands recurring events and keeps single events as-is, sorted by date', () => {
    const single = makeEvent({ _id: 'single', date: new Date(2024, 0, 3), isRecurring: false, recurringPattern: null });
    const recurring = makeEvent({ _id: 'rec', date: new Date(2024, 0, 1) });

    const result = RecurringEventService.expandRecurringEvents([single, recurring], new Date(2024, 0, 1), new Date(2024, 0, 3));
    expect(dates(result)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-03']);
  });

  it('sorts same-day events by time', () => {
    const late = makeEvent({ _id: 'late', date: new Date(2024, 0, 1), time: '18:00', isRecurring: false, recurringPattern: null });
    const early = makeEvent({ _id: 'early', date: new Date(2024, 0, 1), time: '07:00', isRecurring: false, recurringPattern: null });

    const result = RecurringEventService.expandRecurringEvents([late, early], new Date(2024, 0, 1), new Date(2024, 0, 1));
    expect(result.map((e) => e._id)).toEqual(['early', 'late']);
  });
});

describe('RecurringEventService.getNextOccurrenceFromToday', () => {
  const REAL_DATE = Date;

  afterEach(() => {
    global.Date = REAL_DATE;
  });

  const freezeAt = (isoDate) => {
    const frozen = new REAL_DATE(isoDate);
    global.Date = class extends REAL_DATE {
      constructor(...args) {
        super(...(args.length ? args : [frozen]));
      }
    };
  };

  it('returns the event date for a future non-recurring event', () => {
    freezeAt('2024-01-10T12:00:00');
    const event = makeEvent({ date: new Date(2024, 0, 20), isRecurring: false, recurringPattern: null });
    expect(RecurringEventService.getNextOccurrenceFromToday(event)).toEqual(new Date(2024, 0, 20));
  });

  it('returns null for a past non-recurring event', () => {
    freezeAt('2024-01-10T12:00:00');
    const event = makeEvent({ date: new Date(2024, 0, 1), isRecurring: false, recurringPattern: null });
    expect(RecurringEventService.getNextOccurrenceFromToday(event)).toBeNull();
  });

  it('returns the next occurrence for a recurring event', () => {
    freezeAt('2024-01-10T12:00:00');
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringPattern: 'weekly' });
    expect(RecurringEventService.getNextOccurrenceFromToday(event)).toEqual(new Date(2024, 0, 15));
  });
});

describe('RecurringEventService.isRecurringOnDate', () => {
  it('compares calendar days for non-recurring events', () => {
    const event = makeEvent({ date: new Date(2024, 0, 5, 9), isRecurring: false, recurringPattern: null });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 5, 22))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 6))).toBe(false);
  });

  it('is false before the event start date', () => {
    const event = makeEvent({ date: new Date(2024, 0, 5) });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 4))).toBe(false);
  });

  it('matches every day for daily events', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1) });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 3, 17))).toBe(true);
  });

  it('matches the same weekday for weekly events', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringPattern: 'weekly' }); // Monday
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 8))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 9))).toBe(false);
  });

  it('matches the same day-of-month for monthly events', () => {
    const event = makeEvent({ date: new Date(2024, 0, 15), recurringPattern: 'monthly' });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 2, 15))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 2, 16))).toBe(false);
  });

  it('falls back to the last day of shorter months', () => {
    const event = makeEvent({ date: new Date(2024, 0, 31), recurringPattern: 'monthly' });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 1, 29))).toBe(false);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 3, 30))).toBe(false);
  });

  it('matches the same month and day for yearly events', () => {
    const event = makeEvent({ date: new Date(2024, 6, 4), recurringPattern: 'yearly' });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2025, 6, 4))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2025, 6, 5))).toBe(false);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2025, 7, 4))).toBe(false);
  });

  it('maps a Feb 29 yearly event onto Feb 28 in non-leap years', () => {
    const event = makeEvent({ date: new Date(2024, 1, 29), recurringPattern: 'yearly' });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2025, 1, 28))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2028, 1, 29))).toBe(true);
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2028, 1, 28))).toBe(false);
  });

  it('is false for an unknown pattern', () => {
    const event = makeEvent({ date: new Date(2024, 0, 1), recurringPattern: 'hourly' });
    expect(RecurringEventService.isRecurringOnDate(event, new Date(2024, 0, 2))).toBe(false);
  });
});

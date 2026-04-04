const moment = require('moment-timezone');
const logger = require('../config/logger');

/**
 * Service for handling recurring events
 * Generates event instances based on recurring patterns
 */
class RecurringEventService {
  /**
   * Generate recurring event instances for a given date range
   * @param {Object} event - The base recurring event
   * @param {Date} rangeStart - Start of the date range
   * @param {Date} rangeEnd - End of the date range
   * @returns {Array} Array of event instances
   */
  static generateInstances(event, rangeStart, rangeEnd) {
    if (!event.isRecurring || !event.recurringPattern) {
      return [event];
    }

    const instances = [];
    const eventDate = new Date(event.date);
    const startRange = new Date(rangeStart);
    const endRange = new Date(rangeEnd);

    // Maximum number of instances to prevent infinite loops
    const MAX_INSTANCES = 100;

    // Respect recurringEndDate if set
    const eventEndDate = event.recurringEndDate ? new Date(event.recurringEndDate) : null;
    const maxOccurrences = event.recurringOccurrences || MAX_INSTANCES;
    
    // Use the earlier of rangeEnd or recurringEndDate
    const effectiveEndDate = eventEndDate && eventEndDate < endRange ? eventEndDate : endRange;

    let currentDate = new Date(eventDate);
    let instanceCount = 0;

    // If the event start date is after the effective end, skip
    if (currentDate > effectiveEndDate) {
      return [];
    }

    // If event start date is before range start, find first occurrence in range
    if (currentDate < startRange) {
      currentDate = this.findFirstOccurrenceInRange(event, startRange);
    }

    while (currentDate <= effectiveEndDate && instanceCount < maxOccurrences && instanceCount < MAX_INSTANCES) {
      const instance = this.createEventInstance(event, currentDate);
      instances.push(instance);
      instanceCount++;

      currentDate = this.getNextOccurrence(currentDate, event.recurringPattern);
    }

    return instances;
  }

  /**
   * Find the first occurrence of a recurring event within or after a date
   * @param {Object} event - The recurring event
   * @param {Date} targetDate - The target date to find from
   * @returns {Date} The first occurrence date
   */
  static findFirstOccurrenceInRange(event, targetDate) {
    const eventDate = new Date(event.date);
    const pattern = event.recurringPattern;

    if (eventDate >= targetDate) {
      return eventDate;
    }

    let currentDate = new Date(eventDate);

    while (currentDate < targetDate) {
      currentDate = this.getNextOccurrence(currentDate, pattern);
    }

    return currentDate;
  }

  /**
   * Calculate the next occurrence date based on the pattern
   * @param {Date} currentDate - The current occurrence date
   * @param {String} pattern - The recurring pattern (daily, weekly, monthly, yearly)
   * @returns {Date} The next occurrence date
   */
  static getNextOccurrence(currentDate, pattern) {
    const nextDate = new Date(currentDate);

    switch (pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        // Handle month boundary issues (e.g., Jan 31 -> Feb 28/29)
        const dayOfMonth = currentDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        // If the day doesn't exist in the next month, use the last day
        if (nextDate.getDate() !== dayOfMonth) {
          nextDate.setDate(0); // Last day of previous month
        }
        break;
      case 'yearly':
        // Handle leap year for Feb 29
        const month = currentDate.getMonth();
        const day = currentDate.getDate();
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        // If it was Feb 29 and next year is not leap year, use Feb 28
        if (month === 1 && day === 29 && nextDate.getDate() !== 29) {
          nextDate.setDate(28);
        }
        break;
      default:
        break;
    }

    return nextDate;
  }

  /**
   * Create an event instance for a specific date
   * @param {Object} event - The base event
   * @param {Date} instanceDate - The date for this instance
   * @returns {Object} The event instance
   */
  static createEventInstance(event, instanceDate) {
    return {
      ...event.toObject ? event.toObject() : event,
      _id: `${event._id}_${instanceDate.toISOString().split('T')[0]}`,
      originalEventId: event._id.toString(),
      date: instanceDate,
      isRecurringInstance: true,
      recurringPattern: event.recurringPattern
    };
  }

  /**
   * Process multiple events and expand recurring ones
   * @param {Array} events - Array of events
   * @param {Date} rangeStart - Start of date range
   * @param {Date} rangeEnd - End of date range
   * @returns {Array} Array of all event instances (expanded)
   */
  static expandRecurringEvents(events, rangeStart, rangeEnd) {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    const allInstances = [];

    for (const event of events) {
      if (event.isRecurring && event.recurringPattern) {
        const instances = this.generateInstances(event, rangeStart, rangeEnd);
        allInstances.push(...instances);
      } else {
        allInstances.push(event);
      }
    }

    // Sort by date and time
    return allInstances.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      // If same date, sort by time
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });
  }

  /**
   * Get the next occurrence of a recurring event from today
   * @param {Object} event - The recurring event
   * @returns {Date|null} The next occurrence date or null
   */
  static getNextOccurrenceFromToday(event) {
    if (!event.isRecurring || !event.recurringPattern) {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return eventDate >= today ? eventDate : null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.findFirstOccurrenceInRange(event, today);
  }

  /**
   * Check if a date falls on a recurring event occurrence
   * @param {Object} event - The recurring event
   * @param {Date} checkDate - The date to check
   * @returns {Boolean} True if the date is an occurrence
   */
  static isRecurringOnDate(event, checkDate) {
    if (!event.isRecurring || !event.recurringPattern) {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === checkDate.toDateString();
    }

    const eventDate = new Date(event.date);
    const targetDate = new Date(checkDate);
    
    // Reset time components for comparison
    eventDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    // If target is before event start date
    if (targetDate < eventDate) {
      return false;
    }

    // Check if target date matches the pattern
    switch (event.recurringPattern) {
      case 'daily':
        return true; // Every day
      case 'weekly':
        return targetDate.getDay() === eventDate.getDay();
      case 'monthly':
        return targetDate.getDate() === eventDate.getDate() ||
               // Handle month-end cases
               (targetDate.getDate() > eventDate.getDate() && 
                targetDate.getDate() === new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate());
      case 'yearly':
        return targetDate.getMonth() === eventDate.getMonth() &&
               (targetDate.getDate() === eventDate.getDate() ||
                // Handle Feb 29 on non-leap years
                (eventDate.getMonth() === 1 && eventDate.getDate() === 29 &&
                 targetDate.getDate() === 28 && !this.isLeapYear(targetDate.getFullYear())));
      default:
        return false;
    }
  }

  /**
   * Check if a year is a leap year
   * @param {Number} year - The year to check
   * @returns {Boolean} True if leap year
   */
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Get human-readable description of recurring pattern
   * @param {String} pattern - The recurring pattern
   * @returns {String} Human-readable description
   */
  static getPatternDescription(pattern) {
    const descriptions = {
      daily: 'Every day',
      weekly: 'Every week',
      monthly: 'Every month',
      yearly: 'Every year'
    };
    return descriptions[pattern] || 'Does not repeat';
  }
}

module.exports = RecurringEventService;

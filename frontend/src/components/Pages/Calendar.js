import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, MapPin, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, ChevronDown, Repeat, Upload } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import calendarAPI from '../../services/calendarAPI';
import categoryAPI from '../../services/categoryAPI';
import CategoryManager from './CategoryManager';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCalendarActions } from '../../contexts/CalendarActionsContext';
import { usePageActions } from '../../contexts/PageActionsContext';

const getEventId = (event) => event._id || event.id;

const CalendarApp = () => {
  const { isAuthenticated } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { registerActions, clearActions, setIsCalendarPage } = useCalendarActions();
  const { registerPageActions, clearPageActions } = usePageActions();
  const { view: urlView } = useParams();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [viewMode, setViewMode] = useState(urlView || 'month');
  const [weekStartsOn, setWeekStartsOn] = useState(() => {
    const saved = localStorage.getItem('weekStartsOn');
    return saved ? parseInt(saved) : 0;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categorySortOrder, setCategorySortOrder] = useState(() => {
    return localStorage.getItem('categorySortOrder') || 'name-asc';
  });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAllHours, setShowAllHours] = useState(() => {
    const saved = localStorage.getItem('showAllHours');
    return saved === 'true';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update view mode and week start day when settings load
  useEffect(() => {
    if (!settingsLoading && settings?.calendar) {
      if (settings.calendar.defaultView && !urlView) {
        setViewMode(settings.calendar.defaultView);
      }
      const savedWeekStart = settings.calendar.weekStartsOn;
      if (typeof savedWeekStart === 'number') {
        setWeekStartsOn(savedWeekStart);
        localStorage.setItem('weekStartsOn', savedWeekStart.toString());
      }
    }
  }, [settingsLoading, settings, urlView]);

  // Get week start from state (updated when settings load)
  const showWeekNumbers = settings?.calendar?.showWeekNumbers ?? false;
  const defaultEventDuration = settings?.calendar?.defaultEventDuration ?? 60;
  const workingHours = settings?.calendar?.workingHours || { start: '09:00', end: '17:00' };
  
  const workingStartHour = parseInt(workingHours.start.split(':')[0]);
  const workingEndHour = parseInt(workingHours.end.split(':')[0]);

  // Sync view mode with URL
  useEffect(() => {
    if (urlView && ['month', 'week', 'day'].includes(urlView)) {
      setViewMode(urlView);
      if (urlView === 'day' && !selectedDate) {
        setSelectedDate(new Date());
      }
    }
  }, [urlView, selectedDate]);

  // Save category sort order to localStorage
  useEffect(() => {
    localStorage.setItem('categorySortOrder', categorySortOrder);
  }, [categorySortOrder]);

  // Save showAllHours to localStorage
  useEffect(() => {
    localStorage.setItem('showAllHours', showAllHours.toString());
  }, [showAllHours]);

  // Update URL when view mode changes
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    navigate(`/calendar/${newViewMode}`);
  };

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
      const fetchedEvents = await calendarAPI.getEvents({
        startDate,
        endDate,
        category: selectedCategory,
        search: searchTerm
      });
      setEvents(fetchedEvents || []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedCategory, searchTerm, isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get reordered week days based on settings
  const getWeekDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const reordered = [];
    for (let i = 0; i < 7; i++) {
      reordered.push(days[(weekStartsOn + i) % 7]);
    }
    return reordered;
  };
  
  const orderedWeekDays = getWeekDays();

  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Categories', color: '#6B7280', icon: '📅' }
  ]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const fetchedCategories = await categoryAPI.getCategories();
      const allCategory = { id: 'all', name: 'All Categories', color: '#6B7280', icon: '📅' };
      const formattedCategories = fetchedCategories.map(cat => ({
        id: cat.name.toLowerCase(),
        name: cat.name,
        color: cat.color,
        icon: cat.icon
      }));
      const finalCategories = [allCategory, ...formattedCategories];
      setCategories(finalCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest('.sort-dropdown')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown]);

  // Sort categories based on selected sort order
  const sortCategories = (categoriesToSort) => {
    const filteredCategories = categoriesToSort.filter(cat => cat.id !== 'all');
    
    switch (categorySortOrder) {
      case 'name-asc':
        return filteredCategories.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return filteredCategories.sort((a, b) => b.name.localeCompare(a.name));
      case 'count-asc':
        return filteredCategories.sort((a, b) => (stats.categoryCount[a.id] || 0) - (stats.categoryCount[b.id] || 0));
      case 'count-desc':
        return filteredCategories.sort((a, b) => (stats.categoryCount[b.id] || 0) - (stats.categoryCount[a.id] || 0));
      default:
        return filteredCategories;
    }
  };

  // Custom dropdown helpers
  const getSortLabel = () => {
    switch (categorySortOrder) {
      case 'name-asc': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'count-desc': return 'Most Used';
      case 'count-asc': return 'Least Used';
      default: return 'Name (A-Z)';
    }
  };

  const handleSortSelect = (value) => {
    setCategorySortOrder(value);
    setShowSortDropdown(false);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    // Adjust for weekStartsOn setting
    const adjustedFirstDay = (firstDay - weekStartsOn + 7) % 7;
    const days = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setShowEventForm(true);
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString() &&
          (selectedCategory === 'all' || event.category === selectedCategory) &&
          (searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase()));
      })
      .sort((a, b) => {
        // Sort by time (earliest first), all-day events last
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1; // a is all-day, put it after b
        if (!b.time) return -1; // b is all-day, put it after a
        
        // Both have times, compare them
        return a.time.localeCompare(b.time);
      });
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const handleAddEvent = async (eventData) => {
    try {
      const categoryData = categories.find(cat => cat.id === eventData.category);
      const newEvent = await calendarAPI.createEvent({
        title: eventData.title,
        description: eventData.description,
        time: eventData.time,
        location: eventData.location,
        category: eventData.category,
        date: selectedDate.toISOString(),
        attendees: eventData.attendees,
        reminder: eventData.reminder,
        color: categoryData?.color || '#3B82F6',
        isRecurring: eventData.isRecurring || false,
        recurringPattern: eventData.recurringPattern || 'daily',
        recurringEndDate: eventData.recurringEndDate,
        recurringOccurrences: eventData.recurringOccurrences
      });
      await fetchEvents();
      setShowEventForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, updatedData) => {
    try {
      const categoryData = categories.find(cat => cat.id === updatedData.category);
      await calendarAPI.updateEvent(eventId, {
        ...updatedData,
        color: categoryData?.color
      });
      await fetchEvents();
      setEditingEvent(null);
      setShowEventForm(false);
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarAPI.deleteEvent(eventId);
        await fetchEvents();
        setShowEventDetails(null);
      } catch (err) {
        alert(err.message || 'Failed to delete event');
      }
    }
  };

  const createDummyEvents = useCallback(async () => {
    try {
      // Ensure "Testing" category exists
      const testingCategory = categories.find(cat => cat.name === 'Testing');
      if (!testingCategory) {
        await categoryAPI.createCategory({
          name: 'Testing',
          color: '#EF4444',
          icon: '🧪'
        });
        await fetchCategories();
      }

      const dummyEvents = [];
      const today = new Date();
      
      for (let i = 0; i < 10; i++) {
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 15); // Random date within ±15 days
        
        const hours = Math.floor(Math.random() * 14) + 8; // 8 AM to 10 PM
        const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45 minutes
        
        const dummyEvent = {
          title: `Test Event ${i + 1}`,
          description: `This is a dummy test event for testing purposes ${i + 1}`,
          time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          location: `Test Location ${i + 1}`,
          category: 'testing',
          date: eventDate.toISOString(),
          attendees: [`test${i + 1}@example.com`],
          reminder: '15',
          color: '#EF4444'
        };
        
        dummyEvents.push(dummyEvent);
      }

      // Create all events
      await Promise.all(
        dummyEvents.map(event => calendarAPI.createEvent(event))
      );

      await fetchEvents();
      alert('10 dummy events created successfully under "Testing" category!');
    } catch (err) {
      alert(err.message || 'Failed to create dummy events');
    }
  }, [categories, fetchCategories, fetchEvents]);

  const removeDummyEvents = useCallback(async () => {
    try {
      const testingEvents = events.filter(event => event.category === 'testing');
      
      if (testingEvents.length === 0) {
        alert('No dummy events found in "Testing" category');
        return;
      }

      if (window.confirm(`Are you sure you want to delete ${testingEvents.length} dummy events from the "Testing" category?`)) {
        await Promise.all(
          testingEvents.map(event => calendarAPI.deleteEvent(getEventId(event)))
        );
        
        setEvents(prev => prev.filter(event => event.category !== 'testing'));
        alert(`${testingEvents.length} dummy events removed successfully!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove dummy events');
    }
  }, [events]);

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.date));
    setShowEventForm(true);
    setShowEventDetails(null);
  };

  const exportCalendar = useCallback(async () => {
    try {
      await calendarAPI.exportEvents();
    } catch (err) {
      alert(err.message || 'Failed to export events');
    }
  }, []);

  const importCalendar = useCallback(async (file) => {
    try {
      const result = await calendarAPI.importEvents(file);
      alert(result.message);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Failed to import events');
    }
  }, [fetchEvents]);

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      importCalendar(file);
      e.target.value = '';
    }
  }, [importCalendar]);

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  };

  const getEventStats = () => {
    const totalEvents = events.length;
    const thisMonth = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    }).length;
    
    const categoryCount = {};
    categories.slice(1).forEach(cat => {
      categoryCount[cat.id] = events.filter(event => event.category === cat.id).length;
    });

    return { totalEvents, thisMonth, categoryCount };
  };

  const stats = getEventStats();

  // Register calendar actions with context for Header to use
  useEffect(() => {
    setIsCalendarPage(true);
    registerActions({
      onImport: handleImportFile,
      onExport: exportCalendar,
      onCreateTestEvents: createDummyEvents,
      onRemoveTestEvents: removeDummyEvents,
      onAddEvent: () => {
        if (!selectedDate) {
          setSelectedDate(new Date());
        }
        setShowEventForm(true);
      }
    });

    registerPageActions([
      {
        icon: <Plus size={18} />,
        label: 'Add Event',
        onClick: () => {
          if (!selectedDate) {
            setSelectedDate(new Date());
          }
          setShowEventForm(true);
        },
        variant: 'primary'
      },
      {
        icon: <Upload size={18} />,
        label: 'Import',
        onClick: handleImportFile,
        closeOnClick: false
      },
      {
        icon: <Download size={18} />,
        label: 'Export',
        onClick: exportCalendar,
        closeOnClick: false
      }
    ]);

    return () => {
      setIsCalendarPage(false);
      clearActions();
      clearPageActions();
    };
  }, [registerActions, clearActions, setIsCalendarPage, registerPageActions, clearPageActions, selectedDate]);

  // Week view generation
  const generateWeekDays = () => {
    const effectiveWeekStart = settings?.calendar?.weekStartsOn ?? weekStartsOn;
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    // Adjust for weekStartsOn setting
    const diff = startOfWeek.getDate() - day + effectiveWeekStart;
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(weekDay);
    }
    return weekDays;
  };

  // Week navigation
  const navigateWeek = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  // Format week range for display
  const getWeekRangeText = () => {
    const weekDays = generateWeekDays();
    const startOfWeek = weekDays[0];
    const endOfWeek = weekDays[6];
    
    const startFormat = startOfWeek.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endFormat = endOfWeek.toLocaleDateString('en-US', { 
      month: startOfWeek.getMonth() === endOfWeek.getMonth() ? 'short' : 'short',
      day: 'numeric',
      year: endOfWeek.getFullYear() !== startOfWeek.getFullYear() ? 'numeric' : undefined
    }).replace(/,\s*$/, '');
    
    return `${startFormat} - ${endFormat}`;
  };

  // Unified navigation handler
  const handleNavigation = (direction) => {
    if (viewMode === 'week') {
      navigateWeek(direction);
    } else {
      navigateMonth(direction);
    }
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get header text based on view mode
  const getHeaderText = () => {
    if (viewMode === 'week') {
      return getWeekRangeText();
    } else {
      const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      if (showWeekNumbers) {
        const weekNumber = getWeekNumber(currentDate);
        return `Week ${weekNumber} - ${monthYear}`;
      }
      return monthYear;
    }
  };

  // Calculate week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Day view hours - use working hours or all 24 hours based on toggle
  const generateDayHours = () => {
    const hours = [];
    if (showAllHours) {
      for (let i = 0; i < 24; i++) {
        hours.push(i);
      }
    } else {
      for (let i = workingStartHour; i <= workingEndHour; i++) {
        hours.push(i);
      }
    }
    return hours;
  };

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden ${showWeekNumbers ? 'grid grid-cols-[2rem_repeat(7,minmax(0,1fr))]' : 'grid grid-cols-7'}`}>
        {showWeekNumbers && (
          <div className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
            
          </div>
        )}
        {orderedWeekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
            {day}
          </div>
        ))}
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {showWeekNumbers && (
              <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 border-r border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {getWeekNumberForWeek(week, weekIndex) -1}
              </div>
            )}
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentDay = isToday(day);
              const globalIndex = weekIndex * 7 + dayIndex;
              
              return (
                <div
                  key={dayIndex}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[120px] p-2 border-r border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${day ? '' : 'bg-gray-50 dark:bg-gray-800 cursor-default'} ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={getEventId(event)}
                            className="text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 flex items-center"
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEventDetails(event);
                            }}
                          >
                            {event.time && <span className="font-medium">{event.time} </span>}
                            <span className="flex-1 truncate">{event.title}</span>
                            {event.isRecurring && (
                              <Repeat className="w-3 h-3 ml-1 opacity-80 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Get week number for a specific week
  const getWeekNumberForWeek = (week, weekIndex) => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(firstSunday.getDate() - firstDayOfMonth.getDay() + weekStartsOn);
    
    const targetWeek = new Date(firstSunday);
    targetWeek.setDate(targetWeek.getDate() + weekIndex * 7);
    return getWeekNumber(targetWeek);
  };

  const renderWeekView = () => {
    const weekDays = generateWeekDays();
    
    // Get all-day events for the week
    const getAllDayEvents = (date) => {
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString() && !event.time;
      });
    };
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="p-3 flex justify-end">
          <button
            onClick={() => setShowAllHours(!showAllHours)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showAllHours ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showAllHours ? 'All Hours' : 'Working Hours'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="w-full">
            {/* Week header */}
            <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <div className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                Time
              </div>
              {weekDays.map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                return (
                  <div 
                    key={index} 
                    className={`p-3 text-center border-r dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                  >
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {dayName}
                    </div>
                    <div className={`text-lg font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* All-day events section */}
            <div className="grid grid-cols-8 border-b dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900">
              <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                All-day
              </div>
              {weekDays.map((date, index) => {
                const allDayEvents = getAllDayEvents(date);
                return (
                  <div key={index} className="p-2 border-r dark:border-gray-700 min-h-[40px]">
                    {allDayEvents.map(event => (
                      <div
                        key={getEventId(event)}
                        className="text-xs p-1 rounded mb-1 text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity"
                        style={{ backgroundColor: event.color }}
                        onClick={() => setShowEventDetails(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            {/* Time slots */}
            {generateDayHours().map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="p-3 text-sm text-gray-600 dark:text-gray-400 border-r dark:border-gray-700 font-medium border-l dark:border-gray-700">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((date, index) => {
                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.date);
                    const eventHour = parseInt(event.time?.split(':')[0] || 0);
                    return eventDate.toDateString() === date.toDateString() && 
                           eventHour === hour && 
                           event.time; // Exclude all-day events
                  });
                  
                  return (
                    <div 
                      key={index} 
                      className="p-2 border-r dark:border-gray-700 min-h-[60px] relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        const clickedDate = new Date(date);
                        clickedDate.setHours(hour, 0, 0, 0);
                        setSelectedDate(clickedDate);
                        setShowEventForm(true);
                      }}
                    >
                      {dayEvents.map(event => (
                        <div
                          key={getEventId(event)}
                          className="text-xs p-2 rounded mb-1 text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity"
                          style={{ backgroundColor: event.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEventDetails(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-90">{event.time}</div>
                          {event.location && (
                            <div className="text-xs opacity-90 truncate">{event.location}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === selectedDate?.toDateString();
    });

    // Navigate to previous/next day
    const navigateDay = (direction) => {
      if (!selectedDate) {
        setSelectedDate(new Date());
        return;
      }
      
      const newDate = new Date(selectedDate);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setSelectedDate(newDate);
    };

    return (
      <div className="w-full">
        {/* Quick date selection */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {/*<button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setCurrentDate(today);
              }}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Today
            </button> */}
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow);
                setCurrentDate(tomorrow);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                setSelectedDate(nextWeek);
                setCurrentDate(nextWeek);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Next Week
            </button>
            <div className="flex-grow"></div>
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showAllHours ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {showAllHours ? 'All Hours' : 'Working Hours'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            {generateDayHours().map(hour => {
              const hourEvents = dayEvents.filter(event => {
                const eventHour = parseInt(event.time?.split(':')[0] || 0);
                return eventHour === hour;
              });

              return (
                <div key={hour} className="flex border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="w-20 p-3 text-sm text-gray-600 dark:text-gray-400 border-r dark:border-gray-700 font-medium">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 p-3 min-h-[60px] cursor-pointer relative" onClick={() => {
                    if (!selectedDate) setSelectedDate(new Date());
                    const clickedDate = new Date(selectedDate);
                    clickedDate.setHours(hour, 0, 0, 0);
                    setSelectedDate(clickedDate);
                    setShowEventForm(true);
                  }}>
                    {hourEvents.length === 0 && (
                      <div className="text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600 dark:hover:text-gray-300 h-full flex items-center">
                        Click to add event
                      </div>
                    )}
                    {hourEvents.map(event => (
                      <div
                        key={getEventId(event)}
                        className="mb-2 p-3 rounded-lg text-white cursor-pointer hover:opacity-90 shadow-sm transition-all hover:shadow-md"
                        style={{ backgroundColor: event.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEventDetails(event);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1 flex items-center">
                              {event.title}
                              {event.isRecurring && (
                                <Repeat className="w-3 h-3 ml-1 opacity-80" />
                              )}
                            </div>
                            {event.location && (
                              <div className="text-xs opacity-90 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="text-xs opacity-90 flex items-center mt-1">
                                <Users className="w-3 h-3 mr-1" />
                                {event.attendees.length} attendees
                              </div>
                            )}
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-sm font-medium">
                              {event.time}
                            </div>
                            {event.reminder && event.reminder > 0 && (
                              <div className="text-xs opacity-75">
                                {event.reminder === 5 ? '5m' : 
                                 event.reminder === 15 ? '15m' : 
                                 event.reminder === 30 ? '30m' : 
                                 event.reminder === 60 ? '1h' : 
                                 event.reminder === 1440 ? '1d' : ''} before
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <div className="text-blue-100">Total Events</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <div className="text-green-100">This Month</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-2xl font-bold">{getUpcomingEvents().length}</div>
              <div className="text-purple-100">Upcoming</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Calendar Navigation */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleNavigation('prev')}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-semibold">
                      {getHeaderText()}
                    </h2>
                    <button
                      onClick={() => handleNavigation('next')}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goToToday}
                      className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      Today
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {viewMode === 'day' && (
                      <>
                        <button
                          onClick={() => {
                            if (!selectedDate) {
                              setSelectedDate(new Date());
                              return;
                            }
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setSelectedDate(newDate);
                            setCurrentDate(newDate);
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <input
                          type="date"
                          value={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            setSelectedDate(newDate);
                            setCurrentDate(newDate);
                          }}
                          className="px-3 py-2 rounded-lg text-gray-900 bg-white/90 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <button
                          onClick={() => {
                            if (!selectedDate) {
                              setSelectedDate(new Date());
                              return;
                            }
                            const newDate = new Date(selectedDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setSelectedDate(newDate);
                            setCurrentDate(newDate);
                          }}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {['month', 'week', 'day'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleViewModeChange(mode)}
                        className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                          viewMode === mode ? 'bg-white text-blue-600' : 'hover:bg-white/20'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              <div className="p-4">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Category Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Manage
                </button>
              </div>
              
              {/* Sorting Controls */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
                <div className="relative sort-dropdown">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>{getSortLabel()}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleSortSelect('name-asc')}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            categorySortOrder === 'name-asc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Name (A-Z)
                        </button>
                        <button
                          onClick={() => handleSortSelect('name-desc')}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            categorySortOrder === 'name-desc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Name (Z-A)
                        </button>
                        <button
                          onClick={() => handleSortSelect('count-desc')}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            categorySortOrder === 'count-desc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Most Used
                        </button>
                        <button
                          onClick={() => handleSortSelect('count-asc')}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            categorySortOrder === 'count-asc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Least Used
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {sortCategories(categories).map(category => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category.icon} {category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stats.categoryCount[category.id] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Upcoming Events</h3>
              <div className="space-y-3">
                {getUpcomingEvents().length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No upcoming events</p>
                ) : (
                  getUpcomingEvents().map(event => (
                    <div
                      key={getEventId(event)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => setShowEventDetails(event)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                        ></div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center">
                          {event.title}
                          {event.isRecurring && (
                            <Repeat className="w-3 h-3 ml-1 text-gray-400 dark:text-gray-500" />
                          )}
                        </h4>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString()}
                        {event.time && ` • ${event.time}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          selectedDate={selectedDate}
          categories={categories}
          editingEvent={editingEvent}
          defaultDuration={defaultEventDuration}
          onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetails && (
        <EventDetails
          event={showEventDetails}
          categories={categories}
          onEdit={() => handleEditEvent(showEventDetails)}
          onDelete={() => handleDeleteEvent(getEventId(showEventDetails))}
          onClose={() => setShowEventDetails(null)}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Categories</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <CategoryManager onCategoryChange={fetchCategories} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventForm = ({ selectedDate, categories, editingEvent, defaultDuration, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    time: editingEvent?.time || '',
    location: editingEvent?.location || '',
    category: editingEvent?.category || 'work',
    attendees: editingEvent?.attendees?.join(', ') || '',
    reminder: editingEvent?.reminder || String(defaultDuration || 15),
    isRecurring: editingEvent?.isRecurring || false,
    recurringPattern: editingEvent?.recurringPattern || 'daily',
    recurringEndDate: editingEvent?.recurringEndDate ? new Date(editingEvent.recurringEndDate).toISOString().split('T')[0] : '',
    recurringOccurrences: editingEvent?.recurringOccurrences || '',
    timezone: editingEvent?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    isAllDay: editingEvent?.isAllDay || false,
    duration: editingEvent?.duration || ''
  });

  const commonTimezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
    'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      attendees: formData.attendees ? formData.attendees.split(',').map(email => email.trim()).filter(email => email) : [],
      recurringEndDate: formData.recurringEndDate || null,
      recurringOccurrences: formData.recurringOccurrences ? parseInt(formData.recurringOccurrences) : null,
      duration: formData.duration ? parseInt(formData.duration) : null
    };
    
    if (editingEvent) {
      onSubmit(getEventId(editingEvent), eventData);
    } else {
      onSubmit(eventData);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {editingEvent ? 'Edit Event' : 'Add Event'} for {selectedDate?.toLocaleDateString()}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.slice(1).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event description"
            />
          </div>

          {/* All-day toggle and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="isAllDay"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked, time: e.target.checked ? '' : prev.time }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                All-day event
              </label>
            </div>

            {!formData.isAllDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Default (60 min)</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
                <option value="480">8 hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {commonTimezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attendees (comma separated emails)
            </label>
            <input
              type="text"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reminder
            </label>
            <select
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0">No reminder</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          {/* Recurring Event Options */}
          <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Repeat this event
              </label>
            </div>

            {formData.isRecurring && (
              <div className="ml-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repeat pattern
                  </label>
                  <select
                    name="recurringPattern"
                    value={formData.recurringPattern}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Every day</option>
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                    <option value="yearly">Every year</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.recurringPattern === 'daily' && 'Event will repeat every day from the start date'}
                    {formData.recurringPattern === 'weekly' && 'Event will repeat on the same day every week'}
                    {formData.recurringPattern === 'monthly' && 'Event will repeat on the same date every month'}
                    {formData.recurringPattern === 'yearly' && 'Event will repeat on the same date every year'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End date (optional)
                    </label>
                    <input
                      type="date"
                      name="recurringEndDate"
                      value={formData.recurringEndDate}
                      onChange={handleChange}
                      min={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to repeat forever</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Or number of occurrences
                    </label>
                    <input
                      type="number"
                      name="recurringOccurrences"
                      value={formData.recurringOccurrences}
                      onChange={handleChange}
                      min="1"
                      max="365"
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1-365 occurrences</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingEvent ? 'Update Event' : 'Add Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetails = ({ event, categories, onEdit, onDelete, onClose }) => {
  const category = categories.find(cat => cat.id === event.category) || { icon: '📅', name: 'Other' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: event.color }}
            ></div>
            <span className="text-2xl">{category.icon}</span>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{event.title}</h4>
          </div>

          {event.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h5>
              <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            
            {event.time && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{event.time}</span>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}

            {event.isRecurring && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <Repeat className="h-4 w-4" />
                <span className="capitalize">
                  {event.recurringPattern === 'daily' && 'Repeats daily'}
                  {event.recurringPattern === 'weekly' && 'Repeats weekly'}
                  {event.recurringPattern === 'monthly' && 'Repeats monthly'}
                  {event.recurringPattern === 'yearly' && 'Repeats yearly'}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarApp;

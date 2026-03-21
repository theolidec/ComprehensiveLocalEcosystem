import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, MapPin, Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, ChevronDown } from 'lucide-react';
import calendarAPI from '../services/calendarAPI';
import { useAuth } from '../contexts/AuthContext';

const getEventId = (event) => event._id || event.id;

const CalendarApp = () => {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [viewMode, setViewMode] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const categories = [
    { id: 'all', name: 'All Categories', color: '#6B7280', icon: '📅' },
    { id: 'work', name: 'Work', color: '#3B82F6', icon: '💼' },
    { id: 'personal', name: 'Personal', color: '#10B981', icon: '👤' },
    { id: 'social', name: 'Social', color: '#F59E0B', icon: '🎉' },
    { id: 'health', name: 'Health', color: '#EF4444', icon: '🏥' },
    { id: 'education', name: 'Education', color: '#8B5CF6', icon: '📚' },
    { id: 'travel', name: 'Travel', color: '#06B6D4', icon: '✈️' }
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
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
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString() &&
        (selectedCategory === 'all' || event.category === selectedCategory) &&
        (searchTerm === '' || event.title.toLowerCase().includes(searchTerm.toLowerCase()));
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
        color: categoryData?.color || '#3B82F6'
      });
      setEvents(prev => [...prev, newEvent]);
      setShowEventForm(false);
    } catch (err) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, updatedData) => {
    try {
      const categoryData = categories.find(cat => cat.id === updatedData.category);
      const updatedEvent = await calendarAPI.updateEvent(eventId, {
        ...updatedData,
        color: categoryData?.color
      });
      setEvents(prev => prev.map(event => 
        event._id === eventId || event.id === eventId 
          ? { ...event, ...updatedEvent }
          : event
      ));
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
        setEvents(prev => prev.filter(event => event._id !== eventId && event.id !== eventId));
        setShowEventDetails(null);
      } catch (err) {
        alert(err.message || 'Failed to delete event');
      }
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setSelectedDate(new Date(event.date));
    setShowEventForm(true);
    setShowEventDetails(null);
  };

  const exportCalendar = async () => {
    try {
      await calendarAPI.exportEvents();
    } catch (err) {
      alert(err.message || 'Failed to export events');
    }
  };

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

  // Week view generation
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      weekDays.push(weekDay);
    }
    return weekDays;
  };

  // Day view hours
  const generateDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 bg-gray-50 rounded-lg overflow-hidden">
      {weekDays.map(day => (
        <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r">
          {day}
        </div>
      ))}
      {generateCalendarDays().map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentDay = isToday(day);
        
        return (
          <div
            key={index}
            onClick={() => handleDateClick(day)}
            className={`min-h-[100px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors ${
              day ? '' : 'bg-gray-50 cursor-default'
            } ${isCurrentDay ? 'bg-blue-50' : ''}`}
          >
            {day && (
              <>
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={getEventId(event)}
                      className="text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEventDetails(event);
                      }}
                    >
                      {event.time && <span className="font-medium">{event.time} </span>}
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => {
    const weekDays = generateWeekDays();
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 bg-gray-50 rounded-lg overflow-hidden">
            <div className="p-3 text-center text-sm font-semibold text-gray-700 border-r">Time</div>
            {weekDays.map((date, index) => (
              <div key={index} className="p-3 text-center text-sm font-semibold text-gray-700 border-r">
                <div>{weekDays[index]}</div>
                <div className="text-xs text-gray-500">{date.getDate()}</div>
              </div>
            ))}
          </div>
          
          {generateDayHours().map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 text-sm text-gray-600 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((date, index) => {
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.date);
                  const eventHour = parseInt(event.time?.split(':')[0] || 0);
                  return eventDate.toDateString() === date.toDateString() && eventHour === hour;
                });
                
                return (
                  <div key={index} className="p-2 border-r min-h-[60px] hover:bg-gray-50 cursor-pointer">
                    {dayEvents.map(event => (
                      <div
                        key={getEventId(event)}
                        className="text-xs p-1 rounded truncate text-white mb-1 cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: event.color }}
                        onClick={() => setShowEventDetails(event)}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === selectedDate?.toDateString();
    });

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <h3 className="text-lg font-semibold">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          
          <div className="p-4">
            {generateDayHours().map(hour => {
              const hourEvents = dayEvents.filter(event => {
                const eventHour = parseInt(event.time?.split(':')[0] || 0);
                return eventHour === hour;
              });

              return (
                <div key={hour} className="flex border-b">
                  <div className="w-20 p-3 text-sm text-gray-600 border-r">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 p-3 min-h-[60px]">
                    {hourEvents.map(event => (
                      <div
                        key={getEventId(event)}
                        className="inline-block p-2 rounded text-white text-sm mr-2 mb-2 cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: event.color }}
                        onClick={() => setShowEventDetails(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        {event.location && (
                          <div className="text-xs opacity-90">{event.location}</div>
                        )}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center space-x-3 mb-4 lg:mb-0">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportCalendar}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedDate) {
                    setSelectedDate(new Date());
                  }
                  setShowEventForm(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Calendar Navigation */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-semibold">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {['month', 'week', 'day'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
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
          <div className="space-y-6">
            {/* Category Legend */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.slice(1).map(category => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{category.icon} {category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{stats.categoryCount[category.id] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Upcoming Events</h3>
              <div className="space-y-3">
                {getUpcomingEvents().length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No upcoming events</p>
                ) : (
                  getUpcomingEvents().map(event => (
                    <div
                      key={getEventId(event)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setShowEventDetails(event)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                        ></div>
                        <h4 className="font-medium text-sm text-gray-900 truncate">{event.title}</h4>
                      </div>
                      <div className="text-xs text-gray-500">
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
          onEdit={() => handleEditEvent(showEventDetails)}
          onDelete={() => handleDeleteEvent(getEventId(showEventDetails))}
          onClose={() => setShowEventDetails(null)}
        />
      )}
    </div>
  );
};

const EventForm = ({ selectedDate, categories, editingEvent, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    time: editingEvent?.time || '',
    location: editingEvent?.location || '',
    category: editingEvent?.category || 'work',
    attendees: editingEvent?.attendees?.join(', ') || '',
    reminder: editingEvent?.reminder || '15'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      attendees: formData.attendees ? formData.attendees.split(',').map(email => email.trim()).filter(email => email) : []
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
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {editingEvent ? 'Edit Event' : 'Add Event'} for {selectedDate?.toLocaleDateString()}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees (comma separated emails)
            </label>
            <input
              type="text"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder
            </label>
            <select
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="0">No reminder</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
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
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventDetails = ({ event, onEdit, onDelete, onClose }) => {
  const categoryData = {
    work: { icon: '💼', name: 'Work' },
    personal: { icon: '👤', name: 'Personal' },
    social: { icon: '🎉', name: 'Social' },
    health: { icon: '🏥', name: 'Health' },
    education: { icon: '📚', name: 'Education' },
    travel: { icon: '✈️', name: 'Travel' }
  };

  const category = categoryData[event.category] || { icon: '📅', name: 'Other' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Event Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
            <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
          </div>

          {event.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            
            {event.time && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{event.time}</span>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
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

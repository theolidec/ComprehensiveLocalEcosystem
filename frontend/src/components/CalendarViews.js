import React from 'react';
import { Repeat, MapPin, Users } from 'lucide-react';

const getEventId = (event) => event._id || event.id;

const CalendarViews = ({
  viewMode,
  currentDate,
  events,
  selectedCategory,
  searchTerm,
  selectedDate: selectedDateProp,
  onDateClick,
  onEventClick,
  onSlotClick
}) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        // All-day events come first
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        // Then sort by time
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const weekDaysArr = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      weekDaysArr.push(weekDay);
    }
    return weekDaysArr;
  };

  const generateDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      {weekDays.map(day => (
        <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
          {day}
        </div>
      ))}
      {generateCalendarDays().map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isCurrentDay = isToday(day);
        
        return (
          <div
            key={index}
            onClick={() => onDateClick(day)}
            className={`min-h-[120px] p-2 border-r border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              day ? '' : 'bg-gray-50 dark:bg-gray-800 cursor-default'
            } ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
          >
            {day && (
              <>
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={getEventId(event)}
                      className={`text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 flex items-center ${
                        event.isAllDay ? 'border-2 border-white/50' : ''
                      }`}
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {event.isAllDay ? (
                        <span className="font-bold mr-1">ALL-DAY</span>
                      ) : event.time && (
                        <span className="font-medium">{event.time} </span>
                      )}
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
    </div>
  );

  const renderWeekView = () => {
    const weekDaysArr = generateWeekDays();
    
    const getAllDayEvents = (date) => {
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString() && event.isAllDay;
      });
    };
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="w-full">
            <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <div className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                Time
              </div>
              {weekDaysArr.map((date, index) => {
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
            
            <div className="grid grid-cols-8 border-b dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900">
              <div className="p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r dark:border-gray-700">
                All-day
              </div>
              {weekDaysArr.map((date, index) => {
                const allDayEvents = getAllDayEvents(date);
                return (
                  <div key={index} className="p-2 border-r dark:border-gray-700 min-h-[40px]">
                    {allDayEvents.map(event => (
                      <div
                        key={getEventId(event)}
                        className="text-xs p-1 rounded mb-1 text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity"
                        style={{ backgroundColor: event.color }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            {generateDayHours().map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="p-3 text-sm text-gray-600 dark:text-gray-400 border-r dark:border-gray-700 font-medium border-l dark:border-gray-700">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDaysArr.map((date, index) => {
                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.date);
                    const eventHour = parseInt(event.time?.split(':')[0] || 0);
                    return eventDate.toDateString() === date.toDateString() && 
                           eventHour === hour && 
                           event.time;
                  });
                  
                  return (
                    <div 
                      key={index} 
                      className="p-2 border-r dark:border-gray-700 min-h-[60px] relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        const clickedDate = new Date(date);
                        clickedDate.setHours(hour, 0, 0, 0);
                        onSlotClick(clickedDate);
                      }}
                    >
                      {dayEvents.map(event => (
                        <div
                          key={getEventId(event)}
                          className={`text-xs p-2 rounded mb-1 text-white cursor-pointer hover:opacity-80 shadow-sm transition-opacity ${
                            event.isAllDay ? 'border-2 border-white/50' : ''
                          }`}
                          style={{ backgroundColor: event.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.isAllDay ? (
                            <div className="text-xs opacity-90 font-bold">All-day</div>
                          ) : (
                            <div className="text-xs opacity-90">
                              {event.time}
                              {event.duration && (
                                <span className="ml-1">
                                  ({Math.floor(event.duration / 60)}h{event.duration % 60}m)
                                </span>
                              )}
                            </div>
                          )}
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
      return eventDate.toDateString() === selectedDateProp?.toDateString();
    });

    return (
      <div className="w-full">
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow;
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek;
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Next Week
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
                    if (!selectedDateProp) return;
                    const clickedDate = new Date(selectedDateProp);
                    clickedDate.setHours(hour, 0, 0, 0);
                    onSlotClick(clickedDate);
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
                          onEventClick(event);
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
                            {event.duration && (
                              <div className="text-xs opacity-75">
                                {Math.floor(event.duration / 60)}h{event.duration % 60}m
                              </div>
                            )}
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

  if (viewMode === 'month') return renderMonthView();
  if (viewMode === 'week') return renderWeekView();
  if (viewMode === 'day') return renderDayView();
  return null;
};

export default CalendarViews;

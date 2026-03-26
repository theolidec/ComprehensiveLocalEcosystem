import React from 'react';
import { ChevronDown, Repeat } from 'lucide-react';

const getEventId = (event) => event._id || event.id;

const CalendarSidebar = ({
  categories,
  stats,
  events,
  categorySortOrder,
  showSortDropdown,
  onSortToggle,
  onSortSelect,
  onCategoryManage,
  onEventClick
}) => {
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

  const getSortLabel = () => {
    switch (categorySortOrder) {
      case 'name-asc': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'count-desc': return 'Most Used';
      case 'count-asc': return 'Least Used';
      default: return 'Name (A-Z)';
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
          <button
            onClick={onCategoryManage}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Manage
          </button>
        </div>
        
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
          <div className="relative sort-dropdown">
            <button
              onClick={onSortToggle}
              className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>{getSortLabel()}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => onSortSelect('name-asc')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      categorySortOrder === 'name-asc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Name (A-Z)
                  </button>
                  <button
                    onClick={() => onSortSelect('name-desc')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      categorySortOrder === 'name-desc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Name (Z-A)
                  </button>
                  <button
                    onClick={() => onSortSelect('count-desc')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      categorySortOrder === 'count-desc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Most Used
                  </button>
                  <button
                    onClick={() => onSortSelect('count-asc')}
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
                onClick={() => onEventClick(event)}
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
  );
};

export default CalendarSidebar;

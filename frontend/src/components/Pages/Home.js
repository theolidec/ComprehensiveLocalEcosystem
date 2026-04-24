import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Key, Gift, HardDrive, Calculator, Users, ArrowRight, Clock, MapPin, Book } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import calendarAPI from '../../services/calendarAPI';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [todayEvents, setTodayEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchTodayEvents = async () => {
      if (!isAuthenticated) return;
      setEventsLoading(true);
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        const events = await calendarAPI.getEvents({ startDate: startOfDay, endDate: endOfDay });
        setTodayEvents(events || []);
      } catch (err) {
        console.error('Error fetching today events:', err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchTodayEvents();
  }, [isAuthenticated]);

  const getCategoryColor = (category) => {
    const colors = {
      work: 'bg-indigo-500',
      personal: 'bg-green-500',
      health: 'bg-red-500',
      family: 'bg-blue-500',
      social: 'bg-pink-500',
      other: 'bg-gray-500'
    };
    return colors[category] || colors.other;
  };

  const quickActions = [
    {
      icon: Calendar,
      title: 'Calendar',
      description: 'View your schedule',
      link: '/calendar/month',
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    {
      icon: Key,
      title: 'Passwords',
      description: 'Manage your passwords',
      link: '/passwords',
      color: 'bg-red-600',
      lightColor: 'bg-red-100',
      textColor: 'text-red-600'
    },
    {
      icon: Gift,
      title: 'Wishlist',
      description: 'View your wishlist',
      link: '/wishlist',
      color: 'bg-pink-600',
      lightColor: 'bg-pink-100',
      textColor: 'text-pink-600'
    },
    {
      icon: HardDrive,
      title: 'Files',
      description: 'Access your files',
      link: '/files',
      color: 'bg-purple-600',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    {
      icon: Calculator,
      title: 'Calculator',
      description: 'Open calculator',
      link: '/calculator',
      color: 'bg-teal-600',
      lightColor: 'bg-teal-100',
      textColor: 'text-teal-600'
    },
    {
      icon: Users,
      title: 'Following',
      description: 'Social connections',
      link: '/following',
      color: 'bg-blue-600',
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      icon: Book,
      title: 'Wikis',
      description: 'Your knowledge base',
      link: '/wikis',
      color: 'bg-amber-600',
      lightColor: 'bg-amber-100',
      textColor: 'text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Events Card */}
        {isAuthenticated && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Today's Events
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400" style={{ alignSelf: 'center', marginTop: '2px' }}>
                  {formatTime(currentTime)} · {formatDate(currentTime)}
                </span>
              </div>
              <button
                onClick={() => navigate('/calendar/day')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                View Calendar
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {eventsLoading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Loading events...
                </div>
              ) : todayEvents.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No events scheduled for today
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {todayEvents.map((event) => (
                    <div
                      key={event._id || event.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/calendar/day')}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1 h-full min-h-[40px] rounded-full ${getCategoryColor(event.category)}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {event.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {event.isAllDay ? 'All day' : event.time}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.link)}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div className={`inline-flex p-3 rounded-lg ${action.lightColor} ${action.textColor} mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        {/* Getting Started Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Pro Tips
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>• Use the Calendar to organize your schedule with recurring events</li>
            <li>• Store passwords securely in the Password Manager with AES-256 encryption</li>
            <li>• Share wishlist items publicly or keep them private</li>
            <li>• Upload and organize files with the File Manager</li>
            <li>• Plot mathematical functions with the GeoGebra Calculator</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Key, Gift, HardDrive, Calculator, Users, ArrowRight, Clock, MapPin, Book, CheckSquare, Flame, Target, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import calendarAPI from '../../services/calendarAPI';
import trackerAPI from '../../services/trackerAPI';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [todayEvents, setTodayEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trackerData, setTrackerData] = useState(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);

  const isEndOfDay = currentTime.getHours() >= 17;

  const handleSetMood = async (mood) => {
    setCurrentMood(mood);
    setMoodSaved(true);
    setTimeout(() => setMoodSaved(false), 2000);
    try {
      await trackerAPI.saveResponse({ mood });
    } catch (err) {
      console.error('Error saving mood:', err);
    }
  };

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
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const startOfDay = `${year}-${month}-${day}T00:00:00`;
        const endOfDay = `${year}-${month}-${day}T23:59:59`;
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

  useEffect(() => {
    const fetchTrackerData = async () => {
      if (!isAuthenticated) return;
      setTrackerLoading(true);
      try {
        const [todayTasks, todayResponse, questions, stats] = await Promise.all([
          trackerAPI.getTodayTasks(),
          trackerAPI.getTodayResponse(),
          trackerAPI.getQuestions(),
          trackerAPI.getStats()
        ]);
        setTrackerData({ 
          tasks: todayTasks.tasks || [], 
          response: todayResponse,
          questions: questions?.filter(q => q.isActive) || [],
          stats 
        });
        if (todayResponse?.mood) {
          setCurrentMood(todayResponse.mood);
        }
      } catch (err) {
        console.error('Error fetching tracker data:', err);
      } finally {
        setTrackerLoading(false);
      }
    };
    fetchTrackerData();
  }, [isAuthenticated]);

  const handleToggleTask = async (taskId, completed) => {
    try {
      const now = completed ? new Date().toISOString() : null;
      await trackerAPI.saveResponse({
        taskCompletions: [{ task: taskId, completed, completedAt: now }]
      });
      setTrackerData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t._id === taskId
            ? { ...t, todayCompletion: { ...t.todayCompletion, completed, completedAt: now } }
            : t
        )
      }));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleAnswerQuestion = async (questionId, value) => {
    try {
      await trackerAPI.saveResponse({
        questionResponses: [{ question: questionId, value }]
      });
      setTrackerData(prev => {
        const existingResponses = prev.response?.questionResponses || [];
        const existingIdx = existingResponses.findIndex(
          r => r.question?._id === questionId || r.question?.toString() === questionId
        );
        const newResponses = [...existingResponses];
        if (existingIdx >= 0) {
          newResponses[existingIdx] = { ...newResponses[existingIdx], value };
        } else {
          newResponses.push({ question: questionId, value });
        }
        return {
          ...prev,
          response: { ...prev.response, questionResponses: newResponses }
        };
      });
    } catch (err) {
      console.error('Error answering question:', err);
    }
  };

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
    },
    {
      icon: CheckSquare,
      title: 'Daily Tracker',
      description: 'Track habits & goals',
      link: '/tracker',
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-100',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Tracker Card */}
        {isAuthenticated && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                  Daily Tracker
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400" style={{ alignSelf: 'center', marginTop: '2px' }}>
                  {formatDate(currentTime)}
                </span>
              </div>
              <button
                onClick={() => navigate('/tracker')}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
              >
                Open Tracker
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {trackerLoading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  Loading tracker data...
                </div>
              ) : !trackerData?.tasks || trackerData.tasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No tasks for today</p>
                  <button
                    onClick={() => navigate('/tracker')}
                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Add tasks in Tracker
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Progress Bar */}
                  {(() => {
                    const completed = trackerData.tasks.filter(t => t.todayCompletion?.completed).length;
                    const total = trackerData.tasks.length;
                    const percent = Math.round((completed / total) * 100);
                    return (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            {completed}/{total} tasks completed
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {trackerData.stats?.streak?.currentStreak || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Day Streak</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Target className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {trackerData.stats?.completionRate?.rate || 0}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">30-Day Rate</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {trackerData.stats?.totalTasks || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Active Tasks</div>
                    </div>
                  </div>

                  {/* Today's Tasks Preview */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Today's Tasks</h4>
                    {trackerData.tasks.slice(0, 4).map(task => (
                      <div
                        key={task._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <button
                          onClick={() => handleToggleTask(task._id, !task.todayCompletion?.completed)}
                          className="flex-shrink-0 focus:outline-none"
                        >
                          {task.todayCompletion?.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:border-green-500 transition-colors" />
                          )}
                        </button>
                        <span className={`text-sm truncate flex-1 cursor-pointer ${
                          task.todayCompletion?.completed
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        onClick={() => navigate('/tracker')}>
                          {task.title}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">Urgent</span>
                        )}
                      </div>
                    ))}
                    {trackerData.tasks.length > 4 && (
                      <button
                        onClick={() => navigate('/tracker')}
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
                      >
                        +{trackerData.tasks.length - 4} more tasks
                      </button>
                    )}
                  </div>

                  {/* Today's Questions Preview */}
                  {trackerData.questions.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Check-in</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {trackerData.response?.questionResponses?.length || 0}/{trackerData.questions.length} answered
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trackerData.questions.slice(0, 4).map(q => {
                          const answer = trackerData.response?.questionResponses?.find(
                            a => a.question?._id === q._id || a.question?.toString() === q._id
                          );
                          const value = answer?.value;
                          const isAnswered = value !== undefined;

                          if (q.responseType === 'yesno' || q.responseType === 'yesnomaybe') {
                            return (
                              <div key={q._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                isAnswered 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                              }`}>
                                <span className="text-sm text-gray-800 dark:text-gray-200 max-w-[140px] truncate">{q.question}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAnswerQuestion(q._id, true)}
                                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                                      value === true
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400'
                                    }`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => handleAnswerQuestion(q._id, false)}
                                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                                      value === false
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400'
                                    }`}
                                  >
                                    No
                                  </button>
                                  {q.responseType === 'yesnomaybe' && (
                                    <button
                                      onClick={() => handleAnswerQuestion(q._id, 'maybe')}
                                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                                        value === 'maybe'
                                          ? 'bg-yellow-500 text-white'
                                          : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:border-yellow-400'
                                      }`}
                                    >
                                      Maybe
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (q.responseType === 'scale') {
                            return (
                              <div key={q._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                                isAnswered 
                                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                                  : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                              }`}>
                                <span className="text-sm text-gray-800 dark:text-gray-200 max-w-[120px] truncate">{q.question}</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: Math.min(q.scaleMax - q.scaleMin + 1, 5) }, (_, i) => i + q.scaleMin).map(val => (
                                    <button
                                      key={val}
                                      onClick={() => handleAnswerQuestion(q._id, val)}
                                      className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                                        value === val
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={q._id}
                              onClick={() => navigate('/tracker')}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <span className="text-sm text-gray-800 dark:text-gray-200 max-w-[140px] truncate">{q.question}</span>
                              <span className="text-xs text-gray-400">→</span>
                            </button>
                          );
                        })}
                      </div>
                      {trackerData.questions.length > 4 && (
                        <button
                          onClick={() => navigate('/tracker')}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
                        >
                          +{trackerData.questions.length - 4} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* End of Day Mood Selector */}
        {isAuthenticated && isEndOfDay && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-1">How are you feeling today?</h2>
              <p className="text-indigo-100 text-sm mb-4">Take a moment to reflect on your day</p>
              <div className="flex items-center justify-center gap-4">
                {[
                  { level: 1, label: 'Awful', color: 'bg-red-500' },
                  { level: 2, label: 'Bad', color: 'bg-orange-500' },
                  { level: 3, label: 'Okay', color: 'bg-yellow-500' },
                  { level: 4, label: 'Good', color: 'bg-lime-500' },
                  { level: 5, label: 'Great', color: 'bg-green-500' }
                ].map(({ level, label, color }) => (
                  <button
                    key={level}
                    onClick={() => handleSetMood(level)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      currentMood === level
                        ? 'bg-white/30 ring-2 ring-white'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-2xl mb-1`}>
                      {level === 1 ? '😫' : level === 2 ? '😔' : level === 3 ? '😐' : level === 4 ? '🙂' : '😄'}
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
              {moodSaved && (
                <p className="text-center text-indigo-100 text-sm mt-3">Mood saved!</p>
              )}
            </div>
          </div>
        )}

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

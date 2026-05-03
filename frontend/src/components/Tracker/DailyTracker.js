import React, { useState, useEffect, useCallback } from 'react';
import { usePageActions } from '../../contexts/PageActionsContext';
import trackerAPI from '../../services/trackerAPI';
import {
  CheckSquare, Square, Plus, Trash2, Edit3, Save, X, Clock, Calendar,
  Repeat, AlertCircle, BarChart3, Target, TrendingUp, Flame, Activity,
  ChevronDown, ChevronUp, Download, Upload, Sun, Moon, Smile, Meh, Frown,
  ListChecks, HelpCircle, Settings, Star, Tag, Filter, Search, Check,
  ChevronLeft, ChevronRight, Award, Zap, BookOpen, Heart, Brain, Dumbbell
} from 'lucide-react';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom (days)' }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
};

const RESPONSE_TYPE_OPTIONS = [
  { value: 'yesno', label: 'Yes / No' },
  { value: 'yesnomaybe', label: 'Yes / No / Maybe' },
  { value: 'scale', label: 'Scale (1-5)' },
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' }
];

const QUESTION_ICONS = [
  { value: null, label: 'None', icon: null },
  { value: 'book', label: 'Learning', icon: BookOpen },
  { value: 'heart', label: 'Wellness', icon: Heart },
  { value: 'brain', label: 'Mental', icon: Brain },
  { value: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { value: 'star', label: 'Gratitude', icon: Star },
  { value: 'zap', label: 'Energy', icon: Zap },
  { value: 'target', label: 'Goals', icon: Target }
];

const MOOD_ICONS = { 1: Frown, 2: Frown, 3: Meh, 4: Smile, 5: Smile };
const MOOD_COLORS = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-lime-500',
  5: 'text-green-500'
};

const getQuestionIcon = (iconName) => {
  const found = QUESTION_ICONS.find(i => i.value === iconName);
  return found?.icon || null;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ========================
// TODAY TAB
// ========================
const TodayTab = ({ todayTasks, todayResponse, questions, onToggleTask, onAnswerQuestion, onSetMood, onSaveNotes, loading }) => {
  const [localNotes, setLocalNotes] = useState('');
  const [localMood, setLocalMood] = useState(null);

  useEffect(() => {
    if (todayResponse) {
      setLocalNotes(todayResponse.overallNotes || '');
      setLocalMood(todayResponse.mood);
    }
  }, [todayResponse]);

  const completedCount = todayTasks.filter(t => t.todayCompletion?.completed).length;
  const totalTasks = todayTasks.length;
  const answeredCount = todayResponse?.questionResponses?.length || 0;
  const totalQuestions = questions.filter(q => q.isActive).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Progress</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(new Date())}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{completedCount}/{totalTasks} tasks completed</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How are you feeling today?</h3>
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4, 5].map(level => {
            const MoodIcon = MOOD_ICONS[level];
            return (
              <button
                key={level}
                onClick={() => {
                  setLocalMood(level);
                  onSetMood(level);
                }}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  localMood === level
                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MoodIcon className={`h-8 w-8 ${localMood === level ? MOOD_COLORS[level] : 'text-gray-400 dark:text-gray-500'}`} />
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  {['Bad', 'Low', 'Okay', 'Good', 'Great'][level - 1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-600" />
            Today's Tasks
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{completedCount}/{totalTasks}</span>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No tasks for today</p>
            <p className="text-sm">Add tasks in the Tasks tab</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <div
                key={task._id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  task.todayCompletion?.completed
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <button
                  onClick={() => onToggleTask(task._id, !task.todayCompletion?.completed)}
                  className="flex-shrink-0"
                >
                  {task.todayCompletion?.completed ? (
                    <CheckSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 hover:text-blue-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${
                    task.todayCompletion?.completed
                      ? 'line-through text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.recurrence !== 'none' && (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                        <Repeat className="h-3 w-3" />
                        {RECURRENCE_OPTIONS.find(r => r.value === task.recurrence)?.label}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Questions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            Daily Check-in
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{answeredCount}/{totalQuestions}</span>
        </div>
        {questions.filter(q => q.isActive).length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No questions set up yet</p>
            <p className="text-sm">Add questions in the Questions tab</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.filter(q => q.isActive).map(question => {
              const existingAnswer = todayResponse?.questionResponses?.find(
                qr => qr.question?._id === question._id || qr.question?.toString() === question._id
              );
              const QuestionIcon = getQuestionIcon(question.icon);

              return (
                <div key={question._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {QuestionIcon && <QuestionIcon className="h-5 w-5 text-purple-600" />}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{question.question}</span>
                  </div>
                  {(question.responseType === 'yesno' || question.responseType === 'yesnomaybe') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAnswerQuestion(question._id, true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          existingAnswer?.value === true
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => onAnswerQuestion(question._id, false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          existingAnswer?.value === false
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                      >
                        No
                      </button>
                      {question.responseType === 'yesnomaybe' && (
                        <button
                          onClick={() => onAnswerQuestion(question._id, 'maybe')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            existingAnswer?.value === 'maybe'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                          }`}
                        >
                          Maybe
                        </button>
                      )}
                    </div>
                  )}
                  {question.responseType === 'scale' && (
                    <div className="flex items-center gap-2">
                      {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => i + question.scaleMin).map(val => (
                        <button
                          key={val}
                          onClick={() => onAnswerQuestion(question._id, val)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                            existingAnswer?.value === val
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                      {question.scaleLabels?.minLabel && (
                        <span className="text-xs text-gray-500 ml-1">{question.scaleLabels.minLabel}</span>
                      )}
                      {question.scaleLabels?.maxLabel && (
                        <span className="text-xs text-gray-500 ml-1">{question.scaleLabels.maxLabel}</span>
                      )}
                    </div>
                  )}
                  {question.responseType === 'text' && (
                    <input
                      type="text"
                      value={existingAnswer?.value || ''}
                      onChange={(e) => onAnswerQuestion(question._id, e.target.value)}
                      placeholder="Type your answer..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                  {question.responseType === 'number' && (
                    <input
                      type="number"
                      value={existingAnswer?.value || ''}
                      onChange={(e) => onAnswerQuestion(question._id, e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Enter a number..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Daily Notes</h3>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={() => onSaveNotes(localNotes)}
          placeholder="How was your day? Any reflections..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
};

// ========================
// TASKS TAB
// ========================
const TasksTab = ({ tasks, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'General', priority: 'medium',
    recurrence: 'none', customRecurrenceDays: '', weeklyDays: [],
    dueDate: '', startDate: '', endDate: '', estimatedMinutes: '', tags: []
  });

  const resetForm = () => {
    setFormData({
      title: '', description: '', category: 'General', priority: 'medium',
      recurrence: 'none', customRecurrenceDays: '', weeklyDays: [],
      dueDate: '', startDate: '', endDate: '', estimatedMinutes: '', tags: []
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category || 'General',
      priority: task.priority,
      recurrence: task.recurrence,
      customRecurrenceDays: task.customRecurrenceDays || '',
      weeklyDays: task.weeklyDays || [],
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
      estimatedMinutes: task.estimatedMinutes || '',
      tags: task.tags || []
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        customRecurrenceDays: formData.customRecurrenceDays ? parseInt(formData.customRecurrenceDays) : undefined,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
        dueDate: formData.dueDate || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      };
      if (editingTask) {
        await trackerAPI.updateTask(editingTask._id, data);
      } else {
        await trackerAPI.createTask(data);
      }
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await trackerAPI.deleteTask(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={1000}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurrence</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {formData.recurrence === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Every N days</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.customRecurrenceDays}
                    onChange={(e) => setFormData({ ...formData, customRecurrenceDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              )}
              {formData.recurrence === 'weekly' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days</label>
                  <div className="flex gap-1">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = formData.weeklyDays.includes(day)
                            ? formData.weeklyDays.filter(d => d !== day)
                            : [...formData.weeklyDays, day];
                          setFormData({ ...formData, weeklyDays: days });
                        }}
                        className={`w-10 h-8 rounded text-xs font-medium transition-all ${
                          formData.weeklyDays.includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {day.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Est. Minutes</label>
                <input
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Save className="h-4 w-4" />
                {editingTask ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <div
              key={task._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {task.category}
                    </span>
                    {task.recurrence !== 'none' && (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                        <Repeat className="h-3 w-3" />
                        {RECURRENCE_OPTIONS.find(r => r.value === task.recurrence)?.label}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(task._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================
// QUESTIONS TAB
// ========================
const QuestionsTab = ({ questions, loading, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '', responseType: 'yesno', scaleMin: 1, scaleMax: 5,
    scaleLabels: { minLabel: '', maxLabel: '' },
    category: 'General', isRequired: true, icon: null, color: ''
  });

  const resetForm = () => {
    setFormData({
      question: '', responseType: 'yesno', scaleMin: 1, scaleMax: 5,
      scaleLabels: { minLabel: '', maxLabel: '' },
      category: 'General', isRequired: true, icon: null, color: ''
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleEdit = (q) => {
    setFormData({
      question: q.question,
      responseType: q.responseType,
      scaleMin: q.scaleMin || 1,
      scaleMax: q.scaleMax || 5,
      scaleLabels: q.scaleLabels || { minLabel: '', maxLabel: '' },
      category: q.category || 'General',
      isRequired: q.isRequired,
      icon: q.icon,
      color: q.color || ''
    });
    setEditingQuestion(q);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (editingQuestion) {
        await trackerAPI.updateQuestion(editingQuestion._id, data);
      } else {
        await trackerAPI.createQuestion(data);
      }
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await trackerAPI.deleteQuestion(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleToggleActive = async (q) => {
    try {
      await trackerAPI.updateQuestion(q._id, { isActive: !q.isActive });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle question:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Daily Questions</h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingQuestion ? 'Edit Question' : 'New Question'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question *</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
                maxLength={500}
                placeholder="e.g., Did I learn something today?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Type</label>
                <select
                  value={formData.responseType}
                  onChange={(e) => setFormData({ ...formData, responseType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {RESPONSE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <select
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {QUESTION_ICONS.map(opt => (
                    <option key={opt.value || 'none'} value={opt.value || ''}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {formData.responseType === 'scale' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Value</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.scaleMin}
                      onChange={(e) => setFormData({ ...formData, scaleMin: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Value</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.scaleMax}
                      onChange={(e) => setFormData({ ...formData, scaleMax: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Label</label>
                    <input
                      type="text"
                      value={formData.scaleLabels.minLabel}
                      onChange={(e) => setFormData({ ...formData, scaleLabels: { ...formData.scaleLabels, minLabel: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Label</label>
                    <input
                      type="text"
                      value={formData.scaleLabels.maxLabel}
                      onChange={(e) => setFormData({ ...formData, scaleLabels: { ...formData.scaleLabels, maxLabel: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Required</label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
                Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                <Save className="h-4 w-4" />
                {editingQuestion ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No questions yet</p>
          <p className="text-sm">Create custom daily check-in questions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => {
            const QIcon = getQuestionIcon(q.icon);
            return (
              <div
                key={q._id}
                className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${!q.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {QIcon && <QIcon className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                        {RESPONSE_TYPE_OPTIONS.find(r => r.value === q.responseType)?.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {q.category}
                      </span>
                      {q.isRequired && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(q)}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${q.isActive ? 'text-green-600' : 'text-gray-400'}`}
                      title={q.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {q.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleEdit(q)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(q._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ========================
// STATISTICS TAB
// ========================
const StatisticsTab = ({ stats, analytics, heatmap, loading }) => {
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [showHeatmap, setShowHeatmap] = useState(false);

  if (loading && !stats) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading statistics...</div>;
  }

  const streak = stats?.streak || { currentStreak: 0, longestStreak: 0 };
  const completionRate = stats?.completionRate || { rate: 0, totalCompleted: 0, totalPossible: 0 };

  // Build heatmap grid
  const heatmapData = heatmap?.heatmap || [];
  const heatmapMap = {};
  heatmapData.forEach(d => { heatmapMap[d._id] = d; });

  const getHeatmapColor = (dateStr) => {
    const data = heatmapMap[dateStr];
    if (!data) return 'bg-gray-100 dark:bg-gray-700';
    const total = (data.tasksCompleted || 0) + (data.questionsAnswered || 0);
    if (total === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (total <= 1) return 'bg-green-200 dark:bg-green-900/40';
    if (total <= 3) return 'bg-green-400 dark:bg-green-700/60';
    if (total <= 5) return 'bg-green-600 dark:bg-green-600/80';
    return 'bg-green-800 dark:bg-green-500';
  };

  const generateHeatmapGrid = () => {
    const year = heatmapYear;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const weeks = [];
    let currentWeek = [];

    let d = new Date(startDate);
    while (d.getDay() !== 1 && d <= endDate) {
      currentWeek.push(null);
      d.setDate(d.getDate() + 1);
    }

    d = new Date(startDate);
    while (d <= endDate) {
      const dateStr = d.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        day: d.getDay(),
        data: heatmapMap[dateStr]
      });
      if (d.getDay() === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  };

  const moodData = analytics?.moodTrend || [];
  const dailyActivity = analytics?.dailyActivity || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Current Streak</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{streak.currentStreak}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{streak.longestStreak}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">days</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionRate.rate}%</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Active Tasks</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalTasks || 0}</span>
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Tasks by Priority
          </h3>
          {Object.keys(stats?.byPriority || {}).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byPriority).map(([priority, count]) => {
                const total = stats.totalTasks || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={priority}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{priority}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          priority === 'urgent' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-500' :
                          priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-600" />
            Tasks by Category
          </h3>
          {Object.keys(stats?.byCategory || {}).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Chart (simple bar chart) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Daily Activity (Last 30 days)
        </h3>
        {dailyActivity.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity data yet. Start checking in daily!</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px]" style={{ height: '120px' }}>
              {dailyActivity.slice(-30).map((day, i) => {
                const maxTasks = Math.max(...dailyActivity.map(d => d.tasksCompleted || 0), 1);
                const height = Math.max(4, ((day.tasksCompleted || 0) / maxTasks) * 100);
                return (
                  <div key={day._id || i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${formatDateShort(day._id)}: ${day.tasksCompleted} tasks, ${day.questionsAnswered} answers`}
                    />
                    {i % 5 === 0 && (
                      <span className="text-[9px] text-gray-400 mt-1 whitespace-nowrap">
                        {formatDateShort(day._id)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mood Trend */}
      {moodData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Smile className="h-5 w-5 text-yellow-500" />
            Mood Trend
          </h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[400px]" style={{ height: '80px' }}>
              {moodData.slice(-30).map((day, i) => {
                const height = ((day.avgMood || 0) / 5) * 100;
                const color = day.avgMood >= 4 ? 'bg-green-500' : day.avgMood >= 3 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={day._id || i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
                    <div
                      className={`w-full ${color} rounded-t transition-colors cursor-pointer`}
                      style={{ height: `${Math.max(4, height)}%` }}
                      title={`${formatDateShort(day._id)}: Mood ${day.avgMood?.toFixed(1)}/5`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> Okay</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Great</span>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Activity Heatmap
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHeatmapYear(y => y - 1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{heatmapYear}</span>
            <button
              onClick={() => setHeatmapYear(y => Math.min(y + 1, new Date().getFullYear()))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-[700px]">
            {generateHeatmapGrid().map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm ${day ? getHeatmapColor(day.date) : ''}`}
                    title={day?.date ? `${formatDateShort(day.date)}: ${day.data?.tasksCompleted || 0} tasks` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <span className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded-sm" />
          <span className="w-3 h-3 bg-green-200 dark:bg-green-900/40 rounded-sm" />
          <span className="w-3 h-3 bg-green-400 dark:bg-green-700/60 rounded-sm" />
          <span className="w-3 h-3 bg-green-600 dark:bg-green-600/80 rounded-sm" />
          <span className="w-3 h-3 bg-green-800 dark:bg-green-500 rounded-sm" />
          <span>More</span>
        </div>
      </div>

      {/* Question Stats */}
      {analytics?.questionStats && analytics.questionStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            Question Statistics (Last 30 days)
          </h3>
          <div className="space-y-4">
            {analytics.questionStats.map((qs, i) => {
              const yesCount = qs.responses?.filter(v => v === true).length || 0;
              const noCount = qs.responses?.filter(v => v === false).length || 0;
              const maybeCount = qs.responses?.filter(v => v === 'maybe').length || 0;
              const numericValues = qs.responses?.filter(v => typeof v === 'number') || [];
              const avg = numericValues.length > 0
                ? (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(1)
                : null;
              const totalYesNoMaybe = yesCount + noCount + maybeCount;

              return (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Question {i + 1}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{qs.count} responses</span>
                  </div>
                  {totalYesNoMaybe > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                        Yes: {yesCount}
                      </span>
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                        No: {noCount}
                      </span>
                      {maybeCount > 0 && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                          Maybe: {maybeCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round((yesCount / totalYesNoMaybe) * 100)}% yes
                      </span>
                    </div>
                  )}
                  {avg && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Average: {avg}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ========================
// MAIN COMPONENT
// ========================
const DailyTracker = () => {
  const { registerPageActions, clearPageActions } = usePageActions();
  const [activeTab, setActiveTab] = useState('today');
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayResponse, setTodayResponse] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTodayData = useCallback(async () => {
    try {
      const [todayData, questionsData] = await Promise.all([
        trackerAPI.getTodayTasks(),
        trackerAPI.getQuestions()
      ]);
      setTodayTasks(todayData.tasks || []);
      setTodayResponse(todayData.response);
      setQuestions(questionsData || []);
    } catch (err) {
      console.error('Failed to fetch today data:', err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await trackerAPI.getTasks({ limit: 100 });
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData, heatmapData] = await Promise.all([
        trackerAPI.getStats(),
        trackerAPI.getAnalytics(),
        trackerAPI.getHeatmap()
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      setHeatmap(heatmapData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'today') fetchTodayData();
    else if (activeTab === 'tasks') fetchTasks();
    else if (activeTab === 'questions') {
      trackerAPI.getQuestions().then(setQuestions).catch(console.error);
    }
    else if (activeTab === 'stats') fetchStats();
  }, [activeTab, fetchTodayData, fetchTasks, fetchStats]);

  useEffect(() => {
    const tabs = [
      { icon: <Sun size={18} />, label: 'Today', onClick: () => setActiveTab('today'), variant: activeTab === 'today' ? 'primary' : 'default' },
      { icon: <ListChecks size={18} />, label: 'Tasks', onClick: () => setActiveTab('tasks'), variant: activeTab === 'tasks' ? 'primary' : 'default' },
      { icon: <HelpCircle size={18} />, label: 'Questions', onClick: () => setActiveTab('questions'), variant: activeTab === 'questions' ? 'primary' : 'default' },
      { icon: <BarChart3 size={18} />, label: 'Statistics', onClick: () => setActiveTab('stats'), variant: activeTab === 'stats' ? 'primary' : 'default' }
    ];
    registerPageActions(tabs);
    return () => clearPageActions();
  }, [activeTab, registerPageActions, clearPageActions]);

  const handleToggleTask = async (taskId, completed) => {
    try {
      const now = completed ? new Date().toISOString() : null;
      await trackerAPI.saveResponse({
        taskCompletions: [{ task: taskId, completed, completedAt: now }]
      });
      setTodayTasks(prev => prev.map(t =>
        t._id === taskId
          ? { ...t, todayCompletion: { ...t.todayCompletion, completed, completedAt: now } }
          : t
      ));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAnswerQuestion = async (questionId, value) => {
    try {
      await trackerAPI.saveResponse({
        questionResponses: [{ question: questionId, value }]
      });
      // Refresh to get populated response
      fetchTodayData();
    } catch (err) {
      console.error('Failed to answer question:', err);
    }
  };

  const handleSetMood = async (mood) => {
    try {
      await trackerAPI.saveResponse({ mood });
    } catch (err) {
      console.error('Failed to set mood:', err);
    }
  };

  const handleSaveNotes = async (notes) => {
    try {
      await trackerAPI.saveResponse({ overallNotes: notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Tab Bar */}
        <div className="md:hidden flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {[
            { key: 'today', icon: Sun, label: 'Today' },
            { key: 'tasks', icon: ListChecks, label: 'Tasks' },
            { key: 'questions', icon: HelpCircle, label: 'Questions' },
            { key: 'stats', icon: BarChart3, label: 'Stats' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'today' && (
          <TodayTab
            todayTasks={todayTasks}
            todayResponse={todayResponse}
            questions={questions}
            onToggleTask={handleToggleTask}
            onAnswerQuestion={handleAnswerQuestion}
            onSetMood={handleSetMood}
            onSaveNotes={handleSaveNotes}
            loading={loading}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab tasks={tasks} loading={loading} onRefresh={fetchTasks} />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab questions={questions} loading={loading} onRefresh={() => trackerAPI.getQuestions().then(setQuestions)} />
        )}
        {activeTab === 'stats' && (
          <StatisticsTab stats={stats} analytics={analytics} heatmap={heatmap} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default DailyTracker;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Calendar, Save, RotateCcw, Key, Gift, HardDrive, Calculator, Users, Book, ChevronDown, Flame, Activity, DollarSign } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { usePageActions } from '../../contexts/PageActionsContext';

const HomeLayoutEditor = () => {
  const navigate = useNavigate();
  const { settings, updateDisplaySettings } = useSettings();
  const { registerPageActions, clearPageActions } = usePageActions();
  const [showDailyTracker, setShowDailyTracker] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  const [showProTips, setShowProTips] = useState(true);
  const [order, setOrder] = useState(['dailyTracker', 'events', 'quickAccess', 'proTips']);
  const [quickActions, setQuickActions] = useState(['calendar', 'passwords', 'wishlist', 'files', 'music', 'calculator', 'following', 'wikis', 'tracker']);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const allQuickActionDefs = [
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'passwords', label: 'Passwords', icon: Key },
    { key: 'wishlist', label: 'Wishlist', icon: Gift },
    { key: 'files', label: 'Files', icon: HardDrive },
    { key: 'music', label: 'Music', icon: Flame },
    { key: 'calculator', label: 'Calculator', icon: Calculator },
    { key: 'following', label: 'Following', icon: Users },
    { key: 'wikis', label: 'Wikis', icon: Book },
    { key: 'tracker', label: 'Daily Tracker', icon: CheckSquare },
    { key: 'radiation', label: 'Radiation Monitor', icon: Activity },
    { key: 'finance', label: 'Finance', icon: DollarSign }
  ];

  useEffect(() => {
    const layout = settings?.display?.homepageLayout || {};
    setShowDailyTracker(layout.showDailyTracker !== false);
    setShowEvents(layout.showEvents !== false);
    setShowQuickAccess(layout.showQuickAccess !== false);
    setShowProTips(layout.showProTips !== false);
    const defaultOrder = ['dailyTracker', 'events', 'quickAccess', 'proTips'];
    const savedOrder = Array.isArray(layout.order) && layout.order.length > 0 ? layout.order : defaultOrder;
    // Ensure we only keep known keys and include any missing ones in default order
    const validKeys = defaultOrder;
    const filtered = savedOrder.filter((k) => validKeys.includes(k));
    const withMissing = [...filtered, ...validKeys.filter((k) => !filtered.includes(k))];
    setOrder(withMissing);
    // Insert 'music' after 'files' for defaultQuickActions
    const defaultQuickActions = allQuickActionDefs.map(d => d.key);
    if (!defaultQuickActions.includes('music')) {
      const filesIdx = defaultQuickActions.indexOf('files');
      defaultQuickActions.splice(filesIdx + 1, 0, 'music');
    }
    const savedQuickActions = Array.isArray(layout.quickActions)
      ? layout.quickActions
      : defaultQuickActions;
    const validQuick = savedQuickActions.filter(k => allQuickActionDefs.some(d => d.key === k));
    setQuickActions(validQuick);
  }, [settings]);

  useEffect(() => {
    registerPageActions([
      {
        icon: <Home size={18} />,
        label: 'Back to Home',
        onClick: () => navigate('/home'),
        variant: 'default'
      },
      {
        icon: <Save size={18} />,
        label: 'Save Layout',
        onClick: () => handleSave(),
        variant: 'primary',
        closeOnClick: false
      },
      {
        icon: <RotateCcw size={18} />,
        label: 'Reset Layout',
        onClick: () => handleReset(),
        variant: 'danger',
        closeOnClick: false
      }
    ]);

    return () => clearPageActions();
  }, [navigate, clearPageActions, registerPageActions, showDailyTracker, showEvents, showQuickAccess, showProTips, order, quickActions]);

  const showTransientMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateDisplaySettings({
        homepageLayout: {
          showDailyTracker,
          showEvents,
          showQuickAccess,
          showProTips,
          order,
          quickActions
        }
      });
      if (result.success) {
        showTransientMessage('Home layout saved');
      } else if (result.error) {
        showTransientMessage(result.error, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowDailyTracker(true);
    setShowEvents(true);
    setShowQuickAccess(true);
    setShowProTips(true);
    setOrder(['dailyTracker', 'events', 'quickAccess', 'proTips']);
    setQuickActions(allQuickActionDefs.map(d => d.key));
  };

  const toggleQuickAction = (key) => {
    setQuickActions((prev) => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const moveQuickAction = (key, direction) => {
    setQuickActions((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const newOrder = [...prev];
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= newOrder.length) return prev;
      [newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]];
      return newOrder;
    });
  };

  const moveSection = (key, direction) => {
    setOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const newOrder = [...prev];
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= newOrder.length) return prev;
      [newOrder[idx], newOrder[swapWith]] = [newOrder[swapWith], newOrder[idx]];
      return newOrder;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Customize Home Layout</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose which widgets appear on your personal home page.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4 mr-1" />
            Back to Home
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm border ${
              message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4 mb-8">
          {order.map((key) => {
            if (key === 'dailyTracker') {
              return (
                <div
                  key="dailyTracker"
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Daily Tracker</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Shows your task progress, daily questions, and mood summary.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="mr-3 text-xs text-gray-500 dark:text-gray-400">Hidden</span>
                      <button
                        type="button"
                        onClick={() => setShowDailyTracker(!showDailyTracker)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showDailyTracker ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            showDailyTracker ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-xs text-gray-700 dark:text-gray-200">Visible</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveSection('dailyTracker', 'up')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection('dailyTracker', 'down')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (key === 'events') {
              return (
                <div
                  key="events"
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Today&#39;s Events</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Shows your events for today and the next upcoming event.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="mr-3 text-xs text-gray-500 dark:text-gray-400">Hidden</span>
                      <button
                        type="button"
                        onClick={() => setShowEvents(!showEvents)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showEvents ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            showEvents ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-xs text-gray-700 dark:text-gray-200">Visible</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveSection('events', 'up')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection('events', 'down')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (key === 'quickAccess') {
              return (
                <div
                  key="quickAccess"
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Quick Access</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Shortcuts to your most-used tools like Calendar, Passwords, and Files.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="mr-3 text-xs text-gray-500 dark:text-gray-400">Hidden</span>
                      <button
                        type="button"
                        onClick={() => setShowQuickAccess(!showQuickAccess)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showQuickAccess ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            showQuickAccess ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-xs text-gray-700 dark:text-gray-200">Visible</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveSection('quickAccess', 'up')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection('quickAccess', 'down')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (key === 'proTips') {
              return (
                <div
                  key="proTips"
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Pro Tips</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Helpful suggestions for getting the most out of your dashboard.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="mr-3 text-xs text-gray-500 dark:text-gray-400">Hidden</span>
                      <button
                        type="button"
                        onClick={() => setShowProTips(!showProTips)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showProTips ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            showProTips ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-xs text-gray-700 dark:text-gray-200">Visible</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveSection('proTips', 'up')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection('proTips', 'down')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="mb-8">
          <button
            type="button"
            onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Access Shortcuts</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose which shortcuts appear in the Quick Access section and reorder them.
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform ${
                quickActionsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          {quickActionsExpanded && (
            <div className="space-y-3 mt-4">
            {allQuickActionDefs.map((def) => {
              const isEnabled = quickActions.includes(def.key);
              const Icon = def.icon;
              return (
                <div
                  key={def.key}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{def.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleQuickAction(def.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => moveQuickAction(def.key, 'up')}
                        disabled={!isEnabled}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuickAction(def.key, 'down')}
                        disabled={!isEnabled}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1 text-gray-700 dark:text-gray-200">Preview</p>
          <p>
            Your home page will show
            {' '}<strong>{showDailyTracker ? 'the Daily Tracker' : 'no Daily Tracker card'}</strong>,
            {' '}<strong>{showEvents ? "Today&#39;s Events" : 'no events card'}</strong>,
            {' '}<strong>{showQuickAccess ? 'Quick Access shortcuts' : 'no Quick Access section'}</strong>,
            {' '}and <strong>{showProTips ? 'Pro Tips' : 'no Pro Tips card'}</strong>
            {' '}in the order: {order.join(' → ')}.
          </p>
          {showQuickAccess && (
            <p className="mt-1">
              Quick Access includes: {quickActions.map(k => allQuickActionDefs.find(d => d.key === k)?.label || k).join(', ') || 'none'}.
            </p>
          )}
          <p className="mt-1">
            Changes are saved per account and apply on all your devices.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeLayoutEditor;

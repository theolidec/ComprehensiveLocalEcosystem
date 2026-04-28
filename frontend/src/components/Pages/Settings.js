import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { usePageActions } from '../../contexts/PageActionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { User, Calendar, Bell, Palette, Lock, RotateCcw, Monitor, Trash2, RefreshCw, Gift, Database, Download, Shield, AlertTriangle } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { settings, loading, updateProfile, updateCalendarSettings, updateNotificationSettings, updateDisplaySettings, updatePrivacySettings, updateWishlistSettings, resetSettings, getActiveSessions, revokeSession, getUserData, updateUserData, deleteAccount, exportUserData } = useSettings();
  const { registerPageActions, clearPageActions } = usePageActions();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (loading) return;
    
    registerPageActions([
      {
        icon: <User size={18} />,
        label: 'Profile',
        onClick: () => setActiveTab('profile'),
        variant: activeTab === 'profile' ? 'primary' : 'default'
      },
      {
        icon: <Calendar size={18} />,
        label: 'Calendar',
        onClick: () => setActiveTab('calendar'),
        variant: activeTab === 'calendar' ? 'primary' : 'default'
      },
      {
        icon: <Bell size={18} />,
        label: 'Notifications',
        onClick: () => setActiveTab('notifications'),
        variant: activeTab === 'notifications' ? 'primary' : 'default'
      },
      {
        icon: <Palette size={18} />,
        label: 'Display',
        onClick: () => setActiveTab('display'),
        variant: activeTab === 'display' ? 'primary' : 'default'
      },
      {
        icon: <Lock size={18} />,
        label: 'Privacy',
        onClick: () => setActiveTab('privacy'),
        variant: activeTab === 'privacy' ? 'primary' : 'default'
      },
      {
        icon: <RotateCcw size={18} />,
        label: 'Reset All',
        onClick: handleReset,
        variant: 'danger',
        closeOnClick: false
      }
    ]);

    return () => clearPageActions();
  }, [activeTab, loading, registerPageActions, clearPageActions]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await updateProfile({
      name: formData.get('name'),
      bio: formData.get('bio')
    });
    if (result.success) showMessage('Profile updated successfully');
    else showMessage(result.error, 'error');
  };

  const handleCalendarSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await updateCalendarSettings({
      defaultView: formData.get('defaultView'),
      weekStartsOn: parseInt(formData.get('weekStartsOn')),
      timezone: formData.get('timezone'),
      showWeekNumbers: formData.get('showWeekNumbers') === 'true',
      defaultEventDuration: parseInt(formData.get('defaultEventDuration')),
      workingHours: {
        start: formData.get('workingStart'),
        end: formData.get('workingEnd')
      }
    });
    if (result.success) showMessage('Calendar settings updated');
    else showMessage(result.error, 'error');
  };

  const handleNotificationsSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await updateNotificationSettings({
      emailReminders: formData.get('emailReminders') === 'true',
      reminderTime: parseInt(formData.get('reminderTime')),
      eventUpdates: formData.get('eventUpdates') === 'true',
      weeklyDigest: formData.get('weeklyDigest') === 'true'
    });
    if (result.success) showMessage('Notification settings updated');
    else showMessage(result.error, 'error');
  };

  const handleDisplaySave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTheme = formData.get('theme');
    const result = await updateDisplaySettings({
      theme: newTheme,
      language: formData.get('language'),
      compactMode: formData.get('compactMode') === 'true',
      showCompletedEvents: formData.get('showCompletedEvents') === 'true'
    });
    if (result.success) {
      showMessage('Display settings updated');
      // Resolve 'system' theme to actual theme
      const resolvedTheme = newTheme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : newTheme;
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      localStorage.setItem('theme', newTheme);
      // Only save to cookie if user allows (save the raw value including 'system')
      if (settings.privacy?.allowThemeCookie !== false) {
        document.cookie = `theme=${newTheme};path=/;max-age=31536000;SameSite=Lax`;
      }
    } else showMessage(result.error, 'error');
  };

  const handlePrivacySave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const allowThemeCookie = formData.get('allowThemeCookie') === 'true';
    const result = await updatePrivacySettings({
      shareCalendar: formData.get('shareCalendar') === 'true',
      showBusyStatus: formData.get('showBusyStatus') === 'true',
      allowThemeCookie
    });
    if (result.success) {
      showMessage('Privacy settings updated');
      // Delete theme cookie if user disabled it
      if (!allowThemeCookie) {
        document.cookie = 'theme=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax';
        document.cookie = 'theme=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax;domain=' + window.location.hostname;
        localStorage.removeItem('theme');
      } else {
        // Re-save current theme to cookie if enabling
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme) {
          document.cookie = `theme=${currentTheme};path=/;max-age=31536000;SameSite=Lax`;
        }
      }
    }
    else showMessage(result.error, 'error');
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const result = await resetSettings();
      if (result.success) showMessage('Settings reset to defaults');
      else showMessage(result.error, 'error');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '?' },
    { id: 'calendar', label: 'Calendar', icon: '?' },
    { id: 'notifications', label: 'Notifications', icon: '?' },
    { id: 'display', label: 'Display', icon: '?' },
    { id: 'privacy', label: 'Privacy', icon: '?' },
    { id: 'sessions', label: 'Sessions', icon: '?' }
  ];

  useEffect(() => {
    registerPageActions([
      {
        icon: <User size={18} />,
        label: 'Profile',
        onClick: () => setActiveTab('profile'),
        variant: activeTab === 'profile' ? 'primary' : 'default'
      },
      {
        icon: <Calendar size={18} />,
        label: 'Calendar',
        onClick: () => setActiveTab('calendar'),
        variant: activeTab === 'calendar' ? 'primary' : 'default'
      },
      {
        icon: <Bell size={18} />,
        label: 'Notifications',
        onClick: () => setActiveTab('notifications'),
        variant: activeTab === 'notifications' ? 'primary' : 'default'
      },
      {
        icon: <Palette size={18} />,
        label: 'Display',
        onClick: () => setActiveTab('display'),
        variant: activeTab === 'display' ? 'primary' : 'default'
      },
      {
        icon: <Lock size={18} />,
        label: 'Privacy',
        onClick: () => setActiveTab('privacy'),
        variant: activeTab === 'privacy' ? 'primary' : 'default'
      },
      {
        icon: <Gift size={18} />,
        label: 'Wishlist',
        onClick: () => setActiveTab('wishlist'),
        variant: activeTab === 'wishlist' ? 'primary' : 'default'
      },
      {
        icon: <Monitor size={18} />,
        label: 'Sessions',
        onClick: () => setActiveTab('sessions'),
        variant: activeTab === 'sessions' ? 'primary' : 'default'
      },
      {
        icon: <Shield size={18} />,
        label: 'Account',
        onClick: () => setActiveTab('account'),
        variant: activeTab === 'account' ? 'primary' : 'default'
      },
      {
        icon: <RotateCcw size={18} />,
        label: 'Reset All',
        onClick: handleReset,
        variant: 'danger',
        closeOnClick: false
      }
    ]);

    return () => clearPageActions();
  }, [activeTab, registerPageActions, clearPageActions, handleReset]);

  return (
    <div className="settings-container">
      

{/*
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div> */}

      <div className="settings-content">
        {activeTab === 'profile' && (
          <form className="settings-form" onSubmit={handleProfileSave}>
            <h2>Profile Settings</h2>
            <div className="form-group">
              <label htmlFor="name">Display Name</label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={settings.profile?.name || ''}
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={settings.profile?.bio || ''}
                maxLength={500}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'calendar' && (
          <form className="settings-form" onSubmit={handleCalendarSave}>
            <h2>Calendar Settings</h2>
            <div className="form-group">
              <label htmlFor="defaultView">Default View</label>
              <select id="defaultView" name="defaultView" defaultValue={settings.calendar?.defaultView || 'month'}>
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
                <option value="agenda">Agenda</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="weekStartsOn">Week Starts On</label>
              <select id="weekStartsOn" name="weekStartsOn" defaultValue={settings.calendar?.weekStartsOn ?? 0}>
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select id="timezone" name="timezone" defaultValue={settings.calendar?.timezone || 'UTC'}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="showWeekNumbers"
                  defaultChecked={settings.calendar?.showWeekNumbers || false}
                  value="true"
                />
                Show Week Numbers
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="defaultEventDuration">Default Event Duration</label>
              <select id="defaultEventDuration" name="defaultEventDuration" defaultValue={settings.calendar?.defaultEventDuration || 60}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="workingStart">Working Hours Start</label>
                <input
                  type="time"
                  id="workingStart"
                  name="workingStart"
                  defaultValue={settings.calendar?.workingHours?.start || '09:00'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="workingEnd">Working Hours End</label>
                <input
                  type="time"
                  id="workingEnd"
                  name="workingEnd"
                  defaultValue={settings.calendar?.workingHours?.end || '17:00'}
                />
              </div>
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'notifications' && (
          <form className="settings-form" onSubmit={handleNotificationsSave}>
            <h2>Notification Settings</h2>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="emailReminders"
                  defaultChecked={settings.notifications?.emailReminders ?? true}
                  value="true"
                />
                Email Reminders
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="reminderTime">Default Reminder Time (minutes before)</label>
              <select id="reminderTime" name="reminderTime" defaultValue={settings.notifications?.reminderTime || 15}>
                <option value={0}>At event time</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={1440}>1 day</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="eventUpdates"
                  defaultChecked={settings.notifications?.eventUpdates ?? true}
                  value="true"
                />
                Event Updates
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="weeklyDigest"
                  defaultChecked={settings.notifications?.weeklyDigest || false}
                  value="true"
                />
                Weekly Digest
              </label>
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'display' && (
          <form className="settings-form" onSubmit={handleDisplaySave}>
            <h2>Display Settings</h2>
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select id="theme" name="theme" defaultValue={settings.display?.theme || 'system'}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select id="language" name="language" defaultValue={settings.display?.language || 'en'}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="compactMode"
                  defaultChecked={settings.display?.compactMode || false}
                  value="true"
                />
                Compact Mode
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="showCompletedEvents"
                  defaultChecked={settings.display?.showCompletedEvents ?? true}
                  value="true"
                />
                Show Completed Events
              </label>
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'privacy' && (
          <form className="settings-form" onSubmit={handlePrivacySave}>
            <h2>Privacy Settings</h2>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="shareCalendar"
                  defaultChecked={settings.privacy?.shareCalendar || false}
                  value="true"
                />
                Share Calendar with Others
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="showBusyStatus"
                  defaultChecked={settings.privacy?.showBusyStatus ?? true}
                  value="true"
                />
                Show Busy Status
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="allowThemeCookie"
                  defaultChecked={settings.privacy?.allowThemeCookie ?? true}
                  value="true"
                />
                Save Theme to Cookie (for login page)
                <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Allows your theme preference to persist on the login page
                </small>
              </label>
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'wishlist' && (
          <form className="settings-form" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const result = await updateWishlistSettings({
              defaultItemsPerPage: parseInt(formData.get('defaultItemsPerPage')),
              saveItemsPerPageCookie: formData.get('saveItemsPerPageCookie') === 'on'
            });
            if (result.success) showMessage('Wishlist settings updated');
            else showMessage(result.error, 'error');
          }}>
            <h2>Wishlist Settings</h2>
            <div className="form-group">
              <label htmlFor="defaultItemsPerPage">Default Items Per Page</label>
              <select
                id="defaultItemsPerPage"
                name="defaultItemsPerPage"
                defaultValue={settings?.wishlist?.defaultItemsPerPage || 20}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                Default number of wishlist items to display per page
              </small>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="saveItemsPerPageCookie"
                  defaultChecked={settings?.wishlist?.saveItemsPerPageCookie !== false}
                />
                Save items per page selection
              </label>
              <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>
                When enabled, your selection will be remembered in a cookie. Disable to always use the default value.
              </small>
            </div>
            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'sessions' && (
          <div className="settings-form">
            <h2>Active Sessions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage your active login sessions. Revoke any session you don't recognize.
            </p>
            <button
              onClick={async () => {
                setSessionsLoading(true);
                const result = await getActiveSessions();
                if (result.success) {
                  setSessions(result.sessions);
                } else {
                  showMessage(result.error, 'error');
                }
                setSessionsLoading(false);
              }}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 mb-4"
            >
              <RefreshCw size={16} className={sessionsLoading ? 'animate-spin' : ''} />
              <span>Refresh Sessions</span>
            </button>
            
            {sessionsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active sessions. Click refresh to load your sessions.
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {session.userAgent ? session.userAgent.substring(0, 50) + '...' : 'Unknown Device'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.ip && `IP: ${session.ip}`}
                          {session.createdAt && ` | Started: ${new Date(session.createdAt).toLocaleString()}`}
                          {session.isExpired && <span className="text-red-500 ml-2">(Expired)</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to revoke this session?')) {
                          const result = await revokeSession(session._id);
                          if (result.success) {
                            showMessage('Session revoked successfully');
                            setSessions(sessions.filter(s => s._id !== session._id));
                          } else {
                            showMessage(result.error, 'error');
                          }
                        }
                      }}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      <Trash2 size={16} />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <div className="settings-form">
            <h2>Account & Data</h2>
            <p className="text-sm text-gray-600 mb-6">
              Manage your personal data and account. These features help you exercise your data rights.
            </p>

            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">View My Data</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Access all personal data we store about you, including account info, settings, and active sessions.
                    </p>
                    <button
                      onClick={async () => {
                        setUserDataLoading(true);
                        const result = await getUserData();
                        if (result.success) {
                          setUserData(result.data);
                        } else {
                          showMessage(result.error, 'error');
                        }
                        setUserDataLoading(false);
                      }}
                      disabled={userDataLoading}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {userDataLoading ? 'Loading...' : userData ? 'Refresh Data' : 'View My Data'}
                    </button>
                  </div>
                </div>
              </div>

              {userData && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium mb-3">Your Data</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{userData.user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{userData.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Created:</span>
                      <span className="font-medium">{userData.user?.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium">{userData.user?.lastLogin ? new Date(userData.user.lastLogin).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Sessions:</span>
                      <span className="font-medium">{userData.activeSessions?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">Download My Data</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Export all your data as a JSON file. Includes calendar events, passwords, wishlists, files, and wikis.
                    </p>
                    <button
                      onClick={async () => {
                        setExporting(true);
                        const result = await exportUserData();
                        if (result.success) {
                          showMessage('Data exported successfully');
                        } else {
                          showMessage(result.error, 'error');
                        }
                        setExporting(false);
                      }}
                      disabled={exporting}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {exporting ? 'Exporting...' : 'Download All Data'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-yellow-900">Update Email</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Change your account email address.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const newEmail = formData.get('email');
                        const result = await updateUserData({ email: newEmail });
                        if (result.success) {
                          showMessage('Email updated successfully');
                          setUserData(null);
                        } else {
                          showMessage(result.error, 'error');
                        }
                      }}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        type="email"
                        name="email"
                        placeholder="New email address"
                        required
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Delete Account</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      This will delete: account, settings, calendar events, passwords, wishlists, files, wikis, and social connections.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                      >
                        Delete My Account
                      </button>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <input
                          type="password"
                          placeholder="Enter your password to confirm"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              setDeleting(true);
                              const result = await deleteAccount(deletePassword);
                              if (result.success) {
                                showMessage('Account deleted successfully');
                                logout();
                              } else {
                                showMessage(result.error, 'error');
                              }
                              setDeleting(false);
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                            }}
                            disabled={deleting || !deletePassword}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                          >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button className="reset-btn" onClick={handleReset}>Reset to Defaults</button>
      </div>
    </div>
  );
};

export default Settings;

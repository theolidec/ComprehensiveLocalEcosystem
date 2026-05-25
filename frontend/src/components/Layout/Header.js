import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Shield, User, LogOut, Calendar, Settings, Key, Home, Plus, Download, Upload, Trash2, Gift, FolderOpen, Calculator, Users, BookOpen, CheckSquare, Flame, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendarActions } from '../../contexts/CalendarActionsContext';
import { usePageActions } from '../../contexts/PageActionsContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const profileRef = useRef(null);
  const appsRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, logout, isAuthenticated } = useAuth();
  const {
    onImport,
    onExport,
    onCreateTestEvents,
    onRemoveTestEvents,
    onAddEvent,
    isCalendarPage
  } = useCalendarActions();
  const { toggleSidebar, items: sidebarItems } = usePageActions();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(currentTheme);
    
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(newTheme);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const alIcon = theme === 'dark' ? '/al-icon-dark.png' : '/al-icon.png';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setIsAppsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine the title based on current route
  const getHeaderTitle = () => {
    // Check for all calendar routes
    if (location.pathname.startsWith('/calendar')) {
      return 'Calendar';
    }
    if (location.pathname === '/home') {
      return 'Home';
    }
    if (location.pathname === '/settings') {
      return 'Settings';
    }
    if (location.pathname === '/privacy') {
      return 'Privacy Policy';
    }
    if (location.pathname === '/terms') {
      return 'Terms of Service';
    }
    if (location.pathname === '/cookies') {
      return 'Cookie Policy';
    }
    if (location.pathname === '/passwords') {
      return 'Password Manager';
    }
    if (location.pathname === '/wishlist') {
      return 'My Wishlist';
    }
    if (location.pathname === '/files') {
      return 'My Files';
    }
    if (location.pathname === '/following') {
      return 'User Following';
    }
    if (location.pathname === '/tracker') {
      return 'Daily Tracker';
    }
    if (location.pathname === '/radiation') {
      return 'Radiation Monitor';
    }
    if (location.pathname.startsWith('/wikis')) {
      return 'Wiki';
    }
    return 'Comprehensive Local Ecosystem';
  };

  return (
    <header className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 sticky top-0 z-50">
      <nav className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{getHeaderTitle()}</span>
            </div>
            {isAuthenticated && isHomePage && (
              <div className="hidden sm:block" style={{ paddingLeft: '16px', alignItems: 'center', paddingTop: '2px'}}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary, #111827)', margin: 0, lineHeight: 1}}>
                  Welcome, {user?.name?.split(' ')[0] || 'User'}!
                </h2>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && isCalendarPage && (
              <>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                  ref={fileInputRef}
                  id="header-import-file"
                />
                <label
                  htmlFor="header-import-file"
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </label>
                <button
                  onClick={onExport}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                <button
                  onClick={onCreateTestEvents}
                  className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Test Events</span>
                </button>
                <button
                  onClick={onRemoveTestEvents}
                  className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove Test Events</span>
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                <button
                  onClick={onAddEvent}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Event</span>
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              </>
            )}
            {isAuthenticated && (
              <div className="relative" ref={appsRef}>
                <button
                  onClick={() => setIsAppsOpen(!isAppsOpen)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <img src={alIcon} alt="Apps" className="w-6 h-6" />
                </button>
                {isAppsOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Apps
                    </div>
                    <button
                      onClick={() => navigate('/home')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Calendar</span>
                    </button>
                    <button
                      onClick={() => navigate('/passwords')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Key className="h-4 w-4 text-orange-600" />
                      <span>Password Manager</span>
                    </button>
                    <button
                      onClick={() => navigate('/wishlist')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Gift className="h-4 w-4 text-purple-600" />
                      <span>Wishlist</span>
                    </button>
                    <button
                      onClick={() => navigate('/files')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FolderOpen className="h-4 w-4 text-teal-600" />
                      <span>Files</span>
                    </button>
                    <button
                      onClick={() => navigate('/music')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Flame className="h-4 w-4 text-pink-500" />
                      <span>Music</span>
                    </button>
                    <button
                      onClick={() => navigate('/calculator')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Calculator className="h-4 w-4 text-teal-600" />
                      <span>Calculator</span>
                    </button>
                    <button
                      onClick={() => navigate('/following')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Users className="h-4 w-4 text-pink-600" />
                      <span>Following</span>
                    </button>
                    <button
                      onClick={() => navigate('/tracker')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                      <span>Daily Tracker</span>
                    </button>
                    <button
                      onClick={() => navigate('/wikis')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      <span>Wiki</span>
                    </button>
                    <button
                      onClick={() => navigate('/radiation')}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Activity className="h-4 w-4 text-green-600" />
                      <span>Radiation Monitor</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span>{user?.name}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => { navigate('/passwords'); setIsProfileOpen(false); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Key className="h-4 w-4" />
                      <span>Passwords</span>
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 text-sm font-medium transition-colors">
                  Sign in
                </button>
                <button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Get started
                </button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="px-2 py-3 space-y-0.5">

              {/* Calendar-specific actions */}
              {isAuthenticated && isCalendarPage && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Calendar</div>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Import Events</span>
                  </button>
                  <button
                    onClick={() => { onExport(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Events</span>
                  </button>
                  <button
                    onClick={() => { onAddEvent(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Event</span>
                  </button>
                  <button
                    onClick={() => { onCreateTestEvents(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Test Events</span>
                  </button>
                  <button
                    onClick={() => { onRemoveTestEvents(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Test Events</span>
                  </button>
                </div>
              )}

              {/* Current page sidebar actions */}
              {isAuthenticated && sidebarItems.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</div>
                  {sidebarItems.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => { action.onClick?.(); setIsMenuOpen(false); }}
                      className={`flex items-center space-x-2 w-full px-3 py-2 text-sm rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        action.variant === 'primary' ? 'text-blue-600 dark:text-blue-400' :
                        action.variant === 'danger' ? 'text-red-600 dark:text-red-400' :
                        action.variant === 'success' ? 'text-green-600 dark:text-green-400' :
                        'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {action.icon && <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">{action.icon}</span>}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* App navigation */}
              {isAuthenticated && (
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Apps</div>
                  {[
                    { icon: <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />, label: 'Home', path: '/home' },
                    { icon: <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />, label: 'Calendar', path: '/calendar' },
                    { icon: <Key className="h-4 w-4 text-orange-600" />, label: 'Password Manager', path: '/passwords' },
                    { icon: <Gift className="h-4 w-4 text-purple-600" />, label: 'Wishlist', path: '/wishlist' },
                    { icon: <FolderOpen className="h-4 w-4 text-teal-600" />, label: 'Files', path: '/files' },
                    { icon: <Flame className="h-4 w-4 text-pink-500" />, label: 'Music', path: '/music' },
                    { icon: <Calculator className="h-4 w-4 text-teal-600" />, label: 'Calculator', path: '/calculator' },
                    { icon: <Users className="h-4 w-4 text-pink-600" />, label: 'Following', path: '/following' },
                    { icon: <CheckSquare className="h-4 w-4 text-emerald-600" />, label: 'Daily Tracker', path: '/tracker' },
                    { icon: <BookOpen className="h-4 w-4 text-amber-600" />, label: 'Wiki', path: '/wikis' },
                    { icon: <Activity className="h-4 w-4 text-green-600" />, label: 'Radiation Monitor', path: '/radiation' },
                  ].map((app) => (
                    <button
                      key={app.path}
                      onClick={() => { navigate(app.path); setIsMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                    >
                      {app.icon}
                      <span>{app.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* User account section */}
              <div>
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
                    </div>
                    <button
                      onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium w-full text-left"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-lg text-base font-medium w-full mt-2"
                    >
                      Get started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

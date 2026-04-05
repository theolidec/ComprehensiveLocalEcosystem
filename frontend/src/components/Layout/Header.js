import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Shield, User, LogOut, Calendar, Settings, Key, Home, Plus, Download, Upload, Trash2, Gift, FolderOpen } from 'lucide-react';
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
    return 'Proton';
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
                      onClick={() => window.location.href = '/home'}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/calendar'}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Calendar</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/passwords'}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Key className="h-4 w-4 text-orange-600" />
                      <span>Password Manager</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/wishlist'}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Gift className="h-4 w-4 text-purple-600" />
                      <span>Wishlist</span>
                    </button>
                    <button
                      onClick={() => window.location.href = '/files'}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FolderOpen className="h-4 w-4 text-teal-600" />
                      <span>Files</span>
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
                      onClick={() => { window.location.href = '/passwords'; setIsProfileOpen(false); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Key className="h-4 w-4" />
                      <span>Passwords</span>
                    </button>
                    <button
                      onClick={() => { window.location.href = '/wishlist'; setIsProfileOpen(false); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Wishlist</span>
                    </button>
                    <button
                      onClick={() => { window.location.href = '/settings'; setIsProfileOpen(false); }}
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
                  Get Proton for free
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300">Welcome, {user?.name}</span>
                    </div>
                    <button 
                      onClick={logout}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium w-full text-left">
                      Sign in
                    </button>
                    <button className="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-lg text-base font-medium w-full mt-2">
                      Get Proton for free
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

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CalendarActionsProvider } from './contexts/CalendarActionsContext';
import { PageActionsProvider } from './contexts/PageActionsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WikiProvider } from './contexts/WikiContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthPage from './components/Auth/AuthPage';
import Header from './components/Layout/Header';
import Home from './components/Pages/Home';
import HomeLayoutEditor from './components/Pages/HomeLayoutEditor';
import LandingPage from './components/Pages/LandingPage';
import Footer from './components/Layout/Footer';
import Toast from './components/Layout/Toast';
import CalendarApp from './components/Pages/Calendar';
import Settings from './components/Pages/Settings';
import Privacy from './components/Pages/Privacy';
import Terms from './components/Pages/Terms';
import Cookies from './components/Pages/Cookies';
import CookiePopup from './components/Pages/CookiePopup';
import PasswordManager from './components/Pages/PasswordManager';
import Wishlist from './components/Wishlist/Wishlist';
import PublicWishlistItem from './components/Wishlist/PublicWishlistItem';
import FileManager from './components/Pages/FileManager';
import DocumentViewer from './components/Pages/DocumentViewer';
import DocumentEditor from './components/Pages/DocumentEditor';
import LinkNotFound from './components/Pages/LinkNotFound';
import GeoGebraCalculator from './components/Math/GeoGebraCalculator';
import UserFollowing from './components/Pages/UserFollowing';
import Sidebar from './components/Layout/Sidebar';
import Row from './components/Layout/Row';
import WikiList from './components/Wiki/WikiList';
import WikiView from './components/Wiki/WikiView';
import WikiPageView from './components/Wiki/WikiPageView';
import WikiPageEditor from './components/Wiki/WikiPageEditor';
import WikiPageHistory from './components/Wiki/WikiPageHistory';
import WikiSettings from './components/Wiki/WikiSettings';
import WikiRecentChanges from './components/Wiki/WikiRecentChanges';
import DailyTracker from './components/Tracker/DailyTracker';
import './App.css';
import MusicPage from './components/Pages/Music';
import FloatingMusicPlayer from './components/FloatingMusicPlayer';
import { MusicProvider } from './context/MusicContext';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  // Check cookies first (for login page support)
  const cookies = document.cookie.split(';');
  const themeCookie = cookies.find(c => c.trim().startsWith('theme='));
  let theme = null;
  if (themeCookie) {
    const cookieTheme = themeCookie.split('=')[1];
    if (cookieTheme) theme = cookieTheme;
  }
  // Fallback to localStorage
  if (!theme) {
    theme = localStorage.getItem('theme');
  }
  // Default to light
  if (!theme) return 'light';
  // Resolve 'system' theme to actual theme
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

function RootRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <LandingPage />;
}

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      // Only auto-update if the user has 'system' theme selected
      const currentTheme = localStorage.getItem('theme') || 
        document.cookie.split(';').find(c => c.trim().startsWith('theme='))?.split('=')[1];
      if (currentTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  return (
    <div className="App">
      <CookiePopup />
      <Routes>
        {/* Route redirects */}
        <Route path="/pass" element={<Navigate to="/passwords" replace />} />
        <Route path="/drive" element={<Navigate to="/files" replace />} />

        {/* Auth routes */}
      <Route path="/music" element={<Navigate to="/music/library" replace />} />
        <Route path="/music/library" element={<ProtectedRoute><MusicPage tab="library" /></ProtectedRoute>} />
        <Route path="/music/artists" element={<ProtectedRoute><MusicPage tab="artists" /></ProtectedRoute>} />
        <Route path="/music/discover" element={<ProtectedRoute><MusicPage tab="discover" /></ProtectedRoute>} />
        <Route path="/music/upload" element={<ProtectedRoute><MusicPage tab="upload" /></ProtectedRoute>} />
        <Route path="/login" element={<AuthPage />} />

        {/* Legal routes */}
        <Route path="/privacy" element={<><Header /><Privacy /><Footer /></>} />
        <Route path="/terms" element={<><Header /><Terms /><Footer /></>} />
        <Route path="/cookies" element={<><Header /><Cookies /><Footer /></>} />

        {/* Home route */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                {/* <Sidebar inline /> */}
                <div style={{ flex: 1 }}>
                  <Home />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/home/edit" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                {/* <Sidebar inline /> */}
                <div style={{ flex: 1 }}>
                  <HomeLayoutEditor />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={<Navigate to="/calendar/month" replace />} />
        <Route path="/calendar/:view" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <CalendarApp />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <Settings />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/passwords" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <PasswordManager />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <Wishlist />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/files" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <FileManager />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/files/document/:fileId" element={
          <ProtectedRoute>
            <DocumentViewer />
          </ProtectedRoute>
        } />
        <Route path="/files/document/new" element={
          <ProtectedRoute>
            <DocumentViewer />
          </ProtectedRoute>
        } />
        <Route path="/files/document/edit/new" element={
          <ProtectedRoute>
            <DocumentEditor />
          </ProtectedRoute>
        } />
        <Route path="/files/document/edit/:fileId" element={
          <ProtectedRoute>
            <DocumentEditor />
          </ProtectedRoute>
        } />
        <Route path="/files/shared/:token" element={
          <div key={location.pathname}>
            <Header />
            <div style={{ flex: 1, padding: '24px' }}>
              <FileManager />
            </div>
            <Footer />
          </div>
        } />
        <Route path="/calculator" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <div style={{ flex: 1 }}>
                  <GeoGebraCalculator />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wishlist/shared/:token" element={<PublicWishlistItem />} />
        <Route path="/wikis" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <WikiList />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                  <WikiView />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/new" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                <WikiPageEditor />
              </div>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/:pageSlug" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                  <WikiPageView />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/edit/:pageSlug" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                <WikiPageEditor />
              </div>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/history/:pageSlug" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                <WikiPageHistory />
              </div>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/settings" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <WikiSettings />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/wiki/:slug/recent-changes" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <div style={{ flex: 1, height: 'calc(100vh - 120px)' }}>
                <WikiRecentChanges />
              </div>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/following" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <UserFollowing />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/tracker" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                <Sidebar inline />
                <div style={{ flex: 1 }}>
                  <DailyTracker />
                </div>
              </Row>
              <Footer />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/placeholder" element={
          <>
            <Header />
            <LinkNotFound />
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <MusicProvider>
            <FloatingMusicPlayer />
            <SettingsProvider>
              <WikiProvider>
                <PageActionsProvider>
                  <CalendarActionsProvider>
                    <AppContent />
                    <Toast />
                  </CalendarActionsProvider>
                </PageActionsProvider>
              </WikiProvider>
            </SettingsProvider>
          </MusicProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

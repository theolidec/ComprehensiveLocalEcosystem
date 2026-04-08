import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CalendarActionsProvider } from './contexts/CalendarActionsContext';
import { PageActionsProvider } from './contexts/PageActionsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthPage from './components/Auth/AuthPage';
import Header from './components/Layout/Header';
import Hero from './components/Pages/Hero';
import ProductGrid from './components/Pages/ProductGrid';
import Features from './components/Pages/Features';
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
import LinkNotFound from './components/Pages/LinkNotFound';
import GeoGebraCalculator from './components/Math/GeoGebraCalculator';
import UserFollowing from './components/Pages/UserFollowing';
import Sidebar from './components/Layout/Sidebar';
import Row from './components/Layout/Row';
import './App.css';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  // Check cookies first (for login page support)
  const cookies = document.cookie.split(';');
  const themeCookie = cookies.find(c => c.trim().startsWith('theme='));
  if (themeCookie) {
    const cookieTheme = themeCookie.split('=')[1];
    if (cookieTheme) return cookieTheme;
  }
  // Fallback to localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  return 'light';
};

function AppContent() {
  const location = useLocation();
  
  useEffect(() => {
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <div className="App">
      <CookiePopup />
      <Routes>
        {/* Route redirects */}
        <Route path="/pass" element={<Navigate to="/passwords" replace />} />
        <Route path="/drive" element={<Navigate to="/files" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<AuthPage />} />

        {/* Legal routes */}
        <Route path="/privacy" element={<><Header /><Privacy /><Footer /></>} />
        <Route path="/terms" element={<><Header /><Terms /><Footer /></>} />
        <Route path="/cookies" element={<><Header /><Cookies /><Footer /></>} />

        {/* Home route */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <div key={location.pathname}>
              <Header />
              <Row>
                {/* <Sidebar inline /> */}
                <div style={{ flex: 1 }}>
                  <Hero />
                  <ProductGrid />
                  <Features />
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
          <SettingsProvider>
            <PageActionsProvider>
              <CalendarActionsProvider>
                <AppContent />
                <Toast />
              </CalendarActionsProvider>
            </PageActionsProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

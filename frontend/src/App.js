import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CalendarActionsProvider } from './contexts/CalendarActionsContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthPage from './components/Auth/AuthPage';
import Header from './components/Layout/Header';
import Hero from './components/Pages/Hero';
import ProductGrid from './components/Pages/ProductGrid';
import Features from './components/Pages/Features';
import Footer from './components/Layout/Footer';
import CalendarApp from './components/Pages/Calendar';
import Settings from './components/Pages/Settings';
import Privacy from './components/Pages/Privacy';
import Terms from './components/Pages/Terms';
import Cookies from './components/Pages/Cookies';
import CookiePopup from './components/Pages/CookiePopup';
import PasswordManager from './components/Pages/PasswordManager';
import './App.css';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  useEffect(() => {
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <CalendarActionsProvider>
            <div className="App">
              <CookiePopup />
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/privacy" element={<><Header /><Privacy /><Footer /></>} />
                <Route path="/terms" element={<><Header /><Terms /><Footer /></>} />
                <Route path="/cookies" element={<><Header /><Cookies /><Footer /></>} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={
                  <ProtectedRoute>
                    <div>
                      <Header />
                      <Hero />
                      <ProductGrid />
                      <Features />
                      <Footer />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={<Navigate to="/calendar/month" replace />} />
                <Route path="/calendar/:view" element={
                  <ProtectedRoute>
                    <div>
                      <Header />
                      <CalendarApp />
                      <Footer />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <div>
                      <Header />
                      <Settings />
                      <Footer />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/passwords" element={
                  <ProtectedRoute>
                    <div>
                      <Header />
                      <PasswordManager />
                      <Footer />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </CalendarActionsProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

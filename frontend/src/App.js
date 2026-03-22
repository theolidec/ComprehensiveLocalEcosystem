import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './components/AuthPage';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Features from './components/Features';
import Footer from './components/Footer';
import CalendarApp from './components/Calendar';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<AuthPage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

import React, { useEffect } from 'react';
import { ArrowRight, Shield, Lock, Users, Calendar, Key, Gift, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageActions } from '../../contexts/PageActionsContext';

const Hero = () => {
  const navigate = useNavigate();
  const { registerPageActions, clearPageActions } = usePageActions();

  useEffect(() => {
    registerPageActions([
      {
        icon: <Calendar size={18} />,
        label: 'Calendar',
        onClick: () => navigate('/calendar'),
        variant: 'default'
      },
      {
        icon: <Key size={18} />,
        label: 'Passwords',
        onClick: () => navigate('/passwords'),
        variant: 'default'
      },
      {
        icon: <Gift size={18} />,
        label: 'Wishlist',
        onClick: () => navigate('/wishlist'),
        variant: 'default'
      },
      {
        icon: <Settings size={18} />,
        label: 'Settings',
        onClick: () => navigate('/settings'),
        variant: 'default'
      }
    ]);

    return () => clearPageActions();
  }, [registerPageActions, clearPageActions, navigate]);

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            A better internet starts with
            <span className="text-blue-600 dark:text-blue-400"> privacy and freedom</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Your personal sanctuary for organizing life securely.
            Calendar, passwords, files, and more - all in one private place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center">
              Get started free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 transition-colors">
              Explore all products
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">End-to-end encryption</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your data stays encrypted and private. Only you have the keys to your personal information.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex justify-center mb-4">
                <Lock className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Self-hosted</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Self-hosted and secure. Your data never leaves your control or gets shared with third parties.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Complete ecosystem</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                A complete ecosystem designed for your privacy, productivity, and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

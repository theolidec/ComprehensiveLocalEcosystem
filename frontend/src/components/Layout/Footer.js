import React from 'react';
import { Shield, Github, Twitter, Linkedin, Facebook } from 'lucide-react';
import axios from 'axios';
import { API_URLS } from '../../config/api';

const Footer = () => {
  const handleDebugTimeout = async () => {
    try {
      await axios.post(API_URLS.LOGOUT);
    } catch (e) {
      // Ignore logout errors
    }
    window.location.reload();
  };

  const products = [
    { name: 'Proton Mail', href: '/mail' },
    { name: 'Proton Calendar', href: '/calendar' },
    { name: 'Proton VPN', href: '/vpn' },
    { name: 'Proton Drive', href: '/drive' },
    { name: 'Proton Docs', href: '/docs' },
    { name: 'Proton Pass', href: '/pass' }
  ];

  const company = [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
    { name: 'Security', href: '/security' }
  ];

  const resources = [
    { name: 'Support Center', href: '/support' },
    { name: 'Community', href: '/community' },
    { name: 'Developer API', href: '/api' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Legal', href: '/legal' }
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/protonprivacy', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/ProtonMail', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com/company/proton', label: 'LinkedIn' },
    { icon: Facebook, href: 'https://facebook.com/proton', label: 'Facebook' }
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Proton</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Choose an internet where your privacy comes first. Over 100 million people use Proton to stay private and secure online.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              {products.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {company.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Proton AG. All rights reserved. Based in Switzerland.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <button onClick={handleDebugTimeout} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                [DEBUG: Timeout]
              </button>
              <a href="/settings" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Settings
              </a>
              <a href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

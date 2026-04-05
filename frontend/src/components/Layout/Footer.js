import React from 'react';
import { Shield, Github, Twitter, Linkedin, Facebook, Heart, Mail } from 'lucide-react';
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
    { name: 'Proton Pass', href: '/pass' },
    { name: 'Proton Meet', href: '/meet' }
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
    { icon: Twitter, href: '/placeholder', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/theolidec/ComprehensiveLocalEcosystem', label: 'GitHub' },
    { icon: Linkedin, href: '/placeholder', label: 'LinkedIn' },
    { icon: Facebook, href: '/placeholder', label: 'Facebook' }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ paddingLeft: '2%', paddingRight: '2%' }}>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Proton</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Choose an internet where your privacy comes first. <br />Over 100 million people use Proton to stay private and secure online.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="p-2.5 bg-white dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-6">Products</h3>
            <ul className="space-y-3">
              {products.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-6">Company</h3>
            <ul className="space-y-3">
              {company.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-6">Resources</h3>
            <ul className="space-y-3">
              {resources.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              <span>© 2024 Proton AG. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Based in Switzerland</span>
              <span className="md:hidden">Switzerland</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <button onClick={handleDebugTimeout} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                [DEBUG: Timeout]
              </button>
              <a href="/settings" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Settings
              </a>
              <a href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Terms
              </a>
              <a href="/cookies" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

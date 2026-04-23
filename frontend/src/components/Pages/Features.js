import React from 'react';
import { Shield, Lock, Zap, Eye, Smartphone, Gift, CheckCircle, Award, Users } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: 'End-to-end encryption',
      description: 'Your data is encrypted with AES-256-GCM. Only you hold the keys - not even the server administrator can access your private information.',
      link: '/encryption'
    },
    {
      icon: Lock,
      title: 'Self-hosted',
      description: 'Self-hosted and local-first. Your data stays on your infrastructure with no third-party access or cloud dependencies.',
      link: '/swiss-privacy'
    },
    {
      icon: Zap,
      title: 'Security made easy',
      description: 'Powerful security that works automatically in the background. No technical knowledge required to stay protected.',
      link: '/migration'
    },
    {
      icon: Eye,
      title: 'Open source and audited',
      description: 'All our apps are open source and independently audited by security experts so that anyone can inspect them, use them, and trust them.',
      link: '/open-source'
    },
    {
      icon: Smartphone,
      title: 'One account, any device',
      description: 'Access your calendar, files, passwords, and wishlists from any device. One account, complete control, everywhere you go.',
      link: '/services'
    },
    {
      icon: Gift,
      title: 'Free forever',
      description: 'Privacy is a human right. No ads, no tracking, and your data is never sold. You control everything.',
      link: '/pricing'
    }
  ];


  return (
    <section id="privacy" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            With Comprehensive Local Ecosystem, your data belongs to you
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Not tech companies, governments, or hackers. Privacy isn't a promise, it's mathematically ensured.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                  <a href={feature.link} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center">
                    {feature.link === '/encryption' && 'Discover our encryption'}
                    {feature.link === '/swiss-privacy' && 'About self-hosting'}
                    {feature.link === '/migration' && 'Learn about security'}
                    {feature.link === '/open-source' && 'Open source commitment'}
                    {feature.link === '/services' && 'Explore all features'}
                    {feature.link === '/pricing' && 'Create your free account'}
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

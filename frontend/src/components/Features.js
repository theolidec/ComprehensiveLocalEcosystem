import React from 'react';
import { Shield, Lock, Zap, Eye, Smartphone, Gift, CheckCircle, Award, Users } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: 'End-to-end encryption',
      description: 'Our end-to-end encryption and zero-access encryption mean that no one (not even Proton) has the technical means to access your data without your permission.',
      link: '/encryption'
    },
    {
      icon: Lock,
      title: 'Swiss privacy',
      description: 'Proton is based in Switzerland, and your data does not go to the cloud. Instead, it stays under the protection of some of the world\'s strongest privacy laws.',
      link: '/swiss-privacy'
    },
    {
      icon: Zap,
      title: 'Security made easy',
      description: 'Proton\'s services are so simple and intuitive that anyone can use them. Encryption is automatic and seamless.',
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
      description: 'Access your email, files, calendars, passwords, and VPN anywhere. Get Proton apps on all your devices with one Proton Account.',
      link: '/services'
    },
    {
      icon: Gift,
      title: 'Free forever',
      description: 'Privacy is a human right, so our services are always available for free. Proton has no ads and does not sell your data.',
      link: '/pricing'
    }
  ];

  const stats = [
    { icon: Users, label: 'Users', value: '100M+', description: 'people and businesses' },
    { icon: CheckCircle, label: 'Encryption', value: 'AES-256', description: 'military-grade security' },
    { icon: Award, label: 'Founded', value: '2014', description: 'at CERN, birthplace of the web' },
    { icon: Shield, label: 'Privacy', value: 'Swiss', description: 'strongest privacy laws' }
  ];

  return (
    <section id="privacy" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            With Proton, your data belongs to you
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Not tech companies, governments, or hackers. Privacy isn't a promise, it's mathematically ensured.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="inline-flex p-3 bg-blue-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <a href={feature.link} className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                    {feature.link === '/encryption' && 'Discover Proton\'s encryption'}
                    {feature.link === '/swiss-privacy' && 'About Swiss privacy'}
                    {feature.link === '/migration' && 'Migrate your emails to Proton'}
                    {feature.link === '/open-source' && 'Proton and open source'}
                    {feature.link === '/services' && 'See all Proton services'}
                    {feature.link === '/pricing' && 'Get a free Proton account'}
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-8">Trusted by millions worldwide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-blue-200" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-blue-100">{stat.label}</div>
                <div className="text-xs text-blue-200 mt-1">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

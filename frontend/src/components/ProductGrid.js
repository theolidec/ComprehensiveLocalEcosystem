import React from 'react';
import { Mail, Calendar, Globe, HardDrive, FileText, Key, Smartphone, Brain, Building } from 'lucide-react';

const ProductGrid = () => {
  const products = [
    {
      icon: Mail,
      title: 'Proton Mail',
      description: 'Defeat spam, tracking, and ads with encrypted email.',
      features: ['End-to-end encryption', 'No ads', 'Anonymous usage'],
      cta: 'Get it for free',
      color: 'bg-blue-600'
    },
    {
      icon: Calendar,
      title: 'Proton Calendar',
      description: 'Organize your schedule privately with encrypted calendar.',
      features: ['Encrypted events', 'Shared calendars', 'Privacy by default'],
      cta: 'Explore Calendar',
      color: 'bg-indigo-600'
    },
    {
      icon: Globe,
      title: 'Proton VPN',
      description: 'Browse privately and access content from anywhere.',
      features: ['High-speed servers', 'No logs policy', 'Kill switch'],
      cta: 'Get Proton VPN',
      color: 'bg-green-600'
    },
    {
      icon: HardDrive,
      title: 'Proton Drive',
      description: 'Store, share, and collaborate securely with encrypted cloud storage.',
      features: ['End-to-end encrypted', 'File sharing', 'Version history'],
      cta: 'Explore Drive',
      color: 'bg-purple-600'
    },
    {
      icon: FileText,
      title: 'Proton Docs',
      description: 'Create and edit documents with privacy-focused collaboration.',
      features: ['Real-time collaboration', 'Encrypted editing', 'Rich formatting'],
      cta: 'Try Docs',
      color: 'bg-orange-600'
    },
    {
      icon: Key,
      title: 'Proton Pass',
      description: 'Defend your digital life from hackers with a secure password manager.',
      features: ['Password generator', '2FA support', 'Secure sharing'],
      cta: 'Get Pass',
      color: 'bg-red-600'
    },
    {
      icon: Smartphone,
      title: 'Proton Authenticator',
      description: 'Secure your accounts with privacy-focused 2FA authentication.',
      features: ['TOTP support', 'Encrypted storage', 'Easy backup'],
      cta: 'Get Authenticator',
      color: 'bg-teal-600'
    },
    {
      icon: Brain,
      title: 'Lumo by Proton',
      description: 'Powerful AI that respects your privacy.',
      features: ['Privacy-preserving AI', 'No data training', 'Secure processing'],
      cta: 'Try Lumo',
      color: 'bg-pink-600'
    },
    {
      icon: Building,
      title: 'Proton for Business',
      description: 'Protect your business with easy-to-use encrypted solutions.',
      features: ['Team management', 'Custom domains', 'Priority support'],
      cta: 'Explore Business',
      color: 'bg-gray-700'
    }
  ];

  return (
    <section id="products" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            All your digital life, secured
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From email to VPN, passwords to documents - everything you need to stay private and secure online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className={`inline-flex p-3 rounded-lg ${product.color} mb-4`}>
                <product.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.title}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <ul className="space-y-2 mb-6">
                {product.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className={`w-full ${product.color} text-white hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity`}>
                {product.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

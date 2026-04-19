import React from 'react';
import { Calendar, HardDrive, Key, Gift, Calculator, Users } from 'lucide-react';

const ProductGrid = () => {
  const products = [
    {
      icon: Calendar,
      title: 'Calendar',
      description: 'Organize your schedule with a private, encrypted calendar.',
      features: ['Event management', 'Recurring events', 'Import/Export'],
      cta: 'Explore Calendar',
      link: '/calendar',
      color: 'bg-indigo-600'
    },
    {
      icon: Key,
      title: 'Password Manager',
      description: 'Secure your digital life with military-grade encryption.',
      features: ['AES-256-GCM encryption', 'Password generator', 'Organize by category'],
      cta: 'Manage Passwords',
      link: '/passwords',
      color: 'bg-red-600'
    },
    {
      icon: HardDrive,
      title: 'File Storage',
      description: 'Store and organize your files with secure local storage.',
      features: ['Folder organization', 'Document editor', 'Up to 500MB files'],
      cta: 'Explore Files',
      link: '/files',
      color: 'bg-purple-600'
    },
    {
      icon: Gift,
      title: 'Wishlist',
      description: 'Create and share wishlists with friends and family.',
      features: ['Public/Private items', 'Reservation system', 'Multi-currency support'],
      cta: 'View Wishlist',
      link: '/wishlist',
      color: 'bg-pink-600'
    },
    {
      icon: Calculator,
      title: 'Calculator',
      description: 'Interactive graphing calculator for mathematical visualization.',
      features: ['Function plotting', 'Geometric shapes', 'Save states'],
      cta: 'Try Calculator',
      link: '/calculator',
      color: 'bg-teal-600'
    },
    {
      icon: Users,
      title: 'Social Features',
      description: 'Connect with others while keeping your data private.',
      features: ['User following', 'Public profiles', 'Item sharing'],
      cta: 'Explore Social',
      link: '/following',
      color: 'bg-blue-600'
    }
  ];

  return (
    <section id="products" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            All your digital life, secured
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Calendar, passwords, files, wishlists, and more - everything you need to stay organized, private, and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
              <div className={`inline-flex p-3 rounded-lg ${product.color} mb-4`}>
                <product.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{product.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{product.description}</p>
              <ul className="space-y-2 mb-6">
                {product.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              {product.link ? (
                <a href={product.link} className={`w-full ${product.color} text-white hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity block text-center`}>
                  {product.cta}
                </a>
              ) : (
                <button className={`w-full ${product.color} text-white hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity`}>
                  {product.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

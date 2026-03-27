import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Palette } from 'lucide-react';
import categoryAPI from '../../services/categoryAPI';

const CategoryManager = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: '📅'
  });

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  const iconOptions = [
    '📅', '💼', '👤', '🎉', '🏥', '📚', '✈️', '🎯', '💡', '🔔',
    '📝', '🏃', '🍔', '🎬', '🛍️', '🎮', '📱', '💻', '🏠', '🚗'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await categoryAPI.getCategories();
      setCategories(fetchedCategories);
      if (onCategoryChange) {
        onCategoryChange(fetchedCategories);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingCategory) {
        const updated = await categoryAPI.updateCategory(editingCategory._id, formData);
        setCategories(prev => prev.map(cat => 
          cat._id === editingCategory._id ? updated : cat
        ));
      } else {
        const newCategory = await categoryAPI.createCategory(formData);
        setCategories(prev => [...prev, newCategory]);
      }

      resetForm();
      if (onCategoryChange) {
        onCategoryChange(categories);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryAPI.deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat._id !== categoryId));
      if (onCategoryChange) {
        onCategoryChange(categories.filter(cat => cat._id !== categoryId));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', color: '#3B82F6', icon: '📅' });
    setEditingCategory(null);
    setShowAddForm(false);
    setError('');
  };

  const filteredCategories = categories.filter(cat => !cat.isDefault);
  const defaultCategories = categories.filter(cat => cat.isDefault);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`p-2 text-lg border rounded ${
                      formData.icon === icon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategory ? 'Update' : 'Create'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Default Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Categories</h4>
        <div className="space-y-2">
          {defaultCategories.map(category => (
            <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{category.icon} {category.name}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Built-in</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Categories</h4>
        {filteredCategories.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No custom categories yet</p>
        ) : (
          <div className="space-y-2">
            {filteredCategories.map(category => (
              <div key={category._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{category.icon} {category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;

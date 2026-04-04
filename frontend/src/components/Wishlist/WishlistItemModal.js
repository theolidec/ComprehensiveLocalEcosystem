import React, { useState, useEffect } from 'react';
import { X, Link, Image, DollarSign, Star, Tag, Check, Loader2, Plus } from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';
import { wishlistCategoryAPI } from '../../services/wishlistCategoryAPI';

const priorities = [
  { value: 'must-have', label: 'Must Have', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#6b7280' }
];

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NOK', 'SEK', 'DKK'];

const colorOptions = [
  '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#06b6d4', '#6366f1', '#84cc16', '#f97316'
];

export default function WishlistItemModal({ isOpen, onClose, item, onSave, categories = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    price: '',
    currency: 'USD',
    priority: 'medium',
    category: '',
    imageUrl: '',
    isPublic: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#8b5cf6' });
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        url: item.url || '',
        price: item.price || '',
        currency: item.currency || 'USD',
        priority: item.priority || 'medium',
        category: item.category || (categories[0]?.name || ''),
        imageUrl: item.imageUrl || '',
        isPublic: item.isPublic || false
      });
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        price: '',
        currency: 'USD',
        priority: 'medium',
        category: categories[0]?.name || '',
        imageUrl: '',
        isPublic: false
      });
    }
    setShowNewCategory(false);
    setNewCategory({ name: '', color: '#8b5cf6' });
  }, [item, isOpen, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalize URLs - add https:// if missing
      const normalizeUrl = (url) => {
        if (!url) return '';
        url = url.trim();
        if (url && !url.match(/^https?:\/\//i)) {
          return 'https://' + url;
        }
        return url;
      };

      const data = {
        ...formData,
        url: normalizeUrl(formData.url),
        imageUrl: normalizeUrl(formData.imageUrl),
        price: formData.price ? parseFloat(formData.price) : null
      };

      if (item) {
        await wishlistAPI.updateItem(item._id, data);
      } else {
        await wishlistAPI.createItem(data);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createNewCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    setCreatingCategory(true);
    try {
      const category = await wishlistCategoryAPI.createCategory({
        name: newCategory.name.trim(),
        color: newCategory.color,
        icon: 'gift'
      });
      
      // Update form to use new category
      handleChange('category', category.name);
      setShowNewCategory(false);
      setNewCategory({ name: '', color: '#8b5cf6' });
      
      // Refresh categories via parent
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wishlist-modal-overlay" onClick={onClose}>
      <div className="wishlist-modal" onClick={e => e.stopPropagation()}>
        <div className="wishlist-modal-header">
          <div className="wishlist-modal-title">
            <div className="wishlist-modal-icon">
              {item ? <Star size={20} /> : <Tag size={20} />}
            </div>
            <h2>{item ? 'Edit Item' : 'Add New Item'}</h2>
          </div>
          <button className="wishlist-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="wishlist-form">
          {error && (
            <div className="wishlist-form-error">
              <span>{error}</span>
            </div>
          )}

          <div className="wishlist-form-row">
            <div className="wishlist-form-group">
              <label className="wishlist-label">
                <Tag size={14} />
                Title *
              </label>
              <input
                type="text"
                className="wishlist-input"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="What do you want?"
                required
              />
            </div>
          </div>

          <div className="wishlist-form-row">
            <div className="wishlist-form-group">
              <label className="wishlist-label">
                <Star size={14} />
                Category
              </label>
              <div className="wishlist-priority-options">
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    type="button"
                    className={`priority-option ${formData.category === cat.name ? 'active' : ''}`}
                    style={{
                      backgroundColor: formData.category === cat.name ? cat.color + '20' : '',
                      borderColor: formData.category === cat.name ? cat.color : '',
                      color: formData.category === cat.name ? cat.color : ''
                    }}
                    onClick={() => handleChange('category', cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="priority-option new-category-btn"
                  onClick={() => setShowNewCategory(true)}
                >
                  <Plus size={14} />
                  New
                </button>
              </div>
              
              {showNewCategory && (
                <div className="new-category-form">
                  <div className="new-category-inputs">
                    <input
                      type="text"
                      className="wishlist-input"
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      maxLength={50}
                    />
                    <div className="color-picker">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`color-option ${newCategory.color === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategory({ ...newCategory, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="new-category-actions">
                    <button
                      type="button"
                      className="wishlist-btn small"
                      onClick={createNewCategory}
                      disabled={creatingCategory || !newCategory.name.trim()}
                    >
                      {creatingCategory ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                      Create
                    </button>
                    <button
                      type="button"
                      className="wishlist-btn cancel small"
                      onClick={() => setShowNewCategory(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="wishlist-form-row two-col">
            <div className="wishlist-form-group">
              <label className="wishlist-label">
                <DollarSign size={14} />
                Price
              </label>
              <div className="wishlist-price-input">
                <input
                  type="number"
                  className="wishlist-input"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <select
                  className="wishlist-select currency"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="wishlist-form-group">
              <label className="wishlist-label">
                <Star size={14} />
                Priority
              </label>
              <select
                className="wishlist-select full"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                {priorities.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="wishlist-form-group">
            <label className="wishlist-label">
              <Link size={14} />
              Product URL
            </label>
            <input
              type="url"
              className="wishlist-input"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="wishlist-form-group">
            <label className="wishlist-label">
              <Image size={14} />
              Image URL
            </label>
            <input
              type="url"
              className="wishlist-input"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="wishlist-form-group">
            <label className="wishlist-label">Description</label>
            <textarea
              className="wishlist-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add details about this item..."
              rows={3}
            />
          </div>

          <div className="wishlist-form-group checkbox">
            <label className="wishlist-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleChange('isPublic', e.target.checked)}
              />
              <span>Make this item public (others can view and reserve it)</span>
            </label>
          </div>

          <div className="wishlist-modal-actions">
            <button type="button" className="wishlist-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="wishlist-btn submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  {item ? 'Update Item' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, X, Copy, Check, Lock, User, Globe, FileText, Shield, Sparkles } from 'lucide-react';
import passwordAPI from '../../services/passwordAPI';

const PasswordManager = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    category: 'other',
    notes: '',
    isFavorite: false
  });

  const categories = [
    { value: 'social', label: 'Social', icon: '👥', color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { value: 'finance', label: 'Finance', icon: '💳', color: '#10B981', gradient: 'from-emerald-500 to-emerald-600' },
    { value: 'work', label: 'Work', icon: '💼', color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
    { value: 'shopping', label: 'Shopping', icon: '🛒', color: '#EF4444', gradient: 'from-red-500 to-red-600' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#8B5CF6', gradient: 'from-violet-500 to-violet-600' },
    { value: 'other', label: 'Other', icon: '📁', color: '#6B7280', gradient: 'from-gray-500 to-gray-600' }
  ];

  useEffect(() => {
    fetchPasswords();
  }, [categoryFilter, searchTerm, showFavorites]);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;
      if (showFavorites) params.favorite = true;
      
      const data = await passwordAPI.getAllPasswords(params);
      setPasswords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingPassword) {
        const updated = await passwordAPI.updatePassword(editingPassword._id, formData);
        setPasswords(prev => prev.map(p => p._id === editingPassword._id ? updated : p));
      } else {
        const newPassword = await passwordAPI.createPassword(formData);
        setPasswords(prev => [newPassword, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      await passwordAPI.deletePassword(id);
      setPasswords(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const updated = await passwordAPI.toggleFavorite(id);
      setPasswords(prev => prev.map(p => p._id === id ? updated : p));
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = async (id) => {
    if (visiblePasswords[id]) {
      setVisiblePasswords(prev => ({ ...prev, [id]: false }));
    } else {
      try {
        const decrypted = await passwordAPI.decryptPassword(id);
        setVisiblePasswords(prev => ({ ...prev, [id]: decrypted }));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const copyToClipboard = async (id) => {
    try {
      const decrypted = await passwordAPI.decryptPassword(id);
      await navigator.clipboard.writeText(decrypted);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openModal = (password = null) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        title: password.title,
        username: password.username || '',
        password: '',
        website: password.website || '',
        category: password.category || 'other',
        notes: password.notes || '',
        isFavorite: password.isFavorite || false
      });
    } else {
      setEditingPassword(null);
      setFormData({
        title: '',
        username: '',
        password: '',
        website: '',
        category: 'other',
        notes: '',
        isFavorite: false
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPassword(null);
    setFormData({
      title: '',
      username: '',
      password: '',
      website: '',
      category: 'other',
      notes: '',
      isFavorite: false
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      social: '#3B82F6',
      finance: '#10B981',
      work: '#F59E0B',
      shopping: '#EF4444',
      entertainment: '#8B5CF6',
      other: '#6B7280'
    };
    return colors[category] || colors.other;
  };

  const getCategoryGradient = (category) => {
    const gradients = {
      social: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      finance: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      work: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      shopping: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      entertainment: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      other: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)'
    };
    return gradients[category] || gradients.other;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      social: '👥',
      finance: '💳',
      work: '💼',
      shopping: '🛒',
      entertainment: '🎮',
      other: '📁'
    };
    return icons[category] || icons.other;
  };

  return (
    <div className="pm-container">
      <div className="pm-hero">
        <div className="pm-hero-content">
          <div className="pm-hero-icon">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="pm-title">Password Manager</h1>
            <p className="pm-subtitle">Securely store and manage your passwords</p>
          </div>
        </div>
        <button className="pm-add-btn" onClick={() => openModal()}>
          <Plus size={20} />
          Add Password
        </button>
      </div>

      <div className="pm-filters">
        <div className="pm-search-container">
          <Search size={18} className="pm-search-icon" />
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pm-search-input"
          />
          {searchTerm && (
            <button className="pm-search-clear" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="pm-filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pm-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
          
          <button 
            className={`pm-favorites-btn ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Star size={18} fill={showFavorites ? '#F59E0B' : 'none'} />
            Favorites
          </button>
        </div>
      </div>

      {error && (
        <div className="pm-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="pm-error-close">×</button>
        </div>
      )}

      {loading && passwords.length === 0 ? (
        <div className="pm-loading">
          <div className="pm-spinner"></div>
          <p>Loading passwords...</p>
        </div>
      ) : passwords.length === 0 ? (
        <div className="pm-empty">
          <div className="pm-empty-icon">
            <Sparkles size={48} />
          </div>
          <h3>No passwords found</h3>
          <p>{searchTerm || categoryFilter || showFavorites ? 'Try adjusting your filters' : 'Add your first password to get started!'}</p>
          {!searchTerm && !categoryFilter && !showFavorites && (
            <button className="pm-empty-btn" onClick={() => openModal()}>
              <Plus size={18} />
              Add Password
            </button>
          )}
        </div>
      ) : (
        <div className="pm-grid">
          {passwords.map((password, index) => (
            <div 
              key={password._id} 
              className="pm-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div 
                className="pm-card-accent" 
                style={{ background: getCategoryGradient(password.category) }}
              />
              <div className="pm-card-content">
                <div className="pm-card-header">
                  <div className="pm-card-title-row">
                    <div className="pm-card-icon" style={{ background: getCategoryGradient(password.category) }}>
                      {getCategoryIcon(password.category)}
                    </div>
                    <div className="pm-card-title-group">
                      <h3 className="pm-card-title">{password.title}</h3>
                      <span 
                        className="pm-category-badge"
                        style={{ 
                          backgroundColor: getCategoryColor(password.category) + '15',
                          color: getCategoryColor(password.category)
                        }}
                      >
                        {password.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(password._id)}
                      className="pm-favorite-btn"
                    >
                      {password.isFavorite ? <Star size={18} fill="#F59E0B" color="#F59E0B" /> : <StarOff size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pm-card-fields">
                  {password.username && (
                    <div className="pm-field">
                      <User size={14} className="pm-field-icon" />
                      <span className="pm-field-value">{password.username}</span>
                    </div>
                  )}

                  {password.website && (
                    <div className="pm-field">
                      <Globe size={14} className="pm-field-icon" />
                      <span className="pm-field-value pm-field-url">{password.website}</span>
                    </div>
                  )}

                  <div className="pm-password-row">
                    <Lock size={14} className="pm-field-icon" />
                    <div className="pm-password-display">
                      <span className="pm-password-dots">
                        {visiblePasswords[password._id] ? visiblePasswords[password._id] : '••••••••••••'}
                      </span>
                      <div className="pm-password-actions">
                        <button
                          onClick={() => togglePasswordVisibility(password._id)}
                          className="pm-icon-btn"
                          title={visiblePasswords[password._id] ? 'Hide' : 'Show'}
                        >
                          {visiblePasswords[password._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(password._id)}
                          className="pm-icon-btn"
                          title="Copy"
                        >
                          {copiedId === password._id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {password.notes && (
                    <div className="pm-field pm-field-notes">
                      <FileText size={14} className="pm-field-icon" />
                      <span className="pm-field-value">{password.notes.substring(0, 60)}{password.notes.length > 60 ? '...' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="pm-card-actions">
                  <button onClick={() => openModal(password)} className="pm-edit-btn">
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(password._id)} className="pm-delete-btn">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="pm-modal-overlay" onClick={closeModal}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <div className="pm-modal-title-group">
                <div className="pm-modal-icon">
                  <Shield size={20} />
                </div>
                <h2>{editingPassword ? 'Edit Password' : 'Add New Password'}</h2>
              </div>
              <button onClick={closeModal} className="pm-modal-close"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="pm-form">
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">
                    <Lock size={14} />
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="pm-input"
                    placeholder="e.g., Gmail, Netflix"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">
                    <User size={14} />
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pm-input"
                    placeholder="username or email"
                  />
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  <Lock size={14} />
                  Password {editingPassword ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pm-input"
                  placeholder={editingPassword ? '••••••••' : 'Enter password'}
                  required={!editingPassword}
                />
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">
                    <Globe size={14} />
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="pm-input"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="pm-select"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  <FileText size={14} />
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="pm-textarea"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="pm-form-group">
                <label className="pm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                    className="pm-checkbox"
                  />
                  <Star size={16} fill={formData.isFavorite ? '#F59E0B' : 'none'} color={formData.isFavorite ? '#F59E0B' : '#6B7280'} />
                  Mark as favorite
                </label>
              </div>

              <div className="pm-modal-actions">
                <button type="button" onClick={closeModal} className="pm-cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="pm-submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="pm-btn-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      {editingPassword ? 'Update Password' : 'Save Password'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordManager;


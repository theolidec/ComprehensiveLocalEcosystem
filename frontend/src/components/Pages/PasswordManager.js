import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, X, Copy, Check } from 'lucide-react';
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
    { value: 'social', label: 'Social' },
    { value: 'finance', label: 'Finance' },
    { value: 'work', label: 'Work' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchPasswords();
  }, [categoryFilter, searchTerm]);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;
      
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Password Manager</h1>
        <button style={styles.addButton} onClick={() => openModal()}>
          <Plus size={20} />
          Add Password
        </button>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.errorClose}>×</button>
        </div>
      )}

      {loading && passwords.length === 0 ? (
        <div style={styles.loading}>Loading passwords...</div>
      ) : passwords.length === 0 ? (
        <div style={styles.empty}>
          <p>No passwords found. Add your first password to get started!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {passwords.map(password => (
            <div key={password._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardTitle}>{password.title}</h3>
                  <button
                    onClick={() => handleToggleFavorite(password._id)}
                    style={styles.favoriteButton}
                  >
                    {password.isFavorite ? <Star size={18} fill="#F59E0B" color="#F59E0B" /> : <StarOff size={18} />}
                  </button>
                </div>
                <span style={{
                  ...styles.categoryBadge,
                  backgroundColor: getCategoryColor(password.category) + '20',
                  color: getCategoryColor(password.category)
                }}>
                  {password.category}
                </span>
              </div>

              {password.username && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Username:</span>
                  <span style={styles.fieldValue}>{password.username}</span>
                </div>
              )}

              {password.website && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Website:</span>
                  <span style={styles.fieldValue}>{password.website}</span>
                </div>
              )}

              <div style={styles.passwordRow}>
                <span style={styles.fieldLabel}>Password:</span>
                <div style={styles.passwordActions}>
                  <span style={styles.passwordDots}>••••••••</span>
                  <button
                    onClick={() => togglePasswordVisibility(password._id)}
                    style={styles.iconButton}
                  >
                    {visiblePasswords[password._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(password._id)}
                    style={styles.iconButton}
                  >
                    {copiedId === password._id ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {password.notes && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Notes:</span>
                  <span style={styles.fieldValue}>{password.notes.substring(0, 50)}{password.notes.length > 50 ? '...' : ''}</span>
                </div>
              )}

              <div style={styles.cardActions}>
                <button onClick={() => openModal(password)} style={styles.editButton}>
                  <Edit2 size={16} />
                  Edit
                </button>
                <button onClick={() => handleDelete(password._id)} style={styles.deleteButton}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{editingPassword ? 'Edit Password' : 'Add New Password'}</h2>
              <button onClick={closeModal} style={styles.closeButton}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password {editingPassword ? '(leave empty to keep current)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={styles.input}
                  required={!editingPassword}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  style={styles.input}
                  placeholder="https://example.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.select}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={styles.textarea}
                  rows={3}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isFavorite}
                    onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                    style={styles.checkbox}
                  />
                  Mark as favorite
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? 'Saving...' : (editingPassword ? 'Update' : 'Add Password')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px'
  },
  searchContainer: {
    flex: 1,
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9CA3AF'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    minWidth: '150px'
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    color: '#DC2626',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#DC2626'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#6B7280'
  },
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    marginBottom: '16px'
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  favoriteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  field: {
    marginBottom: '12px'
  },
  fieldLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px'
  },
  fieldValue: {
    fontSize: '14px',
    color: '#1F2937'
  },
  passwordRow: {
    marginBottom: '12px'
  },
  passwordActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  passwordDots: {
    fontSize: '14px',
    color: '#1F2937'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#6B7280'
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB'
  },
  editButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151'
  },
  deleteButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#FEE2E2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#DC2626'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280'
  },
  form: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3B82F6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'white',
    fontWeight: '500'
  }
};

export default PasswordManager;

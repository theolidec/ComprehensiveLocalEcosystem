import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Search, X, Copy, Check, Lock, User, Globe, FileText, Shield, Sparkles, RefreshCw, Settings, Download, Upload, CreditCard, MapPin, Mail } from 'lucide-react';
import passwordAPI from '../../services/passwordAPI';
import { paymentCardAPI } from '../../services/paymentCardAPI';
import { usePageActions } from '../../contexts/PageActionsContext';

const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Enter password', color: '#6B7280', width: '0%' };
  
  let entropy = 0;
  const length = password.length;
  
  if (password.match(/[a-z]/)) entropy += 26;
  if (password.match(/[A-Z]/)) entropy += 26;
  if (password.match(/[0-9]/)) entropy += 10;
  if (password.match(/[^a-zA-Z0-9]/)) entropy += 32;
  
  const bits = Math.log2(Math.pow(entropy, length));
  
  let score, label, color, width;
  if (bits < 28) {
    score = 1; label = 'Very Weak'; color = '#EF4444'; width = '20%';
  } else if (bits < 36) {
    score = 2; label = 'Weak'; color = '#F97316'; width = '40%';
  } else if (bits < 60) {
    score = 3; label = 'Fair'; color = '#EAB308'; width = '60%';
  } else if (bits < 80) {
    score = 4; label = 'Strong'; color = '#22C55E'; width = '80%';
  } else {
    score = 5; label = 'Very Strong'; color = '#10B981'; width = '100%';
  }
  
  return { score, label, color, width, bits: Math.round(bits) };
};

const generatePassword = (length = 16, options = {}) => {
  const { uppercase = true, lowercase = true, numbers = true, symbols = true } = options;
  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
};

const PasswordManager = () => {
  const { registerPageActions, clearPageActions } = usePageActions();
  const fileInputRef = useRef(null);
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
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Enter password', color: '#6B7280', width: '0%', bits: 0 });
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isLocked, setIsLocked] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📁', color: '#6B7280' });

  const [activeTab, setActiveTab] = useState('passwords');
  const [cards, setCards] = useState([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [visibleCards, setVisibleCards] = useState({});
  const [cardFilter, setCardFilter] = useState('');
  const [showCardFavorites, setShowCardFavorites] = useState(false);
  const [cardViewMode, setCardViewMode] = useState('visual');

  const [cardFormData, setCardFormData] = useState({
    cardName: '',
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardType: 'other',
    billingAddress: '',
    isDefault: false
  });

  const [formData, setFormData] = useState({
    title: '',
    username: '',
    email: '',
    password: '',
    website: '',
    category: 'other',
    notes: '',
    isFavorite: false
  });

  const categories = customCategories.length > 0 
    ? customCategories.map(c => ({ 
        value: c.name.toLowerCase(), 
        label: c.name, 
        icon: c.icon, 
        color: c.color,
        gradient: `linear-gradient(135deg, ${c.color} 0%, ${c.color}dd 100%)`
      }))
    : [
        { value: 'social', label: 'Social', icon: '👥', color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
        { value: 'finance', label: 'Finance', icon: '💳', color: '#10B981', gradient: 'from-emerald-500 to-emerald-600' },
        { value: 'work', label: 'Work', icon: '💼', color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
        { value: 'shopping', label: 'Shopping', icon: '🛒', color: '#EF4444', gradient: 'from-red-500 to-red-600' },
        { value: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#8B5CF6', gradient: 'from-violet-500 to-violet-600' },
        { value: 'other', label: 'Other', icon: '📁', color: '#6B7280', gradient: 'from-gray-500 to-gray-600' }
      ];

  useEffect(() => {
    fetchPasswords();
    fetchCategories();
  }, [categoryFilter, searchTerm, showFavorites]);

  useEffect(() => {
    if (activeTab === 'cards') {
      fetchCards();
    }
  }, [activeTab, cardFilter, showCardFavorites]);

  useEffect(() => {
    registerPageActions([
      {
        icon: <Plus size={18} />,
        label: 'Add Password',
        onClick: () => {
          setEditingPassword(null);
          setFormData({
            title: '',
            username: '',
            email: '',
            password: '',
            website: '',
            category: 'other',
            notes: '',
            isFavorite: false
          });
          setShowModal(true);
        },
        variant: 'primary'
      },
      {
        icon: <Sparkles size={18} />,
        label: 'Password Generator',
        onClick: () => setShowGenerator(true),
        closeOnClick: false
      },
      {
        icon: <Upload size={18} />,
        label: 'Import',
        onClick: () => fileInputRef.current?.click(),
        closeOnClick: false
      },
      {
        icon: <Download size={18} />,
        label: 'Export',
        onClick: handleExport,
        closeOnClick: false
      }
    ]);

    return () => clearPageActions();
  }, [registerPageActions, clearPageActions]);

  useEffect(() => {
    const checkLock = () => {
      const inactiveMinutes = (Date.now() - lastActivity) / 1000 / 60;
      if (inactiveMinutes >= autoLockTimeout && !isLocked) {
        setIsLocked(true);
        setVisiblePasswords({});
      }
    };
    
    const interval = setInterval(checkLock, 10000);
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const updateActivity = () => setLastActivity(Date.now());
    activityEvents.forEach(event => window.addEventListener(event, updateActivity));
    
    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, [lastActivity, autoLockTimeout, isLocked]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

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

  const fetchCategories = async () => {
    try {
      const data = await passwordAPI.getCategories();
      setCustomCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    try {
      await passwordAPI.createCategory(newCategory);
      setNewCategory({ name: '', icon: '📁', color: '#6B7280' });
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await passwordAPI.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params = {};
      if (cardFilter) params.cardType = cardFilter;
      if (showCardFavorites) params.favorite = true;

      const data = await paymentCardAPI.getAllCards(params);
      setCards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingCard) {
        const updated = await paymentCardAPI.updateCard(editingCard._id, cardFormData);
        setCards(prev => prev.map(c => c._id === editingCard._id ? updated : c));
      } else {
        const newCard = await paymentCardAPI.createCard(cardFormData);
        setCards(prev => [newCard, ...prev]);
      }
      closeCardModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      await paymentCardAPI.deleteCard(id);
      setCards(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCardFavorite = async (id) => {
    try {
      const updated = await paymentCardAPI.toggleFavorite(id);
      setCards(prev => prev.map(c => c._id === id ? updated : c));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCardVisibility = async (id) => {
    if (visibleCards[id]) {
      setVisibleCards(prev => ({ ...prev, [id]: null }));
    } else {
      try {
        const decrypted = await paymentCardAPI.decryptCard(id);
        setVisibleCards(prev => ({ ...prev, [id]: decrypted }));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleSetDefaultCard = async (id) => {
    try {
      const updated = await paymentCardAPI.setDefaultCard(id);
      setCards(prev => prev.map(c => c._id === id ? updated : { ...c, isDefault: false }));
    } catch (err) {
      setError(err.message);
    }
  };

  const openCardModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      setCardFormData({
        cardName: card.cardName || '',
        cardholderName: card.cardholderName || '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardType: card.cardType || 'other',
        billingAddress: card.billingAddress || '',
        isDefault: card.isDefault || false
      });
    } else {
      setEditingCard(null);
      setCardFormData({
        cardName: '',
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardType: 'other',
        billingAddress: '',
        isDefault: false
      });
    }
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setShowCardModal(false);
    setEditingCard(null);
    setCardFormData({
      cardName: '',
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardType: 'other',
      billingAddress: '',
      isDefault: false
    });
  };

  const getCardTypeColor = (cardType) => {
    const colors = {
      visa: '#1A1F71',
      mastercard: '#EB001B',
      amex: '#006FCF',
      discover: '#FF6000',
      other: '#6B7280'
    };
    return colors[cardType] || colors.other;
  };

  const getCardTypeIcon = (cardType) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      other: '💳'
    };
    return icons[cardType] || icons.other;
  };

  const adjustColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const formatCardNumber = (number, showFull = false) => {
    if (!number) return '•••• •••• •••• ••••';
    const cleaned = number.replace(/\s/g, '');
    if (showFull) {
      return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    }
    const masked = '•'.repeat(cleaned.length - 4) + cleaned.slice(-4);
    return masked.match(/.{1,4}/g)?.join(' ') || masked;
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

  const handleExport = async () => {
    try {
      await passwordAPI.exportPasswordsCSV();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;

      try {
        let result;
        if (isCSV) {
          // CSV import
          result = await passwordAPI.importPasswordsCSV(content);
        } else {
          // JSON import
          const data = JSON.parse(content);
          if (data.passwords && Array.isArray(data.passwords)) {
            result = await passwordAPI.importPasswords({ passwords: data.passwords });
          } else {
            setError('Invalid backup file format');
            setLoading(false);
            return;
          }
        }
        setError('');
        fetchPasswords();
        if (activeTab === 'cards') {
          fetchCards();
        }
        alert(result.message);
      } catch (err) {
        setError(err.message || 'Import failed');
      } finally {
        setLoading(false);
        // Reset the file input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const openModal = (password = null) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        title: password.title,
        username: password.username || '',
        email: password.email || '',
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
        email: '',
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
            <p className="pm-subtitle">Securely store and manage your passwords and payment cards</p>
          </div>
        </div>
        <div className="pm-tabs">
          <button
            className={`pm-tab ${activeTab === 'passwords' ? 'active' : ''}`}
            onClick={() => setActiveTab('passwords')}
          >
            <Lock size={18} />
            Passwords
          </button>
          <button
            className={`pm-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            <CreditCard size={18} />
            Payment Cards
          </button>
        </div>
        {activeTab === 'passwords' ? (
          <>
            <button className="pm-add-btn" onClick={() => openModal()}>
              <Plus size={20} />
              Add Password
            </button>
            <div className="pm-hero-actions">
              <button className="pm-export-btn" onClick={handleExport} title="Export passwords">
                <Download size={18} />
                Export
              </button>
              <label className="pm-import-btn">
                <Upload size={18} />
                Import
                <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>
            </div>
          </>
        ) : (
          <>
            <button className="pm-add-btn" onClick={() => openCardModal()}>
              <Plus size={20} />
              Add Card
            </button>
          </>
        )}
      </div>

      {activeTab === 'cards' && (
        <div className="pm-filters">
          <div className="pm-filter-group">
            <select
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="pm-select"
            >
              <option value="">All Card Types</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="discover">Discover</option>
              <option value="other">Other</option>
            </select>
            <button
              className={`pm-favorites-btn ${showCardFavorites ? 'active' : ''}`}
              onClick={() => setShowCardFavorites(!showCardFavorites)}
            >
              <Star size={18} fill={showCardFavorites ? '#F59E0B' : 'none'} />
              Favorites
            </button>
            <button
              className={`pm-view-toggle-btn ${cardViewMode === 'visual' ? 'active' : ''}`}
              onClick={() => setCardViewMode(cardViewMode === 'visual' ? 'list' : 'visual')}
              title={cardViewMode === 'visual' ? 'Switch to list view' : 'Switch to card view'}
            >
              {cardViewMode === 'visual' ? '📋 List' : '💳 Card'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'passwords' && (
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

            <button 
              className="pm-category-manage-btn"
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              title="Manage categories"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      )}

      {showCategoryManager && (
        <div className="pm-category-manager">
          <h3>Manage Categories</h3>
          <div className="pm-category-list">
            {customCategories.map(cat => (
              <div key={cat._id} className="pm-category-item">
                <span>{cat.icon} {cat.name}</span>
                {!cat.isDefault && (
                  <button onClick={() => handleDeleteCategory(cat._id)} className="pm-category-delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="pm-category-create">
            <input
              type="text"
              placeholder="New category name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="pm-input"
            />
            <input
              type="text"
              placeholder="Icon"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
              className="pm-category-icon-input"
              maxLength={2}
            />
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
              className="pm-category-color-input"
            />
            <button onClick={handleCreateCategory} className="pm-add-category-btn">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="pm-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="pm-error-close">×</button>
        </div>
      )}

      {activeTab === 'passwords' && (
        (loading && passwords.length === 0) ? (
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

                    {password.email && (
                      <div className="pm-field">
                        <Mail size={14} className="pm-field-icon" />
                        <span className="pm-field-value">{password.email}</span>
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
        )
      )}

      {activeTab === 'cards' && (
        <>
          {loading && cards.length === 0 ? (
            <div className="pm-loading">
              <div className="pm-spinner"></div>
              <p>Loading cards...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="pm-empty">
              <div className="pm-empty-icon">
                <CreditCard size={48} />
              </div>
              <h3>No payment cards found</h3>
              <p>{cardFilter || showCardFavorites ? 'Try adjusting your filters' : 'Add your first payment card to get started!'}</p>
              {!cardFilter && !showCardFavorites && (
                <button className="pm-empty-btn" onClick={() => openCardModal()}>
                  <Plus size={18} />
                  Add Card
                </button>
              )}
            </div>
          ) : cardViewMode === 'visual' ? (
            <div className="pm-cards-grid">
              {cards.map((card, index) => (
                <div 
                  key={card._id} 
                  className="pm-credit-card-wrapper"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div 
                    className="pm-credit-card"
                    style={{ 
                      background: `linear-gradient(145deg, ${getCardTypeColor(card.cardType)} 0%, ${adjustColor(getCardTypeColor(card.cardType), -40)} 100%)`
                    }}
                  >
                    <div className="pm-card-magnetic-strip"></div>
                    <div className="pm-card-inner-content">
                      <div className="pm-card-number-display">
                        <label className="pm-card-label">CARD NUMBER</label>
                        <span className="pm-card-number-value">
                          {(visibleCards[card._id] && visibleCards[card._id].cardNumber) 
                            ? formatCardNumber(visibleCards[card._id].cardNumber, true) 
                            : `•••• •••• •••• ${card.lastFourDigits}`}
                        </span>
                      </div>
                      <div className="pm-card-details-display">
                        <div className="pm-card-holder-display">
                          <label>CARDHOLDER NAME</label>
                          <span className="pm-card-name-value">
                            {card.cardholderName ? card.cardholderName.toUpperCase() : 'FULL NAME'}
                          </span>
                        </div>
                        <div className="pm-card-right-section">
                          <div className="pm-card-expiry-display">
                            <label>EXPIRY DATE</label>
                            <span className="pm-card-date-value">
                              {(visibleCards[card._id] && visibleCards[card._id].expiryDate) 
                                ? visibleCards[card._id].expiryDate 
                                : 'MM/YY'}
                            </span>
                          </div>
                          <div className="pm-card-cvv-display">
                            <label>CVV</label>
                            <span className="pm-card-cvv-value">
                              {(visibleCards[card._id] && visibleCards[card._id].cvv) 
                                ? visibleCards[card._id].cvv 
                                : '•••'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pm-credit-card-actions">
                      <button
                        onClick={() => toggleCardVisibility(card._id)}
                        className="pm-card-visibility-btn"
                        title={visibleCards[card._id] ? 'Hide' : 'Show'}
                      >
                        {visibleCards[card._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleToggleCardFavorite(card._id)}
                        className="pm-card-favorite-btn"
                      >
                        {card.isFavorite ? <Star size={16} fill="#F59E0B" color="#F59E0B" /> : <StarOff size={16} />}
                      </button>
                      <button onClick={() => openCardModal(card)} className="pm-card-edit-btn">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteCard(card._id)} className="pm-card-delete-btn">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="pm-card-info-row">
                    <span className="pm-card-name-label">{card.cardName}</span>
                    <span className="pm-card-type-label" style={{ color: getCardTypeColor(card.cardType) }}>
                      {card.cardType}
                    </span>
                    {card.isDefault && (
                      <span className="pm-default-badge">Default</span>
                    )}
                  </div>
                  {!card.isDefault && (
                    <button onClick={() => handleSetDefaultCard(card._id)} className="pm-set-default-btn">
                      Set as Default
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="pm-list-view">
              {cards.map((card, index) => (
                <div 
                  key={card._id} 
                  className="pm-list-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="pm-list-card-header">
                    <div className="pm-list-card-icon" style={{ background: `linear-gradient(135deg, ${getCardTypeColor(card.cardType)} 0%, ${getCardTypeColor(card.cardType)}99 100%)` }}>
                      {getCardTypeIcon(card.cardType)}
                    </div>
                    <div className="pm-list-card-title-group">
                      <h3 className="pm-list-card-title">{card.cardName}</h3>
                      <span className="pm-list-card-type" style={{ color: getCardTypeColor(card.cardType) }}>
                        {card.cardType}
                      </span>
                    </div>
                    <div className="pm-list-card-badges">
                      {card.isDefault && <span className="pm-default-badge">Default</span>}
                      <button onClick={() => handleToggleCardFavorite(card._id)} className="pm-favorite-btn">
                        {card.isFavorite ? <Star size={18} fill="#F59E0B" color="#F59E0B" /> : <StarOff size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="pm-list-card-fields">
                    {card.cardholderName && (
                      <div className="pm-field">
                        <User size={14} className="pm-field-icon" />
                        <span className="pm-field-value">{card.cardholderName}</span>
                      </div>
                    )}
                    <div className="pm-password-row">
                      <CreditCard size={14} className="pm-field-icon" />
                      <div className="pm-password-display">
                        <span className="pm-password-dots">
                          {(visibleCards[card._id] && visibleCards[card._id].cardNumber) 
                            ? formatCardNumber(visibleCards[card._id].cardNumber, true) 
                            : `•••• •••• •••• ${card.lastFourDigits}`}
                        </span>
                        <div className="pm-password-actions">
                          <button onClick={() => toggleCardVisibility(card._id)} className="pm-icon-btn">
                            {visibleCards[card._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {visibleCards[card._id] && (
                      <>
                        <div className="pm-field">
                          <span className="pm-field-label">Expires:</span>
                          <span className="pm-field-value">{visibleCards[card._id].expiryDate}</span>
                        </div>
                        <div className="pm-field">
                          <span className="pm-field-label">CVV:</span>
                          <span className="pm-field-value">{visibleCards[card._id].cvv}</span>
                        </div>
                      </>
                    )}
                    {card.billingAddress && (
                      <div className="pm-field pm-field-notes">
                        <MapPin size={14} className="pm-field-icon" />
                        <span className="pm-field-value">{card.billingAddress.substring(0, 40)}{card.billingAddress.length > 40 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="pm-list-card-actions">
                    {!card.isDefault && (
                      <button onClick={() => handleSetDefaultCard(card._id)} className="pm-default-btn">
                        Set as Default
                      </button>
                    )}
                    <button onClick={() => openCardModal(card)} className="pm-edit-btn">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteCard(card._id)} className="pm-delete-btn">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
                    placeholder="username"
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">
                    <Mail size={14} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pm-input"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  <Lock size={14} />
                  Password {editingPassword ? '(leave empty to keep current)' : '*'}
                </label>
                <div className="pm-password-input-wrapper">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pm-input"
                    placeholder={editingPassword ? '••••••••' : 'Enter password'}
                    required={!editingPassword}
                  />
                  <button
                    type="button"
                    className="pm-generator-toggle"
                    onClick={() => setShowGenerator(!showGenerator)}
                    title="Generate password"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                {formData.password && (
                  <div className="pm-strength-meter">
                    <div className="pm-strength-bar">
                      <div 
                        className="pm-strength-fill" 
                        style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                      />
                    </div>
                    <div className="pm-strength-info">
                      <span className="pm-strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                      <span className="pm-strength-bits">{passwordStrength.bits} bits</span>
                    </div>
                  </div>
                )}
                {showGenerator && (
                  <div className="pm-generator-panel">
                    <div className="pm-generator-header">
                      <Settings size={14} />
                      <span>Password Generator</span>
                    </div>
                    <div className="pm-generator-length">
                      <label>Length: {generatorOptions.length}</label>
                      <input
                        type="range"
                        min="8"
                        max="32"
                        value={generatorOptions.length}
                        onChange={(e) => setGeneratorOptions({ ...generatorOptions, length: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="pm-generator-options">
                      <label>
                        <input
                          type="checkbox"
                          checked={generatorOptions.uppercase}
                          onChange={(e) => setGeneratorOptions({ ...generatorOptions, uppercase: e.target.checked })}
                        />
                        Uppercase (A-Z)
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={generatorOptions.lowercase}
                          onChange={(e) => setGeneratorOptions({ ...generatorOptions, lowercase: e.target.checked })}
                        />
                        Lowercase (a-z)
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={generatorOptions.numbers}
                          onChange={(e) => setGeneratorOptions({ ...generatorOptions, numbers: e.target.checked })}
                        />
                        Numbers (0-9)
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={generatorOptions.symbols}
                          onChange={(e) => setGeneratorOptions({ ...generatorOptions, symbols: e.target.checked })}
                        />
                        Symbols (!@#$...)
                      </label>
                    </div>
                    <button
                      type="button"
                      className="pm-generate-btn"
                      onClick={() => setFormData({ ...formData, password: generatePassword(generatorOptions.length, generatorOptions) })}
                    >
                      <RefreshCw size={14} />
                      Generate
                    </button>
                  </div>
                )}
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

      {showCardModal && (
        <div className="pm-modal-overlay" onClick={closeCardModal}>
          <div className="pm-modal" onClick={e => e.stopPropagation()}>
            <div className="pm-modal-header">
              <div className="pm-modal-title-group">
                <div className="pm-modal-icon">
                  <CreditCard size={20} />
                </div>
                <h2>{editingCard ? 'Edit Card' : 'Add New Card'}</h2>
              </div>
              <button onClick={closeCardModal} className="pm-modal-close"><X size={24} /></button>
            </div>

            <form onSubmit={handleCardSubmit} className="pm-form">
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">
                    <CreditCard size={14} />
                    Card Name *
                  </label>
                  <input
                    type="text"
                    value={cardFormData.cardName}
                    onChange={(e) => setCardFormData({ ...cardFormData, cardName: e.target.value })}
                    className="pm-input"
                    placeholder="e.g., Personal Visa, Business Card"
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">
                    <User size={14} />
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardFormData.cardholderName}
                    onChange={(e) => setCardFormData({ ...cardFormData, cardholderName: e.target.value })}
                    className="pm-input"
                    placeholder="Name on card"
                  />
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  <CreditCard size={14} />
                  Card Number {editingCard ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="text"
                  value={cardFormData.cardNumber}
                  onChange={(e) => setCardFormData({ ...cardFormData, cardNumber: e.target.value.replace(/\D/g, '') })}
                  className="pm-input"
                  placeholder={editingCard ? '•••• •••• •••• ••••' : '1234 5678 9012 3456'}
                  maxLength={19}
                  required={!editingCard}
                />
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">
                    Expiry Date {editingCard ? '(leave empty to keep current)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={cardFormData.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      setCardFormData({ ...cardFormData, expiryDate: value });
                    }}
                    className="pm-input"
                    placeholder={editingCard ? 'MM/YY' : 'MM/YY'}
                    maxLength={5}
                    required={!editingCard}
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">
                    CVV {editingCard ? '(leave empty to keep current)' : '(optional)'}
                  </label>
                  <input
                    type="password"
                    value={cardFormData.cvv}
                    onChange={(e) => setCardFormData({ ...cardFormData, cvv: e.target.value.replace(/\D/g, '') })}
                    className="pm-input"
                    placeholder={editingCard ? '•••' : '123'}
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  Card Type
                </label>
                <select
                  value={cardFormData.cardType}
                  onChange={(e) => setCardFormData({ ...cardFormData, cardType: e.target.value })}
                  className="pm-select"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">
                  <MapPin size={14} />
                  Billing Address
                </label>
                <textarea
                  value={cardFormData.billingAddress}
                  onChange={(e) => setCardFormData({ ...cardFormData, billingAddress: e.target.value })}
                  className="pm-textarea"
                  placeholder="Billing address..."
                  rows={2}
                />
              </div>

              <div className="pm-form-group">
                <label className="pm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={cardFormData.isDefault}
                    onChange={(e) => setCardFormData({ ...cardFormData, isDefault: e.target.checked })}
                    className="pm-checkbox"
                  />
                  <Star size={16} fill={cardFormData.isDefault ? '#F59E0B' : 'none'} color={cardFormData.isDefault ? '#F59E0B' : '#6B7280'} />
                  Set as default card
                </label>
              </div>

              <div className="pm-modal-actions">
                <button type="button" onClick={closeCardModal} className="pm-cancel-btn">
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
                      <CreditCard size={16} />
                      {editingCard ? 'Update Card' : 'Save Card'}
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


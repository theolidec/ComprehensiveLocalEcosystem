import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gift, Plus, Search, Share2, Lock,
  Heart, ShoppingBag, ExternalLink, Edit2, Trash2,
  Star, X, CheckCircle, AlertCircle, Package,
  Check, Square, ChevronLeft, ChevronRight, Download,
  Sparkles, Flame, Zap, Target, FileText, Upload
} from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';
import WishlistItemModal from './WishlistItemModal';
import WishlistShareModal from './WishlistShareModal';
import ReservationModal from './ReservationModal';
import { wishlistCategoryAPI } from '../../services/wishlistCategoryAPI';
import { usePageActions } from '../../contexts/PageActionsContext';
import './Wishlist.css';

const priorityConfig = {
  'must-have': { color: '#ef4444', label: 'Must Have', icon: Zap },
  'high': { color: '#f97316', label: 'High', icon: Flame },
  'medium': { color: '#3b82f6', label: 'Medium', icon: Target },
  'low': { color: '#6b7280', label: 'Low', icon: Star }
};

const categoryConfig = {
  'birthday': { color: '#8b5cf6', label: 'Birthday', icon: Gift, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
  'christmas': { color: '#10b981', label: 'Christmas', icon: Gift, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  'other': { color: '#6b7280', label: 'Other', icon: Package, gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }
};

const currencySymbols = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', NOK: 'kr', SEK: 'kr', DKK: 'kr'
};

const currenciesWithSymbolRight = ['SEK', 'NOK', 'DKK'];

const formatPrice = (price, currency) => {
  if (!price) return null;
  const symbol = currencySymbols[currency] || '$';
  const formattedPrice = price.toFixed(2);
  if (currenciesWithSymbolRight.includes(currency)) {
    return `${formattedPrice} ${symbol}`;
  }
  return `${symbol}${formattedPrice}`;
};

export default function Wishlist() {
  const { registerPageActions, clearPageActions } = usePageActions();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [reservationModalItem, setReservationModalItem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemsData, statsData, categoriesData] = await Promise.all([
        wishlistAPI.getItems({
          category: selectedCategory,
          priority: selectedPriority,
          search: searchQuery,
          page: pagination.page,
          limit: pagination.limit
        }),
        wishlistAPI.getStats(),
        wishlistCategoryAPI.getCategories()
      ]);
      
      setItems(itemsData.items || []);
      setStats(statsData);
      setCategories(categoriesData);
      if (itemsData.pagination) {
        setPagination(prev => ({ ...prev, ...itemsData.pagination }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedPriority, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500000);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    registerPageActions([
      {
        icon: <Plus size={18} />,
        label: 'Add Wish',
        onClick: handleAddItem,
        variant: 'primary'
      },
      {
        icon: <Download size={18} />,
        label: 'Export CSV',
        onClick: () => handleExport('csv'),
        closeOnClick: false
      },
      {
        icon: <Upload size={18} />,
        label: 'Import CSV',
        onClick: () => fileInputRef.current?.click(),
        closeOnClick: false
      },
      {
        icon: <FileText size={18} />,
        label: 'Export PDF',
        onClick: () => handleExport('pdf'),
        closeOnClick: false
      },
      ...(selectedItems.length > 0 ? [
        {
          icon: <Trash2 size={18} />,
          label: `Delete Selected (${selectedItems.length})`,
          onClick: handleBatchDelete,
          variant: 'danger'
        },
        {
          icon: <CheckCircle size={18} />,
          label: 'Mark as Purchased',
          onClick: () => handleBatchStatusChange('purchased'),
          variant: 'success'
        }
      ] : [])
    ]);

    return () => clearPageActions();
  }, [selectedItems.length]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await wishlistAPI.deleteItem(id);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item._id));
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;
    
    try {
      setLoading(true);
      for (const id of selectedItems) {
        await wishlistAPI.deleteItem(id);
      }
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete items');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      for (const id of selectedItems) {
        await wishlistAPI.updateItem(id, { status: newStatus });
      }
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update items');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPriorityChange = async (newPriority) => {
    try {
      setLoading(true);
      for (const id of selectedItems) {
        await wishlistAPI.updateItem(id, { priority: newPriority });
      }
      setSelectedItems([]);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format) => {
    if (format === 'pdf') {
      await wishlistAPI.exportPDF({
        category: selectedCategory,
        priority: selectedPriority,
        search: searchQuery,
        selectedItems: selectedItems.length > 0 ? selectedItems : null
      });
      return;
    }

    const exportData = filteredItems.map(item => ({
      Title: item.title,
      Description: item.description || '',
      Price: item.price || '',
      Currency: item.currency || 'USD',
      Priority: item.priority,
      Category: item.category,
      Status: item.status,
      URL: item.url || '',
      'Created At': new Date(item.createdAt).toLocaleDateString()
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wishlist-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const fileInputRef = React.useRef(null);

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await wishlistAPI.importCSV(text);
      if (result.imported > 0) {
        await fetchData();
        alert(`Successfully imported ${result.imported} items!`);
      }
      if (result.errors?.length > 0) {
        alert(`Import completed with errors:\n${result.errors.join('\n')}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to import CSV');
    }
    e.target.value = '';
  };

  const handleShareItem = (item) => {
    setShareModalItem(item);
  };

  const handleViewReservations = (item) => {
    setReservationModalItem(item);
  };

  const copyShareLink = async (shareUrl) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(shareUrl);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleItemStatus = async (item) => {
    try {
      const newStatus = item.status === 'purchased' ? 'active' : 'purchased';
      await wishlistAPI.updateItem(item._id, { status: newStatus });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesPriority && matchesSearch;
  });

  const getTotalValue = () => {
    return filteredItems.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const getCategoryCount = (categoryName) => {
    return items.filter(item => item.category === categoryName).length;
  };

  const getCategoryStyle = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      return {
        color: category.color,
        label: category.name,
        icon: category.icon === 'gift' ? Gift : category.icon === 'package' ? Package : Gift,
        gradient: `linear-gradient(135deg, ${category.color} 0%, ${category.color}99 100%)`
      };
    }
    return categoryConfig[categoryName] || categoryConfig['other'];
  };

  if (loading) {
    return (
      <div className="wishlist-loading">
        <div className="wishlist-spinner"></div>
        <p>Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleImportCSV}
      />
      {/* Hero Section - Redesigned */}
      <div className="wishlist-hero-new">
        <div className="hero-bg-pattern"></div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-text">
              <p className="wishlist-subtitle">
                <span className="item-count">{items.length} wishes</span>
                <span className="divider">•</span>
                <span className="total-value">{getTotalValue().toFixed(2)} total</span>
              </p>
            </div>
          </div>
          <button className="wishlist-add-btn" onClick={handleAddItem}>
            <Plus size={20} />
            <span>Add Wish</span>
          </button>
        </div>
        
        {/* Quick Stats Row */}
        <div className="hero-stats">
          {categories.slice(0, 3).map(category => {
            const CategoryIcon = category.icon === 'package' ? Package : Gift;
            return (
              <div 
                key={category._id} 
                className="hero-stat-chip"
                style={{ 
                  '--chip-color': category.color,
                  background: `${category.color}15`,
                  borderColor: `${category.color}30`
                }}
              >
                <CategoryIcon size={16} style={{ color: category.color }} />
                <span className="chip-count">{getCategoryCount(category.name)}</span>
                <span className="chip-label">{category.name}</span>
              </div>
            );
          })}
          <div className="hero-stat-chip priority-chip">
            <Sparkles size={16} />
            <span className="chip-count">{items.filter(i => i.priority === 'must-have').length}</span>
            <span className="chip-label">Must Haves</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="wishlist-toolbar">
        <div className="toolbar-row">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search your wishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button 
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`category-tab ${selectedCategory === cat.name ? 'active' : ''}`}
                style={{ 
                  '--tab-color': cat.color,
                  '--tab-bg': `${cat.color}15`,
                  '--tab-border': `${cat.color}30`
                }}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Batch Actions - inline */}
          {filteredItems.length > 0 && (
            <div className="batch-bar-inline">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={toggleSelectAll}
                />
                <span>Select all</span>
              </label>
              
              {selectedItems.length > 0 ? (
                <div className="batch-actions-inline">
                  <span className="selected-count">{selectedItems.length}</span>
                  <button className="batch-action-btn" onClick={() => handleBatchStatusChange('purchased')} title="Mark as Purchased">
                    <ShoppingBag size={14} />
                  </button>
                  <button className="batch-action-btn" onClick={() => handleBatchStatusChange('active')} title="Mark as Active">
                    <CheckCircle size={14} />
                  </button>
                  <div className="priority-dropdown">
                    <button className="batch-action-btn priority" title="Set Priority">
                      <Star size={14} />
                    </button>
                    <div className="priority-menu">
                      <button onClick={() => handleBatchPriorityChange('must-have')} title="Must Have">
                        <Zap size={12} /> Must Have
                      </button>
                      <button onClick={() => handleBatchPriorityChange('high')} title="High">
                        <Flame size={12} /> High
                      </button>
                      <button onClick={() => handleBatchPriorityChange('medium')} title="Medium">
                        <Target size={12} /> Medium
                      </button>
                      <button onClick={() => handleBatchPriorityChange('low')} title="Low">
                        <Star size={12} /> Low
                      </button>
                    </div>
                  </div>
                  <button className="batch-action-btn delete" onClick={handleBatchDelete} title="Delete">
                    <Trash2 size={14} />
                  </button>
                  <button className="batch-action-btn clear" onClick={() => setSelectedItems([])} title="Clear Selection">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="export-dropdown">
                  <button className="export-btn">
                    <Download size={14} />
                    Export
                  </button>
                  <div className="export-menu">
                    <button onClick={() => handleExport('csv')}>
                      <Download size={14} />
                      CSV
                    </button>
                    <button onClick={() => handleExport('pdf')}>
                      <FileText size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="floating-gift gift-1">🎁</div>
            <div className="floating-gift gift-2">✨</div>
            <div className="floating-gift gift-3">🎀</div>
          </div>
          <h3>No wishes yet</h3>
          <p>
            {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your filters to find what you\'re looking for'
              : 'Start adding items to your wishlist and make your dreams come true!'}
          </p>
          {!searchQuery && selectedCategory === 'all' && selectedPriority === 'all' && (
            <button className="add-first-btn" onClick={handleAddItem}>
              <Plus size={18} />
              Add Your First Wish
            </button>
          )}
        </div>
      ) : (
        <div className={`wishlist-items ${viewMode}`}>
          {filteredItems.map((item, index) => {
            const categoryStyle = getCategoryStyle(item.category);
            const CategoryIcon = categoryStyle.icon;
            const PriorityIcon = priorityConfig[item.priority].icon;
            const isPurchased = item.status === 'purchased';
            const hasReservations = item.reservations && item.reservations.length > 0;
            const purchasedReservation = item.reservations?.find(r => r.status === 'purchased');
            
            return (
              <div 
                key={item._id} 
                className={`wishlist-card ${isPurchased ? 'purchased' : ''} ${selectedItems.includes(item._id) ? 'selected' : ''}`}
                style={{ '--delay': `${index * 0.03}s` }}
              >
                {/* Card Image */}
                {item.imageUrl && (
                  <div className="card-image">
                    <img src={item.imageUrl} alt={item.title} />
                    {isPurchased && (
                      <div className="purchased-overlay">
                        <ShoppingBag size={24} />
                        <span>Purchased</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Card Content */}
                <div className="card-body">
                  {/* Selection & Priority */}
                  <div className="card-header">
                    <div className="card-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => toggleItemSelection(item._id)}
                      />
                    </div>
                    <div 
                      className="priority-indicator"
                      style={{ background: priorityConfig[item.priority].color }}
                      title={priorityConfig[item.priority].label}
                    >
                      <PriorityIcon size={12} />
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div 
                    className="category-badge"
                    style={{ background: `${categoryStyle.color}15`, color: categoryStyle.color }}
                  >
                    <CategoryIcon size={12} />
                    <span>{categoryStyle.label}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="card-title">{item.title}</h3>
                  {item.description && (
                    <p className="card-description">{item.description}</p>
                  )}

                  {/* Price & Link */}
                  <div className="card-footer">
                    {item.price ? (
                      <div className="card-price">
                        <span className="amount">{formatPrice(item.price, item.currency)}</span>
                      </div>
                    ) : (
                      <div className="card-price no-price">
                        <span className="amount">Price on request</span>
                      </div>
                    )}
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="card-link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* Reservations */}
                  {hasReservations && !isPurchased && (
                    <div className="reservation-badge" onClick={() => handleViewReservations(item)}>
                      <Heart size={12} />
                      <span>{item.reservations.length} reserved</span>
                    </div>
                  )}

                  {/* Purchased By */}
                  {isPurchased && purchasedReservation && (
                    <div className="purchased-by">
                      <ShoppingBag size={12} />
                      <span>{purchasedReservation.reservedBy.name}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="card-actions">
                  <button
                    className={`card-action-btn purchase ${isPurchased ? 'active' : ''}`}
                    onClick={() => toggleItemStatus(item)}
                    title={isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}
                  >
                    <ShoppingBag size={16} />
                  </button>
                  <button
                    className="card-action-btn share"
                    onClick={() => handleShareItem(item)}
                    title="Share"
                  >
                    {item.isPublic ? <Share2 size={16} /> : <Lock size={16} />}
                  </button>
                  {hasReservations && (
                    <button
                      className="card-action-btn reservations"
                      onClick={() => handleViewReservations(item)}
                      title="Reservations"
                    >
                      <Heart size={16} />
                      <span className="action-badge">{item.reservations.length}</span>
                    </button>
                  )}
                  <button
                    className="card-action-btn edit"
                    onClick={() => handleEditItem(item)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="card-action-btn delete"
                    onClick={() => handleDeleteItem(item._id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages >= 1 && (
        <div className="pagination">
          <div className="page-size-selector">
            <label>Show:</label>
            <select 
              value={pagination.limit} 
              onChange={(e) => {
                setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <button 
            className="page-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`page-num ${pagination.page === pageNum ? 'active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button 
            className="page-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      <WishlistItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        onSave={fetchData}
        categories={categories}
      />

      <WishlistShareModal
        isOpen={!!shareModalItem}
        onClose={() => setShareModalItem(null)}
        item={shareModalItem}
        onUpdate={fetchData}
        copiedLink={copiedLink}
        onCopyLink={copyShareLink}
      />

      <ReservationModal
        isOpen={!!reservationModalItem}
        onClose={() => setReservationModalItem(null)}
        item={reservationModalItem}
        onUpdate={fetchData}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gift, Plus, Search, Share2, Lock,
  Heart, ShoppingBag, ExternalLink, Edit2, Trash2,
  Tag, DollarSign, Star, X, CheckCircle, AlertCircle, Package,
  Check, Square, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';
import WishlistItemModal from './WishlistItemModal';
import WishlistShareModal from './WishlistShareModal';
import ReservationModal from './ReservationModal';
import { wishlistCategoryAPI } from '../../services/wishlistCategoryAPI';
import './Wishlist.css';

const priorityConfig = {
  'must-have': { color: '#ef4444', label: 'Must Have', icon: Star },
  'high': { color: '#f97316', label: 'High', icon: Star },
  'medium': { color: '#3b82f6', label: 'Medium', icon: Star },
  'low': { color: '#6b7280', label: 'Low', icon: Star }
};

const categoryConfig = {
  'birthday': { color: '#8b5cf6', label: 'Birthday', icon: Gift, gradient: 'from-purple-500 to-pink-500' },
  'christmas': { color: '#10b981', label: 'Christmas', icon: Gift, gradient: 'from-green-500 to-emerald-500' },
  'other': { color: '#6b7280', label: 'Other', icon: Package, gradient: 'from-gray-500 to-slate-500' }
};

const currencySymbols = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', NOK: 'kr', SEK: 'kr', DKK: 'kr'
};

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
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
  }, [selectedCategory, selectedPriority, searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = (format) => {
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
        icon: category.icon === 'gift' ? Gift : category.icon === 'package' ? Package : Gift
      };
    }
    // Fallback to default config
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
      {/* Hero Section */}
      <div className="wishlist-hero">
        <div className="wishlist-hero-content">
          <div className="wishlist-hero-icon">
            <Gift size={28} />
          </div>
          <div>
            <h1 className="wishlist-title">My Wishlist</h1>
            <p className="wishlist-subtitle">
              {items.length} items · {currencySymbols.USD}{getTotalValue().toFixed(2)} total value
            </p>
          </div>
        </div>
        <button className="wishlist-add-btn" onClick={handleAddItem}>
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="wishlist-stats">
        {categories.map(category => {
          const CategoryIcon = category.icon === 'package' ? Package : Gift;
          return (
            <div 
              key={category._id} 
              className="wishlist-stat-card"
              style={{ 
                background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}25 100%)`,
                borderColor: `${category.color}30`
              }}
            >
              <div 
                className="wishlist-stat-icon"
                style={{ background: `${category.color}20`, color: category.color }}
              >
                <CategoryIcon size={20} />
              </div>
              <div className="wishlist-stat-content">
                <span className="wishlist-stat-value">{getCategoryCount(category.name)}</span>
                <span className="wishlist-stat-label">{category.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="wishlist-filters">
        <div className="wishlist-search-container">
          <Search className="wishlist-search-icon" size={18} />
          <input
            type="text"
            className="wishlist-search-input"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="wishlist-search-clear" 
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="wishlist-filter-group">
          <select
            className="wishlist-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            className="wishlist-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="must-have">Must Have</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Batch Actions Bar */}
      {filteredItems.length > 0 && (
        <div className="wishlist-batch-bar">
          <label className="wishlist-select-all">
            <input
              type="checkbox"
              checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Select All ({filteredItems.length})</span>
          </label>
          
          {selectedItems.length > 0 ? (
            <div className="wishlist-batch-actions">
              <span className="batch-count">{selectedItems.length} selected</span>
              <button className="batch-btn" onClick={() => handleBatchStatusChange('purchased')}>
                <ShoppingBag size={14} /> Mark Purchased
              </button>
              <button className="batch-btn" onClick={() => handleBatchStatusChange('active')}>
                <CheckCircle size={14} /> Mark Active
              </button>
              <button className="batch-btn delete" onClick={handleBatchDelete}>
                <Trash2 size={14} /> Delete
              </button>
              <button className="batch-btn" onClick={() => setSelectedItems([])}>
                Clear
              </button>
            </div>
          ) : (
            <button className="wishlist-export-btn" onClick={() => handleExport('csv')}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="wishlist-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">
            <Heart size={48} />
          </div>
          <h3>No items found</h3>
          <p>
            {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'Start adding items to your wishlist'}
          </p>
          {!searchQuery && selectedCategory === 'all' && selectedPriority === 'all' && (
            <button className="wishlist-empty-btn" onClick={handleAddItem}>
              <Plus size={18} />
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="wishlist-items">
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
                className={`wishlist-item ${isPurchased ? 'purchased' : ''} ${selectedItems.includes(item._id) ? 'selected' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Selection Checkbox */}
                <div className="wishlist-item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={() => toggleItemSelection(item._id)}
                  />
                </div>
                
                {/* Content */}
                <div className="wishlist-item-content">
                  <div className="wishlist-item-header">
                    <h3 className="wishlist-item-title">{item.title}</h3>
                    <div className="wishlist-item-badges">
                      <div 
                        className="wishlist-item-category"
                        style={{ backgroundColor: categoryStyle.color + '20', color: categoryStyle.color }}
                      >
                        <CategoryIcon size={14} />
                        <span>{categoryStyle.label}</span>
                      </div>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: priorityConfig[item.priority].color + '20', color: priorityConfig[item.priority].color }}
                      >
                        <PriorityIcon size={12} />
                        {priorityConfig[item.priority].label}
                      </span>
                      {hasReservations && !isPurchased && (
                        <span className="reserved-badge">
                          <Lock size={12} />
                          Reserved
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="wishlist-item-description">{item.description}</p>
                  )}

                  <div className="wishlist-item-meta">
                    {item.price && (
                      <span className="wishlist-item-price">
                        <DollarSign size={14} />
                        {currencySymbols[item.currency] || '$'}{item.price.toFixed(2)}
                      </span>
                    )}
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="wishlist-item-link"
                      >
                        <ExternalLink size={14} />
                        View Product
                      </a>
                    )}
                  </div>

                  {isPurchased && purchasedReservation && (
                    <div className="wishlist-purchased-by">
                      <ShoppingBag size={14} />
                      <span>Purchased by {purchasedReservation.reservedBy.name}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="wishlist-item-actions">
                  <button
                    className={`action-btn purchase-btn ${isPurchased ? 'active' : ''}`}
                    onClick={() => toggleItemStatus(item)}
                    title={isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}
                  >
                    <ShoppingBag size={16} />
                  </button>
                  <button
                    className="action-btn share-btn"
                    onClick={() => handleShareItem(item)}
                    title="Share item"
                  >
                    {item.isPublic ? <Share2 size={16} /> : <Lock size={16} />}
                  </button>
                  {hasReservations && (
                    <button
                      className="action-btn reservations-btn"
                      onClick={() => handleViewReservations(item)}
                      title="View reservations"
                    >
                      <Heart size={16} />
                      <span className="reservation-count">{item.reservations.length}</span>
                    </button>
                  )}
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEditItem(item)}
                    title="Edit item"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteItem(item._id)}
                    title="Delete item"
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
      {pagination.totalPages > 1 && (
        <div className="wishlist-pagination">
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
          </span>
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next <ChevronRight size={16} />
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

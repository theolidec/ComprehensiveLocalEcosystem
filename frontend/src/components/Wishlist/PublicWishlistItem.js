import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Gift, Heart, User, Mail, MessageSquare, Check, AlertCircle, ArrowLeft, ExternalLink, DollarSign } from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';

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

const priorityConfig = {
  'must-have': { color: '#ef4444', label: 'Must Have' },
  'high': { color: '#f97316', label: 'High' },
  'medium': { color: '#3b82f6', label: 'Medium' },
  'low': { color: '#6b7280', label: 'Low' }
};

export default function PublicWishlistItem() {
  const { token } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    email: '',
    message: '',
    status: 'reserved'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadItem();
  }, [token]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const data = await wishlistAPI.getPublicItem(token);
      setItem(data);
    } catch (err) {
      setError(err.message || 'Item not found or not public');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await wishlistAPI.createReservation(item._id, reservationForm);
      setSuccess(true);
      await loadItem();
    } catch (err) {
      setError(err.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setReservationForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="public-wishlist-loading">
        <div className="public-wishlist-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="public-wishlist-error">
        <AlertCircle size={48} />
        <h2>Item Not Found</h2>
        <p>{error || 'This item is not available or has been removed'}</p>
        <a href="/" className="public-wishlist-back">
          <ArrowLeft size={16} />
          Go Home
        </a>
      </div>
    );
  }

  const isPurchased = item.status === 'purchased' || item.reservations?.some(r => r.status === 'purchased');
  const isReserved = item.reservations?.some(r => r.status === 'reserved');
  const priority = priorityConfig[item.priority];

  return (
    <div className="public-wishlist-container">
      <div className="public-wishlist-card">
        <div className={`public-wishlist-header ${item.category}`}>
          <Gift size={32} />
          <h1>Wishlist Item</h1>
          <span className="public-wishlist-category">{item.category}</span>
        </div>

        <div className="public-wishlist-content">
          {item.imageUrl && (
            <div className="public-wishlist-image">
              <img src={item.imageUrl} alt={item.title} />
            </div>
          )}

          <div className="public-wishlist-details">
            <h2 className="public-wishlist-title">{item.title}</h2>
            
            {item.description && (
              <p className="public-wishlist-description">{item.description}</p>
            )}

            <div className="public-wishlist-meta">
              {item.price ? (
                <span className="public-wishlist-price">
                  <DollarSign size={16} />
                  {formatPrice(item.price, item.currency)}
                </span>
              ) : (
                <span className="public-wishlist-price no-price">
                  <DollarSign size={16} />
                  Price on request
                </span>
              )}
              <span 
                className="public-wishlist-priority"
                style={{ backgroundColor: priority.color + '20', color: priority.color }}
              >
                {priority.label}
              </span>
            </div>

            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="public-wishlist-link"
              >
                <ExternalLink size={16} />
                View Product
              </a>
            )}
          </div>

          <div className="public-wishlist-status">
            {isPurchased ? (
              <div className="public-wishlist-purchased">
                <Check size={24} />
                <div>
                  <h3>Already Purchased</h3>
                  <p>This item has been purchased by someone</p>
                </div>
              </div>
            ) : isReserved ? (
              <div className="public-wishlist-reserved">
                <Heart size={24} />
                <div>
                  <h3>Reserved</h3>
                  <p>This item has been reserved by someone</p>
                </div>
              </div>
            ) : success ? (
              <div className="public-wishlist-success">
                <Check size={24} />
                <div>
                  <h3>Thank You!</h3>
                  <p>Your reservation has been recorded</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="public-wishlist-form">
                <h3>
                  <Heart size={20} />
                  Reserve This Item
                </h3>
                <p>Let them know you're getting this gift</p>

                <div className="form-group">
                  <label>
                    <User size={14} />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={reservationForm.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={14} />
                    Your Email (optional)
                  </label>
                  <input
                    type="email"
                    value={reservationForm.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <MessageSquare size={14} />
                    Message (optional)
                  </label>
                  <textarea
                    value={reservationForm.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Add a message..."
                    rows={3}
                  />
                </div>

                <div className="form-group radio-group">
                  <label>Status</label>
                  <div className="radio-options">
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="reserved"
                        checked={reservationForm.status === 'reserved'}
                        onChange={(e) => handleChange('status', e.target.value)}
                      />
                      <span>I'm interested</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        value="purchased"
                        checked={reservationForm.status === 'purchased'}
                        onChange={(e) => handleChange('status', e.target.value)}
                      />
                      <span>I've purchased this</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Reserve Item'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="public-wishlist-footer">
        <p>Powered by <a href="/">My Local Ecosystem</a></p>
      </div>
    </div>
  );
}

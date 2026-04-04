import React, { useState, useEffect } from 'react';
import { X, Heart, User, Mail, MessageSquare, Check, Loader2, Trash2 } from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';

export default function ReservationModal({ isOpen, onClose, item, onUpdate }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      loadReservations();
    }
  }, [isOpen, item]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await wishlistAPI.getReservations(item._id);
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await wishlistAPI.cancelReservation(reservationId);
      await loadReservations();
      onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="wishlist-modal-overlay" onClick={onClose}>
      <div className="wishlist-modal reservations-modal" onClick={e => e.stopPropagation()}>
        <div className="wishlist-modal-header">
          <div className="wishlist-modal-title">
            <div className="wishlist-modal-icon">
              <Heart size={20} />
            </div>
            <h2>Reservations</h2>
          </div>
          <button className="wishlist-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="wishlist-modal-content">
          <div className="reservation-item-info">
            <h4>{item.title}</h4>
            <p>{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
          </div>

          {loading ? (
            <div className="reservations-loading">
              <Loader2 size={24} className="spin" />
              <p>Loading reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="reservations-empty">
              <Heart size={32} />
              <p>No reservations yet</p>
            </div>
          ) : (
            <div className="reservations-list">
              {reservations.map((reservation) => (
                <div 
                  key={reservation._id} 
                  className={`reservation-card ${reservation.status}`}
                >
                  <div className="reservation-header">
                    <div className="reservation-user">
                      <User size={16} />
                      <span className="reservation-name">{reservation.reservedBy.name}</span>
                    </div>
                    <span className={`reservation-status-badge ${reservation.status}`}>
                      {reservation.status === 'purchased' ? 'Purchased' : 'Reserved'}
                    </span>
                  </div>

                  {reservation.reservedBy.email && (
                    <div className="reservation-email">
                      <Mail size={14} />
                      <span>{reservation.reservedBy.email}</span>
                    </div>
                  )}

                  {reservation.message && (
                    <div className="reservation-message">
                      <MessageSquare size={14} />
                      <p>{reservation.message}</p>
                    </div>
                  )}

                  <div className="reservation-footer">
                    <span className="reservation-date">
                      {new Date(reservation.reservedAt).toLocaleDateString()}
                    </span>
                    <button
                      className="reservation-cancel-btn"
                      onClick={() => handleCancelReservation(reservation._id)}
                    >
                      <Trash2 size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="wishlist-form-error">
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="wishlist-modal-actions">
          <button className="wishlist-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

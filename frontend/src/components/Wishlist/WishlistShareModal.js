import React, { useState } from 'react';
import { X, Copy, Check, Link2, Globe, Lock } from 'lucide-react';
import { wishlistAPI } from '../../services/wishlistAPI';

export default function WishlistShareModal({ isOpen, onClose, item, onUpdate, copiedLink, onCopyLink }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);

  if (!isOpen || !item) return null;

  const handleToggleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await wishlistAPI.toggleShare(item._id);
      setShareData(result);
      onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to update share settings');
    } finally {
      setLoading(false);
    }
  };

  const isPublic = shareData ? shareData.isPublic : item.isPublic;
  const shareUrl = shareData?.shareUrl || (item.shareToken ? 
    `${window.location.origin}/wishlist/shared/${item.shareToken}` : null);

  return (
    <div className="wishlist-modal-overlay" onClick={onClose}>
      <div className="wishlist-modal share-modal" onClick={e => e.stopPropagation()}>
        <div className="wishlist-modal-header">
          <div className="wishlist-modal-title">
            <div className="wishlist-modal-icon">
              {isPublic ? <Globe size={20} /> : <Lock size={20} />}
            </div>
            <h2>Share Item</h2>
          </div>
          <button className="wishlist-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="wishlist-modal-content">
          <div className="share-item-preview">
            <h4>{item.title}</h4>
            <p className="share-item-category">
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </p>
          </div>

          <div className="share-status-section">
            <div className="share-status-header">
              <span className="share-status-label">Visibility</span>
              <span className={`share-status-badge ${isPublic ? 'public' : 'private'}`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <p className="share-status-description">
              {isPublic 
                ? 'Anyone with the link can view and reserve this item'
                : 'Only you can see this item'}
            </p>
            <button
              className="share-toggle-btn"
              onClick={handleToggleShare}
              disabled={loading}
            >
              {loading ? (
                'Updating...'
              ) : (
                isPublic ? 'Make Private' : 'Make Public'
              )}
            </button>
          </div>

          {isPublic && shareUrl && (
            <div className="share-link-section">
              <label className="wishlist-label">
                <Link2 size={14} />
                Share Link
              </label>
              <div className="share-link-input-group">
                <input
                  type="text"
                  className="share-link-input"
                  value={shareUrl}
                  readOnly
                />
                <button
                  className="share-copy-btn"
                  onClick={() => onCopyLink(shareUrl)}
                >
                  {copiedLink === shareUrl ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
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

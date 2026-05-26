import React, { useState, useEffect, useCallback } from 'react';
import { usePageActions } from '../../contexts/PageActionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { followAPI } from '../../services/wishlistAPI';
import {
  Users, Search, UserPlus, UserMinus, Loader2, X,
  ChevronLeft, ChevronRight, UserCheck, UserX, Globe
} from 'lucide-react';
import './UserFollowing.css';

const UserFollowing = () => {
  const { user } = useAuth();
  const { registerPageActions, clearPageActions } = usePageActions();
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Followers state
  const [followers, setFollowers] = useState([]);
  const [followersPagination, setFollowersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Following state
  const [following, setFollowing] = useState([]);
  const [followingPagination, setFollowingPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Register sidebar actions
  useEffect(() => {
    registerPageActions([
      {
        icon: <Search size={18} />,
        label: 'Find Users',
        onClick: () => setActiveTab('search'),
        variant: activeTab === 'search' ? 'primary' : 'default'
      },
      {
        icon: <UserCheck size={18} />,
        label: 'Following',
        onClick: () => setActiveTab('following'),
        variant: activeTab === 'following' ? 'primary' : 'default'
      },
      {
        icon: <Users size={18} />,
        label: 'Followers',
        onClick: () => setActiveTab('followers'),
        variant: activeTab === 'followers' ? 'primary' : 'default'
      }
    ]);

    return () => clearPageActions();
  }, [activeTab, registerPageActions, clearPageActions]);

  // Search users
  const handleSearch = useCallback(async (page = 1) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await followAPI.searchUsers(searchQuery, page, 20);
      setSearchResults(result.users || []);
      setSearchPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Fetch followers
  const fetchFollowers = useCallback(async (page = 1) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await followAPI.getFollowers(userId, page, 20);
      setFollowers(result.users || []);
      setFollowersPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Failed to fetch followers');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch following
  const fetchFollowing = useCallback(async (page = 1) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await followAPI.getFollowing(userId, page, 20);
      setFollowing(result.users || []);
      setFollowingPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Failed to fetch following');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle follow/unfollow
  const handleFollow = async (targetUserId) => {
    try {
      await followAPI.follow(targetUserId);
      showMessage('Successfully followed user');

      // Update local state
      if (activeTab === 'search') {
        setSearchResults(prev => prev.map(u =>
          u._id === targetUserId ? { ...u, isFollowing: true } : u
        ));
      }

      // Refresh following list
      fetchFollowing(1);
    } catch (err) {
      showMessage(err.message || 'Failed to follow user', 'error');
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await followAPI.unfollow(targetUserId);
      showMessage('Successfully unfollowed user');

      // Update local state
      if (activeTab === 'search') {
        setSearchResults(prev => prev.map(u =>
          u._id === targetUserId ? { ...u, isFollowing: false } : u
        ));
      } else if (activeTab === 'following') {
        setFollowing(prev => prev.filter(u => u._id !== targetUserId));
      }
    } catch (err) {
      showMessage(err.message || 'Failed to unfollow user', 'error');
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'search' && searchQuery.length >= 2) {
        handleSearch(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, handleSearch]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers(1);
    } else if (activeTab === 'following') {
      fetchFollowing(1);
    }
  }, [activeTab, fetchFollowers, fetchFollowing]);

  const renderPagination = (pagination, onPageChange) => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="uf-pagination">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="uf-pagination-btn"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="uf-pagination-info">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="uf-pagination-btn"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderUserCard = (userItem, showFollowButton = true) => {
    if (!userItem) return null;
    const isFollowing = userItem.isFollowing || following.some(f => f._id === userItem._id);

    return (
      <div key={userItem._id} className="uf-user-card">
        <div className="uf-user-avatar">
          <span>{userItem.name?.charAt(0).toUpperCase() || '?'}</span>
        </div>
        <div className="uf-user-info">
          <h4 className="uf-user-name">{userItem.name}</h4>
          <p className="uf-user-email">{userItem.email}</p>
        </div>
        {showFollowButton && userItem._id !== (user?.id || user?._id) && (
          <button
            onClick={() => isFollowing ? handleUnfollow(userItem._id) : handleFollow(userItem._id)}
            className={`uf-follow-btn ${isFollowing ? 'following' : ''}`}
            disabled={loading}
          >
            {isFollowing ? (
              <><UserMinus size={16} /> Unfollow</>
            ) : (
              <><UserPlus size={16} /> Follow</>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="uf-container">
      {message && (
        <div className={`uf-message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="uf-message-close">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="uf-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="uf-error-close">
            <X size={14} />
          </button>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="uf-section">
          <div className="uf-search-header">
            <h2 className="uf-section-title">
              <Search size={20} />
              Find Users
            </h2>
            <div className="uf-search-box">
              <Search size={18} className="uf-search-icon" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="uf-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="uf-search-clear"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {loading && searchQuery.length >= 2 && (
            <div className="uf-loading">
              <Loader2 size={24} className="uf-spinner" />
              <span>Searching users...</span>
            </div>
          )}

          {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="uf-empty">
              <Users size={48} className="uf-empty-icon" />
              <h3>No users found</h3>
              <p>Try a different search term</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <>
              <div className="uf-user-grid">
                {searchResults.map(u => renderUserCard(u))}
              </div>
              {renderPagination(searchPagination, handleSearch)}
            </>
          )}

          {!searchQuery && (
            <div className="uf-empty">
              <Globe size={48} className="uf-empty-icon" />
              <h3>Discover Users</h3>
              <p>Search for users by name or email to follow them</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="uf-section">
          <h2 className="uf-section-title">
            <UserCheck size={20} />
            Users You Follow ({followingPagination.total})
          </h2>

          {loading && (
            <div className="uf-loading">
              <Loader2 size={24} className="uf-spinner" />
              <span>Loading...</span>
            </div>
          )}

          {!loading && following.length === 0 && (
            <div className="uf-empty">
              <UserX size={48} className="uf-empty-icon" />
              <h3>Not following anyone yet</h3>
              <p>Search for users to follow and see their public wishlists</p>
              <button
                onClick={() => setActiveTab('search')}
                className="uf-action-btn"
              >
                <Search size={16} />
                Find Users
              </button>
            </div>
          )}

          {following.length > 0 && (
            <>
              <div className="uf-user-grid">
                {following.map(u => renderUserCard(u, true))}
              </div>
              {renderPagination(followingPagination, fetchFollowing)}
            </>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="uf-section">
          <h2 className="uf-section-title">
            <Users size={20} />
            Your Followers ({followersPagination.total})
          </h2>

          {loading && (
            <div className="uf-loading">
              <Loader2 size={24} className="uf-spinner" />
              <span>Loading...</span>
            </div>
          )}

          {!loading && followers.length === 0 && (
            <div className="uf-empty">
              <Users size={48} className="uf-empty-icon" />
              <h3>No followers yet</h3>
              <p>When users follow you, they will appear here</p>
            </div>
          )}

          {followers.length > 0 && (
            <>
              <div className="uf-user-grid">
                {followers.map(u => renderUserCard(u, true))}
              </div>
              {renderPagination(followersPagination, fetchFollowers)}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFollowing;

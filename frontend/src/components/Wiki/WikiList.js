import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWiki } from '../../contexts/WikiContext';
import { Book, Plus, Search, Settings, Trash2, Lock, Globe, Users, Clock3, Loader2 } from 'lucide-react';

const WikiList = () => {
  const navigate = useNavigate();
  const { wikis, loading, error, fetchWikis, createWiki, deleteWiki } = useWiki();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWiki, setNewWiki] = useState({ name: '', description: '', visibility: 'private' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('owned');

  useEffect(() => {
    fetchWikis();
  }, [fetchWikis]);

  const handleCreateWiki = async (e) => {
    e.preventDefault();
    try {
      const result = await createWiki(newWiki);
      setShowCreateModal(false);
      setNewWiki({ name: '', description: '', visibility: 'private' });
      navigate(`/wiki/${result.wiki.slug}`);
    } catch (err) {
      console.error('Failed to create wiki:', err);
    }
  };

  const handleDeleteWiki = async (e, slug) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this wiki? All pages will be lost.')) {
      try {
        await deleteWiki(slug);
      } catch (err) {
        console.error('Failed to delete wiki:', err);
      }
    }
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'private': return <Lock size={14} />;
      case 'team': return <Users size={14} />;
      case 'public': return <Globe size={14} />;
      default: return <Lock size={14} />;
    }
  };

  const getAllWikis = () => {
    switch (activeTab) {
      case 'owned': return wikis.owned;
      case 'team': return wikis.team;
      case 'public': return wikis.public;
      default: return [];
    }
  };

  const filteredWikis = getAllWikis().filter(wiki =>
    wiki.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wiki.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !wikis.owned.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="wiki-list">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Wikis</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          New Wiki
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        {['owned', 'team', 'public'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 capitalize ${activeTab === tab
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'owned' ? 'My Wikis' : tab === 'team' ? 'Team' : 'Public'}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search wikis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {filteredWikis.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Book size={48} className="mx-auto mb-4 opacity-50" />
          <p>No wikis found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Create your first wiki
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWikis.map(wiki => (
            <div
              key={wiki.id}
              onClick={() => navigate(`/wiki/${wiki.slug}`)}
              className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: wiki.color || '#3B82F6' }}
                  >
                    <Book size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{wiki.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {getVisibilityIcon(wiki.visibility)}
                      <span className="capitalize">{wiki.visibility}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/wiki/${wiki.slug}/recent-changes`); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Recent changes"
                  >
                    <Clock3 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/wiki/${wiki.slug}/settings`); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Settings"
                  >
                    <Settings size={16} />
                  </button>
                  {activeTab === 'owned' && (
                    <button
                      onClick={(e) => handleDeleteWiki(e, wiki.slug)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete wiki"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              {wiki.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{wiki.description}</p>
              )}
              {wiki.role && (
                <span className="mt-2 inline-block text-xs px-2 py-1 bg-gray-100 rounded">
                  {wiki.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Wiki</h2>
            <form onSubmit={handleCreateWiki}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Wiki Name</label>
                <input
                  type="text"
                  value={newWiki.name}
                  onChange={(e) => setNewWiki({ ...newWiki, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newWiki.description}
                  onChange={(e) => setNewWiki({ ...newWiki, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Visibility</label>
                <select
                  value={newWiki.visibility}
                  onChange={(e) => setNewWiki({ ...newWiki, visibility: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="private">Private</option>
                  <option value="team">Team</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiList;

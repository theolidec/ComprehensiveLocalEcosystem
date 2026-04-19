import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWiki } from '../../contexts/WikiContext';
import { Book, Plus, ChevronRight, FileText, Search, Loader2, Edit, History, Settings, ArrowLeft, Clock3 } from 'lucide-react';

const WikiView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentWiki, pages, loading, error, getWiki, fetchPages, permissions, searchWiki } = useWiki();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (slug) {
      getWiki(slug);
      fetchPages(slug);
    }
  }, [slug, getWiki, fetchPages]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await searchWiki(slug, query);
        setSearchResults(results.results || []);
        setShowSearch(true);
      } catch (err) {
        console.error('Search failed:', err);
      }
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const renderPageTree = (pageList, level = 0) => {
    return pageList.map(page => (
      <div key={page.id} style={{ paddingLeft: level * 16 }}>
        <Link
          to={`/wiki/${slug}/${page.slug}`}
          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 text-sm"
        >
          <FileText size={14} className="text-gray-400" />
          <span>{page.title}</span>
          {page.isHomePage && (
            <span className="text-xs text-gray-400">(home)</span>
          )}
        </Link>
        {page.children && page.children.length > 0 && renderPageTree(page.children, level + 1)}
      </div>
    ));
  };

  if (loading && !currentWiki) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!currentWiki) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Wiki not found</p>
      </div>
    );
  }

  const canEdit = permissions?.canEdit;

  return (
    <div className="wiki-view flex h-full">
      <div className="w-64 border-r bg-gray-50 p-4 flex flex-col">
        <button
          onClick={() => navigate('/wikis')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Wikis
        </button>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="w-full pl-7 pr-2 py-1.5 text-sm border rounded"
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto z-10">
              {searchResults.map(result => (
                <Link
                  key={result.id}
                  to={`/wiki/${slug}/${result.slug}`}
                  className="block px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">{result.title}</div>
                  {result.excerpt && (
                    <div className="text-xs text-gray-500 truncate">{result.excerpt}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Pages</div>
          {pages.length > 0 ? (
            renderPageTree(pages)
          ) : (
            <p className="text-sm text-gray-500">No pages yet</p>
          )}
        </div>

        {canEdit && (
          <button
            onClick={() => navigate(`/wiki/${slug}/new`)}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            <Plus size={16} />
            New Page
          </button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: currentWiki.color || '#3B82F6' }}
            >
              <Book size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentWiki.name}</h1>
              {currentWiki.description && (
                <p className="text-gray-500">{currentWiki.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/wiki/${slug}/edit/home`)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Edit size={16} />
                Edit Home
              </button>
            )}
            <button
              onClick={() => navigate(`/wiki/${slug}/history/home`)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <History size={16} />
              History
            </button>
            <button
              onClick={() => navigate(`/wiki/${slug}/recent-changes`)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Clock3 size={16} />
              Recent
            </button>
            {permissions?.role === 'owner' && (
              <button
                onClick={() => navigate(`/wiki/${slug}/settings`)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Settings size={16} />
                Settings
              </button>
            )}
          </div>
        </div>

        <div className="prose max-w-none">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-6">
              Select a page from the sidebar or choose an action below
            </p>
            <div className="flex items-center justify-center gap-4 text-white">
              {canEdit && (
                <button
                  onClick={() => navigate(`/wiki/${slug}/new`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Create Page
                </button>
              )}
              <button
                onClick={() => navigate(`/wiki/${slug}/edit/home`)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Edit size={18} />
                Edit Home
              </button>
              <button
                onClick={() => navigate(`/wiki/${slug}/home`)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <FileText size={18} />
                View Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiView;

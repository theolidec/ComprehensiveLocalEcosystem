import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWiki } from '../../contexts/WikiContext';
import { ArrowLeft, Clock, User, Loader2, FileText } from 'lucide-react';

const WikiRecentChanges = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { loading, error, getRecentChanges, getWiki } = useWiki();
  const [changes, setChanges] = useState([]);
  const [wiki, setWiki] = useState(null);

  useEffect(() => {
    if (slug) {
      getWiki(slug).then(data => setWiki(data.wiki)).catch(console.error);
      getRecentChanges(slug).then(data => setChanges(data.changes || [])).catch(console.error);
    }
  }, [slug, getWiki, getRecentChanges]);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="wiki-recent-changes h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/wiki/${slug}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Recent Changes</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        {changes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No recent changes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map((change, idx) => (
              <div key={change.id || idx} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-gray-400" />
                    <Link
                      to={`/wiki/${slug}/${change.page?.slug}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {change.page?.title || 'Unknown page'}
                    </Link>
                    {change.editSummary && (
                      <span className="text-sm text-gray-500">- {change.editSummary}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {change.editedBy?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(change.createdAt)}
                    </span>
                    <span className="text-xs">v{change.version}</span>
                  </div>
                </div>
                <Link
                  to={`/wiki/${slug}/history/${change.page?.slug}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiRecentChanges;

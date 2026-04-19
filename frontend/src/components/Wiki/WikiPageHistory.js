import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWiki } from '../../contexts/WikiContext';
import { ArrowLeft, Clock, User, Loader2, RotateCcw, GitCompare, ChevronLeft, ChevronRight } from 'lucide-react';

const WikiPageHistory = () => {
  const { slug, pageSlug } = useParams();
  const navigate = useNavigate();
  const { loading, error, getPageHistory, getDiff, restoreVersion, getPage } = useWiki();
  const [versions, setVersions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [diff, setDiff] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadHistory(1);
  }, [slug, pageSlug]);

  const loadHistory = async (page) => {
    try {
      const data = await getPageHistory(slug, pageSlug, page);
      setVersions(data.versions || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleVersionSelect = (versionId) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) return;
    try {
      const data = await getDiff(slug, pageSlug, selectedVersions[0], selectedVersions[1]);
      setDiff(data);
      setViewingVersion(null);
    } catch (err) {
      console.error('Failed to get diff:', err);
    }
  };

  const handleViewVersion = async (versionId) => {
    try {
      const data = await getPageHistory(slug, pageSlug, 1);
      const version = data.versions.find(v => v.id === versionId);
      setViewingVersion(version);
      setDiff(null);
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this version? Current content will be saved as a new version.')) {
      return;
    }
    setRestoring(true);
    try {
      await restoreVersion(slug, pageSlug, versionId);
      navigate(`/wiki/${slug}/${pageSlug}`);
    } catch (err) {
      console.error('Failed to restore version:', err);
      alert(err.message || 'Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="wiki-page-history h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/wiki/${slug}/${pageSlug}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold">Page History</h1>
        </div>
        {selectedVersions.length === 2 && (
          <button
            onClick={handleCompare}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <GitCompare size={16} />
            Compare
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : diff ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Comparing versions</h2>
              <button
                onClick={() => setDiff(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Back to history
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b text-sm">
                <div>
                  <span className="text-gray-500">Version {diff.version1?.version}</span>
                  <span className="mx-2">vs</span>
                  <span className="text-gray-500">Version {diff.version2?.version}</span>
                </div>
              </div>
              <div className="font-mono text-sm">
                {diff.diff.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex px-4 py-0.5 ${
                      line.type === 'added' ? 'bg-green-100 text-green-800' :
                      line.type === 'removed' ? 'bg-red-100 text-red-800' :
                      'text-gray-600'
                    }`}
                  >
                    <span className="w-8 text-gray-400 select-none">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewingVersion ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Version {viewingVersion.version}</h2>
                <p className="text-sm text-gray-500">
                  {formatDate(viewingVersion.createdAt)} by {viewingVersion.editedBy?.name || 'Unknown'}
                </p>
                {viewingVersion.editSummary && (
                  <p className="text-sm text-gray-600 mt-1">{viewingVersion.editSummary}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(viewingVersion.id)}
                  disabled={restoring}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  {restoring ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  onClick={() => setViewingVersion(null)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold mb-2">{viewingVersion.title}</h3>
              <pre className="whitespace-pre-wrap text-sm">{viewingVersion.content}</pre>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {versions.map(version => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersions.includes(version.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleVersionSelect(version.id)}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.id)}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">Version {version.version}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {version.editedBy?.name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      {version.editSummary && (
                        <div className="text-sm text-gray-600 mt-1">{version.editSummary}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewVersion(version.id); }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(version.id); }}
                      disabled={restoring}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => loadHistory(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => loadHistory(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WikiPageHistory;

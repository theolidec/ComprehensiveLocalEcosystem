import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useWiki } from '../../contexts/WikiContext';
import { Edit, History, Settings, ArrowLeft, Loader2, Tag, Link as LinkIcon, Clock, User, ChevronRight, Eye, EyeOff, Scissors, FileText, Clock3 } from 'lucide-react';

const WikiPageView = () => {
  const { slug, pageSlug } = useParams();
  const navigate = useNavigate();
  const { currentPage, currentWiki, pages, loading, error, getPage, permissions, getBacklinks, addToWatchlist, removeFromWatchlist, movePage } = useWiki();
  const [backlinks, setBacklinks] = useState([]);
  const [showToc, setShowToc] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (slug && pageSlug) {
      getPage(slug, pageSlug);
    }
  }, [slug, pageSlug, getPage]);

  useEffect(() => {
    if (currentPage && slug && pageSlug) {
      getBacklinks(slug, pageSlug)
        .then(data => setBacklinks(data.backlinks || []))
        .catch(err => console.error('Failed to fetch backlinks:', err));
    }
  }, [currentPage, slug, pageSlug, getBacklinks]);

  const handleWatchToggle = async () => {
    try {
      if (isWatching) {
        await removeFromWatchlist(slug, pageSlug);
        setIsWatching(false);
      } else {
        await addToWatchlist(slug, pageSlug);
        setIsWatching(true);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  const handleMove = async () => {
    if (!newTitle.trim()) return;
    try {
      const result = await movePage(slug, pageSlug, newTitle);
      setShowMoveModal(false);
      navigate(`/wiki/${slug}/${result.page.slug}`);
    } catch (err) {
      console.error('Failed to move page:', err);
      alert(err.message || 'Failed to move page');
    }
  };

  const renderHeading = (props) => {
    const Tag = `h${props.level}`;
    const id = props.children.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return <Tag id={id} {...props} />;
  };

  const renderLink = ({ href, children }) => {
    if (href?.startsWith('http')) {
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    }
    if (href?.startsWith('#')) {
      return <a href={href}>{children}</a>;
    }
    return <Link to={href}>{children}</Link>;
  };

  if (loading && !currentPage) {
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

  if (!currentPage) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Page not found</p>
      </div>
    );
  }

  const canEdit = permissions?.canEdit;
  const headings = currentPage.headings || [];

  return (
    <div className="wiki-page-view flex h-full">
      {showToc && headings.length > 2 && (
        <div className="w-56 border-r bg-gray-50 p-4 hidden lg:block">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Contents</div>
          <nav className="space-y-1">
            {headings.map((heading, idx) => (
              <a
                key={idx}
                href={`#${heading.slug}`}
                className={`block text-sm hover:text-blue-600 ${heading.level === 2 ? 'pl-3' : heading.level === 3 ? 'pl-6' : ''}`}
              >
                {heading.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to={`/wiki/${slug}`} className="hover:text-gray-700">Wiki</Link>
          <ChevronRight size={14} />
          <span>{currentPage.title}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{currentPage.title}</h1>
          <div className="flex gap-2">
            <button
              onClick={handleWatchToggle}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
              title={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isWatching ? <EyeOff size={16} /> : <Eye size={16} />}
              {isWatching ? 'Unwatch' : 'Watch'}
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => { setNewTitle(currentPage.title); setShowMoveModal(true); }}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Move page"
                >
                  <Scissors size={16} />
                  Move
                </button>
                <button
                  onClick={() => navigate(`/wiki/${slug}/edit/${pageSlug}`)}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/wiki/${slug}/history/${pageSlug}`)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              <History size={16} />
              History
            </button>
          </div>
        </div>

        {currentPage.lastEditedBy && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{currentPage.lastEditedBy.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{new Date(currentPage.lastEditedAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1 prose max-w-none">
            <ReactMarkdown
              components={{
                h1: renderHeading,
                h2: renderHeading,
                h3: renderHeading,
                h4: renderHeading,
                h5: renderHeading,
                h6: renderHeading,
                a: renderLink
              }}
            >
              {currentPage.content || '*No content yet*'}
            </ReactMarkdown>
          </div>

          {(currentPage.infobox || currentPage.tags?.length > 0 || currentPage.categories?.length > 0) && (
            <div className="w-72 shrink-0 hidden xl:block">
              {currentPage.infobox && (
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-100 px-3 py-2 font-semibold text-sm">
                    {currentPage.title}
                  </div>
                  <table className="w-full text-sm">
                    {Object.entries(currentPage.infobox).map(([key, value]) => (
                      <tr key={key} className="border-t">
                        <td className="px-3 py-2 font-medium bg-gray-50 w-1/3">{key}</td>
                        <td className="px-3 py-2">{value}</td>
                      </tr>
                    ))}
                  </table>
                </div>
              )}

              {currentPage.tags?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase mb-2">
                    <Tag size={12} />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentPage.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPage.categories?.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Categories</div>
                  <div className="space-y-1">
                    {currentPage.categories.map((cat, idx) => (
                      <div key={idx} className="text-sm">
                        <span
                          className="w-2 h-2 inline-block rounded-full mr-1"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {backlinks.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-3">
              <LinkIcon size={14} />
              Pages linking here
            </div>
            <div className="flex flex-wrap gap-2">
              {backlinks.map(link => (
                <Link
                  key={link.id}
                  to={`/wiki/${slug}/${link.slug}`}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                >
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Move Page</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter new page title"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiPageView;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useWiki } from '../../contexts/WikiContext';
import { Save, Eye, EyeOff, Loader2, ArrowLeft, Plus, X, Info } from 'lucide-react';

const WikiPageEditor = () => {
  const { slug, pageSlug } = useParams();
  const navigate = useNavigate();
  const { currentPage, loading, error, getPage, createPage, updatePage, pages, fetchPages, getCategories } = useWiki();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [infobox, setInfobox] = useState(null);
  const [showInfobox, setShowInfobox] = useState(false);
  const [infoboxKey, setInfoboxKey] = useState('');
  const [infoboxValue, setInfoboxValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [editSummary, setEditSummary] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  const isNew = pageSlug === 'new';

  useEffect(() => {
    fetchPages(slug);
    getCategories(slug).then(data => setCategories(data.categories || [])).catch(console.error);
  }, [slug, fetchPages, getCategories]);

  useEffect(() => {
    if (!isNew && pageSlug) {
      getPage(slug, pageSlug).then(data => {
        setTitle(data.page.title);
        setContent(data.page.content || '');
        setTags(data.page.tags || []);
        setInfobox(data.page.infobox || null);
        setSelectedCategories(data.page.categories?.map(c => c.id) || []);
      }).catch(console.error);
    }
  }, [slug, pageSlug, isNew, getPage]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddInfoboxField = () => {
    if (infoboxKey.trim()) {
      setInfobox({ ...infobox, [infoboxKey]: infoboxValue });
      setInfoboxKey('');
      setInfoboxValue('');
    }
  };

  const handleRemoveInfoboxField = (key) => {
    const newInfobox = { ...infobox };
    delete newInfobox[key];
    setInfobox(newInfobox);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        title: title.trim(),
        content,
        parentId: parentId || null,
        tags,
        categoryIds: selectedCategories,
        infobox: Object.keys(infobox || {}).length > 0 ? infobox : null,
        editSummary
      };

      if (isNew) {
        const result = await createPage(slug, pageData);
        navigate(`/wiki/${slug}/${result.page.slug}`);
      } else {
        await updatePage(slug, pageSlug, pageData);
        navigate(`/wiki/${slug}/${pageSlug}`);
      }
    } catch (err) {
      console.error('Failed to save page:', err);
      alert(err.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const flattenPages = (pageList, level = 0) => {
    let result = [];
    pageList.forEach(page => {
      result.push({ ...page, level });
      if (page.children?.length) {
        result = result.concat(flattenPages(page.children, level + 1));
      }
    });
    return result;
  };

  const flatPages = flattenPages(pages).filter(p => p.slug !== pageSlug);

  return (
    <div className="wiki-page-editor h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/wiki/${slug}${pageSlug !== 'new' ? `/${pageSlug}` : ''}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold">{isNew ? 'New Page' : 'Edit Page'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
              placeholder="Page title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Parent Page</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">None (top level)</option>
                {flatPages.map(page => (
                  <option key={page.id} value={page.id}>
                    {'-'.repeat(page.level)} {page.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categories</label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px]">
                {categories.filter(c => selectedCategories.includes(c.id)).map(cat => (
                  <span
                    key={cat.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-sm"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    {cat.name}
                    <button onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== cat.id))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <select
                  value=""
                  onChange={(e) => e.target.value && setSelectedCategories([...selectedCategories, e.target.value])}
                  className="border-none bg-transparent text-sm"
                >
                  <option value="">+ Add</option>
                  {categories.filter(c => !selectedCategories.includes(c.id)).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px]">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-sm">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)}><X size={12} /></button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="border-none bg-transparent text-sm flex-1 min-w-[100px]"
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowInfobox(!showInfobox)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <Info size={16} />
              {showInfobox ? 'Hide' : 'Show'} Infobox
            </button>
            {showInfobox && (
              <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={infoboxKey}
                    onChange={(e) => setInfoboxKey(e.target.value)}
                    placeholder="Key"
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={infoboxValue}
                    onChange={(e) => setInfoboxValue(e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={handleAddInfoboxField}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Add
                  </button>
                </div>
                {infobox && Object.entries(infobox).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1 text-sm">
                    <span><strong>{key}:</strong> {value}</span>
                    <button onClick={() => handleRemoveInfoboxField(key)} className="text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
            <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 px-3 py-2 border rounded-lg font-mono text-sm resize-none"
                placeholder="Write your content in Markdown..."
              />
              {showPreview && (
                <div className="h-96 overflow-auto p-4 border rounded-lg bg-white prose prose-sm">
                  <ReactMarkdown>{content || '*No content*'}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Edit Summary</label>
            <input
              type="text"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Briefly describe your changes (optional)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WikiPageEditor;

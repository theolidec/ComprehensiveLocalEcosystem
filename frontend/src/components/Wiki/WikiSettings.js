import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWiki } from '../../contexts/WikiContext';
import { ArrowLeft, Loader2, Save, Trash2, Users, Plus, X, Globe, Lock, UserPlus } from 'lucide-react';

const WikiSettings = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentWiki, loading, error, getWiki, updateWiki, deleteWiki } = useWiki();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [allowPublicRead, setAllowPublicRead] = useState(false);
  const [allowPublicEdit, setAllowPublicEdit] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState({ owner: null, members: [] });
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (slug) {
      getWiki(slug).then(data => {
        if (data.wiki) {
          setName(data.wiki.name);
          setDescription(data.wiki.description || '');
          setVisibility(data.wiki.visibility);
          setAllowPublicRead(data.wiki.allowPublicRead);
          setAllowPublicEdit(data.wiki.allowPublicEdit);
          setColor(data.wiki.color || '#3B82F6');
        }
      }).catch(console.error);
    }
  }, [slug, getWiki]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWiki(slug, {
        name,
        description,
        visibility,
        allowPublicRead,
        allowPublicEdit,
        color
      });
      alert('Settings saved!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this wiki? All pages will be permanently lost.')) {
      return;
    }
    if (!window.confirm('This action cannot be undone. Are you absolutely sure?')) {
      return;
    }
    try {
      await deleteWiki(slug);
      navigate('/wikis');
    } catch (err) {
      console.error('Failed to delete wiki:', err);
      alert(err.message || 'Failed to delete wiki');
    }
  };

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (loading && !currentWiki) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="wiki-settings h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/wiki/${slug}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Wiki Settings</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        <div className="flex gap-4 mb-6 border-b">
          {['general', 'permissions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 capitalize ${activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Wiki Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-lg ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Visibility</label>
              <div className="space-y-2">
                {[
                  { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can access' },
                  { value: 'team', label: 'Team', icon: Users, desc: 'Invited members only' },
                  { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and view' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                      visibility === option.value ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-4 h-4"
                    />
                    <option.icon size={20} className="text-gray-500" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowPublicRead}
                  onChange={(e) => setAllowPublicRead(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Allow public read access</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowPublicEdit}
                  onChange={(e) => setAllowPublicEdit(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Allow public edits (anyone can edit)</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete Wiki
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Owner</h3>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {members.owner?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-medium">{members.owner?.name || currentWiki?.owner?.name}</div>
                  <div className="text-sm text-gray-500">{members.owner?.email || currentWiki?.owner?.email}</div>
                </div>
                <span className="ml-auto text-sm text-gray-500">Owner</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Team Members</h3>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <UserPlus size={14} />
                  Invite
                </button>
              </div>
              {members.members?.length > 0 ? (
                <div className="space-y-2">
                  {members.members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{member.user?.name}</div>
                        <div className="text-sm text-gray-500">{member.user?.email}</div>
                      </div>
                      <select
                        value={member.role}
                        className="text-sm border rounded px-2 py-1"
                        onChange={() => {}}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button className="text-gray-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No team members yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiSettings;

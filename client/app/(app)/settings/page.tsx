'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { invalidateTagCache } from '@/lib/useTags';

/* ─── Types ─── */
interface RoadmapModule { _id: string; title: string; description: string; level: string; order: number; isActive: boolean; }
interface Tag { _id: string; name: string; type: string; color: string; colorSelected: string; }
interface Topic { _id: string; title: string; description?: string; level: string; }
type ErrShape = { response?: { data?: { message?: string } } };

const LEVEL_OPTS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const TOPIC_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COLOR_PALETTE = [
  { label: 'Orange',  color: 'bg-orange-100 text-orange-700 border-orange-200', sel: 'bg-orange-500 text-white' },
  { label: 'Blue',    color: 'bg-blue-100 text-blue-700 border-blue-200',       sel: 'bg-blue-600 text-white' },
  { label: 'Purple',  color: 'bg-purple-100 text-purple-700 border-purple-200', sel: 'bg-purple-600 text-white' },
  { label: 'Rose',    color: 'bg-rose/10 text-rose border-rose/20',             sel: 'bg-rose text-white' },
  { label: 'Green',   color: 'bg-emerald/10 text-emerald border-emerald/20',    sel: 'bg-emerald text-white' },
  { label: 'Yellow',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200', sel: 'bg-yellow-500 text-white' },
  { label: 'Indigo',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200', sel: 'bg-indigo-600 text-white' },
  { label: 'Pink',    color: 'bg-pink-100 text-pink-700 border-pink-200',       sel: 'bg-pink-600 text-white' },
];

const levelBadge = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : l === 'Advanced' ? 'badge-advanced' : 'bg-parchment text-muted px-2 py-0.5 rounded-full text-xs font-semibold border border-parchment';

/* ─── Section wrapper ─── */
function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section id={id} className="card p-5 md:p-7">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-parchment">
        <h2 className="font-display text-xl font-semibold text-ink flex-1">{title}</h2>
        {count !== undefined && <span className="text-sm text-muted">{count} item{count !== 1 ? 's' : ''}</span>}
      </div>
      {children}
    </section>
  );
}

/* ═══════════════════════════════════ MAIN PAGE ═══════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'tags' | 'topics'>('roadmap');

  /* ─── Roadmap modules state ─── */
  const [modules, setModules]           = useState<RoadmapModule[]>([]);
  const [modLoading, setModLoading]     = useState(true);
  const [modForm, setModForm]           = useState({ title: '', description: '', level: 'All', order: '' });
  const [modSaving, setModSaving]       = useState(false);
  const [modError, setModError]         = useState('');
  const [editingMod, setEditingMod]     = useState<RoadmapModule | null>(null);
  const [editModForm, setEditModForm]   = useState({ title: '', description: '', level: 'All', order: '', isActive: true });
  const [editModSaving, setEditModSaving] = useState(false);
  const [deletingModId, setDeletingModId] = useState<string | null>(null);

  /* ─── Tags state ─── */
  const [tags, setTags]               = useState<Tag[]>([]);
  const [tagLoading, setTagLoading]   = useState(true);
  const [tagForm, setTagForm]         = useState({ name: '', type: 'weakness', color: COLOR_PALETTE[0].color });
  const [tagSaving, setTagSaving]     = useState(false);
  const [tagError, setTagError]       = useState('');
  const [editingTag, setEditingTag]   = useState<Tag | null>(null);
  const [editTagForm, setEditTagForm] = useState({ name: '', type: 'weakness', color: '' });
  const [editTagSaving, setEditTagSaving] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  /* ─── Topics state ─── */
  const [topics, setTopics]             = useState<Topic[]>([]);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicForm, setTopicForm]       = useState({ title: '', description: '', level: 'Beginner' });
  const [topicSaving, setTopicSaving]   = useState(false);
  const [topicError, setTopicError]     = useState('');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editTopicForm, setEditTopicForm] = useState({ title: '', description: '', level: 'Beginner' });
  const [editTopicSaving, setEditTopicSaving] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [topicLevelFilter, setTopicLevelFilter] = useState('');
  const [topicSearch, setTopicSearch]   = useState('');

  /* ─── Load data ─── */
  const loadModules = useCallback(async () => {
    setModLoading(true);
    try { const { data } = await api.get('/roadmap-modules'); setModules(data); }
    finally { setModLoading(false); }
  }, []);

  const loadTags = useCallback(async () => {
    setTagLoading(true);
    try { const { data } = await api.get('/tags'); setTags(data); invalidateTagCache(); }
    finally { setTagLoading(false); }
  }, []);

  const loadTopics = useCallback(async () => {
    setTopicLoading(true);
    try { const { data } = await api.get('/topics'); setTopics(data); }
    finally { setTopicLoading(false); }
  }, []);

  useEffect(() => { loadModules(); loadTags(); loadTopics(); }, [loadModules, loadTags, loadTopics]);

  /* ══════════ ROADMAP MODULE HANDLERS ══════════ */
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault(); setModError(''); setModSaving(true);
    try {
      const payload = { ...modForm, order: modForm.order !== '' ? parseInt(modForm.order) : undefined };
      const { data } = await api.post('/roadmap-modules', payload);
      setModules(prev => [...prev, data].sort((a, b) => a.order - b.order));
      setModForm({ title: '', description: '', level: 'All', order: '' });
    } catch (err) { setModError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setModSaving(false); }
  };

  const startEditModule = (mod: RoadmapModule) => {
    setEditingMod(mod);
    setEditModForm({ title: mod.title, description: mod.description, level: mod.level, order: String(mod.order), isActive: mod.isActive });
  };

  const handleUpdateModule = async (id: string) => {
    setEditModSaving(true);
    try {
      const { data } = await api.put(`/roadmap-modules/${id}`, { ...editModForm, order: parseInt(editModForm.order) || 0 });
      setModules(prev => prev.map(m => m._id === id ? data : m).sort((a, b) => a.order - b.order));
      setEditingMod(null);
    } catch (err) { alert((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setEditModSaving(false); }
  };

  const handleDeleteModule = async (id: string, title: string) => {
    if (!confirm(`Delete module "${title}"? All student progress for this module will be removed.`)) return;
    setDeletingModId(id);
    try { await api.delete(`/roadmap-modules/${id}`); setModules(prev => prev.filter(m => m._id !== id)); }
    finally { setDeletingModId(null); }
  };

  const moveModule = async (id: string, dir: -1 | 1) => {
    const idx = modules.findIndex(m => m._id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === modules.length - 1)) return;
    const next = [...modules];
    const swap = idx + dir;
    [next[idx].order, next[swap].order] = [next[swap].order, next[idx].order];
    const items = next.map(m => ({ id: m._id, order: m.order }));
    const { data } = await api.post('/roadmap-modules/reorder', { items });
    setModules(data);
  };

  /* ══════════ TAG HANDLERS ══════════ */
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault(); setTagError(''); setTagSaving(true);
    try {
      const { data } = await api.post('/tags', tagForm);
      setTags(prev => [...prev, data]);
      setTagForm({ name: '', type: 'weakness', color: COLOR_PALETTE[0].color });
      invalidateTagCache();
    } catch (err) { setTagError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setTagSaving(false); }
  };

  const startEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditTagForm({ name: tag.name, type: tag.type, color: tag.color });
  };

  const handleUpdateTag = async (id: string) => {
    setEditTagSaving(true);
    try {
      const { data } = await api.put(`/tags/${id}`, editTagForm);
      setTags(prev => prev.map(t => t._id === id ? data : t));
      setEditingTag(null);
      invalidateTagCache();
    } catch (err) { alert((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setEditTagSaving(false); }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Delete tag "${name}"? It will be removed from all students.`)) return;
    setDeletingTagId(id);
    try { await api.delete(`/tags/${id}`); setTags(prev => prev.filter(t => t._id !== id)); invalidateTagCache(); }
    finally { setDeletingTagId(null); }
  };

  /* ══════════ TOPIC HANDLERS ══════════ */
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault(); setTopicError(''); setTopicSaving(true);
    try {
      const { data } = await api.post('/topics', topicForm);
      setTopics(prev => [data, ...prev]);
      setTopicForm({ title: '', description: '', level: 'Beginner' });
    } catch (err) { setTopicError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setTopicSaving(false); }
  };

  const startEditTopic = (t: Topic) => { setEditingTopic(t); setEditTopicForm({ title: t.title, description: t.description || '', level: t.level }); };

  const handleUpdateTopic = async (id: string) => {
    setEditTopicSaving(true);
    try {
      const { data } = await api.put(`/topics/${id}`, editTopicForm);
      setTopics(prev => prev.map(t => t._id === id ? data : t));
      setEditingTopic(null);
    } catch (err) { alert((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setEditTopicSaving(false); }
  };

  const handleDeleteTopic = async (id: string, title: string) => {
    if (!confirm(`Delete topic "${title}"?`)) return;
    setDeletingTopicId(id);
    try { await api.delete(`/topics/${id}`); setTopics(prev => prev.filter(t => t._id !== id)); }
    finally { setDeletingTopicId(null); }
  };

  const filteredTopics = topics.filter(t => {
    if (topicLevelFilter && t.level !== topicLevelFilter) return false;
    if (topicSearch && !t.title.toLowerCase().includes(topicSearch.toLowerCase())) return false;
    return true;
  });

  /* ══════════ RENDER ══════════ */
  const tabs = [
    { id: 'roadmap' as const, label: '🗺 Roadmap Modules', count: modules.length },
    { id: 'tags'    as const, label: '🏷 Weakness Tags',   count: tags.length },
    { id: 'topics'  as const, label: '💬 Topics Library',  count: topics.length },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Settings</h1>
        <p className="text-muted text-sm mt-1">Manage all dynamic content — no developer needed.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              activeTab === tab.id
                ? 'bg-ink text-cream border-ink'
                : 'bg-white text-muted border-parchment hover:text-ink hover:border-amber/30'
            }`}>
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-parchment'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ════════════ ROADMAP MODULES TAB ════════════ */}
      {activeTab === 'roadmap' && (
        <Section id="roadmap" title="Roadmap Modules" count={modules.length}>
          {/* Create form */}
          <div className="bg-parchment/50 rounded-xl p-4 mb-6 border border-parchment">
            <h3 className="text-sm font-semibold text-ink mb-3">Add New Module</h3>
            {modError && <div className="mb-3 text-rose text-xs px-3 py-2 bg-rose/10 rounded-lg">{modError}</div>}
            <form onSubmit={handleCreateModule} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Title *</label>
                  <input className="input" value={modForm.title} onChange={e => setModForm({ ...modForm, title: e.target.value })} required placeholder="e.g. Self Introduction" />
                </div>
                <div>
                  <label className="label">Level</label>
                  <select className="input" value={modForm.level} onChange={e => setModForm({ ...modForm, level: e.target.value })}>
                    {LEVEL_OPTS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <input className="input" value={modForm.description} onChange={e => setModForm({ ...modForm, description: e.target.value })} placeholder="Optional — shown to students" />
                </div>
                <div>
                  <label className="label">Order #</label>
                  <input type="number" className="input" value={modForm.order} onChange={e => setModForm({ ...modForm, order: e.target.value })} placeholder="Auto" />
                </div>
              </div>
              <button type="submit" disabled={modSaving} className="btn-primary text-sm">{modSaving ? 'Adding…' : '+ Add Module'}</button>
            </form>
          </div>

          {/* Module list */}
          {modLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" /></div>
          : modules.length === 0 ? <div className="text-center py-10 text-muted text-sm">No modules yet. Add one above.</div>
          : (
            <div className="space-y-2">
              {modules.map((mod, idx) => (
                <div key={mod._id} className={`rounded-xl border p-4 ${mod.isActive ? 'bg-white border-parchment' : 'bg-parchment/40 border-parchment opacity-60'}`}>
                  {editingMod?._id === mod._id ? (
                    /* Edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="label">Title</label>
                          <input className="input" value={editModForm.title} onChange={e => setEditModForm({ ...editModForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Level</label>
                          <select className="input" value={editModForm.level} onChange={e => setEditModForm({ ...editModForm, level: e.target.value })}>
                            {LEVEL_OPTS.map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="label">Description</label>
                          <input className="input" value={editModForm.description} onChange={e => setEditModForm({ ...editModForm, description: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Order #</label>
                          <input type="number" className="input" value={editModForm.order} onChange={e => setEditModForm({ ...editModForm, order: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id={`active-${mod._id}`} checked={editModForm.isActive}
                          onChange={e => setEditModForm({ ...editModForm, isActive: e.target.checked })}
                          className="w-4 h-4 accent-amber cursor-pointer" />
                        <label htmlFor={`active-${mod._id}`} className="text-sm text-ink cursor-pointer">Active (visible to students)</label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateModule(mod._id)} disabled={editModSaving} className="btn-primary text-xs px-3 py-1.5">{editModSaving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => setEditingMod(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* View row */
                    <div className="flex items-center gap-3">
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveModule(mod._id, -1)} disabled={idx === 0}
                          className="text-muted hover:text-ink disabled:opacity-30 text-xs leading-none px-1">▲</button>
                        <button onClick={() => moveModule(mod._id, 1)} disabled={idx === modules.length - 1}
                          className="text-muted hover:text-ink disabled:opacity-30 text-xs leading-none px-1">▼</button>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-parchment flex items-center justify-center text-xs font-bold text-muted flex-shrink-0">
                        {mod.order + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-ink">{mod.title}</span>
                          <span className={levelBadge(mod.level)}>{mod.level}</span>
                          {!mod.isActive && <span className="text-xs text-muted italic">(inactive)</span>}
                        </div>
                        {mod.description && <p className="text-xs text-muted truncate">{mod.description}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => startEditModule(mod)} className="text-xs text-muted hover:text-amber transition-colors px-2 py-1">Edit</button>
                        <button onClick={() => handleDeleteModule(mod._id, mod.title)} disabled={deletingModId === mod._id}
                          className="text-xs text-rose/50 hover:text-rose transition-colors px-2 py-1">
                          {deletingModId === mod._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ════════════ TAGS TAB ════════════ */}
      {activeTab === 'tags' && (
        <Section id="tags" title="Weakness Tags" count={tags.length}>
          {/* Create form */}
          <div className="bg-parchment/50 rounded-xl p-4 mb-6 border border-parchment">
            <h3 className="text-sm font-semibold text-ink mb-3">Add New Tag</h3>
            {tagError && <div className="mb-3 text-rose text-xs px-3 py-2 bg-rose/10 rounded-lg">{tagError}</div>}
            <form onSubmit={handleCreateTag} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Tag name *</label>
                  <input className="input" value={tagForm.name} onChange={e => setTagForm({ ...tagForm, name: e.target.value })} required placeholder="e.g. hesitation" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={tagForm.type} onChange={e => setTagForm({ ...tagForm, type: e.target.value })}>
                    <option value="weakness">Weakness</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_PALETTE.map(p => (
                    <button key={p.label} type="button" onClick={() => setTagForm({ ...tagForm, color: p.color })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all ${
                        tagForm.color === p.color ? `${p.sel} ring-2 ring-offset-1 ring-ink/30` : p.color
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              {tagForm.name && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Preview:</span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${tagForm.color}`}>{tagForm.name}</span>
                </div>
              )}
              <button type="submit" disabled={tagSaving} className="btn-primary text-sm">{tagSaving ? 'Creating…' : '+ Create Tag'}</button>
            </form>
          </div>

          {/* Tag list */}
          {tagLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" /></div>
          : tags.length === 0 ? <div className="text-center py-10 text-muted text-sm">No tags yet. Create one above.</div>
          : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div key={tag._id} className="bg-white rounded-xl border border-parchment p-4">
                  {editingTag?._id === tag._id ? (
                    /* Edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">Name</label>
                          <input className="input" value={editTagForm.name} onChange={e => setEditTagForm({ ...editTagForm, name: e.target.value })} /></div>
                        <div><label className="label">Type</label>
                          <select className="input" value={editTagForm.type} onChange={e => setEditTagForm({ ...editTagForm, type: e.target.value })}>
                            <option value="weakness">Weakness</option><option value="custom">Custom</option>
                          </select></div>
                      </div>
                      <div>
                        <label className="label">Color</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {COLOR_PALETTE.map(p => (
                            <button key={p.label} type="button" onClick={() => setEditTagForm({ ...editTagForm, color: p.color })}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${
                                editTagForm.color === p.color ? `${p.sel} ring-2 ring-offset-1 ring-ink/30` : p.color
                              }`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateTag(tag._id)} disabled={editTagSaving} className="btn-primary text-xs px-3 py-1.5">{editTagSaving ? '…' : 'Save'}</button>
                        <button onClick={() => setEditingTag(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${tag.color}`}>{tag.name}</span>
                      <span className="text-xs text-muted capitalize">{tag.type}</span>
                      <div className="flex gap-1.5 ml-auto">
                        <button onClick={() => startEditTag(tag)} className="text-xs text-muted hover:text-amber transition-colors px-2 py-1">Edit</button>
                        <button onClick={() => handleDeleteTag(tag._id, tag.name)} disabled={deletingTagId === tag._id}
                          className="text-xs text-rose/50 hover:text-rose transition-colors px-2 py-1">
                          {deletingTagId === tag._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ════════════ TOPICS TAB ════════════ */}
      {activeTab === 'topics' && (
        <Section id="topics" title="Topics Library" count={topics.length}>
          {/* Create form */}
          <div className="bg-parchment/50 rounded-xl p-4 mb-6 border border-parchment">
            <h3 className="text-sm font-semibold text-ink mb-3">Add New Topic</h3>
            {topicError && <div className="mb-3 text-rose text-xs px-3 py-2 bg-rose/10 rounded-lg">{topicError}</div>}
            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Title *</label>
                  <input className="input" value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} required placeholder="e.g. Describing your hometown" />
                </div>
                <div>
                  <label className="label">Level *</label>
                  <select className="input" value={topicForm.level} onChange={e => setTopicForm({ ...topicForm, level: e.target.value })}>
                    {TOPIC_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={topicForm.description}
                  onChange={e => setTopicForm({ ...topicForm, description: e.target.value })}
                  placeholder="Key points, phrases, objectives…" />
              </div>
              <button type="submit" disabled={topicSaving} className="btn-primary text-sm">{topicSaving ? 'Creating…' : '+ Add Topic'}</button>
            </form>
          </div>

          {/* Search + level filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <input type="text" className="input flex-1 max-w-xs" placeholder="Search topics…"
              value={topicSearch} onChange={e => setTopicSearch(e.target.value)} />
            <div className="flex gap-1">
              {['', ...TOPIC_LEVELS].map(l => (
                <button key={l} onClick={() => setTopicLevelFilter(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    topicLevelFilter === l ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-parchment hover:border-amber/30'
                  }`}>
                  {l || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Topic list */}
          {topicLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" /></div>
          : filteredTopics.length === 0 ? <div className="text-center py-10 text-muted text-sm">No topics found.</div>
          : (
            <div className="grid gap-2">
              {filteredTopics.map(topic => (
                <div key={topic._id} className="bg-white rounded-xl border border-parchment p-4">
                  {editingTopic?._id === topic._id ? (
                    /* Edit form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="label">Title</label>
                          <input className="input" value={editTopicForm.title} onChange={e => setEditTopicForm({ ...editTopicForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="label">Level</label>
                          <select className="input" value={editTopicForm.level} onChange={e => setEditTopicForm({ ...editTopicForm, level: e.target.value })}>
                            {TOPIC_LEVELS.map(l => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label">Description</label>
                        <textarea className="input resize-none" rows={2} value={editTopicForm.description}
                          onChange={e => setEditTopicForm({ ...editTopicForm, description: e.target.value })} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateTopic(topic._id)} disabled={editTopicSaving} className="btn-primary text-xs px-3 py-1.5">{editTopicSaving ? '…' : 'Save'}</button>
                        <button onClick={() => setEditingTopic(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-medium text-sm text-ink">{topic.title}</span>
                          <span className={levelBadge(topic.level)}>{topic.level}</span>
                        </div>
                        {topic.description && <p className="text-xs text-muted line-clamp-2">{topic.description}</p>}
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => startEditTopic(topic)} className="text-xs text-muted hover:text-amber transition-colors px-2 py-1">Edit</button>
                        <button onClick={() => handleDeleteTopic(topic._id, topic.title)} disabled={deletingTopicId === topic._id}
                          className="text-xs text-rose/50 hover:text-rose transition-colors px-2 py-1">
                          {deletingTopicId === topic._id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

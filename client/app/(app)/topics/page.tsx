'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Topic { _id: string; title: string; description?: string; level: string; createdAt: string; }

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

const levelBg = (l: string) =>
  l === 'Beginner' ? 'border-blue-200 bg-blue-50' :
  l === 'Intermediate' ? 'border-amber/20 bg-amber/5' : 'border-emerald/20 bg-emerald/5';

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', level: 'Beginner' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTopics = async (level?: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/topics', { params: level ? { level } : {} });
      setTopics(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTopics(filterLevel || undefined); }, [filterLevel]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/topics', form);
      setTopics((prev) => [data, ...prev]);
      setForm({ title: '', description: '', level: 'Beginner' });
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete topic "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/topics/${id}`);
      setTopics((prev) => prev.filter((t) => t._id !== id));
    } finally { setDeletingId(null); }
  };

  const grouped = ['Beginner', 'Intermediate', 'Advanced'].map((level) => ({
    level,
    items: topics.filter((t) => t.level === level),
  })).filter((g) => g.items.length > 0 || !filterLevel);

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Topics Library</h1>
          <p className="text-muted text-sm mt-0.5">{topics.length} speaking topics</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Topic'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Create Topic</h2>
          {error && <div className="mb-4 text-rose text-sm px-3 py-2 bg-rose/10 rounded-lg">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Introducing yourself at a party" />
              </div>
              <div>
                <label className="label">Level *</label>
                <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional: what to cover, key phrases, etc." />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create Topic'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Level filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filterLevel === level ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-parchment hover:border-amber/40'
            }`}
          >
            {level || 'All Levels'}
          </button>
        ))}
      </div>

      {/* Topics grouped by level */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-muted font-medium">No topics yet</p>
          <button onClick={() => setShowForm(true)} className="text-amber text-sm hover:underline mt-2">Create your first topic →</button>
        </div>
      ) : (
        <div className="space-y-6">
          {(filterLevel ? [{ level: filterLevel, items: topics }] : grouped).map(({ level, items }) => (
            items.length === 0 ? null :
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                <span className={levelColor(level)}>{level}</span>
                <span className="text-muted text-xs">{items.length} topic{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((topic) => (
                  <div key={topic._id} className={`card p-4 border ${levelBg(topic.level)} hover:shadow-card-hover transition-shadow`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-ink text-sm leading-snug">{topic.title}</p>
                        {topic.description && (
                          <p className="text-muted text-xs mt-1 leading-relaxed line-clamp-2">{topic.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(topic._id, topic.title)}
                        disabled={deletingId === topic._id}
                        className="text-rose/40 hover:text-rose text-xs flex-shrink-0 transition-colors pt-0.5"
                        title="Delete topic"
                      >
                        {deletingId === topic._id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Announcement { _id: string; message: string; createdAt: string; createdBy?: { name: string }; }
type ErrShape = { response?: { data?: { message?: string } } };

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editSaving, setEditSaving]   = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  useEffect(() => {
    api.get('/announcements').then(r => setAnnouncements(r.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(''); setSaving(true);
    try {
      const { data } = await api.post('/announcements', { message });
      setAnnouncements(prev => [data, ...prev]);
      setMessage('');
    } catch (err) { setError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const startEdit  = (a: Announcement) => { setEditingId(a._id); setEditMessage(a.message); };
  const cancelEdit = () => { setEditingId(null); setEditMessage(''); };

  const handleEdit = async (id: string) => {
    if (!editMessage.trim()) return;
    setEditSaving(true);
    try {
      const { data } = await api.put(`/announcements/${id}`, { message: editMessage });
      setAnnouncements(prev => prev.map(a => a._id === id ? data : a));
      cancelEdit();
    } catch (err) { alert((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } finally { setDeletingId(null); }
  };

  return (
    <div className="p-3 md:p-8 max-w-3xl mx-auto">
      <div className="mb-5 md:mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Announcements</h1>
        <p className="text-muted text-sm mt-1">Notes &amp; messages for the academy</p>
      </div>

      {/* Compose */}
      <div className="card p-4 md:p-6 mb-5 md:mb-6">
        <h2 className="font-display text-base md:text-lg font-semibold text-ink mb-3">New Announcement</h2>
        {error && <div className="mb-3 px-3 py-2 bg-rose/10 border border-rose/30 rounded-lg text-rose text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-3">
          <textarea
            className="input min-h-[80px] md:min-h-[90px] resize-none"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write an announcement, reminder, or note…"
            required
          />
          <div className="flex justify-end">
            <button type="submit" disabled={saving || !message.trim()} className="btn-primary text-xs md:text-sm">
              {saving ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-muted font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, idx) => (
            <div key={a._id} className={`card p-4 md:p-5 ${idx === 0 ? 'border-l-4 border-l-amber' : ''}`}>
              {editingId === a._id ? (
                <div className="space-y-3">
                  <textarea
                    className="input min-h-[70px] resize-none text-sm"
                    value={editMessage}
                    onChange={e => setEditMessage(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelEdit} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                    <button onClick={() => handleEdit(a._id)} disabled={editSaving || !editMessage.trim()}
                      className="btn-primary text-xs px-3 py-1.5">
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Message + actions — stacks naturally on mobile */}
                  <div className="flex items-start gap-3">
                    <p className="text-ink text-sm leading-relaxed flex-1">{a.message}</p>
                    {/* Actions always visible, no hover-only on mobile */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {idx === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber/10 text-amber whitespace-nowrap">
                          Latest
                        </span>
                      )}
                      <div className="flex gap-0.5">
                        <button onClick={() => startEdit(a)}
                          className="text-muted hover:text-amber text-xs px-2 py-1 transition-colors rounded">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(a._id)} disabled={deletingId === a._id}
                          className="text-rose/50 hover:text-rose text-xs px-2 py-1 transition-colors rounded">
                          {deletingId === a._id ? '…' : 'Del'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="w-5 h-5 rounded-full bg-ink/10 flex items-center justify-center text-ink text-xs font-bold flex-shrink-0">
                      {a.createdBy?.name?.[0] || 'T'}
                    </div>
                    <span className="text-muted text-xs">
                      {a.createdBy?.name || 'Teacher'} · {format(new Date(a.createdAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
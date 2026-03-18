'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { checkInStudent } from '@/lib/checkin';
import { format } from 'date-fns';
import { useTags } from '@/lib/useTags';

interface Student {
  _id: string; name: string; phone: string; level: string;
  goal: string; joiningDate: string; weaknessTags: string[];
  ratings: { confidence: number | null; fluency: number | null; grammar: number | null };
}
interface Topic { _id: string; title: string; level: string; }
type ErrShape = { response?: { data?: { message?: string } } };

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

export default function StudentsPage() {
  const { tags } = useTags();

  const [students, setStudents]     = useState<Student[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set<string>());

  // Filters
  const [search, setSearch]           = useState('');
  const [activeTags, setActiveTags]   = useState<string[]>([]);
  const [levelFilter, setLevel]       = useState('');
  const [ratingMin, setRatingMin]     = useState('');
  const [ratingMax, setRatingMax]     = useState('');
  const [joinedFrom, setJoinedFrom]   = useState('');
  const [joinedTo, setJoinedTo]       = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk actions
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction]   = useState('');
  const [bulkTopicId, setBulkTopicId] = useState('');
  const [bulkTagList, setBulkTagList] = useState<string[]>([]);
  const [allTopics, setAllTopics]     = useState<Topic[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  useEffect(() => {
    api.get('/visits/today').then(r => {
      setCheckedInIds(new Set<string>(r.data.map((v: { student?: { _id?: string } }) => v.student?._id).filter(Boolean)));
    });
    api.get('/topics').then(r => setAllTopics(r.data));
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search)      params.search    = search;
      if (activeTags.length) params.tags = activeTags.join(',');
      if (levelFilter) params.level     = levelFilter;
      if (ratingMin)   params.ratingMin = ratingMin;
      if (ratingMax)   params.ratingMax = ratingMax;
      if (joinedFrom)  params.joinedFrom = joinedFrom;
      if (joinedTo)    params.joinedTo   = joinedTo;
      const { data } = await api.get('/students', { params });
      setStudents(data);
    } finally { setLoading(false); }
  }, [search, activeTags, levelFilter, ratingMin, ratingMax, joinedFrom, joinedTo]);

  useEffect(() => { const t = setTimeout(fetchStudents, 300); return () => clearTimeout(t); }, [fetchStudents]);

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleAll = () => setSelected(selected.size === students.length ? new Set() : new Set(students.map(s => s._id)));
  const clearFilters = () => { setSearch(''); setActiveTags([]); setLevel(''); setRatingMin(''); setRatingMax(''); setJoinedFrom(''); setJoinedTo(''); };
  const hasActiveFilters = search || activeTags.length || levelFilter || ratingMin || ratingMax || joinedFrom || joinedTo;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/students/${id}`);
      setStudents(prev => prev.filter(s => s._id !== id));
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    } finally { setDeletingId(null); }
  };

  const handleCheckIn = async (id: string) => {
    const result = await checkInStudent(id);
    if (result === 'success' || result === 'already')
      setCheckedInIds(prev => new Set<string>([...Array.from(prev), id]));
  };

  const handleBulk = async () => {
    if (!bulkAction || !selected.size) return;
    if (!confirm(`Apply "${bulkAction}" to ${selected.size} student(s)?`)) return;
    setBulkRunning(true); setBulkMessage('');
    try {
      const ids = Array.from(selected);
      let payload: Record<string, unknown> = {};
      if (bulkAction === 'assignTopic') payload = { topicId: bulkTopicId };
      if (bulkAction === 'addTags' || bulkAction === 'removeTags') payload = { tags: bulkTagList };
      const { data } = await api.post('/students/bulk', { ids, action: bulkAction, payload });
      setBulkMessage(data.message || 'Done');
      if (bulkAction === 'delete') { setStudents(prev => prev.filter(s => !selected.has(s._id))); setSelected(new Set()); }
      else { await fetchStudents(); setSelected(new Set()); }
      setBulkAction(''); setBulkTopicId(''); setBulkTagList([]);
    } catch (err) { setBulkMessage((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setBulkRunning(false); }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Students</h1>
          <p className="text-muted text-xs md:text-sm mt-0.5">{students.length} enrolled</p>
        </div>
        <Link href="/students/new" className="btn-primary text-xs md:text-sm px-3 py-2 md:px-4">+ Add</Link>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or phone…" className="input flex-1 min-w-0" />
        <button onClick={() => setShowFilters(f => !f)}
          className={`btn-secondary text-xs px-3 whitespace-nowrap flex-shrink-0 ${hasActiveFilters ? 'border-amber text-amber' : ''}`}>
          {showFilters ? '▲' : '▼'} Filter{hasActiveFilters ? ' ●' : ''}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-rose/70 hover:text-rose px-1 flex-shrink-0">✕</button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Level</label>
              <select className="input" value={levelFilter} onChange={e => setLevel(e.target.value)}>
                <option value="">All</option>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-1 items-center">
                <input type="number" min={1} max={10} className="input" placeholder="1" value={ratingMin} onChange={e => setRatingMin(e.target.value)} />
                <span className="text-muted text-xs">–</span>
                <input type="number" min={1} max={10} className="input" placeholder="10" value={ratingMax} onChange={e => setRatingMax(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Joined from</label>
              <input type="date" className="input" value={joinedFrom} onChange={e => setJoinedFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Joined to</label>
              <input type="date" className="input" value={joinedTo} onChange={e => setJoinedTo(e.target.value)} />
            </div>
          </div>
          {tags.length > 0 && (
            <div>
              <label className="label">Weakness tags</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map(tag => {
                  const isActive = activeTags.includes(tag.name);
                  return (
                    <button key={tag._id} onClick={() => toggleTag(tag.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all capitalize ${isActive ? 'bg-ink text-cream border-ink' : `${tag.color}`}`}>
                      {isActive && '✕ '}{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="card p-3 mb-4 bg-ink/5 border-ink/20 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-ink">{selected.size} selected</span>
            <select className="input w-auto text-xs py-1.5 flex-1 min-w-0" value={bulkAction}
              onChange={e => { setBulkAction(e.target.value); setBulkMessage(''); }}>
              <option value="">Action…</option>
              <option value="assignTopic">Assign topic</option>
              <option value="addTags">Add tags</option>
              <option value="removeTags">Remove tags</option>
              <option value="delete">Delete</option>
            </select>
            <button onClick={handleBulk} disabled={bulkRunning || !bulkAction}
              className={`btn-primary text-xs px-3 py-1.5 flex-shrink-0 ${bulkAction === 'delete' ? 'bg-rose' : ''}`}>
              {bulkRunning ? '…' : 'Apply'}
            </button>
            <button onClick={() => { setSelected(new Set()); setBulkAction(''); }}
              className="text-xs text-muted hover:text-ink flex-shrink-0">✕</button>
          </div>
          {bulkAction === 'assignTopic' && (
            <select className="input w-full text-xs py-1.5" value={bulkTopicId} onChange={e => setBulkTopicId(e.target.value)}>
              <option value="">Select topic…</option>
              {allTopics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          )}
          {(bulkAction === 'addTags' || bulkAction === 'removeTags') && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => {
                const on = bulkTagList.includes(tag.name);
                return (
                  <button key={tag._id} type="button"
                    onClick={() => setBulkTagList(prev => on ? prev.filter(t => t !== tag.name) : [...prev, tag.name])}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${on ? tag.colorSelected : tag.color}`}>
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
          {bulkMessage && <p className="text-xs text-emerald font-medium">{bulkMessage}</p>}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-muted font-medium">No students found</p>
          {!hasActiveFilters && <Link href="/students/new" className="text-amber text-sm hover:underline mt-2 block">Add first →</Link>}
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={selected.size === students.length && students.length > 0}
              onChange={toggleAll} className="w-4 h-4 accent-amber cursor-pointer" />
            <span className="text-xs text-muted">Select all</span>
          </div>

          {students.map(s => (
            <div key={s._id} className={`card p-3 md:p-4 hover:shadow-card-hover transition-shadow ${selected.has(s._id) ? 'ring-2 ring-amber/40' : ''}`}>
              <div className="flex items-start gap-2.5">
                <input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)}
                  className="w-4 h-4 accent-amber cursor-pointer mt-1 flex-shrink-0" />

                <div className="w-9 h-9 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold font-display flex-shrink-0">
                  {s.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <Link href={`/students/${s._id}`} className="font-semibold text-ink hover:text-amber transition-colors text-sm">
                      {s.name}
                    </Link>
                    <span className={levelColor(s.level)}>{s.level}</span>
                  </div>
                  <p className="text-muted text-xs">{s.phone}</p>
                  {s.goal && <p className="text-muted text-xs mt-0.5 truncate">Goal: {s.goal}</p>}
                  {s.weaknessTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.weaknessTags.map(tagName => {
                        const tagDef = tags.find(t => t.name === tagName);
                        return (
                          <span key={tagName} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${tagDef?.color || 'bg-parchment text-muted border-parchment'}`}>
                            {tagName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions row — below info on mobile */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-muted text-[10px] hidden sm:block">{format(new Date(s.joiningDate), 'MMM yyyy')}</span>
                    <button onClick={() => handleCheckIn(s._id)} disabled={checkedInIds.has(s._id)}
                      className={`text-xs px-2 py-1 rounded-lg border font-semibold transition-colors ${
                        checkedInIds.has(s._id)
                          ? 'bg-emerald/10 text-emerald border-emerald/20 cursor-default'
                          : 'bg-parchment text-ink border-amber/30 hover:border-amber/60'
                      }`}>
                      {checkedInIds.has(s._id) ? '✓ Present' : 'Mark Present'}
                    </button>
                    <Link href={`/students/${s._id}/edit`} className="text-xs px-2 py-1 rounded-lg border bg-parchment text-ink border-amber/30 hover:border-amber/60 font-semibold transition-colors">Edit</Link>
                    <button onClick={() => handleDelete(s._id, s.name)} disabled={deletingId === s._id}
                      className="text-rose/60 hover:text-rose text-xs px-1.5 py-1 transition-colors">
                      {deletingId === s._id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
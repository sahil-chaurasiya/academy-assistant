'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { checkInStudent, getTodayStatus } from '@/lib/checkin';
import { format } from 'date-fns';
import WeaknessTagSelector from '@/components/WeaknessTagSelector';

interface Student {
  _id: string; name: string; phone: string; level: string;
  goal: string; notes: string; joiningDate: string;
  weaknessTags: string[];
  ratings: { confidence: number | null; fluency: number | null; grammar: number | null };
}
interface SessionNote { _id: string; date: string; observation: string; rating: number; }
interface RoadmapModule { _id: string; title: string; description: string; level: string; order: number; }
interface RoadmapItem { module: RoadmapModule; progressId: string | null; status: 'pending' | 'in_progress' | 'completed'; completedAt: string | null; }
interface Topic { _id: string; title: string; level: string; description?: string; }
interface StudentTopic { _id: string; topic: Topic; status: 'pending' | 'completed'; assignedAt: string; }

const levelColor = (l: string) => l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';
const ratingLabel = (r: number) => ['','😕 Struggling','🙂 Progressing','😊 Good','😄 Great','🌟 Excellent'][r];
const ratingBg    = (r: number) => ['','bg-rose/10 text-rose','bg-amber/10 text-amber','bg-blue-100 text-blue-700','bg-emerald/10 text-emerald','bg-emerald/20 text-emerald'][r];
type ErrShape = { response?: { data?: { message?: string } } };

function RatingSlider({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  const v = value ?? 5;
  const pct = ((v - 1) / 9) * 100;
  const color = v >= 8 ? 'text-emerald' : v >= 5 ? 'text-amber' : 'text-rose';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="label mb-0">{label}</label>
        <span className={`text-sm font-bold ${color}`}>{value ?? '—'}<span className="text-muted font-normal text-xs">/10</span></span>
      </div>
      <input type="range" min={1} max={10} value={v} onChange={e => onChange(parseInt(e.target.value))}
        className="w-full" style={{ background: `linear-gradient(to right,#d4820a ${pct}%,#ede8dc ${pct}%)` }} />
      <div className="flex justify-between text-[10px] text-muted mt-0.5"><span>Needs work</span><span>Excellent</span></div>
    </div>
  );
}

function RoadmapStepper({ roadmap, onStart, onComplete, onReset }: {
  roadmap: RoadmapItem[]; onStart: (id: string) => void; onComplete: (id: string) => void; onReset: (id: string) => void;
}) {
  const completed = roadmap.filter(m => m.status === 'completed').length;
  const pct = roadmap.length ? Math.round((completed / roadmap.length) * 100) : 0;
  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>{completed}/{roadmap.length} complete</span>
          <span className="font-semibold text-amber">{pct}%</span>
        </div>
        <div className="h-2 bg-parchment rounded-full overflow-hidden">
          <div className="h-full bg-amber rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {roadmap.length === 0 && (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">🗺</p>
          <p className="text-muted text-sm">No modules yet.</p>
          <Link href="/settings" className="text-amber text-sm hover:underline">Add in Settings →</Link>
        </div>
      )}
      <div className="space-y-2">
        {roadmap.map((item, idx) => {
          const isDone = item.status === 'completed';
          const isActive = item.status === 'in_progress';
          return (
            <div key={item.module._id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${isDone ? 'bg-emerald/5 border-emerald/20' : isActive ? 'bg-amber/5 border-amber/30' : 'bg-parchment/40 border-parchment'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDone ? 'bg-emerald text-white' : isActive ? 'bg-amber text-white' : 'bg-parchment text-muted'}`}>
                {isDone ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${isDone ? 'text-emerald' : isActive ? 'text-ink' : 'text-muted'}`}>{item.module.title}</p>
                {isDone && item.completedAt && <p className="text-[10px] text-muted">{format(new Date(item.completedAt), 'MMM d, yyyy')}</p>}
                {isActive && <p className="text-[10px] text-amber">In progress</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {item.status === 'pending'     && <button onClick={() => onStart(item.module._id)}    className="text-xs btn-secondary px-2 py-1">Start</button>}
                {item.status === 'in_progress' && <button onClick={() => onComplete(item.module._id)} className="text-xs btn-primary px-2 py-1">Done ✓</button>}
                {isDone && <button onClick={() => onReset(item.module._id)} className="text-xs text-muted hover:text-rose px-1.5 transition-colors">↺</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [student, setStudent]               = useState<Student | null>(null);
  const [notes, setNotes]                   = useState<SessionNote[]>([]);
  const [roadmap, setRoadmap]               = useState<RoadmapItem[]>([]);
  const [allTopics, setAllTopics]           = useState<Topic[]>([]);
  const [assignedTopics, setAssignedTopics] = useState<StudentTopic[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [checkedIn, setCheckedIn]           = useState(false);
  const [activeSection, setActiveSection]   = useState('roadmap');

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm]         = useState({ observation: '', rating: '3', date: new Date().toISOString().split('T')[0] });
  const [savingNote, setSavingNote]     = useState(false);
  const [noteError, setNoteError]       = useState('');
  const [noteRatingFilter, setNoteRatingFilter] = useState('');
  const [noteDateFrom, setNoteDateFrom] = useState('');
  const [noteDateTo, setNoteDateTo]     = useState('');
  const [editingNoteId, setEditingNoteId]   = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm]     = useState({ observation: '', rating: '3', date: '' });
  const [editNoteSaving, setEditNoteSaving] = useState(false);

  const [ratings, setRatings]           = useState({ confidence: null as number|null, fluency: null as number|null, grammar: null as number|null });
  const [savingRatings, setSavingRatings] = useState(false);
  const [ratingsSaved, setRatingsSaved]   = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [assigningTopic, setAssigningTopic]   = useState(false);

  const loadNotes = useCallback(async () => {
    const params: Record<string,string> = {};
    if (noteRatingFilter) params.rating = noteRatingFilter;
    if (noteDateFrom) params.dateFrom = noteDateFrom;
    if (noteDateTo) params.dateTo = noteDateTo;
    const { data } = await api.get(`/notes/${id}`, { params });
    setNotes(data);
  }, [id, noteRatingFilter, noteDateFrom, noteDateTo]);

  const loadAll = useCallback(async () => {
    const [sRes, roadmapRes, topicsRes, assignedRes] = await Promise.all([
      api.get(`/students/${id}`), api.get(`/roadmap/${id}`), api.get('/topics'), api.get(`/student-topics/${id}`),
    ]);
    const s = sRes.data;
    setStudent(s);
    setRatings(s.ratings || { confidence: null, fluency: null, grammar: null });
    setRoadmap(roadmapRes.data);
    setAllTopics(topicsRes.data);
    setAssignedTopics(assignedRes.data);
    const alreadyIn = await getTodayStatus(id);
    setCheckedIn(alreadyIn);
    setLoadingStudent(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (!loadingStudent) loadNotes(); }, [loadNotes, loadingStudent]);

  const handleCheckIn = async () => {
    const result = await checkInStudent(id);
    if (result === 'success' || result === 'already') setCheckedIn(true);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault(); setNoteError(''); setSavingNote(true);
    try {
      await api.post('/notes', { studentId: id, ...noteForm, rating: parseInt(noteForm.rating) });
      setNoteForm({ observation: '', rating: '3', date: new Date().toISOString().split('T')[0] });
      setShowNoteForm(false);
      await loadNotes();
    } catch (err) { setNoteError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setSavingNote(false); }
  };

  const startEditNote = (n: SessionNote) => {
    setEditingNoteId(n._id);
    setEditNoteForm({ observation: n.observation, rating: String(n.rating), date: n.date.split('T')[0] });
  };
  const saveEditNote = async (noteId: string) => {
    setEditNoteSaving(true);
    try {
      const { data } = await api.put(`/notes/${noteId}`, { ...editNoteForm, rating: parseInt(editNoteForm.rating) });
      setNotes(prev => prev.map(n => n._id === noteId ? data : n));
      setEditingNoteId(null);
    } catch (err) { alert((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setEditNoteSaving(false); }
  };
  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n._id !== noteId));
  };

  const handleStartModule   = async (moduleId: string) => { await api.post('/roadmap/start',    { studentId: id, moduleId }); setRoadmap(prev => prev.map(r => r.module._id === moduleId ? { ...r, status: 'in_progress' } : r)); };
  const handleCompleteModule = async (moduleId: string) => { const { data } = await api.post('/roadmap/complete', { studentId: id, moduleId }); setRoadmap(prev => prev.map(r => r.module._id === moduleId ? { ...r, status: 'completed', completedAt: data.completedAt } : r)); };
  const handleResetModule   = async (moduleId: string) => { await api.post('/roadmap/reset',    { studentId: id, moduleId }); setRoadmap(prev => prev.map(r => r.module._id === moduleId ? { ...r, status: 'pending', completedAt: null } : r)); };

  const handleSaveRatings = async () => {
    setSavingRatings(true);
    try { await api.put(`/students/${id}/ratings`, ratings); setRatingsSaved(true); setTimeout(() => setRatingsSaved(false), 2000); }
    finally { setSavingRatings(false); }
  };

  const handleAssignTopic = async () => {
    if (!selectedTopicId) return;
    setAssigningTopic(true);
    try {
      const { data } = await api.post('/student-topics/assign', { studentId: id, topicId: selectedTopicId });
      setAssignedTopics(prev => { const ex = prev.find(t => t._id === data._id); return ex ? prev.map(t => t._id === data._id ? data : t) : [data, ...prev]; });
      setSelectedTopicId('');
    } finally { setAssigningTopic(false); }
  };
  const handleTopicStatus = async (stId: string, status: 'pending'|'completed') => {
    const { data } = await api.put(`/student-topics/${stId}`, { status });
    setAssignedTopics(prev => prev.map(t => t._id === stId ? data : t));
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${student?.name}?`)) return;
    await api.delete(`/students/${id}`);
    router.push('/students');
  };

  if (loadingStudent) return (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!student) return <div className="p-8 text-center"><p className="text-muted">Not found.</p><Link href="/students" className="text-amber text-sm hover:underline mt-2 block">← Back</Link></div>;

  const sections = [
    { id: 'roadmap', label: '🗺' },
    { id: 'topics',  label: '💬' },
    { id: 'ratings', label: '⭐' },
    { id: 'timeline',label: '📝' },
  ];
  const sectionLabels: Record<string,string> = { roadmap:'Roadmap', topics:'Topics', ratings:'Ratings', timeline:'Timeline' };

  return (
    <div className="p-3 md:p-8 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/students" className="text-muted text-sm hover:text-amber transition-colors flex-shrink-0">← Back</Link>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <button onClick={handleCheckIn} disabled={checkedIn} className="btn-secondary text-xs px-2.5 py-1.5 whitespace-nowrap">
            {checkedIn ? '✓ Present' : 'Mark Present'}
          </button>
          <Link href={`/students/${id}/edit`} className="btn-secondary text-xs px-2.5 py-1.5">Edit</Link>
          <button onClick={handleDelete} className="btn-danger text-xs px-2.5 py-1.5">Delete</button>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-4 md:p-6 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold font-display text-xl md:text-2xl flex-shrink-0">
            {student.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="font-display text-xl md:text-3xl font-bold text-ink">{student.name}</h1>
              <span className={levelColor(student.level)}>{student.level}</span>
            </div>
            <p className="text-muted text-xs md:text-sm mb-2">{student.phone} · {format(new Date(student.joiningDate), 'MMM d, yyyy')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {student.goal  && <div><p className="label">Goal</p><p className="text-xs md:text-sm text-ink">{student.goal}</p></div>}
              {student.notes && <div><p className="label">Notes</p><p className="text-xs md:text-sm text-ink">{student.notes}</p></div>}
            </div>
            {student.weaknessTags?.length > 0 && (
              <div className="mt-2">
                <p className="label mb-1">Weaknesses</p>
                <WeaknessTagSelector selected={student.weaknessTags} onChange={() => {}} readOnly />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section tabs — icon only on mobile, icon+label on md+ */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 md:px-4 rounded-lg text-sm font-medium transition-colors ${
              activeSection === s.id ? 'bg-ink text-cream' : 'bg-white border border-parchment text-muted hover:text-ink'
            }`}>
            <span>{s.label}</span>
            <span className="hidden md:inline">{sectionLabels[s.id]}</span>
          </button>
        ))}
      </div>

      {/* ROADMAP */}
      {activeSection === 'roadmap' && (
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg md:text-xl font-semibold text-ink">Learning Roadmap</h2>
            <Link href="/settings" className="text-xs text-muted hover:text-amber">Manage →</Link>
          </div>
          <RoadmapStepper roadmap={roadmap} onStart={handleStartModule} onComplete={handleCompleteModule} onReset={handleResetModule} />
        </div>
      )}

      {/* TOPICS */}
      {activeSection === 'topics' && (
        <div className="card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl font-semibold text-ink mb-4">Assigned Topics</h2>
          <div className="flex gap-2 mb-4">
            <select className="input flex-1 min-w-0" value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}>
              <option value="">Select topic to assign…</option>
              {allTopics.map(t => <option key={t._id} value={t._id}>{t.title} ({t.level})</option>)}
            </select>
            <button onClick={handleAssignTopic} disabled={!selectedTopicId || assigningTopic} className="btn-primary whitespace-nowrap flex-shrink-0">
              {assigningTopic ? '…' : 'Assign'}
            </button>
          </div>
          {assignedTopics.length === 0 ? (
            <div className="text-center py-8"><p className="text-2xl mb-2">💬</p><p className="text-muted text-sm">No topics yet</p></div>
          ) : (
            <div className="space-y-2">
              {assignedTopics.map(st => (
                <div key={st._id} className={`flex items-center justify-between p-3 rounded-xl border ${st.status === 'completed' ? 'bg-emerald/5 border-emerald/20' : 'bg-white border-parchment'}`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${st.status === 'completed' ? 'text-emerald' : 'text-ink'}`}>{st.topic?.title}</p>
                    <p className="text-xs text-muted">{st.topic?.level} · {format(new Date(st.assignedAt), 'MMM d')}</p>
                  </div>
                  <button onClick={() => handleTopicStatus(st._id, st.status === 'completed' ? 'pending' : 'completed')}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors flex-shrink-0 ml-2 ${
                      st.status === 'completed' ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-parchment text-muted border-parchment hover:bg-emerald/10 hover:text-emerald hover:border-emerald/20'
                    }`}>
                    {st.status === 'completed' ? '✓ Done' : 'Mark done'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RATINGS */}
      {activeSection === 'ratings' && (
        <div className="card p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl font-semibold text-ink mb-4">Speaking Ratings</h2>
          <div className="space-y-5">
            <RatingSlider label="Confidence" value={ratings.confidence} onChange={v => setRatings({ ...ratings, confidence: v })} />
            <RatingSlider label="Fluency"    value={ratings.fluency}    onChange={v => setRatings({ ...ratings, fluency: v })} />
            <RatingSlider label="Grammar"    value={ratings.grammar}    onChange={v => setRatings({ ...ratings, grammar: v })} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[{ label: 'Conf', value: ratings.confidence }, { label: 'Fluency', value: ratings.fluency }, { label: 'Grammar', value: ratings.grammar }].map(({ label, value }) => {
              const pct = value ? ((value - 1) / 9) * 100 : 0;
              const color = value && value >= 8 ? '#1a6b4a' : value && value >= 5 ? '#d4820a' : '#c0392b';
              return (
                <div key={label} className="text-center p-3 bg-parchment/50 rounded-xl">
                  <div className="relative w-14 h-14 mx-auto mb-1">
                    <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ede8dc" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">{value ?? '—'}</span>
                  </div>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSaveRatings} disabled={savingRatings} className="btn-primary">
              {ratingsSaved ? '✓ Saved!' : savingRatings ? 'Saving…' : 'Save Ratings'}
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {activeSection === 'timeline' && (
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg md:text-xl font-semibold text-ink">Timeline</h2>
            <button onClick={() => setShowNoteForm(f => !f)} className="btn-primary text-xs px-3 py-1.5">
              {showNoteForm ? 'Cancel' : '+ Note'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <select className="input w-auto text-xs py-1.5" value={noteRatingFilter} onChange={e => setNoteRatingFilter(e.target.value)}>
              <option value="">All ratings</option>
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} – {ratingLabel(r).replace(/^\S+\s/,'')}</option>)}
            </select>
            <input type="date" className="input w-auto text-xs py-1.5" value={noteDateFrom} onChange={e => setNoteDateFrom(e.target.value)} />
            <input type="date" className="input w-auto text-xs py-1.5" value={noteDateTo} onChange={e => setNoteDateTo(e.target.value)} />
            {(noteRatingFilter || noteDateFrom || noteDateTo) && (
              <button onClick={() => { setNoteRatingFilter(''); setNoteDateFrom(''); setNoteDateTo(''); }} className="text-xs text-rose/70 hover:text-rose px-2">Clear</button>
            )}
          </div>

          {showNoteForm && (
            <div className="mb-5 p-3 bg-parchment rounded-xl border border-parchment">
              {noteError && <div className="mb-2 text-rose text-xs">{noteError}</div>}
              <form onSubmit={handleAddNote} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Date</label><input type="date" className="input" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })} required /></div>
                  <div><label className="label">Rating</label>
                    <select className="input" value={noteForm.rating} onChange={e => setNoteForm({ ...noteForm, rating: e.target.value })}>
                      {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} – {ratingLabel(r).replace(/^\S+\s/,'')}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Observation</label>
                  <textarea className="input min-h-[70px] resize-none" value={noteForm.observation} onChange={e => setNoteForm({ ...noteForm, observation: e.target.value })} placeholder="What improved?" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingNote} className="btn-primary text-xs">{savingNote ? 'Saving…' : 'Save'}</button>
                  <button type="button" onClick={() => setShowNoteForm(false)} className="btn-secondary text-xs">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-8"><p className="text-2xl mb-2">📝</p><p className="text-muted text-sm">No notes match</p></div>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-parchment" />
              <div className="space-y-4">
                {notes.map((note, idx) => (
                  <div key={note._id} className="relative flex gap-3 pl-9">
                    <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${idx === 0 ? 'bg-amber text-white' : 'bg-parchment text-muted'}`}>
                      {note.rating}
                    </div>
                    <div className="flex-1 pb-1">
                      {editingNoteId === note._id ? (
                        <div className="space-y-2 bg-parchment/60 p-3 rounded-xl border border-parchment">
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="label">Date</label><input type="date" className="input text-xs" value={editNoteForm.date} onChange={e => setEditNoteForm({ ...editNoteForm, date: e.target.value })} /></div>
                            <div><label className="label">Rating</label>
                              <select className="input text-xs" value={editNoteForm.rating} onChange={e => setEditNoteForm({ ...editNoteForm, rating: e.target.value })}>
                                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                          </div>
                          <textarea className="input min-h-[60px] resize-none text-xs" value={editNoteForm.observation} onChange={e => setEditNoteForm({ ...editNoteForm, observation: e.target.value })} />
                          <div className="flex gap-2">
                            <button onClick={() => saveEditNote(note._id)} disabled={editNoteSaving} className="btn-primary text-xs px-2.5 py-1">{editNoteSaving ? '…' : 'Save'}</button>
                            <button onClick={() => setEditingNoteId(null)} className="btn-secondary text-xs px-2.5 py-1">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-muted">{format(new Date(note.date), 'MMM d, yyyy')}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ratingBg(note.rating)}`}>{ratingLabel(note.rating)}</span>
                            <button onClick={() => startEditNote(note)} className="text-xs text-muted hover:text-amber ml-auto">Edit</button>
                            <button onClick={() => deleteNote(note._id)} className="text-xs text-rose/50 hover:text-rose">Del</button>
                          </div>
                          <p className="text-sm text-ink leading-relaxed">{note.observation}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
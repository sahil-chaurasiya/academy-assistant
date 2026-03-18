'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format, isPast, isToday } from 'date-fns';

interface Task {
  _id: string; title: string; notes: string;
  priority: Priority;
  dueDate: string | null; done: boolean; doneAt: string | null;
  createdAt: string;
}

type ErrShape = { response?: { data?: { message?: string } } };

const PRIORITIES = ['low', 'medium', 'high'] as const;
type Priority = typeof PRIORITIES[number];
const isPriority = (v: string): v is Priority => PRIORITIES.includes(v as Priority);

const PRIORITY_STYLES = {
  high:   { badge: 'bg-rose/10 text-rose border-rose/20',     dot: 'bg-rose' },
  medium: { badge: 'bg-amber/10 text-amber border-amber/20',  dot: 'bg-amber' },
  low:    { badge: 'bg-parchment text-muted border-parchment', dot: 'bg-muted' },
};

export default function TasksPage() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDone, setShowDone]     = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const emptyForm: { title: string; notes: string; priority: Priority; dueDate: string } = { title: '', notes: '', priority: 'medium', dueDate: '' };
  const [form, setForm]     = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params: { done: showDone ? 'true' : 'false' } });
      setTasks(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [showDone]); // eslint-disable-line

  const openCreate = () => { setEditingTask(null); setForm(emptyForm); setError(''); setShowForm(true); };
  const openEdit   = (t: Task) => {
    setEditingTask(t);
    setForm({ title: t.title, notes: t.notes || '', priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editingTask) {
        const { data } = await api.put(`/tasks/${editingTask._id}`, form);
        setTasks(prev => prev.map(t => t._id === editingTask._id ? data : t));
      } else {
        const { data } = await api.post('/tasks', form);
        setTasks(prev => [data, ...prev]);
      }
      setShowForm(false); setEditingTask(null); setForm(emptyForm);
    } catch (err) { setError((err as ErrShape)?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleDone = async (task: Task) => {
    const { data } = await api.put(`/tasks/${task._id}`, { done: !task.done });
    if (showDone) {
      setTasks(prev => prev.map(t => t._id === task._id ? data : t));
    } else {
      setTasks(prev => prev.filter(t => t._id !== task._id));
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    setDeletingId(id);
    try { await api.delete(`/tasks/${id}`); setTasks(prev => prev.filter(t => t._id !== id)); }
    finally { setDeletingId(null); }
  };

  const pending  = tasks.filter(t => !t.done);
  const overdue  = pending.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const dueToday = pending.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  const upcoming = pending.filter(t => !t.dueDate || (!isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))));
  const done     = tasks.filter(t => t.done);

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">My Tasks</h1>
          <p className="text-muted text-sm mt-0.5">Private — only visible to you</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Task</button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="card p-5 mb-6 border-l-4 border-l-amber">
          <h2 className="font-semibold text-ink text-sm mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
          {error && <div className="mb-3 text-rose text-xs px-3 py-2 bg-rose/10 rounded-lg">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => { if (isPriority(e.target.value)) setForm({ ...form, priority: e.target.value }); }}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any details…" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving…' : editingTask ? 'Save Changes' : 'Create Task'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5">
        <button onClick={() => setShowDone(false)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!showDone ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-parchment hover:text-ink'}`}>
          Pending {pending.length > 0 && <span className="ml-1 text-xs bg-amber/20 text-amber px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </button>
        <button onClick={() => setShowDone(true)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showDone ? 'bg-ink text-cream border-ink' : 'bg-white text-muted border-parchment hover:text-ink'}`}>
          Completed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {!showDone && (
            <>
              {tasks.length === 0 && (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">✅</p>
                  <p className="text-muted font-medium">No pending tasks</p>
                  <button onClick={openCreate} className="text-amber text-sm hover:underline mt-2">Create your first task →</button>
                </div>
              )}

              {overdue.length > 0 && (
                <TaskGroup label="⚠️ Overdue" tasks={overdue} onToggle={toggleDone} onEdit={openEdit} onDelete={deleteTask} deletingId={deletingId} />
              )}
              {dueToday.length > 0 && (
                <TaskGroup label="📅 Due Today" tasks={dueToday} onToggle={toggleDone} onEdit={openEdit} onDelete={deleteTask} deletingId={deletingId} />
              )}
              {upcoming.length > 0 && (
                <TaskGroup label="📋 Upcoming" tasks={upcoming} onToggle={toggleDone} onEdit={openEdit} onDelete={deleteTask} deletingId={deletingId} />
              )}
            </>
          )}

          {showDone && (
            done.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-4xl mb-3">🏁</p>
                <p className="text-muted font-medium">No completed tasks yet</p>
              </div>
            ) : (
              <TaskGroup label={`✓ Completed (${done.length})`} tasks={done} onToggle={toggleDone} onEdit={openEdit} onDelete={deleteTask} deletingId={deletingId} isDone />
            )
          )}
        </>
      )}
    </div>
  );
}

function TaskGroup({ label, tasks, onToggle, onEdit, onDelete, deletingId, isDone }: {
  label: string; tasks: Task[];
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isDone?: boolean;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-2">
        {tasks.map(task => <TaskCard key={task._id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} deletingId={deletingId} isDone={isDone} />)}
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete, deletingId, isDone }: {
  task: Task; isDone?: boolean;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const p = PRIORITY_STYLES[task.priority];
  const isOverdue = !isDone && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const dueToday  = !isDone && task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div className={`card p-4 flex items-start gap-3 transition-all ${isDone ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          isDone ? 'bg-emerald border-emerald text-white' : 'border-parchment hover:border-amber'
        }`}
      >
        {isDone && <span className="text-xs">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${isDone ? 'line-through text-muted' : 'text-ink'}`}>{task.title}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${p.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {task.priority}
            </span>
          </div>
        </div>
        {task.notes && <p className="text-xs text-muted mt-0.5 line-clamp-1">{task.notes}</p>}
        <div className="flex items-center gap-3 mt-1.5">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-rose font-semibold' : dueToday ? 'text-amber font-semibold' : 'text-muted'}`}>
              {isOverdue ? '⚠ ' : dueToday ? '📅 ' : ''}
              {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>
          )}
          {isDone && task.doneAt && (
            <span className="text-xs text-muted">Done {format(new Date(task.doneAt), 'MMM d')}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isDone && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)} className="text-xs text-muted hover:text-amber transition-colors px-1.5 py-1">Edit</button>
          <button onClick={() => onDelete(task._id)} disabled={deletingId === task._id} className="text-xs text-rose/50 hover:text-rose transition-colors px-1.5 py-1">
            {deletingId === task._id ? '…' : 'Del'}
          </button>
        </div>
      )}
      {isDone && (
        <button onClick={() => onDelete(task._id)} disabled={deletingId === task._id} className="text-xs text-rose/40 hover:text-rose transition-colors px-1.5 py-1 flex-shrink-0">
          {deletingId === task._id ? '…' : '✕'}
        </button>
      )}
    </div>
  );
}
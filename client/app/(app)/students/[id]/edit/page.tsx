'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import WeaknessTagSelector from '@/components/WeaknessTagSelector';

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', phone: '', level: 'Beginner', goal: '', notes: '',
    joiningDate: '', weaknessTags: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/students/${id}`).then((r) => {
      const s = r.data;
      setForm({
        name: s.name,
        phone: s.phone,
        level: s.level,
        goal: s.goal || '',
        notes: s.notes || '',
        joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : '',
        weaknessTags: s.weaknessTags || [],
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/students/${id}`, form);
      router.push(`/students/${id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update');
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/students/${id}`} className="text-muted text-sm hover:text-amber transition-colors">← Back to profile</Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mt-2">Edit Student</h1>
      </div>

      <div className="card p-6 md:p-8">
        {error && <div className="mb-5 px-4 py-3 bg-rose/10 border border-rose/30 rounded-lg text-rose text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Level</label>
              <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="label">Joining Date</label>
              <input type="date" className="input" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Learning Goal</label>
            <input className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[100px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div>
            <label className="label">Weakness Areas</label>
            <p className="text-xs text-muted mb-2">Click to toggle</p>
            <WeaknessTagSelector
              selected={form.weaknessTags}
              onChange={(tags) => setForm({ ...form, weaknessTags: tags })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href={`/students/${id}`} className="btn-secondary px-6">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

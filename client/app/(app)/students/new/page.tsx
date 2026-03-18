'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import WeaknessTagSelector from '@/components/WeaknessTagSelector';

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', phone: '', level: 'Beginner', goal: '', notes: '',
    joiningDate: new Date().toISOString().split('T')[0],
    weaknessTags: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/students', form);
      router.push(`/students/${data._id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create student');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/students" className="text-muted text-sm hover:text-amber transition-colors">← Students</Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mt-2">Add New Student</h1>
      </div>

      <div className="card p-6 md:p-8">
        {error && <div className="mb-5 px-4 py-3 bg-rose/10 border border-rose/30 rounded-lg text-rose text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Student name" />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="Phone number" />
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
            <input className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="e.g. Job interviews, business communication" />
          </div>

          <div>
            <label className="label">Initial Notes</label>
            <textarea className="input min-h-[100px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Background, current challenges, anything relevant…" />
          </div>

          <div>
            <label className="label">Weakness Areas</label>
            <p className="text-xs text-muted mb-2">Select all that apply — click to toggle</p>
            <WeaknessTagSelector
              selected={form.weaknessTags}
              onChange={(tags) => setForm({ ...form, weaknessTags: tags })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary px-6">
              {loading ? 'Adding…' : 'Add Student'}
            </button>
            <Link href="/students" className="btn-secondary px-6">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

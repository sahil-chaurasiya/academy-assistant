'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-cream">Academy<br /><span className="text-amber">Assistant</span></h1>
        </div>
        <div className="bg-slate rounded-2xl p-8 border border-white/10">
          <h2 className="font-display text-xl text-cream font-semibold mb-6">Create account</h2>
          {error && <div className="mb-4 px-4 py-3 bg-rose/10 border border-rose/30 rounded-lg text-rose text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {['name', 'email', 'password'].map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">{field}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 bg-ink/60 border border-white/10 rounded-lg text-cream text-sm placeholder-white/30 focus:outline-none focus:border-amber/60 transition-colors"
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full bg-amber text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-light transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-white/30 text-xs mt-6">
          Already have an account? <a href="/login" className="text-amber hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}

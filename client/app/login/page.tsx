'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, token } = useAuth();
  const router = useRouter();

  useEffect(() => { if (token) router.replace('/dashboard'); }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-cream">Academy<br /><span className="text-amber">Assistant</span></h1>
          <p className="text-white/40 mt-2 text-sm">Spoken English Management</p>
        </div>

        {/* Card */}
        <div className="bg-slate rounded-2xl p-8 border border-white/10">
          <h2 className="font-display text-xl text-cream font-semibold mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose/10 border border-rose/30 rounded-lg text-rose text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-ink/60 border border-white/10 rounded-lg text-cream text-sm placeholder-white/30 focus:outline-none focus:border-amber/60 focus:ring-1 focus:ring-amber/20 transition-colors"
                placeholder="teacher@academy.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-ink/60 border border-white/10 rounded-lg text-cream text-sm placeholder-white/30 focus:outline-none focus:border-amber/60 focus:ring-1 focus:ring-amber/20 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-light transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-amber hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}

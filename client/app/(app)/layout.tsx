'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace('/login');
  }, [loading, token, router]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Loading…</p>
      </div>
    </div>
  );

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* md: offset for sidebar, pb for mobile bottom nav */}
      <main className="flex-1 md:ml-56 min-h-screen bg-cream pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}

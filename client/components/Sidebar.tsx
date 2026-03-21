'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AiPanel from './AiPanel';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: '◈' },
  { href: '/students',      label: 'Students',       icon: '◉' },
  { href: '/topics',        label: 'Topics',         icon: '◐' },
  { href: '/tasks',         label: 'My Tasks',       icon: '◫' },
  { href: '/announcements', label: 'Announcements',  icon: '◎' },
  { href: '/settings',      label: 'Settings',       icon: '◧' },
];

// Bottom nav shows these 4 always
const primaryNav = navItems.slice(0, 4);
// These go in the "More" drawer
const moreNav = navItems.slice(4);

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const [aiOpen, setAiOpen]   = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const handleLogout = () => { logout(); router.push('/login'); };

  const isMoreActive = moreNav.some(
    item => pathname === item.href || pathname.startsWith(item.href)
  );

  return (
    <>
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ── Desktop sidebar ── */}
      <aside className="w-56 min-h-screen bg-ink flex-col fixed left-0 top-0 z-40 hidden md:flex">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="font-display text-xl font-bold text-cream leading-tight">
            Academy<br /><span className="text-amber">Assistant</span>
          </h1>
          <p className="text-white/40 text-xs mt-1">Spoken English</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active ? 'bg-amber text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button onClick={() => setAiOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-white/60 hover:text-white hover:bg-white/[0.08] mt-2">
            <span className="text-base w-5 text-center">🤖</span>
            AI Assistant
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center text-amber font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'T'}
            </div>
            <div className="min-w-0">
              <p className="text-cream text-xs font-semibold truncate">{user?.name || 'Teacher'}</p>
              <p className="text-white/40 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-white/40 hover:text-white/80 text-xs py-1 transition-colors">
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      {/* More drawer — slides up from bottom nav */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div className="md:hidden fixed inset-0 z-[45] bg-ink/40" onClick={() => setMoreOpen(false)} />
          {/* Drawer */}
          <div className="md:hidden fixed bottom-[57px] left-0 right-0 z-[46] bg-ink border-t border-white/10 rounded-t-2xl">
            <div className="px-4 pt-4 pb-3">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">More</p>
              <div className="space-y-1">
                {moreNav.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-amber text-white' : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }`}>
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
                <button onClick={() => { setMoreOpen(false); setAiOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors">
                  <span className="text-base w-5 text-center">🤖</span>
                  AI Assistant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink border-t border-white/10 flex">
        {primaryNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${active ? 'text-amber' : 'text-white/50'}`}>
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] leading-none">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        {/* More button */}
        <button onClick={() => setMoreOpen(o => !o)}
          className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
            moreOpen || isMoreActive ? 'text-amber' : 'text-white/50'
          }`}>
          <span className="text-lg leading-none">{moreOpen ? '✕' : '···'}</span>
          <span className="text-[10px] leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
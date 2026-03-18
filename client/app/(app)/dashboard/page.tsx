'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { checkInStudent } from '@/lib/checkin';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';

interface Student { _id: string; name: string; level: string; phone: string; }
interface Visit   { _id: string; student: Student; visitedAt: string; }
interface Stats   { total: number; addedThisMonth: number; todayVisits: Visit[]; recentStudents: Student[]; }

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  const { user }  = useAuth();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/students/stats').then(r => {
      setStats(r.data);
      const ids = new Set<string>(r.data.todayVisits.map((v: Visit) => v.student?._id).filter(Boolean));
      setCheckedInIds(ids);
    }).finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (studentId: string) => {
    const result = await checkInStudent(studentId);
    if (result === 'success') {
      const { data } = await api.get('/students/stats');
      setStats(data);
      setCheckedInIds(new Set(data.todayVisits.map((v: Visit) => v.student?._id).filter(Boolean)));
    } else if (result === 'already') {
      setCheckedInIds(prev => new Set<string>([...Array.from(prev), studentId]));
    }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: 'Total',     value: stats?.total ?? '—',                  color: 'text-ink',    href: '/dashboard/all-students', icon: '👨‍🎓', sublabel: 'students' },
    { label: 'This Month',value: stats?.addedThisMonth ?? '—',         color: 'text-amber',  href: '/dashboard/this-month',   icon: '📅', sublabel: 'joined' },
    { label: 'Today',     value: stats?.todayVisits?.length ?? '—',    color: 'text-emerald',href: '/dashboard/today',         icon: '✅', sublabel: 'present' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs md:text-sm mb-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="font-display text-xl md:text-3xl font-bold text-ink">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <Link href="/students/new" className="btn-primary text-xs md:text-sm whitespace-nowrap flex-shrink-0 px-3 py-2 md:px-4 md:py-2">
          + Add
        </Link>
      </div>

      {/* Stat cards — 3 cols always, but compact on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-5 mb-5 md:mb-8">
        {statCards.map(card => (
          <Link key={card.href} href={card.href}
            className="card p-3 md:p-6 transition-all duration-150 cursor-pointer hover:shadow-card-hover active:scale-95">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-sm md:text-base">{card.icon}</span>
            </div>
            <p className={`font-display text-2xl md:text-4xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] md:text-xs text-muted mt-0.5 md:mt-2 leading-tight">
              <span className="md:hidden">{card.sublabel}</span>
              <span className="hidden md:block">{card.label}</span>
            </p>
          </Link>
        ))}
      </div>

      {/* Bottom grid — single col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Today's visitors */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="font-display text-base md:text-lg font-semibold text-ink">Today&apos;s Visitors</h2>
            <Link href="/dashboard/today" className="text-amber text-xs hover:underline whitespace-nowrap">
              View all →
            </Link>
          </div>
          {!stats?.todayVisits?.length ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🏫</p>
              <p className="text-muted text-sm">No visits today</p>
              <Link href="/dashboard/today" className="text-amber text-xs hover:underline mt-1 block">Mark present →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.todayVisits.slice(0, 5).map(v => (
                <div key={v._id} className="flex items-center justify-between py-2 border-b border-parchment last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald/10 flex items-center justify-center text-emerald text-xs font-bold flex-shrink-0">
                      {v.student?.name?.[0]}
                    </div>
                    <Link href={`/students/${v.student?._id}`} className="text-sm font-medium text-ink hover:text-amber transition-colors truncate">
                      {v.student?.name}
                    </Link>
                  </div>
                  <span className={`${levelColor(v.student?.level)} flex-shrink-0 ml-2`}>{v.student?.level}</span>
                </div>
              ))}
              {stats.todayVisits.length > 5 && (
                <Link href="/dashboard/today" className="block text-center text-xs text-amber hover:underline pt-2">
                  +{stats.todayVisits.length - 5} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recently active */}
        <div className="card p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="font-display text-base md:text-lg font-semibold text-ink">Recently Active</h2>
            <Link href="/students" className="text-amber text-xs hover:underline">View all →</Link>
          </div>
          {!stats?.recentStudents?.length ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">📚</p>
              <p className="text-muted text-sm">No students yet</p>
              <Link href="/students/new" className="text-amber text-xs hover:underline mt-1 block">Add first →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentStudents.map(s => (
                <div key={s._id} className="flex items-center justify-between py-2 border-b border-parchment last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-amber/10 flex items-center justify-center text-amber text-xs font-bold flex-shrink-0">
                      {s.name?.[0]}
                    </div>
                    <Link href={`/students/${s._id}`} className="text-sm font-medium text-ink hover:text-amber transition-colors truncate">
                      {s.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className={levelColor(s.level)}>{s.level}</span>
                    <button onClick={() => handleCheckIn(s._id)} disabled={checkedInIds.has(s._id)}
                      className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${
                        checkedInIds.has(s._id)
                          ? 'bg-emerald/10 text-emerald border-emerald/20 cursor-default'
                          : 'bg-parchment text-muted border-parchment hover:border-emerald/40 hover:text-emerald'
                      }`}>
                      {checkedInIds.has(s._id) ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
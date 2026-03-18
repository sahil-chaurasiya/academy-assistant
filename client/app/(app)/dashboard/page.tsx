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
    api.get('/students/stats')
      .then(r => {
        setStats(r.data);
        // Pre-mark anyone already in today's visit list
        const ids = new Set<string>(
          r.data.todayVisits.map((v: Visit) => v.student?._id).filter(Boolean)
        );
        setCheckedInIds(ids);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (studentId: string) => {
    const result = await checkInStudent(studentId);
    if (result === 'success') {
      // Refresh today's visits
      const { data } = await api.get('/students/stats');
      setStats(data);
      setCheckedInIds(new Set(data.todayVisits.map((v: Visit) => v.student?._id).filter(Boolean)));
    } else if (result === 'already') {
      setCheckedInIds(prev => new Set<string>([...Array.from(prev), studentId]));
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.total ?? '—',
      color: 'text-ink',
      bg: 'hover:bg-parchment/40',
      href: '/dashboard/all-students',
      icon: '👨‍🎓',
    },
    {
      label: 'Joined This Month',
      value: stats?.addedThisMonth ?? '—',
      color: 'text-amber',
      bg: 'hover:bg-amber/5',
      href: '/dashboard/this-month',
      icon: '📅',
    },
    {
      label: 'Here Today',
      value: stats?.todayVisits?.length ?? '—',
      color: 'text-emerald',
      bg: 'hover:bg-emerald/5',
      href: '/dashboard/today',
      icon: '✅',
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-muted text-sm mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <Link href="/students/new" className="btn-primary whitespace-nowrap flex-shrink-0">
          + Add Student
        </Link>
      </div>

      {/* Clickable stat cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
        {statCards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className={`card p-4 md:p-6 transition-all duration-150 cursor-pointer ${card.bg} hover:shadow-card-hover group`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider leading-tight">
                {card.label}
              </p>
              <span className="text-base opacity-60 group-hover:opacity-100 transition-opacity">{card.icon}</span>
            </div>
            <p className={`font-display text-3xl md:text-4xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              View details →
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's visitors */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">Today&apos;s Visitors</h2>
            <Link href="/dashboard/today" className="text-amber text-xs hover:underline">
              {format(new Date(), 'MMM d')} →
            </Link>
          </div>
          {!stats?.todayVisits?.length ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🏫</p>
              <p className="text-muted text-sm">No visits recorded today</p>
              <Link href="/dashboard/today" className="text-amber text-sm hover:underline mt-1 block">
                Mark a student present →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.todayVisits.slice(0, 6).map(v => (
                <div key={v._id} className="flex items-center justify-between py-2 border-b border-parchment last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald/10 flex items-center justify-center text-emerald text-xs font-bold flex-shrink-0">
                      {v.student?.name?.[0]}
                    </div>
                    <Link href={`/students/${v.student?._id}`} className="text-sm font-medium text-ink hover:text-amber transition-colors">
                      {v.student?.name}
                    </Link>
                  </div>
                  <span className={levelColor(v.student?.level)}>{v.student?.level}</span>
                </div>
              ))}
              {stats.todayVisits.length > 6 && (
                <Link href="/dashboard/today" className="block text-center text-xs text-amber hover:underline pt-2">
                  +{stats.todayVisits.length - 6} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recently active + quick check-in */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">Recently Active</h2>
            <Link href="/students" className="text-amber text-xs hover:underline">View all →</Link>
          </div>
          {!stats?.recentStudents?.length ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-muted text-sm">No students yet</p>
              <Link href="/students/new" className="text-amber text-sm hover:underline mt-1 block">
                Add your first student →
              </Link>
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={levelColor(s.level)}>{s.level}</span>
                    <button
                      onClick={() => handleCheckIn(s._id)}
                      disabled={checkedInIds.has(s._id)}
                      className={`text-xs px-2 py-1 rounded-lg border font-medium transition-colors ${
                        checkedInIds.has(s._id)
                          ? 'bg-emerald/10 text-emerald border-emerald/20 cursor-default'
                          : 'bg-parchment text-muted border-parchment hover:border-emerald/40 hover:text-emerald'
                      }`}
                    >
                      {checkedInIds.has(s._id) ? '✓' : 'Present'}
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
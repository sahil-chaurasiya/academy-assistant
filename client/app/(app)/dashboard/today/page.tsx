'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { checkInStudent } from '@/lib/checkin';
import { format } from 'date-fns';

interface Student { _id: string; name: string; level: string; phone: string; }
interface Visit   { _id: string; student: Student; visitedAt: string; }

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

export default function TodayPage() {
  const [visits, setVisits]   = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/visits/today')
      .then(r => {
        setVisits(r.data);
        // Mark everyone already here as checked in
        setCheckedInIds(new Set(r.data.map((v: Visit) => v.student?._id).filter(Boolean)));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async (studentId: string) => {
    const result = await checkInStudent(studentId);
    if (result === 'success') {
      // Reload to show the new visit card
      const { data } = await api.get('/visits/today');
      setVisits(data);
      setCheckedInIds(new Set(data.map((v: Visit) => v.student?._id).filter(Boolean)));
    } else if (result === 'already') {
      setCheckedInIds(prev => new Set<string>([...Array.from(prev), studentId]));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-muted text-sm hover:text-amber transition-colors">← Dashboard</Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Here Today</h1>
            <p className="text-muted text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="card px-4 py-3 text-center">
            <p className="font-display text-3xl font-bold text-emerald">{visits.length}</p>
            <p className="text-xs text-muted">students</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🏫</p>
          <p className="text-muted font-medium">No students marked present yet today</p>
          <Link href="/students" className="text-amber text-sm hover:underline mt-2 block">Go to Students to mark attendance →</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {visits.map((v) => (
            <div key={v._id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center text-emerald font-bold font-display text-lg flex-shrink-0">
                  {v.student?.name?.[0]}
                </div>
                <div>
                  <Link href={`/students/${v.student?._id}`} className="font-semibold text-ink hover:text-amber transition-colors text-sm">
                    {v.student?.name}
                  </Link>
                  <p className="text-xs text-muted">{v.student?.phone} · Arrived {format(new Date(v.visitedAt), 'h:mm a')}</p>
                </div>
              </div>
              <span className={levelColor(v.student?.level)}>{v.student?.level}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick mark present for any student */}
      <div className="mt-8 card p-5">
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Mark Another Student Present</h2>
        <QuickCheckIn onCheckIn={handleCheckIn} checkedInIds={checkedInIds} />
      </div>
    </div>
  );
}

function QuickCheckIn({ onCheckIn, checkedInIds }: { onCheckIn: (id: string) => void; checkedInIds: Set<string> }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState<Student[]>([]);

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    setResults(students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) && !checkedInIds.has(s._id)
    ).slice(0, 5));
  }, [search, students, checkedInIds]);

  return (
    <div>
      <input
        className="input"
        placeholder="Search student name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map(s => (
            <div key={s._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-parchment/50 transition-colors">
              <span className="text-sm text-ink">{s.name}</span>
              <button
                onClick={() => { onCheckIn(s._id); setSearch(''); }}
                className="btn-primary text-xs px-3 py-1"
              >
                Mark Present
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
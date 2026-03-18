'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Student {
  _id: string; name: string; phone: string; level: string;
  goal: string; joiningDate: string; weaknessTags: string[];
}

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

export default function ThisMonthPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/students/this-month')
      .then(r => setStudents(r.data))
      .finally(() => setLoading(false));
  }, []);

  const monthName = format(new Date(), 'MMMM yyyy');

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-muted text-sm hover:text-amber transition-colors">← Dashboard</Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Joined This Month</h1>
            <p className="text-muted text-sm mt-0.5">{monthName}</p>
          </div>
          <div className="card px-4 py-3 text-center">
            <p className="font-display text-3xl font-bold text-amber">{students.length}</p>
            <p className="text-xs text-muted">new students</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-muted font-medium">No new students joined this month yet</p>
          <Link href="/students/new" className="text-amber text-sm hover:underline mt-2 block">Add a student →</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {students.map(s => (
            <div key={s._id} className="card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold font-display text-lg flex-shrink-0">
                  {s.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/students/${s._id}`} className="font-semibold text-ink hover:text-amber transition-colors text-sm">
                      {s.name}
                    </Link>
                    <span className={levelColor(s.level)}>{s.level}</span>
                  </div>
                  <p className="text-xs text-muted">{s.phone} · Joined {format(new Date(s.joiningDate), 'MMM d')}</p>
                  {s.goal && <p className="text-xs text-muted truncate max-w-xs">Goal: {s.goal}</p>}
                </div>
              </div>
              <Link href={`/students/${s._id}`} className="text-amber text-xs hover:underline flex-shrink-0">View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
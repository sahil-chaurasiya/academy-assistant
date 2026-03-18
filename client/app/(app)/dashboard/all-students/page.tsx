'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Student { _id: string; name: string; phone: string; level: string; goal: string; }

const levelColor = (l: string) =>
  l === 'Beginner' ? 'badge-beginner' : l === 'Intermediate' ? 'badge-intermediate' : 'badge-advanced';

const levelGroups = ['Beginner', 'Intermediate', 'Advanced'];

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data)).finally(() => setLoading(false));
  }, []);

  const grouped = levelGroups.map(level => ({
    level,
    items: students.filter(s => s.level === level),
  }));

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-muted text-sm hover:text-amber transition-colors">← Dashboard</Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">All Students</h1>
            <p className="text-muted text-sm mt-0.5">Complete roster</p>
          </div>
          <div className="card px-4 py-3 text-center">
            <p className="font-display text-3xl font-bold text-ink">{students.length}</p>
            <p className="text-xs text-muted">total</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ level, items }) => items.length === 0 ? null : (
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                <span className={levelColor(level)}>{level}</span>
                <span className="text-muted text-xs">{items.length} student{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-2">
                {items.map(s => (
                  <div key={s._id} className="card p-4 flex items-center justify-between hover:shadow-card-hover transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber/10 flex items-center justify-center text-amber font-bold font-display flex-shrink-0">
                        {s.name[0]}
                      </div>
                      <div>
                        <Link href={`/students/${s._id}`} className="font-semibold text-ink hover:text-amber transition-colors text-sm">
                          {s.name}
                        </Link>
                        <p className="text-xs text-muted">{s.phone}</p>
                      </div>
                    </div>
                    <Link href={`/students/${s._id}`} className="text-amber text-xs hover:underline">View →</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
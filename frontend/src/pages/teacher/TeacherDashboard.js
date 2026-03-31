import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { teacherAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherAPI.getDashboard().then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading...</div></Layout>;

  const classes = data?.classStats || [];

  return (
    <Layout title={`Hello, ${user?.firstName}!`} subtitle={`${user?.designation || 'Teacher'} • ${user?.department || 'Department'}`}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Assigned Subjects', value: classes.length, color: '#6366f1', icon: '📚' },
          { label: 'Total Students', value: classes.reduce((s, c) => s + (c.studentCount || 0), 0), color: '#10b981', icon: '👥' },
          { label: 'Teacher ID', value: user?.teacherId || '—', color: '#94a3b8', icon: '🎓' },
          { label: 'Status', value: 'Active', color: '#10b981', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{s.label}</span>
              <span style={{ fontSize: '1.1rem', opacity: 0.6 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Assigned classes */}
      <div className="card fade-up fade-up-1">
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>YOUR ASSIGNED CLASSES</h3>
        {classes.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Subject</th><th>Code</th><th>Branch</th><th>Year</th><th>Section</th><th>Type</th><th>Students</th></tr>
              </thead>
              <tbody>
                {classes.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{c.subject}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--color-muted)' }}>{c.subjectCode || '—'}</td>
                    <td><span className="badge badge-info">{c.branch}</span></td>
                    <td>Year {c.year}</td>
                    <td>Section {c.section}</td>
                    <td>{c.isLab ? <span className="badge badge-success">Lab</span> : <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>Theory</span>}</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>{c.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
            No subjects assigned yet. Contact your admin.
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="card fade-up fade-up-2" style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>QUICK ACTIONS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Mark Attendance', path: '/teacher/attendance', color: '#6366f1' },
            { label: 'Upload Marks', path: '/teacher/marks', color: '#10b981' },
            { label: 'Assignments', path: '/teacher/assignments', color: '#f59e0b' },
            { label: 'Upload Notes', path: '/teacher/notes', color: '#8b5cf6' },
          ].map(l => (
            <a key={l.path} href={l.path} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.875rem',
              borderRadius: 10, background: `${l.color}12`, border: `1px solid ${l.color}30`,
              color: l.color, fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', transition: 'all 0.2s'
            }}>{l.label}</a>
          ))}
        </div>
      </div>
    </Layout>
  );
}

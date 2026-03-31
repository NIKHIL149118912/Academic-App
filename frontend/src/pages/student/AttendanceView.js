import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Layout from '../../components/Layout';
import { attendanceAPI } from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const VIEW_OPTIONS = [
  { label: 'All Time', value: '' },
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
];

export default function AttendanceView() {
  const [data, setData] = useState(null);
  const [view, setView] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (v, s) => {
    setLoading(true);
    attendanceAPI.getStudentAttendance('', { view: v, subject: s })
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(view, subject); }, [view, subject]);

  const summary = data?.summary || [];
  const records = data?.records || [];
  const subjects = [...new Set(records.map(r => r.subject))];

  const overallPresent = summary.reduce((s, x) => s + x.present, 0);
  const overallTotal = summary.reduce((s, x) => s + x.total, 0);
  const overallPct = overallTotal ? ((overallPresent / overallTotal) * 100).toFixed(1) : 0;

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [{ data: [overallPresent, overallTotal - overallPresent], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }]
  };

  return (
    <Layout title="Attendance" subtitle="Track your subject-wise attendance">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {VIEW_OPTIONS.map(o => (
            <button key={o.value} className={`btn ${view === o.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setView(o.value)}>{o.label}</button>
          ))}
        </div>
        <select className="input" value={subject} onChange={e => setSubject(e.target.value)}
          style={{ width: 180 }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading...</div>
      ) : (
        <>
          {/* Overall stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ height: 150, width: 150 }}>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: overallPct >= 75 ? '#10b981' : overallPct >= 60 ? '#f59e0b' : '#ef4444' }}>{overallPct}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Overall Attendance</div>
              </div>
            </div>

            <div className="card fade-up fade-up-1">
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>SUBJECT-WISE BREAKDOWN</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {summary.map((s, i) => {
                  const pct = s.percentage || 0;
                  const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        <span>{s.subject || s._id}</span>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                          <span style={{ color: '#10b981' }}>P: {s.present}</span>
                          <span style={{ color: '#ef4444' }}>A: {s.absent}</span>
                          <span style={{ color, fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                      </div>
                    </div>
                  );
                })}
                {summary.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>No attendance records found.</p>}
              </div>
            </div>
          </div>

          {/* Records table */}
          {records.length > 0 && (
            <div className="card fade-up fade-up-2">
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>RECENT RECORDS</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Subject</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 30).map(r => (
                      <tr key={r._id}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                          {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>{r.subject}</td>
                        <td><span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{r.isLab ? 'Lab' : 'Theory'}</span></td>
                        <td>
                          <span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

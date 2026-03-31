import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import Layout from '../../components/Layout';
import { marksAPI } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const EXAM_LABELS = {
  performance_test: 'Performance Test',
  sessional_1: 'Sessional I',
  sessional_2: 'Sessional II',
  pre_university: 'Pre-University',
  preboard: 'Pre-Board',
  practical: 'Practical',
  assignment: 'Assignment',
};

const gradeColor = (g) => {
  if (!g) return '#64748b';
  if (g.startsWith('A')) return '#10b981';
  if (g.startsWith('B')) return '#6366f1';
  if (g === 'C') return '#f59e0b';
  return '#ef4444';
};

export default function MarksView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examType, setExamType] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    marksAPI.getStudentMarks('', { examType, subject })
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [examType, subject]);

  if (loading) return <Layout title="Marks"><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading...</div></Layout>;

  const marks = data?.marks || [];
  const grouped = data?.grouped || {};
  const overall = data?.overall || {};
  const subjects = Object.keys(grouped);

  const barData = {
    labels: marks.map(m => `${m.subject} (${EXAM_LABELS[m.examType] || m.examType})`),
    datasets: [{
      label: 'Marks (%)',
      data: marks.map(m => ((m.marksObtained / m.totalMarks) * 100).toFixed(1)),
      backgroundColor: marks.map(m => {
        const pct = (m.marksObtained / m.totalMarks) * 100;
        return pct >= 75 ? '#10b981' : pct >= 50 ? '#6366f1' : '#ef4444';
      }),
      borderRadius: 6,
    }]
  };

  return (
    <Layout title="Marks & Results" subtitle="View your exam performance">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select className="input" value={examType} onChange={e => setExamType(e.target.value)} style={{ width: 200 }}>
          <option value="">All Exam Types</option>
          {Object.entries(EXAM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: 200 }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Overall stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Obtained', value: overall.totalObtained || 0, color: '#6366f1' },
          { label: 'Total Maximum', value: overall.totalMax || 0, color: '#94a3b8' },
          { label: 'Overall %', value: `${overall.percentage || 0}%`, color: overall.percentage >= 75 ? '#10b981' : overall.percentage >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'Overall Grade', value: overall.grade || '—', color: gradeColor(overall.grade) },
        ].map((s, i) => (
          <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>{s.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {marks.length > 0 && (
        <div className="card fade-up fade-up-1" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>PERFORMANCE CHART</h3>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#64748b', callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.04)' }, max: 100 }
              }
            }} />
          </div>
        </div>
      )}

      {/* Subject-wise grouped */}
      {subjects.map(sub => (
        <div key={sub} className="card fade-up fade-up-2" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{sub}</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Exam Type</th><th>Exam Name</th><th>Marks</th><th>Total</th><th>Percentage</th><th>Grade</th></tr></thead>
              <tbody>
                {Object.entries(grouped[sub]).flatMap(([type, exams]) =>
                  exams.map(m => {
                    const pct = ((m.marksObtained / m.totalMarks) * 100).toFixed(1);
                    const grade = m.grade || '—';
                    return (
                      <tr key={m._id}>
                        <td><span className="badge badge-info">{EXAM_LABELS[type] || type}</span></td>
                        <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{m.examName || '—'}</td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{m.marksObtained}</td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-muted)' }}>{m.totalMarks}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 60, height: 4, background: 'var(--color-surface-2)', borderRadius: 99 }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: pct >= 75 ? '#10b981' : pct >= 50 ? '#6366f1' : '#ef4444' }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{pct}%</span>
                          </div>
                        </td>
                        <td><span style={{ fontWeight: 700, color: gradeColor(grade), fontSize: '1rem' }}>{grade}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {marks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
          No marks records found. Check back after your exams.
        </div>
      )}
    </Layout>
  );
}

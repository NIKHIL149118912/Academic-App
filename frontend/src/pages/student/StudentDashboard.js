import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import Layout from '../../components/Layout';
import { studentAPI, attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card fade-up">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', opacity: 0.5 }}>{icon}</div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.375rem' }}>{sub}</div>}
  </div>
);

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getDashboard().then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}><div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /></div></Layout>;

  const summary = data?.attendanceSummary || [];
  const labels = summary.map(s => s.subject || s._id);
  const pcts = summary.map(s => s.percentage || 0);

  const doughnutData = {
    labels,
    datasets: [{
      data: pcts,
      backgroundColor: CHART_COLORS.slice(0, labels.length),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const barData = {
    labels,
    datasets: [
      { label: 'Present', data: summary.map(s => s.present), backgroundColor: '#6366f1', borderRadius: 6 },
      { label: 'Absent', data: summary.map(s => s.absent), backgroundColor: '#ef4444', borderRadius: 6 },
    ]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'DM Sans', size: 12 } } } },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  const quickLinks = [
    { label: 'View Attendance', path: '/student/attendance', color: '#6366f1' },
    { label: 'View Marks', path: '/student/marks', color: '#10b981' },
    { label: 'Assignments', path: '/student/assignments', color: '#f59e0b' },
    { label: 'Timetable', path: '/student/timetable', color: '#8b5cf6' },
    { label: 'Notes', path: '/student/notes', color: '#06b6d4' },
    { label: 'Notices', path: '/student/notices', color: '#ec4899' },
  ];

  return (
    <Layout title={`Welcome back, ${user?.firstName}!`} subtitle={`${user?.branch} • Year ${user?.year} • Section ${user?.section}`}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Overall Attendance" value={`${data?.stats?.overallAttendance || 0}%`}
          sub={`${summary.length} subjects tracked`} color={
            (data?.stats?.overallAttendance || 0) >= 75 ? '#10b981' :
            (data?.stats?.overallAttendance || 0) >= 60 ? '#f59e0b' : '#ef4444'
          } icon="📊" />
        <StatCard label="Subjects" value={summary.length} sub="Being tracked" color="#6366f1" icon="📚" />
        <StatCard label="Assignments" value={data?.stats?.totalAssignments || 0} sub="Active assignments" color="#f59e0b" icon="📋" />
        <StatCard label="Roll Number" value={user?.rollNumber || '—'} sub={user?.branch} color="#94a3b8" icon="🎓" />
      </div>

      {/* Charts row */}
      {summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card fade-up fade-up-1">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-muted)' }}>ATTENDANCE DISTRIBUTION</h3>
            <div style={{ height: 200 }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }} />
            </div>
          </div>

          <div className="card fade-up fade-up-2">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-muted)' }}>SUBJECT-WISE ATTENDANCE</h3>
            <div style={{ height: 200 }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Attendance per subject */}
      {summary.length > 0 && (
        <div className="card fade-up fade-up-2" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-muted)' }}>SUBJECT ATTENDANCE DETAILS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {summary.map((s, i) => {
              const pct = s.percentage || 0;
              const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 500 }}>{s.subject || s._id}</span>
                    <span style={{ color, fontWeight: 600 }}>{pct}% ({s.present}/{s.total})</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="card fade-up fade-up-3">
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-muted)' }}>QUICK ACCESS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {quickLinks.map(l => (
            <Link key={l.path} to={l.path} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.875rem', borderRadius: 10,
              background: `${l.color}12`, border: `1px solid ${l.color}30`,
              color: l.color, fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${l.color}20`}
              onMouseLeave={e => e.currentTarget.style.background = `${l.color}12`}
            >{l.label}</Link>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}

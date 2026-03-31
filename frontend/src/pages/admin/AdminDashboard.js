import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Admin Dashboard"><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading analytics...</div></Layout>;

  const stats = data?.stats || {};
  const trend = data?.attendanceTrend || [];
  const dist = data?.branchDistribution || [];

  const trendData = {
    labels: trend.map(t => `${MONTHS[t._id.month - 1]} ${t._id.year}`),
    datasets: [{
      label: 'Attendance %',
      data: trend.map(t => t.total ? ((t.present / t.total) * 100).toFixed(1) : 0),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }]
  };

  const distData = {
    labels: dist.map(d => d._id),
    datasets: [{
      label: 'Students',
      data: dist.map(d => d.count),
      backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'],
      borderRadius: 8,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'DM Sans', size: 12 } } } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents || 0, sub: `${stats.activeStudents || 0} active`, color: '#6366f1', icon: '👥' },
    { label: 'Total Teachers', value: stats.totalTeachers || 0, sub: `${stats.approvedTeachers || 0} approved`, color: '#10b981', icon: '🎓' },
    { label: 'Attendance Records', value: (stats.totalAttendanceRecords || 0).toLocaleString(), sub: 'All time', color: '#f59e0b', icon: '📊' },
    { label: 'Pending Fees', value: stats.pendingFees || 0, sub: 'Unpaid/Overdue', color: '#ef4444', icon: '💰' },
  ];

  return (
    <Layout title={`Admin Panel`} subtitle={`Logged in as ${user?.firstName} ${user?.lastName}`}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)' }}>{s.label}</span>
              <span style={{ fontSize: '1.25rem', opacity: 0.5 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.375rem' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card fade-up fade-up-1">
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>ATTENDANCE TREND (6 MONTHS)</h3>
          <div style={{ height: 220 }}>
            {trend.length > 0 ? <Line data={trendData} options={chartOpts} /> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)' }}>No data yet</div>
            )}
          </div>
        </div>
        <div className="card fade-up fade-up-2">
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>STUDENTS BY BRANCH</h3>
          <div style={{ height: 220 }}>
            {dist.length > 0 ? <Bar data={distData} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} /> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-muted)' }}>No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent notices */}
      {data?.recentNotices?.length > 0 && (
        <div className="card fade-up fade-up-3">
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>RECENT NOTICES</h3>
          {data.recentNotices.map(n => (
            <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{n.title}</span>
                <span className="badge badge-info" style={{ marginLeft: '0.5rem', textTransform: 'capitalize' }}>{n.targetAudience}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {new Date(n.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="card fade-up fade-up-4" style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '1rem' }}>MANAGEMENT</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Manage Students', href: '/admin/students', color: '#6366f1' },
            { label: 'Manage Teachers', href: '/admin/teachers', color: '#10b981' },
            { label: 'Fee Records', href: '/admin/fees', color: '#f59e0b' },
            { label: 'Timetable', href: '/admin/timetable', color: '#8b5cf6' },
            { label: 'Notices', href: '/admin/notices', color: '#06b6d4' },
            { label: 'Feedback', href: '/admin/feedback', color: '#ec4899' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.75rem', borderRadius: 10, background: `${l.color}12`,
              border: `1px solid ${l.color}30`, color: l.color, fontWeight: 500,
              fontSize: '0.8rem', textDecoration: 'none', transition: 'all 0.2s', textAlign: 'center'
            }}>{l.label}</a>
          ))}
        </div>
      </div>
    </Layout>
  );
}

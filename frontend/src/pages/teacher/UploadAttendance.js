import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { attendanceAPI, studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function UploadAttendance() {
  const { user } = useAuth();
  const [form, setForm] = useState({ branch: '', year: '', section: '', subject: '', date: new Date().toISOString().split('T')[0], isLab: false });
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subjects = user?.assignedSubjects || [];

  const handleSubjectChange = (e) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx)) return;
    const s = subjects[idx];
    setForm(f => ({ ...f, branch: s.branch, year: s.year, section: s.section, subject: s.subject, isLab: s.isLab }));
  };

  const loadStudents = async () => {
    if (!form.branch || !form.year || !form.section) return toast.error('Please select a class first.');
    try {
      const r = await studentAPI.getAll({ branch: form.branch, year: form.year, section: form.section, limit: 100 });
      const list = r.data.data;
      setStudents(list);
      const init = {};
      list.forEach(s => { init[s._id] = 'present'; });
      setAttendance(init);
      setLoaded(true);
    } catch { toast.error('Failed to load students.'); }
  };

  const toggleAll = (status) => {
    const upd = {};
    students.forEach(s => { upd[s._id] = status; });
    setAttendance(upd);
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    if (form.date !== today) return toast.error('Teachers can only mark attendance for today.');

    setSubmitting(true);
    try {
      await attendanceAPI.mark({
        ...form,
        year: parseInt(form.year),
        records: students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'absent' }))
      });
      toast.success(`Attendance saved for ${students.length} students!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    setSubmitting(false);
  };

  const statusColors = { present: '#10b981', absent: '#ef4444', late: '#f59e0b', excused: '#8b5cf6' };
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  Object.values(attendance).forEach(v => { if (counts[v] !== undefined) counts[v]++; });

  return (
    <Layout title="Mark Attendance" subtitle="Upload daily class attendance">
      <div className="card fade-up" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="label">Select Subject / Class</label>
            <select className="input" onChange={handleSubjectChange} defaultValue="">
              <option value="">Choose subject...</option>
              {subjects.map((s, i) => (
                <option key={i} value={i}>{s.subject} — {s.branch} Y{s.year} Sec {s.section} {s.isLab ? '(Lab)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
        {form.branch && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
            📋 {form.branch} • Year {form.year} • Section {form.section} • {form.subject}
          </div>
        )}
        <button className="btn btn-primary" onClick={loadStudents}>Load Students</button>
      </div>

      {loaded && (
        <div className="card fade-up fade-up-1">
          {/* Summary */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[s] }} />
                <span style={{ textTransform: 'capitalize', color: 'var(--color-muted)' }}>{s}:</span>
                <span style={{ fontWeight: 600, color: statusColors[s] }}>{c}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => toggleAll('present')}>All Present</button>
              <button className="btn btn-sm btn-secondary" onClick={() => toggleAll('absent')}>All Absent</button>
            </div>
          </div>

          <div className="table-wrapper" style={{ marginBottom: '1rem' }}>
            <table>
              <thead><tr><th>#</th><th>Roll Number</th><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 500 }}>{s.rollNumber}</td>
                    <td>{s.firstName} {s.lastName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {Object.keys(statusColors).map(status => (
                          <button key={status} onClick={() => setAttendance(a => ({ ...a, [s._id]: status }))}
                            style={{
                              padding: '0.3rem 0.7rem', borderRadius: 6, border: `1px solid ${attendance[s._id] === status ? statusColors[status] : 'var(--color-border)'}`,
                              background: attendance[s._id] === status ? `${statusColors[status]}18` : 'transparent',
                              color: attendance[s._id] === status ? statusColors[status] : 'var(--color-muted)',
                              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
                              textTransform: 'capitalize', transition: 'all 0.15s'
                            }}>{status[0].toUpperCase()}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit} style={{ float: 'right' }}>
            {submitting ? 'Saving...' : `💾 Save Attendance (${students.length} students)`}
          </button>
        </div>
      )}
    </Layout>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { assignmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const isPastDeadline = (d) => new Date(d) < new Date();

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const fileRefs = useRef({});

  useEffect(() => {
    assignmentAPI.getAll().then(r => { setAssignments(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (id) => {
    const file = fileRefs.current[id]?.files?.[0];
    if (!file) return toast.error('Please select a PDF file.');
    if (file.type !== 'application/pdf') return toast.error('Only PDF files are allowed.');

    const fd = new FormData();
    fd.append('file', file);

    setSubmitting(id);
    try {
      await assignmentAPI.submit(id, fd);
      toast.success('Assignment submitted!');
      const r = await assignmentAPI.getAll();
      setAssignments(r.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    }
    setSubmitting(null);
  };

  if (loading) return <Layout title="Assignments"><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>Loading...</div></Layout>;

  const active = assignments.filter(a => !isPastDeadline(a.deadline));
  const past = assignments.filter(a => isPastDeadline(a.deadline));

  const AssignmentCard = ({ a }) => {
    const past = isPastDeadline(a.deadline);
    const submitted = !!a.mySubmission;
    const daysLeft = Math.ceil((new Date(a.deadline) - new Date()) / (1000 * 60 * 60 * 24));

    return (
      <div className="card" style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => setExpanded(expanded === a._id ? null : a._id)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{a.title}</h3>
              {submitted ? <span className="badge badge-success">✓ Submitted{a.mySubmission?.isLate ? ' (Late)' : ''}</span>
                : past ? <span className="badge badge-danger">Missed</span>
                : <span className="badge badge-warning">Pending</span>}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              <span>📚 {a.subject}</span>
              <span>👤 {a.createdBy?.firstName} {a.createdBy?.lastName}</span>
              <span>🏆 {a.totalMarks} marks</span>
              <span style={{ color: !past && daysLeft <= 2 ? '#ef4444' : past ? '#64748b' : '#f59e0b' }}>
                📅 {past ? `Due ${new Date(a.deadline).toLocaleDateString('en-IN')}` : `${daysLeft}d left`}
              </span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: expanded === a._id ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0, color: 'var(--color-muted)' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {expanded === a._id && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>{a.description}</p>

            {/* Teacher attachments */}
            {a.attachments?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>ATTACHMENTS</div>
                {a.attachments.map((f, i) => (
                  <a key={i} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginRight: '0.5rem' }}>
                    📄 {f.originalName}
                  </a>
                ))}
              </div>
            )}

            {/* Submission status */}
            {submitted ? (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.25rem' }}>✓ Submitted</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                  {new Date(a.mySubmission.submittedAt).toLocaleString('en-IN')} • {a.mySubmission.originalName}
                </div>
                {a.mySubmission.grade && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Grade: {a.mySubmission.grade}</span>
                    {a.mySubmission.feedback && <span style={{ color: 'var(--color-muted)', marginLeft: '0.75rem' }}>— {a.mySubmission.feedback}</span>}
                  </div>
                )}
              </div>
            ) : !past ? (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>SUBMIT ASSIGNMENT (PDF only)</div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="file" accept=".pdf" ref={el => fileRefs.current[a._id] = el}
                    style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-muted)' }} />
                  <button className="btn btn-primary btn-sm" disabled={submitting === a._id}
                    onClick={() => handleSubmit(a._id)}>
                    {submitting === a._id ? 'Uploading...' : '⬆ Submit'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout title="Assignments" subtitle="View and submit your assignments">
      {active.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', marginBottom: '0.75rem' }}>
            ACTIVE — {active.length} assignment{active.length !== 1 ? 's' : ''}
          </div>
          {active.map(a => <AssignmentCard key={a._id} a={a} />)}
        </div>
      )}

      {past.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
            PAST — {past.length} assignment{past.length !== 1 ? 's' : ''}
          </div>
          {past.map(a => <AssignmentCard key={a._id} a={a} />)}
        </div>
      )}

      {assignments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
          No assignments yet. Your teachers will post them here.
        </div>
      )}
    </Layout>
  );
}

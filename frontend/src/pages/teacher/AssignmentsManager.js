import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { assignmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AssignmentsManager() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const subjects = user?.assignedSubjects || [];
  const fileRef = useRef();
  const [form, setForm] = useState({ title:'', description:'', subject:'', branch:'', year:'', section:'', deadline:'', totalMarks:10 });

  const load = () => assignmentAPI.getAll().then(r => setAssignments(r.data.data)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const handleSubjectChange = (e) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx)) return;
    const s = subjects[idx];
    setForm(f => ({...f, subject:s.subject, branch:s.branch, year:s.year, section:s.section}));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (fileRef.current?.files?.length) {
      Array.from(fileRef.current.files).forEach(f => fd.append('attachments', f));
    }
    setSubmitting(true);
    try {
      await assignmentAPI.create(fd);
      toast.success('Assignment created!');
      setCreating(false);
      setForm({ title:'', description:'', subject:'', branch:'', year:'', section:'', deadline:'', totalMarks:10 });
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    await assignmentAPI.delete(id);
    toast.success('Removed.');
    load();
  };

  return (
    <Layout title="Assignments" subtitle="Create and manage assignments">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
        <button className="btn btn-primary" onClick={() => setCreating(v=>!v)}>
          {creating ? '✕ Cancel' : '+ New Assignment'}
        </button>
      </div>

      {creating && (
        <div className="card fade-up" style={{marginBottom:'1rem'}}>
          <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'1rem'}}>Create Assignment</h3>
          <form onSubmit={handleCreate}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div>
                <label className="label">Title *</label>
                <input className="input" type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Subject / Class *</label>
                <select className="input" onChange={handleSubjectChange} required defaultValue="">
                  <option value="">Select...</option>
                  {subjects.map((s,i)=><option key={i} value={i}>{s.subject} — {s.branch} Y{s.year} Sec {s.section}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deadline *</label>
                <input className="input" type="datetime-local" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input className="input" type="number" value={form.totalMarks} onChange={e=>setForm(f=>({...f,totalMarks:e.target.value}))} min="1" />
              </div>
            </div>
            <div style={{marginBottom:'0.75rem'}}>
              <label className="label">Description *</label>
              <textarea className="input" rows={4} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required style={{resize:'vertical'}} />
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label className="label">Attachments (optional)</label>
              <input type="file" multiple ref={fileRef} style={{fontSize:'0.875rem',color:'var(--color-muted)'}} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting?'Creating...':'Create Assignment'}</button>
          </form>
        </div>
      )}

      {assignments.map(a => (
        <div key={a._id} className="card fade-up" style={{marginBottom:'0.75rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontWeight:600,fontSize:'1rem',marginBottom:'0.25rem'}}>{a.title}</div>
              <div style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>
                {a.subject} • {a.branch} Y{a.year} Sec {a.section} • Due: {new Date(a.deadline).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
              <span className="badge badge-info">{a.submissions?.length||0} submissions</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setExpanded(expanded===a._id?null:a._id)}>
                {expanded===a._id?'Hide':'Review'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a._id)}>Remove</button>
            </div>
          </div>

          {expanded===a._id && (
            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--color-border)'}}>
              <h4 style={{fontSize:'0.75rem',fontWeight:600,color:'var(--color-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.75rem'}}>SUBMISSIONS ({a.submissions?.length||0})</h4>
              {a.submissions?.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Student</th><th>Submitted</th><th>Status</th><th>Grade</th><th>File</th></tr></thead>
                    <tbody>
                      {a.submissions.map(sub => (
                        <tr key={sub._id}>
                          <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem'}}>{sub.student?.rollNumber||sub.student}</td>
                          <td style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>{new Date(sub.submittedAt).toLocaleDateString('en-IN')}</td>
                          <td>{sub.isLate?<span className="badge badge-warning">Late</span>:<span className="badge badge-success">On Time</span>}</td>
                          <td style={{color:'#10b981',fontWeight:600}}>{sub.grade||'—'}</td>
                          <td><a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">View PDF</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{color:'var(--color-muted)',fontSize:'0.875rem'}}>No submissions yet.</p>}
            </div>
          )}
        </div>
      ))}
      {assignments.length===0&&!creating&&<div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>No assignments. Create your first one above.</div>}
    </Layout>
  );
}

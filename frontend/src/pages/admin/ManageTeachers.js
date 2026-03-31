import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { teacherAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', isApproved:'', page:1 });
  const [pagination, setPagination] = useState({});
  const [assignForm, setAssignForm] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [newSub, setNewSub] = useState({ subject:'', subjectCode:'', branch:'', year:'', section:'', isLab:false });

  const load = async (f=filters) => {
    setLoading(true);
    try {
      const r = await teacherAPI.getAll({...f, limit:20});
      setTeachers(r.data.data); setPagination(r.data.pagination||{});
    } catch { toast.error('Failed to load.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    await teacherAPI.approve(id); toast.success('Teacher approved!'); load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this teacher?')) return;
    await teacherAPI.delete(id); toast.success('Teacher deactivated.'); load();
  };

  const handleAssign = async () => {
    if (!newSub.subject || !newSub.branch || !newSub.year || !newSub.section) return toast.error('Fill all required fields.');
    setAssigning(true);
    try {
      await teacherAPI.assignSubject(assignForm._id, {...newSub, year:parseInt(newSub.year)});
      toast.success('Subject assigned!'); setAssignForm(null); load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setAssigning(false);
  };

  return (
    <Layout title="Manage Teachers" subtitle="Approve, assign subjects, manage teachers">
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
        <input className="input" type="text" placeholder="Search name, ID, email..." value={filters.search}
          onChange={e=>{const nf={...filters,search:e.target.value,page:1};setFilters(nf);load(nf);}} style={{width:240}} />
        <select className="input" value={filters.isApproved} onChange={e=>{const nf={...filters,isApproved:e.target.value,page:1};setFilters(nf);load(nf);}} style={{width:150}}>
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {loading ? <div style={{textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>Loading...</div> : (
        <div className="card fade-up">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Teacher ID</th><th>Name</th><th>Department</th><th>Email</th><th>Subjects</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t._id}>
                    <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem',fontWeight:500}}>{t.teacherId}</td>
                    <td>{t.firstName} {t.lastName}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>{t.department||'—'}</td>
                    <td style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>{t.email}</td>
                    <td><span className="badge badge-info">{t.assignedSubjects?.length||0}</span></td>
                    <td>
                      {!t.isApproved ? <span className="badge badge-warning">Pending</span>
                        : t.isActive ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'0.4rem'}}>
                        {!t.isApproved && <button className="btn btn-sm btn-success" onClick={() => handleApprove(t._id)}>Approve</button>}
                        <button className="btn btn-sm btn-secondary" onClick={() => setAssignForm(t)}>Assign</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t._id)}>Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign subject modal */}
      {assignForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:16,padding:'2rem',width:500,maxWidth:'95vw'}}>
            <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'0.25rem'}}>Assign Subject</h3>
            <p style={{fontSize:'0.8rem',color:'var(--color-muted)',marginBottom:'1.25rem'}}>To: {assignForm.firstName} {assignForm.lastName} ({assignForm.teacherId})</p>

            {assignForm.assignedSubjects?.length > 0 && (
              <div style={{marginBottom:'1rem'}}>
                <div style={{fontSize:'0.7rem',fontWeight:600,color:'var(--color-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'0.5rem'}}>CURRENT SUBJECTS</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
                  {assignForm.assignedSubjects.map((s,i) => (
                    <span key={i} className="badge badge-info">{s.subject} • {s.branch} Y{s.year} {s.section}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
              <div><label className="label">Subject *</label><input className="input" value={newSub.subject} onChange={e=>setNewSub(f=>({...f,subject:e.target.value}))} placeholder="e.g. Data Structures" /></div>
              <div><label className="label">Code</label><input className="input" value={newSub.subjectCode} onChange={e=>setNewSub(f=>({...f,subjectCode:e.target.value}))} placeholder="CS-201" /></div>
              <div><label className="label">Branch *</label><input className="input" value={newSub.branch} onChange={e=>setNewSub(f=>({...f,branch:e.target.value}))} placeholder="CSE" /></div>
              <div><label className="label">Year *</label><select className="input" value={newSub.year} onChange={e=>setNewSub(f=>({...f,year:e.target.value}))}><option value="">Select</option>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select></div>
              <div><label className="label">Section *</label><input className="input" value={newSub.section} onChange={e=>setNewSub(f=>({...f,section:e.target.value}))} placeholder="A" /></div>
              <div style={{display:'flex',alignItems:'flex-end',paddingBottom:'0.25rem'}}>
                <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.875rem'}}>
                  <input type="checkbox" checked={newSub.isLab} onChange={e=>setNewSub(f=>({...f,isLab:e.target.checked}))} />
                  Lab Session
                </label>
              </div>
            </div>

            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={() => setAssignForm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={assigning}>{assigning?'Assigning...':'Assign Subject'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

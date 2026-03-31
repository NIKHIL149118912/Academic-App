import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE','ECE','ME','CE','EE','IT','Other'];

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ branch:'', year:'', section:'', search:'', page:1 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (f=filters) => {
    setLoading(true);
    try {
      const r = await studentAPI.getAll({...f, limit:20});
      setStudents(r.data.data); setPagination(r.data.pagination||{});
    } catch(e) { toast.error('Failed to load students.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  const setFilter = (k,v) => { const nf={...filters,[k]:v,page:1}; setFilters(nf); load(nf); };

  const handleUpdate = async () => {
    try {
      await studentAPI.update(editing._id, { firstName:editing.firstName, lastName:editing.lastName, section:editing.section, year:editing.year, branch:editing.branch, isActive:editing.isActive });
      toast.success('Student updated.');
      setEditing(null); load();
    } catch(err) { toast.error(err.response?.data?.message||'Update failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    await studentAPI.delete(id); toast.success('Student deactivated.'); load();
  };

  return (
    <Layout title="Manage Students" subtitle="Add, edit and manage student records">
      {/* Filters */}
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',flexWrap:'wrap'}}>
        <input className="input" type="text" placeholder="Search name, roll, email..." value={filters.search}
          onChange={e=>setFilter('search',e.target.value)} style={{width:240}} />
        <select className="input" value={filters.branch} onChange={e=>setFilter('branch',e.target.value)} style={{width:120}}>
          <option value="">All Branches</option>
          {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={filters.year} onChange={e=>setFilter('year',e.target.value)} style={{width:110}}>
          <option value="">All Years</option>
          {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
        </select>
        <input className="input" type="text" placeholder="Section" value={filters.section}
          onChange={e=>setFilter('section',e.target.value)} style={{width:90}} />
      </div>

      {loading ? <div style={{textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>Loading...</div> : (
        <>
          <div className="card fade-up">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <span style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>Total: {pagination.total||0} students</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Roll No.</th><th>Name</th><th>Branch</th><th>Year</th><th>Section</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem',fontWeight:500}}>{s.rollNumber}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td><span className="badge badge-info">{s.branch}</span></td>
                      <td>Y{s.year}</td>
                      <td>{s.section}</td>
                      <td style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>{s.email}</td>
                      <td>{s.isActive?<span className="badge badge-success">Active</span>:<span className="badge badge-danger">Inactive</span>}</td>
                      <td>
                        <div style={{display:'flex',gap:'0.4rem'}}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditing({...s})}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem',marginTop:'1rem'}}>
              {Array.from({length:pagination.pages||0},(_,i)=>i+1).map(p=>(
                <button key={p} className={`btn btn-sm ${filters.page===p?'btn-primary':'btn-secondary'}`}
                  onClick={() => { const nf={...filters,page:p}; setFilters(nf); load(nf); }}>{p}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editing && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:16,padding:'2rem',width:480,maxWidth:'95vw'}}>
            <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'1.25rem'}}>Edit Student</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div><label className="label">First Name</label><input className="input" value={editing.firstName} onChange={e=>setEditing(ed=>({...ed,firstName:e.target.value}))} /></div>
              <div><label className="label">Last Name</label><input className="input" value={editing.lastName} onChange={e=>setEditing(ed=>({...ed,lastName:e.target.value}))} /></div>
              <div><label className="label">Year</label><select className="input" value={editing.year} onChange={e=>setEditing(ed=>({...ed,year:parseInt(e.target.value)}))}>{[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}</select></div>
              <div><label className="label">Section</label><input className="input" value={editing.section} onChange={e=>setEditing(ed=>({...ed,section:e.target.value}))} /></div>
              <div><label className="label">Branch</label><select className="input" value={editing.branch} onChange={e=>setEditing(ed=>({...ed,branch:e.target.value}))}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
              <div><label className="label">Status</label><select className="input" value={editing.isActive} onChange={e=>setEditing(ed=>({...ed,isActive:e.target.value==='true'}))}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',justifyContent:'flex-end',marginTop:'1rem'}}>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

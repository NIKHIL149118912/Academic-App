import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function UploadNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ title:'', description:'', subject:'', subjectCode:'', topic:'', branch:'', year:'', section:'' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const subjects = user?.assignedSubjects || [];

  const load = () => notesAPI.getAll().then(r => setNotes(r.data.data)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const handleSubjectChange = (e) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx)) return;
    const s = subjects[idx];
    setForm(f => ({...f, subject:s.subject, subjectCode:s.subjectCode||'', branch:s.branch, year:s.year, section:s.section||''}));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Please select a file.');
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k,v); });
    fd.append('file', file);
    setUploading(true);
    try {
      await notesAPI.upload(fd);
      toast.success('Notes uploaded!');
      setForm({ title:'', description:'', subject:'', subjectCode:'', topic:'', branch:'', year:'', section:'' });
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Upload failed.'); }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    await notesAPI.delete(id);
    toast.success('Removed.');
    load();
  };

  return (
    <Layout title="Upload Notes" subtitle="Share study materials with your students">
      <div className="card fade-up" style={{marginBottom:'1.5rem'}}>
        <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'1rem'}}>Upload New Notes</h3>
        <form onSubmit={handleUpload}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0.75rem',marginBottom:'0.75rem'}}>
            <div>
              <label className="label">Title *</label>
              <input className="input" type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
            </div>
            <div>
              <label className="label">Subject / Class *</label>
              <select className="input" onChange={handleSubjectChange} required defaultValue="">
                <option value="">Select class...</option>
                {subjects.map((s,i)=><option key={i} value={i}>{s.subject} — {s.branch} Y{s.year}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Topic</label>
              <input className="input" type="text" value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="e.g. Binary Trees" />
            </div>
          </div>
          <div style={{marginBottom:'0.75rem'}}>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{resize:'vertical'}} />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label className="label">File (PDF, DOC, DOCX, Image) *</label>
            <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,image/*" style={{fontSize:'0.875rem',color:'var(--color-muted)'}} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading?'Uploading...':'⬆ Upload Notes'}</button>
        </form>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem'}}>
        {notes.map(n => (
          <div key={n._id} className="card fade-up">
            <div style={{fontWeight:600,fontSize:'0.9rem',marginBottom:'0.25rem'}}>{n.title}</div>
            <div style={{fontSize:'0.75rem',color:'var(--color-muted)',marginBottom:'0.75rem'}}>{n.subject} • {n.branch} Y{n.year} {n.section&&`Sec ${n.section}`}</div>
            {n.topic && <div style={{fontSize:'0.8rem',color:'#818cf8',marginBottom:'0.5rem'}}>📌 {n.topic}</div>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',paddingTop:'0.75rem',borderTop:'1px solid var(--color-border)'}}>
              <span style={{fontSize:'0.75rem',color:'var(--color-muted)'}}>📥 {n.downloadCount} downloads</span>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n._id)}>Remove</button>
            </div>
          </div>
        ))}
        {notes.length===0&&<div className="card" style={{gridColumn:'1/-1',textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>No notes uploaded yet.</div>}
      </div>
    </Layout>
  );
}

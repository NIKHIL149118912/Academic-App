import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { noticeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TYPE_COLORS = { general:'#6366f1', exam:'#f59e0b', holiday:'#10b981', event:'#8b5cf6', urgent:'#ef4444' };

export default function NoticeManager() {
  const [notices, setNotices] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', type:'general', targetAudience:'all', isPinned:false, expiresAt:'' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => noticeAPI.getAll({ limit:50 }).then(r => setNotices(r.data.data)).catch(()=>{});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await noticeAPI.create(form);
      toast.success('Notice published!');
      setCreating(false);
      setForm({ title:'', content:'', type:'general', targetAudience:'all', isPinned:false, expiresAt:'' });
      load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await noticeAPI.delete(id); toast.success('Notice removed.'); load();
  };

  return (
    <Layout title="Notices" subtitle="Publish and manage announcements">
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
        <button className="btn btn-primary" onClick={() => setCreating(v=>!v)}>{creating?'✕ Cancel':'+ New Notice'}</button>
      </div>

      {creating && (
        <div className="card fade-up" style={{marginBottom:'1rem'}}>
          <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'1rem'}}>Create Notice</h3>
          <form onSubmit={handleCreate}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0.75rem',marginBottom:'0.75rem'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label className="label">Title *</label>
                <input className="input" type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {Object.keys(TYPE_COLORS).map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Target Audience</label>
                <select className="input" value={form.targetAudience} onChange={e=>setForm(f=>({...f,targetAudience:e.target.value}))}>
                  <option value="all">All</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                </select>
              </div>
              <div>
                <label className="label">Expires (optional)</label>
                <input className="input" type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))} />
              </div>
            </div>
            <div style={{marginBottom:'0.75rem'}}>
              <label className="label">Content *</label>
              <textarea className="input" rows={5} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} required style={{resize:'vertical'}} />
            </div>
            <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem'}}>
              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontSize:'0.875rem'}}>
                <input type="checkbox" checked={form.isPinned} onChange={e=>setForm(f=>({...f,isPinned:e.target.checked}))} />
                📌 Pin this notice
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting?'Publishing...':'Publish Notice'}</button>
          </form>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {notices.map(n => (
          <div key={n._id} className="card fade-up" style={{borderLeft:`3px solid ${TYPE_COLORS[n.type]||'#6366f1'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.375rem'}}>
                  {n.isPinned&&<span>📌</span>}
                  <span style={{fontWeight:600,fontSize:'1rem'}}>{n.title}</span>
                  <span className="badge" style={{background:`${TYPE_COLORS[n.type]}18`,color:TYPE_COLORS[n.type],textTransform:'capitalize'}}>{n.type}</span>
                  <span className="badge badge-info" style={{textTransform:'capitalize'}}>{n.targetAudience}</span>
                </div>
                <p style={{fontSize:'0.875rem',color:'var(--color-muted)',lineHeight:1.5}}>{n.content.length>150?n.content.slice(0,150)+'...':n.content}</p>
                <div style={{fontSize:'0.75rem',color:'var(--color-muted)',marginTop:'0.375rem'}}>
                  {new Date(n.createdAt).toLocaleString('en-IN')}
                  {n.expiresAt&&` • Expires: ${new Date(n.expiresAt).toLocaleDateString('en-IN')}`}
                </div>
              </div>
              <button className="btn btn-sm btn-danger" style={{marginLeft:'1rem'}} onClick={() => handleDelete(n._id)}>Delete</button>
            </div>
          </div>
        ))}
        {notices.length===0&&!creating&&<div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>No notices yet.</div>}
      </div>
    </Layout>
  );
}

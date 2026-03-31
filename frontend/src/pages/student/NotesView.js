import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { notesAPI, downloadCSV } from '../../services/api';
import toast from 'react-hot-toast';

export default function NotesView() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [downloading, setDownloading] = useState(null);

  const load = (s) => {
    notesAPI.getAll({ subject: s }).then(r => { setNotes(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(subject); }, [subject]);

  const subjects = [...new Set(notes.map(n => n.subject))];

  const handleDownload = async (note) => {
    setDownloading(note._id);
    try {
      const r = await notesAPI.download(note._id);
      downloadCSV(r.data, note.originalName);
      toast.success('Download started!');
    } catch { toast.error('Download failed.'); }
    setDownloading(null);
  };

  return (
    <Layout title="Study Notes" subtitle="Download notes uploaded by your teachers">
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <select className="input" value={subject} onChange={e=>setSubject(e.target.value)} style={{width:200}}>
          <option value="">All Subjects</option>
          {subjects.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>Loading...</div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {notes.map(n => (
            <div key={n._id} className="card fade-up" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
                <div style={{width:40,height:40,borderRadius:8,background:'rgba(99,102,241,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',flexShrink:0}}>📄</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'0.9rem',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.title}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--color-muted)'}}>{n.subject} {n.subjectCode && `• ${n.subjectCode}`}</div>
                </div>
              </div>
              {n.topic && <div style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>Topic: {n.topic}</div>}
              {n.description && <div style={{fontSize:'0.8rem',color:'var(--color-muted)',lineHeight:1.5}}>{n.description}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto',paddingTop:'0.75rem',borderTop:'1px solid var(--color-border)'}}>
                <div style={{fontSize:'0.75rem',color:'var(--color-muted)'}}>
                  👤 {n.uploadedBy?.firstName} {n.uploadedBy?.lastName}<br/>
                  📥 {n.downloadCount} downloads
                </div>
                <button className="btn btn-primary btn-sm" disabled={downloading===n._id} onClick={() => handleDownload(n)}>
                  {downloading===n._id ? '...' : '⬇ Download'}
                </button>
              </div>
            </div>
          ))}
          {notes.length===0 && <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)',gridColumn:'1/-1'}}>No notes uploaded yet.</div>}
        </div>
      )}
    </Layout>
  );
}

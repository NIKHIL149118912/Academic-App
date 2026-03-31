import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { noticeAPI } from '../../services/api';

const TYPE_COLORS = { general:'#6366f1', exam:'#f59e0b', holiday:'#10b981', event:'#8b5cf6', urgent:'#ef4444' };

export default function NoticesView() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  useEffect(() => {
    noticeAPI.getAll({ type }).then(r => { setNotices(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [type]);

  return (
    <Layout title="Notices" subtitle="Stay updated with latest announcements">
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {['','general','exam','holiday','event','urgent'].map(t => (
          <button key={t} onClick={() => setType(t)} className={`btn btn-sm ${type===t?'btn-primary':'btn-secondary'}`}
            style={{textTransform:'capitalize'}}>{t||'All'}</button>
        ))}
      </div>

      {loading ? <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>Loading...</div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {notices.map(n => (
            <div key={n._id} className="card fade-up" style={{borderLeft:`3px solid ${TYPE_COLORS[n.type]||'#6366f1'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.5rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  {n.isPinned && <span title="Pinned" style={{fontSize:'1rem'}}>📌</span>}
                  <h3 style={{fontSize:'1rem',fontWeight:600}}>{n.title}</h3>
                  <span className="badge" style={{background:`${TYPE_COLORS[n.type]||'#6366f1'}18`,color:TYPE_COLORS[n.type]||'#6366f1',textTransform:'capitalize'}}>{n.type}</span>
                </div>
                <div style={{fontSize:'0.75rem',color:'var(--color-muted)',flexShrink:0}}>
                  {new Date(n.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                </div>
              </div>
              <p style={{fontSize:'0.875rem',color:'var(--color-muted)',lineHeight:1.6}}>{n.content}</p>
              {n.createdBy && <div style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'var(--color-muted)'}}>— Posted by Admin</div>}
            </div>
          ))}
          {notices.length===0 && <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>No notices yet.</div>}
        </div>
      )}
    </Layout>
  );
}

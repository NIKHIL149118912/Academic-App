import React, { useEffect, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function FeedbackAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getFeedbackAnalytics().then(r => { setAnalytics(r.data.data||[]); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const radarData = (t) => ({
    labels: ['Teaching Quality', 'Subject Knowledge', 'Punctuality', 'Communication', 'Helpfulness'],
    datasets: [{
      label: t.teacherName,
      data: [t.avgTeachingQuality, t.avgSubjectKnowledge, t.avgPunctuality, t.avgCommunication, t.avgHelpfulness],
      backgroundColor: 'rgba(99,102,241,0.15)',
      borderColor: '#6366f1',
      pointBackgroundColor: '#6366f1',
      borderWidth: 2,
    }]
  });

  const avg = (t) => ((t.avgTeachingQuality+t.avgSubjectKnowledge+t.avgPunctuality+t.avgCommunication+t.avgHelpfulness)/5).toFixed(2);

  const StarDisplay = ({ val }) => (
    <span style={{color:'#f59e0b',fontFamily:'inherit'}}>
      {'★'.repeat(Math.round(val))}{'☆'.repeat(5-Math.round(val))}
      <span style={{color:'var(--color-muted)',fontSize:'0.8rem',marginLeft:'0.4rem'}}>{val?.toFixed(1)}</span>
    </span>
  );

  return (
    <Layout title="Feedback Analytics" subtitle="Anonymous student feedback analysis — confidential">
      {loading ? <div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>Loading...</div> : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div style={{fontSize:'0.7rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-muted)',marginBottom:'0.25rem'}}>TEACHER RATINGS</div>
            {analytics.map(t => (
              <div key={t._id} className={`card fade-up ${selected?._id===t._id?'':'`} `}
                style={{cursor:'pointer',border:`1px solid ${selected?._id===t._id?'var(--color-primary)':'var(--color-border)'}`}}
                onClick={() => setSelected(t)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:'0.9rem'}}>{t.teacherName}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--color-muted)',fontFamily:'JetBrains Mono,monospace'}}>{t.teacherId}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'1.5rem',fontWeight:700,color:'#f59e0b'}}>{avg(t)}</div>
                    <div style={{fontSize:'0.7rem',color:'var(--color-muted)'}}>{t.totalFeedbacks} reviews</div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.3rem'}}>
                  {[['Teaching','avgTeachingQuality'],['Knowledge','avgSubjectKnowledge'],['Punctuality','avgPunctuality']].map(([l,k])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem'}}>
                      <span style={{color:'var(--color-muted)'}}>{l}</span>
                      <StarDisplay val={t[k]} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {analytics.length===0&&<div className="card" style={{textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>No feedback data yet.</div>}
          </div>

          <div>
            {selected ? (
              <div className="card fade-up" style={{position:'sticky',top:'80px'}}>
                <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'0.25rem'}}>{selected.teacherName}</h3>
                <p style={{fontSize:'0.8rem',color:'var(--color-muted)',marginBottom:'1rem'}}>{selected.totalFeedbacks} anonymous responses</p>
                <div style={{height:280}}>
                  <Radar data={radarData(selected)} options={{
                    responsive:true, maintainAspectRatio:false,
                    scales:{ r:{ min:0,max:5, ticks:{color:'#64748b',stepSize:1}, grid:{color:'rgba(255,255,255,0.08)'}, pointLabels:{color:'#94a3b8',font:{size:11}} }},
                    plugins:{legend:{display:false}}
                  }} />
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'1rem'}}>
                  {[['Teaching Quality','avgTeachingQuality'],['Subject Knowledge','avgSubjectKnowledge'],['Punctuality','avgPunctuality'],['Communication','avgCommunication'],['Helpfulness','avgHelpfulness']].map(([l,k])=>(
                    <div key={k} style={{padding:'0.625rem',background:'var(--color-surface-2)',borderRadius:8}}>
                      <div style={{fontSize:'0.7rem',color:'var(--color-muted)',marginBottom:'0.25rem'}}>{l}</div>
                      <StarDisplay val={selected[k]} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>
                Select a teacher to view detailed analytics
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { timetableAPI } from '../../services/api';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_LABELS = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };
const TODAY = DAYS[new Date().getDay() - 1] || 'monday';

export default function TimetableView() {
  const [timetable, setTimetable] = useState(null);
  const [activeDay, setActiveDay] = useState(TODAY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableAPI.get().then(r => { setTimetable(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Timetable"><div style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>Loading...</div></Layout>;

  const periods = timetable?.schedule?.[activeDay] || [];

  return (
    <Layout title="Class Timetable" subtitle="Your weekly schedule">
      {/* Day tabs */}
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {DAYS.map(d => (
          <button key={d} onClick={() => setActiveDay(d)}
            className={`btn btn-sm ${activeDay===d ? 'btn-primary' : 'btn-secondary'}`}
            style={{textTransform:'capitalize', position:'relative'}}>
            {DAY_LABELS[d]}
            {d===TODAY && <span style={{position:'absolute',top:-4,right:-4,width:8,height:8,background:'#10b981',borderRadius:'50%'}}/>}
          </button>
        ))}
      </div>

      {timetable ? (
        <div className="card fade-up">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h3 style={{fontSize:'1rem',fontWeight:600,textTransform:'capitalize'}}>{DAY_LABELS[activeDay]}</h3>
            {activeDay===TODAY && <span className="badge badge-success">Today</span>}
          </div>
          {periods.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {periods.map((p,i) => (
                <div key={i} style={{display:'flex',gap:'1rem',alignItems:'stretch'}}>
                  <div style={{width:80,flexShrink:0,textAlign:'center',padding:'0.75rem 0',background:'var(--color-surface-2)',borderRadius:8,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                    <div style={{fontSize:'0.7rem',color:'var(--color-muted)'}}>Period {p.periodNumber}</div>
                    <div style={{fontSize:'0.75rem',fontFamily:'JetBrains Mono,monospace',fontWeight:500,marginTop:2}}>{p.startTime}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--color-muted)'}}>to {p.endTime}</div>
                  </div>
                  <div style={{flex:1,background:p.isLab?'rgba(16,185,129,0.08)':'rgba(99,102,241,0.06)',border:`1px solid ${p.isLab?'rgba(16,185,129,0.2)':'rgba(99,102,241,0.15)'}`,borderRadius:8,padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'0.9rem'}}>{p.subject}</div>
                        {p.subjectCode && <div style={{fontSize:'0.75rem',color:'var(--color-muted)',fontFamily:'JetBrains Mono,monospace'}}>{p.subjectCode}</div>}
                      </div>
                      <div style={{textAlign:'right'}}>
                        {p.isLab && <span className="badge badge-success" style={{marginBottom:4}}>Lab</span>}
                        {p.room && <div style={{fontSize:'0.75rem',color:'var(--color-muted)'}}>Room {p.room}</div>}
                      </div>
                    </div>
                    {(p.teacherName || p.teacher) && (
                      <div style={{marginTop:'0.5rem',fontSize:'0.8rem',color:'var(--color-muted)'}}>
                        👤 {p.teacherName || (p.teacher?.firstName+' '+p.teacher?.lastName)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>No classes scheduled for {DAY_LABELS[activeDay]}</div>
          )}
        </div>
      ) : (
        <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>
          Timetable not published yet. Check back later.
        </div>
      )}
    </Layout>
  );
}

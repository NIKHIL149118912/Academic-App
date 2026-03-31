import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { timetableAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const EMPTY_PERIOD = { periodNumber:1, startTime:'', endTime:'', subject:'', subjectCode:'', teacherName:'', room:'', isLab:false };

export default function TimetableManager() {
  const [form, setForm] = useState({ branch:'', year:'', section:'', semester:'', academicYear:'' });
  const [schedule, setSchedule] = useState({ monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[] });
  const [activeDay, setActiveDay] = useState('monday');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);

  const loadExisting = async () => {
    if (!form.branch||!form.year||!form.section) return;
    try {
      const r = await timetableAPI.get({ branch:form.branch, year:form.year, section:form.section });
      if (r.data.data) { setExisting(r.data.data); setSchedule(r.data.data.schedule||schedule); }
    } catch {}
  };

  const addPeriod = () => {
    const periods = schedule[activeDay];
    setSchedule(s => ({ ...s, [activeDay]: [...periods, { ...EMPTY_PERIOD, periodNumber: periods.length+1 }] }));
  };

  const updatePeriod = (idx, field, val) => {
    setSchedule(s => {
      const updated = [...s[activeDay]];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...s, [activeDay]: updated };
    });
  };

  const removePeriod = (idx) => {
    setSchedule(s => ({ ...s, [activeDay]: s[activeDay].filter((_,i)=>i!==idx) }));
  };

  const handleSubmit = async () => {
    if (!form.branch||!form.year||!form.section) return toast.error('Fill class details.');
    setSubmitting(true);
    try {
      await timetableAPI.create({ ...form, year:parseInt(form.year), schedule });
      toast.success('Timetable saved!'); setExisting(true);
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setSubmitting(false);
  };

  return (
    <Layout title="Timetable Manager" subtitle="Create and publish class timetables">
      <div className="card fade-up" style={{marginBottom:'1rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.75rem',marginBottom:'1rem'}}>
          {[['Branch','branch','CSE'],['Year','year',''],['Section','section',''],['Semester','semester',''],['Academic Year','academicYear','2024-25']].map(([label,key,ph])=>(
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" type={key==='year'||key==='semester'?'number':'text'} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} />
            </div>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadExisting}>Load Existing</button>
        {existing && <span style={{marginLeft:'0.75rem',fontSize:'0.8rem',color:'#10b981'}}>✓ Existing timetable loaded</span>}
      </div>

      <div className="card fade-up fade-up-1">
        {/* Day tabs */}
        <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
          {DAYS.map(d => (
            <button key={d} onClick={() => setActiveDay(d)} className={`btn btn-sm ${activeDay===d?'btn-primary':'btn-secondary'}`}
              style={{textTransform:'capitalize'}}>
              {d} <span style={{opacity:0.7,fontSize:'0.7rem'}}>({schedule[d]?.length||0})</span>
            </button>
          ))}
        </div>

        {/* Periods */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',marginBottom:'1rem'}}>
          {schedule[activeDay]?.map((p, idx) => (
            <div key={idx} style={{background:'var(--color-surface-2)',border:'1px solid var(--color-border)',borderRadius:10,padding:'0.875rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                <span style={{fontWeight:600,fontSize:'0.85rem',color:'var(--color-muted)'}}>Period {p.periodNumber}</span>
                <button onClick={() => removePeriod(idx)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'1rem'}}>✕</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'0.5rem'}}>
                {[['Subject','subject'],['Code','subjectCode'],['Teacher','teacherName'],['Room','room'],['Start','startTime'],['End','endTime']].map(([label,field])=>(
                  <div key={field}>
                    <label className="label" style={{fontSize:'0.65rem'}}>{label}</label>
                    <input className="input" type={field.includes('Time')?'time':'text'} value={p[field]}
                      onChange={e=>updatePeriod(idx,field,e.target.value)} style={{padding:'0.4rem 0.6rem'}} />
                  </div>
                ))}
              </div>
              <label style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.5rem',fontSize:'0.8rem',cursor:'pointer'}}>
                <input type="checkbox" checked={p.isLab} onChange={e=>updatePeriod(idx,'isLab',e.target.checked)} /> Lab Session
              </label>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:'0.75rem'}}>
          <button className="btn btn-secondary" onClick={addPeriod}>+ Add Period</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{marginLeft:'auto'}}>
            {submitting?'Saving...':'💾 Save Timetable'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

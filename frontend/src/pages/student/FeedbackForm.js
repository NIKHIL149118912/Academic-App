import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { feedbackAPI, teacherAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const RATING_LABELS = { teachingQuality:'Teaching Quality', subjectKnowledge:'Subject Knowledge', punctuality:'Punctuality', communication:'Communication', helpfulness:'Helpfulness' };

const StarRating = ({ value, onChange }) => (
  <div style={{display:'flex',gap:'0.25rem'}}>
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.5rem',color:s<=value?'#f59e0b':'#334155',transition:'color 0.15s',padding:0}}>★</button>
    ))}
  </div>
);

export default function FeedbackForm() {
  const [enabled, setEnabled] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ teacherId:'', subject:'', comments:'', ratings:{teachingQuality:0,subjectKnowledge:0,punctuality:0,communication:0,helpfulness:0} });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    adminAPI.getPolicies().then(r => setEnabled(r.data.data?.feedbackEnabled||false));
    teacherAPI.getAll({ isApproved:true }).then(r => setTeachers(r.data.data||[]));
  }, []);

  const setRating = (k, v) => setForm(f => ({...f, ratings:{...f.ratings,[k]:v}}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allRated = Object.values(form.ratings).every(v => v > 0);
    if (!allRated) return toast.error('Please rate all categories.');
    if (!form.teacherId) return toast.error('Please select a teacher.');

    setSubmitting(true);
    try {
      await feedbackAPI.submit({ teacherId:form.teacherId, subject:form.subject, ratings:form.ratings, comments:form.comments, academicYear:new Date().getFullYear()+'-'+String(new Date().getFullYear()+1).slice(-2) });
      setDone(true);
      toast.success('Feedback submitted anonymously!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    }
    setSubmitting(false);
  };

  if (!enabled) return <Layout title="Feedback"><div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--color-muted)'}}>Feedback is currently disabled by the admin.</div></Layout>;

  if (done) return <Layout title="Feedback">
    <div className="card fade-up" style={{textAlign:'center',padding:'3rem'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>✅</div>
      <h2 style={{fontFamily:'"Playfair Display",serif',fontSize:'1.5rem',marginBottom:'0.5rem'}}>Thank you!</h2>
      <p style={{color:'var(--color-muted)'}}>Your feedback has been submitted anonymously and will only be visible to the admin.</p>
      <button className="btn btn-primary" style={{marginTop:'1.5rem'}} onClick={() => setDone(false)}>Submit Another</button>
    </div>
  </Layout>;

  return (
    <Layout title="Teacher Feedback" subtitle="Your feedback is anonymous and only visible to admin">
      <div className="card fade-up" style={{maxWidth:600}}>
        <div className="alert alert-info" style={{marginBottom:'1.25rem'}}>
          🔒 Your identity is completely anonymous. Teachers cannot see individual feedback.
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label className="label">Select Teacher *</label>
            <select className="input" value={form.teacherId} onChange={e=>setForm(f=>({...f,teacherId:e.target.value}))} required>
              <option value="">Choose a teacher...</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.teacherId})</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label className="label">Subject (Optional)</label>
            <input className="input" type="text" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="e.g. Data Structures" />
          </div>

          <div style={{marginBottom:'1.5rem'}}>
            <div style={{fontSize:'0.75rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-muted)',marginBottom:'1rem'}}>RATINGS *</div>
            {Object.entries(RATING_LABELS).map(([key,label]) => (
              <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.875rem'}}>
                <span style={{fontSize:'0.875rem',fontWeight:500}}>{label}</span>
                <StarRating value={form.ratings[key]} onChange={v => setRating(key, v)} />
              </div>
            ))}
          </div>

          <div style={{marginBottom:'1.5rem'}}>
            <label className="label">Additional Comments (Optional)</label>
            <textarea className="input" rows={4} value={form.comments} onChange={e=>setForm(f=>({...f,comments:e.target.value}))} placeholder="Share your thoughts..." style={{resize:'vertical'}} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{width:'100%',justifyContent:'center',padding:'0.75rem'}}>
            {submitting ? 'Submitting...' : 'Submit Feedback Anonymously'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

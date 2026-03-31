import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { marksAPI, studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EXAM_TYPES = ['performance_test','sessional_1','sessional_2','pre_university','preboard','practical','assignment'];
const EXAM_LABELS = {performance_test:'Performance Test',sessional_1:'Sessional I',sessional_2:'Sessional II',pre_university:'Pre-University',preboard:'Pre-Board',practical:'Practical',assignment:'Assignment'};

export default function UploadMarks() {
  const { user } = useAuth();
  const [form, setForm] = useState({ branch:'', year:'', section:'', subject:'', examType:'performance_test', examName:'', totalMarks:100, academicYear:'' });
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const subjects = user?.assignedSubjects || [];

  const handleSubjectChange = (e) => {
    const idx = parseInt(e.target.value);
    if (isNaN(idx)) return;
    const s = subjects[idx];
    setForm(f => ({...f, branch:s.branch, year:s.year, section:s.section, subject:s.subject}));
  };

  const loadStudents = async () => {
    if (!form.branch) return toast.error('Select a class first.');
    const r = await studentAPI.getAll({ branch:form.branch, year:form.year, section:form.section, limit:100 });
    const list = r.data.data;
    setStudents(list);
    const init = {};
    list.forEach(s => { init[s._id] = ''; });
    setMarks(init);
    setLoaded(true);
  };

  const handleSubmit = async () => {
    const records = students.map(s => ({ studentId:s._id, marksObtained:parseFloat(marks[s._id]||0) }));
    const invalid = records.filter(r => isNaN(r.marksObtained) || r.marksObtained < 0 || r.marksObtained > form.totalMarks);
    if (invalid.length) return toast.error(`Some marks are invalid (must be 0-${form.totalMarks}).`);
    setSubmitting(true);
    try {
      await marksAPI.upload({ ...form, year:parseInt(form.year), totalMarks:parseInt(form.totalMarks), records });
      toast.success(`Marks uploaded for ${students.length} students!`);
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setSubmitting(false);
  };

  return (
    <Layout title="Upload Marks" subtitle="Enter exam marks for your class">
      <div className="card fade-up" style={{marginBottom:'1rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem',marginBottom:'1rem'}}>
          <div>
            <label className="label">Subject / Class</label>
            <select className="input" onChange={handleSubjectChange} defaultValue="">
              <option value="">Choose subject...</option>
              {subjects.map((s,i) => <option key={i} value={i}>{s.subject} — {s.branch} Y{s.year} Sec {s.section}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select className="input" value={form.examType} onChange={e=>setForm(f=>({...f,examType:e.target.value}))}>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{EXAM_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Name</label>
            <input className="input" type="text" value={form.examName} onChange={e=>setForm(f=>({...f,examName:e.target.value}))} placeholder="e.g. PT-1, Mid-Term" />
          </div>
          <div>
            <label className="label">Total Marks</label>
            <input className="input" type="number" value={form.totalMarks} onChange={e=>setForm(f=>({...f,totalMarks:e.target.value}))} min="1" />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input" type="text" value={form.academicYear} onChange={e=>setForm(f=>({...f,academicYear:e.target.value}))} placeholder="2024-25" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={loadStudents}>Load Students</button>
      </div>

      {loaded && (
        <div className="card fade-up fade-up-1">
          <h3 style={{fontSize:'0.875rem',fontWeight:600,marginBottom:'1rem'}}>{form.subject} — {EXAM_LABELS[form.examType]} (Total: {form.totalMarks})</h3>
          <div className="table-wrapper" style={{marginBottom:'1rem'}}>
            <table>
              <thead><tr><th>#</th><th>Roll No.</th><th>Name</th><th>Marks Obtained</th><th>%</th></tr></thead>
              <tbody>
                {students.map((s,i) => {
                  const val = marks[s._id];
                  const pct = val !== '' && !isNaN(val) ? ((parseFloat(val)/form.totalMarks)*100).toFixed(1) : '—';
                  const pctNum = parseFloat(pct);
                  return (
                    <tr key={s._id}>
                      <td style={{color:'var(--color-muted)',fontSize:'0.8rem'}}>{i+1}</td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem'}}>{s.rollNumber}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td>
                        <input type="number" min="0" max={form.totalMarks} value={val}
                          onChange={e => setMarks(m=>({...m,[s._id]:e.target.value}))}
                          className="input" style={{width:100,padding:'0.4rem 0.6rem'}} placeholder="—" />
                      </td>
                      <td style={{fontWeight:600,color: pctNum>=75?'#10b981':pctNum>=50?'#f59e0b':'#ef4444'}}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit} style={{float:'right'}}>
            {submitting ? 'Uploading...' : `⬆ Upload Marks (${students.length})`}
          </button>
        </div>
      )}
    </Layout>
  );
}

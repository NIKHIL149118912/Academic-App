import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { feeAPI, studentAPI, downloadCSV } from '../../services/api';
import toast from 'react-hot-toast';

const FEE_TYPES = ['tuition','exam','library','lab','hostel','transport','development','other'];
const STATUS_COLORS = { pending:'#f59e0b', paid:'#10b981', overdue:'#ef4444', partial:'#8b5cf6', waived:'#64748b' };

export default function FeeManager() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status:'', academicYear:'' });
  const [form, setForm] = useState({ student:'', feeType:'tuition', amount:'', dueDate:'', semester:'', academicYear:'2024-25', description:'' });

  const load = () => feeAPI.getStudentFees('', filters).then(r => setFees(r.data.data||[])).catch(()=>{});
  useEffect(() => { load(); studentAPI.getAll({ limit:200 }).then(r => setStudents(r.data.data||[])); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feeAPI.add({ ...form, amount:parseFloat(form.amount), semester:parseInt(form.semester) });
      toast.success('Fee record added!'); setCreating(false); load();
    } catch(err) { toast.error(err.response?.data?.message||'Failed.'); }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id, status, paidAmount) => {
    try {
      await feeAPI.update(id, { status, paidAmount:parseFloat(paidAmount||0), paidDate: status==='paid'?new Date().toISOString():undefined });
      toast.success('Fee updated!'); load();
    } catch { toast.error('Update failed.'); }
  };

  const handleExport = async () => {
    try {
      const r = await feeAPI.exportCSV(filters);
      downloadCSV(r.data, `fees_${Date.now()}.csv`);
    } catch { toast.error('Export failed.'); }
  };

  const summary = fees.reduce((acc, f) => { acc.total += f.amount; acc.paid += f.paidAmount; return acc; }, { total:0, paid:0 });

  return (
    <Layout title="Fee Records" subtitle="Manage student fee collection">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <select className="input" value={filters.status} onChange={e=>{const nf={...filters,status:e.target.value};setFilters(nf);}} style={{width:150}}>
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
          </select>
          <input className="input" type="text" placeholder="Academic Year" value={filters.academicYear} onChange={e=>setFilters(f=>({...f,academicYear:e.target.value}))} style={{width:130}} />
          <button className="btn btn-secondary" onClick={load}>Apply</button>
        </div>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <button className="btn btn-secondary" onClick={handleExport}>⬇ Export CSV</button>
          <button className="btn btn-primary" onClick={() => setCreating(v=>!v)}>{creating?'✕ Cancel':'+ Add Fee'}</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1rem'}}>
        {[['Total Billed',`₹${summary.total.toLocaleString('en-IN')}`,'#6366f1'],['Total Collected',`₹${summary.paid.toLocaleString('en-IN')}`,'#10b981'],['Outstanding',`₹${(summary.total-summary.paid).toLocaleString('en-IN')}`,'#ef4444']].map(([l,v,c])=>(
          <div key={l} className="stat-card fade-up"><div style={{fontSize:'0.7rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-muted)',marginBottom:'0.5rem'}}>{l}</div><div style={{fontSize:'1.75rem',fontWeight:700,color:c}}>{v}</div></div>
        ))}
      </div>

      {creating && (
        <div className="card fade-up" style={{marginBottom:'1rem'}}>
          <h3 style={{fontSize:'1rem',fontWeight:600,marginBottom:'1rem'}}>Add Fee Record</h3>
          <form onSubmit={handleCreate}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'0.75rem',marginBottom:'1rem'}}>
              <div><label className="label">Student *</label>
                <select className="input" value={form.student} onChange={e=>setForm(f=>({...f,student:e.target.value}))} required>
                  <option value="">Select student...</option>
                  {students.map(s=><option key={s._id} value={s._id}>{s.rollNumber} — {s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div><label className="label">Fee Type</label>
                <select className="input" value={form.feeType} onChange={e=>setForm(f=>({...f,feeType:e.target.value}))}>
                  {FEE_TYPES.map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Amount (₹) *</label><input className="input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required min="0" /></div>
              <div><label className="label">Due Date *</label><input className="input" type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} required /></div>
              <div><label className="label">Semester *</label><input className="input" type="number" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} required min="1" max="12" /></div>
              <div><label className="label">Academic Year *</label><input className="input" type="text" value={form.academicYear} onChange={e=>setForm(f=>({...f,academicYear:e.target.value}))} placeholder="2024-25" required /></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting?'Adding...':'Add Fee Record'}</button>
          </form>
        </div>
      )}

      <div className="card fade-up fade-up-1">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Student</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {fees.map(f => (
                <tr key={f._id}>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem'}}>{f.student?.rollNumber||f.student}</td>
                  <td style={{textTransform:'capitalize',fontSize:'0.85rem'}}>{f.feeType}</td>
                  <td style={{fontWeight:600}}>₹{f.amount?.toLocaleString('en-IN')}</td>
                  <td style={{fontSize:'0.8rem',color:'var(--color-muted)'}}>{f.dueDate?new Date(f.dueDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td>₹{(f.paidAmount||0).toLocaleString('en-IN')}</td>
                  <td><span className="badge" style={{background:`${STATUS_COLORS[f.status]||'#6366f1'}18`,color:STATUS_COLORS[f.status]||'#6366f1',textTransform:'capitalize'}}>{f.status}</span></td>
                  <td>
                    {f.status!=='paid' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(f._id,'paid',f.amount)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fees.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--color-muted)'}}>No fee records found.</div>}
      </div>
    </Layout>
  );
}

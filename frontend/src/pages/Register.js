import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'Other'];
const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Lab Instructor'];

export default function Register() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') || 'student');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    // Student fields
    rollNumber: '', section: '', year: '', branch: 'CSE',
    // Teacher fields
    teacherId: '', department: '', designation: 'Assistant Professor',
  });
  const [submitting, setSubmitting] = useState(false);
  const { registerStudent, registerTeacher } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');

    setSubmitting(true);

    let result;
    if (role === 'student') {
      result = await registerStudent({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        password: form.password, rollNumber: form.rollNumber, section: form.section,
        year: parseInt(form.year), branch: form.branch
      });
      if (result.success) { toast.success('Registration successful!'); navigate('/student/dashboard'); }
    } else {
      result = await registerTeacher({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        password: form.password, teacherId: form.teacherId, department: form.department,
        designation: form.designation
      });
      if (result.success) {
        toast.success('Registered! Awaiting admin approval.');
        navigate('/login');
      }
    }

    if (!result.success) toast.error(result.message || 'Registration failed.');
    setSubmitting(false);
  };

  return (
    <div className="login-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700 }}>Create Account</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Join the AcademiaX portal</p>
        </div>

        <div className="fade-up fade-up-1" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem' }}>
          {/* Role toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['student', 'teacher'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{
                  padding: '0.625rem', borderRadius: 8, border: `1px solid ${role === r ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: role === r ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: role === r ? 'var(--color-primary)' : 'var(--color-muted)',
                  fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  textTransform: 'capitalize', transition: 'all 0.2s'
                }}
              >{r}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Common fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="label">First Name *</label>
                <input className="input" type="text" value={form.firstName} onChange={set('firstName')} placeholder="John" required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" type="text" value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'student' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="label">Roll Number *</label>
                    <input className="input" type="text" value={form.rollNumber} onChange={set('rollNumber')} placeholder="CS2021001" required />
                  </div>
                  <div>
                    <label className="label">Section *</label>
                    <input className="input" type="text" value={form.section} onChange={set('section')} placeholder="A" required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="label">Year *</label>
                    <select className="input" value={form.year} onChange={set('year')} required>
                      <option value="">Select Year</option>
                      {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Branch *</label>
                    <select className="input" value={form.branch} onChange={set('branch')} required>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="label">Teacher ID *</label>
                    <input className="input" type="text" value={form.teacherId} onChange={set('teacherId')} placeholder="TCH2021001" required />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input className="input" type="text" value={form.department} onChange={set('department')} placeholder="Computer Science" />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="label">Designation</label>
                  <select className="input" value={form.designation} onChange={set('designation')}>
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Common: email, password */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 chars" required minLength={8} />
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input className="input" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required />
              </div>
            </div>

            {role === 'teacher' && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#fcd34d' }}>
                ℹ️ Teacher accounts require admin approval before you can log in.
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

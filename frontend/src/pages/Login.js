import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'student', label: 'Student', color: '#6366f1', desc: 'Access courses, marks & attendance' },
  { value: 'teacher', label: 'Teacher', color: '#10b981', desc: 'Manage classes and uploads' },
  { value: 'admin', label: 'Admin', color: '#f59e0b', desc: 'Full system control' },
];

export default function Login() {
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, role: userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate(`/${userRole}/dashboard`, { replace: true });
  }, [isAuthenticated, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return toast.error('Please fill in all fields.');
    setSubmitting(true);
    const result = await login(identifier, password, role);
    setSubmitting(false);
    if (result.success) {
      toast.success(`Welcome back!`);
      navigate(`/${role}/dashboard`);
    } else {
      toast.error(result.message || 'Login failed.');
    }
  };

  const selectedRole = ROLES.find(r => r.value === role);

  return (
    <div className="login-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: 'white',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)'
          }}>A</div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            AcademiaX
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Academic Management System</p>
        </div>

        {/* Card */}
        <div className="fade-up fade-up-1" style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Sign in to your portal</h2>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  padding: '0.625rem 0.25rem',
                  borderRadius: 10,
                  border: `1px solid ${role === r.value ? r.color : 'var(--color-border)'}`,
                  background: role === r.value ? `${r.color}18` : 'transparent',
                  color: role === r.value ? r.color : 'var(--color-muted)',
                  fontWeight: 500, fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif',
                  boxShadow: role === r.value ? `0 0 12px ${r.color}30` : 'none'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Role description */}
          <div style={{
            background: 'var(--color-surface-2)', borderRadius: 8, padding: '0.625rem 0.875rem',
            fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1.5rem',
            borderLeft: `3px solid ${selectedRole?.color}`, display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedRole?.color }} />
            {selectedRole?.desc}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">
                {role === 'student' ? 'Roll Number or Email' : role === 'teacher' ? 'Teacher ID or Email' : 'Admin ID or Email'}
              </label>
              <input
                type="text"
                className="input"
                placeholder={role === 'student' ? 'e.g. CS2021001 or you@example.com' : 'Your ID or email'}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 0
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {submitting ? (
                <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />Signing in...</>
              ) : `Sign in as ${selectedRole?.label}`}
            </button>
          </form>

          {/* Register link */}
          {role !== 'admin' && (
            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Don't have an account?{' '}
              <Link to={`/register?role=${role}`} style={{ color: selectedRole?.color, textDecoration: 'none', fontWeight: 500 }}>
                Register here
              </Link>
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          © {new Date().getFullYear()} AcademiaX. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

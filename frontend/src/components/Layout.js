import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="lg-sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Sidebar always visible on large screens */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 30 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          position: 'sticky', top: 0, zIndex: 20
        }}>
          <div>
            {title && (
              <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.375rem', fontWeight: 700, lineHeight: 1 }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{subtitle}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              fontSize: '0.75rem', color: 'var(--color-muted)',
              background: 'var(--color-surface-2)', padding: '0.375rem 0.75rem',
              borderRadius: 6, border: '1px solid var(--color-border)'
            }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '1.5rem', maxWidth: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

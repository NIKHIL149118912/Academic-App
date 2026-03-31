import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import AttendanceView from './pages/student/AttendanceView';
import MarksView from './pages/student/MarksView';
import Assignments from './pages/student/Assignments';
import TimetableView from './pages/student/TimetableView';
import NotesView from './pages/student/NotesView';
import NoticesView from './pages/student/NoticesView';
import FeedbackForm from './pages/student/FeedbackForm';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import UploadAttendance from './pages/teacher/UploadAttendance';
import UploadMarks from './pages/teacher/UploadMarks';
import AssignmentsManager from './pages/teacher/AssignmentsManager';
import UploadNotes from './pages/teacher/UploadNotes';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import TimetableManager from './pages/admin/TimetableManager';
import FeeManager from './pages/admin/FeeManager';
import NoticeManager from './pages/admin/NoticeManager';
import FeedbackAnalytics from './pages/admin/FeedbackAnalytics';

import './index.css';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
};

// ─── Role-based default redirect ──────────────────────────────────────────────
const RoleRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}/dashboard`} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><AttendanceView /></ProtectedRoute>} />
      <Route path="/student/marks" element={<ProtectedRoute allowedRoles={['student']}><MarksView /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><Assignments /></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><TimetableView /></ProtectedRoute>} />
      <Route path="/student/notes" element={<ProtectedRoute allowedRoles={['student']}><NotesView /></ProtectedRoute>} />
      <Route path="/student/notices" element={<ProtectedRoute allowedRoles={['student']}><NoticesView /></ProtectedRoute>} />
      <Route path="/student/feedback" element={<ProtectedRoute allowedRoles={['student']}><FeedbackForm /></ProtectedRoute>} />

      {/* Teacher */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><UploadAttendance /></ProtectedRoute>} />
      <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={['teacher']}><UploadMarks /></ProtectedRoute>} />
      <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['teacher']}><AssignmentsManager /></ProtectedRoute>} />
      <Route path="/teacher/notes" element={<ProtectedRoute allowedRoles={['teacher']}><UploadNotes /></ProtectedRoute>} />
      <Route path="/teacher/notices" element={<ProtectedRoute allowedRoles={['teacher']}><NoticesView /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><ManageStudents /></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><ManageTeachers /></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['admin']}><TimetableManager /></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['admin']}><FeeManager /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['admin']}><NoticeManager /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><FeedbackAnalytics /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2035',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1a2035' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1a2035' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

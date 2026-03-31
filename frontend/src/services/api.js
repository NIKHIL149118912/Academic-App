/**
 * API Service Layer
 * Axios instance with automatic token refresh
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request Interceptor: Attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerStudent: (data) => api.post('/auth/register/student', data),
  registerTeacher: (data) => api.post('/auth/register/teacher', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ─── Student endpoints ────────────────────────────────────────────────────────
export const studentAPI = {
  getDashboard: () => api.get('/students/dashboard'),
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  updateProfile: (data) => api.put('/students/profile', data),
  changePassword: (data) => api.put('/students/change-password', data),
};

// ─── Teacher endpoints ────────────────────────────────────────────────────────
export const teacherAPI = {
  getDashboard: () => api.get('/teachers/dashboard'),
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  approve: (id) => api.patch(`/teachers/${id}/approve`),
  delete: (id) => api.delete(`/teachers/${id}`),
  assignSubject: (id, data) => api.post(`/teachers/${id}/assign-subject`, data),
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPolicies: () => api.get('/admin/policies'),
  updatePolicies: (data) => api.put('/admin/policies', data),
  getFeedbackAnalytics: (params) => api.get('/admin/feedback-analytics', { params }),
};

// ─── Attendance endpoints ─────────────────────────────────────────────────────
export const attendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId || ''}`, { params }),
  getClassAttendance: (params) => api.get('/attendance/class', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  edit: (id, data) => api.put(`/attendance/${id}`, data),
  exportCSV: (params) => api.get('/attendance/export', { params, responseType: 'blob' }),
};

// ─── Marks endpoints ──────────────────────────────────────────────────────────
export const marksAPI = {
  upload: (data) => api.post('/marks', data),
  getStudentMarks: (studentId, params) => api.get(`/marks/student/${studentId || ''}`, { params }),
  getClassMarks: (params) => api.get('/marks/class', { params }),
  edit: (id, data) => api.put(`/marks/${id}`, data),
  exportCSV: (params) => api.get('/marks/export', { params, responseType: 'blob' }),
};

// ─── Assignment endpoints ─────────────────────────────────────────────────────
export const assignmentAPI = {
  create: (data) => api.post('/assignments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/assignments', { params }),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  review: (id, data) => api.put(`/assignments/${id}/review`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
};

// ─── Notice endpoints ─────────────────────────────────────────────────────────
export const noticeAPI = {
  getAll: (params) => api.get('/notices', { params }),
  create: (data) => api.post('/notices', data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  delete: (id) => api.delete(`/notices/${id}`),
};

// ─── Timetable endpoints ──────────────────────────────────────────────────────
export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/timetable/${id}`, data),
};

// ─── Feedback endpoints ───────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getAll: (params) => api.get('/feedback', { params }),
};

// ─── Fee endpoints ────────────────────────────────────────────────────────────
export const feeAPI = {
  add: (data) => api.post('/fees', data),
  getStudentFees: (studentId, params) => api.get(`/fees/student/${studentId || ''}`, { params }),
  update: (id, data) => api.put(`/fees/${id}`, data),
  exportCSV: (params) => api.get('/fees/export', { params, responseType: 'blob' }),
};

// ─── Notes endpoints ──────────────────────────────────────────────────────────
export const notesAPI = {
  upload: (data) => api.post('/notes', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params) => api.get('/notes', { params }),
  download: (id) => api.get(`/notes/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/notes/${id}`),
};

// ─── CSV download helper ──────────────────────────────────────────────────────
export const downloadCSV = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export default api;

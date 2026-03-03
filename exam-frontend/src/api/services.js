import api from './client'

// ── AUTH ────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', null, { params: { refreshToken } }),
  refresh: (refreshToken) => api.post('/auth/refresh', null, { params: { refreshToken } }),
}

// ── USERS ───────────────────────────────────────────────
export const userApi = {
  register: (data) => api.post('/users/register', data),
  me: () => api.get('/users/me'),
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStudentProfile: (data) => api.put('/users/me/student-profile', data),
  updateTeacherProfile: (data) => api.put('/users/me/teacher-profile', data),
}

// ── COURSES ─────────────────────────────────────────────
export const courseApi = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getStudents: (id) => api.get(`/courses/${id}/students`),
  addStudent: (id, studentId) => api.post(`/courses/${id}/students/${studentId}`),
  addStudents: (id, studentIds) => api.post(`/courses/${id}/students`, studentIds),
  removeStudent: (id, studentId) => api.delete(`/courses/${id}/students/${studentId}`),
}

// ── QUESTIONS (to be implemented) ───────────────────────
export const questionApi = {
  getAll: (courseId) => api.get('/questions', { params: { courseId } }),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
}

// ── EXAMS ────────────────────────────────────────────────
export const examApi = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  publish: (id) => api.post(`/exams/${id}/publish`),
}

// ── ATTEMPTS ─────────────────────────────────────────────
export const attemptApi = {
  start: (examId) => api.post(`/exams/${examId}/start`),
  submit: (attemptId, answers) => api.post(`/attempts/${attemptId}/submit`, { answers }),
  getResult: (attemptId) => api.get(`/attempts/${attemptId}/result`),
  getMyAttempts: () => api.get('/attempts/me'),
}

import api from './client'

// ── AUTH ────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', null, { params: { refreshToken } }),
  refresh: (refreshToken) => api.post('/auth/refresh', null, { params: { refreshToken } }),
}

// ── USERS ───────────────────────────────────────────────
export const userApi = {
  createUser: (data) => api.post('/users', data),           // Admin tạo bất kỳ role
  createStudent: (data) => api.post('/users/students', data), // Admin/Teacher tạo student
  me: () => api.get('/users/me'),
  myProfile: () => api.get('/users/me/profile'),
  getAll: () => api.get('/users'),
  getAllStudents: () => api.get('/users/students'),
  getAllTeachers: () => api.get('/users/teachers'),
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

// ── QUESTIONS ────────────────────────────────────────────
export const questionApi = {
  getAll: (courseId, params) => api.get(`/questions`, { params: { courseId, ...params } }),
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
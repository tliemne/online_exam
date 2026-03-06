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
  myProfile: () => api.get('/users/me/profile'),
  getAll: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  getAllStudents: () => api.get('/users/students'),
  getAllTeachers: () => api.get('/users/teachers'),
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
  getAll: (courseId, params) => api.get('/questions', { params: { courseId, ...params } }),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
}

// ── EXAMS ────────────────────────────────────────────────
export const examApi = {
  getAll: (courseId) => api.get('/exams', { params: courseId ? { courseId } : {} }),
  getById: (id, includeQuestions = false) => api.get(`/exams/${id}`, { params: { includeQuestions } }),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  publish: (id) => api.post(`/exams/${id}/publish`),
  close: (id) => api.post(`/exams/${id}/close`),
  // Quản lý câu hỏi trong đề
  addQuestions: (examId, items) => api.post(`/exams/${examId}/questions`, items),
  removeQuestion: (examId, questionId) => api.delete(`/exams/${examId}/questions/${questionId}`),
  reorderQuestions: (examId, items) => api.put(`/exams/${examId}/questions/reorder`, items),
}

// ── ATTEMPTS ─────────────────────────────────────────────
export const attemptApi = {
  start: (examId) => api.post(`/exams/${examId}/start`),
  submit: (attemptId, answers) => api.post(`/attempts/${attemptId}/submit`, { answers }),
  getResult: (attemptId) => api.get(`/attempts/${attemptId}/result`),
  getMyAttempts: () => api.get('/attempts/me'),
}

// ── LECTURES ──────────────────────────────────────────────
export const lectureApi = {
  getByCourse: (courseId)             => api.get(`/courses/${courseId}/lectures`),
  create:      (courseId, data)       => api.post(`/courses/${courseId}/lectures`, data),
  update:      (courseId, id, data)   => api.put(`/courses/${courseId}/lectures/${id}`, data),
  delete:      (courseId, id)         => api.delete(`/courses/${courseId}/lectures/${id}`),
}
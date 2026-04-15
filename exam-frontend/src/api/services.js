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
  updateMe: (data) => api.put('/users/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getAll: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  getById: (id) => api.get(`/users/${id}`),
  getAllStudents: () => api.get('/users/students'),
  getAllTeachers: () => api.get('/users/teachers'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateStudentProfile: (data) => api.put('/users/me/student-profile', data),
  updateTeacherProfile: (data) => api.put('/users/me/teacher-profile', data),
  changeMyPassword: (oldPassword, newPassword) => api.put('/users/me/password', { oldPassword, newPassword }),
  resetPassword: (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword }),
  createStudent: (data) => api.post('/users/students', data),
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
  getLeaderboard: (id) => api.get(`/courses/${id}/leaderboard`),
  addTeacher: (id, teacherId) => api.post(`/courses/${id}/teachers/${teacherId}`),
  removeTeacher: (id, teacherId) => api.delete(`/courses/${id}/teachers/${teacherId}`),
  getTeachers: (id) => api.get(`/courses/${id}/teachers`),
}

// ── QUESTIONS ────────────────────────────────────────────
export const questionApi = {
  getAll: (courseId, params) => api.get('/questions', { params: { courseId, ...params } }),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  importExcel: (file, courseId) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/questions/import/excel?courseId=${courseId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  importCsv: (file, courseId) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/questions/import/csv?courseId=${courseId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  importJson: (data, courseId) => api.post(`/questions/import/json?courseId=${courseId}`, data),
  getStatsByCourse: (courseId) => api.get(`/questions/stats/course/${courseId}`),
  getFlaggedByCourse: (courseId) => api.get(`/questions/stats/course/${courseId}/flagged`),
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
  addQuestions: (examId, items) => api.post(`/exams/${examId}/questions`, items),
  removeQuestion: (examId, questionId) => api.delete(`/exams/${examId}/questions/${questionId}`),
  randomQuestions: (examId, data) => api.post(`/exams/${examId}/random-questions`, data),
  reorderQuestions: (examId, items) => api.put(`/exams/${examId}/questions/reorder`, items),
}

// ── ATTEMPTS ─────────────────────────────────────────────
export const attemptApi = {
  start:         (examId)             => api.post(`/exams/${examId}/start`),
  submit:        (attemptId, answers) => api.post(`/attempts/${attemptId}/submit`, { answers }),
  getResult:     (attemptId)          => api.get(`/attempts/${attemptId}/result`),
  getMyAttempts: ()                   => api.get('/attempts/my'),
  aiExplain:     (attemptId)          => api.get(`/attempts/${attemptId}/ai-explain`),
  aiSuggest:     (attemptId)          => api.get(`/attempts/${attemptId}/ai-suggest`),
  aiWeakness:    ()                   => api.get('/attempts/ai-weakness'),
}

// ── LECTURES ──────────────────────────────────────────────
export const lectureApi = {
  getByCourse: (courseId)             => api.get(`/courses/${courseId}/lectures`),
  create:      (courseId, data)       => api.post(`/courses/${courseId}/lectures`, data),
  update:      (courseId, id, data)   => api.put(`/courses/${courseId}/lectures/${id}`, data),
  delete:      (courseId, id)         => api.delete(`/courses/${courseId}/lectures/${id}`),
}

// ── TAGS ──────────────────────────────────────────────────
export const tagApi = {
  getAll:            ()                    => api.get('/tags'),
  create:            (data)                => api.post('/tags', data),
  update:            (id, data)            => api.put(`/tags/${id}`, data),
  delete:            (id)                  => api.delete(`/tags/${id}`),
  setOnQuestion:     (questionId, tagIds)  => api.put(`/tags/questions/${questionId}`, tagIds),
}

// ── ADMIN LOGS ────────────────────────────────────────────
export const adminApi = {
  getLogs: (params) => api.get('/admin/logs', { params }),
}

// ── NOTIFICATIONS ─────────────────────────────────────────
export const notifApi = {
  getAll:       (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  getUnread:    ()                    => api.get('/notifications/unread-count'),
  markRead:     (id)                  => api.patch(`/notifications/${id}/read`),
  markAllRead:  ()                    => api.patch('/notifications/read-all'),
  deleteOne:    (id)                  => api.delete(`/notifications/${id}`),
  deleteAll:    ()                    => api.delete('/notifications'),
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────
export const announcementApi = {
  getAll:  (courseId)           => api.get(`/courses/${courseId}/announcements`),
  create:  (courseId, data)     => api.post(`/courses/${courseId}/announcements`, data),
  update:  (courseId, id, data) => api.put(`/courses/${courseId}/announcements/${id}`, data),
  delete:  (courseId, id)       => api.delete(`/courses/${courseId}/announcements/${id}`),
}

// ── EXAM STATS & LEADERBOARD ──────────────────────────────
export const statsApi = {
  getExamStats:       (examId)   => api.get(`/exam-stats/${examId}`),
  getExamLeaderboard: (examId)   => api.get(`/exam-stats/${examId}/leaderboard`),
  getCourseLeaderboard: (courseId) => api.get(`/courses/${courseId}/leaderboard`),
}

// ── DISCUSSION FORUM ──────────────────────────────────────
export const discussionApi = {
  // Posts
  createPost:         (courseId, data)           => api.post(`/api/courses/${courseId}/discussions`, data),
  getPosts:           (courseId, page = 0, size = 20) => api.get(`/api/courses/${courseId}/discussions`, { params: { page, size } }),
  getPostDetail:      (postId)                   => api.get(`/api/discussions/${postId}`),
  updatePost:         (postId, data)             => api.put(`/api/discussions/${postId}`, data),
  deletePost:         (postId)                   => api.delete(`/api/discussions/${postId}`),
  
  // Replies
  createReply:        (postId, data)             => api.post(`/api/discussions/${postId}/replies`, data),
  getReplies:         (postId)                   => api.get(`/api/discussions/${postId}/replies`),
  updateReply:        (replyId, data)            => api.put(`/api/discussions/replies/${replyId}`, data),
  deleteReply:        (replyId)                  => api.delete(`/api/discussions/replies/${replyId}`),
  
  // Votes
  votePost:           (postId, voteType)         => api.post(`/api/discussions/${postId}/vote`, null, { params: { voteType } }),
  removeVoteFromPost: (postId)                   => api.delete(`/api/discussions/${postId}/vote`),
  voteReply:          (replyId, voteType)        => api.post(`/api/discussions/replies/${replyId}/vote`, null, { params: { voteType } }),
  removeVoteFromReply:(replyId)                  => api.delete(`/api/discussions/replies/${replyId}/vote`),
  
  // Best Answer
  markBestAnswer:     (postId, replyId)          => api.post(`/api/discussions/${postId}/best-answer/${replyId}`),
  
  // Search
  searchPosts:        (courseId, filters, page = 0, size = 20) => {
    const params = { page, size, ...filters }
    return api.get(`/api/courses/${courseId}/discussions/search`, { params })
  },
  
  // Statistics (teachers only)
  getForumStats:      (courseId)                 => api.get(`/api/courses/${courseId}/discussions/stats`),
}
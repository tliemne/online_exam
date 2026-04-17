import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage'
import { ProtectedRoute, GuestRoute } from './routes/Guards'
import AppLayout from './components/layout/AppLayout'

import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CoursesPage from './pages/teacher/CoursesPage'
import CourseDetailPage from './pages/teacher/CourseDetailPage'

import ProfilePage from './pages/profile/ProfilePage'


import StudentDashboard from './pages/student/StudentDashboard'
import StudentCoursesPage from './pages/student/StudentCoursesPage'


import QuestionsPage from './pages/teacher/QuestionsPage'
import ExamsPage from './pages/teacher/ExamsPage'
import StudentExamsPage from './pages/student/StudentExamsPage'
import StudentResultsPage from './pages/student/StudentResultsPage'
import TeacherGradingPage from './pages/teacher/TeacherGradingPage'
import ExamStatsPage from './pages/teacher/ExamStatsPage'
import ExamLeaderboardPage from './pages/student/ExamLeaderboardPage'
import StudentSchedulePage from './pages/student/StudentSchedulePage'
import StudentRankingsPage from './pages/student/StudentRankingsPage'
import TeacherStatsPage from './pages/teacher/TeacherStatsPage'
import TagsPage from './pages/teacher/TagsPage'
import QuestionStatPage from './pages/teacher/QuestionStatPage'
import CourseLeaderboardPage from './pages/shared/CourseLeaderboardPage'
import DiscussionForumPage from './pages/shared/DiscussionForumPage'

import {
  UnauthorizedPage,
} from './pages/Placeholders'

function LoadingFallback() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>
}

function WithLayout({ children }) {
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><AdminDashboard /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><AdminUsers /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/courses" element={
            <ProtectedRoute roles={['ADMIN']}>
              <WithLayout><CoursesPage /></WithLayout>  
            </ProtectedRoute>
          } />
          <Route path="/admin/courses/:id" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><CourseDetailPage /></WithLayout></ProtectedRoute>} />

          {/* Teacher */}
          <Route path="/teacher" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><TeacherDashboard /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/courses" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><CoursesPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/courses/:id" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><CourseDetailPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/questions" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><QuestionsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/tags" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><TagsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/tags" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><TagsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/question-stats" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><QuestionStatPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/question-stats" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><QuestionStatPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/grading" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><TeacherGradingPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/exams" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><ExamsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/exams/:examId/stats" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><ExamStatsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/exams/:examId/stats" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><ExamStatsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/teacher/courses/:courseId/leaderboard" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><CourseLeaderboardPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/leaderboard" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><CourseLeaderboardPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/courses/:courseId/leaderboard" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><CourseLeaderboardPage /></WithLayout></ProtectedRoute>} />
          
          {/* Discussion Forum */}
          <Route path="/teacher/courses/:courseId/discussions" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><DiscussionForumPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/courses/:courseId/discussions" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><DiscussionForumPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/courses/:courseId/discussions" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><DiscussionForumPage /></WithLayout></ProtectedRoute>} />

          {/* Student */}
          <Route path="/teacher/stats" element={<ProtectedRoute roles={['TEACHER','ADMIN']}><WithLayout><TeacherStatsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><TeacherStatsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><AdminActivityLogPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/questions" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><QuestionsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/exams" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><ExamsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/admin/grading" element={<ProtectedRoute roles={['ADMIN']}><WithLayout><TeacherGradingPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentDashboard /></WithLayout></ProtectedRoute>} />
          <Route path="/student/exams" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentExamsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentResultsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/schedule" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentSchedulePage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/rankings" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentRankingsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/exams/:examId/leaderboard" element={<ProtectedRoute roles={['STUDENT','TEACHER','ADMIN']}><WithLayout><ExamLeaderboardPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/courses" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><StudentCoursesPage /></WithLayout></ProtectedRoute>} />
          <Route path="/student/courses/:id" element={<ProtectedRoute roles={['STUDENT']}><WithLayout><CourseDetailPage /></WithLayout></ProtectedRoute>} />

          {/* profile */}  
          <Route path="/profile" element={<ProtectedRoute roles={['ADMIN','TEACHER','STUDENT']}><WithLayout><ProfilePage /></WithLayout></ProtectedRoute>} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

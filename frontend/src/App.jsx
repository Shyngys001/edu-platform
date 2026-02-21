import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getAuth } from './utils/api';
import { LangProvider } from './utils/i18n';

import Layout from './components/Layout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student
import StudentDashboard from './pages/student/Dashboard';
import Lessons from './pages/student/Lessons';
import LessonView from './pages/student/LessonView';
import Tests from './pages/student/Tests';
import TestTake from './pages/student/TestTake';
import CodeTasks from './pages/student/CodeTasks';
import CodeEditorPage from './pages/student/CodeEditor';
import Leaderboard from './pages/student/Leaderboard';
import Chat from './pages/student/Chat';
import Statistics from './pages/student/Statistics';
import Inbox from './pages/student/Inbox';
import StudentMessenger from './pages/student/Messenger';
import Grades from './pages/student/Grades';

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard';
import Students from './pages/teacher/Students';
import LessonsCMS from './pages/teacher/LessonsCMS';
import TestsCMS from './pages/teacher/TestsCMS';
import CodeTasksCMS from './pages/teacher/CodeTasksCMS';
import Analytics from './pages/teacher/Analytics';
import FeedbackPage from './pages/teacher/Feedback';
import Export from './pages/teacher/Export';
import TeacherMessenger from './pages/teacher/Messenger';
import Topics from './pages/teacher/Topics';

function RootRedirect() {
  const { token, role } = getAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}`} replace />;
}

export default function App() {
  return (
    <LangProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: 8, padding: '12px 16px', fontSize: '0.9rem' },
        }}
      />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes */}
        <Route element={<Layout requiredRole="student" />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/lessons" element={<Lessons />} />
          <Route path="/student/lessons/:id" element={<LessonView />} />
          <Route path="/student/tests" element={<Tests />} />
          <Route path="/student/tests/:id" element={<TestTake />} />
          <Route path="/student/tasks" element={<CodeTasks />} />
          <Route path="/student/tasks/:id" element={<CodeEditorPage />} />
          <Route path="/student/leaderboard" element={<Leaderboard />} />
          <Route path="/student/chat" element={<Chat />} />
          <Route path="/student/stats" element={<Statistics />} />
          <Route path="/student/inbox" element={<Inbox />} />
          <Route path="/student/messenger" element={<StudentMessenger />} />
          <Route path="/student/grades" element={<Grades />} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<Layout requiredRole="teacher" />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<Students />} />
          <Route path="/teacher/lessons" element={<LessonsCMS />} />
          <Route path="/teacher/tests" element={<TestsCMS />} />
          <Route path="/teacher/tasks" element={<CodeTasksCMS />} />
          <Route path="/teacher/analytics" element={<Analytics />} />
          <Route path="/teacher/feedback" element={<FeedbackPage />} />
          <Route path="/teacher/export" element={<Export />} />
          <Route path="/teacher/messenger" element={<TeacherMessenger />} />
          <Route path="/teacher/topics" element={<Topics />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LangProvider>
  );
}

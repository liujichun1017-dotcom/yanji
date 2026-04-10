import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage               from './pages/LoginPage'
import RegisterPage            from './pages/RegisterPage'
import DashboardPage           from './pages/DashboardPage'
import TreatmentsPage          from './pages/TreatmentsPage'
import TreatmentDetailPage     from './pages/TreatmentDetailPage'
import BudgetPage              from './pages/BudgetPage'
import KnowledgePage           from './pages/KnowledgePage'
import KnowledgeDetailPage     from './pages/KnowledgeDetailPage'
import KnowledgeWarningsPage   from './pages/KnowledgeWarningsPage'
import PhotosPage              from './pages/PhotosPage'

function P({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/"                     element={<Navigate to="/login" replace />} />
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/register"             element={<RegisterPage />} />

          <Route path="/dashboard"            element={<P><DashboardPage /></P>} />
          <Route path="/treatments"           element={<P><TreatmentsPage /></P>} />
          <Route path="/treatments/:id"       element={<P><TreatmentDetailPage /></P>} />
          <Route path="/budget"               element={<P><BudgetPage /></P>} />

          {/* Static route BEFORE dynamic :id */}
          <Route path="/knowledge/warnings"   element={<P><KnowledgeWarningsPage /></P>} />
          <Route path="/knowledge/:id"        element={<P><KnowledgeDetailPage /></P>} />
          <Route path="/knowledge"            element={<P><KnowledgePage /></P>} />

          <Route path="/photos"               element={<P><PhotosPage /></P>} />

          <Route path="*"                     element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

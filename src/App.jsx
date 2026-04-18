import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
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
import AdminDashboardPage      from './pages/admin/AdminDashboardPage'
import AdminKnowledgePage      from './pages/admin/AdminKnowledgePage'
import AdminKnowledgeEditPage  from './pages/admin/AdminKnowledgeEditPage'
import AdminCategoriesPage     from './pages/admin/AdminCategoriesPage'
import AdminWarningsPage       from './pages/admin/AdminWarningsPage'
import AdminUsersPage          from './pages/admin/AdminUsersPage'

function P({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
}

function A({ children }) {
  return <AdminRoute><AdminLayout>{children}</AdminLayout></AdminRoute>
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

          <Route path="/knowledge/warnings"   element={<P><KnowledgeWarningsPage /></P>} />
          <Route path="/knowledge/:id"        element={<P><KnowledgeDetailPage /></P>} />
          <Route path="/knowledge"            element={<P><KnowledgePage /></P>} />

          <Route path="/photos"               element={<P><PhotosPage /></P>} />

          {/* Admin routes */}
          <Route path="/admin"                element={<A><AdminDashboardPage /></A>} />
          <Route path="/admin/knowledge"      element={<A><AdminKnowledgePage /></A>} />
          <Route path="/admin/knowledge/:id"  element={<A><AdminKnowledgeEditPage /></A>} />
          <Route path="/admin/categories"     element={<A><AdminCategoriesPage /></A>} />
          <Route path="/admin/warnings"       element={<A><AdminWarningsPage /></A>} />
          <Route path="/admin/users"          element={<A><AdminUsersPage /></A>} />

          <Route path="*"                     element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

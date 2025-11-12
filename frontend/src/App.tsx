import { Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { Toaster } from './components/ui/toaster'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NewExpensePage from './pages/NewExpensePage'
import ExpenseDetailPage from './pages/ExpenseDetailPage'
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ErrorBoundary>
      <Toaster />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/new"
          element={
            <ProtectedRoute>
              <AppShell>
                <NewExpensePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <ExpenseDetailPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AppShell>
                <AdminPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracio"
          element={
            <ProtectedRoute requireAdmin>
              <AppShell>
                <SettingsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedRoute } from './components/protected/ProtectedRoute';

// Public pages
import Welcome from './pages/public/Welcome';
import { About } from './pages/public/About';
import { Features } from './pages/public/Features';

// Auth pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageZones } from './pages/admin/ManageZones';
import { ManageCameras } from './pages/admin/ManageCameras';
import { ManageSupervisors } from './pages/admin/ManageSupervisors';
import { ViolationHistory } from './pages/admin/ViolationHistory';
import { AdminGallery } from './pages/admin/AdminGallery';
import { ZoneDetectionResults } from './pages/admin/ZoneDetectionResults';
import { DailyViolationHistory } from './pages/admin/DailyViolationHistory';

// Supervisor pages
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { ZoneMonitor } from './pages/supervisor/ZoneMonitor';
import { DetectionHistory } from './pages/supervisor/DetectionHistory';
import { DetectionGallery } from './pages/supervisor/DetectionGallery';

// Shared pages
import { Home } from './pages/Home';
import { Profile } from './pages/shared/Profile';

import { useLocation } from 'react-router-dom';

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Routes where layout should be hidden
  const publicPaths = ['/', '/about', '/features', '/login', '/signup', '/forgot-password', '/reset-password'];

  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Show Navbar only if NOT public */}
      {!isPublicPage && <Navbar />}

      {isAuthenticated && !isPublicPage ? (
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      ) : (
        <main>{children}</main>
      )}

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes - Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/zones" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageZones />
              </ProtectedRoute>
            } />
            <Route path="/admin/cameras" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCameras />
              </ProtectedRoute>
            } />
            <Route path="/admin/supervisors" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageSupervisors />
              </ProtectedRoute>
            } />
            <Route path="/admin/violations" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ViolationHistory />
              </ProtectedRoute>
            } />
            <Route path="/admin/gallery" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminGallery />
              </ProtectedRoute>
            } />
            <Route path="/admin/zone-detections" element={
              <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                <ZoneDetectionResults />
              </ProtectedRoute>
            } />
            <Route path="/admin/daily-violations" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DailyViolationHistory />
              </ProtectedRoute>
            } />

            {/* Protected routes - Supervisor */}
            <Route path="/supervisor/dashboard" element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/supervisor/zones" element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <ZoneMonitor />
              </ProtectedRoute>
            } />
            <Route path="/supervisor/history" element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <DetectionHistory />
              </ProtectedRoute>
            } />
            <Route path="/supervisor/gallery" element={
              <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                <DetectionGallery />
              </ProtectedRoute>
            } />

            {/* Shared protected routes */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
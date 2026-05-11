// ============================================
// Fichier : App.tsx
// Description : Routeur principal React Router v6
// Protected routes avec RBAC strict
// ============================================

import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import type { Role } from './types';
import GlobalLoadingOverlay from './components/common/GlobalLoadingOverlay';

// Layouts
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';

// Pages publiques
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterOtpPage from './pages/RegisterOtpPage';
import CandidaturePage from './pages/CandidaturePage';

// Dashboards par rôle
import DashboardRH from './pages/DashboardRH';
import DashboardManager from './pages/DashboardManager';
import DashboardEmploye from './pages/DashboardEmploye';
import DashboardFormateur from './pages/DashboardFormateur';
import { INTERNAL_STAFF_ROLES } from './utils/roleGroups';

// Module Stages
import StagiairesList from './pages/stages/StagiairesList';
import StagiaireDetail from './pages/stages/StagiaireDetail';

// Module Formations
import FormationsList from './pages/formations/FormationsList';
import FormationDetail from './pages/formations/FormationDetail';
import FormationCreate from './pages/formations/FormationCreate';
import InscriptionsValidation from './pages/formations/InscriptionsValidation';

// Module Formateurs
import FormateursList from './pages/formateurs/FormateursList';
import FormateurProfil from './pages/formateurs/FormateurProfil';

// Reporting
import ReportingPage from './pages/ReportingPage';
import CalendarPage from './pages/CalendarPage';
import MessageriePage from './pages/MessageriePage';
import ComptesEmployesGestionPage from './pages/ComptesEmployesGestionPage';

// ============================================
// Composant de protection des routes
// ============================================
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
};

// ============================================
// Redirection vers le bon dashboard selon le rôle
// ============================================
const DashboardRedirect = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  if (role === 'Direction_RH') return <DashboardRH />;
  if (role === 'Manager') return <DashboardManager />;
  if (role === 'Formateur_Externe') return <DashboardFormateur />;
  return <DashboardEmploye />;
};

// ============================================
// Application principale
// ============================================
export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderExiting, setLoaderExiting] = useState(false);

  const routeKey = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.pathname, location.search, location.hash]
  );

  useEffect(() => {
    setLoaderVisible(true);
    setLoaderExiting(false);

    // Durée variable: min 2s, max 3s.
    const visibleDuration = 2000 + Math.floor(Math.random() * 1001);
    const startExitTimer = window.setTimeout(() => setLoaderExiting(true), visibleDuration);
    const hideTimer = window.setTimeout(() => setLoaderVisible(false), visibleDuration + 350);

    return () => {
      window.clearTimeout(startExitTimer);
      window.clearTimeout(hideTimer);
    };
  }, [routeKey]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ---- Routes publiques ---- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register/otp"
            element={
              <PublicOnlyRoute>
                <RegisterOtpPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/candidature" element={<CandidaturePage />} />
        </Route>

        {/* ---- Routes protégées ---- */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard selon rôle */}
          <Route path="dashboard" element={<DashboardRedirect />} />

          {/* Module Stages */}
          <Route
            path="stagiaires"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <StagiairesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="stagiaires/:id"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <StagiaireDetail />
              </ProtectedRoute>
            }
          />

          {/* Module Formations */}
          <Route
            path="formations"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <FormationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="formations/:id"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <FormationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="formations/creer"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH']}>
                <FormationCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="formations/:id/modifier"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH']}>
                <FormationCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="formations/validations"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH', 'Manager']}>
                <InscriptionsValidation />
              </ProtectedRoute>
            }
          />

          {/* Module Formateurs */}
          <Route
            path="formateurs"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH', 'Manager', 'Employe', 'Formateur_Interne']}>
                <FormateursList />
              </ProtectedRoute>
            }
          />
          <Route
            path="formateurs/profil"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe']}>
                <FormateurProfil />
              </ProtectedRoute>
            }
          />

          {/* Reporting */}
          <Route
            path="reporting"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH', 'Manager']}>
                <ReportingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="messages"
            element={
              <ProtectedRoute allowedRoles={[...INTERNAL_STAFF_ROLES]}>
                <MessageriePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="rh/creer-compte"
            element={
              <ProtectedRoute allowedRoles={['Direction_RH']}>
                <ComptesEmployesGestionPage mode="rh" />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/comptes"
            element={
              <ProtectedRoute allowedRoles={['Manager']}>
                <ComptesEmployesGestionPage mode="manager" />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalLoadingOverlay visible={loaderVisible} exiting={loaderExiting} />
    </>
  );
}

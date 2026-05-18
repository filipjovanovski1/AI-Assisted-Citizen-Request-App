import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import { initToast } from './utils/toast';
import { MainLayout } from './components/MainLayout';
import { WelcomePage } from './pages/Welcome';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { BrowseRequestsPage } from './pages/BrowseRequests';
import { MyReportsPage } from './pages/MyReports';
import { ReportIssuePage } from './pages/ReportIssue';
import { RequestDetailsPage } from './pages/RequestDetails';
import { StatisticsPage } from './pages/Statistics';
import { StaffDashboardPage } from './pages/StaffDashboard';
import { StaffImportExportPage } from './pages/StaffImportExport';
import { AdminPanelPage } from './pages/AdminPanel';
import { useAuth, AuthProvider } from './context/AuthContext';
import { themeConfig, antTheme } from './config/theme';
import { ROUTES } from './config/routes';

// Simple protective route logic
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <>{children}</>;
};

const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'MUNICIPAL_EMPLOYEE') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <>{children}</>;
};

const StaffOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MUNICIPAL_EMPLOYEE')) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <>{children}</>;
};

const DashboardHomeRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (user.role === 'MUNICIPAL_EMPLOYEE') {
    return <StaffDashboardPage />;
  }

  if (user.role === 'ADMIN') {
    return <DashboardPage />;
  }

  return <Navigate to={ROUTES.BROWSE} replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardHomeRoute />} />
        <Route path={ROUTES.BROWSE} element={<BrowseRequestsPage />} />
        <Route path={ROUTES.REPORT} element={<ReportIssuePage />} />
        <Route path={ROUTES.MY_REPORTS} element={<MyReportsPage />} />
        <Route path={ROUTES.REQUEST_PATTERN} element={<RequestDetailsPage />} />
        <Route
          path={ROUTES.STAFF}
          element={
            <StaffRoute>
              <StaffDashboardPage />
            </StaffRoute>
          }
        />
        <Route
          path={ROUTES.STAFF_IMPORT_EXPORT}
          element={
            <StaffRoute>
              <StaffImportExportPage />
            </StaffRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />
        <Route
          path={ROUTES.ANALYTICS}
          element={
            <StaffOrAdminRoute>
              <StatisticsPage />
            </StaffOrAdminRoute>
          }
        />
        <Route path="/statistics" element={<Navigate to={ROUTES.ANALYTICS} replace />} />
      </Route>
    </Routes>
  );
};

const ToastInitializer: React.FC = () => {
  const { message } = AntApp.useApp();
  useEffect(() => {
    initToast(message);
  }, [message]);
  return null;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        ...themeConfig,
      }}
    >
      <AuthProvider>
        <Router>
          <AntApp>
            <ToastInitializer />
            <AppRoutes />
          </AntApp>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;

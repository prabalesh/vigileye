import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProjectOverview } from './pages/ProjectOverview';
import { ErrorGroups } from './pages/ErrorGroups';
import { ErrorGroupDetail } from './pages/ErrorGroupDetail';
import { EnvironmentsTable } from './pages/EnvironmentsTable';
import { ProjectTeam } from './pages/ProjectTeam';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  const { fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing Vigil Eye...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0f172a',
          color: '#fff',
          border: '1px solid #1e293b'
        }
      }} />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/:id" element={<ProjectOverview />} />
            <Route path="/projects/:id/environments" element={<EnvironmentsTable />} />
            <Route path="/projects/:id/team" element={<ProjectTeam />} />
            <Route path="/projects/:id/error-groups" element={<ErrorGroups />} />
            <Route path="/projects/:id/error-groups/:groupId" element={<ErrorGroupDetail />} />
          </Route>

          {/* Catch everything else */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

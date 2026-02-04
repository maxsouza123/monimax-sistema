
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import Events from './pages/Events';
import Network from './pages/Network';
import Settings from './pages/Settings';
import Devices from './pages/Devices';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Clients from './pages/Clients';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Storage from './pages/Storage';
import SuspiciousPlates from './pages/SuspiciousPlates';
import ServiceOrders from './pages/ServiceOrders';
import { DataSynchronizer } from './DataSynchronizer';

import { supabase } from './supabaseClient';

// Componente para proteger rotas privadas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) return null; // Loading state

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  // Se a URL contiver 'solo=true', renderizamos sem o Layout principal (sidebar/header)
  const isSolo = new URLSearchParams(location.search).get('solo') === 'true';
  const isLoginPage = location.pathname === '/login';

  const content = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
      <Route path="/monitor/:clientId" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><Storage /></ProtectedRoute>} />
      <Route path="/plates" element={<ProtectedRoute><SuspiciousPlates /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/service-orders" element={<ProtectedRoute><ServiceOrders /></ProtectedRoute>} />

      <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );

  if (isLoginPage) {
    return content;
  }

  return (
    <DataSynchronizer>
      {isSolo ? (
        <div className="h-screen w-screen bg-background-dark overflow-hidden">{content}</div>
      ) : (
        <Layout>{content}</Layout>
      )}
    </DataSynchronizer>
  );
};

export default App;

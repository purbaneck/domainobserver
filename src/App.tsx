import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';

function App() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Update document title
    document.title = 'Domain Observer - Track Domain Availability';
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-blue-500 animate-spin mb-4" />
          <p className="text-blue-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<Layout />}>
        <Route index element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

import Login    from './pages/Login';
import Register from './pages/Register';
import Home     from './pages/Home';
import Upload   from './pages/Upload';
import Report   from './pages/Report';
import MyReports from './pages/MyReports';

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' } }} />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"         element={<Guard><Home /></Guard>} />
          <Route path="/upload"   element={<Guard><Upload /></Guard>} />
          <Route path="/reports"  element={<Guard><MyReports /></Guard>} />
          <Route path="/report/:id" element={<Guard><Report /></Guard>} />
          <Route path="*"         element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

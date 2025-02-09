import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Signup from './pages/Signup';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes (only accessible when not logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected Routes (only accessible when logged in) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/notes" element={<Notes />} />
              {/* Add other protected routes here */}
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/notes" replace />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
}

export default App;
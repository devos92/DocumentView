import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './api/ProtectedRoute';
import { ModalProvider } from './context/ModalContext';
import Dashboard from './pages/dashboard/Dashboard';
import DataVisualisation from './pages/dataVisualisation/DataVisualisation';
import Profile from './pages/profile/Profile';
import Home from './pages/home/Home';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import PageNotFound from './pages/404/404';


const App = () => {
  return (
    <ModalProvider>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
          <Route path="/dataVisualisation" element={<ProtectedRoute element={DataVisualisation} />} />
          <Route path="/profile" element={<ProtectedRoute element={Profile} />} />

          {/* Catches all routes that arent defined and returns 404 page */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </ModalProvider>
  );
};

export default App;
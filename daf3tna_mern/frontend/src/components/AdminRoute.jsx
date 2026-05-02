import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AdminRoute = ({ children, level = 'moderator' }) => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/" />;

  const roles = ['user', 'moderator', 'admin', 'superadmin'];
  const userLevel = roles.indexOf(user.role);
  const requiredLevel = roles.indexOf(level);

  if (userLevel < requiredLevel) {
    return <Navigate to="/home" />;
  }

  return children;
};

export default AdminRoute;

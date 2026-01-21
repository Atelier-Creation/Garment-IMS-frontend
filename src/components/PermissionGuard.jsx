import React from 'react';
import { usePermissions } from '../context/PermissionContext';

const PermissionGuard = ({ 
  permissions = [], 
  requireAll = false, 
  fallback = null, 
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Show loading state if permissions are still loading
  if (loading) {
    return fallback;
  }

  // If no permissions specified, show content
  if (!permissions || permissions.length === 0) {
    return children;
  }

  // Single permission check
  if (permissions.length === 1) {
    return hasPermission(permissions[0]) ? children : fallback;
  }

  // Multiple permissions check
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? children : fallback;
};

export default PermissionGuard;
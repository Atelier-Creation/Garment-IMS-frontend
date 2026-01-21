import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';
import { Result, Button } from 'antd';

const PermissionRoute = ({ 
  permissions = [], 
  requireAll = false, 
  redirectTo = "/dashboard",
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Show loading state if permissions are still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no permissions specified, allow access
  if (!permissions || permissions.length === 0) {
    return children;
  }

  // Check permissions
  let hasAccess = false;
  
  if (permissions.length === 1) {
    hasAccess = hasPermission(permissions[0]);
  } else {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // If no access, show access denied page
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access this page."
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return children;
};

export default PermissionRoute;
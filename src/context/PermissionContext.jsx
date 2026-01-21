import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserPermissions();
  }, []);

  // Also reload permissions when token changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        loadUserPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUserPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setPermissions([]);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authService.getCurrentUser();
      
      if (response.success && response.data && response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        
        // Extract permissions from user roles
        const userPermissions = [];
        if (userData.Roles) {
          userData.Roles.forEach(role => {
            if (role.Permissions) {
              role.Permissions.forEach(permission => {
                if (!userPermissions.includes(permission.code)) {
                  userPermissions.push(permission.code);
                }
              });
            }
          });
        }
        
        setPermissions(userPermissions);
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      setPermissions([]);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permissionCode) => {
    return permissions.includes(permissionCode);
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (permissionCodes) => {
    return permissionCodes.some(code => permissions.includes(code));
  };

  // Check if user has all of the provided permissions
  const hasAllPermissions = (permissionCodes) => {
    return permissionCodes.every(code => permissions.includes(code));
  };

  // Refresh permissions (call after login/logout)
  const refreshPermissions = async () => {
    setLoading(true);
    await loadUserPermissions();
  };

  const value = {
    permissions,
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import HeaderBar from "./Header";
import { Outlet } from "react-router-dom";
import { usePermissions } from "../../context/PermissionContext";

export default function MainLayout({ children, menuItems }) {
  const [collapsed, setCollapsed] = useState(false);
  const { permissions, loading } = usePermissions();

  // match the widths used in Header.jsx leftPosition calculation
  const sidebarWidth = collapsed ? 60 : 260;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar column - fixed on the left */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarWidth,
          zIndex: 90,
          transition: "width .2s ease",
          overflow: "hidden",
          borderRight: ".5px solid #e6e6e6",
        }}
      >
        <Sidebar 
          key={`sidebar-${permissions.length}-${loading}`} 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          menuItems={menuItems} 
        />
      </div>

      {/* Header receives collapsed + setter so it can also toggle */}
      <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content area - offset by sidebar width and header height */}
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: 60,
          padding: 20,
          transition: "margin-left .2s ease",
        }}
      >
        {/* If you're using react-router Outlet */}
        {children || <Outlet />}
      </main>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Popover, Dropdown, List, Avatar, message } from "antd";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut, Menu, Search, Command } from "lucide-react";
import { motion } from "framer-motion";
import { SearchInput } from "../";

const HeaderBar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // state for recent notifications
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mock notifications for now - replace with actual API call
  useEffect(() => {
    setRecentNotifications([
      { id: 1, title: "Low Stock Alert", message: "Product ABC is running low", type: "warning" },
      { id: 2, title: "New Order", message: "Order #12345 received", type: "info" },
      { id: 3, title: "Production Complete", message: "Batch #789 completed", type: "success" },
    ]);
  }, []);

  const notificationContent = (
    <div style={{ minWidth: 220 }}>
      <div style={{ padding: 10, fontWeight: 600 }}>Recent Notifications</div>

      <List
        size="small"
        loading={loadingNotifications}
        dataSource={recentNotifications}
        locale={{ emptyText: loadingNotifications ? "Loading..." : "No notifications" }}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            style={{ display: "flex", justifyContent: "space-between", padding: 10 }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Avatar style={{ backgroundColor: "#eef2ff", color: "#3730a3" }}>
                {item.title.charAt(0)}
              </Avatar>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {item.message}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />

      <div style={{ textAlign: "center", padding: 8, borderTop: "1px solid #f3f4f6" }}>
        <a onClick={() => message.info("View all notifications")}>
          View all
        </a>
      </div>
    </div>
  );

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      localStorage.clear();
      message.success("Logged out");
      navigate("/");
    } else if (key === "profile") {
      navigate("/profile");
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <User style={{ width: 16, height: 16 }} />,
      label: 'Profile',
      onClick: () => handleMenuClick({ key: "profile" })
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut style={{ width: 16, height: 16 }} />,
      label: 'Logout',
      onClick: () => handleMenuClick({ key: "logout" }),
      danger: true
    }
  ];

  const userMenu = {
    items: userMenuItems
  };

  const headerStyle = { backgroundColor: "#fff" };
  const textColor = "#011D4A";

  // adjust left position so header stays aligned with collapsed sidebar
  const leftPosition = collapsed ? 60 : 260;

  return (
    <header
      style={{
        ...headerStyle,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        position: "fixed",
        top: 0,
        left: leftPosition,
        right: 0,
        zIndex: 100,
        borderBottom: ".5px solid #66708550",
      }}
    >
      {/* LEFT SIDE: toggle + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Toggle button (hamburger) */}
        <button
          onClick={() => typeof setCollapsed === "function" && setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={18} style={{ color: textColor }} />
        </button>

        <div className="relative w-56 sm:w-64 hidden sm:block">
          <SearchInput
            placeholder="Search"
            size="large"
            className="header-search"
            style={{ 
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 shadow-sm p-1 rounded-sm border border-gray-100 bg-white hover:bg-gray-50 cursor-pointer">
            <Command size={14} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Popover content={notificationContent} trigger="click" placement="bottomRight">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} aria-label="Notifications" style={{ position: "relative", padding: 8, borderRadius: 10, background: "#f3f4f6", border: "none", cursor: "pointer" }}>
            <Bell style={{ width: 20, height: 20, color: textColor }} />
            <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9999, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
              {recentNotifications.length}
            </span>
          </motion.button>
        </Popover>

        <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/049/174/246/small/a-smiling-young-indian-man-with-formal-shirts-outdoors-photo.jpg"
            alt="user"
            className="h-9 w-9 rounded-full border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-indigo-100"
          />
        </Dropdown>
      </div>
    </header>
  );
};

export default HeaderBar;
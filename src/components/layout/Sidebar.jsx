import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../lib/utils";
import { usePermissions } from "../../context/PermissionContext";
import logo from "../assets/inlogo.png";
import smalllogo from "../assets/smalllogo.png";
import {
  Users,
  Settings,
  LayoutDashboard,
  Building,
  ShoppingCart,
  HousePlus,
  Receipt,
  Truck,
  ClipboardCheck,
  Box,
  Package,
  FileText,
  Factory,
  Layers,
  UserCheck,
  Plane,
  Package2,
  Shield,
  BarChart3,
  Cog,
} from "lucide-react";

export default function Sidebar({
  isOpen,
  onClose,
  collapsed = false,
  setCollapsed,
  selectedParent: selectedParentProp = null,
  setSelectedParent,
  menuItems = [],
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasPermission, hasAnyPermission, permissions, user, loading } = usePermissions();

  const [openParent, setOpenParent] = useState(selectedParentProp);
  useEffect(() => setOpenParent(selectedParentProp), [selectedParentProp]);

  // popover state: which parent is showing and its bounding rect for positioning
  const [popover, setPopover] = useState(null); // { parent: string, rect: DOMRect }
  const popoverRef = useRef(null);

  // Check if user is admin (has admin role or many permissions)
  const isAdmin = React.useMemo(() => {
    if (!user || !user.Roles) return false;

    // Check if user has admin role
    const hasAdminRole = user.Roles.some(role => role.name === 'admin');

    // Or if user has many permissions (fallback)
    const hasManyPermissions = permissions.length > 20;

    return hasAdminRole || hasManyPermissions;
  }, [user, permissions]);

  const menu = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permissions: [] // Dashboard accessible to all authenticated users
    },
    {
      to: "/product",
      label: "Products",
      icon: Package,
      permissions: ["product.read", "category.read"],
      children: [
        { to: "/product/list", label: "Product List", permissions: ["product.read"] },
        { to: "/product/variants", label: "Product Variants", permissions: ["product.read"] },
        { to: "/category/list", label: "Category List", permissions: ["category.read"] },
        { to: "/bom", label: "Bill of Materials", permissions: ["product.read"] },
      ],
    },
    {
      to: "/raw-materials",
      label: "Raw Materials",
      icon: Layers,
      permissions: ["product.read"]
    },
    {
      to: "/stock/list",
      label: "Stock Management",
      icon: Box,
      permissions: ["stock.read"]
    },
    {
      to: "/orders",
      label: "Orders",
      icon: ShoppingCart,
      permissions: ["purchase.read", "sales.read", "production.read"],
      children: [
        { to: "/order", label: "Purchase Orders", permissions: ["purchase.read"] },
        { to: "/purchase-inward", label: "Purchase Inward", permissions: ["purchase.receive"] },
        { to: "/sales", label: "Sales Orders", permissions: ["sales.read"] },
        { to: "/billing", label: "Billing / POS", permissions: ["billing:read", "sales.read"] },
        { to: "/production", label: "Production Orders", permissions: ["production.read"] },
        { to: "/export-orders", label: "Export Orders", permissions: ["sales.read"] },
      ],
    },
    {
      to: "/contacts",
      label: "Contacts",
      icon: UserCheck,
      permissions: ["supplier.read", "customer.read"],
      children: [
        { to: "/vendor", label: "Suppliers", permissions: ["supplier.read"] },
        { to: "/customer", label: "Customers", permissions: ["customer.read"] },
      ],
    },
    {
      to: "/admin",
      label: "Administration",
      icon: Settings,
      permissions: ["user.read", "role.view", "permission.view"],
      children: [
        { to: "/user", label: "Users", permissions: ["user.read"] },
        { to: "/roles", label: "Roles", permissions: ["role.view"] },
        { to: "/permissions", label: "Permissions", permissions: ["permission.view"] },
      ],
    },
    {
      to: "/branch",
      label: "Branches",
      icon: HousePlus,
      permissions: ["supplier.read"] // Using supplier.read as branch permission
    },
    {
      to: "/report",
      label: "Reports",
      icon: BarChart3,
      permissions: ["reports.view"]
    },
    {
      to: "/audit-logs",
      label: "Audit Logs",
      icon: Shield,
      permissions: ["audit.view"]
    },
  ];

  // Filter menu items based on permissions
  const getFilteredMenu = () => {
    // If permissions are still loading, show all menu items to avoid flickering
    if (loading) {
      return menu;
    }

    return menu.filter(item => {
      // If no permissions specified, show to all authenticated users
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }

      // If user is admin, show all items
      if (isAdmin) {
        return true;
      }

      // Check if user has any of the required permissions
      const hasAccess = hasAnyPermission(item.permissions);

      // If parent has access, filter children based on their permissions
      if (hasAccess && item.children) {
        item.children = item.children.filter(child => {
          if (!child.permissions || child.permissions.length === 0) {
            return true;
          }
          if (isAdmin) {
            return true;
          }
          return hasAnyPermission(child.permissions);
        });
      }

      return hasAccess;
    });
  };

  const filteredMenu = getFilteredMenu();

  const isLinkActive = (to, children) => {
    if (!to) return false;
    if (children && children.length) {
      return children.some(
        (c) =>
          pathname === c.to ||
          pathname.startsWith(c.to + "/") ||
          pathname.startsWith(to + "/")
      );
    }
    return (
      pathname === to ||
      pathname.startsWith(to + "/") ||
      pathname.includes(to.replace("/list", "").replace("/add", ""))
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleParent = (to) => {
    const next = openParent === to ? null : to;
    setOpenParent(next);
    if (typeof setSelectedParent === "function") setSelectedParent(next);
  };

  const findParentForPath = (path) => {
    for (const p of filteredMenu) {
      if (p.children && p.children.length) {
        for (const c of p.children) {
          if (path === c.to || path.startsWith(c.to + "/")) {
            return p.to;
          }
        }
      }
      if (p.to && (path === p.to || path.startsWith(p.to + "/"))) {
        return p.to;
      }
    }
    return null;
  };

  useEffect(() => {
    const parentForPath = findParentForPath(pathname);
    if (parentForPath) {
      setOpenParent(parentForPath);
      if (typeof setSelectedParent === "function") setSelectedParent(parentForPath);
    }
    // close popover when route changes
    setPopover(null);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // close popover on outside click or on Escape
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!popover) return;
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      // clicked outside popover -> close it
      setPopover(null);
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setPopover(null);
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [popover]);

  // render popover box with children links when collapsed
  const renderPopover = () => {
    if (!popover) return null;
    const { parent, rect, children } = popover;
    if (!rect) return null;

    // compute position: show box to the right of sidebar icon; clamp vertically
    const top = Math.max(8, rect.top - 8);
    const left = rect.right + 8; // small gap from icon
    const maxHeight = Math.min(window.innerHeight - top - 16, 300);

    return (
      <div
        ref={popoverRef}
        className="z-50"
        style={{
          position: "fixed",
          top: top,
          left: left,
          minWidth: 200,
          maxWidth: 300,
          maxHeight: maxHeight,
          overflowY: "auto",
          background: "#fff",
          boxShadow: "0 8px 24px rgba(2,6,23,0.12)",
          borderRadius: 8,
          padding: 8,
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ padding: "6px 8px", fontWeight: 700, color: "#0f172a" }}>{parent}</div>
        <div style={{ height: 1, background: "rgba(15,23,42,0.04)", margin: "6px 0" }} />
        <div className="flex flex-col">
          {children.map((child) => {
            const childActive = pathname === child.to || pathname.startsWith(child.to + "/");
            return (
              <button
                key={child.to}
                onClick={() => {
                  navigate(child.to);
                  setPopover(null);
                  if (typeof onClose === "function") onClose();
                }}
                className={cn(
                  "text-left px-3 py-2 rounded hover:bg-gray-50 w-full",
                  childActive ? "bg-blue-50 !text-[#3D5EE1]" : "text-[#374151]"
                )}
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div
      className={cn(
        "flex flex-col h-full shadow-lg bg-white transition-all duration-200",
        collapsed ? "items-center" : "items-stretch"
      )}
    >
      {/* Header */}
      <div
        className="flex justify-between w-full gap-2 h-[60px]"
        style={{ borderBottom: ".5px solid #66708550", alignItems: "center" }}
      >
        <div className="flex items-left items-center">
          {/* Shrink logo when collapsed */}
          <img
            src={collapsed ? smalllogo : logo}
            alt="logo"
            className={cn(
              "object-contain transition-all duration-200",
              collapsed ? "w-[50px] h-[50px] ml-0" : "w-[350px] h-[210px] ml-[-20px]"
            )}
          />
        </div>

        {/* Mobile close button (Drawer provides onClose) */}
        <button
          onClick={() => {
            if (typeof onClose === "function") onClose();
            if (typeof setCollapsed === "function") setCollapsed(true);
          }}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="close sidebar"
        >
        </button>
      </div>

      {/* Scrollable nav */}
      <ScrollArea className="flex-1 overflow-y-auto w-full">
        <nav className={cn("p-4 space-y-2 w-full", collapsed ? "px-1" : "px-4")}>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.to, item.children);
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            return (
              <div key={item.to || item.label} className="w-full relative">
                <div
                  className={cn(
                    "w-full flex items-center justify-between font-medium text-[#667085] rounded-md text-[14.5px] gap-3 p-2 hover:bg-[#DDE4FF] transition-colors duration-200",
                    active ? "bg-[#F2F5FF] !text-[#3D5EE1]" : "text-[#667085]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* ICON: clickable behavior updated:
                        - if collapsed & hasChildren -> show floating box
                        - if collapsed & no children -> navigate
                        - if not collapsed -> same as before */}
                    <button
                      type="button"
                      onClick={(e) => {
                        // if collapsed and this item has children -> show popover
                        if (collapsed && hasChildren) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          // toggle: if same parent clicked close
                          if (popover && popover.parent === item.label) {
                            setPopover(null);
                          } else {
                            setPopover({ parent: item.label, rect, children: item.children });
                          }
                        } else {
                          // normal behavior: navigate if has a route; otherwise toggle submenu when expanded
                          if (item.to && (!hasChildren || !collapsed)) {
                            navigate(item.to);
                            if (typeof onClose === "function") onClose();
                          } else if (hasChildren && !collapsed) {
                            toggleParent(item.to);
                          }
                        }
                      }}
                      className={cn(
                        "p-1.5 rounded-sm flex items-center text-[#667085] focus:outline-none",
                        active ? "bg-white shadow-sm !text-[#3D5EE1]" : "!text-[#667085]"
                      )}
                      title={item.label}
                      aria-label={item.label}
                    >
                      {Icon ? <Icon size={18} /> : null}
                    </button>

                    {/* Label (hidden when collapsed) */}
                    {hasChildren ? (
                      <button
                        onClick={() => toggleParent(item.to)}
                        className={cn(
                          "flex-1 text-left !text-[#667085] truncate",
                          active ? " !text-[#3D5EE1]" : "!text-[#667085]",
                          collapsed ? "hidden" : ""
                        )}
                        aria-expanded={openParent === item.to}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={() => {
                          if (typeof onClose === "function") onClose();
                        }}
                        className={cn(
                          "flex-1 text-left !text-[#667085] truncate",
                          active ? " !text-[#3D5EE1]" : "!text-[#667085]",
                          collapsed ? "hidden" : ""
                        )}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>

                  {/* chevron for parents (hidden when collapsed) */}
                  {hasChildren && !collapsed && (
                    <button
                      onClick={() => toggleParent(item.to)}
                      className={cn(
                        "text-sm px-2 py-1 rounded !text-[#667085]",
                        openParent === item.to ? "rotate-180" : ""
                      )}
                      aria-label="toggle submenu"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* children (hidden when collapsed - inline) */}
                {hasChildren && openParent === item.to && !collapsed && (
                  <div className="mt-1 ml-8 flex flex-col gap-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.to || pathname.startsWith(child.to + "/");
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => {
                            if (typeof onClose === "function") onClose();
                          }}
                          className={cn(
                            "w-full text-[16px] py-2 px-3 rounded-md text-left !text-[#667085] hover:bg-gray-100",
                            childActive ? "bg-blue-50 !text-[#3D5EE1]" : "text-[#667085] hover:bg-gray-50"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 bg-white text-[14px] w-full" style={{ borderTop: ".5px solid #66708550" }}>
        {/* Toggle + Settings row */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={() => navigate("/settings")}
            className={cn(
              "flex items-center justify-start gap-2 w-full font-medium p-2 rounded-md cursor-pointer hover:bg-gray-100 text-[#667085]",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={16} />
            {!collapsed && <span>Settings</span>}
          </div>
        </div>
      </div>

      {/* floating popover when collapsed */}
      {renderPopover()}
    </div>
  );

  return <SidebarContent className="shadow-lg" />;
}
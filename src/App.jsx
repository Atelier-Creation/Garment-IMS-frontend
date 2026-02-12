import { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import RawMaterials from "./pages/RawMaterials";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderInward from "./pages/PurchaseOrderInward";
import ProductionOrders from "./pages/ProductionOrders";
import SalesOrders from "./pages/SalesOrders";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import "./styles/responsive-tables.css";
import Branches from "./pages/Branches";
import ExportOrders from "./pages/ExportOrders";
import ProductVariants from "./pages/ProductVariants";
import BOM from "./pages/BOM";
import Shipments from "./pages/Shipments";
import AuditLogs from "./pages/AuditLogs";
import Billing from "./pages/Billing";
import ProtectedRoute from "./context/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import Loading from "./utils/Loading";
import { Toaster } from "sonner";
import dashboard from "./assets/dashboard.png";
import AOS from "aos";
import "aos/dist/aos.css";

const App = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }, []);
  const menuItems = [
    {
      key: "dashboard",
      icon: <img src={dashboard} alt="dashboard" className="w-6 h-6" />,
      label: "DASHBOARD",
      children: [],
    },
  ];

  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <Toaster position="top-right" richColors closeButton />
          <Loading duration={3000} />
          <Suspense fallback={<div className="p-4"><Loading /></div>}>
            <Routes>
              {/* Public/Login routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />

              {/* Routes WITH sidebar/header */}
              <Route element={<MainLayout menuItems={menuItems} />}>
                {/* Default redirect */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Categories */}
                <Route path="/category/list" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["category.read"]}>
                      <Categories />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Products */}
                <Route path="/product/list" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["product.read"]}>
                      <Products />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Product Variants */}
                <Route path="/product/variants" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["product.read"]}>
                      <ProductVariants />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Raw Materials */}
                <Route path="/raw-materials" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["product.read"]}>
                      <RawMaterials />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* BOM */}
                <Route path="/bom" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["product.read"]}>
                      <BOM />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Stock */}
                <Route path="/stock/list" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["stock.read"]}>
                      <Stock />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Users */}
                <Route path="/user" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["user.read"]}>
                      <Users />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Roles */}
                <Route path="/roles" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["role.view"]}>
                      <Roles />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Permissions */}
                <Route path="/permissions" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["permission.view"]}>
                      <Permissions />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Suppliers/Vendors */}
                <Route path="/vendor" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["supplier.read"]}>
                      <Suppliers />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Customers */}
                <Route path="/customer" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["customer.read"]}>
                      <Customers />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Branches */}
                <Route path="/branch" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["supplier.read"]}>
                      <Branches />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Purchase Orders */}
                <Route path="/order" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["purchase.read"]}>
                      <PurchaseOrders />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Purchase Order Inward */}
                <Route path="/purchase-inward" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["purchase.receive"]}>
                      <PurchaseOrderInward />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Production Orders */}
                <Route path="/production" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["production.read"]}>
                      <ProductionOrders />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Sales Orders */}
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["sales.read"]}>
                      <SalesOrders />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Billing / POS */}
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["billing:read", "sales.read"]}>
                      <Billing />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Export Orders */}
                <Route path="/export-orders" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["sales.read"]}>
                      <ExportOrders />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Shipments */}
                <Route path="/shipments" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["sales.read"]}>
                      <Shipments />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Reports */}
                <Route path="/report" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["reports.view"]}>
                      <Reports />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Audit Logs */}
                <Route path="/audit-logs" element={
                  <ProtectedRoute>
                    <PermissionRoute permissions={["audit.view"]}>
                      <AuditLogs />
                    </PermissionRoute>
                  </ProtectedRoute>
                } />

                {/* Settings */}
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<div className="p-4 text-red-500">404 - Page Not Found</div>} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Suspense>
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
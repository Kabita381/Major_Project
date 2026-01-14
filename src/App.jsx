import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

/* ================= LAYOUTS ================= */
import EmployeeLayout from "./components/EmployeeLayout";
import AdminLayout from "./components/AdminLayout";
import AccountantLayout from "./components/AccountantLayout";

/* ================= AUTH & PAGES ================= */
import Landing from "./pages/Login/Landing.jsx";
import ForgotPassword from "./pages/Common/ForgotPassword.jsx";
import ResetPassword from "./pages/Common/ResetPassword.jsx";

/* ================= DASHBOARDS & SUBPAGES ================= */
// ACCOUNTANT
import AccountantDashboard from "./pages/Accountant/AccountantDashboard.jsx";
import AccountantPayroll from "./pages/Accountant/Payroll.jsx";
import Salary from "./pages/Accountant/Salary.jsx";
import Tax from "./pages/Accountant/Tax.jsx";
import AccountantReport from "./pages/Accountant/Report.jsx";

// ADMIN
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import Employees from "./pages/Admin/Employees.jsx";
import AddEmployee from "./pages/Admin/AddEmployee.jsx";
import Attendance from "./pages/Admin/Attendance.jsx";
import Leave from "./pages/Admin/Leave.jsx";
import AdminPayroll from "./pages/Admin/Payroll.jsx";
import Report from "./pages/Admin/Report.jsx";
import SystemConfig from "./pages/Admin/SystemConfig/System-Config.jsx";

// EMPLOYEE
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import AttendanceRecords from "./pages/Employee/AttendanceRecords.jsx";
import LeaveManagement from "./pages/Employee/LeaveManagement.jsx";
import SalaryAnalytics from "./pages/Employee/SalaryAnalytics.jsx";
import Settings from "./pages/Employee/Settings.jsx";

/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ allowedRole }) => {
  const savedUser = localStorage.getItem("user_session");
  const user = savedUser ? JSON.parse(savedUser) : null;

  if (!user) return <Navigate to="/" replace />;

  const userRole = user.role?.toUpperCase().trim();
  const requiredRole = allowedRole.toUpperCase().trim();

  if (userRole !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
};

function App() {
  // Initialize state with basic error handling for JSON parsing
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user_session");
      if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (error) {
      console.error("Failed to parse user session:", error);
      localStorage.removeItem("user_session");
      return null;
    }
  });

  // --- Global Effect to handle Session Expiration ---
  useEffect(() => {
    // This handles cases where the axios interceptor detects a 401 Unauthorized
    const handleAuthError = (event) => {
      localStorage.removeItem("user_session");
      setUser(null);
      // Optional: window.location.href = "/?expired=true";
    };

    window.addEventListener("auth-session-expired", handleAuthError);
    return () => window.removeEventListener("auth-session-expired", handleAuthError);
  }, []);

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ACCOUNTANT ROUTES */}
        <Route path="/accountant" element={<ProtectedRoute allowedRole="ROLE_ACCOUNTANT" />}>
          <Route element={<AccountantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="payroll-processing" element={<AccountantPayroll />} />
            <Route path="salary-management" element={<Salary />} />
            <Route path="tax-compliance" element={<Tax />} />
            <Route path="financial-reports" element={<AccountantReport />} />
          </Route>
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="ROLE_ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="employees" element={<Employees />} />
            <Route path="employees/new" element={<AddEmployee />} />
            <Route path="employees/edit/:id" element={<AddEmployee />} />

            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="report" element={<Report />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route path="/employee" element={<ProtectedRoute allowedRole="ROLE_EMPLOYEE" />}>
          <Route element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="salary" element={<SalaryAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
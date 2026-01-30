import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Staff from "./pages/Staff";
import FeeManagement from "./pages/FeeManagement";
import Attendance from "./pages/Attendance";
import FrontOffice from "./pages/FrontOffice";
import Examination from "./pages/Examination";
import Academics from "./pages/Academics";
import HRPayroll from "./pages/HRPayroll";
import Hostel from "./pages/Hostel";
import Finance from "./pages/Finance";
import Configuration from "./pages/Configuration";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import { refreshTokens, userWho } from "../config/apis";

// Menu order for default landing
const menuOrder = [
  "Dashboard",
  "Front Office",
  "Students",
  "Staff",
  // "Teachers",
  "Attendance",
  "Fee Management",
  "Examination",
  "Academics",
  "HR & Payroll",
  "Hostel",
  "Finance",
  "Inventory",
  "Configuration",
];

// ──────────────────────────────────────────────────────────────
// Get default landing path
// ──────────────────────────────────────────────────────────────
const getDefaultPath = (user) => {
  if (user?.role === "SUPER_ADMIN") return "/dashboard";

  const pathMap = {
    "Dashboard": "/dashboard",
    "Front Office": "/front-office",
    "Students": "/students",
    "Staff": "/staff",
    "Attendance": "/attendance",
    "Fee Management": "/fee-management",
    "Examination": "/examination",
    "Academics": "/academics",
    "HR & Payroll": "/hr-payroll",
    "Hostel": "/hostel",
    "Finance": "/finance",
    "Inventory": "/inventory",
    "Configuration": "/configuration",
  };

  const modules = user?.permissions?.modules ?? [];
  const isTeacherOrStaff = user?.role === "Teacher";
  const hardcodedModules = isTeacherOrStaff ? ["Attendance", "Examination"] : [];
  const allAccessibleModules = [...new Set([...(Array.isArray(modules) ? modules : []), ...hardcodedModules])];

  if (allAccessibleModules.length > 0) {
    // Return first allowed module in menu order
    for (const label of menuOrder) {
      if (allAccessibleModules.includes(label)) {
        return pathMap[label] || "/dashboard";
      }
    }
  }

  return "/dashboard";
};

// ──────────────────────────────────────────────────────────────
// Root redirect
// ──────────────────────────────────────────────────────────────
function RootRoutes() {
  const { data } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await userWho();
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await refreshTokens();
            return await userWho();
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    retry: false,
  });

  if (!data) return <Login />;
  return <Navigate to={getDefaultPath(data)} replace />;
}

// ──────────────────────────────────────────────────────────────
// Permission-based route
// ──────────────────────────────────────────────────────────────
function PermissionRoute({ children, moduleName }) {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await userWho();
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await refreshTokens();
            return await userWho();
          } catch {
            navigate("/login");
            throw error;
          }
        }
        throw error;
      }
    },
    retry: false,
  });
  console.log(currentUser)

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // SUPER_ADMIN has access to everything
  if (currentUser?.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  let canAccess = false;
  const isTeacherOrStaff = currentUser?.role === "Teacher";
  const hardcodedModules = isTeacherOrStaff ? ["Attendance", "Examination"] : [];
  const modulePermissions = currentUser?.permissions?.modules ?? [];

  const allAccessibleModules = [...new Set([...(Array.isArray(modulePermissions) ? modulePermissions : []), ...hardcodedModules])];
  canAccess = allAccessibleModules.includes(moduleName);

  if (!canAccess) {
    return <Navigate to={getDefaultPath(currentUser)} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRoutes />} />

              <Route
                path="/dashboard"
                element={
                  <PermissionRoute moduleName="Dashboard">
                    <Dashboard />
                  </PermissionRoute>
                }
              />
              <Route
                path="/front-office"
                element={
                  <PermissionRoute moduleName="Front Office">
                    <FrontOffice />
                  </PermissionRoute>
                }
              />
              <Route
                path="/students"
                element={
                  <PermissionRoute moduleName="Students">
                    <Students />
                  </PermissionRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <PermissionRoute moduleName="Staff">
                    <Staff />
                  </PermissionRoute>
                }
              />
              {/* <Route
                path="/teachers"
                element={
                  <PermissionRoute moduleName="Teachers">
                    <Teachers />
                  </PermissionRoute>
                }
              /> */}
              <Route
                path="/attendance"
                element={
                  <PermissionRoute moduleName="Attendance">
                    <Attendance />
                  </PermissionRoute>
                }
              />
              <Route
                path="/fee-management"
                element={
                  <PermissionRoute moduleName="Fee Management">
                    <FeeManagement />
                  </PermissionRoute>
                }
              />
              <Route
                path="/examination"
                element={
                  <PermissionRoute moduleName="Examination">
                    <Examination />
                  </PermissionRoute>
                }
              />
              <Route
                path="/academics"
                element={
                  <PermissionRoute moduleName="Academics">
                    <Academics />
                  </PermissionRoute>
                }
              />
              <Route
                path="/hr-payroll"
                element={
                  <PermissionRoute moduleName="HR & Payroll">
                    <HRPayroll />
                  </PermissionRoute>
                }
              />
              <Route
                path="/hostel"
                element={
                  <PermissionRoute moduleName="Hostel">
                    <Hostel />
                  </PermissionRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <PermissionRoute moduleName="Finance">
                    <Finance />
                  </PermissionRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <PermissionRoute moduleName="Inventory">
                    <Inventory />
                  </PermissionRoute>
                }
              />
              <Route
                path="/configuration"
                element={
                  <PermissionRoute moduleName="Configuration">
                    <Configuration />
                  </PermissionRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
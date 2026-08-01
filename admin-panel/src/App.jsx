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
  useLocation,
} from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import FeeManagement from "./pages/FeeManagement";
import Attendance from "./pages/Attendance";
import FrontOffice from "./pages/FrontOffice";
import Examination from "./pages/Examination";
import Academics from "./pages/Academics";
import HRPayroll from "./pages/HRPayroll";
import Boarding from "./pages/Boarding";
import Finance from "./pages/Finance";
import Configuration from "./pages/Configuration";
import Inventory from "./pages/Inventory";
import Complaints from "./pages/Complaints";
import NotFound from "./pages/NotFound";
import { refreshTokens, userWho } from "../config/apis";
import {
  NAV_MODULES,
  MODULE_BY_LABEL,
  getActiveSubmoduleId,
  getAllowedSubmodules,
  getFirstAllowedPath,
  getSubmoduleSegment,
  hasModuleAccess,
  hasSubmoduleAccess,
} from "@/lib/navigation.jsx";

const pageComponents = {
  Dashboard,
  FrontOffice,
  Students,
  Staff,
  Attendance,
  FeeManagement,
  Examination,
  Complaints,
  Academics,
  HRPayroll,
  Boarding,
  Finance,
  Inventory,
  Configuration,
};

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
  return <Navigate to={getFirstAllowedPath(data)} replace />;
}

function PermissionRoute({ children, moduleName }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!currentUser) return <Navigate to="/" replace />;

  const module = MODULE_BY_LABEL[moduleName];
  if (!hasModuleAccess(currentUser, moduleName)) {
    return <Navigate to={getFirstAllowedPath(currentUser)} replace />;
  }

  const hasChildren = Boolean(module?.subModules?.length);
  const isBaseModulePath = hasChildren && location.pathname.replace(/\/$/, "") === module.path;
  const activeSegment = hasChildren
    ? location.pathname.replace(module.path, "").split("/").filter(Boolean)[0]
    : null;
  const isUnknownSubmodule =
    hasChildren &&
    activeSegment &&
    !module.subModules.some((subModule) => getSubmoduleSegment(subModule) === activeSegment);
  const activeSubmoduleId = getActiveSubmoduleId(location.pathname, module);
  const allowedSubmodules = getAllowedSubmodules(currentUser, module);

  if (isBaseModulePath || isUnknownSubmodule) {
    return <Navigate to={(allowedSubmodules[0] || module.subModules[0]).path} replace />;
  }

  if (activeSubmoduleId && !hasSubmoduleAccess(currentUser, moduleName, activeSubmoduleId)) {
    return <Navigate to={allowedSubmodules[0]?.path || getFirstAllowedPath(currentUser)} replace />;
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
              {NAV_MODULES.map((module) => {
                const Page = pageComponents[module.componentKey];
                if (!Page) return null;
                return (
                  <Route
                    key={module.label}
                    path={`${module.path}${module.subModules?.length ? "/*" : ""}`}
                    element={
                      <PermissionRoute moduleName={module.label}>
                        <Page />
                      </PermissionRoute>
                    }
                  />
                );
              })}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;

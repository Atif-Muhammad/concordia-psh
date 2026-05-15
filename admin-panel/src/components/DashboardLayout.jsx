import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, ClipboardCheck, GraduationCap,
  BookOpen, Settings, BriefcaseBusiness, Home, FileText, TrendingUp,
  Menu, X, LogOut, ChevronLeft, ChevronRight, Package, User, UsersRound, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { logout, userWho, refreshTokens, getInstituteSettings } from "../../config/apis";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import logo from "../assets/logo-full.png"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Front Office", path: "/front-office" },
  { icon: Users, label: "Students", path: "/students" },
  { icon: UsersRound, label: "Staff", path: "/staff" },
  // { icon: UserCircle, label: "Teachers", path: "/teachers" },
  { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
  { icon: DollarSign, label: "Fee Management", path: "/fee-management" },
  { icon: BookOpen, label: "Examination", path: "/examination" },
  { icon: GraduationCap, label: "Academics", path: "/academics" },
  { icon: BriefcaseBusiness, label: "HR & Payroll", path: "/hr-payroll" },
  { icon: Home, label: "Boarding", path: "/hostel" },
  { icon: TrendingUp, label: "Finance", path: "/finance" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: MessageSquare, label: "Complaints", path: "/complaints" },
  { icon: Settings, label: "Configuration", path: "/configuration" },
];

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: currentUser } = useQuery({
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

  // Fetch institute settings
  const { data: settings } = useQuery({
    queryKey: ["instituteSettings"],
    queryFn: getInstituteSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Determine allowed modules
  const modulePermissions = currentUser?.permissions?.modules ?? [];
  const hasModulePermissions = Array.isArray(modulePermissions) && modulePermissions.length > 0;
  const isTeacherOrStaff = currentUser?.role === "Teacher";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const canAccess = (label) => {
    // SUPER_ADMIN has access to everything
    if (isSuperAdmin) {
      return true;
    }

    // Hardcoded permissions for all staff (teaching/non-teaching)
    const role = currentUser?.role;
    if (role === "Teacher" && ["Attendance", "Examination", "Complaints"].includes(label)) {
      return true;
    }
    if (role === "Staff" && label === "Complaints") {
      return true;
    }

    // Explicitly granted module permissions
    if (Array.isArray(modulePermissions)) {
      return modulePermissions.includes(label);
    }

    return false;
  };

  const handleLogout = async () => {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-sidebar transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "lg:w-14" : "lg:w-52"
        )}
      >
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto scrollbar-thin">
          {/* Logo */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 pb-4 transition-all duration-300",
              sidebarCollapsed && "px-2 justify-center"
            )}
          >
            <div className="w-full h-15 flex items-center justify-start shrink-0 overflow-hidden">
              <img
                src={settings?.logo || logo}
                alt="Logo"
                className="h-full object-contain p-0.5"
              />
            </div>
            {/* {!sidebarCollapsed && (
              <div className="animate-fade-in min-w-0">
                <h2 className="font-semibold text-sidebar-foreground text-sm line-clamp-1">
                  {settings?.instituteName}
                </h2>
                <p className="text-[10px] text-sidebar-foreground/70">
                  {settings?.phone || "Administration"}
                </p>
              </div>
            )} */}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const hasAccess = canAccess(item.label);

              if (!hasAccess) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse */}
          <div className="px-2 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                "w-full justify-center hover:bg-sidebar-accent text-white bg-amber-700 h-7 text-xs",
                sidebarCollapsed && "px-1"
              )}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>

          <div className="px-2 pb-3 pt-2 border-t border-sidebar-accent/30">
            {sidebarCollapsed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogoutDialogOpen(true)}
                className="h-8 w-full rounded-md justify-center px-1 text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground line-clamp-1">
                    {currentUser?.name || "User"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/70 line-clamp-1">
                    {currentUser?.designation || currentUser?.role || "Staff Member"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="h-8 w-8 shrink-0 rounded-md text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-foreground/20 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-sidebar z-50">
            <div className="flex flex-col h-full pt-5">
              <div className="flex items-center justify-between px-6 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sidebar-foreground text-lg">Concordia</h2>
                    <p className="text-xs text-sidebar-foreground/70">College CMS</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-sidebar-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const hasAccess = canAccess(item.label);

                  if (!hasAccess) return null;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-3 pb-4 pt-2 border-t border-sidebar-accent/30">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-sidebar-foreground line-clamp-1">
                      {currentUser?.name || "User"}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/70 line-clamp-1">
                      {currentUser?.designation || currentUser?.role || "Staff Member"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogoutDialogOpen(true)}
                    className="h-8 w-8 shrink-0 rounded-md text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-14" : "lg:pl-52"
        )}
      >
        <main className="flex-1 p-3 lg:p-4 w-full overflow-x-hidden">
          <div className="lg:hidden mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
          <div key={location.pathname} className="animate-in fade-in slide-in- duration-500">
            {children}
          </div>
        </main>
      </div>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account and redirected to login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardLayout;

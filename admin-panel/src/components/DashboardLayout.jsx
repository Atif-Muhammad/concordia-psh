import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, ClipboardCheck, GraduationCap,
  BookOpen, Settings, BriefcaseBusiness, Home, FileText, TrendingUp,
  Menu, X, LogOut, Bell, ChevronLeft, ChevronRight, Package, UserCircle, Lock, User, UsersRound
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logout, userWho, refreshTokens, getInstituteSettings } from "../../config/apis";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import logo from "../assets/logo.png"

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
  { icon: Home, label: "Hostel", path: "/hostel" },
  { icon: TrendingUp, label: "Finance", path: "/finance" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: Settings, label: "Configuration", path: "/configuration" },
];

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (isTeacherOrStaff && ["Attendance", "Examination"].includes(label)) {
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
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto scrollbar-thin">
          {/* Logo */}
          <div
            className={cn(
              "flex items-center gap-3 px-6 pb-6 transition-all duration-300",
              sidebarCollapsed && "px-3 justify-center"
            )}
          >
            <div className="w-12 h-12 bg-sidebar-primary rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={settings?.logo || logo}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h2 className="font-bold text-sidebar-foreground text-base line-clamp-1">
                  {settings?.instituteName}
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  {settings?.phone || "Administration"}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse */}
          <div className="px-3 pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                "w-full justify-center hover:bg-sidebar-accent text-white bg-amber-700",
                sidebarCollapsed && "px-2"
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
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <header className="bg-card border-b border-border sticky top-0 z-30 shadow-soft">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                {settings?.instituteName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 h-10 rounded-full hover:bg-muted">
                    <span className="hidden md:flex flex-col items-end mr-1 space-y-1 px-2">
                      <span className="text-sm text-foreground font-semibold leading-none">{currentUser?.name}</span>
                      <span className="text-xs text-muted-foreground leading-none">{currentUser?.role}</span>
                    </span>
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src="" alt={currentUser?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal md:hidden">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser?.name || "Admin"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser?.email || currentUser?.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="md:hidden" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
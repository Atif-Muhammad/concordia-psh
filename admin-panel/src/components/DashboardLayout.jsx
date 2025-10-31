import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, DollarSign, ClipboardCheck, GraduationCap, BookOpen, Settings, BriefcaseBusiness, Home, FileText, TrendingUp, Menu, X, LogOut, Bell, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
const menuItems = [{
  icon: LayoutDashboard,
  label: "Dashboard",
  path: "/dashboard"
}, {
  icon: FileText,
  label: "Front Office",
  path: "/front-office"
}, {
  icon: Users,
  label: "Students",
  path: "/students"
}, {
  icon: ClipboardCheck,
  label: "Attendance",
  path: "/attendance"
}, {
  icon: DollarSign,
  label: "Fee Management",
  path: "/fee-management"
}, {
  icon: BookOpen,
  label: "Examination",
  path: "/examination"
}, {
  icon: GraduationCap,
  label: "Academics",
  path: "/academics"
}, {
  icon: BriefcaseBusiness,
  label: "HR & Payroll",
  path: "/hr-payroll"
}, {
  icon: Home,
  label: "Hostel",
  path: "/hostel"
}, {
  icon: TrendingUp,
  label: "Finance",
  path: "/finance"
}, {
  icon: Package,
  label: "Inventory",
  path: "/inventory"
}, {
  icon: Settings,
  label: "Configuration",
  path: "/configuration"
}];
const DashboardLayout = ({
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
  };
  return <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className={cn("hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-sidebar transition-all duration-300 ease-in-out", sidebarCollapsed ? "lg:w-16" : "lg:w-64")}>
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
          {/* Logo */}
          <div className={cn("flex items-center gap-3 px-6 pb-6 transition-all duration-300", sidebarCollapsed && "px-3 justify-center")}>
            <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            {!sidebarCollapsed && <div className="animate-fade-in">
                <h2 className="font-bold text-sidebar-foreground text-lg">Concordia</h2>
                <p className="text-xs text-sidebar-foreground/70">College CMS</p>
              </div>}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return <Link key={item.path} to={item.path} onClick={e => {
              // Prevent any sidebar state changes on navigation
              e.stopPropagation();
            }} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground", sidebarCollapsed && "justify-center")} title={sidebarCollapsed ? item.label : undefined}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
                </Link>;
          })}
          </nav>

          {/* Collapse Button */}
          <div className="px-3 pb-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={cn("w-full justify-center hover:bg-sidebar-accent text-white bg-amber-700", sidebarCollapsed && "px-2")}>
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <>
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  <span>Collapse</span>
                </>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && <>
          <div className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-sidebar z-50 transform transition-transform">
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
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>;
            })}
              </nav>
            </div>
          </aside>
        </>}

      {/* Main Content */}
      <div className={cn("flex flex-col min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-30 shadow-soft">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">
                {menuItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 w-full overflow-x-hidden">{children}</main>
      </div>
    </div>;
};
export default DashboardLayout;
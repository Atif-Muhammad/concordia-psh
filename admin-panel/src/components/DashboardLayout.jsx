import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap, Menu, X, LogOut, ChevronLeft, ChevronRight, ChevronDown
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
import { NAV_MODULES, getAllowedSubmodules, getDefaultModulePath, hasModuleAccess } from "@/lib/navigation.jsx";

const DESKTOP_SIDEBAR_SCROLL_KEY = "dashboardSidebarScrollTop";
const MOBILE_SIDEBAR_SCROLL_KEY = "dashboardMobileSidebarScrollTop";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [expandedModules, setExpandedModules] = useState(() => {
    const saved = localStorage.getItem("sidebarExpandedModules");
    return saved ? JSON.parse(saved) : {};
  });
  const navScrollRef = useRef(null);
  const mobileNavScrollRef = useRef(null);

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

  const canAccess = (label) => {
    return hasModuleAccess(currentUser, label);
  };

  const visibleModules = NAV_MODULES.filter((item) => canAccess(item.label));

  useEffect(() => {
    if (!visibleModules.length) return;
    const hasSavedExpansion = localStorage.getItem("sidebarExpandedModules");
    if (hasSavedExpansion) return;
    const activeModule = visibleModules.find(
      (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    );
    if (activeModule) {
      setExpandedModules({ [activeModule.label]: true });
    }
  }, [currentUser?.id]);

  const restoreSidebarScroll = () => {
    const desktopTop = Number(sessionStorage.getItem(DESKTOP_SIDEBAR_SCROLL_KEY) || 0);
    const mobileTop = Number(sessionStorage.getItem(MOBILE_SIDEBAR_SCROLL_KEY) || 0);
    if (navScrollRef.current) navScrollRef.current.scrollTop = desktopTop;
    if (mobileNavScrollRef.current) mobileNavScrollRef.current.scrollTop = mobileTop;
  };

  useLayoutEffect(() => {
    restoreSidebarScroll();
    const frame = requestAnimationFrame(restoreSidebarScroll);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, visibleModules.length, sidebarCollapsed, expandedModules]);

  const rememberSidebarScroll = (key) => (event) => {
    sessionStorage.setItem(key, String(event.currentTarget.scrollTop));
  };

  const persistExpandedModules = (next) => {
    setExpandedModules(next);
    localStorage.setItem("sidebarExpandedModules", JSON.stringify(next));
  };

  const toggleModule = (label) => {
    persistExpandedModules({ ...expandedModules, [label]: !expandedModules[label] });
  };

  const setAllModulesExpanded = (expanded) => {
    persistExpandedModules(
      Object.fromEntries(
        visibleModules
          .filter((item) => item.subModules?.length && getAllowedSubmodules(currentUser, item).length > 0)
          .map((item) => [item.label, expanded])
      )
    );
  };

  const renderNavItem = (item, { mobile = false } = {}) => {
    const Icon = item.icon;
    const allowedSubmodules = getAllowedSubmodules(currentUser, item);
    const hasChildren = item.subModules?.length && allowedSubmodules.length > 0;
    const itemPath = hasChildren ? allowedSubmodules[0].path : getDefaultModulePath(item);
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const hasAccess = canAccess(item.label);
    const isExpanded = Boolean(expandedModules[item.label]);

    if (!hasAccess) return null;

    const linkClass = mobile
      ? "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-semibold transition-colors"
      : "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors";

    return (
      <div key={item.label} className={cn(!mobile && "space-y-0.5")}>
        <div className="flex items-center gap-1">
          <Link
            to={itemPath}
            onClick={() => {
              if (hasChildren) persistExpandedModules({ ...expandedModules, [item.label]: true });
              if (mobile) setSidebarOpen(false);
            }}
            className={cn(
              linkClass,
              "min-w-0 flex-1",
              isActive
                ? "bg-sidebar-accent text-white shadow-sm"
                : "text-white/95 hover:bg-sidebar-accent/55 hover:text-white",
              sidebarCollapsed && !mobile && "justify-center"
            )}
            title={sidebarCollapsed && !mobile ? item.label : undefined}
          >
            <Icon className={cn(mobile ? "w-5 h-5" : "w-4 h-4", "shrink-0 text-white")} />
            {(!sidebarCollapsed || mobile) && <span className="animate-fade-in truncate">{item.label}</span>}
          </Link>
          {hasChildren && !sidebarCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggleModule(item.label)}
              className="h-7 w-7 shrink-0 rounded-md text-white/85 hover:bg-sidebar-accent/55 hover:text-white"
              title={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
            </Button>
          )}
        </div>
        {hasChildren && !sidebarCollapsed && isExpanded && (
          <div className={cn("ml-6 mt-1 space-y-0.5 border-l border-white/20 pl-2 animate-in fade-in slide-in-from-top-1 duration-200", mobile && "ml-8")}>
            {allowedSubmodules.map((sub) => {
              const subActive = location.pathname === sub.path;
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={cn(
                    "block rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
                    subActive
                      ? "bg-sidebar-accent/85 text-white font-semibold"
                      : "text-white/85 hover:bg-sidebar-accent/45 hover:text-white"
                  )}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
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
        <div className="flex flex-col flex-grow pt-5 min-h-0">
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
          {!sidebarCollapsed && (
            <div className="px-2 pb-2 flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAllModulesExpanded(true)} className="h-7 flex-1 text-[11px] text-white/90 hover:text-white hover:bg-sidebar-accent/45">
                Expand
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAllModulesExpanded(false)} className="h-7 flex-1 text-[11px] text-white/90 hover:text-white hover:bg-sidebar-accent/45">
                Collapse
              </Button>
            </div>
          )}
          <nav
            ref={navScrollRef}
            onScroll={rememberSidebarScroll(DESKTOP_SIDEBAR_SCROLL_KEY)}
            className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5"
          >
            {visibleModules.map((item) => renderNavItem(item))}
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
              <div className="px-3 pb-2 flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllModulesExpanded(true)} className="h-8 flex-1 text-xs text-white/90 hover:text-white hover:bg-sidebar-accent/45">
                  Expand
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAllModulesExpanded(false)} className="h-8 flex-1 text-xs text-white/90 hover:text-white hover:bg-sidebar-accent/45">
                  Collapse
                </Button>
              </div>
                <nav
                  ref={mobileNavScrollRef}
                  onScroll={rememberSidebarScroll(MOBILE_SIDEBAR_SCROLL_KEY)}
                  className="flex-1 px-3 space-y-1 overflow-y-auto"
                >
                {visibleModules.map((item) => renderNavItem(item, { mobile: true }))}
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
          <div className="animate-in fade-in duration-300">
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

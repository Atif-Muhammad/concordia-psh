import {
  LayoutDashboard, Users, DollarSign, ClipboardCheck, GraduationCap,
  BookOpen, Settings, BriefcaseBusiness, Home, FileText, TrendingUp,
  Package, UsersRound, MessageSquare,
} from "lucide-react";

export const NAV_MODULES = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", componentKey: "Dashboard" },
  {
    icon: FileText, label: "Front Office", path: "/front-office", componentKey: "FrontOffice",
    subModules: [
      { id: "inquiry", label: "Inquiry", path: "/front-office/inquiry" },
      { id: "visitor", label: "Visitor Book", path: "/front-office/visitor" },
      { id: "complaint", label: "Complaints", path: "/front-office/complaint" },
      { id: "contacts", label: "Contacts", path: "/front-office/contacts" },
    ],
  },
  {
    icon: Users, label: "Students", path: "/students", componentKey: "Students",
    subModules: [
      { id: "ACTIVE", segment: "active", label: "Active", path: "/students/active" },
      { id: "GRADUATED", segment: "graduated", label: "Graduated", path: "/students/graduated" },
      { id: "EXPELLED", segment: "expelled", label: "Expelled", path: "/students/expelled" },
      { id: "STRUCK_OFF", segment: "struck-off", label: "Struck Off", path: "/students/struck-off" },
    ],
  },
  {
    icon: UsersRound, label: "Staff", path: "/staff", componentKey: "Staff",
    subModules: [
      { id: "directory", label: "Staff Directory", path: "/staff/directory" },
      { id: "settings", label: "Settings", path: "/staff/settings" },
    ],
  },
  {
    icon: ClipboardCheck, label: "Attendance", path: "/attendance", componentKey: "Attendance",
    subModules: [
      { id: "mark", label: "Record Attendance", path: "/attendance/mark" },
      { id: "leave", label: "Leave", path: "/attendance/leave" },
      { id: "reports", label: "Reports", path: "/attendance/reports" },
      { id: "individual-reports", label: "Individual Reports", path: "/attendance/individual-reports" },
    ],
  },
  {
    icon: DollarSign, label: "Fee Management", path: "/fee-management", componentKey: "FeeManagement",
    subModules: [
      { id: "challans", label: "Challans", path: "/fee-management/challans" },
      { id: "extra-challans", label: "Extra Challans", path: "/fee-management/extra-challans" },
      { id: "feeheads", label: "Fee Heads", path: "/fee-management/feeheads" },
      { id: "structures", label: "Fee Structures", path: "/fee-management/structures" },
      { id: "reports", label: "Reports", path: "/fee-management/reports" },
      { id: "settings", label: "Settings", path: "/fee-management/settings" },
      { id: "student-history", label: "Student History", path: "/fee-management/student-history" },
    ],
  },
  {
    icon: BookOpen, label: "Examination", path: "/examination", componentKey: "Examination",
    subModules: [
      { id: "exams", label: "Exams", path: "/examination/exams" },
      { id: "marks", label: "Marks Entry", path: "/examination/marks" },
      { id: "results", label: "Results", path: "/examination/results" },
    ],
  },
  { icon: MessageSquare, label: "Complaints", path: "/complaints", componentKey: "Complaints" },
  {
    icon: GraduationCap, label: "Academics", path: "/academics", componentKey: "Academics",
    subModules: [
      { id: "sessions", label: "Sessions", path: "/academics/sessions" },
      { id: "programs", label: "Programs", path: "/academics/programs" },
      { id: "classes", label: "Classes", path: "/academics/classes" },
      { id: "sections", label: "Sections", path: "/academics/sections" },
      { id: "subjects", label: "Subjects", path: "/academics/subjects" },
      { id: "scm", label: "Subject Classes", path: "/academics/scm" },
      { id: "classMapping", segment: "class-mapping", label: "Teacher Classes", path: "/academics/class-mapping" },
      { id: "timetable", label: "Timetable", path: "/academics/timetable" },
    ],
  },
  {
    icon: BriefcaseBusiness, label: "HR & Payroll", path: "/hr-payroll", componentKey: "HRPayroll",
    subModules: [
      { id: "leaves", label: "Leaves", path: "/hr-payroll/leaves" },
      { id: "payroll", label: "Payroll", path: "/hr-payroll/payroll" },
      { id: "attendance", label: "Attendance", path: "/hr-payroll/attendance" },
      { id: "advance", label: "Advance Salary", path: "/hr-payroll/advance" },
      { id: "departments", label: "Departments", path: "/hr-payroll/departments" },
      { id: "holidays", label: "Holidays", path: "/hr-payroll/holidays" },
      { id: "reports", label: "Reports", path: "/hr-payroll/reports" },
    ],
  },
  {
    icon: Home, label: "Boarding", path: "/hostel", componentKey: "Boarding",
    subModules: [
      { id: "registration", label: "Registration", path: "/hostel/registration" },
      { id: "rooms", label: "Rooms", path: "/hostel/rooms" },
      { id: "fees", label: "Fees", path: "/hostel/fees" },
      { id: "expenses", label: "Expenses", path: "/hostel/expenses" },
      { id: "inventory", label: "Inventory", path: "/hostel/inventory" },
      { id: "revenue", label: "Reports", path: "/hostel/revenue" },
      { id: "settings", label: "Settings", path: "/hostel/settings" },
    ],
  },
  {
    icon: TrendingUp, label: "Finance", path: "/finance", componentKey: "Finance",
    subModules: [
      { id: "dashboard", label: "Dashboard", path: "/finance/dashboard" },
      { id: "income", label: "Income", path: "/finance/income" },
      { id: "expense", label: "Expense", path: "/finance/expense" },
      { id: "reports", label: "Reports", path: "/finance/reports" },
      { id: "closing", label: "Closing", path: "/finance/closing" },
    ],
  },
  {
    icon: Package, label: "Inventory", path: "/inventory", componentKey: "Inventory",
    subModules: [
      { id: "inventory", label: "Inventory", path: "/inventory/inventory" },
      { id: "expenses", label: "Expenses", path: "/inventory/expenses" },
    ],
  },
  {
    icon: Settings, label: "Configuration", path: "/configuration", componentKey: "Configuration",
    subModules: [
      { id: "institute", label: "Institute", path: "/configuration/institute" },
      { id: "admins", label: "Admins", path: "/configuration/admins" },
      { id: "templates", label: "Templates", path: "/configuration/templates" },
    ],
  },
];

export const MODULE_BY_LABEL = Object.fromEntries(NAV_MODULES.map((module) => [module.label, module]));

export const getSubmoduleSegment = (subModule) => subModule.segment || subModule.id;

export const getActiveSubmoduleId = (pathname, module) => {
  const subModules = module?.subModules || [];
  if (!subModules.length) return null;
  const segment = pathname.replace(module.path, "").split("/").filter(Boolean)[0];
  return subModules.find((sub) => getSubmoduleSegment(sub) === segment)?.id || subModules[0].id;
};

export const getDefaultModulePath = (module) => module?.subModules?.[0]?.path || module?.path || "/dashboard";

export const isDualRoleStaff = (user) =>
  Boolean(user?.isStaff && user?.isTeaching && user?.isNonTeaching);

export const hasExplicitModuleAccess = (user, moduleLabel) => {
  const modules = user?.permissions?.modules;
  const configuredSubmodules = user?.permissions?.subModules?.[moduleLabel];
  return (
    user?.permissions?.all === true ||
    (Array.isArray(modules) && modules.includes(moduleLabel)) ||
    (Array.isArray(configuredSubmodules) && configuredSubmodules.length > 0)
  );
};

export const hasModuleAccess = (user, moduleLabel) => {
  if (user?.role === "SUPER_ADMIN") return true;
  const role = user?.role;
  const isTeacher = role === "Teacher" || role === "TEACHER";
  if (isTeacher && ["Attendance", "Examination", "Complaints"].includes(moduleLabel)) return true;
  if (role === "Staff" && moduleLabel === "Complaints") return true;
  return hasExplicitModuleAccess(user, moduleLabel);
};

export const hasSubmoduleAccess = (user, moduleLabel, subModuleId) => {
  if (!hasModuleAccess(user, moduleLabel)) return false;
  if (!subModuleId || user?.role === "SUPER_ADMIN") return true;
  const role = user?.role;
  const isTeacher = role === "Teacher" || role === "TEACHER";
  const usesTeacherFallback =
    isTeacher &&
    ["Attendance", "Examination", "Complaints"].includes(moduleLabel) &&
    !hasExplicitModuleAccess(user, moduleLabel);
  if (usesTeacherFallback) return true;
  const module = MODULE_BY_LABEL[moduleLabel];
  const subModules = module?.subModules || [];
  if (!subModules.length) return true;
  const configured = user?.permissions?.subModules?.[moduleLabel];
  if (!Array.isArray(configured)) return true;
  return configured.includes(subModuleId);
};

export const getAllowedSubmodules = (user, module) => {
  const subModules = module?.subModules || [];
  if (!hasModuleAccess(user, module?.label)) return [];
  return subModules.filter((sub) => hasSubmoduleAccess(user, module.label, sub.id));
};

export const getFirstAllowedPath = (user) => {
  if (!user) return "/dashboard";
  for (const module of NAV_MODULES) {
    if (!hasModuleAccess(user, module.label)) continue;
    const allowedSubs = getAllowedSubmodules(user, module);
    if (module.subModules?.length && allowedSubs.length > 0) return allowedSubs[0].path;
    if (!module.subModules?.length) return module.path;
  }
  return "/dashboard";
};

export const getRouteSubmoduleId = (pathname, moduleLabel, fallback) =>
  getActiveSubmoduleId(pathname, MODULE_BY_LABEL[moduleLabel]) || fallback;

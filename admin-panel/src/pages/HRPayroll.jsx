import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PayrollManagementDialog from "@/components/PayrollManagementDialog";
import LeavesManagementDialog from "@/components/LeavesManagementDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { UserPlus, Edit, Trash2, DollarSign, Calendar as CalendarIcon, CheckCircle2, XCircle, TrendingUp, Users, IdCard, Settings, UserCheck, Clock, Eye, Wallet, LockKeyhole, Info } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { getDepartments, createDepartment, deleteDepartment, updateDepartment, getTeacherNames, createEmp, getEmp, updateEmp, deleteEmp, getEmployeesByDept, getPayrollSettings, updatePayrollSettings, createHoliday, getHolidays, deleteHoliday, createAdvanceSalary, getAdvanceSalaries, deleteAdvanceSalary, updateAdvanceSalary, getDefaultStaffIDCardTemplate, getAttendanceSummary, getPayrollSheet, getAllStaff, getProgramNames, getAttendanceSkips, deleteAttendanceSkip, getStaffAttendance, markStaffAttendance, markDateAsHoliday, getHrLeavesReport, getHrPayrollReport, getHrAdvanceReport, getHrStaffAttendanceReport, getHrDepartmentsReport, getHrReportsAnalytics, getStaffLeaveBalance } from "../../config/apis";
import { Loader2, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { calculateDuration } from "../lib/dateUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { ModernChartCard, ModernTooltip, MODERN_CHART_COLORS } from "@/components/ui/modern-charts";

const HRPayroll = () => {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("leaves");
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffAttendanceDate, setStaffAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffAttendanceRole, setStaffAttendanceRole] = useState("all");
  const [staffAttendanceChanges, setStaffAttendanceChanges] = useState({});
  const [leaveTypePopover, setLeaveTypePopover] = useState({
    staffId: null,
    leaveType: "casual",
  });
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [idCardTemplate, setIdCardTemplate] = useState("");
  const [viewEmployeeOpen, setViewEmployeeOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [advanceRoleFilter, setAdvanceRoleFilter] = useState("all");
  const [advanceStaffSearch, setAdvanceStaffSearch] = useState("");
  const [advanceComboOpen, setAdvanceComboOpen] = useState(false);
  

  const handleIDCardPreview = async (employee) => {
    try {
      setSelectedEmployee(employee);
      const template = await getDefaultStaffIDCardTemplate();
      if (template) {
        setIdCardTemplate(template.htmlContent
          .replace(/{{employeePhoto}}/g, employee.photo_url || "")
          .replace(/{{name}}/g, employee.name)
          .replace(/{{fatherName}}/g, employee.fatherName || "")
          .replace(/{{designation}}/g, employee.designation || "")
          .replace(/{{department}}/g, employee.empDepartment || "")
          .replace(/{{EmpOrTeacher}}/g, "EMPLOYEE")
          .replace(/{{phone}}/g, employee.contactNumber || "")
          .replace(/{{cnic}}/g, employee.cnic || "")
          .replace(/{{address}}/g, employee.address || "")
          .replace(/{{employeeId}}/g, employee.id)
          .replace(/{{issueDate}}/g, new Date().toLocaleDateString())
        );
        setIdCardOpen(true);
      } else {
        toast({
          title: "No Default Template",
          description: "Please set a default Staff ID Card template in Configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error fetching template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollType, setPayrollType] = useState("employee");
  const [payrollData, setPayrollData] = useState([]);
  const [reportsMonth, setReportsMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportsDate, setReportsDate] = useState(new Date().toISOString().split("T")[0]);

  // All staff for the stats card
  const { data: allStaffData = [] } = useQuery({
    queryKey: ["allStaffStats"],
    queryFn: () => getAllStaff({ status: "ACTIVE" }),
  });

  const advanceStaffOptions = useMemo(() => {
    const unique = new Map();
    (allStaffData || []).forEach((s) => {
      if (!s?.id || unique.has(s.id)) return;
      const name = String(s.name || "").trim();
      if (!name) return;
      const role = s.isTeaching && s.isNonTeaching ? "Dual" : s.isTeaching ? "Teaching" : "Non-Teaching";
      const roleDetail = s.designation || "Staff";
      unique.set(s.id, {
        id: s.id,
        label: `${name} - ${role} - ${roleDetail}`,
        searchText: `${name} ${role} ${roleDetail}`.toLowerCase(),
      });
    });
    return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [allStaffData]);


  const staffStats = (() => {
    const total = allStaffData.length;
    const teaching = allStaffData.filter(s => s.isTeaching && !s.isNonTeaching).length;
    const nonTeaching = allStaffData.filter(s => !s.isTeaching && s.isNonTeaching).length;
    const dual = allStaffData.filter(s => s.isTeaching && s.isNonTeaching).length;
    return { total, teaching, nonTeaching, dual };
  })();

  // Payroll summary for the stats card
  const { data: payrollSummaryData = [] } = useQuery({
    queryKey: ["payrollSummary", payrollMonth],
    queryFn: () => getPayrollSheet(payrollMonth, "all"),
  });

  const payrollSummary = (() => {
    const total = payrollSummaryData.reduce((s, p) => s + (p.netSalary || 0), 0);
    const paid = payrollSummaryData.filter(p => p.status === "PAID").reduce((s, p) => s + (p.netSalary || 0), 0);
    const unpaid = total - paid;
    const totalDeductions = payrollSummaryData.reduce((s, p) => s + (p.totalDeductions || 0), 0);
    const totalAllowances = payrollSummaryData.reduce((s, p) => s + (p.totalAllowances || 0), 0);
    const totalBasic = payrollSummaryData.reduce((s, p) => s + (p.basicSalary || 0), 0);
    return { total, paid, unpaid, totalDeductions, totalAllowances, totalBasic };
  })();

  const queryClient = useQueryClient();

  const { data: staffAttendanceRows = [], isFetching: staffAttendanceLoading, refetch: refetchStaffAttendance } = useQuery({
    queryKey: ["staffAttendance", staffAttendanceDate, staffAttendanceRole],
    queryFn: () => getStaffAttendance(staffAttendanceDate, staffAttendanceRole),
    enabled: activeTab === "attendance",
  });
  const staffLeaveBalanceQueries = useQueries({
    queries: (activeTab === "attendance" ? staffAttendanceRows : []).map((row) => {
      const sid = row.staffId || row.staff?.id;
      return {
        queryKey: ["staffLeaveBalance", sid],
        queryFn: () => getStaffLeaveBalance(sid),
        enabled: !!sid,
        staleTime: 60 * 1000,
      };
    }),
  });
  const staffLeaveBalanceById = useMemo(() => {
    const balances = {};
    const rows = activeTab === "attendance" ? staffAttendanceRows : [];
    rows.forEach((row, idx) => {
      const sid = row.staffId || row.staff?.id;
      if (!sid) return;
      const data = staffLeaveBalanceQueries[idx]?.data;
      if (data) balances[sid] = data;
    });
    return balances;
  }, [activeTab, staffAttendanceRows, staffLeaveBalanceQueries]);

  const { data: reportsLeaves = [], isFetching: reportsLeavesLoading } = useQuery({
    queryKey: ["hrReportsLeaves", reportsMonth],
    queryFn: () => getHrLeavesReport(reportsMonth),
    enabled: activeTab === "reports",
  });

  const { data: reportsPayroll = [], isFetching: reportsPayrollLoading } = useQuery({
    queryKey: ["hrReportsPayroll", reportsMonth],
    queryFn: () => getHrPayrollReport(reportsMonth),
    enabled: activeTab === "reports",
  });

  const { data: reportsAdvance = [], isFetching: reportsAdvanceLoading } = useQuery({
    queryKey: ["hrReportsAdvance", reportsMonth],
    queryFn: () => getHrAdvanceReport(reportsMonth),
    enabled: activeTab === "reports",
  });

  const { data: reportsStaffAttendance = [], isFetching: reportsStaffAttendanceLoading } = useQuery({
    queryKey: ["hrReportsStaffAttendance", reportsDate],
    queryFn: () => getHrStaffAttendanceReport(reportsDate),
    enabled: activeTab === "reports",
  });

  const { data: reportsDepartments = [], isFetching: reportsDepartmentsLoading } = useQuery({
    queryKey: ["hrReportsDepartments"],
    queryFn: getHrDepartmentsReport,
    enabled: activeTab === "reports",
  });

  const { data: reportsAnalytics } = useQuery({
    queryKey: ["hrReportsAnalytics", reportsMonth, reportsDate],
    queryFn: () => getHrReportsAnalytics(reportsMonth, reportsDate),
    enabled: activeTab === "reports",
    retry: 0,
  });

  const setStaffAttendanceStatus = (staffId, status) => {
    setStaffAttendanceChanges(prev => {
      const prevRow = prev?.[staffId];
      const prevLeaveType = typeof prevRow === "object" && prevRow !== null ? prevRow.leaveType : undefined;
      return {
        ...prev,
        [staffId]: {
          status,
          leaveType: status === "leave" ? (prevLeaveType || "casual") : undefined,
        },
      };
    });
  };

  const openLeaveTypePicker = (row, staffMeta) => {
    const sid = row.staffId || staffMeta?.id;
    if (!sid) return;
    const changed = staffAttendanceChanges[sid];
    const currentLeaveType = (typeof changed === "object" && changed !== null ? changed.leaveType : undefined)
      || String(row.leaveType || "CASUAL").toLowerCase();
    setLeaveTypePopover({
      staffId: sid,
      leaveType: currentLeaveType,
    });
  };

  const closeLeaveTypePicker = () => {
    setLeaveTypePopover({
      staffId: null,
      leaveType: "casual",
    });
  };

  const confirmLeaveTypePicker = () => {
    if (!leaveTypePopover.staffId) return;
    setStaffAttendanceChanges(prev => ({
      ...prev,
      [leaveTypePopover.staffId]: {
        status: "leave",
        leaveType: leaveTypePopover.leaveType || "casual",
      },
    }));
    closeLeaveTypePicker();
  };

  const isStaffAttendanceLocked = (record) => {
    const lockTimestamp = record?.generatedAt || record?.markedAt;
    return lockTimestamp ? (Date.now() - new Date(lockTimestamp).getTime()) > 24 * 60 * 60 * 1000 : false;
  };

  const handleSaveStaffAttendance = async () => {
    const editableRows = staffAttendanceRows.filter((row) => !isStaffAttendanceLocked(row));

    // Only submit attendance for staff that were explicitly marked (changed via UI)
    const payloads = editableRows
      .map((row) => {
        const staffId = row.staffId || row.staff?.id;
        const changed = staffAttendanceChanges[staffId];
        const changedStatus = typeof changed === "string" ? changed : changed?.status;
        const changedLeaveType = typeof changed === "object" && changed !== null ? changed.leaveType : undefined;
        // If user explicitly marked a status, use that; otherwise skip — don't auto-submit nulls
        if (!changedStatus) return null;
        return {
          staffId,
          date: staffAttendanceDate,
          status: changedStatus.toUpperCase(),
          leaveType: changedStatus.toLowerCase() === "leave"
            ? String(changedLeaveType || row.leaveType || "casual").toUpperCase()
            : undefined,
        };
      })
      .filter(Boolean);

    if (payloads.length === 0) {
      toast({ title: "No attendance changes to save. Mark staff status first.", variant: "destructive" });
      return;
    }

    try {
      await Promise.all(payloads.map((payload) => markStaffAttendance(payload)));
      toast({ title: `Attendance saved for ${payloads.length} staff member(s)`, variant: "success" });
      setStaffAttendanceChanges({});
      await queryClient.invalidateQueries({ queryKey: ["staffLeaveBalance"] });
      await queryClient.invalidateQueries({ queryKey: ["payrollSheet"] });
      refetchStaffAttendance();
    } catch (error) {
      toast({ title: "Failed to save staff attendance", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkAllStaff = (status) => {
    const next = {};
    staffAttendanceRows.forEach((row) => {
      const sid = row.staffId || row.staff?.id;
      if (!isStaffAttendanceLocked(row)) {
        next[sid] = {
          status,
          leaveType: status === "leave" ? "casual" : undefined,
        };
      }
    });
    setStaffAttendanceChanges(next);
  };

  const handleMarkStaffHoliday = async () => {
    if (!staffAttendanceDate) {
      toast({ title: "Please select a date first", variant: "destructive" });
      return;
    }
    try {
      await markDateAsHoliday(staffAttendanceDate, "Holiday");
      toast({ title: "Holiday marked successfully", variant: "success" });
      setStaffAttendanceChanges({});
      refetchStaffAttendance();
    } catch (error) {
      toast({ title: "Failed to mark holiday", description: error.message, variant: "destructive" });
    }
  };

  const reportsSummary = useMemo(() => {
    const leavesPending = reportsLeaves.filter((l) => l.status === "PENDING").length;
    const payrollPaid = reportsPayroll.filter((p) => p.status === "PAID").length;
    const payrollTotal = reportsPayroll.length;
    const advancePending = reportsAdvance.filter((a) => !a.adjusted).length;
    const attendanceMarked = reportsStaffAttendance.filter((s) => !!s.attendance?.[0]?.markedAt).length;
    return { leavesPending, payrollPaid, payrollTotal, advancePending, attendanceMarked };
  }, [reportsLeaves, reportsPayroll, reportsAdvance, reportsStaffAttendance]);

  const formatPayrollMonthLabel = (value) => {
    if (!value || typeof value !== "string") return "";
    const [y, m] = value.split("-").map(Number);
    if (!y || !m) return value;
    return format(new Date(y, m - 1, 1), "MMM yyyy");
  };

  const getPayrollAdjustedMeta = (advance) => {
    if (advance?.adjustedSource === "PAYROLL") {
      const events = Array.isArray(advance?.actionAudit) ? advance.actionAudit : [];
      const payrollEvent = [...events].reverse().find((e) => e?.action === "ADJUSTED_IN_PAYROLL");
      return {
        by: payrollEvent?.byName || "System",
        month: payrollEvent?.month || advance?.month,
        at: payrollEvent?.at ? new Date(payrollEvent.at).toLocaleString() : "",
      };
    }
    if (advance?.adjustedSource === "MANUAL") return null;
    const events = Array.isArray(advance?.actionAudit) ? advance.actionAudit : [];
    const payrollEvent = [...events].reverse().find((e) => e?.action === "ADJUSTED_IN_PAYROLL");
    if (!payrollEvent) return null;
    return {
      by: payrollEvent.byName || "System",
      month: payrollEvent.month || advance?.month,
      at: payrollEvent.at ? new Date(payrollEvent.at).toLocaleString() : "",
    };
  };


  // Employee Detail Data Queries
  const { data: employeeAttendanceSummary = [], isLoading: attendanceSummaryLoading } = useQuery({
    queryKey: ["employeeAttendanceSummary", viewEmployee?.id, selectedMonth],
    queryFn: () => getAttendanceSummary(selectedMonth, viewEmployee.id, "EMPLOYEE"),
    enabled: !!viewEmployee?.id && viewEmployeeOpen,
  });

  const { data: employeePayrollHistory = [], isLoading: payrollHistoryLoading } = useQuery({
    queryKey: ["employeePayrollHistory", viewEmployee?.id, selectedMonth],
    queryFn: () => getPayrollSheet(selectedMonth, "employee"),
    enabled: !!viewEmployee?.id && viewEmployeeOpen,
  });

  const empDepts = [
    "ALL",
    "ADMIN",
    "FINANCE",
    "SECURITY",
    "TRANSPORT",
    "CLASS_4",
    "MAINTENANCE",
    "IT_SUPPORT",
    "LIBRARY",
    "LAB",
    "OTHER",
  ];

  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    fatherName: "",
    cnic: "",
    contactNumber: "",
    email: "",
    address: "",
    designation: "",
    empDepartment: "",
    staffType: "PERMANENT",
    status: "ACTIVE",
    joinDate: new Date().toISOString().split("T")[0],
    leaveDate: "",
    contractStart: "",
    contractEnd: "",
    photo: null,
  });

  const [advanceFormData, setAdvanceFormData] = useState({
    staffId: "",
    month: new Date().toISOString().slice(0, 7),
    amount: 0,
    remarks: "",
    adjusted: false
  });

  const [leaveFormData, setLeaveFormData] = useState({
    employeeId: "",
    leaveType: "casual",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: ""
  });

  const [deptFormData, setDeptFormData] = useState({
    id: "",
    departmentName: "",
    headOfDepartment: "",
    description: ""
  });

  // Holiday Management
  const [holidayFilter, setHolidayFilter] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [undoHolidayDialog, setUndoHolidayDialog] = useState(null); // { id, date, title }
  const [lastRemovedHoliday, setLastRemovedHoliday] = useState(null); // for undo
  const [holidayFormData, setHolidayFormData] = useState({
    title: "",
    date: { from: new Date(), to: new Date() },
    type: "National",
    repeatYearly: false,
    description: ""
  });

  // Holiday Queries
  const { data: holidays = [], refetch: refetchHolidays } = useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  });

  // Calendar class/section filter
  const [calendarClassId, setCalendarClassId] = useState("all");
  const [calendarSectionId, setCalendarSectionId] = useState("all");

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: getProgramNames,
  });

  const allCalendarClasses = useMemo(() =>
    programs.flatMap(p => (p.classes || []).map(c => ({ ...c, programName: p.name }))),
    [programs]
  );

  const calendarSections = useMemo(() => {
    if (!calendarClassId || calendarClassId === "all") return [];
    const cls = allCalendarClasses.find(c => String(c.id) === calendarClassId);
    return cls?.sections || [];
  }, [calendarClassId, allCalendarClasses]);

  // Reset section when class changes
  const handleCalendarClassChange = (val) => {
    setCalendarClassId(val);
    setCalendarSectionId("all");
  };

  const { data: classSkips = [] } = useQuery({
    queryKey: ["attendanceSkips", calendarClassId, calendarSectionId],
    queryFn: () => {
      const sid = calendarSectionId !== "all" ? calendarSectionId : undefined;
      return getAttendanceSkips(calendarClassId, sid);
    },
    enabled: !!calendarClassId && calendarClassId !== "all",
  });

  // Holidays filtered for the calendar view (global + per-class skips)
  const calendarHolidays = useMemo(() => {
    const toLocalDateStr = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };
    const globalEntries = holidays
      .filter(h => {
        const ds = toLocalDateStr(h.date);
        const [y, m] = ds.split('-').map(Number);
        return y === holidayFilter.year && m === holidayFilter.month;
      })
      .map(h => ({ ...h, _type: 'global' }));

    const skipEntries = classSkips
      .filter(s => {
        const ds = toLocalDateStr(s.date);
        const [y, m] = ds.split('-').map(Number);
        return y === holidayFilter.year && m === holidayFilter.month;
      })
      .map(s => ({ ...s, title: s.reason || 'Class Holiday', _type: 'skip' }));

    // Merge: class skips override global for same date
    const merged = new Map();
    globalEntries.forEach(e => merged.set(toLocalDateStr(e.date), e));
    skipEntries.forEach(e => merged.set(toLocalDateStr(e.date), e));
    return Array.from(merged.values());
  }, [holidays, classSkips, holidayFilter]);

  // Build calendar grid for the selected month
  const calendarGrid = useMemo(() => {
    const year = holidayFilter.year;
    const month = holidayFilter.month;
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const toLocalDay = (dateStr) => {
      const d = new Date(dateStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).getDate();
    };
    const holidayDates = new Set(calendarHolidays.map(h => toLocalDay(h.date)));
    const holidayMap = {};
    calendarHolidays.forEach(h => { holidayMap[toLocalDay(h.date)] = h; });
    return { firstDay, daysInMonth, holidayDates, holidayMap };
  }, [calendarHolidays, holidayFilter]);

  const createHolidayMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({ title: "Holiday created successfully" });
      setHolidayOpen(false);
      setHolidayFormData({
        title: "",
        date: { from: new Date(), to: new Date() },
        type: "National",
        repeatYearly: false,
        description: ""
      });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast({ title: "Holiday removed successfully" });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const deleteSkipMutation = useMutation({
    mutationFn: deleteAttendanceSkip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceSkips"] });
      toast({ title: "Class holiday removed successfully" });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const handleRemoveHoliday = (holiday) => {
    setLastRemovedHoliday(holiday);
    if (holiday._type === 'skip') {
      deleteSkipMutation.mutate(holiday.id);
    } else {
      deleteHolidayMutation.mutate(holiday.id);
    }
    setUndoHolidayDialog(null);
  };

  const handleCreateHoliday = (e) => {
    e.preventDefault();
    if (!holidayFormData.date?.from) {
      toast({ title: "Please select a date", variant: "destructive" });
      return;
    }
    const payload = {
      ...holidayFormData,
      date: holidayFormData.date.from,
      endDate: holidayFormData.date.to || holidayFormData.date.from
    };
    createHolidayMutation.mutate(payload);
  };

  // fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", selectedDepartment],
    queryFn: () => getEmp(selectedDepartment === "ALL" ? "" : selectedDepartment),
    enabled: !!selectedDepartment
  });



  // ðŸ”¹ Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeacherNames,
  });

  // Fetch Payroll Settings
  const { data: payrollSettings } = useQuery({
    queryKey: ["payrollSettings"],
    queryFn: getPayrollSettings,
  });

  // Update Payroll Settings
  const updateSettingsMutation = useMutation({
    mutationFn: updatePayrollSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(["payrollSettings"]);
      toast({ title: "Settings updated successfully" });
      setSettingsOpen(false);
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const handleUpdateSettings = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      absentDeduction: parseFloat(formData.get("absentDeduction")),
      leaveDeduction: parseFloat(formData.get("leaveDeduction")),
      leavesAllowed: parseInt(formData.get("leavesAllowed")),
      absentsAllowed: parseInt(formData.get("absentsAllowed")),
    };
    updateSettingsMutation.mutate(data);
  };

  // ðŸ”¹ Add department
  const addDeptMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast({ title: "Department added successfully" });
      setDeptOpen(false);
      setDeptFormData({
        id: "",
        departmentName: "",
        headOfDepartment: "",
        description: "",
      });
    },
    onError: (err) => toast({ title: err.message })
  });

  // ðŸ”¹ Update department
  const updateDeptMutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast({ title: "Department updated successfully" });
      setDeptOpen(false);
    },
  });

  // ðŸ”¹ Delete department
  const deleteDeptMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast({ title: "Department deleted successfully" });
    },
  });

  // add employees
  const updateEmployee = useMutation({
    mutationFn: ({ id, payload }) => updateEmp(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast({ title: "employee updated successfully" });
      setEmployeeOpen(false)
      setEmployeeFormData({
        name: "",
        fatherName: "",
        cnic: "",
        contactNumber: "",
        email: "",
        address: "",
        designation: "",
        empDepartment: "",
        employmentType: "PERMANENT",
        status: "ACTIVE",
        basicPay: 0,
        joinDate: new Date().toISOString().split("T")[0],
        leaveDate: "",
        contractStart: "",
        contractEnd: "",
        photo: null
      });
    },
    onError: (err) => toast({ title: err.message })
  });

  const addEmployee = useMutation({
    mutationFn: createEmp,
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast({ title: "employee added successfully" });
      setEmployeeOpen(false)
      setEmployeeFormData({
        name: "",
        fatherName: "",
        cnic: "",
        contactNumber: "",
        email: "",
        designation: "",
        empDepartment: "",
        employmentType: "PERMANENT",
        status: "ACTIVE",
        basicPay: 0,
        joinDate: new Date().toISOString().split("T")[0],
        leaveDate: "",
        contractStart: "",
        contractEnd: "",
        photo: null
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: deleteEmp,
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      toast({ title: "Employee deleted successfully" });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const deleteEmployee = (id) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const handleAddEmployee = () => {
    const required = ["name", "fatherName", "cnic", "contactNumber"];
    if (required.some(field => !employeeFormData[field])) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const payload = new FormData();
    payload.append("name", employeeFormData.name);
    payload.append("fatherName", employeeFormData.fatherName);
    payload.append("cnic", employeeFormData.cnic);
    payload.append("contactNumber", employeeFormData.contactNumber);
    payload.append("email", employeeFormData.email || "");
    payload.append("address", employeeFormData.address || "");
    payload.append("designation", employeeFormData.designation);
    payload.append("empDepartment", employeeFormData.empDepartment);
    payload.append("staffType", employeeFormData.staffType);
    payload.append("status", editingEmployee?.status || "ACTIVE");
    payload.append("basicPay", employeeFormData.basicPay);
    payload.append("joinDate", employeeFormData.joinDate || "");
    payload.append("contractStart", employeeFormData.contractStart || "");
    payload.append("contractEnd", employeeFormData.contractEnd || "");
    if (employeeFormData.leaveDate) payload.append("leaveDate", employeeFormData.leaveDate);
    if (employeeFormData.photo) payload.append("photo", employeeFormData.photo);


    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, payload });
      toast({ title: "Employee updated successfully" });
    } else {
      addEmployee.mutate(payload);
    }

    setEmployeeOpen(false);
    setEditingEmployee(null);
    setEmployeeFormData({
      name: "", fatherName: "", cnic: "", contactNumber: "", email: "", address: "",
      designation: "", empDepartment: "", staffType: "PERMANENT", status: "ACTIVE",
      basicPay: 0, joinDate: new Date().toISOString().split("T")[0], leaveDate: "",
      contractStart: "", contractEnd: "", photo: null
    });
  };

  // Advance Salary Queries
  const { data: advanceSalaries = [] } = useQuery({
    queryKey: ["advanceSalaries", advanceRoleFilter],
    queryFn: () => getAdvanceSalaries(undefined, advanceRoleFilter),
  });

  const createAdvanceMutation = useMutation({
    mutationFn: createAdvanceSalary,
    onSuccess: () => {
      queryClient.invalidateQueries(["advanceSalaries"]);
      toast({ title: "Advance salary created successfully" });
      setAdvanceOpen(false);
      setAdvanceFormData({
        staffId: "",
        month: new Date().toISOString().slice(0, 7),
        amount: 0,
        remarks: "",
        adjusted: false
      });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const updateAdvanceMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAdvanceSalary(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["advanceSalaries"]);
      toast({ title: "Advance salary updated successfully" });
      setAdvanceOpen(false);
      setEditingAdvance(null);
      setAdvanceFormData({
        staffId: "",
        month: new Date().toISOString().slice(0, 7),
        amount: 0,
        remarks: "",
        adjusted: false
      });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const deleteAdvanceMutation = useMutation({
    mutationFn: deleteAdvanceSalary,
    onSuccess: () => {
      queryClient.invalidateQueries(["advanceSalaries"]);
      toast({ title: "Advance salary deleted successfully" });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const handleAddAdvance = () => {
    if (!advanceFormData.staffId || !advanceFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    const payload = {
      staffId: Number(advanceFormData.staffId),
      month: advanceFormData.month,
      amount: parseFloat(advanceFormData.amount),
      remarks: advanceFormData.remarks,
      adjusted: advanceFormData.adjusted // Include adjusted status
    };
    if (editingAdvance) {
      updateAdvanceMutation.mutate({ id: editingAdvance.id, payload });
    } else {
      createAdvanceMutation.mutate(payload);
    }
  };
  // 4. ADD handleEditAdvance (add this after handleAddAdvance)
  const handleEditAdvance = (advance) => {
    setEditingAdvance(advance);
    setAdvanceFormData({
      staffId: advance.staffId.toString(),
      month: advance.month,
      amount: advance.amount,
      remarks: advance.remarks || "",
      adjusted: advance.adjusted
    });
    setAdvanceOpen(true);
  };

  const handleAddLeave = () => {
    if (!leaveFormData.employeeId || !leaveFormData.reason) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    addLeaveRequest({
      employeeId: leaveFormData.employeeId,
      leaveType: leaveFormData.leaveType,
      startDate: leaveFormData.startDate,
      endDate: leaveFormData.endDate,
      reason: leaveFormData.reason,
      status: "pending"
    });
    toast({
      title: "Leave request submitted"
    });
    setLeaveOpen(false);
    setLeaveFormData({
      employeeId: "",
      leaveType: "casual",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: ""
    });
  };

  const handleAddDepartment = () => {
    if (!deptFormData.departmentName) {
      toast({
        title: "Please enter department name",
        variant: "destructive",
      });
      return;
    }
    addDeptMutation.mutate(deptFormData);
  };

  const handleUpdateDepartment = (depID) => {
    if (!deptFormData.departmentName) {
      toast({
        title: "Please enter department name",
        variant: "destructive",
      });
      return;
    }
    updateDeptMutation.mutate({ depID, data: deptFormData });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" />
              HR & Payroll Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage employees, payroll, attendance, and leaves
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="advance">Advance Salary</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Leaves Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <LeavesManagementDialog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Payroll Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <PayrollManagementDialog open={true} onOpenChange={() => { }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle>Staff Attendance</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Load staff, mark each status, then save attendance for the selected date.</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        className="w-[160px]"
                        value={staffAttendanceDate}
                        onChange={(e) => {
                          setStaffAttendanceDate(e.target.value);
                          setStaffAttendanceChanges({});
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Role</Label>
                      <Select value={staffAttendanceRole} onValueChange={(value) => {
                        setStaffAttendanceRole(value);
                        setStaffAttendanceChanges({});
                      }}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem>
                          <SelectItem value="teaching">Teaching</SelectItem>
                          <SelectItem value="non-teaching">Non-Teaching</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={() => refetchStaffAttendance()} disabled={staffAttendanceLoading}>
                      {staffAttendanceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Fetch Staff
                    </Button>
                    <Button onClick={handleSaveStaffAttendance} disabled={!staffAttendanceRows.length || staffAttendanceLoading}>
                      Save Attendance
                    </Button>
                    <Button variant="outline" onClick={handleMarkStaffHoliday} disabled={!staffAttendanceDate || staffAttendanceLoading}>
                      Mark as Holiday
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleMarkAllStaff("present")} disabled={!staffAttendanceRows.length}>Mark All Present</Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAllStaff("absent")} disabled={!staffAttendanceRows.length}>Mark All Absent</Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAllStaff("leave")} disabled={!staffAttendanceRows.length}>Mark All Leave</Button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 px-3 text-sm">Staff Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Role / Department</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Marked At</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Marked By</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffAttendanceLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading staff...</TableCell>
                        </TableRow>
                      ) : staffAttendanceRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Select filters to load staff, mark attendance, then save.</TableCell>
                        </TableRow>
                      ) : (
                        staffAttendanceRows.map((row) => {
                          const s = row.staff || row;
                          const changed = staffAttendanceChanges[row.staffId || s.id];
                          const currentStatus = (typeof changed === "string" ? changed : changed?.status) || row.status?.toLowerCase();
                          const currentLeaveType = (typeof changed === "object" && changed !== null ? changed.leaveType : undefined)
                            || String(row.leaveType || "CASUAL").toLowerCase();
                          const isLocked = isStaffAttendanceLocked(row);
                          const auditLines = [];
                          if (row.generatedAt) auditLines.push(`Generated: ${new Date(row.generatedAt).toLocaleString()}`);
                          if (row.markedAt) {
                            const markerName = row.admin?.name || (row.markedBy ? `User #${row.markedBy}` : "Unknown");
                            auditLines.push(`Marked: ${new Date(row.markedAt).toLocaleString()}`);
                            auditLines.push(`Marked by: ${markerName}`);
                          }
                          const markedByName = row.admin?.name || (row.markedBy ? `User #${row.markedBy}` : "-");
                          const roleLabel = s.isTeaching && s.isNonTeaching ? "Dual" : s.isTeaching ? "Teaching" : "Non-Teaching";
                          const deptLabel = s.department?.name || s.empDepartment || s.designation || s.specialization || "-";
                          const leaveBalance = staffLeaveBalanceById[row.staffId || s.id];

                          return (
                            <TableRow key={row.staffId || s.id} className={isLocked ? "opacity-80" : ""}>
                              <TableCell className="py-2 px-3 text-sm font-medium">{s.name}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <div>{roleLabel}</div>
                                <div className="text-xs text-muted-foreground">{deptLabel}</div>
                                <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                                  <Badge variant="outline" className="font-normal">C {leaveBalance?.CASUAL?.taken ?? 0}/{leaveBalance?.CASUAL?.allowed ?? 0}</Badge>
                                  <Badge variant="outline" className="font-normal">S {leaveBalance?.SICK?.taken ?? 0}/{leaveBalance?.SICK?.allowed ?? 0}</Badge>
                                  <Badge variant="outline" className="font-normal">A {leaveBalance?.ANNUAL?.taken ?? 0}/{leaveBalance?.ANNUAL?.allowed ?? 0}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                  {currentStatus ? (
                                    <Badge variant={currentStatus === "present" ? "default" : currentStatus === "absent" ? "destructive" : "secondary"}>
                                      {currentStatus.replace("_", " ").toUpperCase()}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Not Marked</span>
                                  )}
                                  {isLocked && (
                                    <Tooltip>
                                      <TooltipTrigger asChild><LockKeyhole className="w-3.5 h-3.5 text-amber-500 cursor-help" /></TooltipTrigger>
                                      <TooltipContent className="text-xs max-w-[240px] whitespace-pre-line">Locked - attendance can only be modified within 24 hours.{auditLines.length ? `\n${auditLines.join('\n')}` : ""}</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3 text-sm text-muted-foreground">
                                {row.markedAt ? new Date(row.markedAt).toLocaleString() : "-"}
                              </TableCell>
                              <TableCell className="py-2 px-3 text-sm text-muted-foreground">
                                {row.markedAt ? markedByName : "-"}
                              </TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant={currentStatus === "present" ? "default" : "outline"} disabled={isLocked} onClick={() => setStaffAttendanceStatus(row.staffId || s.id, "present")}><CheckCircle2 className="w-4 h-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isLocked ? "Locked - 24h window has passed" : "Mark Present"}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant={currentStatus === "absent" ? "destructive" : "outline"} disabled={isLocked} onClick={() => setStaffAttendanceStatus(row.staffId || s.id, "absent")}><XCircle className="w-4 h-4" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isLocked ? "Locked - 24h window has passed" : "Mark Absent"}</TooltipContent>
                                  </Tooltip>
                                  <Popover
                                    open={leaveTypePopover.staffId === (row.staffId || s.id)}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        openLeaveTypePicker(row, s);
                                      } else {
                                        closeLeaveTypePicker();
                                      }
                                    }}
                                  >
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                          <Button size="sm" variant={currentStatus === "leave" ? "secondary" : "outline"} disabled={isLocked}>
                                            <Clock className="w-4 h-4" />
                                          </Button>
                                        </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>{isLocked ? "Locked - 24h window has passed" : "Mark Leave (Select Type)"}</TooltipContent>
                                    </Tooltip>
                                    <PopoverContent side="right" align="start" className="w-64 p-3 space-y-2">
                                      <p className="text-xs text-muted-foreground">Choose leave type for {s.name}</p>
                                      <Select
                                        value={leaveTypePopover.leaveType}
                                        onValueChange={(value) => setLeaveTypePopover((prev) => ({ ...prev, leaveType: value }))}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="casual">Casual</SelectItem>
                                          <SelectItem value="sick">Sick</SelectItem>
                                          <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={closeLeaveTypePicker}>Cancel</Button>
                                        <Button size="sm" onClick={confirmLeaveTypePicker}>Set Leave</Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="sm" variant={currentStatus === "half_day" ? "secondary" : "outline"} disabled={isLocked} onClick={() => setStaffAttendanceStatus(row.staffId || s.id, "half_day")}>1/2</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isLocked ? "Locked - 24h window has passed" : "Mark Half Day"}</TooltipContent>
                                  </Tooltip>
                                  {currentStatus === "leave" && <Badge variant="outline">{String(currentLeaveType || "casual").toUpperCase()}</Badge>}
                                  {currentStatus === "leave" && !!row.leaveReason && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs max-w-[260px] whitespace-pre-line">
                                        {`Leave reason: ${row.leaveReason}${row.leaveStartDate && row.leaveEndDate ? `\nPeriod: ${new Date(row.leaveStartDate).toLocaleDateString()} - ${new Date(row.leaveEndDate).toLocaleDateString()}` : ""}`}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Advance Salary</CardTitle>
                    <p className="text-sm text-muted-foreground">Manage advance salary requests for all staff</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="hidden sm:inline">Role:</Label>
                      <Select value={advanceRoleFilter} onValueChange={setAdvanceRoleFilter}>
                        <SelectTrigger className="w-32 sm:w-40">
                          <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem>
                          <SelectItem value="teacher">Teachers</SelectItem>
                          <SelectItem value="employee">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => setAdvanceOpen(true)}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add Advance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 px-3 text-sm">Staff Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Role / Designation</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Month</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Amount</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Remarks</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Adjusted</TableHead>
                        <TableHead className="py-2 px-3 text-sm text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advanceSalaries?.map(advance => (
                        <TableRow key={advance.id}>
                          <TableCell className="py-2 px-3 text-sm font-medium">{advance.staff?.name || "N/A"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="text-xs">
                              {advance.staff?.isTeaching ?
                                (advance.staff?.specialization ? `Teacher (${advance.staff?.specialization})` : 'Teacher') :
                                (advance.staff?.designation || "Staff")}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">{advance.month}</TableCell>
                          <TableCell className="py-2 px-3 text-sm font-semibold text-primary">PKR {Number(advance.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="py-2 px-3 text-sm max-w-[200px]">
                            <div className="truncate">{advance.remarks || "-"}</div>
                            <div className="mt-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="text-xs whitespace-pre-line max-w-[320px]">
                                  {(() => {
                                    const events = Array.isArray(advance.actionAudit) ? advance.actionAudit : [];
                                    if (!events.length) return "No audit yet";
                                    return events
                                      .slice(-4)
                                      .reverse()
                                      .map((e) => `${e.action || "UPDATED"} - ${e.byName || "System"} - ${e.at ? new Date(e.at).toLocaleString() : ""}`)
                                      .join("\n");
                                  })()}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {advance.adjusted ? (
                              <div className="space-y-1">
                                <Badge variant="default" className="bg-green-600">Adjusted</Badge>
                                {getPayrollAdjustedMeta(advance) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="cursor-help">
                                        Adjusted via payroll ({formatPayrollMonthLabel(getPayrollAdjustedMeta(advance).month)})
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">
                                      {`By ${getPayrollAdjustedMeta(advance).by}${getPayrollAdjustedMeta(advance).at ? ` on ${getPayrollAdjustedMeta(advance).at}` : ""}`}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm text-right">
                            <div className="flex justify-end space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => handleEditAdvance(advance)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                                    if (confirm("Are you sure you want to delete this record?")) {
                                      deleteAdvanceMutation.mutate(advance.id);
                                    }
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!advanceSalaries || advanceSalaries.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="py-2 px-3 text-sm text-center text-muted-foreground italic">
                            No advance salary records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Department Management</CardTitle>
                  <Button onClick={() => {
                    setEditingDepartment(null);
                    setDeptFormData({
                      id: "",
                      departmentName: "",
                      headOfDepartment: "",
                      description: ""
                    });
                    setDeptOpen(true);
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 px-3 text-sm">Department Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Head of Department</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map(dept => {
                        return (
                          <TableRow key={dept.id}>
                            <TableCell className="py-2 px-3 text-sm font-medium">{dept.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{dept.hod?.name || "N/A"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{dept.description}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline"
                                      onClick={() => {
                                        setEditingDepartment(dept);
                                        setDeptFormData({
                                          id: dept.id,
                                          departmentName: dept.name,
                                          headOfDepartment: dept.hod?.id,
                                          description: dept.description
                                        });
                                        setDeptOpen(true);
                                      }}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="destructive"
                                      onClick={() => deleteDeptMutation.mutate(dept.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <CardTitle>Holiday Calendar</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={String(holidayFilter.month)} onValueChange={v => setHolidayFilter(f => ({ ...f, month: Number(v) }))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <SelectItem key={m} value={String(m)}>{format(new Date(2000, m - 1), "MMMM")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-24" value={holidayFilter.year} onChange={e => setHolidayFilter(f => ({ ...f, year: Number(e.target.value) }))} />
                    <Select value={calendarClassId} onValueChange={handleCalendarClassChange}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {allCalendarClasses.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.programName} - {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {calendarSections.length > 0 && (
                      <Select value={calendarSectionId} onValueChange={setCalendarSectionId}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All Sections" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          {calendarSections.map(s => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before first day */}
                  {Array.from({ length: calendarGrid.firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: calendarGrid.daysInMonth }, (_, i) => i + 1).map(day => {
                    const isHoliday = calendarGrid.holidayDates.has(day);
                    const holiday = calendarGrid.holidayMap[day];
                    const isSkip = isHoliday && holiday?._type === 'skip';
                    return (
                      <div
                        key={day}
                        onClick={() => isHoliday && setUndoHolidayDialog(holiday)}
                        className={`relative rounded-lg border text-center py-2 px-1 text-sm transition-colors select-none
                          ${isSkip
                            ? "bg-orange-100 border-orange-300 text-orange-700 cursor-pointer hover:bg-orange-200 font-semibold"
                            : isHoliday
                            ? "bg-red-100 border-red-300 text-red-700 cursor-pointer hover:bg-red-200 font-semibold"
                            : "border-muted text-foreground"
                          }`}
                        title={isHoliday ? `${holiday.title} â€” click to remove` : undefined}
                      >
                        <span>{day}</span>
                        {isHoliday && (
                          <span className={`block text-[9px] leading-tight truncate mt-0.5 ${isSkip ? "text-orange-600" : "text-red-600"}`}>{holiday.title}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-red-200 border border-red-300" />
                    Global holiday
                  </span>
                  {calendarClassId && calendarClassId !== "all" && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded bg-orange-200 border border-orange-300" />
                      Class holiday
                    </span>
                  )}
                  <span className="text-muted-foreground/60">Click a highlighted day to remove</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle>HR Reports</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Unified reports for leaves, payroll, advance salary, attendance, and departments.</p>
                  </div>
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="space-y-1">
                      <Label>Report Month</Label>
                      <Input type="month" className="w-[160px]" value={reportsMonth} onChange={(e) => setReportsMonth(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Attendance Date</Label>
                      <Input type="date" className="w-[160px]" value={reportsDate} onChange={(e) => setReportsDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <ModernChartCard title="Leave Status" subtitle="Monthly distribution" empty={!reportsAnalytics?.leaveStatus?.length}>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={reportsAnalytics?.leaveStatus || []} dataKey="value" nameKey="name" innerRadius={46} outerRadius={78}>
                            {(reportsAnalytics?.leaveStatus || []).map((item, i) => (
                              <Cell key={`${item.name}-${i}`} fill={[MODERN_CHART_COLORS.warning, MODERN_CHART_COLORS.success, MODERN_CHART_COLORS.danger][i % 3]} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<ModernTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ModernChartCard>
                  <ModernChartCard title="Payroll Settlement" subtitle="Paid vs unpaid" empty={!reportsAnalytics?.payrollStatus?.length}>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportsAnalytics?.payrollStatus || []}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RechartsTooltip content={<ModernTooltip />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {(reportsAnalytics?.payrollStatus || []).map((item, i) => (
                              <Cell key={`${item.name}-${i}`} fill={item.name === "PAID" ? MODERN_CHART_COLORS.success : MODERN_CHART_COLORS.warning} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ModernChartCard>
                  <ModernChartCard title="Department Staff Mix" subtitle="Active staff count by department" empty={!reportsAnalytics?.departmentDistribution?.length}>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportsAnalytics?.departmentDistribution || []}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={52} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <RechartsTooltip content={<ModernTooltip />} />
                          <Bar dataKey="value" fill={MODERN_CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ModernChartCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending Leaves</p><p className="text-2xl font-bold">{reportsSummary.leavesPending}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Payroll Paid</p><p className="text-2xl font-bold">{reportsSummary.payrollPaid}/{reportsSummary.payrollTotal}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending Advances</p><p className="text-2xl font-bold">{reportsSummary.advancePending}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Attendance Marked</p><p className="text-2xl font-bold">{reportsSummary.attendanceMarked}</p></CardContent></Card>
                  <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Departments</p><p className="text-2xl font-bold">{reportsDepartments.length}</p></CardContent></Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Leaves Report</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Type</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {reportsLeavesLoading ? <TableRow><TableCell colSpan={4} className="text-center py-6">Loading...</TableCell></TableRow> : reportsLeaves.slice(0, 8).map((row, idx) => (
                              <TableRow key={`${row.leaveId ?? row.id}-${idx}`}>
                                <TableCell className="text-sm">{row.name}</TableCell>
                                <TableCell className="text-sm">{row.leaveType || "-"}</TableCell>
                                <TableCell className="text-sm">{row.days ?? "-"}</TableCell>
                                <TableCell className="text-sm"><Badge variant={row.status === "APPROVED" ? "default" : row.status === "REJECTED" ? "destructive" : "secondary"}>{row.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                            {!reportsLeavesLoading && reportsLeaves.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No leave records for selected month</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Payroll Report</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Monthly Payroll</p><p className="text-lg font-semibold">PKR {Math.round(payrollSummary.total).toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Basic</p><p className="text-lg font-semibold">PKR {Math.round(payrollSummary.totalBasic).toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Allowances</p><p className="text-lg font-semibold text-green-600">PKR {Math.round(payrollSummary.totalAllowances).toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Deductions</p><p className="text-lg font-semibold text-red-600">PKR {Math.round(payrollSummary.totalDeductions).toLocaleString()}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Paid / Unpaid</p><p className="text-lg font-semibold">{Math.round(payrollSummary.paid).toLocaleString()} / {Math.round(payrollSummary.unpaid).toLocaleString()}</p></CardContent></Card>
                      </div>
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Net Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {reportsPayrollLoading ? <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow> : reportsPayroll.slice(0, 8).map((row, idx) => (
                              <TableRow key={`${row.id}-${idx}`}>
                                <TableCell className="text-sm">{row.name || row.staffName || "N/A"}</TableCell>
                                <TableCell className="text-sm font-medium">PKR {Number(row.netSalary || 0).toLocaleString()}</TableCell>
                                <TableCell className="text-sm"><Badge variant={row.status === "PAID" ? "default" : "outline"}>{row.status || "UNPAID"}</Badge></TableCell>
                              </TableRow>
                            ))}
                            {!reportsPayrollLoading && reportsPayroll.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No payroll records for selected month</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Advance Salary Report</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Amount</TableHead><TableHead>Adjusted</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {reportsAdvanceLoading ? <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow> : reportsAdvance.slice(0, 8).map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="text-sm">{row.staff?.name || "N/A"}</TableCell>
                                <TableCell className="text-sm font-medium">PKR {Number(row.amount || 0).toLocaleString()}</TableCell>
                                <TableCell className="text-sm">
                                  {row.adjusted ? (
                                    <div className="space-y-1">
                                      <Badge variant="default">Adjusted</Badge>
                                      {getPayrollAdjustedMeta(row) && (
                                        <Badge variant="outline">Via payroll ({formatPayrollMonthLabel(getPayrollAdjustedMeta(row).month)})</Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="secondary">Pending</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!reportsAdvanceLoading && reportsAdvance.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No advance records for selected month</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Staff Attendance Report</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Staff</p><p className="text-xl font-semibold">{staffStats.total}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Teaching</p><p className="text-xl font-semibold">{staffStats.teaching}</p></CardContent></Card>
                        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Non-Teaching</p><p className="text-xl font-semibold">{staffStats.nonTeaching}</p></CardContent></Card>
                      </div>
                      <div className="overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Status</TableHead><TableHead>Marked At</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {reportsStaffAttendanceLoading ? <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow> : reportsStaffAttendance.slice(0, 8).map((row) => {
                              const att = row.attendance?.[0];
                              const status = att?.status?.toLowerCase();
                              return (
                                <TableRow key={row.id}>
                                  <TableCell className="text-sm">{row.name}</TableCell>
                                  <TableCell className="text-sm">
                                    {status ? <Badge variant={status === "present" ? "default" : status === "absent" ? "destructive" : "secondary"}>{status.toUpperCase()}</Badge> : <span className="text-muted-foreground">Not Marked</span>}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{att?.markedAt ? new Date(att.markedAt).toLocaleString() : "-"}</TableCell>
                                </TableRow>
                              );
                            })}
                            {!reportsStaffAttendanceLoading && reportsStaffAttendance.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No staff records for selected date</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Departments Report</CardTitle></CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Departments</p><p className="text-xl font-semibold">{departments.length}</p></CardContent></Card>
                    </div>
                    <div className="overflow-x-auto border rounded-md">
                      <Table>
                        <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Head</TableHead><TableHead>Staff Count</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {reportsDepartmentsLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-6">Loading...</TableCell></TableRow>
                          ) : reportsDepartments.map((dept) => (
                            <TableRow key={dept.id}>
                              <TableCell className="text-sm font-medium">{dept.name}</TableCell>
                              <TableCell className="text-sm">{dept.hodName}</TableCell>
                              <TableCell className="text-sm">{dept.staffCount}</TableCell>
                            </TableRow>
                          ))}
                          {!reportsDepartmentsLoading && reportsDepartments.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No departments found</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>



      {/* Payroll Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payroll Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Absent Deduction (PKR)</Label>
                <Input
                  name="absentDeduction"
                  type="number"
                  defaultValue={payrollSettings?.absentDeduction || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Leave Deduction (PKR)</Label>
                <Input
                  name="leaveDeduction"
                  type="number"
                  defaultValue={payrollSettings?.leaveDeduction || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Allowed Leaves (Per Month)</Label>
                <Input
                  name="leavesAllowed"
                  type="number"
                  defaultValue={payrollSettings?.leavesAllowed || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Allowed Absents (Per Month)</Label>
                <Input
                  name="absentsAllowed"
                  type="number"
                  defaultValue={payrollSettings?.absentsAllowed || 0}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={advanceOpen} onOpenChange={(val) => {
        setAdvanceOpen(val);
        if (!val) {
          setEditingAdvance(null);
          setAdvanceStaffSearch("");
          setAdvanceComboOpen(false);
          setAdvanceFormData({
            staffId: "",
            month: new Date().toISOString().slice(0, 7),
            amount: 0,
            remarks: "",
            adjusted: false
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAdvance ? "Edit Advance Salary" : "Add Advance Salary"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">Select Staff Member *</Label>
              <Popover open={advanceComboOpen} onOpenChange={setAdvanceComboOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={advanceFormData.staffId ? "" : "text-muted-foreground"}>
                      {advanceFormData.staffId ? (() => { const found = advanceStaffOptions.find(s => s.id.toString() === advanceFormData.staffId); return found ? found.label : "Select staff member"; })() : "Select staff member"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search staff..."
                      value={advanceStaffSearch}
                      onValueChange={setAdvanceStaffSearch}
                    />
                    <CommandEmpty>No staff found</CommandEmpty>
                    <CommandList>
                      {advanceStaffOptions.filter(s => s.searchText.includes((advanceStaffSearch || "").toLowerCase())).map(staff => (
                          <CommandItem
                            key={staff.id}
                            value={staff.id.toString()}
                            className="cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
                            onSelect={() => {
                              setAdvanceFormData({ ...advanceFormData, staffId: staff.id.toString() });
                              setAdvanceStaffSearch("");
                              setAdvanceComboOpen(false);
                            }}
                          >
                            {staff.label}
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="mb-2 block">Month *</Label>
              <Input
                type="month"
                value={advanceFormData.month}
                onChange={e => setAdvanceFormData({
                  ...advanceFormData,
                  month: e.target.value
                })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Amount (PKR) *</Label>
              <Input
                type="number"
                value={advanceFormData.amount}
                onChange={e => setAdvanceFormData({
                  ...advanceFormData,
                  amount: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Remarks</Label>
              <Textarea
                placeholder="Optional remarks..."
                value={advanceFormData.remarks}
                onChange={e => setAdvanceFormData({
                  ...advanceFormData,
                  remarks: e.target.value
                })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="adjusted"
                className="h-4 w-4 rounded border-gray-300"
                checked={advanceFormData.adjusted || false}
                onChange={e => setAdvanceFormData({
                  ...advanceFormData,
                  adjusted: e.target.checked
                })}
              />
              <Label htmlFor="adjusted" className="cursor-pointer font-medium text-sm">Mark as Adjusted (Deducted from payroll)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdvance}>
              {editingAdvance ? "Update Advance" : "Save Advance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Employee</Label>
              <Select value={leaveFormData.employeeId} onValueChange={value => setLeaveFormData({
                ...leaveFormData,
                employeeId: value
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select value={leaveFormData.leaveType} onValueChange={value => setLeaveFormData({
                ...leaveFormData,
                leaveType: value
              })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={leaveFormData.startDate} onChange={e => setLeaveFormData({
                ...leaveFormData,
                startDate: e.target.value
              })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={leaveFormData.endDate} onChange={e => setLeaveFormData({
                ...leaveFormData,
                endDate: e.target.value
              })} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={leaveFormData.reason} onChange={e => setLeaveFormData({
                ...leaveFormData,
                reason: e.target.value
              })} />
            </div>
          </div>
          <Button onClick={handleAddLeave}>Submit Leave Request</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Holiday</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateHoliday} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                required
                value={holidayFormData.title}
                onChange={e => setHolidayFormData({ ...holidayFormData, title: e.target.value })}
                placeholder="e.g., Independence Day"
              />
            </div>
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {holidayFormData.date?.from ? (
                      holidayFormData.date.to ? (
                        <>
                          {format(holidayFormData.date.from, "PPP")} -{" "}
                          {format(holidayFormData.date.to, "PPP")}
                        </>
                      ) : (
                        format(holidayFormData.date.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={holidayFormData.date}
                    onSelect={date => setHolidayFormData({ ...holidayFormData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={holidayFormData.type}
                onValueChange={value => setHolidayFormData({ ...holidayFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National</SelectItem>
                  <SelectItem value="Religious">Religious</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="repeatYearly"
                className="h-4 w-4 rounded border-gray-300"
                checked={holidayFormData.repeatYearly}
                onChange={e => setHolidayFormData({ ...holidayFormData, repeatYearly: e.target.checked })}
              />
              <Label htmlFor="repeatYearly">Repeat Yearly</Label>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={holidayFormData.description}
                onChange={e => setHolidayFormData({ ...holidayFormData, description: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">Create Holiday</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Update Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department Name *</Label>
              <Input
                value={deptFormData.departmentName}
                onChange={e =>
                  setDeptFormData({
                    ...deptFormData,
                    departmentName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Head of Department</Label>
              <select
                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deptFormData.headOfDepartment || ""}
                onChange={e =>
                  setDeptFormData({
                    ...deptFormData,
                    headOfDepartment: e.target.value,
                  })
                }
              >
                <option value="">Select HOD</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {t.specialization || "N/A"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={deptFormData.description}
                onChange={e =>
                  setDeptFormData({
                    ...deptFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <Button onClick={editingDepartment ? () => handleUpdateDepartment(deptFormData.id) : handleAddDepartment}>
            {editingDepartment ? "Update Department" : "Add Department"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={viewEmployeeOpen} onOpenChange={setViewEmployeeOpen}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {viewEmployee && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="payroll">Payroll History</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage className="object-cover" src={viewEmployee.photo_url} alt={viewEmployee.name} />
                    <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary uppercase">
                      {viewEmployee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold">{viewEmployee.name}</h3>
                        <p className="text-muted-foreground">{viewEmployee.fatherName ? `s/o ${viewEmployee.fatherName}` : ""}</p>
                      </div>
                      <Badge variant={viewEmployee.status === "ACTIVE" ? "default" : "destructive"}>
                        {viewEmployee.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <p className="text-muted-foreground"><span className="font-medium text-foreground">Email:</span> {viewEmployee.email || "N/A"}</p>
                      <p className="text-muted-foreground"><span className="font-medium text-foreground">CNIC:</span> {viewEmployee.cnic}</p>
                      <p className="text-muted-foreground"><span className="font-medium text-foreground">Phone:</span> {viewEmployee.phone || viewEmployee.contactNumber || "N/A"}</p>
                      <p className="text-muted-foreground"><span className="font-medium text-foreground">Department:</span> {viewEmployee.empDepartment}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Employment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium uppercase">{viewEmployee.staffType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Designation:</span>
                        <span className="font-medium">{viewEmployee.designation}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Basic Pay:</span>
                        <span className="font-medium">PKR {viewEmployee.basicPay ? parseFloat(viewEmployee.basicPay).toLocaleString() : "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Join Date:</span>
                        <span className="font-medium">{viewEmployee.joinDate ? format(new Date(viewEmployee.joinDate), "PPP") : "N/A"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={viewEmployee.employmentType === "CONTRACT" ? "bg-primary/5 border-border" : "bg-green-50/30 border-green-100"}>
                    <CardHeader className="py-3">
                      <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${viewEmployee.staffType === "CONTRACT" ? "text-primary" : "text-green-700"}`}>
                        {viewEmployee.staffType === "CONTRACT" ? <CalendarIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {viewEmployee.staffType === "CONTRACT" ? "Contract Information" : "Tenure Information"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {viewEmployee.staffType === "CONTRACT" ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">{viewEmployee.contractStart ? format(new Date(viewEmployee.contractStart), "PPP") : "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">End Date:</span>
                            <span className="font-medium">{viewEmployee.contractEnd ? format(new Date(viewEmployee.contractEnd), "PPP") : "N/A"}</span>
                          </div>
                          <div className="pt-2 border-t border-border flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Contract Duration:</span>
                            <span className="text-lg font-bold text-primary">
                              {calculateDuration(viewEmployee.contractStart, viewEmployee.contractEnd)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Join Date:</span>
                            <span className="font-medium">{viewEmployee.joinDate ? format(new Date(viewEmployee.joinDate), "PPP") : "N/A"}</span>
                          </div>
                          <div className="pt-2 border-t border-green-100 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Service:</span>
                            <span className="text-lg font-bold text-green-700">
                              {calculateDuration(viewEmployee.joinDate)}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Address
                  </h4>
                  <p className="text-sm">{viewEmployee.address || "No address provided."}</p>
                </div>
              </TabsContent>

              <TabsContent value="payroll" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Payroll History</h3>
                  <Input
                    type="month"
                    className="w-auto"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>

                {payrollHistoryLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Month</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Basic Salary</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Allowances</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Deductions</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Net Salary</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeePayrollHistory
                          .filter(p => p.id === viewEmployee.id)
                          .map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="py-2 px-3 text-sm">{format(new Date(selectedMonth), "MMMM yyyy")}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{p.basicSalary.toLocaleString()}</TableCell>
                              <TableCell className="py-2 px-3 text-sm text-green-600">+{p.totalAllowances.toLocaleString()}</TableCell>
                              <TableCell className="py-2 px-3 text-sm text-red-600">-{p.totalDeductions.toLocaleString()}</TableCell>
                              <TableCell className="py-2 px-3 text-sm font-bold">{p.netSalary.toLocaleString()}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <Badge variant={p.status === "PAID" ? "default" : "outline"}>{p.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        {employeePayrollHistory.filter(p => p.id === viewEmployee.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="py-2 px-3 text-sm text-center text-muted-foreground">
                              No payroll record found for selected month
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Attendance Summary</h3>
                  <Input
                    type="month"
                    className="w-auto"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>

                {attendanceSummaryLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-green-50 border-green-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{employeeAttendanceSummary?.present || 0}</div>
                        <div className="text-sm text-green-600">Present</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{employeeAttendanceSummary?.absent || 0}</div>
                        <div className="text-sm text-red-600">Absent</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-700">{employeeAttendanceSummary?.leaves || 0}</div>
                        <div className="text-sm text-orange-600">Leaves</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-100">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-700">{employeeAttendanceSummary?.late || 0}</div>
                        <div className="text-sm text-blue-600">Late</div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setViewEmployeeOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
        <DialogContent className="max-w-fit max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee ID Card</DialogTitle>
          </DialogHeader>
          <div className="">
            {selectedEmployee && idCardTemplate && (
              <div
                className="id-card-print-area text-black"
                dangerouslySetInnerHTML={{
                  __html: idCardTemplate
                    .replace(/{{name}}/g, selectedEmployee.name)
                    .replace(/{{fatherName}}/g, selectedEmployee.fatherName || "")
                    .replace(/{{designation}}/g, selectedEmployee.designation || "EMPLOYEE")
                    .replace(/{{emporteacher}}/g, "EMPLOYEE")
                    .replace(/{{employeeId}}/g, selectedEmployee.id)
                    .replace(/{{phone}}/g, selectedEmployee.phone || selectedEmployee.contactNumber || "")
                    .replace(/{{email}}/g, selectedEmployee.email || "")
                    .replace(/{{department}}/g, selectedEmployee.empDepartment || "")
                    .replace(/{{issueDate}}/g, new Date().toLocaleDateString())
                    .replace(/{{dob}}/g, "")
                    .replace(/{{cnic}}/g, selectedEmployee.cnic || "")
                    .replace(/{{bloodGroup}}/g, "")
                    .replace(/{{address}}/g, selectedEmployee.address || "")
                }}
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIdCardOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              const printContent = document.querySelector('.id-card-print-area').innerHTML;
              const printWindow = window.open('', '', 'height=800,width=800');

              printWindow.document.write('<html><head><title>Print ID Card</title>');
              // Copy styles from the current document.
              Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(style => {
                printWindow.document.head.appendChild(style.cloneNode(true));
              });
              printWindow.document.write(`
            <style>
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body {margin: 0; padding: 0; }
            </style>
            `);
              printWindow.document.write('</head><body>');
              printWindow.document.write(printContent);
              printWindow.document.write('</body></html>');
              printWindow.document.close();
              printWindow.focus();
              // Wait for images to load (heuristic)
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 500);
            }}>Print ID Card</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Holiday remove confirmation + undo */}
      {undoHolidayDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-popover border rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <p className="text-sm font-medium">Remove holiday <span className="font-bold">"{undoHolidayDialog.title}"</span> on {format(new Date(undoHolidayDialog.date), "PPP")}?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUndoHolidayDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleRemoveHoliday(undoHolidayDialog)} disabled={deleteHolidayMutation.isPending || deleteSkipMutation.isPending}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Undo pill after holiday removal */}
      {lastRemovedHoliday && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50 px-4">
          <div className="pointer-events-auto flex items-center gap-3 bg-popover border shadow-lg rounded-2xl px-4 py-3 text-sm max-w-full">
            <span className="text-foreground font-medium truncate">Holiday "{lastRemovedHoliday.title}" removed</span>
            <Button size="sm" variant="secondary" className="h-7 px-3 text-xs shrink-0" onClick={async () => {
              try {
                await createHoliday({ title: lastRemovedHoliday.title, date: lastRemovedHoliday.date, type: lastRemovedHoliday.type || "National", repeatYearly: lastRemovedHoliday.repeatYearly || false });
                queryClient.invalidateQueries({ queryKey: ["holidays"] });
                setLastRemovedHoliday(null);
              } catch (e) {
                toast({ title: "Failed to restore holiday", variant: "destructive" });
              }
            }}>Undo</Button>
            <button onClick={() => setLastRemovedHoliday(null)} className="text-muted-foreground hover:text-foreground shrink-0">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </DashboardLayout >
  );
};

export default HRPayroll;




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
import { useState } from "react";
import { UserPlus, Edit, Trash2, DollarSign, Calendar as CalendarIcon, CheckCircle2, XCircle, TrendingUp, Users, IdCard, Settings, UserCheck, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, createDepartment, deleteDepartment, updateDepartment, getTeacherNames, createEmp, getEmp, updateEmp, deleteEmp, getEmployeesByDept, getPayrollSettings, updatePayrollSettings, getEmployeeAttendance, markEmployeeAttendance, createHoliday, getHolidays, deleteHoliday, createAdvanceSalary, getAdvanceSalaries, deleteAdvanceSalary, updateAdvanceSalary, getDefaultStaffIDCardTemplate, getAttendanceSummary, getPayrollSheet } from "../../config/apis";
import { Loader2 } from "lucide-react";
import { calculateDuration } from "../lib/dateUtils";

const HRPayroll = () => {
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("employees");
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
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [idCardTemplate, setIdCardTemplate] = useState("");
  const [viewEmployeeOpen, setViewEmployeeOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

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

  // Attendance Queries
  const { data: attendanceEmployees = [] } = useQuery({
    queryKey: ["employees", selectedDepartment],
    queryFn: () => getEmp(selectedDepartment === "ALL" ? "" : selectedDepartment),
  });

  const { data: employeeAttendance = [], isFetching: attendanceLoading } = useQuery({
    queryKey: ["employeeAttendance", selectedDate],
    queryFn: () => getEmployeeAttendance(selectedDate),
  });

  const queryClient = useQueryClient();

  const markAttendanceMutation = useMutation({
    mutationFn: ({ id, status, date }) => markEmployeeAttendance({ employeeId: id, status, date, markedBy: 1 }), // Assuming admin ID 1 for now
    onSuccess: (savedRecord) => {
      queryClient.setQueryData(["employeeAttendance", selectedDate], (oldData) => {
        if (!oldData) return [savedRecord];

        const existingIndex = oldData.findIndex(r => r.employeeId === savedRecord.employeeId);

        if (existingIndex > -1) {
          const newData = [...oldData];
          newData[existingIndex] = savedRecord;
          return newData;
        } else {
          return [...oldData, savedRecord];
        }
      });
      toast({
        title: "Attendance Marked",
        description: "Employee attendance has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleMarkAttendance = (id, status) => {
    markAttendanceMutation.mutate({
      id,
      status,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  };

  const markAllPresent = () => {
    attendanceEmployees.filter(e => e.status === "ACTIVE").forEach(emp => {
      const record = employeeAttendance.find(a => a.employeeId === emp.id);
      if (!record || record.status !== "PRESENT") {
        handleMarkAttendance(emp.id, "PRESENT");
      }
    });
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
    employmentType: "PERMANENT",
    status: "ACTIVE",
    joinDate: new Date().toISOString().split("T")[0],
    leaveDate: "",
    contractStart: "",
    contractEnd: "",
    photo: null,
  });

  const [advanceFormData, setAdvanceFormData] = useState({
    type: "employee",  // NEW: Add type selection
    employeeId: "",
    teacherId: "",     // NEW: Add teacherId field
    month: new Date().toISOString().slice(0, 7),
    amount: 0,
    remarks: ""
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

  const [holidayOpen, setHolidayOpen] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    title: "",
    date: new Date(),
    type: "National",
    repeatYearly: false,
    description: ""
  });

  // Holiday Queries
  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  });

  const createHolidayMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries(["holidays"]);
      toast({ title: "Holiday created successfully" });
      setHolidayOpen(false);
      setHolidayFormData({
        title: "",
        date: new Date(),
        type: "National",
        repeatYearly: false,
        description: ""
      });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries(["holidays"]);
      toast({ title: "Holiday deleted successfully" });
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" })
  });

  const handleCreateHoliday = (e) => {
    e.preventDefault();
    createHolidayMutation.mutate(holidayFormData);
  };

  // fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", selectedDepartment],
    queryFn: () => getEmp(selectedDepartment === "ALL" ? "" : selectedDepartment),
    enabled: !!selectedDepartment
  });



  // 🔹 Fetch departments
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

  // 🔹 Add department
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

  // 🔹 Update department
  const updateDeptMutation = useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(["departments"]);
      toast({ title: "Department updated successfully" });
      setDeptOpen(false);
    },
  });

  // 🔹 Delete department
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
    payload.append("employmentType", employeeFormData.employmentType);
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
      designation: "", empDepartment: "", employmentType: "PERMANENT", status: "ACTIVE",
      basicPay: 0, joinDate: new Date().toISOString().split("T")[0], leaveDate: "",
      contractStart: "", contractEnd: "", photo: null
    });
  };

  // Advance Salary Queries
  const { data: advanceSalaries = [] } = useQuery({
    queryKey: ["advanceSalaries"],
    queryFn: () => getAdvanceSalaries(),
  });

  const createAdvanceMutation = useMutation({
    mutationFn: createAdvanceSalary,
    onSuccess: () => {
      queryClient.invalidateQueries(["advanceSalaries"]);
      toast({ title: "Advance salary created successfully" });
      setAdvanceOpen(false);
      setAdvanceFormData({
        type: "employee",
        employeeId: "",
        teacherId: "",
        month: new Date().toISOString().slice(0, 7),
        amount: 0,
        remarks: ""
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
        type: "employee",
        employeeId: "",
        teacherId: "",
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
    const staffId = advanceFormData.type === "employee" ? advanceFormData.employeeId : advanceFormData.teacherId;
    if (!staffId || !advanceFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    const payload = {
      employeeId: advanceFormData.type === "employee" ? Number(advanceFormData.employeeId) : null,
      teacherId: advanceFormData.type === "teacher" ? Number(advanceFormData.teacherId) : null,
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
      type: advance.employeeId ? "employee" : "teacher",
      employeeId: advance.employeeId ? advance.employeeId.toString() : "",
      teacherId: advance.teacherId ? advance.teacherId.toString() : "",
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
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <h2 className="text-2xl font-bold mb-2">HR & Payroll Management</h2>
          <p className="text-primary-foreground/90">
            Manage employees, payroll, attendance, and leaves
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.filter(e => e.status === "ACTIVE").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {employees.reduce((sum, e) => sum + (e.status === "ACTIVE" ? Number(e.basicPay) : 0), 0)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="advance">Advance Salary</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Attendance
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {format(selectedDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          if (d) setSelectedDate(d);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {empDepts.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={markAllPresent}>Mark All Present</Button>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceEmployees.filter(e => e.status === "ACTIVE").map((employee) => {
                        const record = employeeAttendance.find(a => a.employeeId === employee.id);
                        return (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">{employee.empDepartment}</p>
                              </div>
                            </TableCell>
                            <TableCell>{employee.designation}</TableCell>
                            <TableCell>
                              {record ? (
                                <Badge
                                  variant={
                                    record.status === "PRESENT" ? "default" :
                                      record.status === "ABSENT" ? "destructive" :
                                        record.status === "LEAVE" ? "secondary" : "outline"
                                  }
                                >
                                  {record.status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">Not Marked</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={record?.status === "PRESENT" ? "default" : "outline"}
                                  onClick={() => handleMarkAttendance(employee.id, "PRESENT")}
                                  title="Present"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={record?.status === "ABSENT" ? "destructive" : "outline"}
                                  onClick={() => handleMarkAttendance(employee.id, "ABSENT")}
                                  title="Absent"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={record?.status === "LEAVE" ? "secondary" : "outline"}
                                  onClick={() => handleMarkAttendance(employee.id, "LEAVE")}
                                  title="Leave"
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Employee Management</CardTitle>
                  <Button onClick={() => setEmployeeOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      {empDepts.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>CNIC</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Basic Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees?.map(employee => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarImage className="object-cover" src={employee.photo_url} alt={employee.name} />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {employee.name}
                            </div>
                          </TableCell>
                          <TableCell>{employee.cnic}</TableCell>
                          <TableCell>{employee.fatherName}</TableCell>
                          <TableCell>{employee.designation}</TableCell>
                          <TableCell>{employee.empDepartment}</TableCell>
                          <TableCell>PKR {employee.basicPay ? Number(employee.basicPay).toLocaleString() : '0'}</TableCell>
                          <TableCell>
                            <Badge variant={employee.status === "ACTIVE" ? "default" : "destructive"}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setViewEmployee(employee);
                                setViewEmployeeOpen(true);
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                handleIDCardPreview(employee);
                              }}>
                                <IdCard className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline"
                                onClick={() => {
                                  setEditingEmployee(employee);
                                  setEmployeeFormData({
                                    name: employee.name || "",
                                    fatherName: employee.fatherName || "",
                                    cnic: employee.cnic || "",
                                    contactNumber: employee.phone || "",
                                    email: employee.email || "",
                                    address: employee.address || "",
                                    designation: employee.designation || "",
                                    empDepartment: employee.empDepartment || "",
                                    employmentType: employee.employmentType || "PERMANENT",
                                    status: employee.status || "ACTIVE",
                                    basicPay: employee.basicPay,
                                    joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split("T")[0] : "",
                                    leaveDate: employee.leaveDate ? new Date(employee.leaveDate).toISOString().split("T")[0] : "",
                                    contractStart: employee.contractStart ? new Date(employee.contractStart).toISOString().split("T")[0] : "",
                                    contractEnd: employee.contractEnd ? new Date(employee.contractEnd).toISOString().split("T")[0] : "",
                                  });
                                  setEmployeeOpen(true);
                                }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteEmployee(employee.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Leaves Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <LeavesManagementDialog />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Payroll Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <PayrollManagementDialog open={true} onOpenChange={() => { }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Advance Salary</CardTitle>
                  <Button onClick={() => setAdvanceOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Advance
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="employees" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="employees" onClick={() => setAdvanceFormData({ ...advanceFormData, type: "employee" })}>
                      Non-Teaching Staff
                    </TabsTrigger>
                    <TabsTrigger value="teachers" onClick={() => setAdvanceFormData({ ...advanceFormData, type: "teacher" })}>
                      Teachers
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="employees" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead>Adjusted</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {advanceSalaries?.filter(adv => adv.employeeId).map(advance => (
                            <TableRow key={advance.id}>
                              <TableCell>{advance.employee?.name || "N/A"}</TableCell>
                              <TableCell>{advance.employee?.designation || "N/A"}</TableCell>
                              <TableCell>{advance.month}</TableCell>
                              <TableCell>PKR {advance.amount?.toLocaleString()}</TableCell>
                              <TableCell>{advance.remarks || "-"}</TableCell>
                              <TableCell>
                                {advance.adjusted ? (
                                  <Badge variant="default">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditAdvance(advance)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteAdvanceMutation.mutate(advance.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {advanceSalaries?.filter(adv => adv.employeeId).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No advance salaries for employees
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="teachers" className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead>Adjusted</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {advanceSalaries?.filter(adv => adv.teacherId).map(advance => (
                            <TableRow key={advance.id}>
                              <TableCell>{advance.teacher?.name || "N/A"}</TableCell>
                              <TableCell>{advance.teacher?.specialization || "N/A"}</TableCell>
                              <TableCell>{advance.month}</TableCell>
                              <TableCell>PKR {advance.amount?.toLocaleString()}</TableCell>
                              <TableCell>{advance.remarks || "-"}</TableCell>
                              <TableCell>
                                {advance.adjusted ? (
                                  <Badge variant="default">Yes</Badge>
                                ) : (
                                  <Badge variant="secondary">No</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditAdvance(advance)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteAdvanceMutation.mutate(advance.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {advanceSalaries?.filter(adv => adv.teacherId).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No advance salaries for teachers
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
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
                        <TableHead>Department Name</TableHead>
                        <TableHead>Head of Department</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments?.map(dept => {
                        return (
                          <TableRow key={dept.id}>
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell>{dept.hod?.name || "N/A"}</TableCell>
                            <TableCell>{dept.description}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
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
                                <Button size="sm" variant="destructive"
                                  onClick={() => deleteDeptMutation.mutate(dept.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                <div className="flex justify-between items-center">
                  <CardTitle>Holiday Calendar</CardTitle>
                  <Button onClick={() => setHolidayOpen(true)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Add Holiday
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Repeat Yearly</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidays?.map(holiday => (
                        <TableRow key={holiday.id}>
                          <TableCell className="font-medium">{holiday.title}</TableCell>
                          <TableCell>{format(new Date(holiday.date), "PPP")}</TableCell>
                          <TableCell><Badge variant="outline">{holiday.type}</Badge></TableCell>
                          <TableCell>{holiday.repeatYearly ? "Yes" : "No"}</TableCell>
                          <TableCell>{holiday.description}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive"
                              onClick={() => deleteHolidayMutation.mutate(holiday.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>

      {/* Employee Dialog */}
      <Dialog open={employeeOpen} onOpenChange={setEmployeeOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Name */}
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                value={employeeFormData.name}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            {/* Photo */}
            <div>
              <Label>Photo (Max 5MB)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
                      e.target.value = null; // Clear input
                      return;
                    }
                    setEmployeeFormData({ ...employeeFormData, photo: file });
                  }
                }}
              />
            </div>

            {/* Father Name */}
            <div>
              <Label>Father Name <span className="text-red-500">*</span></Label>
              <Input
                value={employeeFormData.fatherName}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, fatherName: e.target.value })}
                placeholder="Ahmed Khan"
              />
            </div>

            {/* CNIC */}
            <div>
              <Label>CNIC <span className="text-red-500">*</span></Label>
              <Input
                value={employeeFormData.cnic}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, cnic: e.target.value })}
                placeholder="35202-1234567-1"
              />
            </div>

            {/* Contact Number */}
            <div>
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input
                value={employeeFormData.contactNumber}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, contactNumber: e.target.value })}
                placeholder="0300-1234567"
              />
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={employeeFormData.email}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-3 xl:col-span-4">
              <Label>Address</Label>
              <Input
                value={employeeFormData.address}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                placeholder="123 Street, Lahore"
              />
            </div>

            {/* Designation */}
            <div>
              <Label>Designation</Label>
              <Input
                value={employeeFormData.designation}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                placeholder="Manager"
              />
            </div>

            {/* Department */}
            <div>
              <Label>Department</Label>
              <Select
                value={employeeFormData.empDepartment}
                onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, empDepartment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                  ].map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employment Type */}
            <div>
              <Label>Employment Type</Label>
              <Select
                value={employeeFormData.employmentType}
                onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, employmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select
                value={employeeFormData.status}
                onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Basic Pay */}
            <div>
              <Label>Basic Pay (PKR)</Label>
              <Input
                type="number"
                value={employeeFormData.basicPay}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, basicPay: parseFloat(e.target.value) })}
                placeholder="30000"
              />
            </div>



            {/* Join Date */}
            <div>
              <Label>Join Date</Label>
              <Input
                type="date"
                value={employeeFormData.joinDate}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, joinDate: e.target.value })}
              />
            </div>

            {/* Contract Dates - Only for CONTRACT staff */}
            {employeeFormData.employmentType === "CONTRACT" && (
              <>
                <div>
                  <Label>Contract Start Date</Label>
                  <Input
                    type="date"
                    value={employeeFormData.contractStart}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, contractStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contract End Date</Label>
                  <Input
                    type="date"
                    value={employeeFormData.contractEnd}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, contractEnd: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Leave Date (Only if status is TERMINATED/RETIRED) */}
            {(employeeFormData.status === "TERMINATED" || employeeFormData.status === "RETIRED") && (
              <div>
                <Label>Leave Date</Label>
                <Input
                  type="date"
                  value={employeeFormData.leaveDate}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, leaveDate: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setEmployeeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>
              {editingEmployee ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdvance ? "Edit Advance Salary" : "Add Advance Salary"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Type</Label>
              <Select
                value={advanceFormData.type}
                onValueChange={value => setAdvanceFormData({
                  ...advanceFormData,
                  type: value,
                  employeeId: "",
                  teacherId: ""
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Non-Teaching Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select {advanceFormData.type === "employee" ? "Employee" : "Teacher"}</Label>
              {advanceFormData.type === "employee" ? (
                <Select
                  value={advanceFormData.employeeId}
                  onValueChange={value => setAdvanceFormData({
                    ...advanceFormData,
                    employeeId: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.filter(e => e.status === "ACTIVE").map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} - {emp.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={advanceFormData.teacherId}
                  onValueChange={value => setAdvanceFormData({
                    ...advanceFormData,
                    teacherId: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.name} - {teacher.specialization || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Month</Label>
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
              <Label>Amount</Label>
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
              <Label>Remarks</Label>
              <Textarea
                value={advanceFormData.remarks}
                onChange={e => setAdvanceFormData({
                  ...advanceFormData,
                  remarks: e.target.value
                })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
            <Label htmlFor="adjusted">Mark as Adjusted (Deducted)</Label>
          </div>
          <Button onClick={handleAddAdvance}>
            {editingAdvance ? "Update Advance" : "Add Advance"}
          </Button>
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
                    {holidayFormData.date ? format(holidayFormData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={holidayFormData.date}
                    onSelect={date => date && setHolidayFormData({ ...holidayFormData, date })}
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
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage className="object-cover" src={viewEmployee.photo_url} alt={viewEmployee.name} />
                    <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary uppercase">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-muted/30">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Employment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium uppercase">{viewEmployee.employmentType}</span>
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

                  <Card className={viewEmployee.employmentType === "CONTRACT" ? "bg-primary/5 border-primary/20" : "bg-green-50/30 border-green-100"}>
                    <CardHeader className="py-3">
                      <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${viewEmployee.employmentType === "CONTRACT" ? "text-primary" : "text-green-700"}`}>
                        {viewEmployee.employmentType === "CONTRACT" ? <CalendarIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {viewEmployee.employmentType === "CONTRACT" ? "Contract Information" : "Tenure Information"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {viewEmployee.employmentType === "CONTRACT" ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-medium">{viewEmployee.contractStart ? format(new Date(viewEmployee.contractStart), "PPP") : "N/A"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">End Date:</span>
                            <span className="font-medium">{viewEmployee.contractEnd ? format(new Date(viewEmployee.contractEnd), "PPP") : "N/A"}</span>
                          </div>
                          <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
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
                          <TableHead>Month</TableHead>
                          <TableHead>Basic Salary</TableHead>
                          <TableHead>Allowances</TableHead>
                          <TableHead>Deductions</TableHead>
                          <TableHead>Net Salary</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeePayrollHistory
                          .filter(p => p.id === viewEmployee.id)
                          .map(p => (
                            <TableRow key={p.id}>
                              <TableCell>{format(new Date(selectedMonth), "MMMM yyyy")}</TableCell>
                              <TableCell>{p.basicSalary.toLocaleString()}</TableCell>
                              <TableCell className="text-green-600">+{p.totalAllowances.toLocaleString()}</TableCell>
                              <TableCell className="text-red-600">-{p.totalDeductions.toLocaleString()}</TableCell>
                              <TableCell className="font-bold">{p.netSalary.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={p.status === "PAID" ? "default" : "outline"}>{p.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        {employeePayrollHistory.filter(p => p.id === viewEmployee.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
    </DashboardLayout >
  );
};

export default HRPayroll;
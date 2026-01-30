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
import { getDepartments, createDepartment, deleteDepartment, updateDepartment, getTeacherNames, createEmp, getEmp, updateEmp, deleteEmp, getEmployeesByDept, getPayrollSettings, updatePayrollSettings, createHoliday, getHolidays, deleteHoliday, createAdvanceSalary, getAdvanceSalaries, deleteAdvanceSalary, updateAdvanceSalary, getDefaultStaffIDCardTemplate, getAttendanceSummary, getPayrollSheet } from "../../config/apis";
import { Loader2 } from "lucide-react";
import { calculateDuration } from "../lib/dateUtils";

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
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [idCardTemplate, setIdCardTemplate] = useState("");
  const [viewEmployeeOpen, setViewEmployeeOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [advanceRoleFilter, setAdvanceRoleFilter] = useState("all");

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

  const queryClient = useQueryClient();


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
    month: "*"
  });
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    title: "",
    date: {
      from: new Date(),
      to: new Date()
    },
    type: "National",
    repeatYearly: false,
    description: ""
  });

  // Holiday Queries
  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays", holidayFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (holidayFilter.year) params.append("year", holidayFilter.year);
      if (holidayFilter.month) params.append("month", holidayFilter.month);
      const res = await api.get(`/hr/holidays?${params.toString()}`);
      return res.data;
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries(["holidays"]);
      toast({ title: "Holiday created successfully" });
      setHolidayOpen(false);
      setHolidayFormData({
        title: "",
        date: {
          from: new Date(),
          to: new Date()
        },
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
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="advance">Advance Salary</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PayrollManagementDialog open={true} onOpenChange={() => { }} />
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
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Role / Designation</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead>Adjusted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advanceSalaries?.map(advance => (
                        <TableRow key={advance.id}>
                          <TableCell className="font-medium">{advance.staff?.name || "N/A"}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {advance.staff?.isTeaching ?
                                (advance.staff?.specialization ? `Teacher (${advance.staff?.specialization})` : 'Teacher') :
                                (advance.staff?.designation || "Staff")}
                            </div>
                          </TableCell>
                          <TableCell>{advance.month}</TableCell>
                          <TableCell className="font-semibold text-primary">PKR {Number(advance.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{advance.remarks || "-"}</TableCell>
                          <TableCell>
                            {advance.adjusted ? (
                              <Badge variant="default" className="bg-green-600">Adjusted</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditAdvance(advance)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                                if (confirm("Are you sure you want to delete this record?")) {
                                  deleteAdvanceMutation.mutate(advance.id);
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!advanceSalaries || advanceSalaries.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
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
                <div className="flex gap-4 mb-4">
                  <div className="w-32">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={holidayFilter.year}
                      onChange={(e) => setHolidayFilter({ ...holidayFilter, year: e.target.value })}
                      placeholder="Year"
                    />
                  </div>
                  <div className="w-48">
                    <Label>Month</Label>
                    <Select
                      value={holidayFilter.month.toString()}
                      onValueChange={(val) => setHolidayFilter({ ...holidayFilter, month: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Months</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {format(new Date(0, m - 1), "MMMM")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
              <Select
                value={advanceFormData.staffId}
                onValueChange={value => setAdvanceFormData({
                  ...advanceFormData,
                  staffId: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ...(employees || []).map(e => ({ ...e, isTeaching: false })),
                    ...(teachers || []).map(t => ({ ...t, isTeaching: true }))
                  ]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(staff => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name} - {staff.isTeaching ? (staff.specialization || "Teacher") : (staff.designation || "Staff")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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

                  <Card className={viewEmployee.employmentType === "CONTRACT" ? "bg-primary/5 border-primary/20" : "bg-green-50/30 border-green-100"}>
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
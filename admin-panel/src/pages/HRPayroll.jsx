import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useState } from "react";
import { UserPlus, Edit, Trash2, DollarSign, Calendar, CheckCircle2, XCircle, TrendingUp, Users, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const HRPayroll = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    payrolls,
    addPayroll,
    updatePayroll,
    deletePayroll,
    advanceSalaries,
    addAdvanceSalary,
    deleteAdvanceSalary,
    employeeAttendance,
    addEmployeeAttendance,
    leaveRequests,
    addLeaveRequest,
    updateLeaveRequest,
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment
  } = useData();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("employees");
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: "",
    fatherName: "",
    cnic: "",
    contactNumber: "",
    email: "",
    designation: "",
    department: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    salary: 0
  });
  const [payrollFormData, setPayrollFormData] = useState({
    employeeId: "",
    month: new Date().toISOString().slice(0, 7),
    bonus: 0,
    deductions: 0
  });
  const [advanceFormData, setAdvanceFormData] = useState({
    employeeId: "",
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
    departmentName: "",
    headOfDepartment: "",
    description: ""
  });
  const filteredEmployees = employees.filter(emp => {
    const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch && emp.status === "active";
  });
  const handleAddEmployee = () => {
    if (!employeeFormData.name || !employeeFormData.cnic || !employeeFormData.contactNumber) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        ...employeeFormData,
        status: editingEmployee.status
      });
      toast({
        title: "Employee updated successfully"
      });
    } else {
      addEmployee({
        ...employeeFormData,
        status: "active"
      });
      toast({
        title: "Employee added successfully"
      });
    }
    setEmployeeOpen(false);
    setEditingEmployee(null);
    setEmployeeFormData({
      name: "",
      fatherName: "",
      cnic: "",
      contactNumber: "",
      email: "",
      designation: "",
      department: "",
      dateOfJoining: new Date().toISOString().split("T")[0],
      salary: 0
    });
  };
  const handleGeneratePayroll = () => {
    if (!payrollFormData.employeeId) {
      toast({
        title: "Please select an employee",
        variant: "destructive"
      });
      return;
    }
    const employee = employees.find(e => e.id === payrollFormData.employeeId);
    if (!employee) return;
    const advance = advanceSalaries.find(a => a.employeeId === payrollFormData.employeeId && a.month === payrollFormData.month && !a.adjusted);
    const advanceAmount = advance?.amount || 0;
    const netSalary = employee.salary + payrollFormData.bonus - payrollFormData.deductions - advanceAmount;
    addPayroll({
      employeeId: payrollFormData.employeeId,
      month: payrollFormData.month,
      basicSalary: employee.salary,
      bonus: payrollFormData.bonus,
      deductions: payrollFormData.deductions,
      advanceSalary: advanceAmount,
      netSalary,
      status: "unpaid"
    });
    toast({
      title: "Payroll generated successfully"
    });
    setPayrollOpen(false);
    setPayrollFormData({
      employeeId: "",
      month: new Date().toISOString().slice(0, 7),
      bonus: 0,
      deductions: 0
    });
  };
  const handleAddAdvance = () => {
    if (!advanceFormData.employeeId || !advanceFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    addAdvanceSalary({
      employeeId: advanceFormData.employeeId,
      month: advanceFormData.month,
      amount: advanceFormData.amount,
      remarks: advanceFormData.remarks,
      adjusted: false
    });
    toast({
      title: "Advance salary recorded"
    });
    setAdvanceOpen(false);
    setAdvanceFormData({
      employeeId: "",
      month: new Date().toISOString().slice(0, 7),
      amount: 0,
      remarks: ""
    });
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
        variant: "destructive"
      });
      return;
    }
    addDepartment(deptFormData);
    toast({
      title: "Department added successfully"
    });
    setDeptOpen(false);
    setDeptFormData({
      departmentName: "",
      headOfDepartment: "",
      description: ""
    });
  };

  // Chart data
  const deptEmployeeData = departments.map(dept => ({
    name: dept.departmentName,
    count: employees.filter(e => e.department === dept.departmentName && e.status === "active").length
  }));
  const salaryData = [{
    range: "< 30k",
    count: employees.filter(e => e.salary < 30000).length
  }, {
    range: "30k-50k",
    count: employees.filter(e => e.salary >= 30000 && e.salary < 50000).length
  }, {
    range: "50k-80k",
    count: employees.filter(e => e.salary >= 50000 && e.salary < 80000).length
  }, {
    range: "> 80k",
    count: employees.filter(e => e.salary >= 80000).length
  }];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];
  return <DashboardLayout>
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
              <div className="text-2xl font-bold">{employees.filter(e => e.status === "active").length}</div>
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
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveRequests.filter(l => l.status === "pending").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {employees.reduce((sum, e) => sum + (e.status === "active" ? e.salary : 0), 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="advance">Advance Salary</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

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
                  <div className="flex-1">
                    <Input placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => <SelectItem key={dept.id} value={dept.departmentName}>
                          {dept.departmentName}
                        </SelectItem>)}
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
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map(employee => <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.cnic}</TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>PKR {employee.salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === "active" ? "default" : "destructive"}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                            setSelectedEmployee(employee);
                            setIdCardOpen(true);
                          }}>
                              <IdCard className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                            setEditingEmployee(employee);
                            setEmployeeFormData(employee);
                            setEmployeeOpen(true);
                          }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteEmployee(employee.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Employees by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deptEmployeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Salary Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={salaryData} cx="50%" cy="50%" labelLine={false} label={entry => `${entry.name}: ${entry.count}`} outerRadius={80} fill="hsl(var(--primary))" dataKey="count">
                        {salaryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Payroll Management</CardTitle>
                  <Button onClick={() => setPayrollOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Generate Payroll
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Advance</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.map(payroll => {
                    const employee = employees.find(e => e.id === payroll.employeeId);
                    return <TableRow key={payroll.id}>
                          <TableCell>{employee?.name}</TableCell>
                          <TableCell>{payroll.month}</TableCell>
                          <TableCell>PKR {payroll.basicSalary.toLocaleString()}</TableCell>
                          <TableCell>PKR {payroll.bonus.toLocaleString()}</TableCell>
                          <TableCell>PKR {payroll.deductions.toLocaleString()}</TableCell>
                          <TableCell>PKR {payroll.advanceSalary.toLocaleString()}</TableCell>
                          <TableCell className="font-bold">PKR {payroll.netSalary.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={payroll.status === "paid" ? "default" : "secondary"}>
                              {payroll.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant={payroll.status === "paid" ? "outline" : "default"} onClick={() => updatePayroll(payroll.id, {
                          ...payroll,
                          status: payroll.status === "paid" ? "unpaid" : "paid"
                        })}>
                              {payroll.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
                            </Button>
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Adjusted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advanceSalaries.map(advance => {
                    const employee = employees.find(e => e.id === advance.employeeId);
                    return <TableRow key={advance.id}>
                          <TableCell>{employee?.name}</TableCell>
                          <TableCell>{advance.month}</TableCell>
                          <TableCell>PKR {advance.amount.toLocaleString()}</TableCell>
                          <TableCell>{advance.remarks}</TableCell>
                          <TableCell>
                            <Badge variant={advance.adjusted ? "default" : "secondary"}>
                              {advance.adjusted ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => deleteAdvanceSalary(advance.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Leave Management</CardTitle>
                  <Button onClick={() => setLeaveOpen(true)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Apply Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map(leave => {
                    const employee = employees.find(e => e.id === leave.employeeId);
                    return <TableRow key={leave.id}>
                          <TableCell>{employee?.name}</TableCell>
                          <TableCell className="capitalize">{leave.leaveType}</TableCell>
                          <TableCell>{leave.startDate}</TableCell>
                          <TableCell>{leave.endDate}</TableCell>
                          <TableCell>{leave.reason}</TableCell>
                          <TableCell>
                            <Badge variant={leave.status === "approved" ? "default" : leave.status === "rejected" ? "destructive" : "secondary"}>
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {leave.status === "pending" && <div className="flex gap-2">
                                <Button size="sm" variant="default" onClick={() => updateLeaveRequest(leave.id, {
                            ...leave,
                            status: "approved",
                            approvedBy: "Admin"
                          })}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateLeaveRequest(leave.id, {
                            ...leave,
                            status: "rejected",
                            approvedBy: "Admin"
                          })}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>}
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Department Management</CardTitle>
                  <Button onClick={() => setDeptOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Head of Department</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map(dept => <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.departmentName}</TableCell>
                        <TableCell>{dept.headOfDepartment}</TableCell>
                        <TableCell>{dept.description}</TableCell>
                        <TableCell>
                          {employees.filter(e => e.department === dept.departmentName && e.status === "active").length}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => deleteDepartment(dept.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={employeeOpen} onOpenChange={setEmployeeOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={employeeFormData.name} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                name: e.target.value
              })} />
              </div>
              <div>
                <Label>Father Name</Label>
                <Input value={employeeFormData.fatherName} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                fatherName: e.target.value
              })} />
              </div>
              <div>
                <Label>CNIC *</Label>
                <Input value={employeeFormData.cnic} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                cnic: e.target.value
              })} />
              </div>
              <div>
                <Label>Contact Number *</Label>
                <Input value={employeeFormData.contactNumber} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                contactNumber: e.target.value
              })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={employeeFormData.email} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                email: e.target.value
              })} />
              </div>
              <div>
                <Label>Designation</Label>
                <Input value={employeeFormData.designation} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                designation: e.target.value
              })} />
              </div>
              <div>
                <Label>Department</Label>
                <Select value={employeeFormData.department} onValueChange={value => setEmployeeFormData({
                ...employeeFormData,
                department: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => <SelectItem key={dept.id} value={dept.departmentName}>
                        {dept.departmentName}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Joining</Label>
                <Input type="date" value={employeeFormData.dateOfJoining} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                dateOfJoining: e.target.value
              })} />
              </div>
              <div>
                <Label>Salary</Label>
                <Input type="number" value={employeeFormData.salary} onChange={e => setEmployeeFormData({
                ...employeeFormData,
                salary: parseFloat(e.target.value) || 0
              })} />
              </div>
            </div>
            <Button onClick={handleAddEmployee}>Save Employee</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Employee</Label>
                <Select value={payrollFormData.employeeId} onValueChange={value => setPayrollFormData({
                ...payrollFormData,
                employeeId: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active").map(emp => <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.designation}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Month</Label>
                <Input type="month" value={payrollFormData.month} onChange={e => setPayrollFormData({
                ...payrollFormData,
                month: e.target.value
              })} />
              </div>
              <div>
                <Label>Bonus</Label>
                <Input type="number" value={payrollFormData.bonus} onChange={e => setPayrollFormData({
                ...payrollFormData,
                bonus: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div>
                <Label>Deductions</Label>
                <Input type="number" value={payrollFormData.deductions} onChange={e => setPayrollFormData({
                ...payrollFormData,
                deductions: parseFloat(e.target.value) || 0
              })} />
              </div>
            </div>
            <Button onClick={handleGeneratePayroll}>Generate Payroll</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Advance Salary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Employee</Label>
                <Select value={advanceFormData.employeeId} onValueChange={value => setAdvanceFormData({
                ...advanceFormData,
                employeeId: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active").map(emp => <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Month</Label>
                <Input type="month" value={advanceFormData.month} onChange={e => setAdvanceFormData({
                ...advanceFormData,
                month: e.target.value
              })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={advanceFormData.amount} onChange={e => setAdvanceFormData({
                ...advanceFormData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={advanceFormData.remarks} onChange={e => setAdvanceFormData({
                ...advanceFormData,
                remarks: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddAdvance}>Add Advance</Button>
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
                    {employees.filter(e => e.status === "active").map(emp => <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>)}
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

        <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Department Name *</Label>
                <Input value={deptFormData.departmentName} onChange={e => setDeptFormData({
                ...deptFormData,
                departmentName: e.target.value
              })} />
              </div>
              <div>
                <Label>Head of Department</Label>
                <Input value={deptFormData.headOfDepartment} onChange={e => setDeptFormData({
                ...deptFormData,
                headOfDepartment: e.target.value
              })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={deptFormData.description} onChange={e => setDeptFormData({
                ...deptFormData,
                description: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddDepartment}>Add Department</Button>
          </DialogContent>
        </Dialog>

        {/* Employee ID Card Dialog */}
        <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Employee ID Card</DialogTitle>
            </DialogHeader>
            {selectedEmployee && <div id="employee-id-card-print" className="border-2 border-primary rounded-xl p-6 bg-gradient-primary text-primary-foreground">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto border-4 border-background">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedEmployee.name}`} alt={selectedEmployee.name} />
                    <AvatarFallback className="text-3xl">{selectedEmployee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">Concordia College</h3>
                    <p className="text-sm opacity-90">Employee ID Card</p>
                  </div>
                  <div className="bg-background/10 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="opacity-90">Name:</span>
                      <span className="font-semibold">{selectedEmployee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">CNIC:</span>
                      <span className="font-semibold">{selectedEmployee.cnic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Designation:</span>
                      <span className="font-semibold">{selectedEmployee.designation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Department:</span>
                      <span className="font-semibold">{selectedEmployee.department}</span>
                    </div>
                  </div>
                </div>
              </div>}
            <Button onClick={() => {
            const printContent = document.getElementById('employee-id-card-print');
            if (printContent) {
              const printWindow = window.open('', '', 'width=800,height=600');
              if (printWindow) {
                printWindow.document.write(`
                    <html>
                      <head>
                        <title>Employee ID Card - ${selectedEmployee?.name}</title>
                        <style>
                          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                          .id-card { border: 2px solid #f97316; border-radius: 12px; padding: 24px; background: linear-gradient(135deg, #f97316, #fb923c); color: white; max-width: 400px; margin: 0 auto; }
                          .text-center { text-align: center; }
                          .avatar { width: 96px; height: 96px; border-radius: 50%; border: 4px solid white; margin: 0 auto 16px; display: block; }
                          h3 { font-size: 24px; margin: 0 0 8px; }
                          p { margin: 0 0 16px; opacity: 0.9; }
                          .info-box { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-top: 16px; }
                          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                          .info-label { opacity: 0.9; }
                          .info-value { font-weight: 600; }
                          @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        ${printContent.innerHTML}
                        <script>
                          window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 100);
                          }
                        </script>
                      </body>
                    </html>
                  `);
                printWindow.document.close();
              }
            }
          }}>Print ID Card</Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default HRPayroll;
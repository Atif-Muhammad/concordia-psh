import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { GraduationCap, PlusCircle, Edit, Trash2, UserCheck, CheckCircle2, XCircle, Clock, CalendarIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeachers,
  createTeacher as createTeacherAPI,
  updateTeacher as updateTeacherAPI,
  deleteTeacher as deleteTeacherAPI,
  getTeacherAttendance,
  markTeacherAttendance,
  getDepartments,
  getAttendanceSummary,
  getPayrollSheet,
} from "../../config/apis";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Teachers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [activeScreen, setActiveScreen] = useState("management");

  // Detail Dialog States
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    highestDegree: "",
    teacherType: "CONTRACT",
    teacherStatus: "ACTIVE",
    departmentId: "",
    basicPay: "",
    documents: {
      bsDegree: false,
      msDegree: false,
      phd: false,
      postDoc: false,
      experienceLetter: false,
      cv: false,
    },
  });

  // Fetch Teachers
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  });

  // Attendance
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: teacherAttendance = [], isFetching: attendanceLoading } = useQuery({
    queryKey: ["teacherAttendance", selectedDate],
    queryFn: () => getTeacherAttendance(selectedDate),
    enabled: !!selectedDate,
  });

  const [attendanceData, setAttendanceData] = useState({});

  // Teacher Detail Data Queries
  const { data: teacherAttendanceSummary = [], isLoading: attendanceSummaryLoading } = useQuery({
    queryKey: ["teacherAttendanceSummary", viewTeacher?.id, selectedMonth],
    queryFn: () => getAttendanceSummary(selectedMonth, viewTeacher.id, "TEACHER"),
    enabled: !!viewTeacher?.id && detailDialogOpen,
  });

  const { data: teacherPayrollHistory = [], isLoading: payrollHistoryLoading } = useQuery({
    queryKey: ["teacherPayrollHistory", selectedMonth],
    queryFn: () => getPayrollSheet(selectedMonth, "teacher"),
    enabled: !!viewTeacher?.id && detailDialogOpen,
  });

  // Mutations
  const createTeacherMutation = useMutation({
    mutationFn: createTeacherAPI,
    onSuccess: () => {
      queryClient.invalidateQueries(["teachers"]);
      toast({ title: "Teacher added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (err) => toast({ title: err.message })
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, data }) => updateTeacherAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["teachers"]);
      toast({ title: "Teacher updated successfully" });
      setOpen(false);
      resetForm();
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: deleteTeacherAPI,
    onSuccess: () => {
      queryClient.invalidateQueries(["teachers"]);
      toast({ title: "Teacher deleted successfully", variant: "destructive" });
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: ({ id, status, date }) => markTeacherAttendance(id, status, date),
    onSuccess: () => {
      queryClient.invalidateQueries(["teacherAttendance"]);
    },
  });

  // Handlers
  const handleMarkAttendance = (id, status) => {
    markAttendanceMutation.mutate({
      id,
      status,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  };

  const markAllPresent = () => {
    teachers.forEach((t) => {
      if (!teacherAttendance.find(a => a.teacherId === t.id)) {
        handleMarkAttendance(t.id, "PRESENT");
      }
    });
  };

  const toggleDocument = (key) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [key]: !prev.documents[key] },
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      specialization: "",
      highestDegree: "",
      teacherType: "CONTRACT",
      teacherStatus: "ACTIVE",
      departmentId: "",
      basicPay: "",
      documents: {
        bsDegree: false,
        msDegree: false,
        phd: false,
        postDoc: false,
        experienceLetter: false,
        cv: false,
      },
    });
    setEditingTeacher(null);
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || "",
      email: teacher.email || "",
      password: "",
      phone: teacher.phone || "",
      specialization: teacher.specialization || "",
      highestDegree: teacher.highestDegree || "",
      teacherType: teacher.teacherType || "CONTRACT",
      teacherStatus: teacher.teacherStatus || "ACTIVE",
      departmentId: teacher.departmentId?.toString() || "",
      basicPay: teacher.basicPay?.toString() || "",
      documents: teacher.documents || {
        bsDegree: false,
        msDegree: false,
        phd: false,
        postDoc: false,
        experienceLetter: false,
        cv: false,
      },
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || (!editingTeacher && !formData.password)) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      specialization: formData.specialization,
      highestDegree: formData.highestDegree,
      teacherType: formData.teacherType,
      teacherStatus: formData.teacherStatus,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      basicPay: formData.basicPay,
      documents: formData.documents,
    };

    if (formData.password) payload.password = formData.password;

    if (editingTeacher) {
      updateTeacherMutation.mutate({ id: editingTeacher.id, data: payload });
    } else {
      createTeacherMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    setTeacherToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) deleteTeacherMutation.mutate(teacherToDelete);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
              {activeScreen === "management" ? "Teacher Management" : "Teacher Attendance"}
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base">
              {activeScreen === "management"
                ? "Manage teachers, departments, and documents"
                : "Mark and track teacher attendance"}
            </p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Button
              variant={activeScreen === "management" ? "default" : "ghost"}
              onClick={() => setActiveScreen("management")}
            >
              <GraduationCap className="w-4 h-4 mr-1" /> Management
            </Button>
            <Button
              variant={activeScreen === "attendance" ? "default" : "ghost"}
              onClick={() => setActiveScreen("attendance")}
            >
              <UserCheck className="w-4 h-4 mr-1" /> Attendance
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeScreen === "management" ? (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Teachers
              </CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <Label>Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label>Email <span className="text-red-500">*</span></Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    {/* Password */}
                    {!editingTeacher && (
                      <div>
                        <Label>Password <span className="text-red-500">*</span></Label>
                        <PasswordInput
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Phone */}
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    {/* Specialization */}
                    <div>
                      <Label>Specialization</Label>
                      <Input
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      />
                    </div>

                    {/* Highest Degree */}
                    <div>
                      <Label>Highest Degree</Label>
                      <Select
                        value={formData.highestDegree}
                        onValueChange={(v) => setFormData({ ...formData, highestDegree: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent>
                          {["FA/FSc", "BA/BSc/BS", "MA/MSc/MS", "PhD", "Postdoc", "Other"].map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Teacher Type */}
                    <div>
                      <Label>Employment Type</Label>
                      <Select
                        value={formData.teacherType}
                        onValueChange={(v) => setFormData({ ...formData, teacherType: v })}
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
                        value={formData.teacherStatus}
                        onValueChange={(v) => setFormData({ ...formData, teacherStatus: v })}
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

                    {/* Department */}
                    <div>
                      <Label>Department</Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">None</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Basic Pay */}
                    <div>
                      <Label>Basic Pay (PKR)</Label>
                      <Input
                        type="number"
                        value={formData.basicPay}
                        onChange={(e) => setFormData({ ...formData, basicPay: e.target.value })}
                        placeholder="0"
                      />
                    </div>


                  </div>

                  {/* Documents */}
                  <div className="mt-6">
                    <Label>Documents</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {[
                        { key: "bsDegree", label: "BS/BSc" },
                        { key: "msDegree", label: "MS/MSc" },
                        { key: "phd", label: "PhD" },
                        { key: "postDoc", label: "Postdoc" },
                        { key: "experienceLetter", label: "Experience" },
                        { key: "cv", label: "CV" },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => toggleDocument(doc.key)}
                          className={`cursor-pointer rounded-lg border p-3 text-center text-sm transition-all ${formData.documents[doc.key]
                            ? "bg-primary text-white border-primary"
                            : "border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                          {doc.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                      {editingTeacher ? "Update" : "Add"} Teacher
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            {/* Table */}
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Basic Pay</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell>{t.phone || "-"}</TableCell>
                        <TableCell>{t.specialization || "-"}</TableCell>
                        <TableCell>{t.highestDegree || "-"}</TableCell>
                        <TableCell>{t.department?.name || "-"}</TableCell>
                        <TableCell>{t.basicPay ? `PKR ${parseFloat(t.basicPay).toLocaleString()}` : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={t.teacherType === "PERMANENT" ? "default" : "secondary"}>
                            {t.teacherType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.teacherStatus === "ACTIVE"
                                ? "default"
                                : t.teacherStatus === "TERMINATED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {t.teacherStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setViewTeacher(t); setDetailDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(t)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
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
        ) : (
          // Attendance Section
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
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        setSelectedDate(d);
                        queryClient.invalidateQueries(["teacherAttendance"]);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={markAllPresent}>Mark All Present</Button>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <p className="text-center py-4">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => {
                      const record = teacherAttendance.find(a => a.teacherId === teacher.id);
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell>{teacher.name}</TableCell>
                          <TableCell>{format(selectedDate, "PPP")}</TableCell>
                          <TableCell>
                            {record ? (
                              <Badge
                                variant={
                                  record.status === "PRESENT" ? "default" :
                                    record.status === "ABSENT" ? "destructive" : "secondary"
                                }
                              >
                                {record.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not Marked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={record?.status === "PRESENT" ? "default" : "outline"}
                                onClick={() => handleMarkAttendance(record.id, "PRESENT")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={record?.status === "ABSENT" ? "destructive" : "outline"}
                                onClick={() => handleMarkAttendance(record.id, "ABSENT")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={record?.status === "LEAVE" ? "secondary" : "outline"}
                                onClick={() => handleMarkAttendance(record.id, "LEAVE")}
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
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View / Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle>Teacher Profile</DialogTitle>
            </DialogHeader>
            {viewTeacher && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll History</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 pt-4">
                  <div className="flex items-start gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary uppercase">
                      {viewTeacher.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold">{viewTeacher.name}</h3>
                      <p className="text-muted-foreground">{viewTeacher.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>{viewTeacher.teacherType}</Badge>
                        <Badge variant={viewTeacher.teacherStatus === "ACTIVE" ? "default" : "destructive"}>
                          {viewTeacher.teacherStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-muted-foreground">Contact</h4>
                      <p>{viewTeacher.phone || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-muted-foreground">Department</h4>
                      <p>{viewTeacher.department?.name || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-muted-foreground">Qualification</h4>
                      <p>{viewTeacher.highestDegree} - {viewTeacher.specialization}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-muted-foreground">Basic Pay</h4>
                      <p>PKR {viewTeacher.basicPay ? parseFloat(viewTeacher.basicPay).toLocaleString() : "0"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">Documents Status</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(viewTeacher.documents || {}).map(([key, present]) => (
                        <div key={key} className={`flex items-center gap-2 p-2 rounded border ${present ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          {present ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Monthly Payroll</h3>
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
                            <TableHead>Basic Pay</TableHead>
                            <TableHead>Allowances</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead>Net Salary</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Filter payroll for this teacher from the monthly sheet */}
                          {teacherPayrollHistory
                            .filter(p => p.id === viewTeacher.id)
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
                          {teacherPayrollHistory.filter(p => p.id === viewTeacher.id).length === 0 && (
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
                    <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="bg-green-50 border-green-100">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-700">{teacherAttendanceSummary?.present || 0}</div>
                            <div className="text-sm text-green-600">Present</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-100">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-700">{teacherAttendanceSummary?.absent || 0}</div>
                            <div className="text-sm text-red-600">Absent</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-100">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-700">{teacherAttendanceSummary?.leaves || 0}</div>
                            <div className="text-sm text-orange-600">Leaves</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-100">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-700">{teacherAttendanceSummary?.late || 0}</div>
                            <div className="text-sm text-blue-600">Late</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Maybe a day-wise list if available later */}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
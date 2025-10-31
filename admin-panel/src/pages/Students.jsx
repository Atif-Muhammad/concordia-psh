import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useData } from "@/contexts/DataContext";
import { useState } from "react";
import { UserPlus, Edit, Trash2, Eye, Award, TrendingUp, TrendingDown, GraduationCap, FileText, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const Students = () => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    fees,
    attendance,
    results,
    exams,
    programs,
    classes,
    sections,
    marks,
    marksheetTemplates,
    config
  } = useData();
  const {
    toast
  } = useToast();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [meritOpen, setMeritOpen] = useState(false);
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [reportCardOpen, setReportCardOpen] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [selectedForPromotion, setSelectedForPromotion] = useState([]);
  const [promotionAction, setPromotionAction] = useState("promote");

  // Merit/Promotion filter states
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");

  // Main listing filters
  const [listFilterProgram, setListFilterProgram] = useState("all");
  const [listFilterClass, setListFilterClass] = useState("all");
  const [listFilterSection, setListFilterSection] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    rollNumber: "",
    program: "HSSC",
    class: "",
    section: "",
    phone: "",
    admissionDate: new Date().toISOString().split("T")[0],
    photo: ""
  });

  // Get available classes based on selected program
  const availableClasses = formData.program ? classes.filter(c => {
    const prog = programs.find(p => p.programName === formData.program);
    return prog && c.programId === prog.id;
  }) : [];

  // Get available sections based on selected class
  const availableSections = formData.class ? sections.filter(s => {
    const cls = availableClasses.find(c => c.className === formData.class);
    return cls && s.classId === cls.id;
  }) : [];

  // Merit list calculation
  const getFilteredStudentsForMerit = () => {
    return students.filter(s => {
      if (filterProgram !== "all" && s.program !== filterProgram) return false;
      if (filterClass !== "all" && s.class !== filterClass) return false;
      if (filterSection !== "all" && s.section !== filterSection) return false;
      return s.status === "active";
    }).map(s => {
      const studentResults = results.filter(r => r.studentId === s.id);
      const avgGPA = studentResults.length > 0 ? studentResults.reduce((sum, r) => sum + r.gpa, 0) / studentResults.length : 0;
      return {
        ...s,
        avgGPA
      };
    }).sort((a, b) => b.avgGPA - a.avgGPA);
  };

  // Get filtered classes for merit/promotion
  const getFilteredClasses = () => {
    if (filterProgram === "all") return [];
    const prog = programs.find(p => p.programName === filterProgram);
    return prog ? classes.filter(c => c.programId === prog.id) : [];
  };
  const getFilteredSections = () => {
    if (filterClass === "all") return [];
    const cls = getFilteredClasses().find(c => c.className === filterClass);
    return cls ? sections.filter(s => s.classId === cls.id) : [];
  };

  // Main listing filtered students
  const getFilteredStudents = () => {
    return students.filter(s => {
      if (listFilterProgram !== "all" && s.program !== listFilterProgram) return false;
      if (listFilterClass !== "all" && s.class !== listFilterClass) return false;
      if (listFilterSection !== "all" && s.section !== listFilterSection) return false;
      return true;
    });
  };
  const handleSubmit = () => {
    if (!formData.name || !formData.rollNumber) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingStudent) {
      updateStudent(editingStudent.id, {
        ...formData,
        status: editingStudent.status
      });
      toast({
        title: "Student updated successfully"
      });
    } else {
      addStudent({
        ...formData,
        status: "active"
      });
      toast({
        title: "Student added successfully"
      });
    }
    setOpen(false);
    resetForm();
  };
  const resetForm = () => {
    setFormData({
      name: "",
      fatherName: "",
      rollNumber: "",
      program: "HSSC",
      class: "",
      section: "",
      phone: "",
      admissionDate: new Date().toISOString().split("T")[0],
      photo: ""
    });
    setEditingStudent(null);
  };
  const handleEdit = student => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      fatherName: student.fatherName,
      rollNumber: student.rollNumber,
      program: student.program,
      class: student.class,
      section: student.section,
      phone: student.phone,
      admissionDate: student.admissionDate,
      photo: student.photo || ""
    });
    setOpen(true);
  };
  const handlePromoteStudents = () => {
    const filteredStudents = students.filter(s => {
      if (filterProgram !== "all" && s.program !== filterProgram) return false;
      if (filterClass !== "all" && s.class !== filterClass) return false;
      if (filterSection !== "all" && s.section !== filterSection) return false;
      return selectedForPromotion.includes(s.id);
    });
    filteredStudents.forEach(student => {
      if (promotionAction === "promote") {
        toast({
          title: `${student.name} promoted`
        });
      } else if (promotionAction === "demote") {
        toast({
          title: `${student.name} demoted`
        });
      } else {
        updateStudent(student.id, {
          status: "passed-out"
        });
        toast({
          title: `${student.name} marked as passed out`
        });
      }
    });
    setPromoteOpen(false);
    setSelectedForPromotion([]);
  };
  const printMeritList = () => {
    const meritStudents = getFilteredStudentsForMerit();
    const filterText = `${filterProgram !== "all" ? filterProgram : "All Programs"} ${filterClass !== "all" ? filterClass : ""} ${filterSection !== "all" ? filterSection : ""}`;
    const printContent = `
      <html>
        <head>
          <title>Merit List</title>
          <style>
            body { font-family: Arial; padding: 40px; }
            h1 { color: #F29200; text-align: center; }
            h3 { text-align: center; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #F29200; color: white; }
            @media print {
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <h1>Merit List</h1>
          <h3>${filterText}</h3>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              ${meritStudents.map((s, idx) => `
                <tr>
                  <td><strong>#${idx + 1}</strong></td>
                  <td>${s.name}</td>
                  <td>${s.rollNumber}</td>
                  <td>${s.class}-${s.section}</td>
                  <td><strong>${s.avgGPA.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };
  const handleDelete = id => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
      toast({
        title: "Student deleted successfully",
        variant: "destructive"
      });
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };
  const getStudentStats = studentId => {
    const studentFees = fees.filter(f => f.studentId === studentId);
    const totalFees = studentFees.reduce((sum, f) => sum + f.amount, 0);
    const paidFees = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const presentDays = studentAttendance.filter(a => a.status === "present").length;
    const attendanceRate = studentAttendance.length > 0 ? (presentDays / studentAttendance.length * 100).toFixed(1) : "0";
    const studentResults = results.filter(r => r.studentId === studentId);
    const avgMarks = studentResults.length > 0 ? (studentResults.reduce((sum, r) => sum + r.obtainedMarks / r.totalMarks * 100, 0) / studentResults.length).toFixed(1) : "N/A";
    return {
      totalFees,
      paidFees,
      attendanceRate,
      avgMarks,
      dueFees: totalFees - paidFees
    };
  };
  const handlePromotion = () => {
    if (selectedForPromotion.length === 0) {
      toast({
        title: "Please select students",
        variant: "destructive"
      });
      return;
    }
    selectedForPromotion.forEach(id => {
      const student = students.find(s => s.id === id);
      if (!student) return;
      if (promotionAction === "promote") {
        // Simple promotion logic - increment class or change status
        updateStudent(id, {
          class: student.class === "XI" ? "XII" : student.class,
          status: "active"
        });
      } else if (promotionAction === "demote") {
        updateStudent(id, {
          class: student.class === "XII" ? "XI" : student.class,
          status: "active"
        });
      } else if (promotionAction === "passout") {
        updateStudent(id, {
          status: "passed-out"
        });
      }
    });
    toast({
      title: `Students ${promotionAction}d successfully`
    });
    setPromoteOpen(false);
    setSelectedForPromotion([]);
  };
  const getMeritList = () => {
    return students.map(s => {
      const stats = getStudentStats(s.id);
      const score = stats.avgMarks !== "N/A" ? parseFloat(stats.avgMarks) : 0;
      return {
        ...s,
        score,
        stats
      };
    }).sort((a, b) => b.score - a.score);
  };
  const activeStudents = students.filter(s => s.status === "active");
  const passedOutStudents = students.filter(s => s.status === "passed-out");
  return <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary rounded-2xl p-4 md:p-6 text-primary-foreground shadow-medium">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Student Management</h2>
              <p className="text-sm md:text-base text-primary-foreground/90">Total Students: {students.length} | Active: {activeStudents.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setMeritOpen(true)} variant="outline" className="gap-2 flex-1 sm:flex-none">
                <Award className="w-4 h-4 md:w-5 md:h-5" /><span className="hidden sm:inline">Merit List</span>
              </Button>
              <Button size="sm" onClick={() => setPromoteOpen(true)} variant="outline" className="gap-2 flex-1 sm:flex-none">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /><span className="hidden sm:inline">Promote</span>
              </Button>
              <Button size="sm" onClick={() => {
              resetForm();
              setOpen(true);
            }} className="gap-2 flex-1 sm:flex-none">
                <UserPlus className="w-4 h-4 md:w-5 md:h-5" /><span className="hidden sm:inline">Add Student</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">HSSC Students</p>
                  <p className="text-2xl font-bold text-primary">{students.filter(s => s.program === "HSSC").length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">BS Students</p>
                  <p className="text-2xl font-bold text-secondary">{students.filter(s => s.program === "BS").length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diploma Students</p>
                  <p className="text-2xl font-bold text-accent">{students.filter(s => s.program === "Diploma").length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passed Out</p>
                  <p className="text-2xl font-bold text-success">{passedOutStudents.length}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label>Filter by Program</Label>
                <Select value={listFilterProgram} onValueChange={setListFilterProgram}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.programName}>{p.programName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={listFilterClass} onValueChange={setListFilterClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {[...new Set(students.map(s => s.class))].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by Section</Label>
                <Select value={listFilterSection} onValueChange={setListFilterSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {[...new Set(students.map(s => s.section))].map(sec => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredStudents().map(student => <TableRow key={student.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell><Badge variant="outline">{student.program}</Badge></TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : student.status === "passed-out" ? "secondary" : "destructive"}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                        setViewStudent(student);
                        setViewOpen(true);
                      }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(student.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                        setViewStudent(student);
                        setIdCardOpen(true);
                      }}>
                          <IdCard className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Student Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              <DialogDescription>Fill in the student information below</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-4">
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label>Father Name</Label>
                <Input value={formData.fatherName} onChange={e => setFormData({
                ...formData,
                fatherName: e.target.value
              })} placeholder="Enter father name" />
              </div>
              <div className="space-y-2">
                <Label>Roll Number *</Label>
                <Input value={formData.rollNumber} onChange={e => setFormData({
                ...formData,
                rollNumber: e.target.value
              })} placeholder="e.g., HSSC-001" />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={formData.program} onValueChange={v => setFormData({
                ...formData,
                program: v
              })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HSSC">HSSC</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="BS">BS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.class} onValueChange={v => setFormData({
                ...formData,
                class: v,
                section: ""
              })} disabled={!formData.program}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(c => <SelectItem key={c.id} value={c.className}>{c.className}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section {availableSections.length > 0 ? "*" : "(Optional)"}</Label>
                <Select value={formData.section} onValueChange={v => setFormData({
                ...formData,
                section: v
              })} disabled={!formData.class || availableSections.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {availableSections.map(s => <SelectItem key={s.id} value={s.sectionName}>{s.sectionName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({
                ...formData,
                phone: e.target.value
              })} placeholder="0300-1234567" />
              </div>
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input type="date" value={formData.admissionDate} onChange={e => setFormData({
                ...formData,
                admissionDate: e.target.value
              })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Photo URL</Label>
                <Input value={formData.photo} onChange={e => setFormData({
                ...formData,
                photo: e.target.value
              })} placeholder="https://example.com/photo.jpg or leave empty for default" />
                {formData.photo && <div className="mt-2">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={formData.photo} alt={formData.name} />
                      <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
              setOpen(false);
              resetForm();
            }}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingStudent ? "Update" : "Add"} Student</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>Complete student information and statistics</DialogDescription>
            </DialogHeader>
            {viewStudent && <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-start gap-6 mb-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={viewStudent.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewStudent.name}`} alt={viewStudent.name} />
                      <AvatarFallback className="text-2xl">{viewStudent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{viewStudent.name}</h3>
                      <p className="text-muted-foreground">{viewStudent.rollNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Name:</span> {viewStudent.name}</div>
                    <div><span className="font-semibold">Roll Number:</span> {viewStudent.rollNumber}</div>
                    <div><span className="font-semibold">Father Name:</span> {viewStudent.fatherName}</div>
                    <div><span className="font-semibold">Program:</span> <Badge>{viewStudent.program}</Badge></div>
                    <div><span className="font-semibold">Class:</span> {viewStudent.class}</div>
                    <div><span className="font-semibold">Section:</span> {viewStudent.section}</div>
                    <div><span className="font-semibold">Phone:</span> {viewStudent.phone}</div>
                    <div><span className="font-semibold">Admission Date:</span> {viewStudent.admissionDate}</div>
                    <div><span className="font-semibold">Status:</span> <Badge variant={viewStudent.status === "active" ? "default" : "secondary"}>{viewStudent.status}</Badge></div>
                  </div>
                </TabsContent>
                <TabsContent value="fees">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Total Fees</p>
                          <p className="text-xl font-bold">PKR {getStudentStats(viewStudent.id).totalFees.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Paid</p>
                          <p className="text-xl font-bold text-success">PKR {getStudentStats(viewStudent.id).paidFees.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">Due</p>
                          <p className="text-xl font-bold text-destructive">PKR {getStudentStats(viewStudent.id).dueFees.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Challan No</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees.filter(f => f.studentId === viewStudent.id).map(fee => <TableRow key={fee.id}>
                            <TableCell>{fee.challanNumber}</TableCell>
                            <TableCell>PKR {fee.amount.toLocaleString()}</TableCell>
                            <TableCell><Badge variant={fee.status === "paid" ? "default" : "destructive"}>{fee.status}</Badge></TableCell>
                            <TableCell>{fee.dueDate}</TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="attendance">
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold text-primary">{getStudentStats(viewStudent.id).attendanceRate}%</p>
                      </CardContent>
                    </Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Class</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.filter(a => a.studentId === viewStudent.id).map(att => <TableRow key={att.id}>
                            <TableCell>{att.date}</TableCell>
                            <TableCell>
                              <Badge variant={att.status === "present" ? "default" : "destructive"}>
                                {att.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{att.class}</TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="results">
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Average Marks</p>
                        <p className="text-2xl font-bold text-primary">{getStudentStats(viewStudent.id).avgMarks}%</p>
                      </CardContent>
                    </Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam ID</TableHead>
                          <TableHead>Obtained Marks</TableHead>
                          <TableHead>Total Marks</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>GPA</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.filter(r => r.studentId === viewStudent.id).map(result => {
                      const exam = exams.find(e => e.id === result.examId);
                      return <TableRow key={result.id}>
                              <TableCell>{exam?.examName || `Exam #${result.examId}`}</TableCell>
                              <TableCell>{result.obtainedMarks}</TableCell>
                              <TableCell>{result.totalMarks}</TableCell>
                              <TableCell>{result.percentage}%</TableCell>
                              <TableCell>{result.gpa}</TableCell>
                              <TableCell><Badge>{result.grade}</Badge></TableCell>
                            </TableRow>;
                    })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>}
          </DialogContent>
        </Dialog>

        {/* Promotion/Demotion Dialog */}
        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Promote/Demote Students</DialogTitle>
              <DialogDescription>Filter and select students to perform action</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(p => <SelectItem key={p.id} value={p.programName}>{p.programName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass} disabled={filterProgram === "all"}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {getFilteredClasses().map(c => <SelectItem key={c.id} value={c.className}>{c.className}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === "all"}>
                    <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {getFilteredSections().map(s => <SelectItem key={s.id} value={s.sectionName}>{s.sectionName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={promotionAction === "promote" ? "default" : "outline"} onClick={() => setPromotionAction("promote")}>
                  <TrendingUp className="w-4 h-4 mr-2" />Promote
                </Button>
                <Button variant={promotionAction === "demote" ? "default" : "outline"} onClick={() => setPromotionAction("demote")}>
                  <TrendingDown className="w-4 h-4 mr-2" />Demote
                </Button>
                <Button variant={promotionAction === "passout" ? "default" : "outline"} onClick={() => setPromotionAction("passout")}>
                  <GraduationCap className="w-4 h-4 mr-2" />Mark as Passed Out
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.filter(s => {
                  if (s.status !== "active") return false;
                  if (filterProgram !== "all" && s.program !== filterProgram) return false;
                  if (filterClass !== "all" && s.class !== filterClass) return false;
                  if (filterSection !== "all" && s.section !== filterSection) return false;
                  return true;
                }).map(student => <TableRow key={student.id}>
                      <TableCell>
                        <input type="checkbox" checked={selectedForPromotion.includes(student.id)} onChange={e => {
                      if (e.target.checked) {
                        setSelectedForPromotion([...selectedForPromotion, student.id]);
                      } else {
                        setSelectedForPromotion(selectedForPromotion.filter(id => id !== student.id));
                      }
                    }} className="w-4 h-4" />
                      </TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.program}</TableCell>
                      <TableCell>{student.class}</TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                setPromoteOpen(false);
                setSelectedForPromotion([]);
              }}>Cancel</Button>
                <Button onClick={handlePromoteStudents}>Apply {promotionAction}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Merit List Dialog */}
        <Dialog open={meritOpen} onOpenChange={setMeritOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Merit List</DialogTitle>
              <DialogDescription>Students ranked by academic performance with filters</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(p => <SelectItem key={p.id} value={p.programName}>{p.programName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass} disabled={filterProgram === "all"}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {getFilteredClasses().map(c => <SelectItem key={c.id} value={c.className}>{c.className}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === "all"}>
                    <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {getFilteredSections().map(s => <SelectItem key={s.id} value={s.sectionName}>{s.sectionName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={printMeritList} variant="outline" className="w-full gap-2">
                    <FileText className="w-4 h-4" />
                    Print Merit List
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>GPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredStudentsForMerit().map((student, idx) => <TableRow key={student.id}>
                      <TableCell>
                        <Badge variant={idx === 0 ? "default" : "outline"}>
                          {idx === 0 && <Award className="w-3 h-3 mr-1" />}
                          #{idx + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell><Badge>{student.program}</Badge></TableCell>
                      <TableCell>{student.class}-{student.section}</TableCell>
                      <TableCell className="font-bold text-primary">{student.avgGPA.toFixed(2)}</TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* ID Card Dialog */}
        <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Student ID Card</DialogTitle>
            </DialogHeader>
            {viewStudent && <div id="student-id-card-print" className="border-2 border-primary rounded-xl p-6 bg-gradient-primary text-primary-foreground">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto border-4 border-background">
                    <AvatarImage src={viewStudent.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewStudent.name}`} alt={viewStudent.name} />
                    <AvatarFallback className="text-3xl">{viewStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">Concordia College</h3>
                    <p className="text-sm opacity-90">Student ID Card</p>
                  </div>
                  <div className="bg-background/10 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="opacity-90">Name:</span>
                      <span className="font-semibold">{viewStudent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Roll No:</span>
                      <span className="font-semibold">{viewStudent.rollNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Program:</span>
                      <span className="font-semibold">{viewStudent.program}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-90">Class:</span>
                      <span className="font-semibold">{viewStudent.class}-{viewStudent.section}</span>
                    </div>
                  </div>
                </div>
              </div>}
            <Button onClick={() => {
            const printContent = document.getElementById('student-id-card-print');
            if (printContent) {
              const printWindow = window.open('', '', 'width=800,height=600');
              if (printWindow) {
                printWindow.document.write(`
                    <html>
                      <head>
                        <title>Student ID Card - ${viewStudent?.name}</title>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>;
};
export default Students;
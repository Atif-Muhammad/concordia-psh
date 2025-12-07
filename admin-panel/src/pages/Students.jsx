// src/pages/Students.jsx
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getProgramNames,
  promoteStudents,
  demoteStudents,
  passoutStudents,
  getPassedOutStudents,
  getStudentFeeHistory
} from "../../config/apis";
import {
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Award,
  TrendingUp,
  TrendingDown,
  GraduationCap,
  FileText,
  IdCard,
  Upload,
  X,
} from "lucide-react";

// Mock data for fees, attendance, results (replace with real APIs later)
const mockFees = [
  { id: 1, studentId: 1, challanNumber: "CH-001", amount: 50000, paidAmount: 30000, status: "partial", dueDate: "2025-12-01" },
  { id: 2, studentId: 1, challanNumber: "CH-002", amount: 50000, paidAmount: 50000, status: "paid", dueDate: "2025-11-01" },
];
const mockAttendance = [
  { id: 1, studentId: 1, date: "2025-11-01", status: "present", class: "XI-A" },
  { id: 2, studentId: 1, date: "2025-11-02", status: "absent", class: "XI-A" },
];
const mockResults = [
  { id: 1, studentId: 1, examId: 1, examName: "Mid Term", obtainedMarks: 420, totalMarks: 500, percentage: 84, gpa: 3.8, grade: "A" },
  { id: 2, studentId: 1, examId: 2, examName: "Final", obtainedMarks: 450, totalMarks: 500, percentage: 90, gpa: 4.0, grade: "A+" },
];

const Students = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ──────────────────────────────────────────────────────────────
  // API Queries
  // ──────────────────────────────────────────────────────────────
  const {
    data: students = [],
    isLoading: loadingStudents,
  } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const { data: programData = [] } = useQuery({
    queryKey: ["programs-with-classes"],
    queryFn: getProgramNames,
  });

  // ──────────────────────────────────────────────────────────────
  // Mutations
  // ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student added successfully" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student updated successfully" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student deleted", variant: "destructive" });
    },
  });
  const bulkPromotionMut = useMutation({
    mutationFn: async ({
      ids,
      action,
    }) => {
      const fn =
        action === "promote"
          ? promoteStudents
          : action === "demote"
            ? demoteStudents
            : passoutStudents;

      const promises = ids.map((id) => fn(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: `Students ${promotionAction}d successfully` });
      setPromoteOpen(false);
      setSelectedForPromotion([]);
    },
    onError: (e) =>
      toast({
        title: "Error",
        description: e.message || "Failed to update students",
        variant: "destructive",
      }),
  });

  // ──────────────────────────────────────────────────────────────
  // UI State
  // ──────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [meritOpen, setMeritOpen] = useState(false);
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [selectedForPromotion, setSelectedForPromotion] = useState([]);
  const [promotionAction, setPromotionAction] = useState("promote");
  const [showPassedOut, setShowPassedOut] = useState(false);
  const [passedOutFilterProgram, setPassedOutFilterProgram] = useState("all");
  const [passedOutFilterClass, setPassedOutFilterClass] = useState("all");
  const [passedOutFilterSection, setPassedOutFilterSection] = useState("all");
  const [selectedFeeSession, setSelectedFeeSession] = useState("current");

  // Fetch student fee history when viewing a student
  const { data: studentFees = [], isLoading: feesLoading } = useQuery({
    queryKey: ["studentFees", viewStudent?.id],
    queryFn: () => getStudentFeeHistory(viewStudent.id),
    enabled: !!viewStudent?.id,
  });

  const {
    data: passedOutStudents = [],
    isLoading: loadingPassedOut,
  } = useQuery({
    queryKey: ["passedOutStudents"],
    queryFn: getPassedOutStudents,
    enabled: showPassedOut,
  });
  // Filters
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [listFilterProgram, setListFilterProgram] = useState("all");
  const [listFilterClass, setListFilterClass] = useState("all");
  const [listFilterSection, setListFilterSection] = useState("all");

  // Form
  const [formData, setFormData] = useState({
    fName: "",
    mName: "",
    lName: "",
    fatherOrguardian: "",
    rollNumber: "",
    parentOrGuardianEmail: "",
    parentOrGuardianPhone: "",
    gender: "",
    dob: "",
    programId: "",
    classId: "",
    sectionId: "",
    documents: {
      formB: false,
      pictures: false,
      dmcMatric: false,
      dmcIntermediate: false,
      fatherCnic: false,
      migration: false,
      affidavit: false,
      admissionForm: false,
    },
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────
  const selectedProgram = programData.find((p) => p.id === Number(formData.programId));
  const selectedClass = selectedProgram?.classes.find((c) => c.id === Number(formData.classId));
  const availableSections = selectedClass?.sections || [];
  const hasSections = availableSections.length > 0;

  const currentYear = new Date().getFullYear();
  const generateRollNumber = () => {
    const prefix = "PSH";
    const year = currentYear.toString().slice(-2);
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `${prefix}/${year}-${randomNum}`;
  };

  const resetForm = () => {
    setFormData({
      fName: "",
      mName: "",
      lName: "",
      fatherOrguardian: "",
      rollNumber: generateRollNumber(),
      parentOrGuardianEmail: "",
      parentOrGuardianPhone: "",
      gender: "",
      dob: "",
      programId: "",
      classId: "",
      sectionId: "",
      documents: {
        formB: false,
        pictures: false,
        dmcMatric: false,
        dmcIntermediate: false,
        fatherCnic: false,
        migration: false,
        affidavit: false,
        admissionForm: false,
      },
    });
    setImageFile(null);
    setImagePreview("");
    setEditingStudent(null);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      fName: student.fName,
      mName: student.mName || "",
      lName: student.lName || "",
      fatherOrguardian: student.fatherOrguardian || "",
      rollNumber: student.rollNumber,
      parentOrGuardianEmail: student.parentOrGuardianEmail || "",
      parentOrGuardianPhone: student.parentOrGuardianPhone || "",
      gender: student.gender || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      programId: student.programId?.toString() || "",
      classId: student.classId.toString(),
      sectionId: student.sectionId?.toString() || "",
      documents: student.documents || {
        formB: false,
        pictures: false,
        dmcMatric: false,
        dmcIntermediate: false,
        fatherCnic: false,
        migration: false,
        affidavit: false,
        admissionForm: false,
      },
    });
    setImagePreview(student.photo_url || "");
    setOpen(true);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleDocument = (key) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [key]: !prev.documents[key] },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.fName || !formData.rollNumber || !formData.classId || !formData.programId) {
      toast({ title: "First Name, Roll #, Class, and Program are required", variant: "destructive" });
      return;
    }

    if (hasSections && !formData.sectionId) {
      toast({ title: "Section is required for this class", variant: "destructive" });
      return;
    }

    if (!imageFile && !editingStudent) {
      toast({ title: "Photo is required", variant: "destructive" });
      return;
    }

    const fd = new FormData();
    fd.append("fName", formData.fName);
    fd.append("mName", formData.mName || "");
    fd.append("lName", formData.lName || "");
    fd.append("fatherOrguardian", formData.fatherOrguardian || "");
    fd.append("rollNumber", formData.rollNumber);
    fd.append("classId", formData.classId);
    fd.append("programId", formData.programId);
    if (formData.parentOrGuardianEmail) fd.append("parentOrGuardianEmail", formData.parentOrGuardianEmail);
    if (formData.parentOrGuardianPhone) fd.append("parentOrGuardianPhone", formData.parentOrGuardianPhone);
    if (formData.gender) fd.append("gender", formData.gender);
    if (formData.dob) fd.append("dob", formData.dob);
    if (formData.sectionId) fd.append("sectionId", formData.sectionId);
    fd.append("photo", imageFile);
    fd.append("documents", JSON.stringify(formData.documents));

    if (editingStudent) {
      updateMut.mutate({ id: editingStudent.id, data: fd });
    } else {
      createMut.mutate(fd);
    }

    setOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (studentToDelete) {
      deleteMut.mutate(studentToDelete);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Cascading Filter Helpers
  // ──────────────────────────────────────────────────────────────
  const getClassesForProgram = (programId) => {
    if (programId === "all") return [];
    const prog = programData.find((p) => p.id === Number(programId));
    return prog?.classes || [];
  };

  const getSectionsForClass = (programId, classId) => {
    if (classId === "all") return [];
    const prog = programData.find((p) => p.id === Number(programId));
    const cls = prog?.classes.find((c) => c.id === Number(classId));
    return cls?.sections || [];
  };

  // ──────────────────────────────────────────────────────────────
  // Filtered Students
  // ──────────────────────────────────────────────────────────────
  const getFilteredStudents = () => {
    return students.filter((s) => {
      if (listFilterProgram !== "all" && s.programId !== Number(listFilterProgram)) return false;
      if (listFilterClass !== "all" && s.classId !== Number(listFilterClass)) return false;
      if (listFilterSection !== "all" && s.sectionId !== Number(listFilterSection)) return false;
      return true;
    });
  };

  const getFilteredStudentsForMerit = () => {
    return students
      .filter((s) => {
        if (filterProgram !== "all" && s.programId !== Number(filterProgram)) return false;
        if (filterClass !== "all" && s.classId !== Number(filterClass)) return false;
        if (filterSection !== "all" && s.sectionId !== Number(filterSection)) return false;
        return true;
      })
      .map((s) => ({ ...s, avgGPA: 3.5 }))
      .sort((a, b) => b.avgGPA - a.avgGPA);
  };

  const getStudentStats = (studentId) => {
    const studentFees = mockFees.filter(f => f.studentId === studentId);
    const totalFees = studentFees.reduce((sum, f) => sum + f.amount, 0);
    const paidFees = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
    const studentAttendance = mockAttendance.filter(a => a.studentId === studentId);
    const presentDays = studentAttendance.filter(a => a.status === "present").length;
    const attendanceRate = studentAttendance.length > 0 ? (presentDays / studentAttendance.length * 100).toFixed(1) : "0";
    const studentResults = mockResults.filter(r => r.studentId === studentId);
    const avgMarks = studentResults.length > 0 ? (studentResults.reduce((sum, r) => sum + r.percentage, 0) / studentResults.length).toFixed(1) : "N/A";
    return {
      totalFees,
      paidFees,
      attendanceRate,
      avgMarks,
      dueFees: totalFees - paidFees
    };
  };

  const processFeesData = () => {
    if (!viewStudent || !studentFees || studentFees.length === 0) {
      return {
        sessions: [],
        overall: { totalFees: 0, totalPaid: 0, totalDues: 0 },
        currentSessionData: null,
        selectedSessionData: null
      };
    }
    // Group challans by session
    const sessionMap = new Map();
    let totalAllSessions = 0;
    let paidAllSessions = 0;
    let duesAllSessions = 0;
    studentFees.forEach(challan => {
      // Determine session key (priority: feeStructure > snapshot > unclassified)
      let sessionKey;
      if (challan.feeStructureId && challan.feeStructure) {
        sessionKey = `structure-${challan.feeStructureId}`;
      } else if (challan.studentClassId && challan.studentProgramId) {
        sessionKey = `snapshot-${challan.studentProgramId}-${challan.studentClassId}`;
      } else {
        sessionKey = 'unclassified';
      }
      if (!sessionMap.has(sessionKey)) {
        // Determine if this is the current session
        const isCurrentSession =
          challan.feeStructure?.classId === viewStudent.classId &&
          challan.feeStructure?.programId === viewStudent.programId;
        sessionMap.set(sessionKey, {
          sessionKey,
          feeStructureId: challan.feeStructureId,
          feeStructure: challan.feeStructure,
          program: challan.feeStructure?.program || challan.studentProgram,
          class: challan.feeStructure?.class || challan.studentClass,
          challans: [],
          isCurrentSession
        });
      }
      sessionMap.get(sessionKey).challans.push(challan);
      // Calculate overall stats
      totalAllSessions += challan.amount || 0;
      paidAllSessions += challan.paidAmount || 0;
      if (challan.status !== 'PAID') {
        duesAllSessions += (challan.amount - challan.paidAmount) || 0;
      }
    });
    // Process each session's statistics
    const sessions = Array.from(sessionMap.values()).map(session => {
      const sessionFee = session.feeStructure?.totalAmount || 0;
      const paidThisSession = session.challans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
      const remainingDues = session.challans
        .filter(c => c.status !== 'PAID')
        .reduce((sum, c) => sum + ((c.amount - c.paidAmount) || 0), 0);
      // Calculate paid installments from coveredInstallments
      let paidInstallments = 0;
      session.challans.filter(c => c.status === 'PAID').forEach(c => {
        if (c.coveredInstallments) {
          const parts = c.coveredInstallments.split('-');
          if (parts.length === 2) {
            paidInstallments = Math.max(paidInstallments, parseInt(parts[1]));
          } else {
            paidInstallments = Math.max(paidInstallments, parseInt(parts[0]));
          }
        } else if (c.installmentNumber) {
          paidInstallments = Math.max(paidInstallments, c.installmentNumber);
        }
      });
      const totalInstallments = session.feeStructure?.installments || session.challans.length;
      // Session label
      const sessionLabel = session.class && session.program
        ? `${session.class.name} - ${session.program.name}`
        : 'Unclassified';
      return {
        ...session,
        sessionLabel,
        stats: {
          sessionFee,
          paidThisSession,
          remainingDues,
          paidInstallments,
          totalInstallments,
          pendingInstallments: totalInstallments - paidInstallments
        }
      };
    });
    // Sort: current first, then others
    sessions.sort((a, b) => {
      if (a.isCurrentSession) return -1;
      if (b.isCurrentSession) return 1;
      return 0;
    });
    const currentSessionData = sessions.find(s => s.isCurrentSession) || null;
    const selectedSessionData = selectedFeeSession === "current"
      ? currentSessionData
      : sessions.find(s => s.sessionKey === selectedFeeSession) || currentSessionData;
    return {
      sessions,
      overall: {
        totalFees: totalAllSessions,
        totalPaid: paidAllSessions,
        totalDues: duesAllSessions
      },
      currentSessionData,
      selectedSessionData
    };
  };
  const feesData = processFeesData();

  const handlePromoteStudents = () => {
    if (selectedForPromotion.length === 0) {
      toast({ title: "Select at least one student", variant: "destructive" });
      return;
    }

    bulkPromotionMut.mutate({
      ids: selectedForPromotion,
      action: promotionAction,
    });
  };

  const printMeritList = () => {
    const merit = getFilteredStudentsForMerit();
    const filterText = filterProgram !== "all"
      ? programData.find((p) => p.id === Number(filterProgram))?.name
      : "All Programs";

    const html = `
      <html><head><title>Merit List</title>
      <style>
        body{font-family:Arial;padding:40px}h1{color:#F29200;text-align:center}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{border:1px solid #ddd;padding:12px;text-align:left}
        th{background:#F29200;color:white}
      </style></head>
      <body><h1>Merit List</h1><h3>${filterText}</h3>
      <table><thead><tr><th>#</th><th>Name</th><th>Roll</th><th>Class</th><th>GPA</th></tr></thead>
      <tbody>${merit
        .map(
          (s, i) => `<tr><td><strong>#${i + 1}</strong></td><td>${s.fName} ${s.mName} ${s.lName}</td><td>${s.rollNumber}</td><td>${programData.flatMap((p) => p.classes).find((c) => c.id === s.classId)?.name}</td><td><strong>${s.avgGPA.toFixed(2)}</strong></td></tr>`
        )
        .join("")}</tbody></table>
      <script>window.onload=()=>{window.print()}</script></body></html>`;
    const win = window.open("", "_blank");
    win?.document.write(html);
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  if (loadingStudents) return <div className="p-8">Loading students...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Student Management</h2>
              <p>Total Students: {students.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={showPassedOut ? "default" : "outline"}
                onClick={() => setShowPassedOut(!showPassedOut)}
                className="gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                {showPassedOut ? "All Students" : "Passed Out"}
              </Button>

              <Button size="sm" onClick={() => setMeritOpen(true)} variant="outline" className="gap-2">
                <Award className="w-4 h-4" /> Merit List
              </Button>
              <Button size="sm" onClick={() => setPromoteOpen(true)} variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" /> Promote
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" /> Add Student
              </Button>
            </div>
          </div>
        </div>



        {/* Main Table */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
              {showPassedOut ? "Passed Out Students" : "All Students"}
              {loadingPassedOut && " (Loading...)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Filters — show for both views */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label>Program</Label>
                <Select
                  value={showPassedOut ? passedOutFilterProgram : listFilterProgram}
                  onValueChange={(v) => {
                    if (showPassedOut) {
                      setPassedOutFilterProgram(v);
                      setPassedOutFilterClass("all");
                      setPassedOutFilterSection("all");
                    } else {
                      setListFilterProgram(v);
                      setListFilterClass("all");
                      setListFilterSection("all");
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programData.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Class</Label>
                <Select
                  value={showPassedOut ? passedOutFilterClass : listFilterClass}
                  onValueChange={(v) => {
                    if (showPassedOut) {
                      setPassedOutFilterClass(v);
                      setPassedOutFilterSection("all");
                    } else {
                      setListFilterClass(v);
                      setListFilterSection("all");
                    }
                  }}
                  disabled={
                    (showPassedOut ? passedOutFilterProgram : listFilterProgram) === "all"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {getClassesForProgram(
                      showPassedOut ? passedOutFilterProgram : listFilterProgram
                    ).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Section</Label>
                <Select
                  value={showPassedOut ? passedOutFilterSection : listFilterSection}
                  onValueChange={(v) =>
                    showPassedOut
                      ? setPassedOutFilterSection(v)
                      : setListFilterSection(v)
                  }
                  disabled={
                    (showPassedOut ? passedOutFilterClass : listFilterClass) === "all"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {getSectionsForClass(
                      showPassedOut ? passedOutFilterProgram : listFilterProgram,
                      showPassedOut ? passedOutFilterClass : listFilterClass
                    ).map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>{showPassedOut ? "Last Class" : "Class"}</TableHead>
                  <TableHead>Section</TableHead>
                  {!showPassedOut && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showPassedOut
                  ? passedOutStudents.filter((s) => {
                    if (passedOutFilterProgram !== "all" && s.programId !== Number(passedOutFilterProgram)) return false;
                    if (passedOutFilterClass !== "all" && s.classId !== Number(passedOutFilterClass)) return false;
                    if (passedOutFilterSection !== "all" && s.sectionId !== Number(passedOutFilterSection)) return false;
                    return true;
                  })
                  : getFilteredStudents()
                ).map((student) => {
                  const prog = programData.find((p) => p.id === student.programId);
                  const cls = prog?.classes.find((c) => c.id === student.classId);
                  const sec = cls?.sections.find((s) => s.id === student.sectionId);

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={student.photo_url} />
                          <AvatarFallback>{student.fName}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.fName} {student.mName} {student.lName}</TableCell>
                      <TableCell><Badge variant="outline">{prog?.name || "-"}</Badge></TableCell>
                      <TableCell>
                        {showPassedOut ? (
                          <Badge variant="secondary">Passed Out</Badge>
                        ) : (
                          cls?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>{sec?.name || <span className="text-muted-foreground">N/A</span>}</TableCell>
                      {!showPassedOut && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setViewOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEdit(student)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setStudentToDelete(student.id); setDeleteDialogOpen(true); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setIdCardOpen(true); }}>
                              <IdCard className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit" : "Add"} Student</DialogTitle>
              <DialogDescription>All fields marked * are required</DialogDescription>
            </DialogHeader>

            {/* Photo */}
            <div className="space-y-2">
              <Label>Photo *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImageDrop}
              >
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="h-32 w-32 rounded-full object-cover mx-auto" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-0 right-0"
                      onClick={() => { setImagePreview(""); setImageFile(null); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2">Drag & drop or click to upload</p>
                    <Input type="file" accept="image/*" className="mt-2" onChange={handleImageChange} />
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.fName}
                  onChange={(e) => setFormData({ ...formData, fName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input
                  value={formData.mName}
                  onChange={(e) => setFormData({ ...formData, mName: e.target.value })}
                  placeholder="Michael"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={formData.lName}
                  onChange={(e) => setFormData({ ...formData, lName: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <div>
                <Label>Father/Guardian</Label>
                <Input
                  value={formData.fatherOrguardian}
                  onChange={(e) => setFormData({ ...formData, fatherOrguardian: e.target.value })}
                  placeholder="father or guardian name..."
                />
              </div>
              <div>
                <Label>Roll Number *</Label>
                <Input
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="PSH/25-001"
                />
              </div>

              <div>
                <Label>Program *</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(v) => setFormData({ ...formData, programId: v, classId: "", sectionId: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                  <SelectContent>
                    {programData.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Class *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(v) => setFormData({ ...formData, classId: v, sectionId: "" })}
                  disabled={!formData.programId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.programId ? "Select Class" : "Pick Program First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProgram?.classes.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Section {hasSections ? "*" : ""}</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(v) => setFormData({ ...formData, sectionId: v })}
                  disabled={!formData.classId || !hasSections}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.classId ? (hasSections ? "Select Section" : "No sections") : "Pick Class First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Parent Email</Label>
                <Input
                  type="email"
                  value={formData.parentOrGuardianEmail}
                  onChange={(e) => setFormData({ ...formData, parentOrGuardianEmail: e.target.value })}
                />
              </div>

              <div>
                <Label>Parent Phone</Label>
                <Input
                  value={formData.parentOrGuardianPhone}
                  onChange={(e) => setFormData({ ...formData, parentOrGuardianPhone: e.target.value })}
                />
              </div>

              <div>
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            {/* Documents */}
            <div className="mt-6">
              <Label>Required Documents</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {[
                  { key: "formB", label: "Form B / Domicile" },
                  { key: "pictures", label: "4 Passport Size Pictures" },
                  { key: "dmcMatric", label: "DMC Matric" },
                  { key: "dmcIntermediate", label: "DMC Intermediate" },
                  { key: "fatherCnic", label: "Father CNIC" },
                  { key: "migration", label: "Migration (if from other board)" },
                  { key: "affidavit", label: "Affidavit" },
                  { key: "admissionForm", label: "Admission Form" },
                ].map((doc) => (
                  <div
                    key={doc.key}
                    onClick={() => toggleDocument(doc.key)}
                    className={`cursor-pointer rounded-lg border p-3 text-sm font-medium flex items-center justify-center transition-all ${formData.documents[doc.key]
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                      : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                  >
                    {doc.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingStudent ? "Update" : "Add"} Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View / Profile Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>Complete student information and statistics</DialogDescription>
            </DialogHeader>
            {viewStudent && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-start gap-6 mb-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={viewStudent.photo_url} />
                      <AvatarFallback>{viewStudent.fName}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{viewStudent.fName} {viewStudent.mName} {viewStudent.lName}</h3>
                      <div className="flex items-center gap-4">
                        <p className="uppercase text-gray-500 tracking-wide text-sm">Father / Guardian:</p>
                        <p className="font-medium text-sm ">{viewStudent.fatherOrguardian}</p>
                      </div>
                      <p className="text-muted-foreground">{viewStudent.rollNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold">Program:</span> {programData.find((p) => p.id === viewStudent.programId)?.name}</div>
                    <div><span className="font-semibold">Class:</span> {programData.flatMap((p) => p.classes).find((c) => c.id === viewStudent.classId)?.name}</div>
                    <div><span className="font-semibold">Section:</span> {programData.flatMap((p) => p.classes).flatMap((c) => c.sections).find((s) => s.id === viewStudent.sectionId)?.name || "N/A"}</div>
                    <div><span className="font-semibold">Parent Email:</span> {viewStudent.parentOrGuardianEmail || "-"}</div>
                    <div><span className="font-semibold">Parent Phone:</span> {viewStudent.parentOrGuardianPhone || "-"}</div>
                    <div><span className="font-semibold">DOB:</span> {viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString() : "-"}</div>
                  </div>

                  {/* Documents */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-3">Required Documents</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: "formB", label: "Form B / Domicile" },
                        { key: "pictures", label: "4 Passport Size Pictures" },
                        { key: "dmcMatric", label: "DMC Matric" },
                        { key: "dmcIntermediate", label: "DMC Intermediate" },
                        { key: "fatherCnic", label: "Father CNIC" },
                        { key: "migration", label: "Migration" },
                        { key: "affidavit", label: "Affidavit" },
                        { key: "admissionForm", label: "Admission Form" },
                      ].map((doc) => {
                        const isSubmitted = viewStudent.documents?.[doc.key] === true;
                        return (
                          <div
                            key={doc.key}
                            className={`rounded-lg border p-3 text-sm font-medium flex items-center justify-center transition-all ${isSubmitted
                              ? "bg-green-600 text-white border-green-600"
                              : "bg-red-50 text-red-700 border-red-300"
                              }`}
                          >
                            {isSubmitted ? "Submitted" : "Missing"} {doc.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fees">
                  {studentFees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-lg text-muted-foreground mb-2">No fee records found</p>
                      <p className="text-sm text-muted-foreground">This student has no fee challans in the system yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Overall Summary */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Overall Summary (All-Time)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Total Fees</p>
                              <p className="text-xl font-bold">PKR {feesData.overall.totalFees.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Total Paid</p>
                              <p className="text-xl font-bold text-green-600">PKR {feesData.overall.totalPaid.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Total Outstanding</p>
                              <p className="text-xl font-bold text-red-600">PKR {feesData.overall.totalDues.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      {/* Session Filter */}
                      <div>
                        <Label>Select Session/Class</Label>
                        <Select value={selectedFeeSession} onValueChange={setSelectedFeeSession}>
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {selectedFeeSession === "current"
                                ? "Current Session"
                                : feesData.sessions.find(s => s.sessionKey === selectedFeeSession)?.sessionLabel || "Select session"
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">Current Session</SelectItem>
                            {feesData.sessions.filter(s => !s.isCurrentSession).map(session => (
                              <SelectItem key={session.sessionKey} value={session.sessionKey}>
                                {session.sessionLabel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Current Session Warning */}
                      {selectedFeeSession === "current" && !feesData.currentSessionData && feesData.sessions.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>No fee structure for current session.</strong> Student is in{" "}
                            <strong>{viewStudent.class?.name} - {viewStudent.program?.name}</strong> but no fees assigned yet.
                          </p>
                        </div>
                      )}
                      {/* Session-Specific Stats */}
                      {feesData.selectedSessionData && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                            {feesData.selectedSessionData.isCurrentSession ? "Current Session Stats" : feesData.selectedSessionData.sessionLabel}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <Card>
                              <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Session Fee</p>
                                <p className="text-xl font-bold">PKR {feesData.selectedSessionData.stats.sessionFee.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Paid</p>
                                <p className="text-xl font-bold text-green-600">PKR {feesData.selectedSessionData.stats.paidThisSession.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Remaining</p>
                                <p className="text-xl font-bold text-red-600">PKR {feesData.selectedSessionData.stats.remainingDues.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Paid Installments</p>
                                <p className="text-xl font-bold text-blue-600">
                                  {feesData.selectedSessionData.stats.paidInstallments} / {feesData.selectedSessionData.stats.totalInstallments}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">Pending Installments</p>
                                <p className="text-xl font-bold text-orange-600">{feesData.selectedSessionData.stats.pendingInstallments}</p>
                              </CardContent>
                            </Card>
                          </div>
                          {/* Challans Table */}
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold mb-3">Fee Challans</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Challan No</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Paid</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Installments</TableHead>
                                  <TableHead>Due Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {feesData.selectedSessionData.challans.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                      No challans for this session
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  feesData.selectedSessionData.challans.map(fee => (
                                    <TableRow key={fee.id}>
                                      <TableCell className="font-medium">{fee.challanNumber || fee.id}</TableCell>
                                      <TableCell>PKR {fee.amount?.toLocaleString() || 0}</TableCell>
                                      <TableCell className="text-green-600">PKR {fee.paidAmount?.toLocaleString() || 0}</TableCell>
                                      <TableCell>
                                        <Badge variant={fee.status === "PAID" ? "default" : "destructive"}>
                                          {fee.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{fee.coveredInstallments || fee.installmentNumber || "-"}</TableCell>
                                      <TableCell>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "-"}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                        {mockAttendance.filter(a => a.studentId === viewStudent.id).map(att => (
                          <TableRow key={att.id}>
                            <TableCell>{att.date}</TableCell>
                            <TableCell>
                              <Badge variant={att.status === "present" ? "default" : "destructive"}>
                                {att.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{att.class}</TableCell>
                          </TableRow>
                        ))}
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
                          <TableHead>Exam</TableHead>
                          <TableHead>Obtained</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>GPA</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockResults.filter(r => r.studentId === viewStudent.id).map(result => (
                          <TableRow key={result.id}>
                            <TableCell>{result.examName}</TableCell>
                            <TableCell>{result.obtainedMarks}</TableCell>
                            <TableCell>{result.totalMarks}</TableCell>
                            <TableCell>{result.percentage}%</TableCell>
                            <TableCell>{result.gpa}</TableCell>
                            <TableCell><Badge>{result.grade}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Promotion Dialog */}
        <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {promotionAction === "promote" && <TrendingUp className="w-5 h-5" />}
                {promotionAction === "demote" && <TrendingDown className="w-5 h-5" />}
                {promotionAction === "passout" && <GraduationCap className="w-5 h-5" />}
                {promotionAction.charAt(0).toUpperCase() + promotionAction.slice(1)} Students
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Program</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {programData.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass} disabled={filterProgram === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getClassesForProgram(filterProgram).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getSectionsForClass(filterProgram, filterClass).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={promotionAction === "promote" ? "default" : "outline"} onClick={() => setPromotionAction("promote")}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Promote
                </Button>
                <Button variant={promotionAction === "demote" ? "default" : "outline"} onClick={() => setPromotionAction("demote")}>
                  <TrendingDown className="w-4 h-4 mr-2" /> Demote
                </Button>
                <Button variant={promotionAction === "passout" ? "default" : "outline"} onClick={() => setPromotionAction("passout")}>
                  <GraduationCap className="w-4 h-4 mr-2" /> Pass Out
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Father/Guardian</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.filter(s => {
                    if (filterProgram !== "all" && s.programId !== Number(filterProgram)) return false;
                    if (filterClass !== "all" && s.classId !== Number(filterClass)) return false;
                    if (filterSection !== "all" && s.sectionId !== Number(filterSection)) return false;
                    return true;
                  }).map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedForPromotion.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForPromotion([...selectedForPromotion, s.id]);
                            } else {
                              setSelectedForPromotion(selectedForPromotion.filter(id => id !== s.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell>{s.rollNumber}</TableCell>
                      <TableCell>{s.fName} {s.lName}</TableCell>
                      <TableCell>{s.fatherOrguardian}</TableCell>
                      <TableCell>{programData.flatMap(p => p.classes).find(c => c.id === s.classId)?.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPromoteOpen(false); setSelectedForPromotion([]); }}>
                  Cancel
                </Button>
                <Button onClick={handlePromoteStudents}>
                  Apply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Merit List Dialog */}
        <Dialog open={meritOpen} onOpenChange={setMeritOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Merit List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Program</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {programData.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass} disabled={filterProgram === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getClassesForProgram(filterProgram).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getSectionsForClass(filterProgram, filterClass).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={printMeritList} variant="outline" className="w-full gap-2">
                    <FileText className="w-4 h-4" /> Print
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Father/Guardian</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>GPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredStudentsForMerit().map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Badge variant={i === 0 ? "default" : "outline"}>
                          {i === 0 && <Award className="w-3 h-3 mr-1" />}
                          #{i + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.rollNumber}</TableCell>
                      <TableCell>{s.fName} {s.lName}</TableCell>
                      <TableCell>{s.fatherOrguardian}</TableCell>
                      <TableCell>{programData.find(p => p.id === s.programId)?.name}</TableCell>
                      <TableCell>{programData.flatMap(p => p.classes).find(c => c.id === s.classId)?.name}</TableCell>
                      <TableCell className="font-bold">{s.avgGPA.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
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
            {viewStudent && (
              <div id="id-card-print" className="border-2 border-primary rounded-xl p-6 bg-gradient-primary text-primary-foreground">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto border-4 border-background">
                    <AvatarImage src={viewStudent.photo_url} />
                    <AvatarFallback>{viewStudent.fName}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">Concordia College</h3>
                    <p className="text-sm opacity-90">Student ID Card</p>
                  </div>
                  <div className="bg-background/10 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between"><span className="opacity-90">Name:</span> <span className="font-semibold">{viewStudent.fName} {viewStudent.lName}</span></div>
                    <div className="flex justify-between"><span className="opacity-90">Roll:</span> <span className="font-semibold">{viewStudent.rollNumber}</span></div>
                    <div className="flex justify-between"><span className="opacity-90">Program:</span> <span className="font-semibold">{programData.find(p => p.id === viewStudent.programId)?.name}</span></div>
                    <div className="flex justify-between"><span className="opacity-90">Class:</span> <span className="font-semibold">{programData.flatMap(p => p.classes).find(c => c.id === viewStudent.classId)?.name}</span></div>
                  </div>
                </div>
              </div>
            )}
            <Button onClick={() => {
              const el = document.getElementById("id-card-print");
              if (el) {
                const win = window.open("", "", "width=800,height=600");
                win?.document.write(`<html><head><title>ID Card</title></head><body style="margin:0;padding:20px">${el.innerHTML}<script>window.print();setTimeout(()=>{window.close()},100)</script></body></html>`);
              }
            }}>
              Print ID Card
            </Button>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Students;
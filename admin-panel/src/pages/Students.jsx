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
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, parse } from "date-fns";
import { useEffect, useRef, useState, useMemo } from "react";
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
  getStudentFeeHistory,
  getStudentAttendance,
  getStudentResults,
  searchStudents,
  expelStudents,
  struckOffStudents,
  rejoinStudent,
  getDefaultStudentIDCardTemplate,
  getStudentById,
  getLatestRollNumber,
  getClasses,
  getSections,
} from "../../config/apis";
import StudentForm from "@/components/students/StudentForm";
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
  Search,
  Check,
  ChevronsUpDown,
  UserX,
  UserMinus,
  RotateCcw,
} from "lucide-react";

const Students = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const [promotionDialog, setPromotionDialog] = useState({
    open: false,
    studentId: null,
    studentInfo: null,
    arrears: null
  });
  const [promotionAction, setPromotionAction] = useState("promote");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [promotionReason, setPromotionReason] = useState("");
  const [selectedFeeSession, setSelectedFeeSession] = useState("current");
  const [selectedStudent, setSelectedStudent] = useState({})

  // ID Card State
  const [defaultIdCardTemplate, setDefaultIdCardTemplate] = useState("");
  const [generatedIdCard, setGeneratedIdCard] = useState("");

  // Challan Details State
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedChallanDetails, setSelectedChallanDetails] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [filterSection, setFilterSection] = useState(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showFilters, setShowFilters] = useState(false);

  const [showFeeConfig, setShowFeeConfig] = useState(true);
  const searchTimeoutRef = useRef(null);


  // ──────────────────────────────────────────────────────────────
  // API Queries
  // ──────────────────────────────────────────────────────────────
  const { data: programData = [] } = useQuery({
    queryKey: ["programs-with-classes"],
    queryFn: getProgramNames,
  });

  const { data: classesData = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });

  const { data: sectionsData = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections,
  });


  const {
    data: infiniteStudentsData,
    isLoading: loadingStudents,
    refetch: refetchStudents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["students", filterProgram, filterClass, filterSection, searchQuery, selectedStatus, filterMonth],
    queryFn: ({ pageParam = 1 }) => {
      // Derive start and end of month from filterMonth
      const monthDate = parse(filterMonth, "yyyy-MM", new Date());
      const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
      const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

      if (selectedStatus === "ACTIVE") {
        return getStudents(filterProgram, filterClass, filterSection, searchQuery, "ACTIVE", startDate, endDate, pageParam, 20);
      } else {
        return getPassedOutStudents(filterProgram, filterClass, filterSection, searchQuery, selectedStatus, startDate, endDate, pageParam, 20);
      }
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: true,
  });

  const studentsData = useMemo(() => {
    return infiniteStudentsData?.pages.flatMap((page) => page?.students || []).filter(Boolean) || [];
  }, [infiniteStudentsData]);
  const [manualPromotionDialog, setManualPromotionDialog] = useState({
    open: false,
    classId: "",
    sectionId: ""
  });

  // ──────────────────────────────────────────────────────────────
  // Mutations
  // ──────────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student updated successfully" });
      setOpen(false);
      resetForm();
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
    mutationFn: async ({ ids, action, reason, forcePromote = false, targetClassId, targetSectionId }) => {
      console.log('📥 Mutation received:', { ids, action, reason, forcePromote, targetClassId, targetSectionId });

      const fn =
        action === "promote"
          ? promoteStudents
          : action === "demote"
            ? demoteStudents
            : action === "passout"
              ? passoutStudents
              : action === "expel"
                ? expelStudents
                : action === "rejoin"
                  ? rejoinStudent
                  : struckOffStudents;
      // For promotion, check each student individually
      if (action === "promote" && !forcePromote) {
        console.log('🔄 Taking INITIAL promotion path (forcePromote is falsy)');
        for (const id of ids) {
          // Pass targetClassId and targetSectionId to promoteStudents
          const response = await fn(id, false, targetClassId, targetSectionId);

          // If student has arrears, stop and show dialog
          if (response.requiresConfirmation) {
            return {
              requiresConfirmation: true,
              studentId: id,
              studentInfo: response.studentInfo,
              arrears: response.arrears,
              remainingIds: ids,
              targetClassId,    // Pass manual targets to preserve context if user forces promote later
              targetSectionId
            };
          }
        }
        return { success: true, count: ids.length };
      }
      // For force promote or demote/passout/expel/struck-off/rejoin
      console.log('🚀 Taking FORCE promotion path (forcePromote:', forcePromote, ')');
      const promises = ids.map((id) => {
        if (action === "promote") {
          // Pass targetClassId and targetSectionId even when force promoting
          return fn(id, reason || forcePromote, targetClassId, targetSectionId);
        }
        return fn(id, reason || forcePromote);
      });
      await Promise.all(promises);
      return { success: true, count: ids.length };
    },
    onSuccess: (result) => {
      if (result.requiresConfirmation) {
        // Show your dialog
        setPromotionDialog({
          open: true,
          studentId: result.studentId,
          studentInfo: result.studentInfo,
          arrears: result.arrears,
          remainingIds: result.remainingIds,
          targetClassId: result.targetClassId,    // Preserve manual targets
          targetSectionId: result.targetSectionId
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["students"] });
        toast({ title: `${result.count} student(s) ${promotionAction}d successfully` });
        setPromoteOpen(false);
        setPromotionReason("");
        setSelectedForPromotion([]);
      }
    },
    onError: (e) =>
      toast({
        title: "Error",
        description: e.message || "Failed to update students",
        variant: "destructive",
      }),
  });



  // Fetch student fee history when viewing a student
  const { data: studentFees = [], isLoading: feesLoading } = useQuery({
    queryKey: ["studentFees", viewStudent?.id],
    queryFn: () => getStudentFeeHistory(viewStudent.id),
    enabled: !!viewStudent?.id,
  });

  // Fetch student attendance when viewing a student
  const { data: studentAttendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["studentAttendance", viewStudent?.id],
    queryFn: () => getStudentAttendance(viewStudent.id),
    enabled: !!viewStudent?.id,
  });

  // Fetch student results when viewing a student
  const { data: studentResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["studentResults", viewStudent?.id],
    queryFn: () => getStudentResults(viewStudent.id),
    enabled: !!viewStudent?.id,
  });

  // Fetch full student details with statusHistory
  const { data: studentDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["studentDetails", viewStudent?.id],
    queryFn: () => getStudentById(viewStudent.id),
    enabled: !!viewStudent?.id,
  });


  const handleStudentSearch = (v) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchQuery(v);
        // If search is not empty, we should fetch students
        if (v.trim() !== "") {
          refetchStudents();
        } else {
          // If search is cleared, we should only refetch if we have filters
          if (filterProgram || filterClass || filterSection) {
            refetchStudents();
          }
        }
      } catch (error) {
        console.error(error);
      }
    }, 300); // 300ms debounce delay
  };


  // ID Card Generation Helper
  const generateIdCardHtml = (template, student) => {
    if (!template || !student) return "";
    let html = template;
    const programName = programData.find(p => p.id === student.programId)?.name || "";
    // Default logo if not in config (you might want to fetch this from config in a real app)
    const logoUrl = "/logo.png";

    const replacements = {
      "{{logoUrl}}": logoUrl,
      "{{studentPhoto}}": student.photo_url || "https://placehold.co/150",
      "{{name}}": `${student.fName} ${student.mName || ""} ${student.lName || ""}`,
      "{{admissionNo}}": student.rollNumber,
      "{{classGroup}}": `${programName}`,
      "{{issueDate}}": new Date().toLocaleDateString(),
      "{{expiryDate}}": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString(),
      "{{fatherName}}": student.fatherOrguardian || "",
      "{{phone}}": student.parentOrGuardianPhone || "",
      "{{fatherContact}}": student.parentOrGuardianPhone || "",
      "{{dob}}": student.dob ? new Date(student.dob).toLocaleDateString() : "",
      "{{address}}": student.address || "",
    };

    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(key, "g"), value);
    }
    return html;
  };

  useEffect(() => {
    if (idCardOpen && viewStudent) {
      const fetchTemplate = async () => {
        try {
          const template = await getDefaultStudentIDCardTemplate();
          if (template && template.htmlContent) {
            setDefaultIdCardTemplate(template.htmlContent);
            setGeneratedIdCard(generateIdCardHtml(template.htmlContent, viewStudent));
          } else {
            toast({ title: "No default template found", description: "Please set a default Student ID Card template in Configuration", variant: "destructive" });
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchTemplate();
    }
  }, [idCardOpen, viewStudent]);

  // Form State (Still used to track if editing)
  const [formData, setFormData] = useState({}); // Keep for potential reset or simple tracking if needed, but mostly managed by StudentForm

  const resetForm = () => {
    setEditingStudent(null);
  };

  const openEdit = (student) => {
    // Transform student data if necessary for StudentForm
    setEditingStudent({
      ...student,
      programId: student.programId?.toString() || "",
      classId: student.classId?.toString() || "",
      sectionId: student.sectionId?.toString() || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      tuitionFee: student.tuitionFee?.toString() || "",
      numberOfInstallments: student.numberOfInstallments?.toString() || "1",
      installments: student.feeInstallments || [],
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    // Handled by StudentForm
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

  const getFilteredStudentsForMerit = () => {
    return (studentsData || [])
      .filter((s) => {
        if (filterProgram !== "all" && s.programId !== Number(filterProgram)) return false;
        if (filterClass !== "all" && s.classId !== Number(filterClass)) return false;
        if (filterSection !== "all" && s.sectionId !== Number(filterSection)) return false;
        return true;
      })
      .map((s) => ({ ...s, avgGPA: 3.5 }))
      .sort((a, b) => b.avgGPA - a.avgGPA);
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
        const challanClassId = challan.feeStructure?.classId || challan.studentClassId;
        const challanProgramId = challan.feeStructure?.programId || challan.studentProgramId;
        const isCurrentSession =
          challanClassId === viewStudent.classId &&
          challanProgramId === viewStudent.programId;
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
      // Sort challans by installment number and due date
      session.challans.sort((a, b) => {
        if (a.installmentNumber !== b.installmentNumber) {
          return (a.installmentNumber || 0) - (b.installmentNumber || 0);
        }
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      });

      const sessionFee = session.isCurrentSession
        ? (viewStudent.tuitionFee || session.feeStructure?.totalAmount || 0)
        : (session.feeStructure?.totalAmount || session.challans.reduce((sum, c) => sum + (c.amount || 0), 0));
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

    if (promotionAction === "promote_manual") {
      setManualPromotionDialog({ open: true, classId: "", sectionId: "" });
      return;
    }

    if ((promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && !promotionReason) {
      toast({ title: "Reason is required for this action", variant: "destructive" });
      return;
    }

    bulkPromotionMut.mutate({
      ids: selectedForPromotion,
      action: promotionAction,
      reason: promotionReason,
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



  // Clear filters
  const clearFilters = () => {
    setFilterProgram(null);
    setFilterClass(null);
    setFilterSection(null);
    setFilterMonth(format(new Date(), "yyyy-MM"));
    setSearchQuery("");
    setShowFilters(false);
  };


  const currentStudents = studentsData;

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Student Management</h2>
              <p>Total Students: {studentsData?.length || 0}</p>
            </div>
            <div className="flex flex-wrap gap-2">

              {/* <Button size="sm" onClick={() => setMeritOpen(true)} variant="outline" className="gap-2">
                <Award className="w-4 h-4" /> Merit List
              </Button> */}
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
        {/* filters */}
        <Card className="shadow-soft w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Students</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-row-2 grid-cols-1 gap-2 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full ">
              <div>
                <Label>Program</Label>
                <Select
                  value={filterProgram || ""}
                  onValueChange={(value) => {
                    setFilterProgram(value || null);
                    setFilterClass(null);
                    setFilterSection(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
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
                <Label>Class</Label>
                <Select
                  value={filterClass || ""}
                  onValueChange={(value) => {
                    setFilterClass(value || null);
                    setFilterSection(null);
                  }}
                  disabled={!filterProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filterProgram ? "Select Class" : "Select Program First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassesForProgram(filterProgram).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                    <SelectItem value="EXPELLED">Expelled</SelectItem>
                    <SelectItem value="STRUCK_OFF">Struck Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Month</Label>
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full md:w-auto">
                  Clear
                </Button>
              </div>
            </div>
            <Command shouldFilter={false}>
              <CommandInput placeholder="Search by name or roll no..." onValueChange={v => handleStudentSearch(v)} />
            </Command>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>
                {selectedStatus === "ACTIVE" ? "Active Students" : `${selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase().replace('_', ' ')} Students`}
                {loadingStudents && " (Loading...)"}
              </CardTitle>
              <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
                  <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                  <TabsTrigger value="GRADUATED">Graduated</TabsTrigger>
                  <TabsTrigger value="EXPELLED">Expelled</TabsTrigger>
                  <TabsTrigger value="STRUCK_OFF">Struck Off</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>{selectedStatus === "ACTIVE" ? "Class" : "Last Class"}</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                  {selectedStatus !== "GRADUATED" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStudents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedStatus === "ACTIVE" ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-muted-foreground">
                          {selectedStatus === "ACTIVE"
                            ? "No students found. Try adjusting your filters or add a new student."
                            : `No ${selectedStatus.toLowerCase().replace('_', ' ')} students found`}
                        </p>
                        {(filterProgram || filterClass || filterSection) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>

                    </TableCell>
                  </TableRow>
                ) : (
                  currentStudents?.map((student) => {
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
                          {cls?.name || "-"}
                        </TableCell>
                        <TableCell>{sec?.name || <span className="text-muted-foreground">N/A</span>}</TableCell>
                        <TableCell>
                          <Badge variant={
                            student.status === "ACTIVE" ? "default" :
                              student.status === "GRADUATED" ? "secondary" :
                                "destructive"
                          }>
                            {student.status || "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setViewOpen(true); }} title="View Profile">
                              <Eye className="w-4 h-4" />
                            </Button>

                            {selectedStatus === "ACTIVE" && (
                              <Button size="sm" variant="outline" onClick={() => openEdit(student)} title="Edit Student">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}

                            {(selectedStatus === "EXPELLED" || selectedStatus === "STRUCK_OFF") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                onClick={() => {
                                  setPromotionAction("rejoin");
                                  setSelectedForPromotion([student.id]);
                                  setPromoteOpen(true);
                                }}
                                title="Re-join Student"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" /> Re-join
                              </Button>
                            )}

                            {selectedStatus === "ACTIVE" && (
                              <Button size="sm" variant="outline" onClick={() => { setStudentToDelete(student.id); setDeleteDialogOpen(true); }} title="Delete Student">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}

                            <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setIdCardOpen(true); }} title="Generate ID Card">
                              <IdCard className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="gap-2"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Add/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit" : "Add"} Student</DialogTitle>
              <DialogDescription>
                All fields marked * are required
              </DialogDescription>
            </DialogHeader>

            <StudentForm
              initialData={editingStudent || {}}
              isEditing={!!editingStudent}
              programs={programData}
              classes={classesData}
              sections={sectionsData}
              getLatestRollNumber={getLatestRollNumber}
              onCancel={() => {
                setOpen(false);
                resetForm();
              }}
              onSubmit={(formData) => {
                if (editingStudent) {
                  updateMut.mutate({ id: editingStudent.id, data: formData });
                } else {
                  createMut.mutate(formData);
                }
              }}
              isSubmitting={createMut.isPending || updateMut.isPending}
            />
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="history">Status History</TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Total Tuition Fee:</span>
                      <span className="font-mono font-bold">Rs. {viewStudent.tuitionFee?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Installments:</span>
                      <span className="ml-2">{viewStudent.numberOfInstallments} {viewStudent.numberOfInstallments === 1 ? "Installment" : "Installments"}</span>
                    </div>
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
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {feesData.selectedSessionData.challans.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
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
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedChallanDetails(fee);
                                            setDetailsDialogOpen(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
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

                <TabsContent value="attendance" className="flex-1 overflow-y-auto">
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading attendance records...</p>
                    </div>
                  ) : studentAttendance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-lg text-muted-foreground mb-2">No attendance records found</p>
                      <p className="text-sm text-muted-foreground">This student has no attendance records in the system yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Overall Attendance</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Attendance Rate</p>
                              <p className="text-2xl font-bold text-primary">{(() => {
                                const total = studentAttendance.length;
                                const present = studentAttendance.filter(a => a.status === "PRESENT").length;
                                return total > 0 ? Math.round((present / total) * 100) : 0;
                              })()}%</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Total Present</p>
                              <p className="text-2xl font-bold text-green-600">
                                {studentAttendance.filter(a => a.status === "PRESENT").length}
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground">Total Absent</p>
                              <p className="text-2xl font-bold text-red-600">
                                {studentAttendance.filter(a => a.status === "ABSENT").length}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Session History */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Session History</h4>
                        <div className="space-y-4">
                          {/* Group attendance by session/class */}
                          {(() => {
                            // Group by class
                            const sessions = studentAttendance
                              .reduce((acc, att) => {
                                const key = att.class?.name || "Unknown Class";
                                if (!acc[key]) {
                                  acc[key] = [];
                                }
                                acc[key].push(att);
                                return acc;
                              }, {});

                            return Object.entries(sessions).map(([className, records]) => {
                              const presentCount = records.filter(r => r.status === "PRESENT").length;
                              const totalDays = records.length;
                              const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
                              const absentCount = records.filter(r => r.status === "ABSENT").length;
                              const leaveCount = records.filter(r => r.status === "LEAVE").length;
                              const lateCount = records.filter(r => r.status === "LATE").length;

                              return (
                                <Card key={className}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-base">{className}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {records.length > 0 && (
                                            <>
                                              {new Date(records[records.length - 1].date).toLocaleDateString()} - {new Date(records[0].date).toLocaleDateString()}
                                            </>
                                          )}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={percentage >= 75 ? "default" : percentage >= 60 ? "secondary" : "destructive"}
                                        className="text-lg px-4 py-2"
                                      >
                                        {percentage}%
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {/* Progress Bar */}
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">Attendance Progress</span>
                                          <span className="font-medium">{presentCount} / {totalDays} days</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3">
                                          <div
                                            className={`h-3 rounded-full transition-all ${percentage >= 75
                                              ? "bg-green-500"
                                              : percentage >= 60
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                              }`}
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Statistics Grid */}
                                      <div className="grid grid-cols-4 gap-3 pt-2">
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                                          <p className="text-xs text-muted-foreground mt-1">Present</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                                          <p className="text-xs text-muted-foreground mt-1">Absent</p>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                          <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
                                          <p className="text-xs text-muted-foreground mt-1">Late</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                          <p className="text-2xl font-bold text-blue-600">{leaveCount}</p>
                                          <p className="text-xs text-muted-foreground mt-1">Leave</p>
                                        </div>
                                      </div>

                                      {/* Monthly Breakdown */}
                                      <details className="mt-4">
                                        <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                                          View Monthly Breakdown
                                        </summary>
                                        <div className="mt-3 space-y-2">
                                          {(() => {
                                            // Group by month
                                            const months = records.reduce((acc, r) => {
                                              const month = new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                                              if (!acc[month]) {
                                                acc[month] = [];
                                              }
                                              acc[month].push(r);
                                              return acc;
                                            }, {});

                                            return Object.entries(months).map(([month, monthRecords]) => {
                                              const monthPresent = monthRecords.filter(r => r.status === "PRESENT").length;
                                              const monthTotal = monthRecords.length;
                                              const monthPercentage = Math.round((monthPresent / monthTotal) * 100);

                                              return (
                                                <div key={month} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                                  <span className="font-medium">{month}</span>
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground">{monthPresent}/{monthTotal}</span>
                                                    <Badge variant={monthPercentage >= 75 ? "default" : "secondary"}>
                                                      {monthPercentage}%
                                                    </Badge>
                                                  </div>
                                                </div>
                                              );
                                            });
                                          })()}
                                        </div>
                                      </details>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="flex-1 overflow-y-auto">
                  {resultsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading exam results...</p>
                    </div>
                  ) : studentResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-lg text-muted-foreground mb-2">No exam results found</p>
                      <p className="text-sm text-muted-foreground">This student has not taken any exams yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Session History */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Examination History</h4>
                        <div className="space-y-4">
                          {(() => {
                            // Group by session and class
                            const sessions = studentResults.reduce((acc, result) => {
                              const sessionName = result.exam?.session || "Unknown Session";
                              const className = result.exam?.class?.name || "Unknown Class";
                              const key = `${sessionName} • ${className}`;
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(result);
                              return acc;
                            }, {});

                            // Sort sessions (assuming session strings are sortable or just by order of appearance if API sorts)
                            // The API sorts by exam startDate desc, so usually current session comes first.

                            return Object.entries(sessions).map(([sessionKey, results]) => {
                              // Calculate Session Stats
                              const totalExams = results.length;
                              const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
                              const avgPercentage = totalExams > 0 ? Math.round(totalPercentage / totalExams) : 0;
                              const passedExams = results.filter(r => (r.percentage || 0) >= 40).length; // Assuming 40% pass
                              const failedExams = totalExams - passedExams;

                              return (
                                <Card key={sessionKey}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-base">{sessionKey}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {results.length} Exam{results.length !== 1 ? 's' : ''} Taken
                                        </p>
                                      </div>
                                      <Badge
                                        variant={avgPercentage >= 70 ? "default" : avgPercentage >= 50 ? "secondary" : "destructive"}
                                        className="text-lg px-4 py-2"
                                      >
                                        {avgPercentage}% Avg
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {/* Progress Bar for Session */}
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">Session Performance</span>
                                          <span className="font-medium">{passedExams} Passed / {failedExams} Failed</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3">
                                          <div
                                            className={`h-3 rounded-full transition-all ${avgPercentage >= 70 ? "bg-green-500" : avgPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                              }`}
                                            style={{ width: `${Math.min(avgPercentage, 100)}%` }}
                                          />
                                        </div>
                                      </div>

                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Exam</TableHead>
                                            <TableHead>Obtained</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Percent</TableHead>
                                            <TableHead>Grade</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {results.map(result => (
                                            <TableRow key={result.id}>
                                              <TableCell className="font-medium">{result.exam?.examName}</TableCell>
                                              <TableCell>{result.obtainedMarks}</TableCell>
                                              <TableCell>{result.totalMarks}</TableCell>
                                              <TableCell>
                                                <Badge variant={result.percentage >= 50 ? "outline" : "destructive"}>
                                                  {result.percentage}%
                                                </Badge>
                                              </TableCell>
                                              <TableCell>{result.grade}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="history" className="flex-1 overflow-y-auto">
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading status history...</p>
                    </div>
                  ) : studentDetails?.statusHistory && studentDetails.statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {studentDetails.statusHistory.map((history, idx) => (
                        <div key={history.id} className="relative pl-6 pb-6 border-l-2 last:border-0 border-primary/20">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary" />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={history.newStatus === "ACTIVE" ? "default" : "destructive"}>
                                {history.newStatus}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(history.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {history.previousStatus ? `${history.previousStatus} → ` : ""}{history.newStatus}
                            </p>
                            {history.reason && (
                              <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded mt-1">
                                "{history.reason}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-lg text-muted-foreground mb-2">No status history found</p>
                      <p className="text-sm text-muted-foreground">This student has no recorded status changes yet.</p>
                    </div>
                  )}
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
                      <SelectItem value="*">Select a Program</SelectItem>
                      {programData.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Select value={filterClass} onValueChange={setFilterClass} disabled={filterProgram === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Select a Class</SelectItem>
                      {getClassesForProgram(filterProgram).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === "all"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Select a Section(if any)</SelectItem>
                      {getSectionsForClass(filterProgram, filterClass).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={promotionAction === "promote_manual" ? "default" : "outline"} onClick={() => setPromotionAction("promote_manual")}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Promote
                </Button>
                <Button variant={promotionAction === "demote" ? "default" : "outline"} onClick={() => setPromotionAction("demote")}>
                  <TrendingDown className="w-4 h-4 mr-2" /> Demote
                </Button>
                <Button variant={promotionAction === "passout" ? "default" : "outline"} onClick={() => setPromotionAction("passout")}>
                  <GraduationCap className="w-4 h-4 mr-2" /> Pass Out
                </Button>
                <Button variant={promotionAction === "expel" ? "destructive" : "outline"} onClick={() => setPromotionAction("expel")}>
                  <UserX className="w-4 h-4 mr-2" /> Expel
                </Button>
                <Button variant={promotionAction === "struck-off" ? "destructive" : "outline"} onClick={() => setPromotionAction("struck-off")}>
                  <UserMinus className="w-4 h-4 mr-2" /> Struck Off
                </Button>
                <Button variant={promotionAction === "rejoin" ? "default" : "outline"} onClick={() => setPromotionAction("rejoin")}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Re-join
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
                  {studentsData?.map(s => (
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

              {/* Reason input for expel, struck-off, rejoin */}
              {(promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && (
                <div className="space-y-2">
                  <Label>Reason (Required)</Label>
                  <Textarea
                    placeholder={`Enter reason for ${promotionAction === "expel" ? "expulsion" : promotionAction === "struck-off" ? "striking off" : "re-joining"}...`}
                    value={promotionReason}
                    onChange={(e) => setPromotionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setPromoteOpen(false); setSelectedForPromotion([]); setPromotionReason(""); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePromoteStudents}
                  disabled={
                    selectedForPromotion.length === 0 ||
                    ((promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && !promotionReason.trim())
                  }
                >
                  Apply ({selectedForPromotion.length} selected)
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

              {(promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && (
                <div className="space-y-2 mt-4">
                  <Label>Reason *</Label>
                  <Textarea
                    placeholder={`Enter reason for student ${promotionAction === 'rejoin' ? 're-joining' : promotionAction + 'sion'}...`}
                    value={promotionReason}
                    onChange={(e) => setPromotionReason(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Reason is required to proceed with this action.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Promotion Dialog */}
        <Dialog open={manualPromotionDialog.open} onOpenChange={(open) => setManualPromotionDialog({ ...manualPromotionDialog, open })}>
          <DialogContent className="max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle>Manual Class Assignment</DialogTitle>
              <DialogDescription>
                Manually select the destination class for the selected students.
                Students usually follow a predefined path, use this only for exceptions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Calculate available classes based on first selected student */}
              {(() => {
                const firstId = selectedForPromotion[0];
                const firstStudent = studentsData.find(s => s.id === firstId);
                const pId = firstStudent?.programId;
                const prog = programData.find(p => p.id === pId);
                const classes = prog?.classes || [];
                // Sort classes by semester/year if needed, or use existing order

                const selectedClass = classes.find(c => c.id.toString() === manualPromotionDialog.classId);
                const sections = selectedClass?.sections || [];

                return (
                  <>
                    <div className="space-y-2">
                      <Label>Target Class ({prog?.name || 'Unknown Program'})</Label>
                      <Select
                        value={manualPromotionDialog.classId}
                        onValueChange={(val) => setManualPromotionDialog({ ...manualPromotionDialog, classId: val, sectionId: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Destination Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Section</Label>
                      <Select
                        value={manualPromotionDialog.sectionId}
                        onValueChange={(val) => setManualPromotionDialog({ ...manualPromotionDialog, sectionId: val })}
                        disabled={!manualPromotionDialog.classId || sections.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={sections.length === 0 ? "No sections available" : "Select Section"} />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setManualPromotionDialog({ ...manualPromotionDialog, open: false })}>Cancel</Button>
              <Button
                onClick={() => {
                  bulkPromotionMut.mutate({
                    ids: selectedForPromotion,
                    action: "promote",
                    targetClassId: manualPromotionDialog.classId,
                    targetSectionId: manualPromotionDialog.sectionId
                  });
                  setManualPromotionDialog({ ...manualPromotionDialog, open: false });
                }}
                disabled={!manualPromotionDialog.classId}
              >
                Promote Manually
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ID Card Dialog */}
        <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
          <DialogContent className="max-w-3xl bg-white overflow-y-auto max-h-[95vh] text-black">
            <DialogHeader>
              <DialogTitle>Student ID Card</DialogTitle>
            </DialogHeader>

            {viewStudent && generatedIdCard ? (
              <div
                id="id-card-print"
                dangerouslySetInnerHTML={{ __html: generatedIdCard }}
                className="flex flex-col items-center gap-4 text-black"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                {defaultIdCardTemplate ? "Generating card..." : "No default ID card template found. Please set one in Configuration."}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4 text-black">
              <Button onClick={() => setIdCardOpen(false)} variant="outline">Close</Button>
              <Button disabled={!generatedIdCard} onClick={() => {
                const el = document.getElementById("id-card-print");
                if (el) {
                  const win = window.open("", "", "width=800,height=600");
                  win?.document.write(`
                    <html>
                      <head>
                        <title>ID Card - ${viewStudent?.fName}</title>
                        <style>
                          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        </style>
                      </head>
                      <body>
                        ${el.innerHTML}
                        <script>
                          setTimeout(() => {
                            window.print();
                            window.close();
                          }, 500);
                        </script>
                      </body>
                    </html>
                  `);
                  win?.document.close();
                }
              }}>
                <FileText className="w-4 h-4 mr-2" /> Print ID Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={promotionDialog.open}
          onOpenChange={(open) => !open && setPromotionDialog({
            open: false, studentId: null, studentInfo: null, arrears: null
          })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Student Promotion</AlertDialogTitle>
              <AlertDialogDescription>
                {promotionDialog.studentInfo && (
                  <div className="space-y-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <p><strong>Roll:</strong> {promotionDialog.studentInfo.rollNumber}</p>
                      <p><strong>Name:</strong> {promotionDialog.studentInfo.name}</p>
                    </div>
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                      <div className="font-semibold text-destructive mb-2 flex items-center gap-2">
                        <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                        Outstanding Fees (Current Session)
                      </div>
                      <p className="text-sm"><strong>Class:</strong> {promotionDialog.arrears?.className}</p>
                      <p className="text-sm"><strong>Program:</strong> {promotionDialog.arrears?.programName}</p>

                      {promotionDialog.arrears?.unpaidChallans?.length > 0 && (
                        <div className="mt-2 space-y-1 border-t pt-2 border-destructive/20">
                          <p className="text-[10px] uppercase font-black text-destructive/60 mb-1">Unpaid Installments</p>
                          {promotionDialog.arrears.unpaidChallans.map((c, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Inst. #{c.installmentNumber} ({c.status})</span>
                              <span className="font-medium text-destructive">PKR {c.balance.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-lg font-bold text-destructive mt-3 flex justify-between items-center border-t pt-2 border-destructive/40">
                        <span className="text-sm uppercase">Total Backlog</span>
                        <span>PKR {promotionDialog.arrears?.outstandingAmount?.toLocaleString()}</span>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Promoting will move these fees to arrears. Continue?
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    console.log('🚀 Calling force promote with forcePromote=true');
                    await bulkPromotionMut.mutateAsync({
                      ids: promotionDialog.remainingIds || [promotionDialog.studentId],
                      action: "promote",
                      forcePromote: true,
                      targetClassId: promotionDialog.targetClassId,
                      targetSectionId: promotionDialog.targetSectionId
                    });
                    console.log('✅ Force promote completed');
                    toast({ title: "Student promoted" });
                    setPromotionDialog({ open: false, studentId: null, studentInfo: null, arrears: null });
                    refetchStudents();
                  } catch (error) {
                    console.error('❌ Force promote error:', error);
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Promote Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        {/* Challan Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Challan Details</DialogTitle>
            </DialogHeader>
            {selectedChallanDetails && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Challan #:</span>
                  <span className="font-medium">{selectedChallanDetails.challanNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">{selectedChallanDetails.student?.fName} {selectedChallanDetails.student?.lName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Roll Number:</span>
                  <span className="font-medium">{selectedChallanDetails.student?.rollNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Installment:</span>
                  <span className="font-medium">
                    {selectedChallanDetails.installmentNumber === 0
                      ? "Additional Charges Only"
                      : (selectedChallanDetails.coveredInstallments
                        ? `#${selectedChallanDetails.coveredInstallments}`
                        : `#${selectedChallanDetails.installmentNumber}`)}
                  </span>
                </div>

                <hr className="my-4" />

                <div className="font-semibold text-sm mb-2">Fee Breakdown</div>

                {selectedChallanDetails.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tuition Fee</span>
                    <span className="font-medium">PKR {Math.round(selectedChallanDetails.amount).toLocaleString()}</span>
                  </div>
                )}

                {(() => {
                  // Handle both array format (new) and JSON string format (legacy)
                  let heads = [];
                  try {
                    if (typeof selectedChallanDetails.selectedHeads === 'string') {
                      heads = JSON.parse(selectedChallanDetails.selectedHeads || '[]');
                    } else if (Array.isArray(selectedChallanDetails.selectedHeads)) {
                      heads = selectedChallanDetails.selectedHeads;
                    }
                  } catch {
                    heads = [];
                  }

                  // Only show heads with amount > 0 (selected ones)
                  const additionalHeads = heads.filter(h => h.type === 'additional' && h.amount > 0);
                  const discountHeads = heads.filter(h => h.type === 'discount' && h.amount > 0);

                  if (additionalHeads.length === 0 && discountHeads.length === 0) {
                    // Fallback for old challans without detailed breakdown
                    return selectedChallanDetails.fineAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Additional Charges</span>
                        <span>PKR {Math.round(selectedChallanDetails.fineAmount).toLocaleString()}</span>
                      </div>
                    );
                  }

                  return (
                    <>
                      {additionalHeads.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground font-medium mt-2">Additional Charges:</div>
                          {additionalHeads.map((head, idx) => (
                            <div key={idx} className="flex justify-between text-sm pl-2">
                              <span className="text-muted-foreground">{head.name}</span>
                              <span>PKR {Math.round(head.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {discountHeads.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground font-medium mt-2">Discounts:</div>
                          {discountHeads.map((head, idx) => (
                            <div key={idx} className="flex justify-between text-sm pl-2 text-primary">
                              <span>{head.name}</span>
                              <span>-PKR {Math.round(head.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {selectedChallanDetails.discount > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Discount</span>
                    <span>-PKR {Math.round(selectedChallanDetails.discount).toLocaleString()}</span>
                  </div>
                )}

                <hr className="my-2" />

                <div className="flex justify-between font-semibold">
                  <span>Total Payable</span>
                  <span>PKR {Math.round(
                    (selectedChallanDetails.amount || 0) +
                    (selectedChallanDetails.fineAmount || 0) -
                    (selectedChallanDetails.discount || 0)
                  ).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid Amount</span>
                  <span>PKR {Math.round(selectedChallanDetails.paidAmount || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <Badge variant={selectedChallanDetails.status === "PAID" ? "default" : selectedChallanDetails.status === "OVERDUE" ? "destructive" : "secondary"}>
                    {selectedChallanDetails.status}
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{new Date(selectedChallanDetails.dueDate).toLocaleDateString()}</span>
                </div>

                {selectedChallanDetails.remarks && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Remarks:</span>
                    <p className="mt-1 text-xs bg-muted p-2 rounded">{selectedChallanDetails.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout >
  );
};

export default Students;
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  getAcademicSessions,
  getHostelRegistrationByStudent,
  getHostelRoomByStudent,
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
  User,
  UserMinus,
  RotateCcw,
  Users,
  History,
  CheckCircle2,
  Receipt,
  Plus,
  CreditCard,
  Calendar,
  DollarSign,
  Settings2,
  Home,
  Bed,
} from "lucide-react";

const EMPTY_OBJECT = {};

const Students = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to extract year gap from program duration (e.g., "4 years" -> 4)
  const getProgramGap = (progId) => {
    if (!progId || progId === "all") return 1;
    const prog = programData.find((p) => p.id.toString() === progId.toString());
    if (!prog?.duration) return 1;
    const match = prog.duration.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ──────────────────────────────────────────────────────────────
  // UI State
  // ──────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [meritOpen, setMeritOpen] = useState(false);
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demoteConfirmOpen, setDemoteConfirmOpen] = useState(false);
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
  const [promotionAction, setPromotionAction] = useState("promote_manual");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [promotionReason, setPromotionReason] = useState("");
  const [selectedFeeSession, setSelectedFeeSession] = useState("current");
  const [challanTypeFilter, setChallanTypeFilter] = useState("all"); // "all" | "tuition" | "extra"
  const [selectedStudent, setSelectedStudent] = useState({});
  const [rejoinDetails, setRejoinDetails] = useState({
    sessionId: "",
    programId: "",
    classId: "",
    sectionId: "",
    sameClass: true
  });
   // ID Card State
  const [defaultIdCardTemplate, setDefaultIdCardTemplate] = useState("");
  const [generatedIdCard, setGeneratedIdCard] = useState("");

  const [promoDetails, setPromoDetails] = useState({
    sessionId: "",
    programId: "",
    classId: "",
    sectionId: ""
  });

  // Challan Details State
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedChallanDetails, setSelectedChallanDetails] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [filterSection, setFilterSection] = useState(null);
  const [filterSessionId, setFilterSessionId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog-specific filters (independent from main page)
  const [dialogFilterProgram, setDialogFilterProgram] = useState(null);
  const [dialogFilterClass, setDialogFilterClass] = useState(null);
  const [dialogFilterSection, setDialogFilterSection] = useState(null);
  const [dialogFilterSessionId, setDialogFilterSessionId] = useState("all");

  const [showFeeConfig, setShowFeeConfig] = useState(true);
  const [pageSize, setPageSize] = useState(20);
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

  const { data: academicSessions = [] } = useQuery({
    queryKey: ["academic-sessions"],
    queryFn: getAcademicSessions,
  });


  const {
    data: infiniteStudentsData,
    isLoading: loadingStudents,
    refetch: refetchStudents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["students", filterProgram, filterClass, filterSection, searchQuery, selectedStatus, filterSessionId, pageSize],
    queryFn: ({ pageParam = 1 }) => {
      const limit = pageSize === 0 ? 10000 : pageSize; // 0 = "All"
      if (selectedStatus === "ACTIVE") {
        return getStudents(filterProgram, filterClass, filterSection, searchQuery, "ACTIVE", "", pageParam, limit, "", "", filterSessionId);
      } else {
        return getPassedOutStudents(filterProgram, filterClass, filterSection, searchQuery, selectedStatus, "", pageParam, limit, filterSessionId);
      }
    },
    getNextPageParam: (lastPage) => {
      if (pageSize === 0) return undefined; // "All" — no next page
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

  // Separate query for the promotion dialog — fetches ACTIVE students for non-rejoin actions
  const isRejoinMode = promotionAction === "rejoin";
  const dialogQueryEnabled = promoteOpen && !!dialogFilterProgram && dialogFilterProgram !== "*";

  const { data: dialogStudentsRaw = { students: [] }, isLoading: dialogStudentsLoading } = useQuery({
    queryKey: ["dialog-students", dialogFilterProgram, dialogFilterClass, dialogFilterSection, dialogFilterSessionId],
    queryFn: () => {
      return getStudents(dialogFilterProgram, dialogFilterClass, dialogFilterSection, "", "ACTIVE", "", 1, 200, "", "", dialogFilterSessionId);
    },
    enabled: dialogQueryEnabled && !isRejoinMode,
  });

  // For rejoin mode: fetch EXPELLED and STRUCK_OFF students separately then merge
  const { data: expelledRaw = { students: [] }, isLoading: expelledLoading } = useQuery({
    queryKey: ["dialog-students-expelled", dialogFilterProgram, dialogFilterClass, dialogFilterSection, dialogFilterSessionId],
    queryFn: () => {
      return getPassedOutStudents(dialogFilterProgram, dialogFilterClass, dialogFilterSection, "", "EXPELLED", "", 1, 200, dialogFilterSessionId);
    },
    enabled: dialogQueryEnabled && isRejoinMode,
  });
  const { data: struckOffRaw = { students: [] }, isLoading: struckOffLoading } = useQuery({
    queryKey: ["dialog-students-struckoff", dialogFilterProgram, dialogFilterClass, dialogFilterSection, dialogFilterSessionId],
    queryFn: () => {
      return getPassedOutStudents(dialogFilterProgram, dialogFilterClass, dialogFilterSection, "", "STRUCK_OFF", "", 1, 200, dialogFilterSessionId);
    },
    enabled: dialogQueryEnabled && isRejoinMode,
  });

  const dialogStudentsData = isRejoinMode
    ? [...(expelledRaw?.students || []), ...(struckOffRaw?.students || [])]
    : (dialogStudentsRaw?.students || []);
  const dialogStudentsIsLoading = isRejoinMode
    ? (expelledLoading || struckOffLoading)
    : dialogStudentsLoading;

  // ──────────────────────────────────────────────────────────────
  // Mutations
  // ──────────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student added successfully" });
      setOpen(false);
      // resetForm(); // Don't reset immediately to prevent UI flash
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["students"]);
      toast({ title: "Student updated successfully" });
      setOpen(false);
      // resetForm(); // Don't reset immediately to prevent UI flash
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
    mutationFn: async ({ ids, action, reason, forcePromote = false, targetClassId, targetSectionId, targetProgramId, targetSession, targetSessionId }) => {
      console.log('📥 Mutation received:', { ids, action, reason, forcePromote, targetClassId, targetSectionId, targetProgramId, targetSession });

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
                  ? (id, reason) => rejoinStudent(id, reason, rejoinDetails)
                  : struckOffStudents;
      // For promotion, check each student individually
      if (action === "promote" && !forcePromote) {
        console.log('🔄 Taking INITIAL promotion path (forcePromote is falsy)');
        for (const id of ids) {
          // Pass target indicators to promoteStudents
          const response = await fn(id, false, targetClassId, targetSectionId, targetProgramId, targetSession, targetSessionId);

          // If student has arrears, stop and show dialog
          if (response.requiresConfirmation) {
            return {
              requiresConfirmation: true,
              studentId: id,
              studentInfo: response.studentInfo,
              arrears: response.arrears,
              remainingIds: ids,
              targetClassId,    // Pass manual targets to preserve context if user forces promote later
              targetSectionId,
              targetProgramId,
              targetSessionId,
              targetSession
            };
          }
        }
        return { success: true, count: ids.length };
      }
      // For force promote or demote/passout/expel/struck-off/rejoin
      console.log('🚀 Taking FORCE promotion path (forcePromote:', forcePromote, ')');
      const promises = ids.map((id) => {
        if (action === "promote") {
          return fn(id, reason || forcePromote, targetClassId, targetSectionId, targetProgramId, targetSession, targetSessionId);
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
          targetSectionId: result.targetSectionId,
          targetProgramId: result.targetProgramId,
          targetSessionId: result.targetSessionId,
          targetSession: result.targetSession
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["students"] });
        toast({ title: `${result.count} student(s) ${promotionAction}d successfully` });
        setPromoteOpen(false);
        setPromotionReason("");
        setSelectedForPromotion([]);
        setRejoinDetails({ sessionId: "", programId: "", classId: "", sectionId: "", sameClass: true });
        setPromoDetails({ sessionId: "", programId: "", classId: "", sectionId: "" });
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

  // Fetch hostel registration and room for the viewed student
  const { data: studentHostelReg, isLoading: hostelRegLoading } = useQuery({
    queryKey: ["studentHostelReg", viewStudent?.id],
    queryFn: () => getHostelRegistrationByStudent(viewStudent.id),
    enabled: !!viewStudent?.id,
  });

  const { data: studentHostelRoom, isLoading: hostelRoomLoading } = useQuery({
    queryKey: ["studentHostelRoom", viewStudent?.id],
    queryFn: () => getHostelRoomByStudent(viewStudent.id),
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
      "{{name}}": `${student.fName} ${student.lName || ""}`,
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
    // Parse documents if it's a JSON string
    let docs = student.documents || {};
    if (typeof docs === "string") {
      try { docs = JSON.parse(docs); } catch { docs = {}; }
    }

    // Transform installments: format dueDate and ensure month/session exist
    const installments = (student.feeInstallments || [])
      .filter(inst => inst.classId === student.classId)
      .map(inst => {
        const dueDateStr = inst.dueDate ? new Date(inst.dueDate).toISOString().split("T")[0] : "";
        const dateObj = inst.dueDate ? new Date(inst.dueDate) : null;
        const monthName = dateObj ? dateObj.toLocaleString('default', { month: 'long' }) : "";
        return {
          ...inst,
          dueDate: dueDateStr,
          month: inst.month || monthName,
          session: inst.session || "",
        };
      });

    setEditingStudent({
      ...student,
      programId: student.programId?.toString() || "",
      classId: student.classId?.toString() || "",
      sectionId: student.sectionId?.toString() || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split("T")[0] : "",
      religion: student.religion || "",
      tuitionFee: student.tuitionFee?.toString() || "",
      numberOfInstallments: student.numberOfInstallments?.toString() || "1",
      documents: docs,
      installments,
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

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedChallanForHistory, setSelectedChallanForHistory] = useState(null);

  // Status History tab filters
  const [historyFilterSession, setHistoryFilterSession] = useState("all");
  const [historyFilterStatus, setHistoryFilterStatus] = useState("all");
  const [historyFilterChallanType, setHistoryFilterChallanType] = useState("all");

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
        extraChallans: [],
        currentSessionData: null,
        selectedSessionData: null
      };
    }

    // Fix 2+3: Partition challans — separate FEE_HEADS_ONLY from regular
    const extraChallans = studentFees.filter(c => c.challanType === 'FEE_HEADS_ONLY');
    const regularChallans = studentFees.filter(c => c.challanType !== 'FEE_HEADS_ONLY');

    const sessionMap = new Map();
    let totalAllSessions = 0;
    let paidAllSessions = 0;
    let duesAllSessions = 0;

    regularChallans.forEach(challan => {
      // Fix 3: Always use snapshot fields for session key, never feeStructure
      let sessionKey;
      if (challan.studentClassId && challan.studentProgramId) {
        sessionKey = `snapshot-${challan.studentProgramId}-${challan.studentClassId}`;
      } else {
        sessionKey = 'unclassified';
      }

      if (!sessionMap.has(sessionKey)) {
        // Fix 3: isCurrentSession uses snapshot fields only
        const isCurrentSession =
          challan.studentClassId === viewStudent.classId &&
          challan.studentProgramId === viewStudent.programId;
        sessionMap.set(sessionKey, {
          sessionKey,
          studentClassId: challan.studentClassId,
          studentProgramId: challan.studentProgramId,
          feeStructureId: challan.feeStructureId,
          feeStructure: challan.feeStructure,
          // Fix 3: derive program/class from snapshot, not feeStructure
          program: challan.studentProgram || challan.feeStructure?.program,
          class: challan.studentClass || challan.feeStructure?.class,
          challans: [],
          isCurrentSession
        });
      }
      sessionMap.get(sessionKey).challans.push(challan);

      // Fix 1: Exclude VOID from overall totals
      if (challan.status === 'VOID') return;

      totalAllSessions += (challan.amount - (challan.discount || 0)) || 0;
      paidAllSessions += challan.paidAmount || 0;
      if (challan.status !== 'PAID') {
        const netPayable = (challan.amount - (challan.discount || 0) + (challan.fineAmount || 0));
        duesAllSessions += Math.max(0, netPayable - (challan.paidAmount || 0));
      }
    });

    const sessions = Array.from(sessionMap.values()).map(session => {
      session.challans.sort((a, b) => {
        if (a.installmentNumber !== b.installmentNumber) {
          return (a.installmentNumber || 0) - (b.installmentNumber || 0);
        }
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      });

      // Fix 1: Exclude VOID from per-session stats
      const nonVoidChallans = session.challans.filter(c => c.status !== 'VOID');
      const paidChallans = nonVoidChallans.filter(c => c.status === 'PAID');

      // Fix 4: Derive stats from feeInstallments when available
      const matchingInsts = (viewStudent.feeInstallments || []).filter(
        i => i.classId === session.studentClassId
      );

      let sessionFee, paidInstallments, totalInstallments;

      if (matchingInsts.length > 0) {
        // Use installment plan as source of truth
        sessionFee = matchingInsts.reduce((sum, i) => sum + (i.amount || 0), 0);
        totalInstallments = matchingInsts.length;
        paidInstallments = matchingInsts.filter(i => i.status === 'PAID').length;
      } else {
        // Fallback: derive from non-VOID challan amounts
        sessionFee = session.isCurrentSession
          ? (viewStudent.tuitionFee || session.feeStructure?.totalAmount || nonVoidChallans.reduce((sum, c) => sum + ((c.amount - (c.discount || 0)) || 0), 0))
          : nonVoidChallans.reduce((sum, c) => sum + ((c.amount - (c.discount || 0)) || 0), 0);
        totalInstallments = session.feeStructure?.installments || nonVoidChallans.length;
        // Count paid installments from coveredInstallments
        paidInstallments = 0;
        paidChallans.forEach(c => {
          if (c.coveredInstallments) {
            const parts = c.coveredInstallments.split('-');
            paidInstallments = Math.max(paidInstallments, parseInt(parts[parts.length - 1]) || 0);
          } else if (c.installmentNumber) {
            paidInstallments = Math.max(paidInstallments, c.installmentNumber);
          }
        });
      }

      const paidThisSession = nonVoidChallans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
      // Fix 1: Exclude VOID from remainingDues
      const remainingDues = nonVoidChallans
        .filter(c => c.status !== 'PAID')
        .reduce((sum, c) => {
          const netPayable = (c.amount - (c.discount || 0) + (c.fineAmount || 0));
          return sum + Math.max(0, netPayable - (c.paidAmount || 0));
        }, 0);

      // Fix 3: sessionLabel from snapshot
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
          pendingInstallments: Math.max(0, totalInstallments - paidInstallments),
          currentLateFee: nonVoidChallans.reduce((sum, c) => sum + (c.lateFeeFine || 0), 0),
        }
      };
    });

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
      extraChallans,
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

    if ((promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && !promotionReason) {
      toast({ title: "Reason is required for this action", variant: "destructive" });
      return;
    }

    // Demotion Warning Interception
    if (promotionAction === "demote") {
      setDemoteConfirmOpen(true);
      return;
    }

    bulkPromotionMut.mutate({
      ids: selectedForPromotion,
      action: promotionAction === "promote_manual" ? "promote" : promotionAction,
      reason: promotionReason,
      targetClassId: promotionAction === "promote_manual" ? promoDetails.classId : undefined,
      targetSectionId: promotionAction === "promote_manual" ? promoDetails.sectionId : undefined,
      targetProgramId: promotionAction === "promote_manual" ? promoDetails.programId : undefined,
      targetSessionId: promotionAction === "promote_manual" ? promoDetails.sessionId : undefined,
      ...(promotionAction === "rejoin" ? rejoinDetails : {})
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
          (s, i) => `<tr><td><strong>#${i + 1}</strong></td><td>${s.fName} ${s.lName}</td><td>${s.rollNumber}</td><td>${programData.flatMap((p) => p.classes).find((c) => c.id === s.classId)?.name}</td><td><strong>${s.avgGPA.toFixed(2)}</strong></td></tr>`
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
    setFilterSessionId("all");
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Student Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Total Students: {studentsData?.length || 0}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { 
                setDialogFilterProgram(null); 
                setDialogFilterClass(null); 
                setDialogFilterSection(null); 
                setDialogFilterSessionId(filterSessionId || "all");
                setSelectedForPromotion([]); 
                setPromotionReason(""); 
                setPromotionAction("promote"); 
                setPromoteOpen(true); 
              }} variant="outline" className="gap-2">
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
                    setFilterProgram(value === "all" ? null : (value || null));
                    setFilterClass(null);
                    setFilterSection(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programData.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} ({p.department?.name})
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
                    setFilterClass(value === "all" ? null : (value || null));
                    setFilterSection(null);
                  }}
                  disabled={!filterProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filterProgram ? "All Classes" : "Select Program First"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
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
                <Label>Session</Label>
                <Select
                  value={filterSessionId}
                  onValueChange={(value) => setFilterSessionId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {academicSessions.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} {s.isActive ? "(Current)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <TableHead>Admission Date</TableHead>
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
                  <TableCell colSpan={selectedStatus === "ACTIVE" ? 9 : 8} className="text-center py-8">
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
                        <TableCell>{student.fName} {student.lName}</TableCell>
                        <TableCell>
                          {student.createdAt ? format(new Date(student.createdAt), "dd MMM yyyy") : "-"}
                        </TableCell>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setViewOpen(true); }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Profile</TooltipContent>
                            </Tooltip>

                            {selectedStatus === "ACTIVE" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => openEdit(student)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Student</TooltipContent>
                              </Tooltip>
                            )}

                            {(selectedStatus === "EXPELLED" || selectedStatus === "STRUCK_OFF") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                    onClick={() => {
                                      setPromotionAction("rejoin");
                                      setSelectedForPromotion([student.id]);
                                      setRejoinDetails({
                                        sessionId: student.sessionId?.toString() || "",
                                        programId: student.programId?.toString() || "",
                                        classId: student.classId?.toString() || "",
                                        sectionId: student.sectionId?.toString() || ""
                                      });
                                      setDialogFilterSessionId(student.sessionId?.toString() || "all");
                                      setPromoteOpen(true);
                                    }}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" /> Re-join
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Re-join Student</TooltipContent>
                              </Tooltip>
                            )}

                            {selectedStatus === "ACTIVE" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => { setStudentToDelete(student.id); setDeleteDialogOpen(true); }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Student</TooltipContent>
                              </Tooltip>
                            )}

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => { setViewStudent(student); setIdCardOpen(true); }}>
                                  <IdCard className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Generate ID Card</TooltipContent>
                            </Tooltip>
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
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {studentsData.length} students</span>
              <div className="flex items-center gap-2">
                <span className="text-xs">Per page:</span>
                <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-7 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="0">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              initialData={editingStudent || EMPTY_OBJECT}
              isEditing={!!editingStudent}
              programs={programData}
              classes={classesData}
              sections={sectionsData}
              academicSessions={academicSessions}
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
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="history">Status History</TabsTrigger>
                  <TabsTrigger value="hostel">Hostel</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-start gap-6 mb-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={viewStudent.photo_url} />
                      <AvatarFallback>{viewStudent.fName}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{viewStudent.fName} {viewStudent.lName}</h3>
                      <div className="flex items-center gap-4">
                        <p className="uppercase text-gray-500 tracking-wide text-sm">Father / Guardian:</p>
                        <p className="font-medium text-sm ">{viewStudent.fatherOrguardian}</p>
                      </div>
                      <p className="text-muted-foreground">{viewStudent.rollNumber}</p>
                    </div>
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="font-semibold">Admission Date:</span> {viewStudent.createdAt ? format(new Date(viewStudent.createdAt), "dd MMMM yyyy") : "-"}</div>
                      <div><span className="font-semibold">Program:</span> {(() => {
                        const prog = programData.find((p) => p.id === viewStudent.programId);
                        return prog ? `${prog.name} - ${prog.department?.name}` : "-";
                      })()}</div>
                      <div><span className="font-semibold">Class:</span> {programData.flatMap((p) => p.classes).find((c) => c.id === viewStudent.classId)?.name}</div>
                      <div><span className="font-semibold">Section:</span> {programData.flatMap((p) => p.classes).flatMap((c) => c.sections).find((s) => s.id === viewStudent.sectionId)?.name || "N/A"}</div>
                      <div><span className="font-semibold">Session:</span> {viewStudent.session || "-"}</div>
                      <div><span className="font-semibold">Gender:</span> {viewStudent.gender || "-"}</div>
                      <div><span className="font-semibold">Religion:</span> {viewStudent.religion || "-"}</div>
                      <div><span className="font-semibold">DOB:</span> {viewStudent.dob ? new Date(viewStudent.dob).toLocaleDateString() : "-"}</div>
                      <div><span className="font-semibold">Parent Email:</span> {viewStudent.parentOrGuardianEmail || "-"}</div>
                      <div><span className="font-semibold">Parent Phone:</span> {viewStudent.parentOrGuardianPhone || "-"}</div>
                      <div><span className="font-semibold">Parent CNIC:</span> {viewStudent.parentCNIC || "-"}</div>
                      <div><span className="font-semibold">Student CNIC:</span> {viewStudent.studentCnic || "-"}</div>
                      <div className="col-span-2"><span className="font-semibold">Address:</span> {viewStudent.address || "-"}</div>

                      {/* Fee info */}
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold">Total Tuition Fee:</span>
                        <span className="font-mono font-bold">Rs. {viewStudent.tuitionFee?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Installments:</span>
                        <span className="ml-2">{viewStudent.numberOfInstallments} {viewStudent.numberOfInstallments === 1 ? "Installment" : "Installments"}</span>
                      </div>

                      {/* Previous academic info */}
                      {viewStudent.admissionFormNumber && (
                        <div><span className="font-semibold">Admission Form #:</span> {viewStudent.admissionFormNumber}</div>
                      )}
                      {viewStudent.previousBoardName && (
                        <div><span className="font-semibold">Previous Board:</span> {viewStudent.previousBoardName}</div>
                      )}
                      {viewStudent.previousBoardRollNumber && (
                        <div><span className="font-semibold">Board Roll #:</span> {viewStudent.previousBoardRollNumber}</div>
                      )}
                      {(viewStudent.obtainedMarks || viewStudent.totalMarks) && (
                        <div>
                          <span className="font-semibold">Previous Marks:</span>
                          <span className="ml-2 font-mono">
                            {viewStudent.obtainedMarks ?? "—"} / {viewStudent.totalMarks ?? "—"}
                            {viewStudent.obtainedMarks && viewStudent.totalMarks
                              ? ` (${Math.round((viewStudent.obtainedMarks / viewStudent.totalMarks) * 100)}%)`
                              : ""}
                          </span>
                        </div>
                      )}
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
                  <Tabs defaultValue="payment-history" className="w-full">
                    <TabsList className="bg-muted p-1 mb-6 h-10 w-full grid grid-cols-3">
                      <TabsTrigger value="payment-history" className="px-6">
                        <History className="w-4 h-4 mr-2" /> Payment History
                      </TabsTrigger>
                      <TabsTrigger value="installment-plan" className="px-6">
                        <Calendar className="w-4 h-4 mr-2" /> Installment Plan
                      </TabsTrigger>
                      <TabsTrigger value="extra-charges" className="px-6">
                        <Plus className="w-4 h-4 mr-2" /> Extra Charges
                        {feesData.extraChallans?.length > 0 && (
                          <span className="ml-1.5 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                            {feesData.extraChallans.length}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="payment-history">
                      {studentFees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-lg text-muted-foreground mb-2">No fee records found</p>
                          <p className="text-sm text-muted-foreground">This student has no fee challans in the system yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          {/* Overall Summary */}
                          {/* <div>
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
                          </div> */}
                          {/* Session + Challan Type Filters */}
                          <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[200px]">
                              <Label className="text-xs">Session / Class</Label>
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
                            <div className="min-w-[160px]">
                              <Label className="text-xs">Challan Type</Label>
                              <Select value={challanTypeFilter} onValueChange={setChallanTypeFilter}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Challans</SelectItem>
                                  <SelectItem value="tuition">Tuition Only</SelectItem>
                                  <SelectItem value="extra">Extra Charges</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
                                 <Card>
                                   <CardContent className="pt-6">
                                     <p className="text-sm text-muted-foreground">Late Fee Due</p>
                                     <p className="text-xl font-bold text-destructive">
                                       PKR {feesData.selectedSessionData.stats.currentLateFee?.toLocaleString() || 0}
                                     </p>
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
                                      <TableHead>Payable</TableHead>
                                      <TableHead>Paid</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Installments</TableHead>
                                      <TableHead>Installment Month</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(() => {
                                      const filtered = feesData.selectedSessionData.challans.filter(fee => {
                                        if (challanTypeFilter === "tuition") return fee.challanType !== 'FEE_HEADS_ONLY';
                                        if (challanTypeFilter === "extra") return fee.challanType === 'FEE_HEADS_ONLY';
                                        return true;
                                      });
                                      if (filtered.length === 0) return (
                                        <TableRow>
                                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                            No challans for this session
                                          </TableCell>
                                        </TableRow>
                                      );
                                      return filtered.map(fee => (
                                        <TableRow key={fee.id} className={fee.status === 'VOID' ? 'opacity-50' : ''}>
                                          <TableCell className="font-medium">{fee.challanNumber || fee.id}</TableCell>
                                          <TableCell>
                                            {fee.status === 'VOID' ? (
                                              <span className="text-muted-foreground line-through text-xs">
                                                PKR {(fee.amount - (fee.discount || 0) + (fee.fineAmount || 0)).toLocaleString()}
                                              </span>
                                            ) : (
                                              <>
                                                <div>PKR {(fee.amount - (fee.discount || 0) + (fee.fineAmount || 0) + (fee.lateFeeFine || 0)).toLocaleString()}</div>
                                                {fee.lateFeeFine > 0 && (
                                                  <div className="text-[10px] text-destructive font-bold">
                                                    Inc. Late Fee: PKR {fee.lateFeeFine.toLocaleString()}
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-green-600">PKR {fee.paidAmount?.toLocaleString() || 0}</TableCell>
                                          <TableCell>
                                            <Badge variant={fee.status === "PAID" ? "default" : fee.status === "VOID" ? "outline" : "destructive"}>
                                              {fee.status === "VOID" ? "Superseded" : fee.status}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{fee.coveredInstallments || fee.installmentNumber || "-"}</TableCell>
                                          <TableCell>{fee.dueDate ? format(new Date(fee.dueDate), "MMM yyyy") : "-"}</TableCell>
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
                                              {fee.paymentHistory && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => {
                                                    setSelectedChallanForHistory(fee);
                                                    setHistoryDialogOpen(true);
                                                  }}
                                                >
                                                  <History className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </TableCell>
                                        </TableRow>
                                      ));
                                    })()}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="installment-plan" className="space-y-8 animate-in fade-in duration-300">
                       {(!viewStudent.feeInstallments || viewStudent.feeInstallments.length === 0) ? (
                         <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                           <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                           <p className="text-lg text-muted-foreground mb-2">No installment plan defined</p>
                           <p className="text-sm text-muted-foreground">This student has no scheduled installments record in the system.</p>
                         </div>
                       ) : (
                         (() => {
                           // Group installments by Class and Session
                           const grouped = viewStudent.feeInstallments.reduce((acc, inst) => {
                             const key = `${inst.classId}-${inst.session}`;
                             if (!acc[key]) {
                               acc[key] = {
                                 className: inst.class?.name || programData.flatMap(p => p.classes).find(c => c.id === inst.classId)?.name || 'Unknown Class',
                                 session: inst.session || 'N/A',
                                 classYear: programData.flatMap(p => p.classes).find(c => c.id === inst.classId)?.year || 0,
                                 installments: []
                               };
                             }
                             acc[key].installments.push(inst);
                             return acc;
                           }, {});

                           // Sort groups by Class Year then Session
                           const sortedGroups = Object.values(grouped).sort((a, b) => {
                             if (a.classYear !== b.classYear) return a.classYear - b.classYear;
                             return a.session.localeCompare(b.session);
                           });

                           return sortedGroups.map((group, gIdx) => (
                             <div key={gIdx} className="space-y-4">
                               <div className="flex items-center justify-between border-b pb-2">
                                 <div className="flex items-center gap-3">
                                   <div className="bg-primary/10 p-2 rounded-lg">
                                     <GraduationCap className="w-5 h-5 text-primary" />
                                   </div>
                                   <div>
                                     <h4 className="text-base font-bold text-slate-800">{group.className}</h4>
                                     <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{group.session}</p>
                                   </div>
                                 </div>
                                 <Badge variant="outline" className="bg-slate-50 uppercase text-[10px] py-1 px-3">
                                   Plan Total: PKR {group.installments.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
                                 </Badge>
                               </div>

                               <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
                                 <Table>
                                   <TableHeader className="bg-slate-50/50">
                                     <TableRow>
                                       <TableHead className="w-[80px] text-zinc-500 font-bold uppercase text-[10px]">Inst. #</TableHead>
                                       <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Billing Month</TableHead>
                                       <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Due Date</TableHead>
                                       <TableHead className="text-right text-zinc-500 font-bold uppercase text-[10px]">Plan Amount</TableHead>
                                     </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                     {group.installments
                                       .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                       .map((inst, idx) => (
                                       <TableRow key={inst.id} className="hover:bg-slate-50/30 transition-colors">
                                         <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                                         <TableCell className="font-semibold text-slate-700">{inst.month}</TableCell>
                                         <TableCell className="text-xs text-slate-600">
                                           {inst.dueDate ? format(new Date(inst.dueDate), "dd MMM yyyy") : "-"}
                                         </TableCell>
                                         <TableCell className="text-right font-bold text-slate-900">
                                           PKR {inst.amount.toLocaleString()}
                                         </TableCell>
                                       </TableRow>
                                     ))}
                                   </TableBody>
                                 </Table>
                               </div>
                             </div>
                           ));
                         })()
                       )}
                    </TabsContent>

                    <TabsContent value="extra-charges" className="space-y-4 animate-in fade-in duration-300">
                      {!feesData.extraChallans || feesData.extraChallans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                          <DollarSign className="w-10 h-10 text-muted-foreground mb-3 opacity-20" />
                          <p className="text-lg text-muted-foreground mb-1">No extra charges</p>
                          <p className="text-sm text-muted-foreground">No supplementary fee challans on record for this student.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Challan No</TableHead>
                              <TableHead>Month</TableHead>
                              <TableHead>Heads</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Paid</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {feesData.extraChallans.map(fee => {
                              let headsLabel = '-';
                              try {
                                const heads = typeof fee.selectedHeads === 'string' ? JSON.parse(fee.selectedHeads) : (fee.selectedHeads || []);
                                headsLabel = heads.filter(h => h?.isSelected !== false).map(h => h.name).join(', ') || '-';
                              } catch {}
                              return (
                                <TableRow key={fee.id}>
                                  <TableCell className="font-medium">{fee.challanNumber}</TableCell>
                                  <TableCell>{fee.month || (fee.dueDate ? format(new Date(fee.dueDate), "MMM yyyy") : '-')}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{headsLabel}</TableCell>
                                  <TableCell>PKR {(fee.amount + (fee.fineAmount || 0)).toLocaleString()}</TableCell>
                                  <TableCell className="text-green-600">PKR {(fee.paidAmount || 0).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge variant={fee.status === 'PAID' ? 'default' : fee.status === 'VOID' ? 'outline' : 'destructive'}>
                                      {fee.status === 'VOID' ? 'Superseded' : fee.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{fee.dueDate ? format(new Date(fee.dueDate), "dd MMM yyyy") : '-'}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>
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
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="min-w-[160px]">
                      <Label className="text-xs">Session</Label>
                      <Select value={historyFilterSession} onValueChange={setHistoryFilterSession}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Sessions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {academicSessions.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name} {s.isActive ? "(Current)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[160px]">
                      <Label className="text-xs">Status</Label>
                      <Select value={historyFilterStatus} onValueChange={setHistoryFilterStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="GRADUATED">Graduated</SelectItem>
                          <SelectItem value="EXPELLED">Expelled</SelectItem>
                          <SelectItem value="STRUCK_OFF">Struck Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-[160px]">
                      <Label className="text-xs">Challan Type</Label>
                      <Select value={historyFilterChallanType} onValueChange={setHistoryFilterChallanType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="tuition">Tuition Fee Challan</SelectItem>
                          <SelectItem value="extra">Extra Challan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(historyFilterSession !== "all" || historyFilterStatus !== "all" || historyFilterChallanType !== "all") && (
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setHistoryFilterSession("all"); setHistoryFilterStatus("all"); setHistoryFilterChallanType("all"); }}
                        >
                          <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                      </div>
                    )}
                  </div>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading status history...</p>
                    </div>
                  ) : (() => {
                    const allHistory = studentDetails?.statusHistory || [];
                    const filtered = allHistory.filter(h => {
                      if (historyFilterStatus !== "all" && h.newStatus !== historyFilterStatus) return false;
                      if (historyFilterSession !== "all" && h.sessionId?.toString() !== historyFilterSession) return false;
                      if (historyFilterChallanType !== "all") {
                        if (historyFilterChallanType === "tuition" && h.challanType === "FEE_HEADS_ONLY") return false;
                        if (historyFilterChallanType === "extra" && h.challanType !== "FEE_HEADS_ONLY") return false;
                      }
                      return true;
                    });
                    if (filtered.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-lg text-muted-foreground mb-2">No status history found</p>
                        <p className="text-sm text-muted-foreground">
                          {allHistory.length > 0 ? "No records match the selected filters." : "This student has no recorded status changes yet."}
                        </p>
                      </div>
                    );
                    return (
                      <div className="space-y-4">
                        {filtered.map((history) => (
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
                                {history.sessionId && (
                                  <Badge variant="outline" className="text-xs">
                                    {academicSessions.find(s => s.id.toString() === history.sessionId?.toString())?.name || `Session ${history.sessionId}`}
                                  </Badge>
                                )}
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
                    );
                  })()}
                </TabsContent>
                <TabsContent value="hostel" className="space-y-4">
                  {hostelRegLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Loading hostel info...</p>
                    </div>
                  ) : !studentHostelReg ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <Home className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-lg text-muted-foreground mb-2">Not registered in hostel</p>
                      <p className="text-sm text-muted-foreground">This student has no hostel registration.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Home className="w-5 h-5 text-primary" />
                            Hostel Registration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                          <div><span className="font-semibold">Hostel:</span> {studentHostelReg.hostelName}</div>
                          <div><span className="font-semibold">Status:</span> <Badge variant={studentHostelReg.status === "active" ? "default" : "secondary"}>{studentHostelReg.status}</Badge></div>
                          <div><span className="font-semibold">Registration Date:</span> {studentHostelReg.registrationDate ? new Date(studentHostelReg.registrationDate).toLocaleDateString() : "-"}</div>
                          <div><span className="font-semibold">Registration ID:</span> <span className="text-xs text-muted-foreground font-mono">{studentHostelReg.id}</span></div>
                        </CardContent>
                      </Card>
                      {studentHostelRoom && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Bed className="w-5 h-5 text-primary" />
                              Room Allocation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div><span className="font-semibold">Room Number:</span> {studentHostelRoom.room?.roomNumber}</div>
                            <div><span className="font-semibold">Room Type:</span> {studentHostelRoom.room?.roomType}</div>
                            <div><span className="font-semibold">Capacity:</span> {studentHostelRoom.room?.capacity}</div>
                            <div><span className="font-semibold">Occupancy:</span> {studentHostelRoom.room?.currentOccupancy} / {studentHostelRoom.room?.capacity}</div>
                            <div><span className="font-semibold">Allocation Date:</span> {studentHostelRoom.allocationDate ? new Date(studentHostelRoom.allocationDate).toLocaleDateString() : "-"}</div>
                          </CardContent>
                        </Card>
                      )}
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
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label>Session</Label>
                  <Select value={dialogFilterSessionId} onValueChange={(v) => { setDialogFilterSessionId(v || "all"); setSelectedForPromotion([]); }}>
                    <SelectTrigger><SelectValue placeholder="All Sessions" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      {academicSessions.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} {s.isActive ? "(Current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Program</Label>
                  <Select value={dialogFilterProgram || ""} onValueChange={(v) => { setDialogFilterProgram(v || null); setDialogFilterClass(null); setDialogFilterSection(null); setSelectedForPromotion([]); }}>
                    <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                    <SelectContent>
                      {programData.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} - {p.department?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class</Label>
                  <Select value={dialogFilterClass || ""} onValueChange={(v) => { setDialogFilterClass(v || null); setDialogFilterSection(null); setSelectedForPromotion([]); }} disabled={!dialogFilterProgram}>
                    <SelectTrigger><SelectValue placeholder={dialogFilterProgram ? "Select Class" : "Select Program First"} /></SelectTrigger>
                    <SelectContent>
                      {getClassesForProgram(dialogFilterProgram).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={dialogFilterSection || ""} onValueChange={(v) => { setDialogFilterSection(v || null); setSelectedForPromotion([]); }} disabled={!dialogFilterClass}>
                    <SelectTrigger><SelectValue placeholder={dialogFilterClass ? "Select Section" : "Select Class First"} /></SelectTrigger>
                    <SelectContent>
                      {getSectionsForClass(dialogFilterProgram, dialogFilterClass).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={promotionAction === "promote_manual" ? "default" : "outline"} onClick={() => { setPromotionAction("promote_manual"); setSelectedForPromotion([]); }}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Promote
                </Button>
                <Button variant={promotionAction === "demote" ? "default" : "outline"} onClick={() => { setPromotionAction("demote"); setSelectedForPromotion([]); }}>
                  <TrendingDown className="w-4 h-4 mr-2" /> Demote
                </Button>
                <Button variant={promotionAction === "passout" ? "default" : "outline"} onClick={() => { setPromotionAction("passout"); setSelectedForPromotion([]); }}>
                  <GraduationCap className="w-4 h-4 mr-2" /> Pass Out
                </Button>
                <Button variant={promotionAction === "expel" ? "destructive" : "outline"} onClick={() => { setPromotionAction("expel"); setSelectedForPromotion([]); }}>
                  <UserX className="w-4 h-4 mr-2" /> Expel
                </Button>
                <Button variant={promotionAction === "struck-off" ? "destructive" : "outline"} onClick={() => { setPromotionAction("struck-off"); setSelectedForPromotion([]); }}>
                  <UserMinus className="w-4 h-4 mr-2" /> Struck Off
                </Button>
                <Button variant={promotionAction === "rejoin" ? "default" : "outline"} onClick={() => { setPromotionAction("rejoin"); setSelectedForPromotion([]); }}>
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
                    {isRejoinMode && <TableHead>Status</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialogStudentsIsLoading && <TableRow><TableCell colSpan={isRejoinMode ? 6 : 5} className="text-center py-4 text-muted-foreground">Loading students...</TableCell></TableRow>}
                  {!dialogStudentsIsLoading && dialogStudentsData.length === 0 && (
                    <TableRow><TableCell colSpan={isRejoinMode ? 6 : 5} className="text-center py-4 text-muted-foreground">
                      {dialogFilterProgram
                        ? (isRejoinMode ? "No expelled or struck-off students found for this filter" : "No active students found for this filter")
                        : "Select a program to load students"}
                    </TableCell></TableRow>
                  )}
                  {dialogStudentsData?.map(s => (
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
                      {isRejoinMode && (
                        <TableCell>
                          <Badge variant={s.status === "EXPELLED" ? "destructive" : "secondary"}>
                            {s.status === "EXPELLED" ? "Expelled" : "Struck Off"}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Manual Promotion Destination Details */}
              {promotionAction === "promote_manual" && (
                <div className="space-y-4 p-4 bg-orange-50 border border-orange-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-orange-900">Destination Placement</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Session *</Label>
                      <Select
                        value={promoDetails.sessionId}
                        onValueChange={(v) => setPromoDetails(prev => ({ ...prev, sessionId: v }))}
                      >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Session" /></SelectTrigger>
                        <SelectContent>
                          {academicSessions.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name} {s.isActive ? "(Current)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Target Program *</Label>
                      <Select
                        value={promoDetails.programId}
                        onValueChange={(v) => setPromoDetails(prev => ({ ...prev, programId: v, classId: "", sectionId: "" }))}
                      >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Program" /></SelectTrigger>
                        <SelectContent>
                          {programData.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Target Class *</Label>
                      <Select
                        value={promoDetails.classId}
                        onValueChange={(v) => setPromoDetails(prev => ({ ...prev, classId: v, sectionId: "" }))}
                        disabled={!promoDetails.programId}
                      >
                        <SelectTrigger className="bg-white"><SelectValue placeholder={promoDetails.programId ? "Select Class" : "Select Program First"} /></SelectTrigger>
                        <SelectContent>
                          {getClassesForProgram(promoDetails.programId).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Target Section (Optional)</Label>
                      <Select
                        value={promoDetails.sectionId}
                        onValueChange={(v) => setPromoDetails(prev => ({ ...prev, sectionId: v === "none" ? "" : v }))}
                        disabled={!promoDetails.classId}
                      >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Section" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Section</SelectItem>
                          {getSectionsForClass(promoDetails.programId, promoDetails.classId).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-[10px] text-orange-700 italic">
                    Note: Manual promotion will override standard class sequence and regenerate the financial installment plan.
                  </p>
                </div>
              )}

              {/* Reason input for expel, struck-off, rejoin */}
              {(promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && (
                <div className="space-y-4">
                   {promotionAction === "rejoin" && (
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="rejoinSameClass"
                          checked={rejoinDetails.sameClass}
                          onChange={(e) => setRejoinDetails(prev => ({ ...prev, sameClass: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="rejoinSameClass" className="text-blue-900 font-semibold cursor-pointer">
                          Re-join to same class/session (No new installments)
                        </Label>
                      </div>

                      {!rejoinDetails.sameClass && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                          <div className="col-span-2">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2">New Placement Details</h4>
                          </div>
                          <div>
                            <Label>Session *</Label>
                            <Select
                              value={rejoinDetails.sessionId}
                              onValueChange={(v) => setRejoinDetails(prev => ({ ...prev, sessionId: v }))}
                            >
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Select Session" /></SelectTrigger>
                              <SelectContent>
                                {academicSessions.map(s => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name} {s.isActive ? "(Current)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Program *</Label>
                            <Select
                              value={rejoinDetails.programId}
                              onValueChange={(v) => setRejoinDetails(prev => ({ ...prev, programId: v, classId: "", sectionId: "" }))}
                            >
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Select Program" /></SelectTrigger>
                              <SelectContent>
                                {programData.map(p => (
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
                              value={rejoinDetails.classId}
                              onValueChange={(v) => setRejoinDetails(prev => ({ ...prev, classId: v, sectionId: "" }))}
                              disabled={!rejoinDetails.programId}
                            >
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Select Class" /></SelectTrigger>
                              <SelectContent>
                                {getClassesForProgram(rejoinDetails.programId).map(c => (
                                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Section (Optional)</Label>
                            <Select
                              value={rejoinDetails.sectionId}
                              onValueChange={(v) => setRejoinDetails(prev => ({ ...prev, sectionId: v === "none" ? "" : v }))}
                              disabled={!rejoinDetails.classId}
                            >
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Select Section" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Section</SelectItem>
                                {getSectionsForClass(rejoinDetails.programId, rejoinDetails.classId).map(s => (
                                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Reason (Required)</Label>
                    <Textarea
                      placeholder={`Enter reason for ${promotionAction === "expel" ? "expulsion" : promotionAction === "struck-off" ? "striking off" : "re-joining"}...`}
                      value={promotionReason}
                      onChange={(e) => setPromotionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
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
                    ((promotionAction === "expel" || promotionAction === "struck-off" || promotionAction === "rejoin") && !promotionReason.trim()) ||
                    (promotionAction === "rejoin" && !rejoinDetails.sameClass && (!rejoinDetails.sessionId || !rejoinDetails.programId || !rejoinDetails.classId)) ||
                    (promotionAction === "promote_manual" && (!promoDetails.sessionId || !promoDetails.programId || !promoDetails.classId))
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


        {/* ID Card Dialog */}
        <Dialog open={idCardOpen} onOpenChange={setIdCardOpen}>
          <DialogContent className="max-w-3xl bg-white overflow-y-auto max-h-[90vh] text-black">
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
          <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
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
                      Unpaid fees will remain in this class history. Continue with promotion?
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
                      targetSectionId: promotionDialog.targetSectionId,
                      targetProgramId: promotionDialog.targetProgramId,
                      targetSessionId: promotionDialog.targetSessionId,
                      targetSession: promotionDialog.targetSession
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

        {/* Demote Confirmation Dialog */}
        <AlertDialog open={demoteConfirmOpen} onOpenChange={setDemoteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <TrendingDown className="h-5 w-5" /> Confirm Demotion
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 pt-2">
                <p className="font-semibold text-foreground">
                  You are about to demote {selectedForPromotion.length} student(s) to the previous class.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-sm text-destructive">
                  <p className="font-bold mb-1">⚠️ Warning: Challan Deletion</p>
                  <p>
                    Any <strong>unpaid challans</strong> associated with their current class will be
                    <strong> permanently deleted</strong> to prevent incorrect arrears, effectively resetting their financial record for this class.
                  </p>
                </div>
                <p>This action cannot be automatically undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDemoteConfirmOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setDemoteConfirmOpen(false);
                  bulkPromotionMut.mutate({
                    ids: selectedForPromotion,
                    action: "demote",
                    reason: promotionReason,
                  });
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Yes, Demote & Delete Challans
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Challan Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center text-lg font-bold">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Challan Details & Preview
                </div>
                {selectedChallanDetails && (
                  <Badge variant="outline" className="text-xs font-mono">
                    #{selectedChallanDetails.challanNumber}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedChallanDetails && (
              <div className="space-y-6 pt-2">
                {/* Header Summary */}
                <div className="bg-muted/50 p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {selectedChallanDetails.student?.fName?.[0]}{selectedChallanDetails.student?.lName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{selectedChallanDetails.student?.fName} {selectedChallanDetails.student?.lName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black">{selectedChallanDetails.student?.rollNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-black">Installment</span>
                      <span className="text-xs font-bold font-mono">
                        {selectedChallanDetails.installmentNumber === 0 ? "Extra Bill" : `#${selectedChallanDetails.installmentNumber}`}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-black">Issue Date</span>
                      <span className="text-xs font-bold">{new Date(selectedChallanDetails.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-black">Due Date</span>
                      <span className="text-xs font-bold text-destructive">{new Date(selectedChallanDetails.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Billing Breakdown Card */}
                  <Card className="shadow-sm border-primary/10 overflow-hidden">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" /> Billing Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {selectedChallanDetails.amount > 0 && (
                        <div className="flex justify-between text-sm py-1 border-b border-dashed border-muted">
                          <span className="text-muted-foreground">Base Tuition Fee</span>
                          <span className="font-semibold text-foreground">PKR {Math.round(selectedChallanDetails.amount - (selectedChallanDetails.arrearsAmount || 0)).toLocaleString()}</span>
                        </div>
                      )}

                      {selectedChallanDetails.arrearsAmount > 0 && (
                        <div className="flex justify-between text-sm py-1 border-b border-dashed border-muted text-red-600">
                          <span className="flex items-center gap-1 font-medium"><History className="w-3 h-3" /> Arrears Balance</span>
                          <span className="font-bold">PKR {Math.round(selectedChallanDetails.arrearsAmount).toLocaleString()}</span>
                        </div>
                      )}

                      {/* Fee Heads Breakdown */}
                      {(() => {
                        let heads = [];
                        try {
                          const rawHeads = selectedChallanDetails.selectedHeads;
                          heads = typeof rawHeads === 'string' ? JSON.parse(rawHeads || '[]') : (Array.isArray(rawHeads) ? rawHeads : []);
                        } catch (e) { console.error(e); }

                        const activeHeads = heads.filter(h => typeof h === 'object' && h !== null && h.isSelected && h.amount > 0);
                        return activeHeads.map((head, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1 border-b border-dashed border-muted/50 last:border-0 opacity-80">
                            <span className="text-muted-foreground">{head.name}</span>
                            <span>PKR {Math.round(head.amount).toLocaleString()}</span>
                          </div>
                        ));
                      })()}

                      {selectedChallanDetails.lateFeeFine > 0 && (
                        <div className="flex justify-between text-sm py-1 border-b border-dashed border-muted text-destructive">
                          <span className="font-medium italic">Late Fee Penalty</span>
                          <span className="font-bold">PKR {Math.round(selectedChallanDetails.lateFeeFine).toLocaleString()}</span>
                        </div>
                      )}

                      {selectedChallanDetails.discount > 0 && (
                        <div className="flex justify-between text-sm py-1 border-b border-dashed border-muted text-green-600">
                          <span className="font-medium">Scholarship Discount</span>
                          <span className="font-bold">- PKR {Math.round(selectedChallanDetails.discount).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-primary/20">
                        <span className="text-xs font-black text-primary uppercase">Total Billable</span>
                        <span className="text-lg font-black text-primary">
                          PKR {Math.round(
                            (selectedChallanDetails.amount || 0) +
                            (selectedChallanDetails.fineAmount || 0) +
                            (selectedChallanDetails.lateFeeFine || 0) -
                            (selectedChallanDetails.discount || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status & Balance Card */}
                  <Card className={cn(
                    "shadow-sm overflow-hidden",
                    selectedChallanDetails.status === "PAID" ? "border-success/20" : "border-warning/20 bg-warning/5"
                  )}>
                    <CardHeader className={cn(
                      "pb-2",
                      selectedChallanDetails.status === "PAID" ? "bg-success/5" : "bg-warning/10"
                    )}>
                      <CardTitle className={cn(
                        "text-xs font-bold uppercase tracking-wider flex items-center gap-2",
                        selectedChallanDetails.status === "PAID" ? "text-success" : "text-warning-800"
                      )}>
                        {selectedChallanDetails.status === "PAID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                        Collection Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-success/10 shadow-inner text-center">
                          <p className="text-[9px] font-black text-success uppercase mb-1">Total Paid</p>
                          <p className="text-base font-black text-success">PKR {Math.round(selectedChallanDetails.paidAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-warning/10 shadow-inner text-center">
                          <p className="text-[9px] font-black text-warning-700 uppercase mb-1">Outstanding</p>
                          <p className="text-base font-black text-warning-700">
                            PKR {Math.round(Math.max(0, (
                              (selectedChallanDetails.amount || 0) +
                              (selectedChallanDetails.fineAmount || 0) +
                              (selectedChallanDetails.lateFeeFine || 0) -
                              (selectedChallanDetails.discount || 0)
                            ) - (selectedChallanDetails.paidAmount || 0))).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t pt-3 mt-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground uppercase font-bold text-[10px]">Current Status:</span>
                          <Badge variant={selectedChallanDetails.status === "PAID" ? "default" : (selectedChallanDetails.status === "OVERDUE" ? "destructive" : "secondary")}>
                            {selectedChallanDetails.status}
                          </Badge>
                        </div>
                        {selectedChallanDetails.paidDate && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground uppercase font-bold text-[10px]">Last Payment:</span>
                            <span className="font-bold text-success">{new Date(selectedChallanDetails.paidDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedChallanDetails.paidBy && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground uppercase font-bold text-[10px]">Pay Method:</span>
                            <span className="font-medium px-2 py-0.5 bg-muted rounded">{selectedChallanDetails.paidBy}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Information Section (Remarks) */}
                {selectedChallanDetails.remarks && (
                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
                    <History className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-blue-800 uppercase font-black">Admin Remarks</span>
                      <p className="text-xs text-blue-700 font-medium italic">"{selectedChallanDetails.remarks}"</p>
                    </div>
                  </div>
                )}

                {/* Detailed Payment History */}
                {(() => {
                  const history = typeof selectedChallanDetails.paymentHistory === 'string'
                    ? JSON.parse(selectedChallanDetails.paymentHistory)
                    : (selectedChallanDetails.paymentHistory || []);

                  if (!Array.isArray(history) || history.length === 0) return null;

                  return (
                    <Card className="shadow-sm border-muted/20 overflow-hidden">
                      <CardHeader className="pb-2 bg-muted/30">
                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <History className="w-3.5 h-3.5" /> Transaction Logs (Breakdown)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-muted/10 h-8">
                            <TableRow className="border-b h-8">
                              <TableHead className="text-[10px] font-bold uppercase h-8 pl-4">Date</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase h-8">Received</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase h-8">Disc.</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase h-8">Mode</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase h-8">Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {history.map((entry, idx) => (
                              <TableRow key={idx} className="h-10 hover:bg-muted/10 border-b last:border-0 transition-colors">
                                <TableCell className="text-xs pl-4 font-medium">{new Date(entry.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-xs font-black text-success">PKR {Math.round(entry.amount).toLocaleString()}</TableCell>
                                <TableCell className="text-xs font-black text-orange-600">PKR {Math.round(entry.discount || 0).toLocaleString()}</TableCell>
                                <TableCell className="text-[10px] font-bold">
                                  <span className="bg-muted px-2 py-0.5 rounded-full">{entry.method || 'Cash'}</span>
                                </TableCell>
                                <TableCell className="text-[10px] italic text-muted-foreground truncate max-w-[200px]">{entry.remarks || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            <DialogFooter className="border-t pt-4 mt-2">
              <Button size="sm" variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close Overview</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction History - {selectedChallanForHistory?.challanNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      if (!selectedChallanForHistory?.paymentHistory) return <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transaction history found.</TableCell></TableRow>;
                      const history = typeof selectedChallanForHistory.paymentHistory === 'string'
                        ? JSON.parse(selectedChallanForHistory.paymentHistory)
                        : selectedChallanForHistory.paymentHistory;

                      if (!Array.isArray(history) || history.length === 0) return <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transaction history found.</TableCell></TableRow>;

                      return history.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-bold text-green-600">PKR {Math.round(entry.amount).toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-orange-600">PKR {Math.round(entry.discount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{entry.method || 'Cash'}</TableCell>
                          <TableCell className="text-xs italic">{entry.remarks || '-'}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout >
  );
};

export default Students;
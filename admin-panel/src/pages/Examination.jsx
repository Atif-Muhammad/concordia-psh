import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Award,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  Trophy,
  Printer,
  Eye,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { StudentResultsTab } from "./StudentResultsTab";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExam as createExamApi,
  updateExam,
  delExam,
  getExams,
  getProgramNames,
  createMarks,
  updateMarks,
  delMarks,
  getMarks,
  createResult,
  updateResult,
  delResult,
  getResults,
  getStudents,
  bulkCreateMarks,
  getSubjects,
  getSubjectClassMappings,
  generateResults,
  getPositions,
  generatePositions,
  delPosition,
  getStudentResult,
  getDefaultReportCardTemplate,
  getTeacherClasses,
  getAcademicSessions
} from "../../config/apis";

const Examination = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [examSearch, setExamSearch] = useState("");
  const [examDateFilter, setExamDateFilter] = useState("");
  const [examTimeFilter, setExamTimeFilter] = useState("");
  const [examDialog, setExamDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [viewExamDialog, setViewExamDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [examForm, setExamForm] = useState({
    examName: "",
    program: "",
    classId: "",
    session: "",
    sessionId: "",
    startDate: "",
    endDate: "",
    type: "",
    description: "",
    schedule: [], // Array of { subjectId, date, startTime, endTime }
  });

  const [resultFilterProgram, setResultFilterProgram] = useState("");
  const [resultFilterClass, setResultFilterClass] = useState("");
  const [resultFilterSection, setResultFilterSection] = useState("");
  const [marksFilterProgram, setMarksFilterProgram] = useState("");
  const [marksFilterClass, setMarksFilterClass] = useState("");
  const [marksFilterExam, setMarksFilterExam] = useState("");
  const [marksFilterSection, setMarksFilterSection] = useState("");
  const [examSessionFilter, setExamSessionFilter] = useState("");
  const [marksSessionFilter, setMarksSessionFilter] = useState("");
  const [resultsSessionFilter, setResultsSessionFilter] = useState("");
  const [positionsFilterProgram, setPositionsFilterProgram] = useState("");
  const [positionsFilterExam, setPositionsFilterExam] = useState("");
  const [positionsFilterClass, setPositionsFilterClass] = useState("");
  const [positionsFilterSection, setPositionsFilterSection] = useState("");

  // Student Results filters
  const [studentResultProgram, setStudentResultProgram] = useState("");
  const [studentResultClass, setStudentResultClass] = useState("");
  const [studentResultSection, setStudentResultSection] = useState("");
  const [studentResultStudent, setStudentResultStudent] = useState("");
  const [studentResultExam, setStudentResultExam] = useState("");
  const [studentResultData, setStudentResultData] = useState(null);

  // Cascading filter resets
  useEffect(() => {
    setMarksFilterClass("");
    setMarksFilterExam("");
    setMarksFilterSection("");
  }, [marksFilterProgram]);

  useEffect(() => {
    setMarksFilterExam("");
    setMarksFilterSection("");
  }, [marksFilterClass]);

  useEffect(() => {
    setResultFilterClass("");
    setResultFilterSection("");
  }, [resultFilterProgram]);

  useEffect(() => {
    setResultFilterSection("");
  }, [resultFilterClass]);

  // Session filter cascade resets
  useEffect(() => {
    setMarksFilterProgram("");
    setMarksFilterClass("");
    setMarksFilterSection("");
    setMarksFilterExam("");
  }, [marksSessionFilter]);

  useEffect(() => {
    setResultFilterProgram("");
    setResultFilterClass("");
  }, [resultsSessionFilter]);

  // Bulk Marks Entry States
  const [bulkMarksDialog, setBulkMarksDialog] = useState(false);
  const [bulkMarksEditMode, setBulkMarksEditMode] = useState(false); // true when opened from table row edit
  const [viewMarksDetail, setViewMarksDetail] = useState(null); // { examId, student, marks[] }
  const [bulkExamId, setBulkExamId] = useState("");
  const [bulkSectionId, setBulkSectionId] = useState("");
  const [bulkMarksData, setBulkMarksData] = useState({}); // { studentId: { subjectId: obtainedMarks } }
  const [bulkAbsentees, setBulkAbsentees] = useState({}); // { studentId: { subjectId: isAbsent } }

  useEffect(() => {
    setPositionsFilterClass("");
    setPositionsFilterExam("");
    setPositionsFilterSection("");
  }, [positionsFilterProgram]);

  useEffect(() => {
    setPositionsFilterExam("");
    setPositionsFilterSection("");
  }, [positionsFilterClass]);

  useEffect(() => {
    setPositionsFilterSection("");
  }, [positionsFilterExam]);

  // Student Results cascading resets
  useEffect(() => {
    setStudentResultClass("");
    setStudentResultSection("");
    setStudentResultStudent("");
    setStudentResultExam("");
    setStudentResultData(null);
  }, [studentResultProgram]);

  useEffect(() => {
    setStudentResultSection("");
    setStudentResultStudent("");
    setStudentResultExam("");
    setStudentResultData(null);
  }, [studentResultClass]);

  useEffect(() => {
    setStudentResultStudent("");
    setStudentResultExam("");
    setStudentResultData(null);
  }, [studentResultSection]);

  useEffect(() => {
    setStudentResultExam("");
    setStudentResultData(null);
  }, [studentResultStudent]);

  useEffect(() => {
    setStudentResultData(null);
  }, [studentResultExam]);


  const [resultForm, setResultForm] = useState({
    studentId: "",
    examId: "",
    totalMarks: "",
    obtainedMarks: "",
    percentage: "",
    gpa: "",
    grade: "",
    position: "",
    remarks: "",
  });

  // === REACT QUERY DATA FETCHING ===
  const currentUser = queryClient.getQueryData(["currentUser"]);
  const isTeacher =
    currentUser?.role === "TEACHER" || currentUser?.role === "Teacher";

  const { data: teacherClassMappings = [] } = useQuery({
    queryKey: ["teacherClasses"],
    queryFn: getTeacherClasses,
    enabled: isTeacher,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: getProgramNames,
  });
  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: getExams,
  });
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents("", "", "", ""),
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  // SCM mappings for the class selected in the exam form (session-aware)
  const { data: examFormScmMappings = [] } = useQuery({
    queryKey: ["scmMappings", "examForm", examForm.classId, examForm.sessionId],
    queryFn: () => getSubjectClassMappings(examForm.sessionId ? Number(examForm.sessionId) : undefined),
    enabled: !!examForm.classId,
  });
  // Subjects for the exam form date sheet — derived from SCM mappings for the selected class
  const examFormClassSubjects = examForm.classId
    ? examFormScmMappings
        .filter(m => m.classId === Number(examForm.classId))
        .map(m => ({ id: m.subjectId, name: m.subject?.name || `Subject #${m.subjectId}`, ...m.subject }))
    : [];
  const { data: marks = [] } = useQuery({
    queryKey: ["marks", marksFilterExam, marksFilterSection],
    queryFn: () =>
      getMarks(
        marksFilterExam && marksFilterExam !== "*" ? marksFilterExam : undefined,
        marksFilterSection && marksFilterSection !== "*"
          ? marksFilterSection
          : undefined
      ),
    enabled:
      !!(marksFilterExam && marksFilterExam !== "*") ||
      !!(marksFilterSection && marksFilterSection !== "*"), // Only fetch when at least one filter is selected
  });

  const selectedExamForMarks = exams.find(e => e.id.toString() === (bulkExamId || marksFilterExam));
  const { data: studentsForMarksEntry = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", "marks-entry", selectedExamForMarks?.id, bulkSectionId],
    queryFn: () => getStudents(
      selectedExamForMarks?.programId,
      selectedExamForMarks?.classId,
      bulkSectionId && bulkSectionId !== "*" ? bulkSectionId : "",
      "",
      "ACTIVE",
      "",
      "",
      1,
      1000 // Large limit to fetch all students
    ),
    enabled: !!selectedExamForMarks,
  });

  const { data: existingMarksForBulk = [], isLoading: isLoadingExistingMarks } = useQuery({
    queryKey: ["marks", "bulk-entry", bulkExamId, bulkSectionId],
    queryFn: () => getMarks(bulkExamId, bulkSectionId),
    enabled: bulkMarksDialog && !!bulkExamId && !!bulkSectionId,
  });

  useEffect(() => {
    if (bulkMarksDialog && existingMarksForBulk.length > 0) {
      const marksData = {};
      const absenteesData = {};
      existingMarksForBulk.forEach(mark => {
        if (!marksData[mark.studentId]) marksData[mark.studentId] = {};
        if (!absenteesData[mark.studentId]) absenteesData[mark.studentId] = {};

        // Match by subject name (from ExamSchedule subjectId)
        marksData[mark.studentId][mark.subject] = mark.obtainedMarks.toString();
        absenteesData[mark.studentId][mark.subject] = mark.isAbsent;
      });
      setBulkMarksData(marksData);
      setBulkAbsentees(absenteesData);
    }
  }, [existingMarksForBulk, bulkMarksDialog]);

  const { data: results = [] } = useQuery({
    queryKey: ["results", resultFilterProgram],
    queryFn: getResults,
    enabled: !!(resultFilterProgram && resultFilterProgram !== "*") // Only fetch when program is selected
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions", positionsFilterExam, positionsFilterClass],
    queryFn: () => getPositions(
      positionsFilterExam && positionsFilterExam !== "*" ? positionsFilterExam : undefined,
      positionsFilterClass && positionsFilterClass !== "*" ? positionsFilterClass : undefined
    ),
    enabled: !!(positionsFilterExam && positionsFilterExam !== "*")
  });

  const { data: sessions = [], isLoading: isLoadingSessions, isError: isSessionsError } = useQuery({
    queryKey: ["academicSessions"],
    queryFn: getAcademicSessions,
  });

  useEffect(() => {
    if (isSessionsError) {
      toast({ title: "Failed to load academic sessions", variant: "destructive" });
    }
  }, [isSessionsError]);

  // Derived session-filtered exam lists
  const sessionFilteredExams = examSessionFilter
    ? exams.filter(e => e.session === sessions.find(s => s.id.toString() === examSessionFilter)?.name)
    : exams;

  const marksSessionName = sessions.find(s => s.id.toString() === marksSessionFilter)?.name;
  const marksSessionFilteredExams = marksSessionFilter
    ? exams.filter(e => e.session === marksSessionName)
    : exams;

  const resultsSessionName = sessions.find(s => s.id.toString() === resultsSessionFilter)?.name;
  const resultsSessionFilteredExams = resultsSessionFilter
    ? exams.filter(e => e.session === resultsSessionName)
    : exams;

  const getFullName = (student) => {
    console.log("::::", student);
    return `${student.fName} ${student.lName || ""}`.trim();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Align with local time for input datetime-local
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Classes from selected program
  const selectedProgram = programs.find((p) => p.id === Number(examForm.program));
  const availableClasses = isTeacher
    ? teacherClassMappings
        .filter((m) => m.class?.programId === Number(examForm.program))
        .map((m) => m.class)
        .filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx)
    : selectedProgram?.classes || [];
  // === MUTATIONS ===
  const createExam = useMutation({
    mutationFn: createExamApi,
    onSuccess: () => {
      toast({ title: "Exam created successfully" });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setExamForm({
        examName: "", program: "", classId: "", session: "", sessionId: "",
        startDate: "", endDate: "", type: "", description: "",
      });
      setExamDialog(false);
      setEditingExam(null);
    },
    onError: (err) => toast({ title: err.message || "Failed to create exam", variant: "destructive" }),
  });

  const updateExamMutation = useMutation({
    mutationFn: ({ id, payload }) => updateExam(id, payload),
    onSuccess: () => {
      toast({ title: "Exam updated" });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setExamDialog(false);
      setEditingExam(null);
    },
    onError: (err) => toast({ title: err.message || "Failed to update exam", variant: "destructive" }),
  });

  const deleteExamMutation = useMutation({
    mutationFn: delExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
  });

  const { mutate: createMarksMutation } = useMutation({
    mutationFn: createMarks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] })
      toast({ title: "Successfully assigned marks" })
      // setMarksDialog(false); // Keep dialog open for rapid entry
      setEditingMarks(null);
      setMarksForm((prev) => ({
        ...prev,
        studentId: "",
        obtainedMarks: "",
        teacherRemarks: "",
        // Keep examId, subject, totalMarks
      }));
    },
    onError: (err) => toast({ title: err.message || "Failed to create exam marks", variant: "destructive" }),
  });

  const { mutate: updateMarksMutation } = useMutation({
    mutationFn: ({ id, payload }) => updateMarks(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] })
      toast({ title: "Successfully updated marks" })
      setMarksDialog(false);
      setEditingMarks(null);
      setMarksForm({
        examId: "",
        studentId: "",
        subject: "",
        totalMarks: "",
        obtainedMarks: "",
        teacherRemarks: "",
      });
    },
    onError: (err) => toast({ title: err.message || "Failed to update exam marks", variant: "destructive" }),
  });

  const deleteMarksMutation = useMutation({
    mutationFn: delMarks,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marks"] }),
    onError: (err) => toast({ title: err.message || "Failed to create exam marks", variant: "destructive" }),
  });

  const createResultMutation = useMutation({
    mutationFn: createResult,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["results"] }),
  });

  const updateResultMutation = useMutation({
    mutationFn: ({ id, payload }) => updateResult(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast({ title: "Result updated successfully" });
    },
    onError: (err) => toast({ title: err.message || "Failed to update result", variant: "destructive" }),
  });

  const deleteResultMutation = useMutation({
    mutationFn: delResult,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["results"] }),
  });

  const generateResultsMutation = useMutation({
    mutationFn: ({ examId, classId }) => generateResults(examId, classId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast({
        title: "Results generated successfully",
        description: `Generated ${data?.length || 0} results`
      });
      setResultDialog(false);
    },
    onError: (err) => {
      console.error('Generate results error:', err);
      toast({
        title: "Failed to generate results",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    },
  });

  const generatePositionsMutation = useMutation({
    mutationFn: ({ examId, classId }) => generatePositions(examId, classId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Positions generated successfully",
        description: `Generated ${data?.length || 0} positions`
      });
    },
    onError: (err) => {
      console.error('Generate positions error:', err);
      toast({
        title: "Failed to generate positions",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: delPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({ title: "Position deleted" });
    },
  });

  const bulkMarksMutation = useMutation({
    mutationFn: bulkCreateMarks,
    onSuccess: () => {
      queryClient.invalidateQueries(["marks"]);
      queryClient.invalidateQueries(["results"]);
      queryClient.invalidateQueries(["positions"]);
      toast({ title: "Marks updated successfully" });
      setBulkMarksDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error saving marks",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const studentResultMutation = useMutation({
    mutationFn: () => getStudentResult(studentResultStudent, studentResultExam),
    onSuccess: (data) => {
      setStudentResultData(data);
      toast({ title: "Result fetched successfully" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to fetch result", variant: "destructive" });
    },
  });

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return { grade: "A+", gpa: 4.0 };
    if (percentage >= 80) return { grade: "A", gpa: 3.7 };
    if (percentage >= 70) return { grade: "B+", gpa: 3.3 };
    if (percentage >= 60) return { grade: "B", gpa: 3.0 };
    if (percentage >= 50) return { grade: "C", gpa: 2.5 };
    if (percentage >= 40) return { grade: "D", gpa: 2.0 }; // Adding missing grade for 40-50 range just in case, though original code stopped at C
    if (percentage >= 33) return { grade: "E", gpa: 1.0 }; // Matches backend logic better if needed
    return { grade: "F", gpa: 0.0 };
  };

  const handleExamSubmit = () => {
    if (!examForm.examName || !examForm.program || !examForm.classId || !examForm.session) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const payload = {
      examName: examForm.examName,
      programId: Number(examForm.program),
      classId: Number(examForm.classId),
      session: examForm.session,
      sessionId: examForm.sessionId ? Number(examForm.sessionId) : undefined,
      // Pass the full ISO string as collected from new Date(datetime-local value).toISOString() or similar
      // Actually datetime-local value is "YYYY-MM-DDTHH:mm" which is ISO-compatible for constructor
      startDate: new Date(examForm.startDate).toISOString(),
      endDate: new Date(examForm.endDate).toISOString(),
      type: examForm.type || "Final",
      description: examForm.description,
      schedule: examForm.schedule?.filter(s => s.included && s.date && s.startTime && s.endTime), // Only send complete and included entries
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, payload });
    } else {
      createExam.mutate(payload);
    }
  };

  const handlePrintDateSheet = (exam) => {
    const printWindow = window.open("", "_blank");
    const programName = exam.program?.name || "N/A";
    const className = exam.class?.name || "N/A";

    const scheduleRows = (exam.schedules || []).map(s => {
      const subject = subjects.find(sub => sub.id === s.subjectId);
      return `
        <tr>
          <td style="padding: 12px; border: 1px solid #ccc; font-weight: bold; color: #ed7d31;">${subject?.name || "Unknown"}</td>
          <td style="padding: 12px; border: 1px solid #ccc;">${s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}</td>
          <td style="padding: 12px; border: 1px solid #ccc; text-align: center;">${s.startTime}</td>
          <td style="padding: 12px; border: 1px solid #ccc; text-align: center;">${s.endTime}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Date Sheet - ${exam.examName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          body { font-family: 'Roboto', sans-serif; margin: 0; padding: 40px; -webkit-print-color-adjust: exact; color: #333; }
          .header { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #ed7d31; padding-bottom: 20px; }
          .logo { width: 80px; height: auto; }
          .institute-info { text-align: center; }
          .institute-info h1 { margin: 0; font-size: 28px; font-weight: bold; color: #000; text-transform: uppercase; }
          .institute-info p { margin: 5px 0; font-size: 14px; color: #555; font-weight: 500; }
          .title-bar { background-color: #ed7d31; color: white; text-align: center; padding: 12px; font-weight: bold; font-size: 18px; margin-bottom: 30px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
          .details-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #fffaf7; padding: 20px; border: 1px solid #ffe8d9; border-radius: 8px; }
          .detail-item { display: flex; border-bottom: 1px solid #eee; padding: 8px 0; }
          .detail-label { font-weight: bold; width: 140px; color: #ed7d31; font-size: 13px; text-transform: uppercase; }
          .detail-value { font-size: 14px; color: #000; font-weight: 500; }
          .schedule-table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #ccc; }
          .schedule-table th { background-color: #ed7d31; color: white; padding: 12px 15px; text-align: left; font-size: 13px; font-weight: bold; text-transform: uppercase; border: 1px solid #ed7d31; }
          .schedule-table td { padding: 12px 15px; border: 1px solid #ccc; font-size: 14px; color: #333; }
          .schedule-table tr:nth-child(even) { background-color: #f9f9f9; }
          .description-box { margin-top: 30px; padding: 20px; background: #f9f9f9; border-left: 4px solid #ed7d31; font-style: italic; font-size: 13px; line-height: 1.6; }
          .signatures { display: flex; justify-content: space-between; margin-top: 80px; }
          .sig-box { text-align: center; width: 220px; }
          .sig-line { border-top: 2px solid #000; margin-bottom: 10px; }
          .sig-label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #555; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img class="logo" src="${import.meta.env.VITE_API_URL}/uploads/template-requirements/logo.png" />
          <div class="institute-info">
            <h1>Concordia College Peshawar</h1>
            <p>60-C, Near NCS School, University Town Peshawar</p>
            <p>091-5619915 | 0332-8581222</p>
          </div>
        </div>
        <div class="title-bar">EXAMINATION DATE SHEET - ${exam.examName}</div>
        <div class="details-container">
          <div class="left-col">
            <div class="detail-item"><div class="detail-label">Exam Type:</div><div class="detail-value">${exam.type}</div></div>
            <div class="detail-item"><div class="detail-label">Session:</div><div class="detail-value">${exam.session}</div></div>
            <div class="detail-item"><div class="detail-label">Program:</div><div class="detail-value">${programName}</div></div>
          </div>
          <div class="right-col">
            <div class="detail-item"><div class="detail-label">Class:</div><div class="detail-value">${className}</div></div>
            <div class="detail-item"><div class="detail-label">Start Date:</div><div class="detail-value">${new Date(exam.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div></div>
            <div class="detail-item"><div class="detail-label">End Date:</div><div class="detail-value">${new Date(exam.endDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div></div>
          </div>
        </div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th style="text-align: center;">Start Time</th>
              <th style="text-align: center;">End Time</th>
            </tr>
          </thead>
          <tbody>
            ${scheduleRows || '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;">No schedule entries found for this exam.</td></tr>'}
          </tbody>
        </table>
        ${exam.description ? `<div class="description-box"><strong>Important Notes:</strong><br/>${exam.description}</div>` : ''}
        <div class="signatures">
          <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Exam Controller</div></div>
          <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Principal Signature</div></div>
        </div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openEditExam = (exam) => {
    setEditingExam(exam);
    const sessionId = exam.sessionId
      ? exam.sessionId.toString()
      : (sessions.find(s => s.name === exam.session)?.id?.toString() || "");
    setExamForm({
      examName: exam.examName,
      program: exam.programId?.toString() || "",
      classId: exam.classId?.toString() || "",
      session: exam.session,
      sessionId,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split("T")[0] : "",
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split("T")[0] : "",
      type: exam.type || "",
      description: exam.description || "",
      schedule: exam.schedules?.map(s => ({
        subjectId: s.subjectId,
        date: s.date ? s.date.split("T")[0] : "",
        startTime: s.startTime,
        endTime: s.endTime,
        totalMarks: s.totalMarks || 100,
        included: true
      })) || [],
    });
    setExamDialog(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "exam") deleteExamMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "marks") deleteMarksMutation.mutate(deleteTarget.id);
    if (deleteTarget.type === "result") deleteResultMutation.mutate(deleteTarget.id);
    toast({ title: `${deleteTarget.type} deleted` });
    setDeleteDialog(false);
    setDeleteTarget(null);
  };

  const printResults = (examId) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    const filtered = results
      .filter((r) => r.examId === examId)
      .sort((a, b) => b.percentage - a.percentage);

    const printWin = window.open("", "_blank");
    printWin?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${exam.examName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 10px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${exam.examName} - Results</h1>
        <h2>Session: ${exam.session}</h2>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Name</th>
              <th>Roll No</th>
              <th>Total</th>
              <th>Obtained</th>
              <th>%</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((r, i) => {
      const s = r.student;
      return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${getFullName(s) || "N/A"}</td>
                  <td>${s?.rollNumber || "N/A"}</td>
                  <td>${r.totalMarks}</td>
                  <td>${r.obtainedMarks}</td>
                  <td>${r.percentage.toFixed(2)}%</td>
                  <td>${r.grade}</td>
                </tr>
              `;
    }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWin?.document.close();
    printWin?.print();
  };
  const handleResultSubmit = () => {
    const percentage = Number(resultForm.percentage);
    const gradeData = calculateGrade(percentage);
    const resultData = {
      ...resultForm,
      totalMarks: Number(resultForm.totalMarks),
      obtainedMarks: Number(resultForm.obtainedMarks),
      percentage,
      gpa: gradeData.gpa,
      grade: gradeData.grade,
      position: Number(resultForm.position),
    };
    if (editingResult) {
      updateResultMutation.mutate({ id: editingResult.id, payload: resultData });
    } else {
      createResultMutation.mutate(resultData);
      toast({
        title: "Result generated successfully",
      });
    }
    setResultDialog(false);
    setEditingResult(null);
    setResultForm({
      studentId: "",
      examId: "",
      totalMarks: "",
      obtainedMarks: "",
      percentage: "",
      gpa: "",
      grade: "",
      position: "",
      remarks: "",
    });
  };

  const openEditResult = (result) => {
    setEditingResult(result);
    setResultForm({
      studentId: result.studentId,
      examId: result.examId,
      totalMarks: result.totalMarks.toString(),
      obtainedMarks: result.obtainedMarks.toString(),
      percentage: result.percentage.toString(),
      gpa: result.gpa.toString(),
      grade: result.grade,
      position: result.position.toString(),
      remarks: result.remarks || "",
    });
    setResultDialog(true);
  };

  const printPositions = () => {
    if (positions.length === 0) {
      toast({ title: "No positions to print", variant: "destructive" });
      return;
    }

    const groupedPositions = positions.reduce((acc, pos) => {
      const examKey = `${pos.exam.examName} - ${pos.exam.session}`;
      const classKey = pos.class.name;

      if (!acc[examKey]) acc[examKey] = {};
      if (!acc[examKey][classKey]) acc[examKey][classKey] = [];
      acc[examKey][classKey].push(pos);

      return acc;
    }, {});

    const printWin = window.open("", "_blank");
    printWin?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Rankings</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 10px; }
          h1, h2, h3 { margin: 10px 0; }
          .page-break { page-break-after: always; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Student Rankings</h1>
        ${Object.entries(groupedPositions).map(([examName, classes]) => `
          <div class="exam-section">
            <h2>${examName}</h2>
            ${Object.entries(classes).map(([className, classPositions]) => `
              <h3>Class: ${className}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Total</th>
                    <th>Obtained</th>
                    <th>%</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  ${classPositions.map((pos) => `
                    <tr>
                      <td>${pos.position} ${pos.position === 1 ? '🥇' : pos.position === 2 ? '🥈' : pos.position === 3 ? '🥉' : ''}</td>
                      <td>${getFullName(pos.student)}</td>
                      <td>${pos.student.rollNumber}</td>
                      <td>${pos.totalMarks}</td>
                      <td>${pos.obtainedMarks}</td>
                      <td>${pos.percentage.toFixed(2)}%</td>
                      <td>${pos.grade}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `).join("")}
            <div class="page-break"></div>
          </div>
        `).join("")}
      </body>
      </html>
    `);
    printWin?.document.close();
    printWin?.print();
  };

  const printStudentResult = async () => {
    if (!studentResultData) {
      toast({ title: "No result to print", variant: "destructive" });
      return;
    }

    const { student, exam, marks, result, position } = studentResultData;
    console.log("Printing Result:", { student, exam, result }); // Debug log

    try {
      // Fetch the default template
      const template = await getDefaultReportCardTemplate();

      if (!template) {
        toast({
          title: "No default template found",
          description: "Please set a default report card template in Configuration",
          variant: "destructive"
        });
        return;
      }

      // Prepare subject data for the template
      const subjectsData = marks.map(mark => ({
        name: mark.subject,
        totalMarks: mark.totalMarks,
        obtainedMarks: mark.obtainedMarks,
        percentage: ((mark.obtainedMarks / mark.totalMarks) * 100).toFixed(2),
        grade: calculateGrade((mark.obtainedMarks / mark.totalMarks) * 100).grade,
        isAbsent: mark.isAbsent || false,
      }));

      // Check if program year <= 2 to conditionally hide GPA
      const programYear = exam.program?.year || exam.class?.year || 3; // Default to 3 if not found
      const showGPA = programYear > 2;

      // Generate Marks Rows HTML
      // Generate Marks Rows HTML
      const marksRowsHtml = subjectsData.map((subject, index) => `
      < tr style = "border-bottom: 1px solid #000;" >
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${index + 1}</td>
          <td style="border-right: 1px solid #000; padding: 4px;">${subject.name}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${subject.totalMarks}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px; ${subject.isAbsent ? 'background-color: #fee2e2; color: #dc2626; font-weight: bold;' : ''}">${subject.isAbsent ? 'Absent' : subject.obtainedMarks}</td>
          <td style="text-align: center; border-right: 1px solid #000; padding: 4px;">${subject.percentage}%</td>
          <td style="text-align: center; padding: 4px;">${subject.grade}</td>
        </tr >
  `).join("");

      // Start with the template
      let filledTemplate = template.htmlContent;
      const printDate = new Date().toLocaleString();

      // Replace placeholers
      filledTemplate = filledTemplate
        // Institutional Info
        .replace(/{{instituteName}}/g, 'Concordia College')
        .replace(/{{instituteAddress}}/g, 'Peshawar, Pakistan')

        // Exam Info
        .replace(/{{examType}}/g, exam.type || exam.examName || '') // Used in title
        .replace(/{{examName}}/g, exam.examName || '')
        .replace(/{{session}}/g, exam.session || '')
        .replace(/{{printDate}}/g, printDate)

        // Student Info
        .replace(/{{studentName}}/g, getFullName(student))
        .replace(/{{fatherName}}/g, student.fatherOrguardian || 'N/A')
        .replace(/{{rollNo}}/g, student.rollNumber || 'N/A')
        .replace(/{{regNo}}/g, student.rollNumber || 'N/A')
        .replace(/{{admNo}}/g, student.id || 'N/A')
        .replace(/{{class}}/g, exam.class?.name + (exam?.program?.name ? ` (${exam?.program?.name})` : '') || (student.class ? student.class.name : '') + (exam?.program?.name ? `(${exam?.program?.name})` : ''))
        .replace(/{{section}}/g, student.section ? student.section.name : '')
        .replace(/{{sectionVisibilityClass}}/g, student.section ? '' : 'hidden-section')

        // Photo
        .replace(
          /{{studentPhotoOrPlaceholder}}/g,
          student.photo_url
            ? `< img src = "${student.photo_url}" alt = "Student Photo" style = "width: 100%; height: 100%; object-fit: cover;" /> `
            : `< div class="student-pho" style = "font-size: 10px; color: #666;" > No Photo</div > `
        )
        .replace(/{{studentPhoto}}/g, student.photo_url || '')

        // Marks Table
        .replace(/{{marksRows}}/g, marksRowsHtml)

        // Totals & Results
        .replace(/{{totalMarks}}/g, result.totalMarks)
        .replace(/{{obtainedMarks}}/g, result.obtainedMarks)
        .replace(/{{percentage}}/g, result.percentage.toFixed(2))
        .replace(/{{grade}}/g, result.grade)
        .replace(/{{gradeColor}}/g, result.grade === 'F' ? '#dc2626' : '#059669')
        .replace(/{{gpa}}/g, showGPA ? result.gpa.toFixed(2) : 'N/A')
        .replace(/{{position}}/g, position || 'N/A')
        .replace(/{{status}}/g, result.grade === 'F' ? 'FAIL' : 'PASS')
        .replace(/{{remarks}}/g, result.remarks || '');

      // Final Cleanup: Remove any remaining {{variable}} placeholders if data wasn't found
      filledTemplate = filledTemplate.replace(/{{[^{}]+}}/g, '');

      // Open print window
      const printWin = window.open("", "_blank");
      printWin?.document.write(filledTemplate);
      printWin?.document.close();
      printWin?.print();
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Failed to print result card",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };


  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              Examination Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create exams, enter marks, and generate results
            </p>
          </div>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="marks">Marks Entry</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            {/* <TabsTrigger value="positions">Positions</TabsTrigger> */}
          </TabsList>
          {/* exams */}
          <TabsContent value="exams">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Exam Management
                </CardTitle>
                <Dialog open={examDialog} onOpenChange={setExamDialog} className="">
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingExam(null);
                        setExamForm({
                          examName: "",
                          program: "",
                          className: "",
                          session: "",
                          startDate: "",
                          endDate: "",
                          type: "",
                          description: "",
                        });
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingExam ? "Edit Exam" : "Create New Exam"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-4 p-2">
                      <div className="space-y-2">
                        <Label>Exam Name</Label>
                        <Input
                          value={examForm.examName}
                          onChange={(e) =>
                            setExamForm({ ...examForm, examName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Program *</Label>
                        <Select
                          value={examForm.program}
                          onValueChange={(value) => {
                            setExamForm({ ...examForm, program: value, classId: "" });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs?.map((program) => (
                              <SelectItem key={program?.id} value={program?.id.toString()}>
                                {program?.name} — {program?.department?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Class *</Label>
                        <Select
                          value={examForm.classId}
                          onValueChange={(value) =>
                            setExamForm({ ...examForm, classId: value })
                          }
                          disabled={!examForm.program}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                examForm.program ? "Select class" : "First select a program"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Session</Label>
                        <Select
                          value={examForm.sessionId}
                          onValueChange={(value) => {
                            const selected = sessions.find(s => s.id.toString() === value);
                            setExamForm({ ...examForm, sessionId: value, session: selected?.name || "" });
                          }}
                          disabled={isLoadingSessions}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingSessions ? "Loading..." : "Select session"} />
                          </SelectTrigger>
                          <SelectContent>
                            {sessions.length === 0 ? (
                              <SelectItem value="__none__" disabled>No sessions available</SelectItem>
                            ) : (
                              sessions.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  <span className="flex items-center gap-2">
                                    {s.name}
                                    {s.isActive && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1">Active</span>}
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={examForm.type}
                          onValueChange={(value) =>
                            setExamForm({ ...examForm, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Midterm">Midterm</SelectItem>
                            <SelectItem value="Final">Final</SelectItem>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Sendup Exam">Sendup Exam</SelectItem>
                            <SelectItem value="Pre-Board">Pre-Board</SelectItem>
                            <SelectItem value="Monthly Test">Monthly Test</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={examForm.startDate}
                          onChange={(e) =>
                            setExamForm({ ...examForm, startDate: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={examForm.endDate}
                          onChange={(e) =>
                            setExamForm({ ...examForm, endDate: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2 col-span-4">
                        <Label>Description</Label>
                        <Input
                          value={examForm.description}
                          onChange={(e) =>
                            setExamForm({ ...examForm, description: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-span-4">
                        <Label className="text-lg font-semibold mb-2 block">Date Sheet (Schedule)</Label>
                        {!examForm.classId ? (
                          <p className="text-sm text-muted-foreground">Select a class to generate the date sheet.</p>
                        ) : (
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-sm px-3 py-2 w-[50px]">Include</TableHead>
                                  <TableHead className="py-2 px-3 text-sm">Subject</TableHead>
                                  <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                                  <TableHead className="py-2 px-3 text-sm">Start Time</TableHead>
                                  <TableHead className="py-2 px-3 text-sm">End Time</TableHead>
                                  <TableHead className="text-sm px-3 py-2 w-[100px]">Total Marks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {examFormClassSubjects.map((subject) => {
                                  // Find existing schedule entry for this subject
                                  const scheduleEntry = examForm.schedule?.find(s => s.subjectId === subject.id) || {};

                                  return (
                                    <TableRow key={subject.id}>
                                      <TableCell className="py-2 px-3 text-sm">
                                        <Checkbox
                                          checked={scheduleEntry.included || false}
                                          onCheckedChange={(checked) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], included: !!checked };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, included: !!checked, date: "", startTime: "", endTime: "", totalMarks: 100 });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="text-sm px-3 py-2 font-medium">{subject.name}</TableCell>
                                      <TableCell className="py-2 px-3 text-sm">
                                        <Input
                                          type="date"
                                          value={scheduleEntry.date || ""}
                                          min={examForm.startDate}
                                          max={examForm.endDate}
                                          disabled={!scheduleEntry.included}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], date: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: e.target.value, startTime: "", endTime: "", included: true, totalMarks: 100 });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="py-2 px-3 text-sm">
                                        <Input
                                          type="time"
                                          value={scheduleEntry.startTime || ""}
                                          disabled={!scheduleEntry.included}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], startTime: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: "", startTime: e.target.value, endTime: "", included: true, totalMarks: 100 });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="py-2 px-3 text-sm">
                                        <Input
                                          type="time"
                                          value={scheduleEntry.endTime || ""}
                                          disabled={!scheduleEntry.included}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], endTime: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: "", startTime: "", endTime: e.target.value, included: true, totalMarks: 100 });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="py-2 px-3 text-sm">
                                        <Input
                                          type="number"
                                          value={scheduleEntry.totalMarks || ""}
                                          disabled={!scheduleEntry.included}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], totalMarks: Number(e.target.value) };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: "", startTime: "", endTime: "", included: true, totalMarks: Number(e.target.value) });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {examFormClassSubjects.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No subjects found for this class.</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Full grid width button */}
                      <div className="col-span-4">
                        <Button onClick={handleExamSubmit} className="w-full">
                          {editingExam ? "Update" : "Create"} Exam
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* View Exam Details Dialog */}
                <Dialog open={viewExamDialog} onOpenChange={setViewExamDialog}>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                      <div className="flex justify-between items-center w-full">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <BookOpen className="w-6 h-6 text-primary" />
                          Exam Details
                        </DialogTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-primary border-border hover:bg-primary/5"
                          onClick={() => handlePrintDateSheet(viewingExam)}
                        >
                          <Printer className="w-4 h-4" />
                          Print Date Sheet
                        </Button>
                      </div>
                    </DialogHeader>

                    {viewingExam && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden h-full">
                        {/* Left Column: General Info & Description */}
                        <div className="md:col-span-1 border-r p-6 space-y-6 overflow-y-auto bg-muted/5">
                          {/* Header Info */}
                          <div className="space-y-4">
                            <div>
                              <Badge variant="outline" className="mb-2 text-primary border-border bg-primary/5">
                                {viewingExam.type}
                              </Badge>
                              <h3 className="text-2xl font-bold text-primary">{viewingExam.examName}</h3>
                              <p className="text-sm font-medium text-muted-foreground">{viewingExam.session} Session</p>
                            </div>

                            <Separator />

                            {/* Info Grid */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program</p>
                                  <p className="font-medium">{viewingExam.program?.name || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class</p>
                                  <p className="font-medium">{viewingExam.class?.name || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</p>
                                  <div className="flex flex-col text-sm">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-green-500" />
                                      Starts: {new Date(viewingExam.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </span>
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                      Ends: {new Date(viewingExam.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {viewingExam.description && (
                              <>
                                <Separator />
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    "{viewingExam.description}"
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Date Sheet Table */}
                        <div className="md:col-span-2 p-6 overflow-y-auto h-full flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <FileText className="w-5 h-5 text-primary" />
                              Date Sheet (Schedule)
                            </h4>
                            <Badge variant="secondary" className="font-normal font-mono">
                              {viewingExam.schedules?.length || 0} Subjects
                            </Badge>
                          </div>

                          <div className="border rounded-xl overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  <TableHead className="text-sm px-3 py-2 font-bold">Subject</TableHead>
                                  <TableHead className="text-sm px-3 py-2 font-bold">Exam Date</TableHead>
                                  <TableHead className="text-sm px-3 py-2 font-bold">Start Time</TableHead>
                                  <TableHead className="text-sm px-3 py-2 font-bold">End Time</TableHead>
                                  <TableHead className="text-sm px-3 py-2 font-bold">Total Marks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {viewingExam.schedules?.length > 0 ? (
                                  viewingExam.schedules.map((s, index) => {
                                    const subject = subjects.find(sub => sub.id === s.subjectId);
                                    return (
                                      <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-sm px-3 py-2 font-semibold text-primary">
                                          {subject?.name || "Unknown"}
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-sm">
                                          <div className="flex flex-col">
                                            <span className="font-medium">
                                              {s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "N/A"}
                                            </span>
                                            {s.date && <span className="text-xs text-muted-foreground">{new Date(s.date).getFullYear()}</span>}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-sm">
                                          <Badge variant="outline" className="font-normal bg-green-50/50 text-green-700 border-green-200">
                                            {s.startTime}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-sm">
                                          <Badge variant="outline" className="font-normal bg-red-50/50 text-red-700 border-red-200">
                                            {s.endTime}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-sm">
                                          <Badge variant="secondary" className="font-normal">
                                            {s.totalMarks || 100}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <FileText className="w-8 h-8 opacity-20" />
                                        <p>No schedule defined for this exam.</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Session_Filter</Label>
                      <Select
                        value={examSessionFilter || "__all__"}
                        onValueChange={(v) => setExamSessionFilter(v === "__all__" ? "" : v)}
                        disabled={isLoadingSessions}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingSessions ? "Loading..." : "All Sessions"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Sessions</SelectItem>
                          {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              <span className="flex items-center gap-2">
                                {s.name}
                                {s.isActive && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1">Active</span>}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Search Exam</Label>
                      <Input
                        placeholder="Search by name..."
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by Date</Label>
                      <Input
                        type="date"
                        value={examDateFilter}
                        onChange={(e) => setExamDateFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by Time (Starts after)</Label>
                      <Input
                        type="time"
                        value={examTimeFilter}
                        onChange={(e) => setExamTimeFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Exam Name</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Session</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Start Date</TableHead>
                          <TableHead className="py-2 px-3 text-sm">End Date</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionFilteredExams?.filter(exam => {
                          const matchesSearch = exam.examName.toLowerCase().includes(examSearch.toLowerCase());
                          const matchesDate = examDateFilter
                            ? new Date(exam.startDate).toDateString() === new Date(examDateFilter).toDateString()
                            : true;

                          // Time filter: Check if exam starts at or after the selected time
                          // Extract HH:mm from exam startDate
                          const examTime = new Date(exam.startDate).toTimeString().slice(0, 5);
                          const matchesTime = examTimeFilter ? examTime >= examTimeFilter : true;

                          return matchesSearch && matchesDate && matchesTime;
                        }).map((exam) => (
                          <TableRow key={exam.id}>
                            <TableCell className="text-sm px-3 py-2 font-medium">{exam.examName}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{exam.program.name} {exam.program.department?.name ? `— ${exam.program.department.name}` : ""}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{exam.class?.name || "N/A"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{exam.session}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{exam.type}</TableCell>
                            <TableCell className="text-sm px-3 py-2 whitespace-nowrap">{new Date(exam.startDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm px-3 py-2 whitespace-nowrap">{new Date(exam.endDate).toLocaleDateString()}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setViewingExam(exam);
                                        setViewExamDialog(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Exam</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditExam(exam)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Exam</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setDeleteTarget({
                                          type: "exam",
                                          id: exam.id,
                                        });
                                        setDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Exam</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {sessionFilteredExams?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No exams found. Create one to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* marks */}
          <TabsContent value="marks">
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Marks Entry
                  </CardTitle>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex-1">
                    <Label>Session_Filter</Label>
                    <Select value={marksSessionFilter || "__all__"} onValueChange={(v) => setMarksSessionFilter(v === "__all__" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Sessions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Sessions</SelectItem>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <span className="flex items-center gap-2">
                              {s.name}
                              {s.isActive && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1">Active</span>}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Program</Label>
                    <Select
                      value={marksFilterProgram}
                      onValueChange={setMarksFilterProgram}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Programs</SelectItem>
                        {programs?.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name} {program.department?.name ? `— ${program.department.name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select
                      value={marksFilterClass}
                      onValueChange={setMarksFilterClass}
                      disabled={!marksFilterProgram || marksFilterProgram === "*"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={marksFilterProgram && marksFilterProgram !== "*" ? "Select Class" : "Select program first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Classes</SelectItem>
                        {(() => {
                          const selectedProgram = programs?.find(p => p.id === Number(marksFilterProgram));
                          if (!selectedProgram?.classes) return null;
                          return selectedProgram.classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Section</Label>
                    <Select
                      value={marksFilterSection}
                      onValueChange={setMarksFilterSection}
                      disabled={!marksFilterClass || marksFilterClass === "*"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={marksFilterClass && marksFilterClass !== "*" ? "All Sections" : "Select class first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Sections</SelectItem>
                        {(() => {
                          const selectedClass = programs
                            ?.flatMap(p => p.classes)
                            ?.find(c => c?.id === Number(marksFilterClass));
                          return selectedClass?.sections?.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          )) || null;
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Exam</Label>
                    <Select
                      value={marksFilterExam}
                      onValueChange={setMarksFilterExam}
                      disabled={!marksFilterClass || marksFilterClass === "*"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={marksFilterClass && marksFilterClass !== "*" ? "Select Exam" : "Select class first"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Exams</SelectItem>
                        {(() => {
                          return marksSessionFilteredExams
                            ?.filter(exam => exam.classId === Number(marksFilterClass))
                            .map((exam) => (
                              <SelectItem key={exam.id} value={exam.id.toString()}>
                                {exam.examName} - {exam.session} ({formatDateTimeDisplay(exam.startDate)})
                              </SelectItem>
                            ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="ml-2"
                    onClick={() => {
                      setBulkExamId(marksFilterExam !== "*" ? marksFilterExam : "");
                      setBulkSectionId(marksFilterSection !== "*" ? marksFilterSection : "");
                      setBulkMarksData({});
                      setBulkAbsentees({});
                      setBulkMarksEditMode(false);
                      setBulkMarksDialog(true);
                    }}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Bulk Marks Entry
                  </Button>

                  <Dialog open={bulkMarksDialog} onOpenChange={setBulkMarksDialog}>
                    <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
                      <DialogHeader className="p-6 border-bottom">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <LayoutGrid className="w-6 h-6 text-orange-600" />
                          Bulk Marks Entry
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">Select exam and class/section to enter marks for all students at once.</p>
                      </DialogHeader>
                      <div className="flex-1 overflow-hidden flex flex-col">
                        {!bulkMarksEditMode && (
                        <div className="p-6 bg-muted/30 border-y grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Select Exam</Label>
                            <Select value={bulkExamId} onValueChange={(v) => {
                              setBulkExamId(v);
                              setBulkSectionId("*"); // Reset section when exam changes
                              // Reset data when exam changes
                              setBulkMarksData({});
                              setBulkAbsentees({});
                            }}>
                              <SelectTrigger><SelectValue placeholder="Select examination" /></SelectTrigger>
                              <SelectContent>
                                {marksSessionFilteredExams?.map((exam) => (
                                  <SelectItem key={exam.id} value={exam.id.toString()}>
                                    {exam.examName} - {exam.session} ({exam.program?.name}{exam.program?.department?.name ? ` — ${exam.program.department.name}` : ""} - {exam.class?.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Session</Label>
                            <span className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
                              {exams.find(e => e.id.toString() === bulkExamId)?.session || "—"}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <Label>Select Section</Label>
                            <Select value={bulkSectionId} onValueChange={(v) => {
                              setBulkSectionId(v);
                              setBulkMarksData({});
                              setBulkAbsentees({});
                            }}>
                              <SelectTrigger><SelectValue placeholder="Select section (optional)" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="*">All Sections</SelectItem>
                                {(() => {
                                  const exam = exams?.find(
                                    (e) => e.id === Number(bulkExamId)
                                  );
                                  return exam?.class?.sections
                                    ?.filter((s) =>
                                      isTeacher
                                        ? teacherClassMappings.some(
                                            (m) =>
                                              m.classId === exam.classId &&
                                              (m.sectionId === s.id ||
                                                m.sectionId === null)
                                          )
                                        : true
                                    )
                                    ?.map((s) => (
                                      <SelectItem
                                        key={s.id}
                                        value={s.id.toString()}
                                      >
                                        {s.name}
                                      </SelectItem>
                                    ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        )}

                        {bulkMarksEditMode && (
                          <div className="px-6 py-3 bg-muted/30 border-b flex items-center gap-3 text-sm">
                            <span className="font-medium">{exams.find(e => e.id.toString() === bulkExamId)?.examName}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{exams.find(e => e.id.toString() === bulkExamId)?.session}</span>
                          </div>
                        )}

                        <div className="flex-1 overflow-auto p-0 flex flex-col">
                          {isLoadingStudents || isLoadingExistingMarks ? (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2 py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                <p className="text-sm text-muted-foreground">Fetching student list and marks...</p>
                              </div>
                            </div>
                          ) : bulkExamId ? (() => {
                            const exam = exams.find(e => e.id === Number(bulkExamId));
                            if (!exam) return null;

                            const studentsList = Array.isArray(studentsForMarksEntry) ? studentsForMarksEntry : (studentsForMarksEntry?.students || []);
                            const sectionStudents = studentsList
                              .filter(s => s && s.status === "ACTIVE")
                              .sort((a, b) => (a.rollNumber || "").localeCompare(b.rollNumber || ""));

                            const examSubjects = (exam.schedules || []).map(s => {
                              const sub = subjects.find(sub => sub.id === s.subjectId);
                              return { ...s, name: sub?.name || "Unknown" };
                            });

                            if (sectionStudents.length === 0) {
                              return <div className="p-12 text-center text-muted-foreground">No students found for this class/section.</div>;
                            }

                            if (examSubjects.length === 0) {
                              return <div className="p-12 text-center text-muted-foreground">No subjects defined in this exam's schedule.</div>;
                            }

                            return (
                              <Table className="border-collapse">
                                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-sm px-3 py-2 w-[200px] border-r">Student Name (Roll No)</TableHead>
                                    {examSubjects.map((s) => (
                                      <TableHead key={s.id} className="text-center min-w-[120px] border-r bg-muted/5">
                                        <div className="font-bold text-orange-700">{s.name}</div>
                                        <div className="text-[10px] text-muted-foreground">Total: {s.totalMarks}</div>
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sectionStudents.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-orange-50/30 transition-colors">
                                      <TableCell className="text-sm px-3 py-2 font-medium border-r sticky left-0 bg-white z-[5]">
                                        <div className="text-sm">{getFullName(student)}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{student.rollNumber}</div>
                                      </TableCell>
                                      {examSubjects.map((s) => {
                                        const subjectKey = `${student.id}-${s.name}`;
                                        const marksValue = bulkMarksData[student.id]?.[s.name] ?? "";
                                        const isAbsent = bulkAbsentees[student.id]?.[s.name] ?? false;

                                        // Try to pre-fill from existing marks on first render or when data changes
                                        if (marksValue === "" && marks.length > 0) {
                                          const existingMark = marks.find(m =>
                                            m.studentId === student.id &&
                                            m.examId === exam.id &&
                                            m.subject === s.name
                                          );
                                          if (existingMark) {
                                            setTimeout(() => {
                                              setBulkMarksData(prev => ({
                                                ...prev,
                                                [student.id]: { ...(prev[student.id] || {}), [s.name]: existingMark.obtainedMarks }
                                              }));
                                              setBulkAbsentees(prev => ({
                                                ...prev,
                                                [student.id]: { ...(prev[student.id] || {}), [s.name]: existingMark.isAbsent }
                                              }));
                                            }, 0);
                                          }
                                        }

                                        return (
                                          <TableCell key={s.id} className={`p-2 border-r text-center ${isAbsent ? 'bg-red-50/50' : ''}`}>
                                            <div className="flex flex-col gap-2 items-center">
                                              <Input
                                                type="number"
                                                className={`h-8 w-20 text-center ${isAbsent ? 'opacity-30' : ''}`}
                                                placeholder="0"
                                                value={marksValue}
                                                disabled={isAbsent}
                                                max={s.totalMarks || 100}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setBulkMarksData(prev => ({
                                                    ...prev,
                                                    [student.id]: { ...(prev[student.id] || {}), [s.name]: val }
                                                  }));
                                                }}
                                              />
                                              <div className="flex items-center gap-1">
                                                <Checkbox
                                                  id={`absent-${subjectKey}`}
                                                  checked={isAbsent}
                                                  className="h-3 w-3"
                                                  onCheckedChange={(checked) => {
                                                    setBulkAbsentees(prev => ({
                                                      ...prev,
                                                      [student.id]: { ...(prev[student.id] || {}), [s.name]: !!checked }
                                                    }));
                                                    if (checked) {
                                                      setBulkMarksData(prev => ({
                                                        ...prev,
                                                        [student.id]: { ...(prev[student.id] || {}), [s.name]: "0" }
                                                      }));
                                                    }
                                                  }}
                                                />
                                                <label htmlFor={`absent-${subjectKey}`} className="text-[10px] text-muted-foreground cursor-pointer uppercase font-bold">Abs</label>
                                              </div>
                                            </div>
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            );
                          })() : (
                            <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                              <LayoutGrid className="w-12 h-12 opacity-10" />
                              <p>Select an exam to load the marks entry grid.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter className="p-6 border-t bg-muted/20">
                        <Button variant="ghost" onClick={() => setBulkMarksDialog(false)}>Cancel</Button>
                        <Button
                          disabled={!bulkExamId || bulkMarksMutation.isPending}
                          onClick={() => {
                            const exam = exams.find(e => e.id === Number(bulkExamId));
                            const examSubjects = (exam.schedules || []).map(s => {
                              const sub = subjects.find(sub => sub.id === s.subjectId);
                              return { ...s, name: sub?.name || "Unknown", totalMarks: s.totalMarks };
                            });

                            const payload = [];
                            Object.entries(bulkMarksData).forEach(([studentId, subjectMarks]) => {
                              Object.entries(subjectMarks).forEach(([subjectName, marks]) => {
                                const subj = examSubjects.find(es => es.name === subjectName);
                                const isAbs = bulkAbsentees[studentId]?.[subjectName] || false;
                                payload.push({
                                  examId: bulkExamId,
                                  studentId,
                                  subject: subjectName,
                                  totalMarks: subj?.totalMarks,
                                  obtainedMarks: isAbs ? 0 : Number(marks),
                                  isAbsent: isAbs
                                });
                              });
                            });

                            // Add absentees that might not have marks entered
                            Object.entries(bulkAbsentees).forEach(([studentId, subjectAbs]) => {
                              Object.entries(subjectAbs).forEach(([subjectName, isAbsent]) => {
                                if (isAbsent && !payload.find(p => p.studentId === studentId && p.subject === subjectName)) {
                                  const subj = examSubjects.find(es => es.name === subjectName);
                                  payload.push({
                                    examId: bulkExamId,
                                    studentId,
                                    subject: subjectName,
                                    totalMarks: subj?.totalMarks,
                                    obtainedMarks: 0,
                                    isAbsent: true
                                  });
                                }
                              });
                            });

                            if (payload.length === 0) {
                              toast({ title: "No marks entered", variant: "destructive" });
                              return;
                            }

                            bulkMarksMutation.mutate({ marks: payload });
                          }}
                        >
                          {bulkMarksMutation.isPending ? "Saving..." : "Save All Marks"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent>
                {marks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No marks to show. Select filters above and use Bulk Marks Entry.</div>
                ) : (() => {
                  // Group marks by exam + student
                  const grouped = marks.reduce((acc, mark) => {
                    const key = `${mark.examId}-${mark.studentId}`;
                    if (!acc[key]) {
                      acc[key] = { examId: mark.examId, student: mark.student, marks: [] };
                    }
                    acc[key].marks.push(mark);
                    return acc;
                  }, {});

                  return (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Exam</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Student</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Subjects</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Total</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Obtained</TableHead>
                          <TableHead className="py-2 px-3 text-sm">%</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(grouped).map((group) => {
                          const exam = exams.find(e => e.id === group.examId);
                          const totalMarks = group.marks.reduce((s, m) => s + (m.totalMarks || 0), 0);
                          const obtainedMarks = group.marks.reduce((s, m) => s + (m.isAbsent ? 0 : (m.obtainedMarks || 0)), 0);
                          const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : "0.0";
                          const subjectSummary = group.marks.map(m => m.isAbsent ? `${m.subject}(Abs)` : m.subject).join(", ");
                          const key = `${group.examId}-${group.student?.id}`;

                          return (
                            <TableRow key={key}>
                              <TableCell className="text-sm px-3 py-2 font-medium">{exam?.examName || "N/A"}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{group.student ? `${getFullName(group.student)} (${group.student.rollNumber})` : "Unknown"}</TableCell>
                              <TableCell className="px-3 py-2 text-sm text-muted-foreground max-w-[200px] truncate" title={subjectSummary}>{subjectSummary}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{totalMarks}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{obtainedMarks}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{percentage}%</TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <div className="flex gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setViewMarksDetail({ examId: group.examId, student: group.student, marks: group.marks })}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setBulkExamId(group.examId.toString());
                                          setBulkSectionId(group.student?.sectionId?.toString() || "*");
                                          setBulkMarksData({});
                                          setBulkAbsentees({});
                                          setBulkMarksEditMode(true);
                                          setBulkMarksDialog(true);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Marks</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          // Delete all marks for this student+exam
                                          group.marks.forEach(m => deleteMarksMutation.mutate(m.id));
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete All Marks</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  );
                })()}
              </CardContent>
            </Card>

            {/* View Marks Detail Dialog */}
            <Dialog open={!!viewMarksDetail} onOpenChange={(open) => { if (!open) setViewMarksDetail(null); }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    Marks Detail
                  </DialogTitle>
                </DialogHeader>
                {viewMarksDetail && (() => {
                  const exam = exams.find(e => e.id === viewMarksDetail.examId);
                  const student = viewMarksDetail.student;
                  const totalMarks = viewMarksDetail.marks.reduce((s, m) => s + (m.totalMarks || 0), 0);
                  const obtainedMarks = viewMarksDetail.marks.reduce((s, m) => s + (m.isAbsent ? 0 : (m.obtainedMarks || 0)), 0);
                  const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : "0.00";
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                        <div><span className="text-muted-foreground">Exam:</span> <span className="font-medium">{exam?.examName}</span></div>
                        <div><span className="text-muted-foreground">Session:</span> <span className="font-medium">{exam?.session}</span></div>
                        <div><span className="text-muted-foreground">Student:</span> <span className="font-medium">{student ? getFullName(student) : "—"}</span></div>
                        <div><span className="text-muted-foreground">Roll No:</span> <span className="font-medium font-mono">{student?.rollNumber}</span></div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2 px-3 text-sm">Subject</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-right">Total</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-right">Obtained</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-right">%</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewMarksDetail.marks.map((m) => {
                            const pct = m.totalMarks > 0 ? ((m.obtainedMarks / m.totalMarks) * 100).toFixed(1) : "0.0";
                            return (
                              <TableRow key={m.id}>
                                <TableCell className="text-sm px-3 py-2 font-medium">{m.subject}</TableCell>
                                <TableCell className="text-sm px-3 py-2 text-right">{m.totalMarks}</TableCell>
                                <TableCell className="text-sm px-3 py-2 text-right">{m.isAbsent ? "—" : m.obtainedMarks}</TableCell>
                                <TableCell className="text-sm px-3 py-2 text-right">{m.isAbsent ? "—" : `${pct}%`}</TableCell>
                                <TableCell className="text-sm px-3 py-2 text-center">
                                  {m.isAbsent
                                    ? <Badge variant="destructive" className="text-xs">Absent</Badge>
                                    : <Badge variant="secondary" className="text-xs">Present</Badge>
                                  }
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="flex justify-between items-center text-sm font-medium bg-muted/30 rounded-lg px-4 py-3">
                        <span>Total: {obtainedMarks} / {totalMarks}</span>
                        <span>Overall: {percentage}%</span>
                      </div>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>

          </TabsContent>
          <TabsContent value="results">
            {/* Nested Tabs for Results */}
            <Tabs defaultValue="class-results" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="class-results">Examination Results</TabsTrigger>
                <TabsTrigger value="student-results">Student Results</TabsTrigger>
              </TabsList>

              {/* Class/Section Results Tab */}
              <TabsContent value="class-results">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Examination Results by Class
                      </CardTitle>
                      <Dialog open={resultDialog} onOpenChange={setResultDialog}>
                        <DialogTrigger asChild>
                          <Button>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Generate Results
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Generate Results</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Exam *</Label>
                              <Select value={resultForm.examId} onValueChange={(value) => setResultForm({ ...resultForm, examId: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select exam" />
                                </SelectTrigger>
                                <SelectContent>
                                 {exams
                                  ?.filter((e) =>
                                    isTeacher
                                      ? teacherClassMappings.some(
                                          (m) => m.classId === e.classId
                                        )
                                      : true
                                  )
                                    ?.map((exam) => (
                                      <SelectItem
                                        key={exam.id}
                                        value={exam.id.toString()}
                                      >
                                        {exam.examName} - {exam.session} ({exam.program?.name}{exam.program?.department?.name ? ` — ${exam.program.department.name}` : ""} - {exam.class?.name})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Select Class (Optional)</Label>
                              <Select value={resultForm.classId || ""} onValueChange={(value) => setResultForm({ ...resultForm, classId: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="All classes" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="*">All Classes</SelectItem>
                                  {(() => {
                                    const selectedExam = exams.find(e => e.id === Number(resultForm.examId));
                                    if (selectedExam?.class) {
                                      return (
                                        <SelectItem value={selectedExam.class.id.toString()}>
                                          {selectedExam.class.name}
                                        </SelectItem>
                                      );
                                    }
                                    return null;
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={() => {
                                if (!resultForm.examId) {
                                  toast({ title: "Please select an exam", variant: "destructive" });
                                  return;
                                }
                                generateResultsMutation.mutate({
                                  examId: resultForm.examId,
                                  classId: resultForm.classId || undefined
                                });
                              }}
                              className="w-full"
                              disabled={generateResultsMutation.isPending}
                            >
                              {generateResultsMutation.isPending ? "Generating..." : "Generate Results"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <div className="flex-1">
                        <Label>Session Filter</Label>
                        <Select value={resultsSessionFilter || "__all__"} onValueChange={(v) => setResultsSessionFilter(v === "__all__" ? "" : v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Sessions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All Sessions</SelectItem>
                            {sessions.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                <span className="flex items-center gap-2">
                                  {s.name}
                                  {s.isActive && <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1">Active</span>}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label>Filter by Program</Label>
                        <Select
                          value={resultFilterProgram}
                          onValueChange={setResultFilterProgram}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="*">All Programs</SelectItem>
                            {programs
                              ?.filter((p) =>
                                isTeacher
                                  ? teacherClassMappings.some(
                                      (m) => m.class?.programId === p.id
                                    )
                                  : true
                              )
                              ?.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}{" "}
                                  {p.department?.name
                                    ? `— ${p.department.name} `
                                    : ""}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label>Filter by Class</Label>
                        <Select
                          value={resultFilterClass}
                          onValueChange={setResultFilterClass}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="*">All Classes</SelectItem>
                            {programs
                              ?.find((p) => p.id === Number(resultFilterProgram))
                              ?.classes?.filter((cls) =>
                                isTeacher
                                  ? teacherClassMappings.some(
                                      (m) => m.classId === cls.id
                                    )
                                  : true
                              )
                              ?.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            {resultFilterProgram === "*" &&
                              programs
                                ?.flatMap((p) => p.classes || [])
                                ?.filter((cls) =>
                                  isTeacher
                                    ? teacherClassMappings.some(
                                        (m) => m.classId === cls.id
                                      )
                                    : true
                                )
                                ?.map((cls) => (
                                  <SelectItem
                                    key={cls.id}
                                    value={cls.id.toString()}
                                  >
                                    {cls.name}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!resultFilterProgram || resultFilterProgram === "" ? (
                      <div className="text-center py-16">
                        <p className="text-4xl mb-4">📊</p>
                        <p className="text-lg font-medium text-muted-foreground">Select a Program to View Results</p>
                        <p className="text-sm text-muted-foreground mt-2">Choose a program from the filter above to see examination results</p>
                      </div>
                    ) : results.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-4xl mb-4">📭</p>
                        <p className="text-lg font-medium text-muted-foreground">No Results Found</p>
                        <p className="text-sm text-muted-foreground mt-2">Generate results for this program to see them here</p>
                      </div>
                    ) : (
                      <>
                        {resultsSessionFilteredExams?.map((exam) => {
                          let examResults = results.filter((r) => r.examId === exam.id);

                          // Filter by program
                          if (resultFilterProgram && resultFilterProgram !== "*") {
                            examResults = examResults.filter((r) => {
                              return r.student?.programId === Number(resultFilterProgram);
                            });
                          }

                          // Filter by class
                          if (resultFilterClass && resultFilterClass !== "*") {
                            examResults = examResults.filter((r) => {
                              return r.student?.classId === Number(resultFilterClass);
                            });
                          }
                          if (examResults.length === 0) return null;
                          return (
                            <Card key={exam.id} className="mb-4">
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle>{exam.examName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                      {exam.program?.name} | {exam.session}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        generateResultsMutation.mutate({
                                          examId: exam.id.toString(),
                                          classId: exam.classId ? exam.classId.toString() : undefined
                                        });
                                      }}
                                      disabled={generateResultsMutation.isPending}
                                      className="gap-2"
                                    >
                                      <Award className="w-4 h-4" />
                                      {generateResultsMutation.isPending ? "Regenerating..." : "Regenerate Results"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => printResults(exam.id)}
                                      className="gap-2"
                                    >
                                      <Printer className="w-4 h-4" />
                                      Print Results
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="py-2 px-3 text-sm">Position</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Student</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Reg. No</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Total Marks</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Obtained</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Percentage</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">Grade</TableHead>
                                      <TableHead className="py-2 px-3 text-sm">GPA</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {examResults
                                      .sort((a, b) => b.percentage - a.percentage)
                                      .map((result, idx) => {
                                        const student = result.student;
                                        return (
                                          <TableRow key={result.id}>
                                            <TableCell className="text-sm px-3 py-2 font-bold">
                                              {idx + 1}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{student ? getFullName(student) : 'N/A'}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{student?.rollNumber}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{student?.class?.name}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{result.totalMarks}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">
                                              {result.obtainedMarks}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-sm">
                                              {result.percentage.toFixed(2)}%
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{result.grade}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">
                                              {result.gpa.toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Student Results Tab */}
              <TabsContent value="student-results">
                <StudentResultsTab
                  programs={programs}
                  students={students}
                  exams={exams}
                  studentResultProgram={studentResultProgram}
                  setStudentResultProgram={setStudentResultProgram}
                  studentResultClass={studentResultClass}
                  setStudentResultClass={setStudentResultClass}
                  studentResultSection={studentResultSection}
                  setStudentResultSection={setStudentResultSection}
                  studentResultStudent={studentResultStudent}
                  setStudentResultStudent={setStudentResultStudent}
                  studentResultExam={studentResultExam}
                  setStudentResultExam={setStudentResultExam}
                  studentResultData={studentResultData}
                  studentResultMutation={studentResultMutation}
                  printStudentResult={printStudentResult}
                  getFullName={getFullName}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* positions */}
          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Student Rankings & Positions
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!positionsFilterExam || positionsFilterExam === "") {
                          toast({ title: "Please select an exam", variant: "destructive" });
                          return;
                        }
                        generatePositionsMutation.mutate({
                          examId: positionsFilterExam,
                          classId: positionsFilterClass && positionsFilterClass !== "*" ? positionsFilterClass : undefined
                        });
                      }}
                      disabled={generatePositionsMutation.isPending}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {generatePositionsMutation.isPending ? "Generating..." : "Generate Positions"}
                    </Button>
                    <Button
                      onClick={printPositions}
                      variant="outline"
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Positions
                    </Button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Filter by Exam *</Label>
                    <Select value={positionsFilterExam} onValueChange={setPositionsFilterExam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Exams</SelectItem>
                        {exams?.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            {exam.examName} - {exam.session} ({formatDateTimeDisplay(exam.startDate)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select
                      value={positionsFilterClass}
                      onValueChange={setPositionsFilterClass}
                      disabled={!positionsFilterExam || positionsFilterExam === ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Classes</SelectItem>
                        {(() => {
                          const selectedExam = exams?.find(e => e.id === Number(positionsFilterExam));
                          if (selectedExam?.class) {
                            return (
                              <SelectItem value={selectedExam.class.id.toString()}>
                                {selectedExam.class.name}
                              </SelectItem>
                            );
                          }
                          return null;
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!positionsFilterExam || positionsFilterExam === "" ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-4">🏆</p>
                    <p className="text-lg font-medium text-muted-foreground">Select an Exam to View Rankings</p>
                    <p className="text-sm text-muted-foreground mt-2">Choose an exam from the filter above to see student positions</p>
                  </div>
                ) : positions.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-4">📊</p>
                    <p className="text-lg font-medium text-muted-foreground">No Positions Found</p>
                    <p className="text-sm text-muted-foreground mt-2">Click "Generate Positions" to calculate rankings from results</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      // Group positions by exam and class
                      const groupedPositions = positions.reduce((acc, pos) => {
                        const examKey = `${pos.exam.examName} - ${pos.exam.session} `;
                        const classKey = pos.class.name;

                        if (!acc[examKey]) acc[examKey] = {};
                        if (!acc[examKey][classKey]) acc[examKey][classKey] = [];
                        acc[examKey][classKey].push(pos);

                        return acc;
                      }, {});

                      return Object.entries(groupedPositions).map(([examName, classes]) => (
                        <div key={examName} className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">{examName}</h3>
                          {Object.entries(classes).map(([className, classPositions]) => {
                            const sortedPositions = classPositions.sort((a, b) => a.position - b.position);
                            return (
                              <Card key={className} className="mb-4">
                                <CardHeader>
                                  <CardTitle className="text-md">Class: {className}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-sm px-3 py-2 w-16">Position</TableHead>
                                        <TableHead className="py-2 px-3 text-sm">Student Name</TableHead>
                                        <TableHead className="py-2 px-3 text-sm">Roll No</TableHead>
                                        <TableHead className="text-sm px-3 py-2 text-right">Total</TableHead>
                                        <TableHead className="text-sm px-3 py-2 text-right">Obtained</TableHead>
                                        <TableHead className="text-sm px-3 py-2 text-right">%</TableHead>
                                        <TableHead className="py-2 px-3 text-sm">Grade</TableHead>
                                        <TableHead className="text-sm px-3 py-2 text-right">GPA</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sortedPositions.map((pos) => {
                                        const student = students.find(s => s.id === pos.studentId);
                                        return (
                                          <TableRow key={pos.id}>
                                            <TableCell className="text-sm px-3 py-2 font-bold">
                                              {pos.position === 1 ? "🥇" : pos.position === 2 ? "🥈" : pos.position === 3 ? "🥉" : pos.position}
                                            </TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{student ? getFullName(student) : 'N/A'}</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{student?.rollNumber}</TableCell>
                                            <TableCell className="text-sm px-3 py-2 text-right">{pos.totalMarks}</TableCell>
                                            <TableCell className="text-sm px-3 py-2 text-right">{pos.obtainedMarks}</TableCell>
                                            <TableCell className="text-sm px-3 py-2 text-right">{pos.percentage.toFixed(2)}%</TableCell>
                                            <TableCell className="py-2 px-3 text-sm">{pos.grade}</TableCell>
                                            <TableCell className="text-sm px-3 py-2 text-right">{pos.gpa.toFixed(2)}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the{" "}
                {deleteTarget?.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};
export default Examination;

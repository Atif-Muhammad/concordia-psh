import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  getSubjects, // ← Add this in your apis.js
  generateResults,
  getPositions,
  generatePositions,
  delPosition,
  getStudentResult,
  getDefaultReportCardTemplate,
} from "../../config/apis";

const Examination = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [examSearch, setExamSearch] = useState("");
  const [examDateFilter, setExamDateFilter] = useState("");
  const [examTimeFilter, setExamTimeFilter] = useState("");
  const [examDialog, setExamDialog] = useState(false);
  const [marksDialog, setMarksDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editingMarks, setEditingMarks] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [examForm, setExamForm] = useState({
    examName: "",
    program: "",
    classId: "",
    session: "",
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
    setMarksFilterSection("");
  }, [marksFilterExam]);

  useEffect(() => {
    setResultFilterClass("");
    setResultFilterSection("");
  }, [resultFilterProgram]);

  useEffect(() => {
    setResultFilterSection("");
  }, [resultFilterClass]);

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

  const [marksForm, setMarksForm] = useState({
    examId: "",
    studentId: "",
    subject: "",
    totalMarks: "",
    obtainedMarks: "",
    teacherRemarks: "",
  });

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
  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: getProgramNames });
  const { data: exams = [] } = useQuery({ queryKey: ["exams"], queryFn: getExams });
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: marks = [] } = useQuery({
    queryKey: ["marks", marksFilterExam, marksFilterSection],
    queryFn: () => getMarks(
      marksFilterExam && marksFilterExam !== "*" ? marksFilterExam : undefined,
      marksFilterSection && marksFilterSection !== "*" ? marksFilterSection : undefined
    ),
    enabled: !!(marksFilterExam && marksFilterExam !== "*") || !!(marksFilterSection && marksFilterSection !== "*") // Only fetch when at least one filter is selected
  });
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

  const getFullName = (student) => {
    return `${student.fName} ${student.mName || ""} ${student.lName}`.trim();
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
  const availableClasses = selectedProgram?.classes || [];
  // === MUTATIONS ===
  const createExam = useMutation({
    mutationFn: createExamApi,
    onSuccess: () => {
      toast({ title: "Exam created successfully" });
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setExamForm({
        examName: "", program: "", classId: "", session: "",
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
      // Pass the full ISO string as collected from new Date(datetime-local value).toISOString() or similar
      // Actually datetime-local value is "YYYY-MM-DDTHH:mm" which is ISO-compatible for constructor
      startDate: new Date(examForm.startDate).toISOString(),
      endDate: new Date(examForm.endDate).toISOString(),
      type: examForm.type || "Final",
      description: examForm.description,
      schedule: examForm.schedule?.filter(s => s.date && s.startTime && s.endTime), // Only send complete entries
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, payload });
    } else {
      createExam.mutate(payload);
    }
  };

  const openEditExam = (exam) => {
    setEditingExam(exam);
    setExamForm({
      examName: exam.examName,
      program: exam.programId?.toString() || "",
      classId: exam.classId?.toString() || "",
      session: exam.session,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split("T")[0] : "",
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split("T")[0] : "",
      type: exam.type || "",
      description: exam.description || "",
      schedule: exam.schedules?.map(s => ({
        subjectId: s.subjectId,
        date: s.date ? s.date.split("T")[0] : "",
        startTime: s.startTime,
        endTime: s.endTime
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
      <!DOCTYPE html><html><head><title>${exam.examName}</title>
      <style>body{font-family:Arial;padding:40px;text-align:center}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #000;padding:10px}</style></head>
      <body><h1>${exam.examName} - Results</h1><h2>Session: ${exam.session}</h2>
      <table><tr><th>Pos</th><th>Name</th><th>Roll No</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th></tr>
      ${filtered.map((r, i) => {
      const s = r.student;
      return `<tr><td>${i + 1}</td><td>${s?.name || "N/A"}</td><td>${s?.rollNumber || "N/A"}</td>
                <td>${r.totalMarks}</td><td>${r.obtainedMarks}</td><td>${r.percentage.toFixed(2)}%</td><td>${r.grade}</td></tr>`;
    }).join("")}
      </table></body></html>
    `);
    printWin?.document.close();
    printWin?.print();
  };
  const handleMarksSubmit = () => {
    const marksData = {
      examId: Number(marksForm.examId),
      studentId: Number(marksForm.studentId),
      subject: marksForm.subject,
      totalMarks: Number(marksForm.totalMarks),
      obtainedMarks: Number(marksForm.obtainedMarks),
      teacherRemarks: marksForm.teacherRemarks,
    };

    if (editingMarks) {
      updateMarksMutation({ id: editingMarks.id, payload: marksData });
    } else {
      // Check for duplicate marks in frontend
      const isDuplicate = marks.some(
        (mark) =>
          mark.examId === marksData.examId &&
          mark.studentId === marksData.studentId &&
          mark.subject === marksData.subject
      );

      if (isDuplicate) {
        toast({
          title: "Duplicate Entry",
          description: "Marks already exist for this student in this subject for this exam.",
          variant: "destructive",
        });
        return;
      }

      createMarksMutation(marksData);
    }

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

  const openEditMarks = (marksData) => {
    setEditingMarks(marksData);
    setMarksForm({
      examId: marksData.examId,
      studentId: marksData.studentId,
      subject: marksData.subject,
      totalMarks: marksData.totalMarks.toString(),
      obtainedMarks: marksData.obtainedMarks.toString(),
      teacherRemarks: marksData.teacherRemarks || "",
    });
    setMarksDialog(true);
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
      <!DOCTYPE html><html><head><title>Student Rankings</title>
      <style>body{font-family:Arial;padding:40px;text-align:center}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #000;padding:10px}
      h1,h2,h3{margin:10px 0}
      .page-break{page-break-after:always}
      </style></head>
      <body>
      <h1>Student Rankings</h1>
      ${Object.entries(groupedPositions).map(([examName, classes]) => `
        <div class="exam-section">
          <h2>${examName}</h2>
          ${Object.entries(classes).map(([className, classPositions]) => `
            <h3>Class: ${className}</h3>
            <table>
              <tr><th>Pos</th><th>Name</th><th>Roll No</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th></tr>
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
            </table>
          `).join("")}
          <div class="page-break"></div>
        </div>
      `).join("")}
      </body></html>
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
      }));

      // Check if program year <= 2 to conditionally hide GPA
      const programYear = exam.program?.year || exam.class?.year || 3; // Default to 3 if not found
      const showGPA = programYear > 2;

      // Start with the template
      let filledTemplate = template.htmlContent;

      // Handle {{#each subjects}} loop FIRST before global replacements
      const eachRegex = /{{#each subjects}}([\s\S]*?){{\/each}}/g;
      filledTemplate = filledTemplate.replace(eachRegex, (match, templateRow) => {
        return subjectsData.map(subject => {
          return templateRow
            .replace(/{{name}}/g, subject.name)
            .replace(/{{totalMarks}}/g, subject.totalMarks)
            .replace(/{{obtainedMarks}}/g, subject.obtainedMarks)
            .replace(/{{percentage}}/g, subject.percentage)
            .replace(/{{grade}}/g, subject.grade);
        }).join('');
      });

      // Now replace simple placeholders globally
      filledTemplate = filledTemplate
        .replace(/{{instituteName}}/g, 'Concordia College')
        .replace(/{{instituteAddress}}/g, 'Lahore, Pakistan')
        .replace(/{{examName}}/g, exam.examName)
        .replace(/{{session}}/g, exam.session)
        .replace(/{{studentName}}/g, getFullName(student))
        .replace(/{{rollNumber}}/g, student.rollNumber)
        .replace(/{{fatherName}}/g, student.fatherName || 'N/A')
        .replace(/{{class}}/g, exam.class.name)
        .replace(/{{totalMarks}}/g, result.totalMarks)
        .replace(/{{obtainedMarks}}/g, result.obtainedMarks)
        .replace(/{{percentage}}/g, result.percentage.toFixed(2))
        .replace(/{{grade}}/g, result.grade)
        .replace(/{{gpa}}/g, showGPA ? result.gpa.toFixed(2) : '')
        .replace(/{{position}}/g, position || 'N/A')
        .replace(/{{remarks}}/g, result.remarks || '');

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
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Examination Management</h2>
          <p className="text-primary-foreground/90">
            Create exams, enter marks, and generate results
          </p>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="marks">Marks Entry</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
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
                    <div className="grid grid-cols-4 gap-6 p-2">
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
                        <Input
                          value={examForm.session}
                          onChange={(e) =>
                            setExamForm({ ...examForm, session: e.target.value })
                          }
                        />
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
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Start Time</TableHead>
                                  <TableHead>End Time</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subjects.filter(s => s.classId === Number(examForm.classId)).map((subject) => {
                                  // Find existing schedule entry for this subject
                                  const scheduleEntry = examForm.schedule?.find(s => s.subjectId === subject.id) || {};

                                  return (
                                    <TableRow key={subject.id}>
                                      <TableCell className="font-medium">{subject.name}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="date"
                                          value={scheduleEntry.date || ""}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], date: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: e.target.value, startTime: "", endTime: "" });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="time"
                                          value={scheduleEntry.startTime || ""}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], startTime: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: "", startTime: e.target.value, endTime: "" });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="time"
                                          value={scheduleEntry.endTime || ""}
                                          onChange={(e) => {
                                            const newSchedule = [...(examForm.schedule || [])];
                                            const index = newSchedule.findIndex(s => s.subjectId === subject.id);
                                            if (index > -1) {
                                              newSchedule[index] = { ...newSchedule[index], endTime: e.target.value };
                                            } else {
                                              newSchedule.push({ subjectId: subject.id, date: "", startTime: "", endTime: e.target.value });
                                            }
                                            setExamForm({ ...examForm, schedule: newSchedule });
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {subjects.filter(s => s.classId === Number(examForm.classId)).length === 0 && (
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
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <TableHead>Exam Name</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Session</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exams?.filter(exam => {
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
                            <TableCell className="font-medium">{exam.examName}</TableCell>
                            <TableCell>{exam.program.name}</TableCell>
                            <TableCell>{exam.class?.name || "N/A"}</TableCell>
                            <TableCell>{exam.session}</TableCell>
                            <TableCell>{exam.type}</TableCell>
                            <TableCell className="whitespace-nowrap">{new Date(exam.startDate).toLocaleDateString()}</TableCell>
                            <TableCell className="whitespace-nowrap">{new Date(exam.endDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditExam(exam)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
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
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {exams?.length === 0 && (
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
                            {program.name}
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
                          return exams
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
                  <Dialog open={marksDialog} onOpenChange={setMarksDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingMarks(null);
                        setMarksForm({ examId: "", studentId: "", subject: "", totalMarks: "", obtainedMarks: "", teacherRemarks: "" });
                      }}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Marks
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingMarks ? "Edit Marks" : "Add Marks"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Exam Select */}
                        <div>
                          <Label>Exam</Label>
                          <Select value={marksForm.examId} onValueChange={(v) => setMarksForm({ ...marksForm, examId: v, studentId: "", subject: "" })}>
                            <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                            <SelectContent>
                              {exams.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id.toString()}>{exam.examName} - {formatDateTimeDisplay(exam.startDate)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Student Select */}
                        <div>
                          <Label>Student</Label>
                          <Select
                            value={marksForm.studentId}
                            onValueChange={(v) => setMarksForm({ ...marksForm, studentId: v, subject: "" })}
                            disabled={!marksForm.examId}
                          >
                            <SelectTrigger><SelectValue placeholder={marksForm.examId ? "Select student" : "First select exam"} /></SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const exam = exams.find(e => e.id === Number(marksForm.examId));
                                if (!exam) return <SelectItem disabled>No exam selected</SelectItem>;
                                const studentsInClass = students.filter(s => s.classId === exam.classId);
                                return studentsInClass.length > 0 ? (
                                  studentsInClass.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                      {getFullName(s)} ({s.rollNumber})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem disabled>No students in this class</SelectItem>
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Subject Select - Only from Student's Class */}
                        <div>
                          <Label>Subject</Label>
                          <Select
                            value={marksForm.subject}
                            onValueChange={(v) => setMarksForm({ ...marksForm, subject: v })}
                            disabled={!marksForm.studentId}
                          >
                            <SelectTrigger><SelectValue placeholder={marksForm.studentId ? "Select subject" : "First select student"} /></SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const student = students.find(s => s.id === Number(marksForm.studentId));
                                if (!student) return <SelectItem disabled>No student selected</SelectItem>;

                                const classSubjects = subjects.filter(sub => sub.classId === student.classId);
                                return classSubjects.length > 0 ? (
                                  classSubjects.map((sub) => (
                                    <SelectItem key={sub.id} value={sub.name}>
                                      {sub.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem disabled>No subjects for this class</SelectItem>
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div><Label>Total Marks</Label><Input type="number" value={marksForm.totalMarks} onChange={(e) => setMarksForm({ ...marksForm, totalMarks: e.target.value })} /></div>
                          <div><Label>Obtained Marks</Label><Input type="number" value={marksForm.obtainedMarks} onChange={(e) => setMarksForm({ ...marksForm, obtainedMarks: e.target.value })} /></div>
                        </div>

                        <div><Label>Teacher Remarks (Optional)</Label><Input value={marksForm.teacherRemarks} onChange={(e) => setMarksForm({ ...marksForm, teacherRemarks: e.target.value })} /></div>

                        <Button onClick={handleMarksSubmit} className="w-full">
                          {editingMarks ? "Update" : "Add"} Marks
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Obtained</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.length > 0 ? marks?.map((mark) => {
                      console.log(mark)
                      console.log(exams)
                      const exam = exams.find(e => e.id === mark.examId);
                      const student = students.find(s => s.id === mark.studentId);
                      const percentage = mark.totalMarks > 0 ? ((mark.obtainedMarks / mark.totalMarks) * 100).toFixed(1) : 0;

                      return (
                        <TableRow key={mark.id}>
                          <TableCell>{exam?.examName || "N/A"}</TableCell>
                          <TableCell>{student ? getFullName(student) : "Unknown"}</TableCell>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>{mark.totalMarks}</TableCell>
                          <TableCell>{mark.obtainedMarks}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditMarks(mark)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget({ type: "marks", id: mark.id }); setDeleteDialog(true); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (<TableRow><TableCell colSpan={7} className="text-center">No marks to show</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                                  {exams?.map((exam) => (
                                    <SelectItem key={exam.id} value={exam.id.toString()}>
                                      {exam.examName} - {exam.session} ({formatDateTimeDisplay(exam.startDate)})
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
                            {programs?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.department?.name ? `— ${p.department.name}` : ''}
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
                              ?.find(p => p.id === Number(resultFilterProgram)) // Agar specific program select hai
                              ?.classes
                              ?.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            {/* Show all classes when program filter is * (All Programs) */}
                            {resultFilterProgram === "*" &&
                              programs?.flatMap(p => p.classes || []).map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.name}
                                </SelectItem>
                              ))
                            }
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
                        {exams?.map((exam) => {
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
                                      <TableHead>Position</TableHead>
                                      <TableHead>Student</TableHead>
                                      <TableHead>Reg. No</TableHead>
                                      <TableHead>Class</TableHead>
                                      <TableHead>Total Marks</TableHead>
                                      <TableHead>Obtained</TableHead>
                                      <TableHead>Percentage</TableHead>
                                      <TableHead>Grade</TableHead>
                                      <TableHead>GPA</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {examResults
                                      .sort((a, b) => b.percentage - a.percentage)
                                      .map((result, idx) => {
                                        const student = result.student;
                                        return (
                                          <TableRow key={result.id}>
                                            <TableCell className="font-bold">
                                              {idx + 1}
                                            </TableCell>
                                            <TableCell>{student ? getFullName(student) : 'N/A'}</TableCell>
                                            <TableCell>{student?.rollNumber}</TableCell>
                                            <TableCell>{student?.class?.name}</TableCell>
                                            <TableCell>{result.totalMarks}</TableCell>
                                            <TableCell>
                                              {result.obtainedMarks}
                                            </TableCell>
                                            <TableCell>
                                              {result.percentage.toFixed(2)}%
                                            </TableCell>
                                            <TableCell>{result.grade}</TableCell>
                                            <TableCell>
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
                        const examKey = `${pos.exam.examName} - ${pos.exam.session}`;
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
                                        <TableHead className="w-16">Position</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Obtained</TableHead>
                                        <TableHead className="text-right">%</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead className="text-right">GPA</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sortedPositions.map((pos) => {
                                        const student = students.find(s => s.id === pos.studentId);
                                        return (
                                          <TableRow key={pos.id}>
                                            <TableCell className="font-bold">
                                              {pos.position === 1 ? "🥇" : pos.position === 2 ? "🥈" : pos.position === 3 ? "🥉" : pos.position}
                                            </TableCell>
                                            <TableCell>{student ? getFullName(student) : 'N/A'}</TableCell>
                                            <TableCell>{student?.rollNumber}</TableCell>
                                            <TableCell className="text-right">{pos.totalMarks}</TableCell>
                                            <TableCell className="text-right">{pos.obtainedMarks}</TableCell>
                                            <TableCell className="text-right">{pos.percentage.toFixed(2)}%</TableCell>
                                            <TableCell>{pos.grade}</TableCell>
                                            <TableCell className="text-right">{pos.gpa.toFixed(2)}</TableCell>
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

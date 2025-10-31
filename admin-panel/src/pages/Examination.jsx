import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, FileText, PlusCircle, Edit, Trash2, Trophy, Printer } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const Examination = () => {
  const {
    exams,
    marks,
    results,
    students,
    programs,
    classes,
    addExam,
    updateExam,
    deleteExam,
    addMarks,
    updateMarks,
    deleteMarks,
    addResult,
    updateResult,
    deleteResult
  } = useData();
  const {
    toast
  } = useToast();
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
    className: "",
    session: "",
    startDate: "",
    endDate: "",
    type: "",
    description: ""
  });
  const [resultFilterProgram, setResultFilterProgram] = useState("all");
  const [resultFilterClass, setResultFilterClass] = useState("all");
  const [marksForm, setMarksForm] = useState({
    examId: "",
    studentId: "",
    subject: "",
    totalMarks: "",
    obtainedMarks: "",
    teacherRemarks: ""
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
    remarks: ""
  });
  const calculateGrade = percentage => {
    if (percentage >= 90) return {
      grade: "A+",
      gpa: 4.0
    };
    if (percentage >= 80) return {
      grade: "A",
      gpa: 3.7
    };
    if (percentage >= 70) return {
      grade: "B+",
      gpa: 3.3
    };
    if (percentage >= 60) return {
      grade: "B",
      gpa: 3.0
    };
    if (percentage >= 50) return {
      grade: "C",
      gpa: 2.5
    };
    return {
      grade: "F",
      gpa: 0.0
    };
  };
  const handleExamSubmit = () => {
    if (editingExam) {
      updateExam(editingExam.id, examForm);
      toast({
        title: "Exam updated successfully"
      });
    } else {
      addExam(examForm);
      toast({
        title: "Exam created successfully"
      });
    }
    setExamDialog(false);
    setEditingExam(null);
    setExamForm({
      examName: "",
      program: "",
      className: "",
      session: "",
      startDate: "",
      endDate: "",
      type: "",
      description: ""
    });
  };
  const printResults = examId => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    let filteredResults = results.filter(r => r.examId === examId);
    if (resultFilterProgram !== "all") {
      filteredResults = filteredResults.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.program === resultFilterProgram;
      });
    }
    if (resultFilterClass !== "all") {
      filteredResults = filteredResults.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.class === resultFilterClass;
      });
    }
    filteredResults.sort((a, b) => b.percentage - a.percentage);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Results - ${exam.examName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EXAMINATION RESULTS</h1>
            <h2>${exam.examName}</h2>
            <p>Program: ${exam.program} | Session: ${exam.session}</p>
            ${resultFilterProgram !== "all" ? `<p>Filtered Program: ${resultFilterProgram}</p>` : ''}
            ${resultFilterClass !== "all" ? `<p>Filtered Class: ${resultFilterClass}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Student Name</th>
                <th>Reg. No</th>
                <th>Class</th>
                <th>Total Marks</th>
                <th>Obtained</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>GPA</th>
              </tr>
            </thead>
            <tbody>
              ${filteredResults.map((result, idx) => {
      const student = students.find(s => s.id === result.studentId);
      return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${student?.name || 'Unknown'}</td>
                    <td>${student?.rollNumber || 'N/A'}</td>
                    <td>${student?.class || 'N/A'}</td>
                    <td>${result.totalMarks}</td>
                    <td>${result.obtainedMarks}</td>
                    <td>${result.percentage.toFixed(2)}%</td>
                    <td>${result.grade}</td>
                    <td>${result.gpa.toFixed(2)}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function () {
      printWindow.print();
    };
  };
  const handleMarksSubmit = () => {
    const marksData = {
      ...marksForm,
      totalMarks: Number(marksForm.totalMarks),
      obtainedMarks: Number(marksForm.obtainedMarks)
    };
    if (editingMarks) {
      updateMarks(editingMarks.id, marksData);
      toast({
        title: "Marks updated successfully"
      });
    } else {
      addMarks(marksData);
      toast({
        title: "Marks added successfully"
      });
    }
    setMarksDialog(false);
    setEditingMarks(null);
    setMarksForm({
      examId: "",
      studentId: "",
      subject: "",
      totalMarks: "",
      obtainedMarks: "",
      teacherRemarks: ""
    });
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
      position: Number(resultForm.position)
    };
    if (editingResult) {
      updateResult(editingResult.id, resultData);
      toast({
        title: "Result updated successfully"
      });
    } else {
      addResult(resultData);
      toast({
        title: "Result generated successfully"
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
      remarks: ""
    });
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "exam") {
      deleteExam(deleteTarget.id);
      toast({
        title: "Exam deleted successfully"
      });
    } else if (deleteTarget.type === "marks") {
      deleteMarks(deleteTarget.id);
      toast({
        title: "Marks deleted successfully"
      });
    } else if (deleteTarget.type === "result") {
      deleteResult(deleteTarget.id);
      toast({
        title: "Result deleted successfully"
      });
    }
    setDeleteDialog(false);
    setDeleteTarget(null);
  };
  const openEditExam = exam => {
    setEditingExam(exam);
    setExamForm(exam);
    setExamDialog(true);
  };
  const openEditMarks = marksData => {
    setEditingMarks(marksData);
    setMarksForm({
      examId: marksData.examId,
      studentId: marksData.studentId,
      subject: marksData.subject,
      totalMarks: marksData.totalMarks.toString(),
      obtainedMarks: marksData.obtainedMarks.toString(),
      teacherRemarks: marksData.teacherRemarks || ""
    });
    setMarksDialog(true);
  };
  const openEditResult = result => {
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
      remarks: result.remarks || ""
    });
    setResultDialog(true);
  };

  // Get positions/rankings - class-wise
  const getPositions = () => {
    const examResults = results.reduce((acc, result) => {
      if (!acc[result.examId]) acc[result.examId] = [];
      acc[result.examId].push(result);
      return acc;
    }, {});
    return Object.entries(examResults).map(([examId, examResults]) => {
      const exam = exams.find(e => e.id === examId);
      const allToppers = examResults.map(r => ({
        ...r,
        student: students.find(s => s.id === r.studentId)
      }));
      return {
        examId,
        examName: exam?.examName || "Unknown",
        toppers: allToppers
      };
    });
  };
  const positions = getPositions();
  return <DashboardLayout>
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

          <TabsContent value="exams">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Exam Management
                </CardTitle>
                <Dialog open={examDialog} onOpenChange={setExamDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditingExam(null);
                    setExamForm({
                      examName: "",
                      program: "",
                      className: "",
                      session: "",
                      startDate: "",
                      endDate: "",
                      type: "",
                      description: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Exam
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Exam Name</Label>
                        <Input value={examForm.examName} onChange={e => setExamForm({
                        ...examForm,
                        examName: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Program</Label>
                        <Select value={examForm.program} onValueChange={value => setExamForm({
                        ...examForm,
                        program: value,
                        className: ""
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Class</Label>
                        <Select value={examForm.className} onValueChange={value => setExamForm({
                        ...examForm,
                        className: value
                      })} disabled={!examForm.program}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.filter(c => c.programId === examForm.program).map(c => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Session</Label>
                        <Input value={examForm.session} onChange={e => setExamForm({
                        ...examForm,
                        session: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={examForm.type} onValueChange={value => setExamForm({
                        ...examForm,
                        type: value
                      })}>
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
                      <div>
                        <Label>Start Date</Label>
                        <Input type="date" value={examForm.startDate} onChange={e => setExamForm({
                        ...examForm,
                        startDate: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input type="date" value={examForm.endDate} onChange={e => setExamForm({
                        ...examForm,
                        endDate: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input value={examForm.description} onChange={e => setExamForm({
                        ...examForm,
                        description: e.target.value
                      })} />
                      </div>
                      <Button onClick={handleExamSubmit} className="w-full">{editingExam ? "Update" : "Create"} Exam</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
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
                    {exams.map(exam => <TableRow key={exam.id}>
                        <TableCell>{exam.examName}</TableCell>
                        <TableCell>{exam.program}</TableCell>
                        <TableCell>All</TableCell>
                        <TableCell>{exam.session}</TableCell>
                        <TableCell>{exam.type}</TableCell>
                        <TableCell>{exam.startDate}</TableCell>
                        <TableCell>{exam.endDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditExam(exam)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "exam",
                              id: exam.id
                            });
                            setDeleteDialog(true);
                          }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Marks Entry
                </CardTitle>
                <Dialog open={marksDialog} onOpenChange={setMarksDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditingMarks(null);
                    setMarksForm({
                      examId: "",
                      studentId: "",
                      subject: "",
                      totalMarks: "",
                      obtainedMarks: "",
                      teacherRemarks: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Marks
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMarks ? "Edit Marks" : "Add Marks"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Exam</Label>
                        <Select value={marksForm.examId} onValueChange={value => setMarksForm({
                        ...marksForm,
                        examId: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam" />
                          </SelectTrigger>
                          <SelectContent>
                            {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.examName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Student</Label>
                        <Select value={marksForm.studentId} onValueChange={value => setMarksForm({
                        ...marksForm,
                        studentId: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(student => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Input value={marksForm.subject} onChange={e => setMarksForm({
                        ...marksForm,
                        subject: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Total Marks</Label>
                        <Input type="number" value={marksForm.totalMarks} onChange={e => setMarksForm({
                        ...marksForm,
                        totalMarks: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Obtained Marks</Label>
                        <Input type="number" value={marksForm.obtainedMarks} onChange={e => setMarksForm({
                        ...marksForm,
                        obtainedMarks: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Teacher Remarks</Label>
                        <Input value={marksForm.teacherRemarks} onChange={e => setMarksForm({
                        ...marksForm,
                        teacherRemarks: e.target.value
                      })} />
                      </div>
                      <Button onClick={handleMarksSubmit} className="w-full">{editingMarks ? "Update" : "Add"} Marks</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Obtained</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map(mark => {
                    const exam = exams.find(e => e.id === mark.examId);
                    const student = students.find(s => s.id === mark.studentId);
                    const percentage = (mark.obtainedMarks / mark.totalMarks * 100).toFixed(2);
                    return <TableRow key={mark.id}>
                          <TableCell>{exam?.examName}</TableCell>
                          <TableCell>{student?.name}</TableCell>
                          <TableCell>{mark.subject}</TableCell>
                          <TableCell>{mark.totalMarks}</TableCell>
                          <TableCell>{mark.obtainedMarks}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditMarks(mark)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "marks",
                              id: mark.id
                            });
                            setDeleteDialog(true);
                          }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Examination Results
                </CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label>Filter by Program</Label>
                    <Select value={resultFilterProgram} onValueChange={setResultFilterProgram}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select value={resultFilterClass} onValueChange={setResultFilterClass}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.filter(c => resultFilterProgram === "all" || c.programId === resultFilterProgram).map(c => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {exams.map(exam => {
                let examResults = results.filter(r => r.examId === exam.id);
                if (resultFilterProgram !== "all") {
                  examResults = examResults.filter(r => {
                    const student = students.find(s => s.id === r.studentId);
                    return student?.program === resultFilterProgram;
                  });
                }
                if (resultFilterClass !== "all") {
                  examResults = examResults.filter(r => {
                    const student = students.find(s => s.id === r.studentId);
                    return student?.class === resultFilterClass;
                  });
                }
                if (examResults.length === 0) return null;
                return <Card key={exam.id} className="mb-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{exam.examName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{exam.program} | {exam.session}</p>
                          </div>
                          <Button size="sm" onClick={() => printResults(exam.id)} className="gap-2">
                            <Printer className="w-4 h-4" />
                            Print Results
                          </Button>
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
                            {examResults.sort((a, b) => b.percentage - a.percentage).map((result, idx) => {
                          const student = students.find(s => s.id === result.studentId);
                          return <TableRow key={result.id}>
                                  <TableCell className="font-bold">{idx + 1}</TableCell>
                                  <TableCell>{student?.name}</TableCell>
                                  <TableCell>{student?.rollNumber}</TableCell>
                                  <TableCell>{student?.class}</TableCell>
                                  <TableCell>{result.totalMarks}</TableCell>
                                  <TableCell>{result.obtainedMarks}</TableCell>
                                  <TableCell>{result.percentage.toFixed(2)}%</TableCell>
                                  <TableCell>{result.grade}</TableCell>
                                  <TableCell>{result.gpa.toFixed(2)}</TableCell>
                                </TableRow>;
                        })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>;
              })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="positions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Position Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {positions.map(examPos => {
                // Group positions by class
                const classwisePositions = examPos.toppers.reduce((acc, topper) => {
                  const className = topper.student?.class || 'Unknown';
                  if (!acc[className]) acc[className] = [];
                  acc[className].push(topper);
                  return acc;
                }, {});
                return <div key={examPos.examId} className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">{examPos.examName}</h3>
                      {Object.entries(classwisePositions).map(([className, classToppers]) => {
                    const sorted = classToppers.sort((a, b) => b.percentage - a.percentage);
                    return <div key={className} className="mb-6">
                            <h4 className="text-md font-medium mb-2 text-muted-foreground">Class: {className}</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Rank</TableHead>
                                  <TableHead>Student Name</TableHead>
                                  <TableHead>Roll Number</TableHead>
                                  <TableHead>Total Marks</TableHead>
                                  <TableHead>Percentage</TableHead>
                                  <TableHead>GPA</TableHead>
                                  <TableHead>Grade</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sorted.map((topper, idx) => <TableRow key={topper.id}>
                                    <TableCell className="font-bold">{idx + 1}</TableCell>
                                    <TableCell>{topper.student?.name}</TableCell>
                                    <TableCell>{topper.student?.rollNumber}</TableCell>
                                    <TableCell>{topper.obtainedMarks}/{topper.totalMarks}</TableCell>
                                    <TableCell>{topper.percentage}%</TableCell>
                                    <TableCell>{topper.gpa}</TableCell>
                                    <TableCell>{topper.grade}</TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>;
                  })}
                    </div>;
              })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {deleteTarget?.type}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>;
};
export default Examination;
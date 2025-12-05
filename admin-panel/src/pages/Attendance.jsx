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
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, FileText, ClipboardList, UserCheck, Printer, User, Lock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProgramNames,
  getClassSubjects,
  getTeacherSubjectsForClass,
  fetchStudentAttendance,
  updateStudentAttendance,
  getLeaves,
  createLeave,
  updateLeave,
  getAttendanceReport,
  getTeacherClasses,
  searchStudents
} from "../../config/apis";
import { StudentAttendanceTab } from "./StudentAttendanceTab";

const Attendance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentUser = queryClient.getQueryData(["currentUser"]);
  const isTeacher = currentUser?.role === "TEACHER" || currentUser?.role === "Teacher";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const hasAttendancePermission = currentUser?.permissions?.attendance === true;
  const canViewAllReports = isSuperAdmin || hasAttendancePermission;

  const [markDate, setMarkDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [fetchedStudents, setFetchedStudents] = useState([]);
  const [attendanceChanges, setAttendanceChanges] = useState({});

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    studentId: "",
    reason: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0]
  });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportClassId, setReportClassId] = useState("");
  const [reportSectionId, setReportSectionId] = useState("");

  // Individual Reports states
  const [individualStudentSearchQuery, setIndividualStudentSearchQuery] = useState("");
  const [individualSearchResults, setIndividualSearchResults] = useState([]);
  const [isIndividualSearching, setIsIndividualSearching] = useState(false);
  const [selectedIndividualStudent, setSelectedIndividualStudent] = useState(null);
  const [individualStartDate, setIndividualStartDate] = useState("");
  const [individualEndDate, setIndividualEndDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: getProgramNames,
  });

  const { data: teacherClassMappings = [] } = useQuery({
    queryKey: ["teacherClasses"],
    queryFn: getTeacherClasses,
    enabled: isTeacher
  });

  const { data: subjects = [], refetch: refetchSubjects } = useQuery({
    queryKey: ["classSubjects", selectedClassId],
    queryFn: () => isTeacher
      ? getTeacherSubjectsForClass(selectedClassId)
      : getClassSubjects(selectedClassId),
    enabled: false
  });

  const { data: attendanceData, refetch: refetchAttendance, isFetching } = useQuery({
    queryKey: ["studentAttendance", selectedClassId, selectedSectionId, selectedSubjectId, markDate],
    queryFn: () => {
      const sectionParam = selectedSectionId === "*" ? "" : selectedSectionId;
      return fetchStudentAttendance(selectedClassId, sectionParam, selectedSubjectId, markDate);
    },
    enabled: false
  });

  useEffect(()=>{
    console.log(attendanceData)
    if(!isFetching && attendanceData) setFetchedStudents(attendanceData.attendance)

  }, [isFetching])

  const { data: leavesData = { data: [], total: 0 }, refetch: refetchLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => getLeaves({ pageParam: 1 }),
    enabled: false
  });

  const { data: reportData = [], refetch: refetchReport, isFetching: isFetchingReport } = useQuery({
    queryKey: ["attendanceReport", reportStartDate, reportEndDate, reportClassId, reportSectionId],
    queryFn: () => {
      const classParam = reportClassId === "*" ? "" : reportClassId;
      const sectionParam = reportSectionId === "*" ? "" : reportSectionId;
      return getAttendanceReport(reportStartDate, reportEndDate, classParam, sectionParam);
    },
    enabled: false
  });

  const { data: individualReportData = [], refetch: refetchIndividualReport, isFetching: isFetchingIndividualReport } = useQuery({
    queryKey: ["individualAttendanceReport", individualStartDate, individualEndDate, selectedIndividualStudent?.class?.id, selectedIndividualStudent?.section?.id, selectedIndividualStudent?.id],
    queryFn: async () => {
      if (!selectedIndividualStudent) return [];
      const classParam = selectedIndividualStudent.class?.id || "";
      const sectionParam = selectedIndividualStudent.section?.id || "";
      const allData = await getAttendanceReport(individualStartDate, individualEndDate, classParam, sectionParam);
      // Filter for the selected student
      return allData.filter(student => student.id === selectedIndividualStudent.id);
    },
    enabled: false
  });

  const createLeaveMutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      toast({ title: "Leave request submitted successfully" });
      refetchLeaves();
      setLeaveOpen(false);
      setLeaveFormData({
        studentId: "",
        reason: "",
        fromDate: new Date().toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0]
      });
      setStudentSearchQuery("");
      setSearchResults([]);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast({ title: "Failed to submit leave", description: error.message, variant: "destructive" });
    }
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, status }) => updateLeave(id, status),
    onSuccess: () => {
      toast({ title: "Leave updated successfully" });
      refetchLeaves();
    }
  })
  // const allSections = allClassesWithProgram.flatMap(c =>
  //   (c.sections || []).map(s => ({ ...s, classId: c.id }))
  // );

  const teacherClasses = isTeacher
    ? teacherClassMappings.map(mapping => ({
      ...mapping.class,
      programName: mapping.class?.program?.name || 'N/A'
    })).filter(Boolean)
    : [];

  const uniqueTeacherClasses = teacherClasses.filter((c, idx, arr) =>
    arr.findIndex(x => x.id === c.id) === idx
  );

  const filteredClasses = isTeacher ? uniqueTeacherClasses : []

  const reportFilteredClasses = uniqueTeacherClasses;

  const filteredSections = isTeacher
    && teacherClassMappings
      .filter(mapping => mapping.class?.id === Number(selectedClassId))
      .map(mapping => mapping.section)
      .filter(Boolean)

  useEffect(() => {
    if (selectedClassId && isTeacher) {
      refetchSubjects();
    }
  }, [selectedClassId, isTeacher, refetchSubjects]);

  useEffect(() => {
    // Reset section when class changes in reports tab
    if (reportClassId) {
      setReportSectionId("*");
    }
  }, [reportClassId]);

  const handleStudentSearch = async (query) => {
    setStudentSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchStudents(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIndividualStudentSearch = async (query) => {
    setIndividualStudentSearchQuery(query);
    if (query.length < 2) {
      setIndividualSearchResults([]);
      return;
    }
    setIsIndividualSearching(true);
    try {
      const results = await searchStudents(query);
      setIndividualSearchResults(results || []);
    } catch (error) {
      console.error("Search error:", error);
      setIndividualSearchResults([]);
    } finally {
      setIsIndividualSearching(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setLeaveFormData({ ...leaveFormData, studentId: String(student.id) });
    setStudentSearchQuery(`${student.rollNumber} - ${student.fName} ${student.lName}`);
    setSearchResults([]);
  };

  const handleSelectIndividualStudent = (student) => {
    setSelectedIndividualStudent(student);
    setIndividualStudentSearchQuery(`${student.rollNumber} - ${student.fName} ${student.lName}`);
    setIndividualSearchResults([]);
  };

  const handleGenerateIndividualReport = () => {
    if (!selectedIndividualStudent || !individualStartDate || !individualEndDate) {
      toast({ title: "Please select a student and date range", variant: "destructive" });
      return;
    }
    refetchIndividualReport();
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceChanges(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleFetchAttendance = () => {
    if (!selectedClassId || !selectedSubjectId || !markDate) {
      toast({ title: "Please select all required fields", variant: "destructive" });
      return;
    }
    refetchAttendance();
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceChanges).length === 0) {
      toast({ title: "No changes to save", variant: "default" });
      return;
    }

    const sectionParam = selectedSectionId === "*" ? null : Number(selectedSectionId);

    const payload = {
      classId: Number(selectedClassId),
      sectionId: sectionParam,
      subjectId: Number(selectedSubjectId),
      teacherId: currentUser?.id || null,
      date: markDate,
      students: Object.entries(attendanceChanges).map(([studentId, status]) => ({
        studentId,
        status: status.toUpperCase()
      }))
    };

    try {
      await updateStudentAttendance(payload);
      toast({ title: "Attendance saved successfully", variant: "success" });
      refetchAttendance();
      setAttendanceChanges({});
    } catch (error) {
      toast({ title: "Failed to save attendance", description: error.message, variant: "destructive" });
    }
  };

  const getFullName = (student) => {
    return `${student.fName} ${student.mName || ""} ${student.lName}`.trim();
  };

  const calculateStats = () => {
    if (!fetchedStudents.length) return { present: 0, absent: 0, leave: 0, rate: 0 };

    let present = 0, absent = 0, leave = 0;
    fetchedStudents.forEach(student => {
      const status = attendanceChanges[student.id] ||
        student.attendance?.[0]?.status?.toLowerCase();

      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'leave' || status === 'on-leave') leave++;
    });

    const total = fetchedStudents.length;
    return {
      present,
      absent,
      leave,
      rate: total > 0 ? ((present / total) * 100).toFixed(1) : 0
    };
  };

  const stats = calculateStats();

  const handleSubmitLeave = () => {
    if (!leaveFormData.studentId || !leaveFormData.reason || !leaveFormData.fromDate || !leaveFormData.toDate) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    createLeaveMutation.mutate(leaveFormData);
  };

  const handleApproveReject = (id, status) => {
    updateLeaveMutation.mutate({ id, status });
  };

  const dailyStats = useMemo(() => {
    if (!reportData.length || !reportStartDate || !reportEndDate) {
      return { totalStudents: 0, totalDays: 0, presentCount: 0, absentCount: 0, leaveCount: 0 };
    }

    // Calculate total days from date range
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const stats = {
      totalStudents: reportData.length,
      totalDays: totalDays,
      presentCount: 0,
      absentCount: 0,
      leaveCount: 0
    };

    reportData.forEach(student => {
      student.subjects.forEach(subject => {
        subject.attendance.forEach(att => {
          if (att.status === 'present') stats.presentCount++;
          else if (att.status === 'absent') stats.absentCount++;
          else if (att.status === 'leave') stats.leaveCount++;
        });
      });
    });

    return stats;
  }, [reportData, reportStartDate, reportEndDate]);

  const reportDates = useMemo(() => {
    if (!reportStartDate || !reportEndDate) return [];

    const dates = [];
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }, [reportStartDate, reportEndDate]);

  const printAttendanceReport = () => {
    const printContent = document.querySelector('.attendance-register-table');
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Attendance Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px; }');
    printWindow.document.write('th { background-color: #f5f5f5; font-weight: bold; }');
    printWindow.document.write('.present { background-color: #dcfce7; color: #166534; }');
    printWindow.document.write('.absent { background-color: #fee2e2; color: #991b1b; }');
    printWindow.document.write('.leave { background-color: #fef3c7; color: #92400e; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<h2 style="text-align: center;">Attendance Report</h2>');
    printWindow.document.write('<p style="text-align: center;">' + new Date(reportStartDate).toLocaleDateString() + ' to ' + new Date(reportEndDate).toLocaleDateString() + '</p>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Attendance Management</h2>
          <p className="text-primary-foreground/90">Mark and track student attendance</p>
        </div>

        <Tabs defaultValue="mark" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
            <TabsTrigger value="mark" className="gap-2">
              <UserCheck className="w-4 h-4" />Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-2">
              <ClipboardList className="w-4 h-4" />Leave
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />Reports
            </TabsTrigger>
            <TabsTrigger value="individual-reports" className="gap-2">
              <User className="w-4 h-4" />Individual Reports
            </TabsTrigger>
          </TabsList >

          <TabsContent value="mark" className="space-y-6">
            {!isTeacher ? (
              <Card className="shadow-soft">
                <CardContent className="pt-12 pb-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Lock className="w-16 h-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Permission Denied</h3>
                      <p className="text-muted-foreground mt-2">
                        Only teachers can mark attendance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="shadow-soft">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                          <p className="text-2xl font-bold text-primary">{stats.rate}%</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Present</p>
                          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Absent</p>
                          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">On Leave</p>
                          <p className="text-2xl font-bold text-amber-600">{stats.leave}</p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                          <SelectContent>
                            {filteredClasses.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.programName} - {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Section</Label>
                        <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                          <SelectTrigger><SelectValue placeholder={selectedClassId ? "All Sections" : "Select Class First"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="*">All Sections</SelectItem>
                            {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId} disabled={!selectedClassId}>
                          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                          <SelectContent>
                            {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button onClick={handleFetchAttendance} disabled={!selectedClassId || !selectedSubjectId || !markDate || isFetching} variant="outline">
                        Fetch Students
                      </Button>
                      <Button onClick={handleSaveAttendance} disabled={!selectedSubjectId || isFetching || fetchedStudents.length === 0}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Attendance
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isFetching ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                          ) : fetchedStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">No students found.</TableCell>
                            </TableRow>
                          ) : (
                            fetchedStudents.map(student => {
                              const dbStatus = student.attendance?.[0]?.status?.toLowerCase();
                              const currentStatus = attendanceChanges[student.id] || dbStatus;

                              return <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.rollNumber}</TableCell>
                                <TableCell>{getFullName(student)}</TableCell>
                                <TableCell>{student.class?.name} - {student.section?.name}</TableCell>
                                <TableCell>
                                  {currentStatus ? (
                                    <Badge variant={
                                      currentStatus === "present" ? "default" :
                                        currentStatus === "absent" ? "destructive" :
                                          "secondary"
                                    }>
                                      {currentStatus.toUpperCase()}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Not Marked</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant={currentStatus === "present" ? "default" : "outline"} onClick={() => handleStatusChange(student.id, "present")}>
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant={currentStatus === "absent" ? "destructive" : "outline"} onClick={() => handleStatusChange(student.id, "absent")}>
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant={currentStatus === "leave" || currentStatus === "on-leave" ? "secondary" : "outline"} onClick={() => handleStatusChange(student.id, "leave")}>
                                      <Clock className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>;
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leave Requests</CardTitle>
                  <Button onClick={() => setLeaveOpen(true)} className="gap-2">
                    <ClipboardList className="w-4 h-4" />New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => refetchLeaves()} className="mb-4">Load Leaves</Button>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leavesData.data.map(leave => {
                        const student = leave.requester;
                        return (
                          <TableRow key={leave.id}>
                            <TableCell>{`${student.fName} ${student.lName}`}</TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                            <TableCell>{new Date(leave.fromDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(leave.toDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={leave.status === "APPROVED" ? "default" : leave.status === "REJECTED" ? "destructive" : "secondary"}>
                                {leave.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {leave.status === "PENDING" && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleApproveReject(leave.id, "APPROVED")}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleApproveReject(leave.id, "REJECTED")}>
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {leave.status !== "PENDING" && leave.approvedBy && (
                                <span className="text-sm text-muted-foreground">By {leave.approvedBy.name}</span>
                              )}
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

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Attendance Report</CardTitle>
                {isTeacher && !canViewAllReports && (
                  <p className="text-sm text-muted-foreground">You can only view reports for your assigned classes.</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={reportClassId} onValueChange={setReportClassId}>
                      <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Classes</SelectItem>
                        {reportFilteredClasses.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.programName} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section (Optional)</Label>
                    <Select value={reportSectionId} onValueChange={setReportSectionId} disabled={!reportClassId || reportClassId === "*"}>
                      <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">All Sections</SelectItem>
                        {reportClassId && reportClassId !== "*" && allSections
                          .filter(s => s.classId === Number(reportClassId))
                          .map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => refetchReport()} disabled={!reportStartDate || !reportEndDate || isFetchingReport}>
                    Generate Report
                  </Button>
                  <Button variant="outline" onClick={printAttendanceReport} disabled={!reportData.length} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Print Report
                  </Button>
                </div>

                {reportData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-2xl font-bold">{dailyStats.totalStudents}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Days</p>
                        <p className="text-2xl font-bold">{dailyStats.totalDays}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Present Records</p>
                        <p className="text-2xl font-bold text-green-600">{dailyStats.presentCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Absent Records</p>
                        <p className="text-2xl font-bold text-red-600">{dailyStats.absentCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {reportData.length > 0 && (
                  <div className="overflow-x-auto mt-6 border rounded-lg attendance-register-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background z-10 border-r">Roll No</TableHead>
                          <TableHead className="sticky left-20 bg-background z-10 border-r min-w-[200px]">Student Name</TableHead>
                          <TableHead className="border-r min-w-[150px]">Subject</TableHead>
                          {reportDates.map(date => {
                            const dateObj = new Date(date);
                            return (
                              <TableHead key={date} className="text-center min-w-[60px] border-r">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                  <span className="text-xs">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                                  <span className="font-bold">{dateObj.getDate()}</span>
                                </div>
                              </TableHead>
                            );
                          })}
                          <TableHead className="text-center bg-green-50/50 border-r">P</TableHead>
                          <TableHead className="text-center bg-red-50/50 border-r">A</TableHead>
                          <TableHead className="text-center bg-amber-50/50">L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map(student => {
                          return student.subjects.map((subject, index) => {
                            const isFirstRow = index === 0;
                            const attendanceMap = {};
                            subject.attendance.forEach(att => {
                              attendanceMap[att.date] = att.status;
                            });

                            const present = subject.attendance.filter(a => a.status === 'present').length;
                            const absent = subject.attendance.filter(a => a.status === 'absent').length;
                            const leave = subject.attendance.filter(a => a.status === 'leave').length;

                            return (
                              <TableRow key={`${student.id}-${subject.subjectId}`} className="hover:bg-muted/30">
                                {isFirstRow && (
                                  <>
                                    <TableCell rowSpan={student.subjects.length} className="font-medium sticky left-0 bg-background border-r align-top pt-4">
                                      {student.rollNumber}
                                    </TableCell>
                                    <TableCell rowSpan={student.subjects.length} className="sticky left-20 bg-background border-r align-top pt-4">
                                      {student.name}
                                    </TableCell>
                                  </>
                                )}
                                <TableCell className="border-r font-medium text-sm">{subject.subjectName}</TableCell>
                                {reportDates.map(date => {
                                  const status = attendanceMap[date];
                                  return (
                                    <TableCell key={date} className="text-center border-r p-2">
                                      {status === 'present' && <span className="inline-block w-7 h-7 leading-7 rounded-md bg-green-50 text-green-700 font-semibold text-xs">P</span>}
                                      {status === 'absent' && <span className="inline-block w-7 h-7 leading-7 rounded-md bg-red-50 text-red-700 font-semibold text-xs">A</span>}
                                      {status === 'leave' && <span className="inline-block w-7 h-7 leading-7 rounded-md bg-amber-50 text-amber-700 font-semibold text-xs">L</span>}
                                      {!status && <span className="text-gray-300">-</span>}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center font-semibold text-green-700 bg-green-50/50 border-r">{present}</TableCell>
                                <TableCell className="text-center font-semibold text-red-700 bg-red-50/50 border-r">{absent}</TableCell>
                                <TableCell className="text-center font-semibold text-amber-700 bg-amber-50/50">{leave}</TableCell>
                              </TableRow>
                            );
                          });
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual-reports">
            <StudentAttendanceTab
              studentSearchQuery={individualStudentSearchQuery}
              setStudentSearchQuery={setIndividualStudentSearchQuery}
              searchResults={individualSearchResults}
              isSearching={isIndividualSearching}
              selectedStudent={selectedIndividualStudent}
              handleStudentSearch={handleIndividualStudentSearch}
              handleSelectStudent={handleSelectIndividualStudent}
              startDate={individualStartDate}
              setStartDate={setIndividualStartDate}
              endDate={individualEndDate}
              setEndDate={setIndividualEndDate}
              reportData={individualReportData}
              generateReport={handleGenerateIndividualReport}
              isFetchingReport={isFetchingIndividualReport}
            />
          </TabsContent>
        </Tabs >

        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Student (by name or roll number)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type student name or roll number..."
                    value={studentSearchQuery}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.map(student => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-0"
                      >
                        <p className="font-medium">{student.rollNumber} - {student.fName} {student.lName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.class?.name} {student.section && `- ${student.section.name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedStudent && (
                  <div className="p-3 bg-accent rounded-md">
                    <p className="font-medium">Selected: {selectedStudent.rollNumber} - {selectedStudent.fName} {selectedStudent.lName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.class?.name} {selectedStudent.section && `- ${selectedStudent.section.name}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>From Date</Label>
                <Input type="date" value={leaveFormData.fromDate} onChange={e => setLeaveFormData({
                  ...leaveFormData,
                  fromDate: e.target.value
                })} />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input type="date" value={leaveFormData.toDate} onChange={e => setLeaveFormData({
                  ...leaveFormData,
                  toDate: e.target.value
                })} />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={leaveFormData.reason} onChange={e => setLeaveFormData({
                  ...leaveFormData,
                  reason: e.target.value
                })} placeholder="Enter reason for leave" rows={4} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitLeave} disabled={createLeaveMutation.isPending}>Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
};

export default Attendance;
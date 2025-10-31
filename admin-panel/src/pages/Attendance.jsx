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
import { CheckCircle2, XCircle, Clock, FileText, ClipboardList, UserCheck, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
const Attendance = () => {
  const {
    students,
    attendance,
    addAttendance,
    shortLeaves,
    addShortLeave,
    updateShortLeave,
    deleteShortLeave
  } = useData();
  const {
    toast
  } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterClass, setFilterClass] = useState("all");
  const [reportType, setReportType] = useState("weekly");
  const [reportClass, setReportClass] = useState("all");
  const [shortLeaveOpen, setShortLeaveOpen] = useState(false);
  const [shortLeaveFormData, setShortLeaveFormData] = useState({
    studentId: "",
    reason: "",
    date: new Date().toISOString().split("T")[0]
  });
  const markedStudentIds = new Set(attendance.filter(a => a.date === selectedDate).map(a => a.studentId));
  const filteredStudents = students.filter(s => {
    if (selectedClass === "all") return s.status === "active";
    return s.status === "active" && `${s.class}-${s.section}` === selectedClass;
  });
  const handleStatusChange = (studentId, status) => {
    setSelectedStudents({
      ...selectedStudents,
      [studentId]: status
    });
  };
  const printAttendanceReport = () => {
    const filteredRecords = attendance.filter(a => a.date === date && (filterClass === "all" || a.class === filterClass));
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Report - ${date}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <p>Date: ${date}</p>
            ${filterClass !== "all" ? `<p>Class: ${filterClass}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Registration No</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => {
      const student = students.find(s => s.id === record.studentId);
      return `
                  <tr>
                    <td>${student?.name || 'Unknown'}</td>
                    <td>${student?.rollNumber || 'N/A'}</td>
                    <td>${record.class}</td>
                    <td>${record.status}</td>
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
  const printWeeklyMonthlyReport = () => {
    const today = new Date();
    const startDate = new Date(today);
    if (reportType === "weekly") {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setMonth(today.getMonth() - 1);
    }
    const filteredStudents = reportClass === "all" ? students.filter(s => s.status === "active") : students.filter(s => s.status === "active" && `${s.class}-${s.section}` === reportClass);
    const dateRange = [];
    const current = new Date(startDate);
    while (current <= today) {
      dateRange.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportType === "weekly" ? "Weekly" : "Monthly"} Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 10px; }
            th { background-color: #f0f0f0; }
            .student-name { text-align: left; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportType === "weekly" ? "Weekly" : "Monthly"} Attendance Report</h1>
            <p>Period: ${startDate.toISOString().split("T")[0]} to ${today.toISOString().split("T")[0]}</p>
            ${reportClass !== "all" ? `<p>Class: ${reportClass}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg. No</th>
                ${dateRange.map(d => `<th>${d.split("-")[2]}/${d.split("-")[1]}</th>`).join('')}
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map(student => {
      const studentRecords = attendance.filter(r => r.studentId === student.id && dateRange.includes(r.date));
      const presentCount = studentRecords.filter(r => r.status === "present").length;
      const absentCount = studentRecords.filter(r => r.status === "absent").length;
      const leaveCount = studentRecords.filter(r => r.status === "on-leave").length;
      const percentage = dateRange.length > 0 ? (presentCount / dateRange.length * 100).toFixed(1) : "0";
      return `
                  <tr>
                    <td class="student-name">${student.name}</td>
                    <td>${student.rollNumber}</td>
                    ${dateRange.map(d => {
        const record = studentRecords.find(r => r.date === d);
        const symbol = !record ? '-' : record.status === 'present' ? 'P' : record.status === 'absent' ? 'A' : 'L';
        return `<td>${symbol}</td>`;
      }).join('')}
                    <td>${presentCount}</td>
                    <td>${absentCount}</td>
                    <td>${leaveCount}</td>
                    <td>${percentage}%</td>
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
  const handleSubmitAttendance = () => {
    if (Object.keys(selectedStudents).length === 0) {
      toast({
        title: "Please mark attendance for at least one student",
        variant: "destructive"
      });
      return;
    }
    Object.entries(selectedStudents).forEach(([studentId, status]) => {
      const student = students.find(s => s.id === studentId);
      if (student && !markedStudentIds.has(studentId)) {
        addAttendance({
          studentId,
          date: selectedDate,
          status,
          class: `${student.class}-${student.section}`
        });
      }
    });
    toast({
      title: `Attendance marked for ${Object.keys(selectedStudents).length} students`
    });
    setSelectedStudents({});
  };
  const handleSubmitShortLeave = () => {
    if (!shortLeaveFormData.studentId || !shortLeaveFormData.reason) {
      toast({
        title: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }
    const student = students.find(s => s.id === shortLeaveFormData.studentId);
    if (!student) return;
    addShortLeave({
      studentId: shortLeaveFormData.studentId,
      studentName: student.name,
      class: student.class,
      section: student.section,
      reason: shortLeaveFormData.reason,
      date: shortLeaveFormData.date,
      status: "pending"
    });
    toast({
      title: "Short leave request submitted"
    });
    setShortLeaveOpen(false);
    setShortLeaveFormData({
      studentId: "",
      reason: "",
      date: new Date().toISOString().split("T")[0]
    });
  };
  const handleApproveReject = (id, status) => {
    updateShortLeave(id, {
      status,
      approvedBy: "Admin"
    });
    toast({
      title: `Short leave ${status}`
    });
  };
  const todayAttendance = attendance.filter(a => a.date === selectedDate);
  const presentCount = todayAttendance.filter(a => a.status === "present").length;
  const absentCount = todayAttendance.filter(a => a.status === "absent").length;
  const onLeaveCount = todayAttendance.filter(a => a.status === "on-leave").length;
  const attendanceRate = todayAttendance.length > 0 ? (presentCount / todayAttendance.length * 100).toFixed(1) : "0";

  // Reports data
  const getWeeklyReport = () => {
    const weekDates = Array.from({
      length: 7
    }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    return weekDates.map(date => {
      const dayAttendance = attendance.filter(a => a.date === date);
      const present = dayAttendance.filter(a => a.status === "present").length;
      const total = dayAttendance.length;
      return {
        date,
        present,
        absent: dayAttendance.filter(a => a.status === "absent").length,
        rate: total > 0 ? (present / total * 100).toFixed(1) : "0"
      };
    });
  };
  const getMostAbsentStudents = () => {
    const absentCounts = {};
    attendance.filter(a => a.status === "absent").forEach(a => {
      absentCounts[a.studentId] = (absentCounts[a.studentId] || 0) + 1;
    });
    return Object.entries(absentCounts).map(([studentId, count]) => {
      const student = students.find(s => s.id === studentId);
      return {
        student,
        count
      };
    }).filter(item => item.student).sort((a, b) => b.count - a.count).slice(0, 5);
  };
  const uniqueClasses = [...new Set(students.map(s => `${s.class}-${s.section}`))];
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Attendance Management</h2>
          <p className="text-primary-foreground/90">Mark and track student attendance - Date: {selectedDate}</p>
        </div>

        <Tabs defaultValue="mark" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="mark" className="gap-2">
              <UserCheck className="w-4 h-4" />Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="shortleave" className="gap-2">
              <ClipboardList className="w-4 h-4" />Short Leave
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />Reports
            </TabsTrigger>
          </TabsList>

          {/* Mark Attendance Tab */}
          <TabsContent value="mark" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
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
                      <p className="text-2xl font-bold text-success">{presentCount}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">On Leave</p>
                      <p className="text-2xl font-bold text-warning">{onLeaveCount}</p>
                    </div>
                    <Clock className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Select Date</Label>
                    <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Filter by Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {uniqueClasses.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={printAttendanceReport} variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Print Report
                  </Button>
                  <Button onClick={handleSubmitAttendance} disabled={Object.keys(selectedStudents).length === 0} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Save Attendance ({Object.keys(selectedStudents).length})
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
                    {filteredStudents.map(student => {
                      const alreadyMarked = markedStudentIds.has(student.id);
                      const markedStatus = attendance.find(a => a.studentId === student.id && a.date === selectedDate)?.status;
                      const currentStatus = selectedStudents[student.id] || markedStatus;
                      return <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.rollNumber}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.class}-{student.section}</TableCell>
                          <TableCell>
                            {alreadyMarked ? <Badge variant={markedStatus === "present" ? "default" : "destructive"}>
                                {markedStatus}
                              </Badge> : currentStatus ? <Badge variant="outline">{currentStatus}</Badge> : <span className="text-muted-foreground">Not Marked</span>}
                          </TableCell>
                          <TableCell>
                            {!alreadyMarked && <div className="flex gap-2">
                                <Button size="sm" variant={currentStatus === "present" ? "default" : "outline"} onClick={() => handleStatusChange(student.id, "present")}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant={currentStatus === "absent" ? "destructive" : "outline"} onClick={() => handleStatusChange(student.id, "absent")}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant={currentStatus === "on-leave" ? "secondary" : "outline"} onClick={() => handleStatusChange(student.id, "on-leave")}>
                                  <Clock className="w-4 h-4" />
                                </Button>
                              </div>}
                          </TableCell>
                        </TableRow>;
                    })}
                  </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Short Leave Tab */}
          <TabsContent value="shortleave" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Short Leave Requests</CardTitle>
                  <Button onClick={() => setShortLeaveOpen(true)} className="gap-2">
                    <ClipboardList className="w-4 h-4" />New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shortLeaves.map(leave => <TableRow key={leave.id}>
                        <TableCell>{leave.studentName}</TableCell>
                        <TableCell>{leave.class}-{leave.section}</TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                        <TableCell>{leave.date}</TableCell>
                        <TableCell>
                          <Badge variant={leave.status === "approved" ? "default" : leave.status === "rejected" ? "destructive" : "secondary"}>
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {leave.status === "pending" && <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApproveReject(leave.id, "approved")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleApproveReject(leave.id, "rejected")}>
                                Reject
                              </Button>
                            </div>}
                          {leave.status !== "pending" && leave.approvedBy && <span className="text-sm text-muted-foreground">By {leave.approvedBy}</span>}
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Daily Attendance Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Select Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select value={filterClass} onValueChange={setFilterClass}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={printAttendanceReport} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print Daily Report
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Weekly/Monthly Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Report Type</Label>
                    <Select value={reportType} onValueChange={v => setReportType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select value={reportClass} onValueChange={setReportClass}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={printWeeklyMonthlyReport} className="gap-2">
                  <Printer className="w-4 h-4" />
                  Print {reportType === "weekly" ? "Weekly" : "Monthly"} Report
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Report */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Weekly Attendance Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Present</TableHead>
                        <TableHead>Absent</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getWeeklyReport().map(day => <TableRow key={day.date}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell className="text-success">{day.present}</TableCell>
                          <TableCell className="text-destructive">{day.absent}</TableCell>
                          <TableCell className="font-semibold">{day.rate}%</TableCell>
                        </TableRow>)}
                  </TableBody>
                </Table>
                </div>
                </CardContent>
              </Card>

              {/* Most Absent Students */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Most Absent Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Absent Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getMostAbsentStudents().map(item => <TableRow key={item.student?.id}>
                          <TableCell>{item.student?.name}</TableCell>
                          <TableCell>{item.student?.rollNumber}</TableCell>
                          <TableCell className="font-semibold text-destructive">{item.count}</TableCell>
                        </TableRow>)}
                  </TableBody>
                </Table>
                </div>
                </CardContent>
              </Card>

              {/* Short Leave Summary */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Short Leave Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-muted-foreground">Total Requests</span>
                      <span className="text-2xl font-bold">{shortLeaves.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-muted-foreground">Approved</span>
                      <span className="text-2xl font-bold text-success">
                        {shortLeaves.filter(l => l.status === "approved").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-muted-foreground">Rejected</span>
                      <span className="text-2xl font-bold text-destructive">
                        {shortLeaves.filter(l => l.status === "rejected").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="text-2xl font-bold text-warning">
                        {shortLeaves.filter(l => l.status === "pending").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Short Leave Request Dialog */}
        <Dialog open={shortLeaveOpen} onOpenChange={setShortLeaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Short Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={shortLeaveFormData.studentId} onValueChange={v => setShortLeaveFormData({
                ...shortLeaveFormData,
                studentId: v
              })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.status === "active").map(student => <SelectItem key={student.id} value={student.id}>
                        {student.rollNumber} - {student.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={shortLeaveFormData.date} onChange={e => setShortLeaveFormData({
                ...shortLeaveFormData,
                date: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={shortLeaveFormData.reason} onChange={e => setShortLeaveFormData({
                ...shortLeaveFormData,
                reason: e.target.value
              })} placeholder="Enter reason for short leave" rows={4} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShortLeaveOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitShortLeave}>Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Attendance;
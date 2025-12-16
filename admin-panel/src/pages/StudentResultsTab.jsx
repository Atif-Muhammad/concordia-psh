import { useState, useEffect } from "react"; // Added imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Added Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUser, Printer, Search } from "lucide-react"; // Added Search icon
import { useQuery } from "@tanstack/react-query"; // Added useQuery
import { getStudents, searchStudents } from "../../config/apis"; // Added APIs

export const StudentResultsTab = ({
    programs,
    students, // We might not need this anymore, but keeping for props stability
    exams,
    studentResultProgram,
    setStudentResultProgram,
    studentResultClass,
    setStudentResultClass,
    studentResultSection,
    setStudentResultSection,
    studentResultStudent,
    setStudentResultStudent,
    studentResultExam,
    setStudentResultExam,
    studentResultData,
    studentResultMutation,
    printStudentResult,
    getFullName,
}) => {
    // Local State for Search
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get available classes based on selected program
    const availableClasses = programs?.find(p => p.id === Number(studentResultProgram))?.classes || [];

    // Get available sections based on selected class
    const availableSections = availableClasses?.find(c => c.id === Number(studentResultClass))?.sections || [];

    // --- Data Fetching ---

    // 1. Search Query
    const { data: searchResults = [] } = useQuery({
        queryKey: ["searchStudents", debouncedSearch],
        queryFn: () => searchStudents(debouncedSearch),
        enabled: !!debouncedSearch && debouncedSearch.length > 2, // Search only if > 2 chars
    });

    // 2. Class Students Query (Fix for "Selected Class isn't loading its students")
    const { data: classStudents = [] } = useQuery({
        queryKey: ["classStudentsResultTab", studentResultProgram, studentResultClass, studentResultSection],
        queryFn: () => getStudents(
            studentResultProgram || "",
            studentResultClass || "",
            (studentResultSection && studentResultSection !== "*") ? studentResultSection : "",
            "" // No text search here
        ),
        enabled: !!studentResultClass && !debouncedSearch, // Only fetch if class selected AND not searching
    });

    // Determine which list to show
    // If searching, show searchResults. Else if class selected, show classStudents. 
    const displayStudents = debouncedSearch ? searchResults : classStudents;


    // Get available exams for selected student (only exams for their class)
    const availableExams = studentResultStudent
        ? exams?.filter(exam => {
            // Find student details from our fetched list
            const student = displayStudents?.find(s => s.id === Number(studentResultStudent));
            // Or if not in list (e.g. cleared search), try to find in existing context if possible, 
            // but relying on fetched list is safer.
            return student && exam.classId === student.classId;
        }) || []
        : [];

    // Format date for display
    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileUser className="w-5 h-5" />
                    Student Results
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Search Bar */}
                <div className="flex items-center space-x-2 bg-secondary/20 p-2 rounded-md border border-border">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search student by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Program Filter */}
                    <div className="space-y-2">
                        <Label>Select Program *</Label>
                        <Select value={studentResultProgram} onValueChange={(v) => {
                            setStudentResultProgram(v);
                            setSearchQuery(""); // Clear search when filtering manually
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                                {programs?.map((program) => (
                                    <SelectItem key={program.id} value={program.id.toString()}>
                                        {program.name} — {program.department?.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Class Filter */}
                    <div className="space-y-2">
                        <Label>Select Class *</Label>
                        <Select
                            value={studentResultClass}
                            onValueChange={setStudentResultClass}
                            disabled={!studentResultProgram}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={studentResultProgram ? "Select class" : "First select program"} />
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

                    {/* Section Filter (Optional) */}
                    <div className="space-y-2">
                        <Label>Select Section (Optional)</Label>
                        <Select
                            value={studentResultSection}
                            onValueChange={setStudentResultSection}
                            disabled={!studentResultClass}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={studentResultClass ? "All sections" : "First select class"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="*">All Sections</SelectItem>
                                {availableSections.map((section) => (
                                    <SelectItem key={section.id} value={section.id.toString()}>
                                        {section.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Student Filter */}
                    <div className="space-y-2">
                        <Label>Select Student *</Label>
                        <Select
                            value={studentResultStudent}
                            onValueChange={(v) => {
                                setStudentResultStudent(v);
                                // If student selected via search, we might want to auto-set program/class context if API returned it, 
                                // but for now let's just select the student.
                            }}
                            disabled={displayStudents.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    debouncedSearch
                                        ? "Select from search results"
                                        : (studentResultClass ? "Select student" : "Select class or search")
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {displayStudents.length > 0 ? (
                                    displayStudents.map((student) => (
                                        <SelectItem key={student.id} value={student.id.toString()}>
                                            {getFullName(student)} ({student.rollNumber})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem disabled>No students found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exam Filter */}
                    <div className="space-y-2">
                        <Label>Select Exam *</Label>
                        <Select
                            value={studentResultExam}
                            onValueChange={setStudentResultExam}
                            disabled={!studentResultStudent}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={studentResultStudent ? "Select exam" : "First select student"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableExams.map((exam) => (
                                    <SelectItem key={exam.id} value={exam.id.toString()}>
                                        {exam.examName} - {exam.session} ({formatDateTime(exam.startDate)} - {formatDateTime(exam.endDate)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Generate Button */}
                    <div className="space-y-2 flex items-end">
                        <Button
                            onClick={() => studentResultMutation.mutate()}
                            disabled={!studentResultStudent || !studentResultExam || studentResultMutation.isPending}
                            className="w-full"
                        >
                            {studentResultMutation.isPending ? "Loading..." : "Generate Result Card"}
                        </Button>
                    </div>
                </div>

                {/* Result Display */}
                {studentResultData && (
                    <div className="space-y-4 mt-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Result Card</h3>
                            <Button onClick={printStudentResult} variant="outline" className="gap-2">
                                <Printer className="w-4 h-4" />
                                Print Result Card
                            </Button>
                        </div>

                        {/* Student Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Student Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{getFullName(studentResultData.student)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Roll Number</p>
                                    <p className="font-medium">{studentResultData.student.rollNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Class</p>
                                    <p className="font-medium">{studentResultData.exam.class.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Program</p>
                                    <p className="font-medium">{studentResultData.exam.program.name}</p>
                                </div>
                                {studentResultData.student.section && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Section</p>
                                        <p className="font-medium">{studentResultData.student.section.name}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Exam Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Exam Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Exam Name</p>
                                    <p className="font-medium">{studentResultData.exam.examName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Session</p>
                                    <p className="font-medium">{studentResultData.exam.session}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-medium">{studentResultData.exam.type || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subject-wise Marks */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Subject-wise Marks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Total Marks</TableHead>
                                            <TableHead>Obtained Marks</TableHead>
                                            <TableHead>Percentage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentResultData.marks.map((mark, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{mark.subject}</TableCell>
                                                <TableCell>{mark.totalMarks}</TableCell>
                                                <TableCell>{mark.obtainedMarks}</TableCell>
                                                <TableCell>
                                                    {((mark.obtainedMarks / mark.totalMarks) * 100).toFixed(2)}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Overall Result */}
                        {studentResultData.result && (
                            <Card className="bg-primary/5">
                                <CardHeader>
                                    <CardTitle>Overall Result</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Marks</p>
                                        <p className="text-2xl font-bold">{studentResultData.result.totalMarks}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Obtained Marks</p>
                                        <p className="text-2xl font-bold text-primary">{studentResultData.result.obtainedMarks}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Percentage</p>
                                        <p className="text-2xl font-bold">{studentResultData.result.percentage.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Grade</p>
                                        <p className="text-2xl font-bold">{studentResultData.result.grade}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">GPA</p>
                                        <p className="text-2xl font-bold">{studentResultData.result.gpa.toFixed(2)}</p>
                                    </div>
                                    {studentResultData.position && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Position</p>
                                            <p className="text-2xl font-bold">{studentResultData.position}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!studentResultData && (
                    <div className="text-center py-16">
                        <FileUser className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No Result Selected</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Select a student and exam to view their result card
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

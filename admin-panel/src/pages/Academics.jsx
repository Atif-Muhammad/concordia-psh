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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  BookOpen,
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  FileText,
  Printer,
} from "lucide-react";
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
import { hasModuleAccess, parseDurationToYears } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  createAssignment,
  createClass,
  createProgram,
  createSection,
  createSubject,
  createTeacherClassMappings,
  createTeacherSubjectMapping,
  createTimetable,
  deleteAssignment,
  deleteClass,
  deleteProgram,
  deleteSection,
  deleteSubject,
  deleteTeacherClassMappings,
  deleteTeacherSubjectMapping,
  deleteTimetable,
  getAssignments,
  getClasses,
  getPrograms,
  getDepartmentNames,
  getSections,
  getSubjects,
  getTeacherClassMappings,
  getTeacherNames,
  getTeacherSubjectMappings,
  getTimetables,
  updateAssignment,
  updateClass,
  updateProgram,
  updateSection,
  updateSubject,
  updateTeacherClassMappings,
  updateTeacherSubjectMapping,
  updateTimetable,
} from "../../config/apis";

const Academics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [sectionFilterProgram, setSectionFilterProgram] = useState("all");
  const [sectionFilterClass, setSectionFilterClass] = useState("all");
  const currentUser = queryClient.getQueryData(["currentUser"]);
  // Queries
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    retry: 1,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartmentNames,
    retry: 1,
  });
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
    retry: 1,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections,
    retry: 1,
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
    retry: 1,
  });
  const { data: teacherMappings = [] } = useQuery({
    queryKey: ["teacherSubjectMappings"],
    queryFn: getTeacherSubjectMappings,
    retry: 1,
  });
  const { data: teacherClassMappings = [] } = useQuery({
    queryKey: ["teacherClassMappings"],
    queryFn: getTeacherClassMappings,
    retry: 1,
  });
  const { data: timetables = [] } = useQuery({
    queryKey: ["timetables"],
    queryFn: getTimetables,
    retry: 1,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: getAssignments,
    retry: 1,
  });
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeacherNames,
    retry: 1,
  });

  // Mutations
  const programMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateProgram(id, data) : createProgram(data)),
    onSuccess: () => queryClient.invalidateQueries(["programs"]),
  });
  const classMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateClass(id, data) : createClass(data)),
    onSuccess: () => queryClient.invalidateQueries(["classes"]),
  });
  const sectionMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateSection(id, data) : createSection(data)),
    onSuccess: () => queryClient.invalidateQueries(["sections"]),
  });
  const subjectMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateSubject(id, data) : createSubject(data)),
    onSuccess: () => queryClient.invalidateQueries(["subjects"]),
  });
  const teacherSubjectMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? updateTeacherSubjectMapping(id, data) : createTeacherSubjectMapping(data),
    onSuccess: () => queryClient.invalidateQueries(["teacherSubjectMappings"]),
  });
  const teacherClassMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? updateTeacherClassMappings(id, data) : createTeacherClassMappings(data),
    onSuccess: () => queryClient.invalidateQueries(["teacherClassMappings"]),
  });
  const timetableMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateTimetable(id, data) : createTimetable(data)),
    onSuccess: () => queryClient.invalidateQueries(["timetables"]),
  });
  const assignmentMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateAssignment(id, data) : createAssignment(data)),
    onSuccess: () => queryClient.invalidateQueries(["assignments"]),
  });

  const deleteMutations = {
    program: useMutation({ mutationFn: deleteProgram, onSuccess: () => queryClient.invalidateQueries(["programs"]) }),
    class: useMutation({ mutationFn: deleteClass, onSuccess: () => queryClient.invalidateQueries(["classes"]) }),
    section: useMutation({ mutationFn: deleteSection, onSuccess: () => queryClient.invalidateQueries(["sections"]) }),
    subject: useMutation({ mutationFn: deleteSubject, onSuccess: () => queryClient.invalidateQueries(["subjects"]) }),
    mapping: useMutation({ mutationFn: deleteTeacherSubjectMapping, onSuccess: () => queryClient.invalidateQueries(["teacherSubjectMappings"]) }),
    classMapping: useMutation({ mutationFn: deleteTeacherClassMappings, onSuccess: () => queryClient.invalidateQueries(["teacherClassMappings"]) }),
    timetable: useMutation({ mutationFn: deleteTimetable, onSuccess: () => queryClient.invalidateQueries(["timetables"]) }),
    assignment: useMutation({ mutationFn: deleteAssignment, onSuccess: () => queryClient.invalidateQueries(["assignments"]) }),
  };

  // Local state
  const [dialog, setDialog] = useState({ type: "", open: false });
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [subjectFilterProgram, setSubjectFilterProgram] = useState("all");
  const [subjectFilterClass, setSubjectFilterClass] = useState("all");
  const [timetableFilterClass, setTimetableFilterClass] = useState("all");

  // Form states
  const [programForm, setProgramForm] = useState({ name: "", description: "", level: "INTERMEDIATE", departmentId: "", duration: "", customDuration: "" });
  const [classForm, setClassForm] = useState({ name: "", programId: "", year: "", semester: "", isSemester: false });
  const [sectionForm, setSectionForm] = useState({ sectionLetter: "A", shift: "Morning", classId: "", capacity: "", room: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", classId: "", creditHours: "", description: "" });
  const [mappingForm, setMappingForm] = useState({ teacherId: "", subjectId: "" });
  const [classMappingForm, setClassMappingForm] = useState({ teacherId: "", classId: "", sectionId: "" });
  const [timetableForm, setTimetableForm] = useState({
    teacherId: "",
    subjectId: "",
    sectionId: "",
    classId: "",
    dayOfWeek: "Monday",
    startTime: "",
    endTime: "",
    room: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", dueDate: "", teacherId: "", subjectId: "", sectionId: "" });

  // Helper: Get valid teachers for selected subject + class
  const getValidTeachers = () => {
    const classId = Number(timetableForm.classId);
    const subjectId = Number(timetableForm.subjectId);

    if (!classId || !subjectId) return [];

    const subjectTeachers = teacherMappings
      .filter(m => m.subjectId === subjectId)
      .map(m => m.teacherId);

    const classTeachers = teacherClassMappings?.filter(m => m.classId === classId)
      .map(m => m.teacherId);

    const validTeacherIds = subjectTeachers.filter(id => classTeachers.includes(id));
    return teachers.filter(t => validTeacherIds.includes(t.id));
  };

  const isTimetableFormValid = () => {
    const validTeachers = getValidTeachers();
    const selectedTeacher = timetableForm.teacherId ? teachers.find(t => t.id === Number(timetableForm.teacherId)) : null;
    return (
      timetableForm.classId &&
      timetableForm.subjectId &&
      timetableForm.dayOfWeek &&
      timetableForm.startTime &&
      timetableForm.endTime &&
      validTeachers.length > 0 &&
      selectedTeacher &&
      validTeachers.includes(selectedTeacher)
    );
  };

  const programHasAutoClasses = (programId) => {
    const prog = programs.find((p) => p.id === programId);
    if (!prog) return false;
    let expectedCount = 0;
    switch (prog.level) {
      case "INTERMEDIATE": expectedCount = 2; break;
      case "UNDERGRADUATE": expectedCount = 8; break;
      case "DIPLOMA": expectedCount = parseDurationToYears(prog.duration); break;
      case "COACHING": case "SHORT_COURSE": expectedCount = 1; break;
      default: expectedCount = 1;
    }
    const existing = classes.filter((c) => c.programId === programId).length;
    return existing >= expectedCount;
  };

  const resetForm = (type) => {
    const defaults = {
      program: { name: "", description: "", level: "INTERMEDIATE", departmentId: "", duration: "2 years", customDuration: "" },
      class: { name: "", programId: "", year: "", semester: "", isSemester: false },
      section: { sectionLetter: "A", shift: "Morning", classId: "", capacity: "", room: "" },
      subject: { name: "", code: "", classId: "", creditHours: "", description: "" },
      mapping: { teacherId: "", subjectId: "" },
      classMapping: { teacherId: "", classId: "", sectionId: "" },
      timetable: { teacherId: "", subjectId: "", sectionId: "", dayOfWeek: "Monday", startTime: "", endTime: "", room: "" },
      assignment: { title: "", description: "", dueDate: "", teacherId: "", subjectId: "", sectionId: "" },
    };
    return defaults[type];
  };

  const handleSubmit = (type) => {
    const forms = {
      program: { form: programForm, setForm: setProgramForm, mutation: programMutation },
      class: { form: classForm, setForm: setClassForm, mutation: classMutation },
      section: { form: sectionForm, setForm: setSectionForm, mutation: sectionMutation },
      subject: { form: subjectForm, setForm: setSubjectForm, mutation: subjectMutation },
      mapping: { form: mappingForm, setForm: setMappingForm, mutation: teacherSubjectMutation },
      classMapping: { form: classMappingForm, setForm: setClassMappingForm, mutation: teacherClassMutation },
      timetable: { form: timetableForm, setForm: setTimetableForm, mutation: timetableMutation },
      assignment: { form: assignmentForm, setForm: setAssignmentForm, mutation: assignmentMutation },
    };
    const config = forms[type];
    if (!config) return;

    let data = { ...config.form };

    if (type === "program") {
      if (!programForm.name || !programForm.duration || !programForm.departmentId) {
        toast({ title: "Name, duration, and department are required", variant: "destructive" });
        return;
      }
      const finalDuration = programForm.duration === "custom" ? programForm.customDuration || "custom" : programForm.duration;
      data = {
        name: programForm.name,
        description: programForm.description,
        level: programForm.level,
        departmentId: Number(programForm.departmentId),
        duration: finalDuration,
        hasSections: parseDurationToYears(finalDuration) >= 2,
      };
    }

    if (type === "class") {
      data = {
        name: classForm.name,
        programId: Number(classForm.programId),
        year: classForm.year ? Number(classForm.year) : null,
        semester: classForm.semester ? Number(classForm.semester) : null,
        isSemester: Boolean(classForm.isSemester),
      };
    }

    if (type === "section") {
      const name = `${sectionForm.sectionLetter} ${sectionForm.shift}`.trim();
      if (!name || !sectionForm.classId) {
        toast({ title: "Section letter, shift, and class are required", variant: "destructive" });
        return;
      }
      data = {
        name,
        classId: Number(sectionForm.classId),
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
        room: sectionForm.room || null,
      };
    }

    if (type === "subject") {
      const cls = classes.find(c => c.id === Number(subjectForm.classId));
      const prog = programs.find(p => p.id === cls?.programId);
      const isBS = prog?.level === "UNDERGRADUATE";
      if (!subjectForm.name || !subjectForm.classId) {
        toast({ title: "Name and class are required", variant: "destructive" });
        return;
      }
      if (isBS && (!subjectForm.code || !subjectForm.creditHours)) {
        toast({ title: "Code and credit hours are required for BS programs", variant: "destructive" });
        return;
      }
      data = {
        name: subjectForm.name,
        code: isBS ? subjectForm.code : null,
        classId: Number(subjectForm.classId),
        creditHours: isBS ? Number(subjectForm.creditHours) : null,
        description: subjectForm.description || null,
      };
    }

    if (type === "classMapping") {
      if (!classMappingForm.teacherId || !classMappingForm.classId) {
        toast({ title: "Teacher and class are required", variant: "destructive" });
        return;
      }

      const exists = teacherClassMappings?.some(
        (m) =>
          m.id !== editing?.id &&
          m.teacherId === Number(classMappingForm.teacherId) &&
          m.classId === Number(classMappingForm.classId) &&
          (classMappingForm.sectionId
            ? m.sectionId === Number(classMappingForm.sectionId)
            : !m.sectionId)
      );

      if (exists) {
        toast({ title: "This teacher is already assigned to this class/section", variant: "destructive" });
        return;
      }

      data = {
        teacherId: Number(classMappingForm.teacherId),
        classId: Number(classMappingForm.classId),
        sectionId: classMappingForm.sectionId ? Number(classMappingForm.sectionId) : null,
      };
    }

    if (type === "timetable") {
      if (!isTimetableFormValid()) {
        toast({ title: "Invalid timetable: Teacher must be mapped to both subject and class", variant: "destructive" });
        return;
      }
      data = {
        teacherId: Number(timetableForm.teacherId),
        subjectId: Number(timetableForm.subjectId),
        sectionId: timetableForm.sectionId ? Number(timetableForm.sectionId) : null,
        classId: Number(timetableForm.classId),
        dayOfWeek: timetableForm.dayOfWeek,
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
        room: timetableForm.room || null,
      };
    }

    config.mutation.mutate(
      { id: editing?.id, data },
      {
        onSuccess: () => {
          toast({ title: `${type} ${editing ? "updated" : "created"} successfully` });
          setDialog({ type: "", open: false });
          setEditing(null);
          config.setForm(resetForm(type));
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutations[deleteTarget.type].mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: `${deleteTarget.type} deleted successfully` });
        setDeleteDialog(false);
        setDeleteTarget(null);
      },
    });
  };

  const openEdit = (type, item) => {
    if (type === "program") {
      setProgramForm({
        name: item.name,
        description: item.description || "",
        level: item.level,
        departmentId: item.departmentId?.toString() || "",
        duration: item.duration,
      });
    }
    if (type === "class") {
      setClassForm({
        name: item.name,
        programId: item.programId.toString(),
        year: item.year?.toString() || "",
        semester: item.semester?.toString() || "",
        isSemester: Boolean(item.isSemester)
      });
    }
    if (type === "section") {
      const [sectionLetter = "A", shift = "Morning"] = item.name.split(" ");
      setSectionForm({
        sectionLetter,
        shift,
        classId: item.classId.toString(),
        capacity: item.capacity?.toString() || "",
        room: item.room || "",
      });
    }
    if (type === "subject") {
      const cls = classes.find(c => c.id === item.classId);
      const prog = programs.find(p => p.id === cls?.programId);
      const isBS = prog?.level === "UNDERGRADUATE";
      setSubjectForm({
        name: item.name,
        code: isBS ? (item.code || "") : "",
        classId: item.classId.toString(),
        creditHours: isBS ? (item.creditHours?.toString() || "") : "",
        description: item.description || "",
      });
    }
    if (type === "mapping") {
      setMappingForm({
        teacherId: item.teacherId.toString(),
        subjectId: item.subjectId.toString(),
      });
    }
    if (type === "classMapping") {
      setClassMappingForm({
        teacherId: item.teacherId.toString(),
        classId: item.classId.toString(),
        sectionId: item.sectionId?.toString() ?? "",
      });
    }
    if (type === "timetable") {
      setTimetableForm({
        teacherId: item.teacherId?.toString() || "",
        subjectId: item.subjectId.toString(),
        sectionId: item.sectionId?.toString() || "",
        classId: item.classId.toString(),
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room || "",
      });
    }
    if (type === "assignment") {
      setAssignmentForm({
        title: item.title,
        description: item.description || "",
        dueDate: item.dueDate || "",
        teacherId: item.teacherId.toString(),
        subjectId: item.subjectId.toString(),
        sectionId: item.sectionId.toString(),
      });
    }
    setEditing(item);
    setDialog({ type, open: true });
  };

  const openDialog = (type) => {
    setEditing(null);
    const setters = {
      program: setProgramForm,
      class: setClassForm,
      section: setSectionForm,
      subject: setSubjectForm,
      mapping: setMappingForm,
      classMapping: setClassMappingForm,
      timetable: setTimetableForm,
      assignment: setAssignmentForm,
    };
    setters[type](resetForm(type));
    setDialog({ type, open: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Academic Management</h2>
          <p className="opacity-90">Manage programs, classes, subjects, and timetables</p>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="mapping">T-Subject</TabsTrigger>
            <TabsTrigger value="classMapping">T-Class</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            {/* <TabsTrigger value="assignments">Assignments</TabsTrigger> */}
          </TabsList>

          {/* TIMETABLE TAB - FULLY VALIDATED */}
          <TabsContent value="timetable">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Timetable
                </CardTitle>
                <Dialog
                  open={dialog.type === "timetable" && dialog.open}
                  onOpenChange={(open) => setDialog({ type: "timetable", open })}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={!isTimetableFormValid() && dialog.open}
                      onClick={() => openDialog("timetable")}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Timetable Entry</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CLASS */}
                      <div>
                        <Label>Class *</Label>
                        <Select
                          value={timetableForm.classId}
                          onValueChange={(v) => {
                            setTimetableForm({
                              ...timetableForm,
                              classId: v,
                              sectionId: "",
                              subjectId: "",
                              teacherId: "",
                            });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => {
                              const prog = programs.find(p => p.id === c.programId);
                              return (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name} ({prog?.name})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* SECTION */}
                      <div>
                        <Label>Section (Optional)</Label>
                        <Select
                          value={timetableForm.sectionId || "all"}
                          onValueChange={(v) =>
                            setTimetableForm({
                              ...timetableForm,
                              sectionId: v === "all" ? "" : v,
                            })
                          }
                          disabled={!timetableForm.classId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={timetableForm.classId ? "All Sections" : "Pick class first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sections
                              .filter((s) => s.classId === Number(timetableForm.classId))
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* SUBJECT */}
                      <div>
                        <Label>Subject *</Label>
                        <Select
                          value={timetableForm.subjectId}
                          onValueChange={(v) => {
                            setTimetableForm({ ...timetableForm, subjectId: v, teacherId: "" });
                          }}
                          disabled={!timetableForm.classId}
                        >
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            {subjects
                              .filter((s) => {
                                const cls = classes.find((c) => c.id === s.classId);
                                return cls?.id === Number(timetableForm.classId);
                              })
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* TEACHER - Only valid ones */}
                      <div>
                        <Label>Teacher *</Label>
                        <Select
                          value={timetableForm.teacherId}
                          onValueChange={(v) => setTimetableForm({ ...timetableForm, teacherId: v })}
                          disabled={!timetableForm.classId || !timetableForm.subjectId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !timetableForm.classId || !timetableForm.subjectId
                                ? "Select class & subject first"
                                : getValidTeachers().length === 0
                                  ? "No teacher mapped"
                                  : "Select teacher"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {getValidTeachers().length === 0 ? (
                              <SelectItem value="none" disabled>
                                No teacher assigned to both subject & class
                              </SelectItem>
                            ) : (
                              getValidTeachers().map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* DAY */}
                      <div>
                        <Label>Day</Label>
                        <Select
                          value={timetableForm.dayOfWeek}
                          onValueChange={(v) => setTimetableForm({ ...timetableForm, dayOfWeek: v })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={timetableForm.startTime}
                          onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={timetableForm.endTime}
                          onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Room (Optional)</Label>
                        <Input
                          value={timetableForm.room}
                          onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                          placeholder="e.g. Lab-1"
                        />
                      </div>
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => handleSubmit("timetable")}
                      disabled={!isTimetableFormValid()}
                    >
                      {editing ? "Update" : "Add"} Entry
                    </Button>
                    {!isTimetableFormValid() && (
                      <p className="text-xs text-destructive mt-2">
                        Teacher must be mapped to both subject and class.
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <div className="mb-4">
                  <Label>Filter by Class</Label>
                  <Select value={timetableFilterClass} onValueChange={setTimetableFilterClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TIMETABLE GROUPING & SORTING */}
                {Array.from(
                  timetables.reduce((acc, t) => {
                    const key = t.sectionId ?? "all";
                    if (!acc.has(key)) acc.set(key, []);
                    const entries = acc.get(key);
                    if (entries) entries.push(t);
                    return acc;
                  }, new Map())
                )
                  .filter(([key, entries]) => {
                    if (timetableFilterClass === "all") return true;
                    if (key === "all") {
                      return entries[0].classId == timetableFilterClass;
                    }
                    const section = sections.find(s => s.id === Number(key));
                    return section?.classId == timetableFilterClass;
                  })
                  .map(([key, classTimetable]) => {
                    const isAllSections = key === "all";
                    const section = isAllSections ? null : sections.find(s => s.id === Number(key));
                    const anyEntry = classTimetable[0];
                    const cls = classes.find(c => c.id === anyEntry.classId);
                    const prog = programs.find(p => p.id === cls?.programId);
                    const className = cls?.name ?? "—";
                    const programName = prog?.name ?? "—";
                    const header = isAllSections
                      ? `${className} (${programName})`
                      : `${className} – ${section?.name}`;

                    const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 };
                    const sortedTimetable = [...classTimetable].sort((a, b) => {
                      const dayA = dayOrder[a.dayOfWeek];
                      const dayB = dayOrder[b.dayOfWeek];
                      if (dayA !== dayB) return dayA - dayB;
                      const timeA = new Date(a.createdAt).getTime();
                      const timeB = new Date(b.createdAt).getTime();
                      if (timeA !== timeB) return timeB - timeA;
                      return a.startTime.localeCompare(b.startTime);
                    });

                    return (
                      <Card key={key} className="mb-6">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{header}</CardTitle>
                            <Button size="sm" onClick={() => {
                              const printWindow = window.open("", "_blank");
                              if (!printWindow) return;
                              const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                              const periods = Array.from(new Set(sortedTimetable.map(t => t.startTime))).sort();

                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>Timetable - ${header}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 40px; }
                                      h1 { text-align: center; }
                                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                      th, td { border: 1px solid #000; padding: 10px; text-align: center; }
                                      th { background-color: #f4f4f4; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>${header} Timetable</h1>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Day</th>
                                          ${periods.map(p => `<th>${p}</th>`).join("")}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${days.map(day => `
                                          <tr>
                                            <td><strong>${day}</strong></td>
                                            ${periods.map(p => {
                                const entry = sortedTimetable.find(t => t.dayOfWeek === day && t.startTime === p);
                                const subj = subjects.find(s => s.id === entry?.subjectId);
                                const teach = teachers.find(t => t.id === entry?.teacherId);
                                return entry
                                  ? `<td>${subj?.name}<br/><small>${teach?.name}</small></td>`
                                  : `<td>-</td>`;
                              }).join("")}
                                          </tr>`).join("")}
                                      </tbody>
                                    </table>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.onload = () => printWindow.print();
                            }}>
                              <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Day</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Section</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedTimetable.map((t) => {
                                const subject = subjects.find(s => s.id === t.subjectId);
                                const teacher = teachers.find(te => te.id === t.teacherId);
                                return (
                                  <TableRow key={t.id}>
                                    <TableCell>{t.dayOfWeek}</TableCell>
                                    <TableCell>{t.startTime} - {t.endTime}</TableCell>
                                    <TableCell>{subject?.name || "-"}</TableCell>
                                    <TableCell>{teacher?.name || "-"}</TableCell>
                                    <TableCell>{t.room || "-"}</TableCell>
                                    <TableCell>
                                      {t.sectionId
                                        ? sections.find(s => s.id === t.sectionId)?.name
                                        : <span className="text-muted-foreground">All Sections</span>
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEdit("timetable", t)}>
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            setDeleteTarget({ type: "timetable", id: t.id });
                                            setDeleteDialog(true);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROGRAMS */}
          <TabsContent value="programs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Programs
                </CardTitle>
                <Dialog open={dialog.type === "program" && dialog.open} onOpenChange={(open) => setDialog({ type: "program", open })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("program")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Program</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5">
                      <div>
                        <Label>Program Name *</Label>
                        <Input
                          value={programForm.name}
                          onChange={(e) => {
                            // Removed automatic 4-year duration setting for BS
                            const name = e.target.value;
                            setProgramForm({ ...programForm, name });
                          }}
                          placeholder="Enter full program name"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {programForm.level === "INTERMEDIATE" && "e.g. FSC Pre Medical, FSC Pre Engineering"}
                          {programForm.level === "UNDERGRADUATE" && "e.g. BS Computer Science, BS Nursing"}
                          {programForm.level === "DIPLOMA" && "e.g. Diploma in Radiology"}
                          {programForm.level === "COACHING" && "e.g. 9th Class, FSC Pre Medical Coaching"}
                          {programForm.level === "SHORT_COURSE" && "e.g. Python Programming"}
                        </p>
                      </div>
                      <div>
                        <Label>Department *</Label>
                        <Select value={programForm.departmentId} onValueChange={(v) => setProgramForm({ ...programForm, departmentId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name} {dept.hod ? `(${dept.hod.name})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Level *</Label>
                        <Select
                          value={programForm.level}
                          onValueChange={(level) => {
                            let defaultDuration = "";
                            if (level === "INTERMEDIATE") defaultDuration = "2 years";
                            if (level === "INTERMEDIATE") defaultDuration = "2 years";
                            // Removed default duration for Undergraduate so it respects user choice or stays empty initially
                            else if (level === "UNDERGRADUATE") defaultDuration = "4 years"; // Default to 4, but editable
                            else if (level === "DIPLOMA") defaultDuration = "2 years";
                            else if (level === "COACHING") defaultDuration = "3 months";
                            else if (level === "SHORT_COURSE") defaultDuration = "1 month";
                            setProgramForm({
                              ...programForm,
                              level,
                              duration: defaultDuration,
                              customDuration: "",
                            });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INTERMEDIATE">Intermediate (2 Years)</SelectItem>
                            <SelectItem value="UNDERGRADUATE">Undergraduate</SelectItem>
                            <SelectItem value="DIPLOMA">Diploma (1–2 Years)</SelectItem>
                            <SelectItem value="COACHING">Coaching Classes</SelectItem>
                            <SelectItem value="SHORT_COURSE">Short Course</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duration *</Label>
                        {programForm.level === "INTERMEDIATE" && (
                          <Input value="2 years" disabled className="bg-muted" />
                        )}
                        {programForm.level === "UNDERGRADUATE" && (
                          <Select
                            value={programForm.duration}
                            onValueChange={(v) =>
                              setProgramForm({
                                ...programForm,
                                duration: v,
                              })
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4 years">4 years</SelectItem>
                              <SelectItem value="5 years">5 years</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {programForm.level === "DIPLOMA" && (
                          <Select
                            value={programForm.duration}
                            onValueChange={(v) =>
                              setProgramForm({
                                ...programForm,
                                duration: v,
                                customDuration: v === "custom" ? programForm.customDuration : "",
                              })
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1 year">1 year</SelectItem>
                              <SelectItem value="2 years">2 years</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {programForm.level === "COACHING" && (
                          <Select
                            value={programForm.duration}
                            onValueChange={(v) =>
                              setProgramForm({
                                ...programForm,
                                duration: v,
                                customDuration: v === "custom" ? programForm.customDuration : "",
                              })
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1 month">1 month</SelectItem>
                              <SelectItem value="2 months">2 months</SelectItem>
                              <SelectItem value="3 months">3 months</SelectItem>
                              <SelectItem value="6 months">6 months</SelectItem>
                              <SelectItem value="1 year">1 year</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {programForm.level === "SHORT_COURSE" && (
                          <Select
                            value={programForm.duration}
                            onValueChange={(v) =>
                              setProgramForm({
                                ...programForm,
                                duration: v,
                                customDuration: v === "custom" ? programForm.customDuration : "",
                              })
                            }
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1 week">1 week</SelectItem>
                              <SelectItem value="2 weeks">2 weeks</SelectItem>
                              <SelectItem value="1 month">1 month</SelectItem>
                              <SelectItem value="2 months">2 months</SelectItem>
                              <SelectItem value="3 months">3 months</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {programForm.duration === "custom" && (
                          <Input
                            className="mt-2"
                            placeholder="e.g. 6 weeks, 18 months"
                            value={programForm.customDuration || ""}
                            onChange={(e) => setProgramForm({ ...programForm, customDuration: e.target.value })}
                          />
                        )}
                      </div>
                      <div>
                        <Label>Description (optional)</Label>
                        <Input
                          value={programForm.description}
                          onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                          placeholder="Brief description"
                        />
                      </div>
                      <Button
                        onClick={() => handleSubmit("program")}
                        className="w-full"
                        disabled={!programForm.name || !programForm.departmentId || !programForm.duration}
                      >
                        {editing ? "Update" : "Add"} Program
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((p) => {
                      const dept = departments.find((d) => d.id === p.departmentId);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{dept?.name ?? "—"}</TableCell>
                          <TableCell>
                            {p.level === "INTERMEDIATE" && "Intermediate"}
                            {p.level === "UNDERGRADUATE" && "BS (4 Years)"}
                            {p.level === "DIPLOMA" && "Diploma"}
                            {p.level === "COACHING" && "Coaching"}
                            {p.level === "SHORT_COURSE" && "Short Course"}
                          </TableCell>
                          <TableCell>{p.duration}</TableCell>
                          <TableCell>{p.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("program", p)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ type: "program", id: p.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLASSES */}
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Classes / Semesters
                  </CardTitle>
                  <Dialog
                    open={dialog.type === "class" && dialog.open}
                    onOpenChange={(open) => setDialog({ type: "class", open })}
                  >
                    <DialogTrigger asChild>
                      <Button
                        disabled={classForm.programId && programHasAutoClasses(Number(classForm.programId))}
                        onClick={() => openDialog("class")}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editing ? "Edit" : "Add"} Class / Semester</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Program</Label>
                          <Select
                            value={classForm.programId}
                            onValueChange={(v) => {
                              const prog = programs.find((p) => p.id === Number(v));
                              const isBS = prog?.level === "UNDERGRADUATE";
                              const isDiploma = prog?.level === "DIPLOMA";
                              const isIntermediate = prog?.level === "INTERMEDIATE";
                              setClassForm({
                                ...classForm,
                                programId: v,
                                year: isIntermediate ? "11" : isDiploma ? "1" : "",
                                semester: isBS ? "1" : "",
                                name: "",
                                isSemester: isBS,
                              });
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                            <SelectContent>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {classForm.programId && (
                          <>
                            {programs.find((p) => p.id === Number(classForm.programId))?.level === "INTERMEDIATE" && (
                              <div>
                                <Label>Year</Label>
                                <Select
                                  value={classForm.year}
                                  onValueChange={(v) =>
                                    setClassForm({
                                      ...classForm,
                                      year: v,
                                      name: v === "11" ? "11th" : "12th",
                                    })
                                  }
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="11">11th</SelectItem>
                                    <SelectItem value="12">12th</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {programs.find((p) => p.id === Number(classForm.programId))?.level === "UNDERGRADUATE" && (
                              <div>
                                <Label>Semester</Label>
                                <Select
                                  value={classForm.semester}
                                  onValueChange={(v) =>
                                    setClassForm({
                                      ...classForm,
                                      semester: v,
                                      name: `Semester ${v}`,
                                      isSemester: true,
                                    })
                                  }
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                      <SelectItem key={s} value={s.toString()}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {programs.find((p) => p.id === Number(classForm.programId))?.level === "DIPLOMA" && (
                              <div>
                                <Label>Year</Label>
                                <Select
                                  value={classForm.year}
                                  onValueChange={(v) =>
                                    setClassForm({
                                      ...classForm,
                                      year: v,
                                      name: `Year ${v}`,
                                    })
                                  }
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Year 1</SelectItem>
                                    <SelectItem value="2">Year 2</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {(programs.find((p) => p.id === Number(classForm.programId))?.level === "COACHING" ||
                              programs.find((p) => p.id === Number(classForm.programId))?.level === "SHORT_COURSE") && (
                                <div>
                                  <Label>Class Name</Label>
                                  <Input
                                    value={classForm.name}
                                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                                    placeholder="e.g. Coaching, Short Course"
                                  />
                                </div>
                              )}
                          </>
                        )}
                        <div>
                          <Label>Name (Auto-generated)</Label>
                          <Input value={classForm.name} disabled className="bg-muted" />
                        </div>
                        <Button
                          onClick={() => handleSubmit("class")}
                          className="w-full"
                          disabled={!classForm.programId || !classForm.name}
                        >
                          {editing ? "Update" : "Add"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Level</Label>
                    <Select
                      value={filterLevel}
                      onValueChange={(v) => {
                        setFilterLevel(v);
                        setFilterProgram("all");
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="UNDERGRADUATE">Undergraduate (BS)</SelectItem>
                        <SelectItem value="DIPLOMA">Diploma</SelectItem>
                        <SelectItem value="COACHING">Coaching</SelectItem>
                        <SelectItem value="SHORT_COURSE">Short Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Program</Label>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs
                          .filter((p) => filterLevel === "all" || p.level === filterLevel)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes
                      .filter((c) => {
                        if (filterProgram !== "all" && c.programId !== Number(filterProgram)) return false;
                        const prog = programs.find((p) => p.id === c.programId);
                        if (filterLevel !== "all" && prog?.level !== filterLevel) return false;
                        return true;
                      })
                      .map((c) => {
                        const prog = programs.find((p) => p.id === c.programId);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell>{prog?.name}</TableCell>
                            <TableCell>
                              {c.isSemester ? "Semester" : prog?.level === "INTERMEDIATE" || prog?.level === "DIPLOMA"
                                ? "Year"
                                : "Single"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit("class", c)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: "class", id: c.id });
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTIONS */}
          <TabsContent value="sections">
            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Program</Label>
                    <Select
                      value={sectionFilterProgram}
                      onValueChange={(v) => {
                        setSectionFilterProgram(v);
                        setSectionFilterClass("all");
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs
                          .filter((p) => p.hasSections)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Class</Label>
                    <Select value={sectionFilterClass} onValueChange={setSectionFilterClass}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes
                          .filter((c) => {
                            const prog = programs.find((p) => p.id === c.programId);
                            return (
                              sectionFilterProgram === "all" ||
                              c.programId === Number(sectionFilterProgram)
                            ) && prog?.hasSections;
                          })
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mb-4">
                  <Dialog
                    open={dialog.type === "section" && dialog.open}
                    onOpenChange={(open) => setDialog({ type: "section", open })}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog("section")}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Section
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editing ? "Edit" : "Add"} Section</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        {/* CLASS */}
                        <div>
                          <Label>Class *</Label>
                          <Select
                            value={sectionForm.classId}
                            onValueChange={(v) => setSectionForm({ ...sectionForm, classId: v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                              {classes
                                .filter((c) => {
                                  const prog = programs.find((p) => p.id === c.programId);
                                  return prog?.hasSections === true;
                                })
                                .map((c) => (
                                  <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.name} ({programs.find(p => p.id === c.programId)?.name})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* SECTION LETTER */}
                        <div>
                          <Label>Section *</Label>
                          <Select
                            value={sectionForm.sectionLetter}
                            onValueChange={(v) => setSectionForm({ ...sectionForm, sectionLetter: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((letter) => (
                                <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* SHIFT */}
                        <div>
                          <Label>Shift *</Label>
                          <Select
                            value={sectionForm.shift}
                            onValueChange={(v) => setSectionForm({ ...sectionForm, shift: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Morning">Morning</SelectItem>
                              <SelectItem value="Evening">Evening</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* PREVIEW NAME */}
                        <div>
                          <Label>Section Name (Auto)</Label>
                          <Input
                            value={`${sectionForm.sectionLetter} ${sectionForm.shift}`}
                            disabled
                            className="bg-muted"
                          />
                        </div>

                        {/* CAPACITY */}
                        <div>
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={sectionForm.capacity}
                            onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                            placeholder="e.g. 40"
                          />
                        </div>

                        {/* ROOM */}
                        <div>
                          <Label>Room</Label>
                          <Input
                            value={sectionForm.room}
                            onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                            placeholder="e.g. Room 101"
                          />
                        </div>

                        {/* SUBMIT */}
                        <Button
                          onClick={() => handleSubmit("section")}
                          className="w-full"
                          disabled={!sectionForm.classId || !sectionForm.sectionLetter || !sectionForm.shift}
                        >
                          {editing ? "Update" : "Add"} Section
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections
                      .filter((s) => {
                        const cls = classes.find((c) => c.id === s.classId);
                        if (!cls) return false;
                        if (sectionFilterClass !== "all" && s.classId !== Number(sectionFilterClass))
                          return false;
                        const prog = programs.find((p) => p.id === cls.programId);
                        return prog?.hasSections === true;
                      })
                      .map((s) => {
                        const cls = classes.find((c) => c.id === s.classId);
                        const prog = programs.find((p) => p.id === cls?.programId);
                        return (
                          <TableRow key={s.id}>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{cls?.name}</TableCell>
                            <TableCell>{prog?.name}</TableCell>
                            <TableCell>{s.capacity || "-"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit("section", s)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: "section", id: s.id });
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUBJECTS */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Subjects
                </CardTitle>
                <Dialog open={dialog.type === "subject" && dialog.open} onOpenChange={(open) => setDialog({ type: "subject", open })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("subject")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* CLASS (Required) */}
                      <div>
                        <Label>Class *</Label>
                        <Select
                          value={subjectForm.classId}
                          onValueChange={(v) => {
                            const cls = classes.find(c => c.id === Number(v));
                            const prog = programs.find(p => p.id === cls?.programId);
                            const isBS = prog?.level === "UNDERGRADUATE";
                            setSubjectForm({
                              ...subjectForm,
                              classId: v,
                              creditHours: isBS ? subjectForm.creditHours : "",
                              code: isBS ? subjectForm.code : "",
                            });
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => {
                              const prog = programs.find(p => p.id === c.programId);
                              const dept = departments.find(d => d.id === prog?.departmentId);
                              return (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name} ({prog?.name}) – {dept?.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* NAME */}
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          placeholder="e.g. Physics, Calculus"
                        />
                      </div>

                      {/* CODE — Only for BS */}
                      {(() => {
                        const cls = classes.find(c => c.id === Number(subjectForm.classId));
                        const prog = programs.find(p => p.id === cls?.programId);
                        const isBS = prog?.level === "UNDERGRADUATE";
                        if (!isBS) return null;
                        return (
                          <div>
                            <Label>Code</Label>
                            <Input
                              value={subjectForm.code}
                              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                              placeholder="e.g. PHY-101"
                            />
                          </div>
                        );
                      })()}

                      {/* CREDIT HOURS — Only for BS */}
                      {(() => {
                        const cls = classes.find(c => c.id === Number(subjectForm.classId));
                        const prog = programs.find(p => p.id === cls?.programId);
                        const isBS = prog?.level === "UNDERGRADUATE";
                        if (!isBS) return null;
                        return (
                          <div>
                            <Label>Credit Hours</Label>
                            <Input
                              type="number"
                              value={subjectForm.creditHours}
                              onChange={(e) => setSubjectForm({ ...subjectForm, creditHours: e.target.value })}
                              placeholder="e.g. 3"
                            />
                          </div>
                        );
                      })()}

                      {/* DESCRIPTION */}
                      <div>
                        <Label>Description (Optional)</Label>
                        <Input
                          value={subjectForm.description}
                          onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                          placeholder="Brief subject info"
                        />
                      </div>

                      {/* SUBMIT */}
                      <Button
                        onClick={() => handleSubmit("subject")}
                        className="w-full"
                        disabled={
                          !subjectForm.classId ||
                          !subjectForm.name ||
                          (programs.find(p => p.id === classes.find(c => c.id === Number(subjectForm.classId))?.programId)?.level === "UNDERGRADUATE" &&
                            (!subjectForm.code || !subjectForm.creditHours))
                        }
                      >
                        {editing ? "Update" : "Add"} Subject
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                {/* FILTERS */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label>Filter by Program</Label>
                    <Select
                      value={subjectFilterProgram}
                      onValueChange={(val) => {
                        setSubjectFilterProgram(val);
                        setSubjectFilterClass("all");
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select value={subjectFilterClass} onValueChange={setSubjectFilterClass}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes
                          .filter((c) =>
                            subjectFilterProgram === "all" || c.programId === Number(subjectFilterProgram)
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name} ({c.program?.name})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* TABLE */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Credit Hrs</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects
                      .filter((s) => {
                        const cls = classes.find((c) => c.id === s.classId);
                        if (!cls) return false;
                        if (subjectFilterClass !== "all" && s.classId !== Number(subjectFilterClass)) return false;
                        if (subjectFilterProgram !== "all" && cls.programId !== Number(subjectFilterProgram)) return false;
                        return true;
                      })
                      .map((s) => {
                        const cls = classes.find((c) => c.id === s.classId);
                        const prog = programs.find((p) => p.id === cls?.programId);
                        const dept = departments.find((d) => d.id === prog?.departmentId);
                        const isBS = prog?.level === "UNDERGRADUATE";
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{isBS ? s.code || "—" : "—"}</TableCell>
                            <TableCell>{isBS ? s.creditHours || "—" : "—"}</TableCell>
                            <TableCell>{cls?.name || "—"}</TableCell>
                            <TableCell>{prog?.name || "—"}</TableCell>
                            <TableCell>{dept?.name || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit("subject", s)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: "subject", id: s.id });
                                    setDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEACHER SUBJECT MAPPING */}
          <TabsContent value="mapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Teacher-Subject Mapping
                </CardTitle>
                <Dialog open={dialog.type === "mapping" && dialog.open} onOpenChange={(open) => setDialog({ type: "mapping", open })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("mapping")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Mapping
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Mapping</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Teacher</Label>
                        <Select
                          value={mappingForm.teacherId}
                          onValueChange={(v) => setMappingForm({ ...mappingForm, teacherId: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Select
                          value={mappingForm.subjectId}
                          onValueChange={(v) => setMappingForm({ ...mappingForm, subjectId: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                          <SelectContent>
                            {subjects.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => handleSubmit("mapping")} className="w-full">
                        {editing ? "Update" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherMappings.map((m) => {
                      const teacher = teachers.find((t) => t.id === m.teacherId);
                      const subject = subjects.find((s) => s.id === m.subjectId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell>{teacher?.name || "-"}</TableCell>
                          <TableCell>{subject?.name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("mapping", m)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ type: "mapping", id: m.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLASS TEACHER MAPPING — SIMPLIFIED */}
          <TabsContent value="classMapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Class Teachers
                </CardTitle>
                {/* ----------  CLASS TEACHER MAPPING DIALOG  ---------- */}
                <Dialog open={dialog.type === "classMapping" && dialog.open}
                  onOpenChange={(open) => setDialog({ type: "classMapping", open })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("classMapping")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Assign Class Teacher
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Change" : "Assign"} Class Teacher</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">

                      {/* TEACHER */}
                      <div>
                        <Label>Teacher *</Label>
                        <Select
                          value={classMappingForm.teacherId}
                          onValueChange={(v) => setClassMappingForm({ ...classMappingForm, teacherId: v, sectionId: "" })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                          <SelectContent>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* CLASS */}
                      <div>
                        <Label>Class *</Label>
                        <Select
                          value={classMappingForm.classId}
                          onValueChange={(v) => setClassMappingForm({ ...classMappingForm, classId: v, sectionId: "" })}
                        >
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => {
                              const prog = programs.find(p => p.id === c.programId);
                              return (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name} ({prog?.name})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* SECTION – ONLY when the selected class has sections */}
                      {classMappingForm.classId && sections.some(s => s.classId === Number(classMappingForm.classId)) && (
                        <div>
                          <Label>Section (optional)</Label>
                          <Select
                            // “none” → user wants *all* sections → backend null
                            value={classMappingForm.sectionId || "none"}
                            onValueChange={(v) =>
                              setClassMappingForm({
                                ...classMappingForm,
                                sectionId: v === "none" ? "" : v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Section (All)</SelectItem>
                              {sections
                                .filter((s) => s.classId === Number(classMappingForm.classId))
                                .map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* SUBMIT */}
                      <Button
                        onClick={() => handleSubmit("classMapping")}
                        className="w-full"
                        disabled={!classMappingForm.teacherId || !classMappingForm.classId}
                      >
                        {editing ? "Update" : "Assign"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClassMappings && teacherClassMappings?.map((m) => {
                      const teacher = teachers.find((t) => t.id === m.teacherId);
                      const cls = classes.find((c) => c.id === m.classId);
                      const prog = programs.find((p) => p.id === cls?.programId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{teacher?.name || "—"}</TableCell>
                          <TableCell>{cls?.name || "—"}</TableCell>
                          <TableCell>{prog?.name || "—"}</TableCell>
                          <TableCell>
                            {cls?.name || "—"}
                            {m.sectionId && (
                              <span className="text-xs text-muted-foreground ml-1">
                                [{sections.find(s => s.id === m.sectionId)?.name}]
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("classMapping", m)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ type: "classMapping", id: m.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSIGNMENTS */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Assignment management features coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delete Confirmation */}
          <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Academics;
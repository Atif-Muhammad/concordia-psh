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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Calendar,
  Eye,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
import { useEffect, useState, useRef, useCallback } from "react";
import {
  createClass,
  createProgram,
  createSection,
  createSubject,
  createTeacherClassMappings,
  createTeacherSubjectMapping,
  deleteClass,
  deleteProgram,
  deleteSection,
  deleteSubject,
  deleteTeacherClassMappings,
  deleteTeacherSubjectMapping,
  deleteTimetable,
  getClasses,
  getPrograms,
  getDepartmentNames,
  getSections,
  getSubjects,
  getTeacherClassMappings,
  getTeacherNames,
  getTeacherSubjectMappings,
  getTimetables,
  updateClass,
  updateProgram,
  updateSection,
  updateSubject,
  updateTeacherClassMappings,
  updateTeacherSubjectMapping,
  getAcademicSessions,
  createAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
  getSubjectClassMappings,
  createSubjectClassMapping,
  updateSubjectClassMapping,
  deleteSubjectClassMapping,
  getSubjectsForClassWithAssignments,
  searchAcademicsStaff,
  bulkAssignTeacherToClassSubjects,
  upsertTimetable,
} from "../../config/apis";

function to12h(time) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function groupSlotsToSchedules(slots) {
  const map = new Map();
  for (const s of slots) {
    const key = s.subjectId.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime });
  }
  return Array.from(map.entries()).map(([subjectId, dayAssignments]) => ({ subjectId, dayAssignments }));
}

function flattenSchedulesToSlots(schedules) {
  const result = [];
  for (const sched of schedules) {
    if (!sched.subjectId) continue;
    for (const da of sched.dayAssignments) {
      if (!da.dayOfWeek || !da.startTime || !da.endTime) continue;
      result.push({ dayOfWeek: da.dayOfWeek, startTime: da.startTime, endTime: da.endTime, subjectId: Number(sched.subjectId) });
    }
  }
  return result;
}

const Academics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [sectionFilterProgram, setSectionFilterProgram] = useState("all");
  const [sectionFilterClass, setSectionFilterClass] = useState("all");
  const currentUser = queryClient.getQueryData(["currentUser"]);

  // Session filter state (declared before queries that depend on them)
  const [scmSessionFilter, setScmSessionFilter] = useState("all");
  const [tcmSessionFilter, setTcmSessionFilter] = useState("all");
  const [scmDialogSessionId, setScmDialogSessionId] = useState("");
  const [tcmDialogSessionId, setTcmDialogSessionId] = useState("");

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
    queryKey: ["teacherClassMappings", tcmSessionFilter],
    queryFn: () => getTeacherClassMappings(
      tcmSessionFilter !== "all" ? Number(tcmSessionFilter) : undefined
    ),
    retry: 1,
  });
  const [timetableFilterSession, setTimetableFilterSession] = useState("all");
  const { data: timetables = [] } = useQuery({
    queryKey: ["timetables", timetableFilterSession],
    queryFn: () => getTimetables(timetableFilterSession !== "all" ? timetableFilterSession : null),
    retry: 1,
  });
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: getTeacherNames,
    retry: 1,
  });
  const { data: academicSessions = [] } = useQuery({
    queryKey: ["academicSessions"],
    queryFn: getAcademicSessions,
    retry: 1,
  });
  const { data: scmMappings = [] } = useQuery({
    queryKey: ["scmMappings", scmSessionFilter],
    queryFn: () => getSubjectClassMappings(
      scmSessionFilter !== "all" ? Number(scmSessionFilter) : undefined
    ),
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
    mutationFn: (data) => upsertTimetable(data),
    onSuccess: () => queryClient.invalidateQueries(["timetables"]),
  });
  const sessionMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateAcademicSession(id, data) : createAcademicSession(data)),
    onSuccess: () => queryClient.invalidateQueries(["academicSessions"]),
  });
  const scmMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? updateSubjectClassMapping(id, data) : createSubjectClassMapping(data),
    onSuccess: () => queryClient.invalidateQueries(["scmMappings"]),
  });

  const deleteMutations = {
    program: useMutation({ mutationFn: deleteProgram, onSuccess: () => queryClient.invalidateQueries(["programs"]) }),
    class: useMutation({ mutationFn: deleteClass, onSuccess: () => queryClient.invalidateQueries(["classes"]) }),
    section: useMutation({ mutationFn: deleteSection, onSuccess: () => queryClient.invalidateQueries(["sections"]) }),
    subject: useMutation({ mutationFn: deleteSubject, onSuccess: () => queryClient.invalidateQueries(["subjects"]) }),
    mapping: useMutation({ mutationFn: deleteTeacherSubjectMapping, onSuccess: () => queryClient.invalidateQueries(["teacherSubjectMappings"]) }),
    classMapping: useMutation({ mutationFn: deleteTeacherClassMappings, onSuccess: () => queryClient.invalidateQueries(["teacherClassMappings"]) }),
    timetable: useMutation({ mutationFn: deleteTimetable, onSuccess: () => queryClient.invalidateQueries(["timetables"]) }),
    session: useMutation({ mutationFn: deleteAcademicSession, onSuccess: () => queryClient.invalidateQueries(["academicSessions"]) }),
    scm: useMutation({ mutationFn: deleteSubjectClassMapping, onSuccess: () => queryClient.invalidateQueries(["scmMappings"]) }),
  };

  // Local state
  const [dialog, setDialog] = useState({ type: "", open: false });
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [subjectFilterProgram, setSubjectFilterProgram] = useState("all");
  const [subjectFilterClass, setSubjectFilterClass] = useState("all");
  const [timetableFilterClass, setTimetableFilterClass] = useState("all");
  const [tcmTableStaffSearch, setTcmTableStaffSearch] = useState("");

  useEffect(() => {
    if (academicSessions?.length > 0) {
      const active = academicSessions.find(s => s.isActive);
      if (active) {
        setScmSessionFilter(active.id.toString());
        setTcmSessionFilter(active.id.toString());
        setScmDialogSessionId(active.id.toString());
        setTcmDialogSessionId(active.id.toString());
      }
    }
  }, [academicSessions]);

  // Form states
  const [programForm, setProgramForm] = useState({ name: "", description: "", level: "INTERMEDIATE", departmentId: "", duration: "", customDuration: "" });
  const [classForm, setClassForm] = useState({ name: "", programId: "", year: "", semester: "", isSemester: false });
  const [sectionForm, setSectionForm] = useState({ sectionLetter: "A", shift: "Morning", classId: "", capacity: "", room: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "" });
  const [scmDialogFilter, setScmDialogFilter] = useState({ programId: "all", classId: "" });
  const [bulkSubjectSelection, setBulkSubjectSelection] = useState(new Map());
  const [scmEditForm, setScmEditForm] = useState({ code: "", creditHours: "" });
  const [scmTableFilter, setScmTableFilter] = useState({ programId: "all", classId: "all" });
  const [mappingForm, setMappingForm] = useState({ teacherId: "", subjectId: "" });
  const [classMappingForm, setClassMappingForm] = useState({ teacherId: "", classId: "", sectionId: "", tcmFilterProgramId: "" });

  // TCM redesign state
  const [tcmStaffSearch, setTcmStaffSearch] = useState("");
  const [tcmStaffResults, setTcmStaffResults] = useState([]);
  const [tcmStaffSearching, setTcmStaffSearching] = useState(false);
  const [tcmSelectedStaff, setTcmSelectedStaff] = useState(null); // { id, name, isTeaching, isNonTeaching }
  const [tcmSelectedProgramId, setTcmSelectedProgramId] = useState("");
  const [tcmSelectedClassId, setTcmSelectedClassId] = useState("");
  const [tcmClassSubjects, setTcmClassSubjects] = useState([]); // from getSubjectsForClassWithAssignments
  const [tcmClassSubjectsLoading, setTcmClassSubjectsLoading] = useState(false);
  const [tcmSelectedSubjectIds, setTcmSelectedSubjectIds] = useState(new Set());
  const [tcmSelectedSectionId, setTcmSelectedSectionId] = useState("");
  const [tcmSubmitting, setTcmSubmitting] = useState(false);
  const tcmSearchTimeout = useRef(null);

  // SCM view dialog state
  const [scmViewItem, setScmViewItem] = useState(null);
  // TCM view/edit state
  const [tcmViewItem, setTcmViewItem] = useState(null);
  const [tcmViewSubjects, setTcmViewSubjects] = useState([]);
  const [tcmViewSubjectsLoading, setTcmViewSubjectsLoading] = useState(false);
  // Timetable dialog state
  const [ttDialogOpen, setTtDialogOpen] = useState(false);
  const [ttClassId, setTtClassId] = useState("");
  const [ttSectionId, setTtSectionId] = useState("");
  const [ttSessionId, setTtSessionId] = useState("");
  const [ttSubjectSchedules, setTtSubjectSchedules] = useState([]);
  const [ttSaving, setTtSaving] = useState(false);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const openTimetableDialog = (existing) => {
    if (existing) {
      setTtClassId(existing.classId.toString());
      setTtSectionId(existing.sectionId ? existing.sectionId.toString() : "");
      setTtSessionId(existing.sessionId ? existing.sessionId.toString() : "");
      setTtSubjectSchedules(groupSlotsToSchedules(existing.slots || []));
    } else {
      setTtClassId("");
      setTtSectionId("");
      setTtSessionId("");
      setTtSubjectSchedules([]);
    }
    setTtDialogOpen(true);
  };

  const addSubjectSchedule = (subjectId) => {
    setTtSubjectSchedules(prev => [...prev, { subjectId, dayAssignments: [{ dayOfWeek: "Monday", startTime: "", endTime: "" }] }]);
  };

  const removeSubjectSchedule = (schedIdx) => {
    setTtSubjectSchedules(prev => prev.filter((_, i) => i !== schedIdx));
  };

  const addDayAssignment = (schedIdx) => {
    setTtSubjectSchedules(prev => prev.map((s, i) =>
      i === schedIdx ? { ...s, dayAssignments: [...s.dayAssignments, { dayOfWeek: "Monday", startTime: "", endTime: "" }] } : s
    ));
  };

  const removeDayAssignment = (schedIdx, daIdx) => {
    setTtSubjectSchedules(prev => prev.map((s, i) =>
      i === schedIdx ? { ...s, dayAssignments: s.dayAssignments.filter((_, j) => j !== daIdx) } : s
    ));
  };

  const updateDayAssignment = (schedIdx, daIdx, field, value) => {
    setTtSubjectSchedules(prev => prev.map((s, i) =>
      i === schedIdx ? {
        ...s,
        dayAssignments: s.dayAssignments.map((da, j) => j === daIdx ? { ...da, [field]: value } : da)
      } : s
    ));
  };

  const handleTimetableSave = async () => {
    if (!ttClassId) return;
    const slots = flattenSchedulesToSlots(ttSubjectSchedules);
    setTtSaving(true);
    try {
      await upsertTimetable({
        classId: Number(ttClassId),
        sectionId: ttSectionId ? Number(ttSectionId) : null,
        sessionId: ttSessionId ? Number(ttSessionId) : null,
        slots,
      });
      queryClient.invalidateQueries(["timetables"]);
      setTtDialogOpen(false);
      toast({ title: "Timetable saved" });
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setTtSaving(false);
    }
  };
  const [sessionForm, setSessionForm] = useState({ name: "", startDate: "", endDate: "", isActive: false });

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
      section: { sectionLetter: "A", shift: "Morning", classId: "", capacity: "", room: "", customName: "" },
      subject: { name: "" },
      scm: { programId: "all", classId: "" },
      mapping: { teacherId: "", subjectId: "" },
      classMapping: { teacherId: "", classId: "", sectionId: "", tcmFilterProgramId: "" },
      timetable: { teacherId: "", subjectId: "", sectionId: "", dayOfWeek: "Monday", startTime: "", endTime: "", room: "" },
      assignment: { title: "", description: "", dueDate: "", teacherId: "", subjectId: "", sectionId: "" },
      session: { name: "", startDate: "", endDate: "", isActive: false },
    };
    return defaults[type];
  };

  const handleSubmit = (type) => {
    const forms = {
      program: { form: programForm, setForm: setProgramForm, mutation: programMutation },
      class: { form: classForm, setForm: setClassForm, mutation: classMutation },
      section: { form: sectionForm, setForm: setSectionForm, mutation: sectionMutation },
      subject: { form: subjectForm, setForm: setSubjectForm, mutation: subjectMutation },
      session: { form: sessionForm, setForm: setSessionForm, mutation: sessionMutation },
      mapping: { form: mappingForm, setForm: setMappingForm, mutation: teacherSubjectMutation },
      classMapping: { form: classMappingForm, setForm: setClassMappingForm, mutation: teacherClassMutation },
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
        rollPrefix: programForm.rollPrefix || null,
      };
    }

    if (type === "class") {
      const programId = Number(classForm.programId);
      const name = classForm.name;
      const year = classForm.year ? Number(classForm.year) : null;
      const semester = classForm.semester ? Number(classForm.semester) : null;

      const exists = classes.some(
        (c) =>
          c.id !== editing?.id &&
          c.programId === programId &&
          (c.name === name || (year !== null && c.year === year) || (semester !== null && c.semester === semester))
      );

      if (exists) {
        toast({
          title: `Class already exists`,
          description: `A class with this name or period already exists for this program.`,
          variant: "destructive",
        });
        return;
      }

      data = {
        name,
        programId,
        year,
        semester,
        isSemester: Boolean(classForm.isSemester),
        rollPrefix: classForm.rollPrefix || null,
      };
    }

    if (type === "section") {
      let name = "";
      if (sectionForm.sectionLetter === "Custom") {
        name = sectionForm.customName;
      } else {
        name = `${sectionForm.sectionLetter} ${sectionForm.shift}`.trim();
      }

      if (!name || !sectionForm.classId) {
        toast({ title: "Section name, shift, and class are required", variant: "destructive" });
        return;
      }
      data = {
        name,
        classId: Number(sectionForm.classId),
        capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
        room: sectionForm.room || null,
      };
    }

    if (type === "session") {
      if (!sessionForm.name || !sessionForm.startDate || !sessionForm.endDate) {
        toast({ title: "Name, start date, and end date are required", variant: "destructive" });
        return;
      }
      data = {
        name: sessionForm.name,
        startDate: new Date(sessionForm.startDate).toISOString(),
        endDate: new Date(sessionForm.endDate).toISOString(),
        isActive: Boolean(sessionForm.isActive),
      };
    }

    if (type === "subject") {
      if (!subjectForm.name.trim()) {
        toast({ title: "Subject name is required", variant: "destructive" });
        return;
      }
      data = { name: subjectForm.name };
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

  const [bulkScmPending, setBulkScmPending] = useState(false);

  const handleBulkScmSubmit = async () => {
    if (!scmDialogFilter.classId || bulkSubjectSelection.size === 0) return;
    setBulkScmPending(true);
    try {
      const classId = Number(scmDialogFilter.classId);
      for (const [subjectId, { code, creditHours }] of bulkSubjectSelection) {
        // Skip if already mapped (session-scoped check)
        const exists = scmMappings.some(
          m => m.subjectId === subjectId &&
               m.classId === classId &&
               (scmDialogSessionId ? m.sessionId === Number(scmDialogSessionId) : !m.sessionId)
        );
        if (exists) continue;
        
        await createSubjectClassMapping({
          subjectId,
          classId,
          code: code || null,
          creditHours: creditHours ? Number(creditHours) : null,
          sessionId: scmDialogSessionId ? Number(scmDialogSessionId) : null,
        });
      }
      queryClient.invalidateQueries(["scmMappings"]);
      setDialog({ type: "", open: false });
      setEditing(null);
      setScmDialogFilter(resetForm("scm"));
      setBulkSubjectSelection(new Map());
      toast({ title: "Mappings created successfully" });
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setBulkScmPending(false);
    }
  };

  const handleBulkScmUpdate = async () => {
    if (!scmDialogFilter.classId || !editing) return;
    setBulkScmPending(true);
    try {
      const classId = Number(scmDialogFilter.classId);
      // Get existing mappings for this class
      const existingMappings = scmMappings.filter(m => m.classId === classId);
      const existingSubjectIds = new Set(existingMappings.map(m => m.subjectId));
      const selectedSubjectIds = new Set(bulkSubjectSelection.keys());

      // Delete unchecked mappings
      for (const m of existingMappings) {
        if (!selectedSubjectIds.has(m.subjectId)) {
          await deleteSubjectClassMapping(m.id);
        }
      }

      // Update or create checked mappings
      for (const [subjectId, { code, creditHours, mappingId }] of bulkSubjectSelection) {
        if (mappingId) {
          // Update existing
          await updateSubjectClassMapping(mappingId, {
            code: code || null,
            creditHours: creditHours ? Number(creditHours) : null,
            sessionId: scmDialogSessionId ? Number(scmDialogSessionId) : null,
          });
        } else {
          // Create new
          await createSubjectClassMapping({
            subjectId,
            classId,
            code: code || null,
            creditHours: creditHours ? Number(creditHours) : null,
            sessionId: scmDialogSessionId ? Number(scmDialogSessionId) : null,
          });
        }
      }

      queryClient.invalidateQueries(["scmMappings"]);
      setDialog({ type: "", open: false });
      setEditing(null);
      setScmDialogFilter(resetForm("scm"));
      setBulkSubjectSelection(new Map());
      toast({ title: "Mappings updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setBulkScmPending(false);
    }
  };

  const openEdit = (type, item) => {
    if (type === "program") {
      setProgramForm({
        name: item.name,
        description: item.description || "",
        level: item.level,
        departmentId: item.departmentId?.toString() || "",
        duration: item.duration,
        rollPrefix: item.rollPrefix || "",
      });
    }
    if (type === "class") {
      setClassForm({
        name: item.name,
        programId: item.programId.toString(),
        year: item.year?.toString() || "",
        semester: item.semester?.toString() || "",
        isSemester: Boolean(item.isSemester),
        rollPrefix: item.rollPrefix || ""
      });
    }
    if (type === "section") {
      const parts = item.name.split(" ");
      const shift = parts[parts.length - 1]; // Assume last part is shift
      const possibleLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const possibleShifts = ["Morning", "Evening"];

      const isStandard = possibleLetters.includes(parts[0]) && possibleShifts.includes(shift) && parts.length === 2;

      setSectionForm({
        sectionLetter: isStandard ? parts[0] : "Custom",
        shift: possibleShifts.includes(shift) ? shift : "Morning",
        classId: item.classId.toString(),
        capacity: item.capacity?.toString() || "",
        room: item.room || "",
        customName: isStandard ? "" : item.name,
      });
    }



    if (type === "subject") {
      setSubjectForm({ name: item.name });
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
        tcmFilterProgramId: "",
      });
    }
    if (type === "session") {
      setSessionForm({
        name: item.name,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
        endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
        isActive: Boolean(item.isActive),
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
      scm: setScmDialogFilter,
      classMapping: setClassMappingForm,
      session: setSessionForm,
    };
    setters[type](resetForm(type));
    if (type === "scm") setBulkSubjectSelection(new Map());
    if (type === "classMapping") {
      setTcmStaffSearch("");
      setTcmStaffResults([]);
      setTcmSelectedStaff(null);
      setTcmSelectedProgramId("");
      setTcmSelectedClassId("");
      setTcmClassSubjects([]);
      setTcmSelectedSubjectIds(new Set());
      setTcmSelectedSectionId("");
    }
    setDialog({ type, open: true });
  };

  // TCM: debounced staff search
  const handleTcmStaffSearch = (q) => {
    setTcmStaffSearch(q);
    if (tcmSearchTimeout.current) clearTimeout(tcmSearchTimeout.current);
    if (!q.trim()) { setTcmStaffResults([]); return; }
    tcmSearchTimeout.current = setTimeout(async () => {
      setTcmStaffSearching(true);
      try {
        const results = await searchAcademicsStaff(q);
        setTcmStaffResults(results);
      } catch { setTcmStaffResults([]); }
      finally { setTcmStaffSearching(false); }
    }, 300);
  };

  // TCM: load subjects for selected class
  const loadTcmClassSubjects = async (classId) => {
    if (!classId) { setTcmClassSubjects([]); return; }
    setTcmClassSubjectsLoading(true);
    try {
      const data = await getSubjectsForClassWithAssignments(
        Number(classId),
        tcmDialogSessionId ? Number(tcmDialogSessionId) : undefined
      );
      setTcmClassSubjects(data);
    } catch { setTcmClassSubjects([]); }
    finally { setTcmClassSubjectsLoading(false); }
  };

  // Re-trigger subject load when session changes in TCM dialog
  useEffect(() => {
    if (tcmSelectedClassId) {
      loadTcmClassSubjects(tcmSelectedClassId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tcmDialogSessionId]);

  // TCM: get role label for staff
  const getTcmStaffRole = (staff) => {
    if (staff.isTeaching && staff.isNonTeaching) return "Dual Role";
    if (staff.isTeaching) return "Teaching";
    if (staff.isNonTeaching) return "Non-Teaching";
    return "Staff";
  };

  // TCM: submit bulk assignment
  const handleTcmBulkSubmit = async () => {
    if (!tcmSelectedStaff || !tcmSelectedClassId || tcmSelectedSubjectIds.size === 0) return;
    setTcmSubmitting(true);
    try {
      await bulkAssignTeacherToClassSubjects({
        teacherId: tcmSelectedStaff.id,
        classId: Number(tcmSelectedClassId),
        subjectIds: Array.from(tcmSelectedSubjectIds),
        sessionId: tcmDialogSessionId ? Number(tcmDialogSessionId) : null,
        sectionId: tcmSelectedSectionId ? Number(tcmSelectedSectionId) : null,
      });
      queryClient.invalidateQueries(["teacherClassMappings"]);
      queryClient.invalidateQueries(["teacherSubjectMappings"]);
      setDialog({ type: "", open: false });
      toast({ title: "Teacher assigned successfully" });
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setTcmSubmitting(false);
    }
  };

  // TCM: open detail dialog
  const openTcmDetail = async (mapping) => {
    setTcmViewItem(mapping);
    setTcmViewSubjects([]);
    setTcmViewSubjectsLoading(true);
    try {
      const sessionId = mapping.sessionId ? mapping.sessionId : undefined;
      const data = await getSubjectsForClassWithAssignments(mapping.classId, sessionId);
      const assigned = data.filter(scm =>
        scm.subject.teachers?.some(tm => tm.teacherId === mapping.teacherId)
      );
      setTcmViewSubjects(assigned);
    } catch {
      setTcmViewSubjects([]);
    } finally {
      setTcmViewSubjectsLoading(false);
    }
  };

  // TCM: open assign dialog pre-populated for editing
  const openTcmEdit = (mapping) => {
    const staff = teachers.find(t => t.id === mapping.teacherId);
    setTcmSelectedStaff(staff ? { id: staff.id, name: staff.name, isTeaching: true, isNonTeaching: false } : null);
    setTcmStaffSearch(staff?.name || "");
    setTcmStaffResults([]);
    setTcmSelectedProgramId(
      classes.find(c => c.id === mapping.classId)?.programId?.toString() || ""
    );
    setTcmSelectedClassId(mapping.classId.toString());
    setTcmDialogSessionId(mapping.sessionId ? mapping.sessionId.toString() : "");
    setTcmSelectedSectionId(mapping.sectionId ? mapping.sectionId.toString() : "");
    setTcmSelectedSubjectIds(new Set());
    loadTcmClassSubjects(mapping.classId.toString());
    setEditing(mapping);
    setDialog({ type: "classMapping", open: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Academics Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage programs, classes, subjects, and timetables
            </p>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="scm">S-Class</TabsTrigger>
            <TabsTrigger value="classMapping">T-Class</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            {/* <TabsTrigger value="assignments">Assignments</TabsTrigger> */}
          </TabsList>

          {/* SESSIONS TAB */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Academic Sessions</CardTitle>
                </div>
                <Dialog open={dialog.type === "session" && dialog.open} onOpenChange={(open) => setDialog({ type: "session", open })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("session")}>
                      <PlusCircle className="mr-2" /> Add Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Academic Session</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Session Name *</Label>
                        <Input
                          value={sessionForm.name}
                          onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                          placeholder="e.g. 2023-2024"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Date *</Label>
                          <Input
                            type="date"
                            value={sessionForm.startDate}
                            onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>End Date *</Label>
                          <Input
                            type="date"
                            value={sessionForm.endDate}
                            onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={sessionForm.isActive}
                          onChange={(e) => setSessionForm({ ...sessionForm, isActive: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="isActive">Set as Active Session</Label>
                      </div>
                      <Button onClick={() => handleSubmit("session")} className="w-full">
                        {editing ? "Update" : "Add"} Session
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Session Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Start Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">End Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                      <TableHead className="text-right px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium py-2 px-3 text-sm">{s.name}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">{s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">{s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">
                          {s.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2 py-2 px-3 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => openEdit("session", s)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ type: "session", id: s.id });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {academicSessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No academic sessions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIMETABLE TAB */}
          <TabsContent value="timetable">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Timetable
                </CardTitle>
                <Button onClick={() => openTimetableDialog(null)}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add / Edit Timetable
                </Button>
              </CardHeader>

              {/* Timetable editor dialog */}
              <Dialog open={ttDialogOpen} onOpenChange={setTtDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {ttClassId
                        ? `Timetable ${classes.find(c => c.id === Number(ttClassId))?.name || ""}${ttSectionId ? ` � ${sections.find(s => s.id === Number(ttSectionId))?.name || ""}` : ""}`
                        : "New Timetable"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Class + Section selectors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Class *</Label>
                        <Select value={ttClassId} onValueChange={(v) => { setTtClassId(v); setTtSectionId(""); setTtSubjectSchedules([]); }}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map(c => {
                              const prog = programs.find(p => p.id === c.programId);
                              return <SelectItem key={c.id} value={c.id.toString()}>{c.name} {prog?.name}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {ttClassId && (
                        <div>
                          <Label>Section <span className="text-muted-foreground text-xs">(optional)</span></Label>
                          <Select value={ttSectionId || "all"} onValueChange={(v) => setTtSectionId(v === "all" ? "" : v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sections</SelectItem>
                              {sections.filter(s => s.classId === Number(ttClassId)).map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label>Session <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Select value={ttSessionId || "none"} onValueChange={(v) => setTtSessionId(v === "none" ? "" : v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Session</SelectItem>
                            {academicSessions.map(s => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Subject-centric editor */}
                    {ttClassId && (() => {
                      const classScmMappings = scmMappings.filter(m => m.classId === Number(ttClassId));
                      const addedSubjectIds = new Set(ttSubjectSchedules.map(s => s.subjectId.toString()));
                      const availableMappings = classScmMappings.filter(m => !addedSubjectIds.has(m.subjectId.toString()));

                      return (
                        <div className="space-y-4">
                          {/* Add Subject dropdown */}
                          {classScmMappings.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subjects are mapped to this class.</p>
                          ) : (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">Add Subject</Label>
                              <Select
                                value=""
                                onValueChange={(v) => { if (v) addSubjectSchedule(v); }}
                                disabled={availableMappings.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={availableMappings.length === 0 ? "All subjects added" : "Select subject to add…"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableMappings.map(m => (
                                    <SelectItem key={m.subjectId} value={m.subjectId.toString()}>
                                      {m.subject?.name || `Subject #${m.subjectId}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Subject schedule cards */}
                          {ttSubjectSchedules.map((sched, schedIdx) => {
                            const mapping = classScmMappings.find(m => m.subjectId.toString() === sched.subjectId.toString());
                            const subjectName = mapping?.subject?.name || `Subject #${sched.subjectId}`;
                            return (
                              <div key={schedIdx} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{subjectName}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSubjectSchedule(schedIdx)}
                                    className="text-destructive hover:text-destructive h-7 px-2"
                                  >
                                    ✕ Remove Subject
                                  </Button>
                                </div>

                                {/* Day assignment rows */}
                                <div className="space-y-2">
                                  {sched.dayAssignments.length > 0 && (
                                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
                                      <span>Day</span>
                                      <span>Start</span>
                                      <span>End</span>
                                      <span />
                                    </div>
                                  )}
                                  {sched.dayAssignments.map((da, daIdx) => (
                                    <div key={daIdx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                      <Select
                                        value={da.dayOfWeek}
                                        onValueChange={(v) => updateDayAssignment(schedIdx, daIdx, "dayOfWeek", v)}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {DAYS.map(day => (
                                            <SelectItem key={day} value={day}>{day}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="time"
                                        value={da.startTime}
                                        onChange={(e) => updateDayAssignment(schedIdx, daIdx, "startTime", e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                      <Input
                                        type="time"
                                        value={da.endTime}
                                        onChange={(e) => updateDayAssignment(schedIdx, daIdx, "endTime", e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDayAssignment(schedIdx, daIdx)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      >
                                        ✕
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addDayAssignment(schedIdx)}
                                  className="h-7 text-xs"
                                >
                                  + Add Day
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <Button className="w-full" onClick={handleTimetableSave} disabled={!ttClassId || ttSaving}>
                      {ttSaving ? "Saving..." : "Save Timetable"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <CardContent>
                {/* Filter */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Class</Label>
                    <Select value={timetableFilterClass} onValueChange={setTimetableFilterClass}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(c => {
                          const prog = programs.find(p => p.id === c.programId);
                          return <SelectItem key={c.id} value={c.id.toString()}>{c.name} — {prog?.name}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Session</Label>
                    <Select value={timetableFilterSession} onValueChange={setTimetableFilterSession}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {academicSessions.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Weekly grid view */}
                {(() => {
                  const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                  const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri" };

                  const filtered = timetables
                    .filter(tt =>
                      timetableFilterClass === "all" || tt.classId === Number(timetableFilterClass)
                    )                    .slice()
                    .sort((a, b) => {
                      const aMin = (a.slots || []).map(s => s.startTime).sort()[0] || "";
                      const bMin = (b.slots || []).map(s => s.startTime).sort()[0] || "";
                      return aMin.localeCompare(bMin);
                    });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 text-muted-foreground">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No timetables yet.</p>
                        <p className="text-xs mt-1">Click "Add / Edit Timetable" to get started.</p>
                      </div>
                    );
                  }

                  return filtered.map((tt) => {
                    const cls = classes.find(c => c.id === tt.classId);
                    const prog = programs.find(p => p.id === cls?.programId);
                    const section = tt.sectionId ? sections.find(s => s.id === tt.sectionId) : null;
                    const sessionLabel = tt.session?.name ? ` · ${tt.session.name}` : "";
                    const label = (section ? `${cls?.name} — ${section.name}` : `${cls?.name} (${prog?.name})`) + sessionLabel;
                    const slots = (tt.slots || []);
                    const timeSlots = Array.from(new Set(slots.map(s => s.startTime).filter(Boolean))).sort();

                    const handlePrint = () => {
                      const win = window.open("", "_blank");
                      if (!win) return;
                      win.document.write(`<!DOCTYPE html><html><head><title>${label}</title><style>
                        body{font-family:Arial,sans-serif;padding:32px}h2{text-align:center;margin-bottom:16px}
                        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px 10px;text-align:center;font-size:13px}
                        th{background:#f0f0f0;font-weight:600}.empty{color:#aaa}
                      </style></head><body><h2>${label} "" Timetable</h2><table><thead><tr>
                        <th>Time</th>${DAYS_LIST.map(d => `<th>${d}</th>`).join("")}</tr></thead><tbody>
                        ${timeSlots.map(startTime => {
                          const endTime = slots.find(s => s.startTime === startTime)?.endTime || "";
                          return `<tr><td><strong>${to12h(startTime)}</strong>${endTime ? `–${to12h(endTime)}` : ""}</td>${DAYS_LIST.map(day => {
                            const s = slots.find(sl => sl.startTime === startTime && sl.dayOfWeek === day);
                            if (!s) return `<td class="empty">""</td>`;
                            const subj = subjects.find(sub => sub.id === Number(s.subjectId));
                            const teach = s.teacher;
                            return `<td>${subj?.name || "?"}<br/><small>${teach?.name || ""}</small></td>`;
                          }).join("")}</tr>`;
                        }).join("")}
                      </tbody></table></body></html>`);
                      win.document.close();
                      win.onload = () => win.print();
                    };

                    return (
                      <div key={tt.id} className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-base">{label}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openTimetableDialog(tt)}>
                              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={handlePrint}>
                              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setDeleteTarget({ type: "timetable", id: tt.id }); setDeleteDialog(true); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {timeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No periods defined.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-20 border-r text-xs">Day</th>
                                  {timeSlots.map(startTime => {
                                    const endTime = slots.find(s => s.startTime === startTime)?.endTime || "";
                                    return (
                                      <th key={startTime} className="px-3 py-2 text-center font-medium text-xs min-w-[110px] whitespace-nowrap">
                                        <div>{to12h(startTime)}</div>
                                        {endTime && <div className="text-muted-foreground/60 font-normal">{to12h(endTime)}</div>}
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {DAYS_LIST.map((day, i) => (
                                  <tr key={day} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                                    <td className="px-3 py-2 border-r text-xs text-muted-foreground font-medium whitespace-nowrap align-middle">
                                      {DAY_SHORT[day]}
                                    </td>
                                    {timeSlots.map(startTime => {
                                      const slot = slots.find(s => s.startTime === startTime && s.dayOfWeek === day);
                                      if (!slot) return <td key={startTime} className="px-3 py-2 text-center text-muted-foreground/30 text-xs">—</td>;
                                      const subj = subjects.find(s => s.id === Number(slot.subjectId));
                                      const teach = slot.teacher;
                                      return (
                                        <td key={startTime} className="px-2 py-1.5 align-top">
                                          <div className="rounded-md bg-primary/5 border border-border px-2 py-1.5 text-xs space-y-0.5">
                                            <div className="font-medium leading-tight">{subj?.name || "—"}</div>
                                            {teach && <div className="text-muted-foreground leading-tight">{teach.name}</div>}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
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
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                            <SelectItem value="DIPLOMA">Diploma (1""2 Years)</SelectItem>
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
                      <div>
                        <Label>Preceding Text (Roll No)</Label>
                        <Input
                          value={programForm.rollPrefix || ""}
                          onChange={(e) => setProgramForm({ ...programForm, rollPrefix: e.target.value })}
                          placeholder="e.g. PSH-ENG"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Prefix for student roll numbers in this program.
                        </p>
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
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Department</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Level</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Duration</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                      <TableHead className="text-right px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((p) => {
                      const dept = departments.find((d) => d.id === p.departmentId);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="py-2 font-medium px-3 text-sm">{p.name}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{dept?.name ?? "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {p.level === "INTERMEDIATE" && "Intermediate"}
                            {p.level === "UNDERGRADUATE" && "BS"}
                            {p.level === "DIPLOMA" && "Diploma"}
                            {p.level === "COACHING" && "Coaching"}
                            {p.level === "SHORT_COURSE" && "Short Course"}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">{p.duration}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{p.description || "—"}</TableCell>
                          <TableCell className="py-2 text-right px-3 text-sm">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => openEdit("program", p)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
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
                                rollPrefix: prog?.rollPrefix || classForm.rollPrefix
                              });
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                            <SelectContent>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                  {(() => {
                                    const dept = departments.find(
                                      (d) => d.id === p.departmentId
                                    );
                                    return dept ? ` (${dept.name})` : "";
                                  })()}
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
                                      name: v === "11" ? "1st year" : "2nd year",
                                    })
                                  }
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="11">1st year</SelectItem>
                                    <SelectItem value="12">2nd year</SelectItem>
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
                        <div>
                          <Label>Preceding Text (Roll No)</Label>
                          <Input
                            value={classForm.rollPrefix || ""}
                            onChange={(e) => setClassForm({ ...classForm, rollPrefix: e.target.value })}
                            placeholder="e.g. PSH-ENG-1A"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Specific prefix for this class/semester.
                          </p>
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
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
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
                            <TableCell className="py-2 px-3 text-sm">{c.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{prog?.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              {c.isSemester ? "Semester" : prog?.level === "INTERMEDIATE" || prog?.level === "DIPLOMA"
                                ? "Year"
                                : "Single"}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => openEdit("class", c)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
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
                            );
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

                    <DialogContent className="w-[90vw] max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editing ? "Edit" : "Add"} Section</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                  return true;
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
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((letter) => (
                                <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                              ))}
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* CUSTOM NAME INPUT */}
                        {sectionForm.sectionLetter === "Custom" && (
                          <div>
                            <Label>Custom Name *</Label>
                            <Input
                              value={sectionForm.customName}
                              onChange={(e) => setSectionForm({ ...sectionForm, customName: e.target.value })}
                              placeholder="e.g. Physics Lab"
                            />
                          </div>
                        )}

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
                          <Label>Display Name (Preview)</Label>
                          <Input
                            value={sectionForm.sectionLetter === "Custom"
                              ? sectionForm.customName
                              : `${sectionForm.sectionLetter} ${sectionForm.shift}`
                            }
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
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Capacity</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
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
                        return true;
                      })
                      .map((s) => {
                        const cls = classes.find((c) => c.id === s.classId);
                        const prog = programs.find((p) => p.id === cls?.programId);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="py-2 px-3 text-sm">{s.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{cls?.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{prog?.name}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{s.capacity || "-"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => openEdit("section", s)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
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
                      {/* NAME */}
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          placeholder="e.g. Physics, Calculus"
                        />
                      </div>

                      {/* SUBMIT */}
                      <Button
                        onClick={() => handleSubmit("subject")}
                        className="w-full"
                        disabled={!subjectForm.name.trim()}
                      >
                        {editing ? "Update" : "Add"} Subject
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                {/* TABLE */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="text-right px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects
                      .filter((s) => {
                        if (subjectFilterProgram !== "all" || subjectFilterClass !== "all") return true;
                        return true;
                      })
                      .map((s) => {
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="py-2 font-medium px-3 text-sm">{s.name}</TableCell>
                            <TableCell className="py-2 text-right px-3 text-sm">
                              <div className="flex justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => openEdit("subject", s)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
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

          {/* SUBJECT-CLASS MAPPING */}
          <TabsContent value="scm">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Subject-Class Mapping
                </CardTitle>
                <Dialog open={dialog.type === "scm" && dialog.open} onOpenChange={(open) => {
                  setDialog({ type: "scm", open });
                  if (!open) {
                    setEditing(null);
                    setScmEditForm({ code: "", creditHours: "" });
                    setScmDialogFilter({ programId: "all", classId: "" });
                    setBulkSubjectSelection(new Map());
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("scm")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Add Mapping
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit" : "Add"} Subject-Class Mapping</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Filter bar - hide program in edit mode */}
                      {!editing && (
                        <div>
                          <Label>Program</Label>
                          <Select
                            value={scmDialogFilter.programId}
                            onValueChange={(v) =>
                              setScmDialogFilter({ programId: v, classId: "" })
                            }
                          >
                            <SelectTrigger><SelectValue placeholder="All Programs" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Programs</SelectItem>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label>Class *</Label>
                        <Select
                          value={scmDialogFilter.classId}
                          onValueChange={(v) =>
                            setScmDialogFilter({ ...scmDialogFilter, classId: v })
                          }
                          disabled={editing}
                        >
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes
                              .filter(c =>
                                scmDialogFilter.programId === "all" ||
                                c.programId === Number(scmDialogFilter.programId)
                              )
                              .map((c) => {
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

                      <div>
                        <Label>Session (Optional)</Label>
                        <Select
                          value={scmDialogSessionId || "none"}
                          onValueChange={(v) => setScmDialogSessionId(v === "none" ? "" : v)}
                        >
                          <SelectTrigger><SelectValue placeholder="No session" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No session</SelectItem>
                            {academicSessions.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subject checklist */}
                      {scmDialogFilter.classId && (
                        <div>
                          <Label className="mb-2 block">Subjects</Label>
                          <div className="max-h-72 overflow-y-auto space-y-2 border rounded-md p-2">
                            {(subjects || []).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">No subjects found.</p>
                            )}
                            {(subjects || []).map((subject) => {
                              const alreadyMapped = (scmMappings || []).some(
                                m => m.subjectId === subject.id && 
                                     m.classId === Number(scmDialogFilter.classId) &&
                                     (scmDialogSessionId ? m.sessionId === Number(scmDialogSessionId) : !m.sessionId)
                              );
                              const isChecked = bulkSubjectSelection.has(subject.id);
                              return (
                                <div key={subject.id} className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`subject-${subject.id}`}
                                      checked={isChecked}
                                      disabled={!editing && alreadyMapped}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setBulkSubjectSelection(prev =>
                                            new Map(prev).set(subject.id, { code: "", creditHours: "" })
                                          );
                                        } else {
                                          setBulkSubjectSelection(prev => {
                                            const m = new Map(prev);
                                            m.delete(subject.id);
                                            return m;
                                          });
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`subject-${subject.id}`}
                                      className={`text-sm flex-1 ${(!editing && alreadyMapped) ? "text-muted-foreground" : "cursor-pointer"}`}
                                    >
                                      {subject.name}
                                      {!editing && alreadyMapped && (
                                        <Badge variant="secondary" className="ml-2 text-xs">Already mapped</Badge>
                                      )}
                                    </label>
                                  </div>
                                  {isChecked && (
                                    <div className="ml-6 grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Code</Label>
                                        <Input
                                          value={bulkSubjectSelection.get(subject.id)?.code || ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            setBulkSubjectSelection(prev => {
                                              const m = new Map(prev);
                                              m.set(subject.id, { ...m.get(subject.id), code: value });
                                              return m;
                                            });
                                          }}
                                          placeholder="e.g. PHY-101"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Credit Hours</Label>
                                        <Input
                                          type="number"
                                          value={bulkSubjectSelection.get(subject.id)?.creditHours || ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            setBulkSubjectSelection(prev => {
                                              const m = new Map(prev);
                                              m.set(subject.id, { ...m.get(subject.id), creditHours: value });
                                              return m;
                                            });
                                          }}
                                          placeholder="e.g. 3"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={editing ? handleBulkScmUpdate : handleBulkScmSubmit}
                        className="w-full"
                        disabled={
                          bulkSubjectSelection.size === 0 ||
                          !scmDialogFilter.classId ||
                          bulkScmPending
                        }
                      >
                        {bulkScmPending ? (editing ? "Updating..." : "Adding...") : (editing ? "Update Mappings" : "Add Mappings")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* SCM Table Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Session</Label>
                    <Select value={scmSessionFilter} onValueChange={setScmSessionFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {academicSessions.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Program</Label>
                    <Select
                      value={scmTableFilter.programId}
                      onValueChange={(v) =>
                        setScmTableFilter({ programId: v, classId: "all" })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Class</Label>
                    <Select
                      value={scmTableFilter.classId}
                      onValueChange={(v) => setScmTableFilter({ ...scmTableFilter, classId: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes
                          .filter((c) =>
                            scmTableFilter.programId === "all" ||
                            c.programId === Number(scmTableFilter.programId)
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Subjects</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(
                      scmMappings
                        .filter((item) => {
                          const cls = classes.find((c) => c.id === item.classId);
                          if (scmTableFilter.programId !== "all" && cls?.programId !== Number(scmTableFilter.programId)) return false;
                          if (scmTableFilter.classId !== "all" && item.classId !== Number(scmTableFilter.classId)) return false;
                          return true;
                        })
                        .reduce((acc, item) => {
                          if (!acc.has(item.classId)) acc.set(item.classId, []);
                          acc.get(item.classId).push(item);
                          return acc;
                        }, new Map())
                    ).map(([classId, mappings]) => {
                      const cls = classes.find((c) => c.id === classId);
                      const prog = programs.find((p) => p.id === cls?.programId);
                      return (
                        <TableRow key={classId}>
                          <TableCell className="font-medium py-2 px-3 text-sm">{cls?.name || "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{prog?.name || "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{mappings.length} subject(s)</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setScmViewItem({ classId, mappings })}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setEditing({ classId });
                                    setScmDialogFilter({ programId: "all", classId: classId.toString() });
                                    const preChecked = new Map();
                                    mappings.forEach(m => {
                                      preChecked.set(m.subjectId, {
                                        code: m.code || "",
                                        creditHours: m.creditHours != null ? m.creditHours.toString() : "",
                                        mappingId: m.id,
                                      });
                                    });
                                    setBulkSubjectSelection(preChecked);
                                    setDialog({ type: "scm", open: true });
                                  }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      if (!confirm(`Delete all ${mappings.length} subject mapping(s) for this class?`)) return;
                                      try {
                                        for (const m of mappings) {
                                          await deleteSubjectClassMapping(m.id);
                                        }
                                        queryClient.invalidateQueries(["scmMappings"]);
                                        toast({ title: "Mappings deleted successfully" });
                                      } catch (err) {
                                        toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete All</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {scmMappings.filter((item) => {
                      const cls = classes.find((c) => c.id === item.classId);
                      if (scmTableFilter.programId !== "all" && cls?.programId !== Number(scmTableFilter.programId)) return false;
                      if (scmTableFilter.classId !== "all" && item.classId !== Number(scmTableFilter.classId)) return false;
                      return true;
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No subject-class mappings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLASS TEACHER MAPPING "" SIMPLIFIED */}
          <TabsContent value="classMapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Teacher-Class Assignments
                </CardTitle>
                <Dialog
                  open={dialog.type === "classMapping" && dialog.open}
                  onOpenChange={(open) => {
                    setDialog({ type: "classMapping", open });
                    if (!open) {
                      setTcmStaffSearch(""); setTcmStaffResults([]);
                      setTcmSelectedStaff(null); setTcmSelectedProgramId("");
                      setTcmSelectedClassId(""); setTcmClassSubjects([]);
                      setTcmSelectedSubjectIds(new Set()); setTcmSelectedSectionId("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => openDialog("classMapping")}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Assign Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Teacher Assignment" : "Assign Teacher to Class & Subjects"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Search Staff *</Label>
                        {editing ? (
                          <div className="flex items-center gap-2 mt-1 p-2 border rounded-md bg-muted">
                            <Badge variant="outline">{tcmSelectedStaff?.name || "—"}</Badge>
                            <Badge variant="secondary" className="text-xs">{tcmSelectedStaff ? getTcmStaffRole(tcmSelectedStaff) : ""}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">Locked</span>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                              <Input
                                className="pl-8"
                                placeholder="Type name to search..."
                                value={tcmStaffSearch}
                                onChange={(e) => handleTcmStaffSearch(e.target.value)}
                              />
                            </div>
                            {tcmStaffSearching && (
                              <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                            )}
                            {tcmStaffResults.length > 0 && !tcmSelectedStaff && (
                              <div className="border rounded-md mt-1 max-h-40 overflow-y-auto">
                                {tcmStaffResults.map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
                                    onClick={() => {
                                      setTcmSelectedStaff(s);
                                      setTcmStaffSearch(s.name);
                                      setTcmStaffResults([]);
                                    }}
                                  >
                                    <span>{s.name}</span>
                                    <Badge variant="secondary" className="text-xs ml-2">{getTcmStaffRole(s)}</Badge>
                                  </button>
                                ))}
                              </div>
                            )}
                            {tcmSelectedStaff && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{tcmSelectedStaff.name}</Badge>
                                <Badge variant="secondary" className="text-xs">{getTcmStaffRole(tcmSelectedStaff)}</Badge>
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground underline"
                                  onClick={() => {
                                    setTcmSelectedStaff(null); setTcmStaffSearch("");
                                    setTcmSelectedProgramId(""); setTcmSelectedClassId("");
                                    setTcmClassSubjects([]); setTcmSelectedSubjectIds(new Set());
                                  }}
                                >Change</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {tcmSelectedStaff && (
                        <div>
                          <Label>Session (Optional)</Label>
                          <Select
                            value={tcmDialogSessionId || "none"}
                            onValueChange={(v) => setTcmDialogSessionId(v === "none" ? "" : v)}
                          >
                            <SelectTrigger><SelectValue placeholder="No session" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">All Sessions</SelectItem>
                              {academicSessions.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {tcmSelectedStaff && (
                        <div>
                          <Label>Program</Label>
                          <Select
                            value={tcmSelectedProgramId || "all"}
                            onValueChange={(v) => {
                              setTcmSelectedProgramId(v);
                              setTcmSelectedClassId("");
                              setTcmClassSubjects([]);
                              setTcmSelectedSubjectIds(new Set());
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="All Programs" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Programs</SelectItem>
                              {programs.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {tcmSelectedStaff && (
                        <div>
                          <Label>Class *</Label>
                          <Select
                            value={tcmSelectedClassId}
                            onValueChange={(v) => {
                              setTcmSelectedClassId(v);
                              setTcmSelectedSectionId("");
                              setTcmSelectedSubjectIds(new Set());
                              loadTcmClassSubjects(v);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>
                              {classes
                                .filter((c) =>
                                  !tcmSelectedProgramId || tcmSelectedProgramId === "all" ||
                                  c.programId === Number(tcmSelectedProgramId)
                                )
                                .map((c) => {
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
                      )}
                      {tcmSelectedClassId && (
                        <div>
                          <Label>Section (Optional)</Label>
                          <Select
                            value={tcmSelectedSectionId || "all"}
                            onValueChange={(v) => setTcmSelectedSectionId(v === "all" ? "" : v)}
                          >
                            <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All sections</SelectItem>
                              {sections
                                .filter(s => s.classId === Number(tcmSelectedClassId))
                                .map(s => (
                                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {tcmSelectedClassId && (
                        <div>
                          <Label className="mb-2 block">Subjects for this class *</Label>
                          {tcmClassSubjectsLoading ? (
                            <p className="text-sm text-muted-foreground">Loading subjects...</p>
                          ) : tcmClassSubjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subjects mapped to this class yet.</p>
                          ) : (
                            <div className="border rounded-md max-h-52 overflow-y-auto space-y-1 p-2">
                              {tcmClassSubjects.map((scm) => {
                                const subjectId = scm.subject.id;
                                const subjectName = scm.subject.name;
                                const assignedTeachers = scm.subject.teachers || [];
                                const assignedToThisStaff = assignedTeachers.some((tm) => tm.teacherId === tcmSelectedStaff?.id);
                                const assignedToOther = assignedTeachers.find((tm) => tm.teacherId !== tcmSelectedStaff?.id);
                                const isChecked = tcmSelectedSubjectIds.has(subjectId);
                                return (
                                  <div key={subjectId} className="flex items-center gap-2 py-1">
                                    <Checkbox
                                      id={`tcm-subj-${subjectId}`}
                                      checked={isChecked}
                                      disabled={!!assignedToOther}
                                      onCheckedChange={(checked) => {
                                        setTcmSelectedSubjectIds((prev) => {
                                          const next = new Set(prev);
                                          if (checked) next.add(subjectId);
                                          else next.delete(subjectId);
                                          return next;
                                        });
                                      }}
                                    />
                                    <label
                                      htmlFor={`tcm-subj-${subjectId}`}
                                      className={`text-sm flex-1 ${assignedToOther ? "text-muted-foreground" : "cursor-pointer"}`}
                                    >
                                      {subjectName}
                                    </label>
                                    {assignedToThisStaff && (
                                      <Badge variant="secondary" className="text-xs">Already assigned</Badge>
                                    )}
                                    {assignedToOther && (
                                      <Badge variant="destructive" className="text-xs">
                                        {assignedToOther.teacher?.name || "Other teacher"}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        onClick={handleTcmBulkSubmit}
                        disabled={!tcmSelectedStaff || !tcmSelectedClassId || tcmSelectedSubjectIds.size === 0 || tcmSubmitting}
                      >
                        {tcmSubmitting ? "Assigning..." : "Assign Teacher"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* TCM Session Filter */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Session</Label>
                    <Select value={tcmSessionFilter} onValueChange={setTcmSessionFilter}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {academicSessions.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            <span className="flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label>Search Teacher</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="Filter by teacher name..."
                        value={tcmTableStaffSearch}
                        onChange={(e) => setTcmTableStaffSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Teacher</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Section</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Session</TableHead>
                      <TableHead className="text-right px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClassMappings && teacherClassMappings
                      .filter((m) => {
                        if (!tcmTableStaffSearch.trim()) return true;
                        const teacher = teachers.find((t) => t.id === m.teacherId);
                        return teacher?.name?.toLowerCase().includes(tcmTableStaffSearch.toLowerCase());
                      })
                      .map((m) => {
                      const teacher = teachers.find((t) => t.id === m.teacherId);
                      const cls = classes.find((c) => c.id === m.classId);
                      const prog = programs.find((p) => p.id === cls?.programId);
                      const session = academicSessions.find(s => s.id === m.sessionId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium py-2 px-3 text-sm">{teacher?.name || "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{cls?.name || "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{prog?.name || "—"}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {m.sectionId
                              ? sections.find(s => s.id === m.sectionId)?.name || "—"
                              : <span className="text-muted-foreground text-xs">All sections</span>
                            }
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {session
                              ? <span className="flex items-center gap-1">{session.name}{session.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                              : <span className="text-muted-foreground text-xs">""</span>
                            }
                          </TableCell>
                          <TableCell className="text-right py-2 px-3 text-sm">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => openTcmDetail(m)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => openTcmEdit(m)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent>Remove</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!teacherClassMappings || teacherClassMappings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No teacher-class mappings found.
                        </TableCell>
                      </TableRow>
                    )}
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

          {/* TCM DETAIL DIALOG */}
          <Dialog open={!!tcmViewItem} onOpenChange={(open) => { if (!open) { setTcmViewItem(null); setTcmViewSubjects([]); } }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Teacher Assignment Details</DialogTitle>
              </DialogHeader>
              {tcmViewItem && (() => {
                const teacher = teachers.find(t => t.id === tcmViewItem.teacherId);
                const cls = classes.find(c => c.id === tcmViewItem.classId);
                const prog = programs.find(p => p.id === cls?.programId);
                const section = sections.find(s => s.id === tcmViewItem.sectionId);
                const session = academicSessions.find(s => s.id === tcmViewItem.sessionId);
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                      <div>
                        <Label className="text-xs text-muted-foreground">Teacher</Label>
                        <p className="text-sm font-medium mt-0.5">{teacher?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Class</Label>
                        <p className="text-sm font-medium mt-0.5">{cls?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Program</Label>
                        <p className="text-sm font-medium mt-0.5">{prog?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Section</Label>
                        <p className="text-sm font-medium mt-0.5">{section?.name || <span className="text-muted-foreground">All sections</span>}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Session</Label>
                        <p className="text-sm font-medium mt-0.5">
                          {session
                            ? <span className="flex items-center gap-1">{session.name}{session.isActive && <Badge className="bg-green-500 text-white text-xs py-0 px-1 h-4">Active</Badge>}</span>
                            : <span className="text-muted-foreground">""</span>
                          }
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">Assigned Subjects</Label>
                      {tcmViewSubjectsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading subjects...</p>
                      ) : tcmViewSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects assigned for this session.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="py-2 px-3 text-sm">Subject</TableHead>
                              <TableHead className="py-2 px-3 text-sm">Code</TableHead>
                              <TableHead className="py-2 px-3 text-sm">Credit Hrs</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tcmViewSubjects.map((scm) => (
                              <TableRow key={scm.id}>
                                <TableCell className="py-2 px-3 text-sm">{scm.subject?.name || "—"}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{scm.code || "—"}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{scm.creditHours ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* SCM VIEW DIALOG */}
          <Dialog open={!!scmViewItem} onOpenChange={(open) => { if (!open) setScmViewItem(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Subject-Class Mapping Details</DialogTitle>
              </DialogHeader>
              {scmViewItem && scmViewItem.mappings && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                    <div>
                      <Label className="text-xs text-muted-foreground">Class</Label>
                      <p className="text-sm font-medium mt-0.5">
                        {classes.find(c => c.id === scmViewItem.classId)?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Program</Label>
                      <p className="text-sm font-medium mt-0.5">
                        {programs.find(p => p.id === classes.find(c => c.id === scmViewItem.classId)?.programId)?.name || "—"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Subjects ({scmViewItem.mappings.length})</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-2 px-3 text-sm">Subject</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Code</TableHead>
                          <TableHead className="py-2 px-3 text-sm">Credit Hrs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scmViewItem.mappings.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="py-2 px-3 text-sm">{m.subject?.name || "—"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{m.code || "—"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{m.creditHours ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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

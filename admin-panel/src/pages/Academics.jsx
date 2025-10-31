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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, BookOpen, Users, PlusCircle, Edit, Trash2, Clock, FileText, Printer } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const Academics = () => {
  const {
    programs,
    classes,
    sections,
    subjects,
    teacherMapping,
    teacherClassMapping,
    timetable,
    assignments,
    staff,
    addProgram,
    updateProgram,
    deleteProgram,
    addClass,
    updateClass,
    deleteClass,
    addSection,
    updateSection,
    deleteSection,
    addSubject,
    updateSubject,
    deleteSubject,
    addTeacherMapping,
    updateTeacherMapping,
    deleteTeacherMapping,
    addTeacherClassMapping,
    updateTeacherClassMapping,
    deleteTeacherClassMapping,
    addTimetable,
    updateTimetable,
    deleteTimetable,
    addAssignment,
    updateAssignment,
    deleteAssignment
  } = useData();
  const {
    toast
  } = useToast();
  const [dialog, setDialog] = useState({
    type: "",
    open: false
  });
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [subjectFilterProgram, setSubjectFilterProgram] = useState("all");
  const [subjectFilterClass, setSubjectFilterClass] = useState("all");
  const [timetableFilterClass, setTimetableFilterClass] = useState("all");
  const [programForm, setProgramForm] = useState({
    programName: "",
    duration: "",
    description: ""
  });
  const [classForm, setClassForm] = useState({
    className: "",
    programId: "",
    sectionCount: ""
  });
  const [sectionForm, setSectionForm] = useState({
    sectionName: "",
    classId: "",
    capacity: ""
  });
  const [subjectForm, setSubjectForm] = useState({
    subjectName: "",
    subjectCode: "",
    classId: "",
    teacherId: ""
  });
  const [mappingForm, setMappingForm] = useState({
    teacherId: "",
    teacherName: "",
    subject: "",
    program: "",
    classes: []
  });
  const [classMappingForm, setClassMappingForm] = useState({
    teacherId: "",
    teacherName: "",
    program: "",
    className: "",
    section: "",
    role: "Class Teacher",
    photo: ""
  });
  const [timetableForm, setTimetableForm] = useState({
    program: "",
    class: "",
    section: "",
    day: "Monday",
    period: 1,
    subject: "",
    teacherId: "",
    teacherName: "",
    startTime: "",
    endTime: ""
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subjectId: "",
    classId: "",
    dueDate: "",
    description: ""
  });
  const handleSubmit = type => {
    const forms = {
      program: {
        form: programForm,
        setForm: setProgramForm,
        add: addProgram,
        update: updateProgram,
        initial: {
          programName: "",
          duration: "",
          description: ""
        }
      },
      class: {
        form: classForm,
        setForm: setClassForm,
        add: addClass,
        update: updateClass,
        initial: {
          className: "",
          programId: "",
          sectionCount: ""
        },
        transform: data => ({
          ...data,
          sectionCount: Number(data.sectionCount)
        })
      },
      section: {
        form: sectionForm,
        setForm: setSectionForm,
        add: addSection,
        update: updateSection,
        initial: {
          sectionName: "",
          classId: "",
          capacity: ""
        },
        transform: data => ({
          ...data,
          capacity: Number(data.capacity)
        })
      },
      subject: {
        form: subjectForm,
        setForm: setSubjectForm,
        add: addSubject,
        update: updateSubject,
        initial: {
          subjectName: "",
          subjectCode: "",
          classId: "",
          teacherId: ""
        }
      },
      mapping: {
        form: mappingForm,
        setForm: setMappingForm,
        add: addTeacherMapping,
        update: updateTeacherMapping,
        initial: {
          teacherName: "",
          subjectId: "",
          classId: "",
          sectionId: ""
        }
      },
      classMapping: {
        form: classMappingForm,
        setForm: setClassMappingForm,
        add: addTeacherClassMapping,
        update: updateTeacherClassMapping,
        initial: {
          teacherId: "",
          teacherName: "",
          program: "",
          className: "",
          section: "",
          role: "Class Teacher",
          photo: ""
        }
      },
      timetable: {
        form: timetableForm,
        setForm: setTimetableForm,
        add: addTimetable,
        update: updateTimetable,
        initial: {
          classId: "",
          sectionId: "",
          subjectId: "",
          teacherId: "",
          day: "",
          timeSlot: ""
        }
      },
      assignment: {
        form: assignmentForm,
        setForm: setAssignmentForm,
        add: addAssignment,
        update: updateAssignment,
        initial: {
          title: "",
          subjectId: "",
          classId: "",
          dueDate: "",
          description: ""
        }
      }
    };
    const config = forms[type];
    if (!config) return;
    const data = config.transform ? config.transform(config.form) : config.form;
    if (editing) {
      config.update(editing.id, data);
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
      });
    } else {
      config.add(data);
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`
      });
    }
    setDialog({
      type: "",
      open: false
    });
    setEditing(null);
    config.setForm(config.initial);
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    const deleteMap = {
      program: deleteProgram,
      class: deleteClass,
      section: deleteSection,
      subject: deleteSubject,
      mapping: deleteTeacherMapping,
      classMapping: deleteTeacherClassMapping,
      timetable: deleteTimetable,
      assignment: deleteAssignment
    };
    deleteMap[deleteTarget.type](deleteTarget.id);
    toast({
      title: `${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted successfully`
    });
    setDeleteDialog(false);
    setDeleteTarget(null);
  };
  const openEdit = (type, item) => {
    setEditing(item);
    const setters = {
      program: setProgramForm,
      class: setClassForm,
      section: setSectionForm,
      subject: setSubjectForm,
      mapping: setMappingForm,
      classMapping: setClassMappingForm,
      timetable: setTimetableForm,
      assignment: setAssignmentForm
    };
    setters[type](item);
    setDialog({
      type,
      open: true
    });
  };
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Academic Management</h2>
          <p className="text-primary-foreground/90">
            Manage programs, subjects, timetables, and assignments
          </p>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="mapping">Teacher Mapping</TabsTrigger>
            <TabsTrigger value="classMapping">Class Teachers</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Programs
                </CardTitle>
                <Dialog open={dialog.type === "program" && dialog.open} onOpenChange={open => setDialog({
                type: "program",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setProgramForm({
                      programName: "",
                      duration: "",
                      description: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Program" : "Add Program"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Program Name</Label>
                        <Input value={programForm.programName} onChange={e => setProgramForm({
                        ...programForm,
                        programName: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Duration</Label>
                        <Input value={programForm.duration} onChange={e => setProgramForm({
                        ...programForm,
                        duration: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input value={programForm.description} onChange={e => setProgramForm({
                        ...programForm,
                        description: e.target.value
                      })} />
                      </div>
                      <Button onClick={() => handleSubmit("program")} className="w-full">{editing ? "Update" : "Add"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map(program => <TableRow key={program.id}>
                        <TableCell>{program.programName}</TableCell>
                        <TableCell>{program.duration}</TableCell>
                        <TableCell>{program.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit("program", program)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "program",
                              id: program.id
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

          <TabsContent value="classes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Classes
                </CardTitle>
                <Dialog open={dialog.type === "class" && dialog.open} onOpenChange={open => setDialog({
                type: "class",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setClassForm({
                      className: "",
                      programId: "",
                      sectionCount: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Class" : "Add Class"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Class Name</Label>
                        <Input value={classForm.className} onChange={e => setClassForm({
                        ...classForm,
                        className: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Program</Label>
                        <Select value={classForm.programId} onValueChange={value => setClassForm({
                        ...classForm,
                        programId: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map(program => <SelectItem key={program.id} value={program.id}>{program.programName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Section Count</Label>
                        <Input type="number" value={classForm.sectionCount} onChange={e => setClassForm({
                        ...classForm,
                        sectionCount: e.target.value
                      })} />
                      </div>
                      <Button onClick={() => handleSubmit("class")} className="w-full">{editing ? "Update" : "Add"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Sections</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map(cls => {
                    const program = programs.find(p => p.id === cls.programId);
                    return <TableRow key={cls.id}>
                          <TableCell>{cls.className}</TableCell>
                          <TableCell>{program?.programName}</TableCell>
                          <TableCell>{cls.sectionCount}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("class", {
                            ...cls,
                            sectionCount: cls.sectionCount.toString()
                          })}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "class",
                              id: cls.id
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

          <TabsContent value="sections">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sections</CardTitle>
                <Dialog open={dialog.type === "section" && dialog.open} onOpenChange={open => setDialog({
                type: "section",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setSectionForm({
                      sectionName: "",
                      classId: "",
                      capacity: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Section" : "Add Section"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Section Name</Label>
                        <Input value={sectionForm.sectionName} onChange={e => setSectionForm({
                        ...sectionForm,
                        sectionName: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>Class</Label>
                        <Select value={sectionForm.classId} onValueChange={value => setSectionForm({
                        ...sectionForm,
                        classId: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.className}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Capacity</Label>
                        <Input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({
                        ...sectionForm,
                        capacity: e.target.value
                      })} />
                      </div>
                      <Button onClick={() => handleSubmit("section")} className="w-full">{editing ? "Update" : "Add"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map(section => {
                    const cls = classes.find(c => c.id === section.classId);
                    return <TableRow key={section.id}>
                          <TableCell>{section.sectionName}</TableCell>
                          <TableCell>{cls?.className}</TableCell>
                          <TableCell>{section.capacity}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("section", {
                            ...section,
                            capacity: section.capacity.toString()
                          })}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "section",
                              id: section.id
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

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subjects</CardTitle>
                <Button onClick={() => {
                setEditing(null);
                setSubjectForm({
                  subjectName: "",
                  subjectCode: "",
                  classId: "",
                  teacherId: ""
                });
                setDialog({
                  type: "subject",
                  open: true
                });
              }}>
                  <PlusCircle className="w-4 h-4 mr-2" />Add Subject
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Label>Filter by Program</Label>
                    <Select value={subjectFilterProgram} onValueChange={val => {
                    setSubjectFilterProgram(val);
                    setSubjectFilterClass("all");
                  }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.programName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Filter by Class</Label>
                    <Select value={subjectFilterClass} onValueChange={setSubjectFilterClass}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.filter(c => subjectFilterProgram === "all" || c.programId === subjectFilterProgram).map(c => <SelectItem key={c.id} value={c.id}>{c.className}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.filter(subject => {
                    const cls = classes.find(c => c.id === subject.classId);
                    if (subjectFilterClass !== "all" && subject.classId !== subjectFilterClass) return false;
                    if (subjectFilterProgram !== "all" && cls?.programId !== subjectFilterProgram) return false;
                    return true;
                  }).map(subject => {
                    const cls = classes.find(c => c.id === subject.classId);
                    const prog = programs.find(p => p.id === cls?.programId);
                    return <TableRow key={subject.id}>
                          <TableCell>{subject.subjectName}</TableCell>
                          <TableCell>{subject.subjectCode}</TableCell>
                          <TableCell>{cls?.className}</TableCell>
                          <TableCell>{prog?.programName}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit("subject", subject)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => {
                            setDeleteTarget({
                              type: "subject",
                              id: subject.id
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

          <TabsContent value="mapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teacher Subject Mapping
                </CardTitle>
                <Dialog open={dialog.type === "mapping" && dialog.open} onOpenChange={open => setDialog({
                type: "mapping",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setMappingForm({
                      teacherId: "",
                      teacherName: "",
                      subject: "",
                      program: "",
                      classes: []
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Mapping
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Mapping" : "Add Teacher Mapping"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Teacher</Label>
                        <Select value={mappingForm.teacherId} onValueChange={value => {
                        const teacher = staff.find(s => s.id === value);
                        setMappingForm({
                          ...mappingForm,
                          teacherId: value,
                          teacherName: teacher?.name || ""
                        });
                      }}>
                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                          <SelectContent>
                            {staff.filter(s => s.designation === "Teacher").map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Input value={mappingForm.subject} onChange={e => setMappingForm({
                        ...mappingForm,
                        subject: e.target.value
                      })} placeholder="Enter subject name" />
                      </div>
                      <div>
                        <Label>Program</Label>
                        <Select value={mappingForm.program} onValueChange={value => setMappingForm({
                        ...mappingForm,
                        program: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {programs.map(program => <SelectItem key={program.id} value={program.programName}>{program.programName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Classes (comma separated)</Label>
                        <Input value={mappingForm.classes.join(", ")} onChange={e => setMappingForm({
                        ...mappingForm,
                        classes: e.target.value.split(",").map(c => c.trim()).filter(Boolean)
                      })} placeholder="e.g., XI, XII" />
                      </div>
                      <Button onClick={() => handleSubmit("mapping")} className="w-full">{editing ? "Update" : "Add"}</Button>
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
                      <TableHead>Program</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherMapping.map(mapping => <TableRow key={mapping.id}>
                        <TableCell>{mapping.teacherName}</TableCell>
                        <TableCell>{mapping.subject}</TableCell>
                        <TableCell>{mapping.program}</TableCell>
                        <TableCell>{mapping.classes.join(", ")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit("mapping", mapping)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                          setDeleteTarget({
                            type: "mapping",
                            id: mapping.id
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classMapping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teacher-Class Mapping
                </CardTitle>
                <Dialog open={dialog.type === "classMapping" && dialog.open} onOpenChange={open => setDialog({
                type: "classMapping",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setClassMappingForm({
                      teacherId: "",
                      teacherName: "",
                      program: "",
                      className: "",
                      section: "",
                      role: "Class Teacher",
                      photo: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Assign Class Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Class Teacher" : "Assign Class Teacher"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Teacher</Label>
                        <Select value={classMappingForm.teacherId} onValueChange={value => {
                        const teacher = staff.find(s => s.id === value);
                        setClassMappingForm({
                          ...classMappingForm,
                          teacherId: value,
                          teacherName: teacher?.name || "",
                          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.name || "teacher"}`
                        });
                      }}>
                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                          <SelectContent>
                            {staff.filter(s => s.designation === "Teacher").map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Program</Label>
                        <Select value={classMappingForm.program} onValueChange={value => setClassMappingForm({
                        ...classMappingForm,
                        program: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {programs.map(program => <SelectItem key={program.id} value={program.programName}>{program.programName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Class</Label>
                        <Select value={classMappingForm.className} onValueChange={value => setClassMappingForm({
                        ...classMappingForm,
                        className: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {classes.map(cls => <SelectItem key={cls.id} value={cls.className}>{cls.className}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Select value={classMappingForm.section} onValueChange={value => setClassMappingForm({
                        ...classMappingForm,
                        section: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                          <SelectContent>
                            {sections.map(section => <SelectItem key={section.id} value={section.sectionName}>{section.sectionName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={classMappingForm.role} onValueChange={value => setClassMappingForm({
                        ...classMappingForm,
                        role: value
                      })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                            <SelectItem value="Assistant Teacher">Assistant Teacher</SelectItem>
                            <SelectItem value="Class Coordinator">Class Coordinator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={() => handleSubmit("classMapping")} className="w-full">{editing ? "Update" : "Assign"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClassMapping.map(mapping => <TableRow key={mapping.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={mapping.photo} alt={mapping.teacherName} />
                              <AvatarFallback>{mapping.teacherName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{mapping.teacherName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{mapping.program}</TableCell>
                        <TableCell>{mapping.className}</TableCell>
                        <TableCell>{mapping.section}</TableCell>
                        <TableCell>{mapping.role}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit("classMapping", mapping)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                          setDeleteTarget({
                            type: "classMapping",
                            id: mapping.id
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timetable
                </CardTitle>
                <Dialog open={dialog.type === "timetable" && dialog.open} onOpenChange={open => setDialog({
                type: "timetable",
                open
              })}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                    setEditing(null);
                    setTimetableForm({
                      program: "",
                      class: "",
                      section: "",
                      day: "Monday",
                      period: 1,
                      subject: "",
                      teacherId: "",
                      teacherName: "",
                      startTime: "",
                      endTime: ""
                    });
                  }}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Timetable Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editing ? "Edit Timetable" : "Add Timetable Entry"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Program</Label>
                        <Select value={timetableForm.program} onValueChange={value => setTimetableForm({
                        ...timetableForm,
                        program: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {programs.map(program => <SelectItem key={program.id} value={program.programName}>{program.programName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Class</Label>
                        <Input value={timetableForm.class} onChange={e => setTimetableForm({
                        ...timetableForm,
                        class: e.target.value
                      })} placeholder="e.g., XI" />
                      </div>
                      <div>
                        <Label>Section</Label>
                        <Input value={timetableForm.section} onChange={e => setTimetableForm({
                        ...timetableForm,
                        section: e.target.value
                      })} placeholder="e.g., A" />
                      </div>
                      <div>
                        <Label>Subject</Label>
                        <Input value={timetableForm.subject} onChange={e => setTimetableForm({
                        ...timetableForm,
                        subject: e.target.value
                      })} placeholder="Subject name" />
                      </div>
                      <div>
                        <Label>Teacher</Label>
                        <Select value={timetableForm.teacherId} onValueChange={value => {
                        const teacher = staff.find(s => s.id === value);
                        setTimetableForm({
                          ...timetableForm,
                          teacherId: value,
                          teacherName: teacher?.name || ""
                        });
                      }}>
                          <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                          <SelectContent>
                            {staff.filter(s => s.designation === "Teacher").map(teacher => <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Day</Label>
                        <Select value={timetableForm.day} onValueChange={value => setTimetableForm({
                        ...timetableForm,
                        day: value
                      })}>
                          <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monday">Monday</SelectItem>
                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                            <SelectItem value="Thursday">Thursday</SelectItem>
                            <SelectItem value="Friday">Friday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Period</Label>
                        <Input type="number" min="1" max="8" value={timetableForm.period} onChange={e => setTimetableForm({
                        ...timetableForm,
                        period: parseInt(e.target.value) || 1
                      })} />
                      </div>
                      <div>
                        <Label>Start Time</Label>
                        <Input type="time" value={timetableForm.startTime} onChange={e => setTimetableForm({
                        ...timetableForm,
                        startTime: e.target.value
                      })} />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input type="time" value={timetableForm.endTime} onChange={e => setTimetableForm({
                        ...timetableForm,
                        endTime: e.target.value
                      })} />
                      </div>
                      <Button onClick={() => handleSubmit("timetable")} className="w-full">{editing ? "Update" : "Add"}</Button>
                    </div>
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
                      {classes.map(c => <SelectItem key={c.id} value={c.className}>{c.className}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {Array.from(new Set(timetable.map(t => `${t.class}-${t.section}`))).filter(classSection => {
                const [className] = classSection.split('-');
                return timetableFilterClass === "all" || className === timetableFilterClass;
              }).map(classSection => {
                const [className, sectionName] = classSection.split('-');
                const classTimetable = timetable.filter(t => t.class === className && t.section === sectionName);
                return <Card key={classSection} className="mb-6">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{classSection} Timetable</CardTitle>
                          <Button size="sm" onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                        const periods = [1, 2, 3, 4, 5, 6, 7, 8];
                        printWindow.document.write(`
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Timetable - ${classSection}</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 40px; }
                                    .header { text-align: center; margin-bottom: 30px; }
                                    table { width: 100%; border-collapse: collapse; }
                                    th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px; }
                                    th { background-color: #f0f0f0; font-weight: bold; }
                                    @media print { body { padding: 20px; } }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>CLASS TIMETABLE</h1>
                                    <h2>${classSection}</h2>
                                  </div>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Period</th>
                                        ${days.map(day => `<th>${day}</th>`).join('')}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${periods.map(period => `
                                        <tr>
                                          <td><strong>${period}</strong></td>
                                          ${days.map(day => {
                          const entry = classTimetable.find(t => t.day === day && t.period === period);
                          return `<td>${entry ? `${entry.subject}<br/>${entry.teacherName}<br/>${entry.startTime}-${entry.endTime}` : '-'}</td>`;
                        }).join('')}
                                        </tr>
                                      `).join('')}
                                    </tbody>
                                  </table>
                                </body>
                              </html>
                            `);
                        printWindow.document.close();
                        printWindow.onload = function () {
                          printWindow.print();
                        };
                      }}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Timetable
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Day</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Teacher</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classTimetable.sort((a, b) => {
                          const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                          const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                          return dayDiff !== 0 ? dayDiff : a.period - b.period;
                        }).map(entry => <TableRow key={entry.id}>
                                <TableCell>{entry.day}</TableCell>
                                <TableCell>{entry.period}</TableCell>
                                <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                                <TableCell>{entry.subject}</TableCell>
                                <TableCell>{entry.teacherName}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit("timetable", entry)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => {
                                setDeleteTarget({
                                  type: "timetable",
                                  id: entry.id
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
                      </CardContent>
                    </Card>;
              })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Assignment management functionality</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={dialog.type === "subject" && dialog.open} onOpenChange={open => setDialog({
        type: "subject",
        open
      })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject Name</Label>
                <Input value={subjectForm.subjectName} onChange={e => setSubjectForm({
                ...subjectForm,
                subjectName: e.target.value
              })} />
              </div>
              <div>
                <Label>Subject Code</Label>
                <Input value={subjectForm.subjectCode} onChange={e => setSubjectForm({
                ...subjectForm,
                subjectCode: e.target.value
              })} />
              </div>
              <div>
                <Label>Class</Label>
                <Select value={subjectForm.classId} onValueChange={value => setSubjectForm({
                ...subjectForm,
                classId: value
              })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.className}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSubmit("subject")} className="w-full">{editing ? "Update" : "Add"}</Button>
            </div>
          </DialogContent>
        </Dialog>

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
      </div>
    </DashboardLayout>;
};
export default Academics;
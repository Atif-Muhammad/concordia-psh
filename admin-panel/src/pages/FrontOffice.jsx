import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  UserPlus,
  Users,
  MessageSquare,
  Phone,
  Edit,
  Trash2,
  Eye,
  Plus,
  Check,
  X,
  CalendarIcon,
  Badge as BadgeIcon,
  Undo2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInquiry,
  getProgramNames,
  updateInquiry,
  delInquiry,
  getInquiries,
  getVisitors,
  createVisitor,
  updateVisitor,
  delVisitor,
  delComplaint as delComplaintApi,
  updateComplaint as updateComplaintApi,
  createComplaint as createComplaintApi,
  getComplaints,
  getContacts,
  createContact as createContactApi,
  updateContact as UpdateContactApi,
  delContact,
  createStudent,
  getClasseNames,
  getSectionNames,
  getClasses,
  getSections,
  rollbackInquiry,
} from "../../config/apis";
import { formatTime } from "../lib/utils";

const FrontOffice = () => {

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // === STATE ===
  const [inquiryDialog, setInquiryDialog] = useState(false);
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [complaintDialog, setComplaintDialog] = useState(false);
  const [contactDialog, setContactDialog] = useState(false);

  const [editingInquiry, setEditingInquiry] = useState(null);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editingContact, setEditingContact] = useState(null);

  const [dateOpen, setDateOpen] = useState(false)

  const [selectedProgram, setSelectedProgram] = useState("");

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    id: "",
  });

  const [viewDetailsDialog, setViewDetailsDialog] = useState({
    open: false,
    type: "",
    data: null,
  });
  const [acceptInquiryDialog, setAcceptInquiryDialog] = useState(false);
  const [selectedInquiryForAccept, setSelectedInquiryForAccept] = useState(null);
  const [rollbackDialog, setRollbackDialog] = useState(false);
  const [selectedInquiryForRollback, setSelectedInquiryForRollback] = useState(null);
  const [studentFormData, setStudentFormData] = useState({
    rollNumber: "",
    classId: "",
    sectionId: "",
    gender: "",
    dob: "",
    documents: "{}",
  });

  // === FORM STATES ===
  const [inquiryForm, setInquiryForm] = useState({
    studentName: "",
    fatherName: "",
    fatherCnic: "",
    contactNumber: "",
    email: "",
    address: "",
    programInterest: "",
    previousInstitute: "",
    remarks: "",
  });

  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    phoneNumber: "",
    ID: "",
    purpose: "",
    persons: "",
    visitDate: new Date().toISOString().split("T")[0],
    inTime: "",
    outTime: "",
    remarks: "",
  });

  const [complaintForm, setComplaintForm] = useState({
    type: "Student",
    complainantName: "",
    contact: "",
    details: "",
    subject: "",
    status: "Pending",

  });

  const [contactForm, setContactForm] = useState({
    name: "",
    category: "Emergency",
    phone: "",
    email: "",
    details: "",
  });


  const [categoryFilter, setCategoryFilter] = useState("All");
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses, // Changed from getClasseNames to get full objects
  });
  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections, // Changed from getSectionNames to get full objects
  });

  // === FETCH DATA ===
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getProgramNames,
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ["inquiries", selectedProgram],
    queryFn: () => getInquiries(selectedProgram || undefined),
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery({
    queryKey: ["visitors"],
    queryFn: getVisitors,
    onError: (err) =>
      toast({
        title: err.message || "Failed to load visitors",
        variant: "destructive",
      }),
  });

  // === MUTATIONS ===
  // Inquiry
  const createMutation = useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      toast({ title: "Inquiry added successfully" });
      queryClient.invalidateQueries(["inquiries"]);
      closeInquiryDialog();
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to add inquiry", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateInquiry(id, payload),
    onSuccess: () => {
      toast({ title: "Inquiry updated successfully" });
      queryClient.invalidateQueries(["inquiries"]);
      closeInquiryDialog();
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to update inquiry", variant: "destructive" }),
  });

  const deleteInqMutation = useMutation({
    mutationFn: delInquiry,
    onSuccess: () => {
      toast({ title: "Inquiry deleted" });
      queryClient.invalidateQueries(["inquiries"]);
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to delete inquiry", variant: "destructive" }),
  });
  const rejectInquiryMutation = useMutation({
    mutationFn: ({ id, currentStatus }) =>
      updateInquiry(id, { status: currentStatus === "REJECTED" ? "NEW" : "REJECTED" }),
    onSuccess: (_, variables) => {
      const action = variables.currentStatus === "REJECTED" ? "reverted to NEW" : "rejected";
      toast({ title: `Inquiry ${action} successfully` });
      queryClient.invalidateQueries(["inquiries"]);
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to update inquiry", variant: "destructive" }),
  });
  //Accept Inquiry (Create Student + Update Inquiry)
  const acceptInquiryMutation = useMutation({
    mutationFn: async ({ studentData, inquiryId }) => {
      // Include inquiryId in studentData
      const studentWithInquiry = { ...studentData, inquiryId: String(inquiryId) };
      const student = await createStudent(studentWithInquiry);
      await updateInquiry(inquiryId, { status: "APPROVED" });
      return student;
    },
    onSuccess: () => {
      toast({ title: "Student created and inquiry approved successfully" });
      queryClient.invalidateQueries(["inquiries"]);
      closeAcceptInquiryDialog();
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to create student", variant: "destructive" }),
  });

  // Rollback Inquiry
  const rollbackInquiryMutation = useMutation({
    mutationFn: (inquiryId) => rollbackInquiry(inquiryId),
    onSuccess: () => {
      toast({ title: "Inquiry rolled back successfully" });
      queryClient.invalidateQueries(["inquiries"]);
      setRollbackDialog(false);
      setSelectedInquiryForRollback(null);
    },
    onError: (error) => {
      toast({
        title: error.message || "Failed to rollback inquiry",
        variant: "destructive",
      });
    },
  });

  // Visitor
  const createVisitorMutation = useMutation({
    mutationFn: createVisitor,
    onSuccess: () => {
      toast({ title: "Visitor recorded successfully" });
      queryClient.invalidateQueries(["visitors"]);
      closeVisitorDialog();
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to record visitor", variant: "destructive" }),
  });

  const updateVisitorMutation = useMutation({
    mutationFn: ({ id, payload }) => updateVisitor(id, payload),
    onSuccess: () => {
      toast({ title: "Visitor updated successfully" });
      queryClient.invalidateQueries(["visitors"]);
      closeVisitorDialog();
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to update visitor", variant: "destructive" }),
  });

  const deleteVisitorMutation = useMutation({
    mutationFn: delVisitor,
    onSuccess: () => {
      toast({ title: "Visitor deleted" });
      queryClient.invalidateQueries(["visitors"]);
      setDeleteDialog({ open: false, type: "", id: "" });
    },
    onError: (err) =>
      toast({ title: err.message || "Failed to delete visitor", variant: "destructive" }),
  });


  // complaints
  const [dateFilter, setDateFilter] = useState();
  const { data: complaints } = useQuery({
    queryKey: ["complaints", dateFilter],
    queryFn: () => getComplaints(dateFilter),
    enabled: !!dateFilter
  });

  const { mutate: createComplaint } = useMutation({
    mutationFn: createComplaintApi,
    onSuccess: () => {
      toast({ title: "Complaint registered successfully" });
      queryClient.invalidateQueries(["complaints"])
    },
    onError: (err) => {
      toast({ title: err.message || "Complaint registration failed", variant: "destructive" });
    },
  });

  const { mutate: updateComplaint } = useMutation({
    mutationFn: ({ id, payload }) => updateComplaintApi(id, payload),
    onSuccess: () => {
      toast({ title: "Complaint updated successfully" });
      queryClient.invalidateQueries(["complaints"])
    },
    onError: (err) => {
      toast({ title: err.message || "Complaint registration failed", variant: "destructive" });
    },
  });

  const { mutate: deleteComplaint } = useMutation({
    mutationFn: delComplaintApi,
    onSuccess: () => queryClient.invalidateQueries(["complaints"]),
  });


  // contact
  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getContacts(),
  });

  const { mutate: createContact } = useMutation({
    mutationFn: createContactApi,
    onSuccess: () => {
      closeContactDialog();
      toast({ title: "contact created successfully" });
      queryClient.invalidateQueries(["contacts"])
    },
    onError: (err) => {
      toast({ title: err.message || "contact creation failed", variant: "destructive" });
    },
  });

  const { mutate: updateContact } = useMutation({
    mutationFn: ({ id, payload }) => UpdateContactApi(id, payload),
    onSuccess: () => {
      closeContactDialog();
      toast({ title: "contact updated successfully" });
      queryClient.invalidateQueries(["contacts"])
    },
    onError: (err) => {
      toast({ title: err.message || "contacts creation failed", variant: "destructive" });
    },
  });

  const { mutate: deleteContact } = useMutation({
    mutationFn: delContact,
    onSuccess: () => queryClient.invalidateQueries(["contacts"]),
  });

  const handleDateSelect = (date) => {
    if (!date) {
      setDateFilter(undefined);
      return;
    }

    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    setDateFilter(localDate);
  };


  // === FORM RESET & DIALOG CONTROL ===
  const closeInquiryDialog = () => {
    setInquiryForm({
      studentName: "",
      fatherName: "",
      fatherCnic: "",
      contactNumber: "",
      email: "",
      address: "",
      programInterest: "",
      previousInstitute: "",
      remarks: "",
    });
    setEditingInquiry(null);
    setInquiryDialog(false);
  };

  const closeVisitorDialog = () => {
    setVisitorForm({
      visitorName: "",
      phoneNumber: "",
      ID: "",
      purpose: "",
      persons: "",
      visitDate: new Date().toISOString().split("T")[0],
      inTime: "",
      outTime: "",
      remarks: "",
    });
    setEditingVisitor(null);
    setVisitorDialog(false);
  };

  const closeComplaintDialog = () => {
    setComplaintForm({
      type: "Student",
      complainantName: "",
      contact: "",
      details: "",
      subject: "",
      status: "Pending",
    });
    setEditingComplaint(null);
    setComplaintDialog(false);
  };

  const closeContactDialog = () => {
    setContactForm({
      name: "",
      category: "Emergency",
      phone: "",
      email: "",
      details: "",
    });
    setEditingContact(null);
    setContactDialog(false);
  };

  // === HANDLERS ===
  const handleInquirySubmit = () => {
    if (!inquiryForm.studentName || !inquiryForm.contactNumber) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    if (editingInquiry) {
      updateMutation.mutate({ id: editingInquiry.id, payload: inquiryForm });
    } else {
      createMutation.mutate({ ...inquiryForm, status: "NEW" });
    }
  };

  const handleEditInquiry = (inquiry) => {
    setInquiryForm({
      studentName: inquiry.studentName,
      fatherName: inquiry.fatherName,
      fatherCnic: inquiry.fatherCnic,
      contactNumber: inquiry.contactNumber,
      email: inquiry.email,
      address: inquiry.address,
      programInterest: inquiry.programInterest || inquiry.program?.id || "",
      previousInstitute: inquiry.previousInstitute,
      remarks: inquiry.remarks,
    });
    setEditingInquiry(inquiry);
    setInquiryDialog(true);
  };

  const handleRejectInquiry = (inquiry) => {
    rejectInquiryMutation.mutate({
      id: inquiry.id,
      currentStatus: inquiry.status,
    });
  };
  // Handle Accept Inquiry - Open Dialog
  const handleAcceptInquiry = (inquiry) => {
    setSelectedInquiryForAccept(inquiry);

    setStudentFormData({
      rollNumber: "",
      classId: "",
      sectionId: "",
      gender: "",
      dob: "",
      documents: JSON.stringify({
        fatherCnic: inquiry.fatherCnic || "",
        address: inquiry.address || "",
        previousInstitute: inquiry.previousInstitute || "",
      }),
    });
    setAcceptInquiryDialog(true);
  };
  // Confirm Accept - Create Student
  const handleConfirmAccept = () => {
    if (!selectedInquiryForAccept) return;
    // Validate required fields
    if (!studentFormData.rollNumber || !studentFormData.classId ||
      !studentFormData.gender || !studentFormData.dob) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }
    // Split student name
    const nameParts = selectedInquiryForAccept.studentName.trim().split(/\s+/);
    const fName = nameParts[0] || selectedInquiryForAccept.studentName;
    const mName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : (nameParts.length === 2 ? "" : "");
    const lName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

    const studentData = {
      fName,
      mName: mName || undefined,
      lName: lName || undefined,
      fatherOrguardian: selectedInquiryForAccept.fatherName || "N/A",
      rollNumber: studentFormData.rollNumber,
      parentOrGuardianEmail: selectedInquiryForAccept.email || undefined,
      parentOrGuardianPhone: selectedInquiryForAccept.contactNumber,
      gender: studentFormData.gender,
      dob: studentFormData.dob,
      classId: String(studentFormData.classId), // Convert to string
      programId: String(selectedInquiryForAccept.programInterest || selectedInquiryForAccept.program?.id), // Convert to string
      sectionId: studentFormData.sectionId ? String(studentFormData.sectionId) : undefined, // Convert to string
      documents: studentFormData.documents,
    };

    acceptInquiryMutation.mutate({
      studentData,
      inquiryId: selectedInquiryForAccept.id,
    });
  };
  // Close Accept Inquiry Dialog
  const closeAcceptInquiryDialog = () => {
    setAcceptInquiryDialog(false);
    setSelectedInquiryForAccept(null);
    setStudentFormData({
      rollNumber: "",
      classId: "",
      sectionId: "",
      gender: "",
      dob: "",
      documents: "{}",
    });
  };

  // Rollback Handlers
  const handleRollbackInquiry = (inquiry) => {
    setSelectedInquiryForRollback(inquiry);
    setRollbackDialog(true);
  };

  const confirmRollback = () => {
    if (selectedInquiryForRollback) {
      rollbackInquiryMutation.mutate(selectedInquiryForRollback.id);
    }
  };

  const handleVisitorSubmit = () => {
    if (!visitorForm.visitorName || !visitorForm.phoneNumber || !visitorForm.ID) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const payload = {
      ...visitorForm,
      visitDate: visitorForm.visitDate || new Date().toISOString().split("T")[0],
    };

    if (editingVisitor) {
      updateVisitorMutation.mutate({ id: editingVisitor.id, payload });
    } else {
      createVisitorMutation.mutate(payload);
    }
  };

  const handleEditVisitor = (visitor) => {
    // console.log(visitor.inTime)
    setVisitorForm({
      visitorName: visitor.visitorName,
      phoneNumber: visitor.phone,
      ID: visitor.IDCard,
      purpose: visitor.purpose || "",
      persons: visitor.persons,
      visitDate: visitor.date.split("T")[0],
      inTime: visitor.inTime ? visitor.inTime.split("T")[1].slice(0, 5) : "",
      outTime: visitor.outTime ? visitor.outTime.split("T")[1].slice(0, 5) : "",
      remarks: visitor.remarks || "",
    });
    setEditingVisitor(visitor);
    setVisitorDialog(true);
  };

  const handleComplaintSubmit = () => {
    if (!complaintForm.complainantName || !complaintForm.details) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    if (editingComplaint) {
      updateComplaint(editingComplaint, complaintForm);
    } else {
      createComplaint({
        ...complaintForm,
        status: "Pending",
      });

    }
    closeComplaintDialog();
  };

  const handleEditComplaint = (complaint) => {
    setComplaintForm(complaint);
    setEditingComplaint(complaint);
    setComplaintDialog(true);
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.phone) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    if (editingContact) {
      updateContact({ id: editingContact.id, payload: contactForm });
      toast({ title: "Contact updated successfully" });
    } else {
      createContact(contactForm);
      toast({ title: "Contact added successfully" });
    }

  };

  const handleEditContact = (contact) => {
    setContactForm(contact);
    setEditingContact(contact);
    setContactDialog(true);
  };

  const handleDelete = () => {
    const { type, id } = deleteDialog;
    switch (type) {
      case "inquiry":
        deleteInqMutation.mutate(id);
        break;
      case "visitor":
        deleteVisitorMutation.mutate(id);
        break;
      case "complaint":
        deleteComplaint(id);
        toast({ title: "Complaint deleted" });
        break;
      case "contact":
        deleteContact(id);
        toast({ title: "Contact deleted" });
        break;
    }
    setDeleteDialog({ open: false, type: "", id: "" });
  };
  const filteredContacts = categoryFilter === "All"
    ? contacts
    : contacts.filter(c => c.category === categoryFilter);


  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-200 text-yellow-900";
      case "approved":
      case "resolved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-200 text-red-900";
      case "in-progress":
      case "follow_up":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  const handlePrintTable = () => {
    const content = document.getElementById("printableContacts").innerHTML;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
    <html>
      <head>
        <title>Contacts</title>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          /* HIDE ACTION COLUMN IN PRINT */
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  };



  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Front Office Management</h2>
          <p className="text-primary-foreground/90">
            Handle inquiries, visitors, complaints, and contacts
          </p>
        </div>

        <Tabs defaultValue="inquiry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="inquiry">Inquiry</TabsTrigger>
            <TabsTrigger value="visitor">Visitor Book</TabsTrigger>
            <TabsTrigger value="complaint">Complaints</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* INQUIRY TAB */}
          <TabsContent value="inquiry" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  All Inquiries
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Filter by program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Select a Program</SelectItem>
                      {programs?.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name} — {program.department?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={inquiryDialog} onOpenChange={setInquiryDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={closeInquiryDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Inquiry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingInquiry ? "Edit" : "New"} Inquiry
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Student Name *</Label>
                            <Input
                              value={inquiryForm.studentName}
                              onChange={(e) =>
                                setInquiryForm({ ...inquiryForm, studentName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Father Name</Label>
                            <Input
                              value={inquiryForm.fatherName}
                              onChange={(e) =>
                                setInquiryForm({ ...inquiryForm, fatherName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Father CNIC</Label>
                            <Input
                              value={inquiryForm.fatherCnic}
                              onChange={(e) =>
                                setInquiryForm({ ...inquiryForm, fatherCnic: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contact Number *</Label>
                            <Input
                              value={inquiryForm.contactNumber}
                              onChange={(e) =>
                                setInquiryForm({ ...inquiryForm, contactNumber: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              value={inquiryForm.email}
                              onChange={(e) =>
                                setInquiryForm({ ...inquiryForm, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Program Interest</Label>
                            <Select
                              value={inquiryForm.programInterest}
                              onValueChange={(v) =>
                                setInquiryForm({ ...inquiryForm, programInterest: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                              <SelectContent>
                                {programs?.map((program) => (
                                  <SelectItem key={program.id} value={program.id}>
                                    {program.name} — {program.department?.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input
                            value={inquiryForm.address}
                            onChange={(e) =>
                              setInquiryForm({ ...inquiryForm, address: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Previous Institute</Label>
                          <Input
                            value={inquiryForm.previousInstitute}
                            onChange={(e) =>
                              setInquiryForm({
                                ...inquiryForm,
                                previousInstitute: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Remarks</Label>
                          <Textarea
                            value={inquiryForm.remarks}
                            onChange={(e) =>
                              setInquiryForm({ ...inquiryForm, remarks: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={closeInquiryDialog}>
                          Cancel
                        </Button>
                        <Button onClick={handleInquirySubmit}>
                          {editingInquiry ? "Update" : "Submit"} Inquiry
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {inquiriesLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell>{inquiry.createdAt.split("T")[0]}</TableCell>
                          <TableCell className="font-medium">{inquiry.studentName}</TableCell>
                          <TableCell>{inquiry.fatherName}</TableCell>
                          <TableCell>{inquiry.contactNumber}</TableCell>
                          <TableCell>{inquiry.program?.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                              {inquiry.status || "NEW"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {(inquiry.status === "NEW" || inquiry.status === "REJECTED" || !inquiry.status) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleAcceptInquiry(inquiry)}
                                    title="Accept Inquiry"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRejectInquiry(inquiry)}
                                    title={inquiry.status === "REJECTED" ? "Revert to NEW" : "Reject Inquiry"}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {inquiry.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleRollbackInquiry(inquiry)}
                                  title="Rollback (Delete Student & Revert to NEW)"
                                >
                                  <Undo2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setViewDetailsDialog({
                                    open: true,
                                    type: "inquiry",
                                    data: {
                                      ...inquiry,
                                      programInterest: inquiry.program?.name,
                                      date: inquiry.createdAt.split("T")[0],
                                    },
                                  })
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditInquiry(inquiry)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setDeleteDialog({ open: true, type: "inquiry", id: inquiry.id })
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>

                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VISITOR TAB */}
          <TabsContent value="visitor" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Visitor Log
                </CardTitle>
                <Dialog open={visitorDialog} onOpenChange={setVisitorDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={closeVisitorDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Visitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingVisitor ? "Edit" : "New"} Visitor Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Visitor Name *</Label>
                          <Input
                            value={visitorForm.visitorName}
                            onChange={(e) =>
                              setVisitorForm({ ...visitorForm, visitorName: e.target.value })
                            }
                            placeholder="Enter visitor name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input
                            value={visitorForm.phoneNumber}
                            onChange={(e) =>
                              setVisitorForm({ ...visitorForm, phoneNumber: e.target.value })
                            }
                            placeholder="0300-1234567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ID Card *</Label>
                          <Input
                            value={visitorForm.ID}
                            onChange={(e) =>
                              setVisitorForm({ ...visitorForm, ID: e.target.value })
                            }
                            placeholder="12345-1234567-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Visit Date</Label>
                          <Popover open={dateOpen} onOpenChange={setDateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {visitorForm.visitDate
                                  ? format(new Date(visitorForm.visitDate), "PPP")
                                  : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  visitorForm.visitDate ? new Date(visitorForm.visitDate) : undefined
                                }
                                onSelect={(date) => {
                                  setVisitorForm({
                                    ...visitorForm,
                                    visitDate: date ? date.toLocaleDateString("en-CA") : "",
                                  });
                                  setDateOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* In Time */}
                        <div className="space-y-2">
                          <Label>In Time</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={visitorForm.inTime}
                              onChange={(e) =>
                                setVisitorForm({ ...visitorForm, inTime: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        {/* Out Time */}
                        <div className="space-y-2">
                          <Label>Out Time</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={visitorForm.outTime}
                              onChange={(e) =>
                                setVisitorForm({ ...visitorForm, outTime: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Persons</Label>

                        <Input
                          value={visitorForm.persons}
                          onChange={(e) =>
                            setVisitorForm({ ...visitorForm, persons: e.target.value })
                          }
                          placeholder="Number of visitors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Purpose</Label>
                        <Input
                          value={visitorForm.purpose}
                          onChange={(e) =>
                            setVisitorForm({ ...visitorForm, purpose: e.target.value })
                          }
                          placeholder="Purpose of visit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                          value={visitorForm.remarks}
                          onChange={(e) =>
                            setVisitorForm({ ...visitorForm, remarks: e.target.value })
                          }
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={closeVisitorDialog}>
                        Cancel
                      </Button>
                      <Button onClick={handleVisitorSubmit}>
                        {editingVisitor ? "Update" : "Record"} Visit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {visitorsLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading visitors...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Visitor Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>In Time</TableHead>
                        <TableHead>Out Time</TableHead>
                        <TableHead>Persons</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No visitors recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visitors.map((visitor) => (
                          <TableRow key={visitor.id}>
                            <TableCell>{visitor.date.split("T")[0]}</TableCell>
                            <TableCell className="font-medium truncate max-w-[130px] overflow-hidden whitespace-nowrap">{visitor.visitorName}</TableCell>
                            <TableCell>{visitor.phone}</TableCell>
                            <TableCell className="font-medium truncate max-w-[130px] overflow-hidden whitespace-nowrap">{visitor.purpose || "-"}</TableCell>
                            <TableCell>{formatTime(visitor.inTime)}</TableCell>
                            <TableCell>{formatTime(visitor.outTime)}</TableCell>

                            <TableCell>{visitor.persons}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditVisitor(visitor)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setDeleteDialog({
                                      open: true,
                                      type: "visitor",
                                      id: visitor.id,
                                    })
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPLAINT TAB */}
          <TabsContent value="complaint" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  All Complaints
                </CardTitle>
                <Dialog open={complaintDialog} onOpenChange={setComplaintDialog}>
                  <div className="flex items-center justify-center gap-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          {dateFilter ? dateFilter.toDateString() : "Pick a Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={dateFilter}
                          onSelect={handleDateSelect}
                        />
                      </PopoverContent>
                    </Popover>

                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingComplaint(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Register Complaint
                      </Button>
                    </DialogTrigger>
                  </div>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingComplaint ? "Edit" : "Register"} Complaint</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Complainant Type *</Label>
                          <Select value={complaintForm.type} onValueChange={v => setComplaintForm({ ...complaintForm, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Parent">Parent</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={complaintForm.complainantName}
                            onChange={e => setComplaintForm({ ...complaintForm, complainantName: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label>Contact *</Label>
                          <Input
                            value={complaintForm.contact}
                            onChange={e => setComplaintForm({ ...complaintForm, contact: Number(e.target.value) })}
                          />
                        </div>

                        <div>
                          <Label>Subject *</Label>
                          <Input
                            value={complaintForm.subject}
                            onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Detail *</Label>
                        <Textarea
                          value={complaintForm.details}
                          onChange={e => setComplaintForm({ ...complaintForm, details: e.target.value })}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setComplaintDialog(false)}>Cancel</Button>
                      <Button onClick={handleComplaintSubmit}>
                        {editingComplaint ? "Update" : "Submit"} Complaint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints?.map(complaint => <TableRow key={complaint.id}>
                      <TableCell>{complaint.createdAt.split("T")[0]}</TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell className="font-medium">{complaint.complainantName}</TableCell>
                      <TableCell className="font-medium italic">{complaint.subject}</TableCell>
                      <TableCell>
                        <Select
                          value={complaint.status}
                          onValueChange={(v) =>
                            updateComplaint({
                              id: complaint.id,
                              payload: { ...complaint, status: v },
                            })
                          }
                        >
                          <SelectTrigger className={`w-[130px] ${getStatusColor(complaint.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In_Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setViewDetailsDialog({
                            open: true,
                            type: "complaint",
                            data: complaint
                          })}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditComplaint(complaint)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                            open: true,
                            type: "complaint",
                            id: complaint.id
                          })}>
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

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Directory
                </CardTitle>

                <Dialog open={contactDialog} onOpenChange={setContactDialog}>
                  <div className="flex items-center justify-center gap-x-2">
                    <div className="flex items-center gap-3">
                      {/* CATEGORY FILTER */}
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* PRINT BUTTON */}
                      <Button variant="secondary" onClick={handlePrintTable}>
                        Print
                      </Button>
                    </div>
                    <DialogTrigger asChild>

                      <Button onClick={() => setEditingContact(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>

                  </div>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingContact ? "Edit" : "Add"} Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4" id="printableContacts">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Contact Name *</Label>
                          <Input value={contactForm.name} onChange={e => setContactForm({
                            ...contactForm,
                            name: e.target.value
                          })} placeholder="Enter name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select value={contactForm.category} onValueChange={v => setContactForm({
                            ...contactForm,
                            category: v
                          })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Emergency">Emergency</SelectItem>
                              <SelectItem value="Academic">Academic</SelectItem>
                              <SelectItem value="Technical">Technical</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input value={contactForm.phone} onChange={e => setContactForm({
                            ...contactForm,
                            phone: e.target.value
                          })} placeholder="Enter phone" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={contactForm.email} onChange={e => setContactForm({
                            ...contactForm,
                            email: e.target.value
                          })} placeholder="email@example.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={contactForm.details} onChange={e => setContactForm({
                          ...contactForm,
                          details: e.target.value
                        })} placeholder="Additional details" rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setContactDialog(false)}>Cancel</Button>
                      <Button onClick={handleContactSubmit}>
                        {editingContact ? "Update" : "Add"} Contact
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div id="printableContacts">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="no-print">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts?.map(contact => <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {contact.category}
                          </span>
                        </TableCell>
                        <TableCell>{contact.phone ? contact.phone : "-"}</TableCell>
                        <TableCell>{contact.email ? contact.email : "-"}</TableCell>
                        <TableCell>{contact.details ? contact.details : "-"}</TableCell>
                        <TableCell className="no-print">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditContact(contact)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                              open: true,
                              type: "contact",
                              id: contact.id
                            })}>
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
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({
          ...deleteDialog,
          open
        })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Dialog */}
        <Dialog
          open={viewDetailsDialog.open}
          onOpenChange={(open) =>
            setViewDetailsDialog({ ...viewDetailsDialog, open })
          }
        >
          <DialogContent className="max-h-[90vh] min-w-[80vw] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
            </DialogHeader>

            {viewDetailsDialog.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-2">
                {Object.entries(viewDetailsDialog.data).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start border-b pb-2 gap-x-2 overflow-hidden"
                  >
                    <span className="font-medium capitalize whitespace-nowrap flex-shrink-0">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <span className="text-muted-foreground break-words text-left flex-1 min-w-0">
                      {typeof value === "object" && value?.name
                        ? value.name
                        : String(value ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Accept Inquiry Dialog */}
        <Dialog open={acceptInquiryDialog} onOpenChange={setAcceptInquiryDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Accept Inquiry - Create Student</DialogTitle>
            </DialogHeader>
            {selectedInquiryForAccept && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold">Available Information from Inquiry:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedInquiryForAccept.studentName}</div>
                    <div><span className="font-medium">Father:</span> {selectedInquiryForAccept.fatherName || "N/A"}</div>
                    <div><span className="font-medium">Contact:</span> {selectedInquiryForAccept.contactNumber}</div>
                    <div><span class Name="font-medium">Email:</span> {selectedInquiryForAccept.email || "N/A"}</div>
                    <div><span className="font-medium">Program:</span> {selectedInquiryForAccept.program?.name || "N/A"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-destructive">Required Fields (Please Fill):</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Roll Number *</Label>
                      <Input
                        value={studentFormData.rollNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, rollNumber: e.target.value })}
                        placeholder="e.g., PSH/25-XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Class *</Label>
                      <Select
                        value={studentFormData.classId}
                        onValueChange={(v) => setStudentFormData({ ...studentFormData, classId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes
                            ?.filter((cls) => cls.programId === (selectedInquiryForAccept?.programInterest || selectedInquiryForAccept?.program?.id))
                            .map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section (Optional)</Label>
                      <Select
                        value={studentFormData.sectionId}
                        onValueChange={(v) => setStudentFormData({ ...studentFormData, sectionId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections
                            ?.filter((sec) => sec.classId === studentFormData.classId)
                            .map((sec) => (
                              <SelectItem key={sec.id} value={sec.id}>
                                {sec.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select
                        value={studentFormData.gender}
                        onValueChange={(v) => setStudentFormData({ ...studentFormData, gender: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={studentFormData.dob}
                        onChange={(e) => setStudentFormData({ ...studentFormData, dob: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={closeAcceptInquiryDialog}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAccept} disabled={acceptInquiryMutation.isLoading}>
                {acceptInquiryMutation.isLoading ? "Creating..." : "Create Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rollback Confirmation Dialog */}
        <AlertDialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rollback Approved Inquiry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Permanently delete the student created from this inquiry.</li>
                  <li>Revert the inquiry status to "NEW".</li>
                </ul>
                <p className="mt-3 text-red-600 font-semibold">
                  This action cannot be undone!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={rollbackInquiryMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmRollback}
                disabled={rollbackInquiryMutation.isPending}
              >
                {rollbackInquiryMutation.isPending ? "Rolling back..." : "Yes, Rollback"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  )
};
export default FrontOffice;
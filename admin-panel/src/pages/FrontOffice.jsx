import DashboardLayout from "@/components/DashboardLayout";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format, addDays, addMonths } from "date-fns"
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
  getEmployeesByDept,
  getLatestRollNumber,
  addInquiryRemark,
  getAcademicSessions,
} from "../../config/apis";
import StudentForm from "@/components/students/StudentForm";
import { formatTime } from "../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  const [studentFormData, setStudentFormData] = useState({
    rollNumber: "",
    classId: "",
    sectionId: "",
    gender: "",
    dob: "",
    parentCNIC: "",
    documents: "{}",
  });
  // === FETCH DATA ===
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getProgramNames,
  });

  const [employeeSearch, setEmployeeSearch] = useState("");
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", employeeSearch],
    queryFn: () => getEmployeesByDept("", employeeSearch),
    enabled: true, // Always enable to allow searching
  });

  const {
    data: inquiriesData,
    isLoading: inquiriesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["inquiries", selectedProgram],
    queryFn: ({ pageParam = 1 }) => getInquiries(selectedProgram || undefined, pageParam, 15),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses, // Changed from getClasseNames to get full objects
  });
  const { data: sections } = useQuery({
    queryKey: ["sections"],
    queryFn: getSections, // Changed from getSectionNames to get full objects
  });
  const { data: academicSessions = [] } = useQuery({
    queryKey: ["academic-sessions"],
    queryFn: getAcademicSessions,
  });
  const calculatedPrefix = useMemo(() => {
    if (!selectedInquiryForAccept || !studentFormData.classId) return "";
    const pId =
      selectedInquiryForAccept.programInterest ||
      selectedInquiryForAccept.program?.id;
    const pPrefix =
      programs?.find((p) => p.id === Number(pId))?.rollPrefix || "";
    const cPrefix =
      classes?.find((c) => c.id === Number(studentFormData.classId))
        ?.rollPrefix || "";
    const normalizedCPrefix = cPrefix;
    if (pPrefix && normalizedCPrefix && normalizedCPrefix.startsWith(pPrefix)) {
      return normalizedCPrefix;
    }
    return `${pPrefix}${cPrefix}`;
  }, [selectedInquiryForAccept, studentFormData.classId, programs, classes]);

  const rollNumberSuffix = useMemo(() => {
    if (calculatedPrefix && studentFormData.rollNumber.startsWith(calculatedPrefix)) {
      return studentFormData.rollNumber.slice(calculatedPrefix.length);
    }
    return studentFormData.rollNumber;
  }, [studentFormData.rollNumber, calculatedPrefix]);

  useEffect(() => {
    if (calculatedPrefix && acceptInquiryDialog) {
      const generateRollNumber = async () => {
        try {
          // Use first year of selected session (e.g. "2025-2026" -> "25")
          let yearSub = new Date().getFullYear().toString().slice(-2);
          const sessionId = studentFormData.sessionId;
          if (sessionId) {
            const sessionRecord = academicSessions.find(s => s.id.toString() === sessionId.toString());
            if (sessionRecord?.name) {
              const match = sessionRecord.name.match(/(\d{4})/);
              if (match) yearSub = match[1].slice(-2);
            }
          }
          const searchPrefix = `${calculatedPrefix}${yearSub}-`;
          const latestFull = await getLatestRollNumber(searchPrefix);

          let nextSuffix = `${yearSub}-001`;
          if (latestFull) {
            const parts = latestFull.split("-");
            const lastPart = parts[parts.length - 1];
            if (!isNaN(parseInt(lastPart))) {
              const nextNum = parseInt(lastPart, 10) + 1;
              const nextNumStr = nextNum.toString().padStart(3, '0');
              nextSuffix = `${yearSub}-${nextNumStr}`;
            }
          }
          setStudentFormData(prev => ({ ...prev, rollNumber: `${calculatedPrefix}${nextSuffix}` }));
        } catch (error) {
          console.error("Error au roll number:", error);
          setStudentFormData(prev => ({ ...prev, rollNumber: calculatedPrefix }));
        }
      };
      generateRollNumber();
    }
  }, [calculatedPrefix, acceptInquiryDialog]);

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
    inquiryType: "",
    gender: "",
    sessionId: "",
    prospectusSold: false,
    prospectusFee: "",
    prospectusReceipt: "",
    followUpDate: "",
    followUpSlab: "",
    referenceBody: "",
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
    assignedToIds: [],
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    category: "Emergency",
    phone: "",
    email: "",
    details: "",
  });

  const [visitorMonthFilter, setVisitorMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [categoryFilter, setCategoryFilter] = useState("All");




  const inquiries = useMemo(() => {
    return inquiriesData?.pages.flatMap((page) => page.data) || [];
  }, [inquiriesData]);

  const observer = useRef();
  const lastInquiryElementRef = useCallback(
    (node) => {
      if (inquiriesLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [inquiriesLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery({
    queryKey: ["visitors", visitorMonthFilter],
    queryFn: () => getVisitors(visitorMonthFilter || undefined),
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
      // If studentData is FormData, append inquiryId. Otherwise spread.
      let studentWithInquiry;
      if (studentData instanceof FormData) {
        studentData.append("inquiryId", String(inquiryId));
        studentWithInquiry = studentData;
      } else {
        studentWithInquiry = { ...studentData, inquiryId: String(inquiryId) };
      }

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

  
  const addRemarkMutation = useMutation({
    mutationFn: ({ id, remark }) => addInquiryRemark(id, remark),
    onSuccess: () => {
      queryClient.invalidateQueries(["inquiries"]);
    },
    onError: (error) => {
      toast({
        title: error.message || "Failed to add remark",
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
    queryKey: ["complaints", dateFilter?.toDateString()],
    queryFn: () => getComplaints(dateFilter),
    enabled: true
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
      inquiryType: "",
      gender: "",
      sessionId: "",
      prospectusSold: false,
      prospectusFee: "",
      prospectusReceipt: "",
      followUpDate: "",
      followUpSlab: "",
      referenceBody: "",
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
      assignedToIds: [],
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

    const payload = {
      ...inquiryForm,
      sessionId: inquiryForm.sessionId ? Number(inquiryForm.sessionId) : undefined,
      prospectusFee: inquiryForm.prospectusFee ? Number(inquiryForm.prospectusFee) : undefined,
      prospectusSold: !!inquiryForm.prospectusSold,
    };

    if (editingInquiry) {
      const { remarks, ...rest } = payload;
      updateMutation.mutate({ id: editingInquiry.id, payload: rest });
      if (remarks) {
        addRemarkMutation.mutate({ id: editingInquiry.id, remark: remarks });
      }
    } else {
      createMutation.mutate({ ...payload, status: "NEW" });
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
      remarks: "", // Clear for new remark adding
      inquiryType: inquiry.inquiryType || "",
      gender: inquiry.gender || "",
      sessionId: inquiry.sessionId?.toString() || "",
      prospectusSold: inquiry.prospectusSold || false,
      prospectusFee: inquiry.prospectusFee?.toString() || "",
      prospectusReceipt: inquiry.prospectusReceipt || "",
      followUpDate: inquiry.followUpDate ? inquiry.followUpDate.split("T")[0] : "",
      followUpSlab: inquiry.followUpSlab || "",
      referenceBody: inquiry.referenceBody || "",
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

    // Precise mapping from Inquiry to StudentForm
    const nameParts = (inquiry.studentName || "").trim().split(/\s+/);
    const fName = nameParts[0] || inquiry.studentName;
    const lName = nameParts.slice(1).join(' ');

    setStudentFormData({
      fName,
      lName,
      fatherOrguardian: inquiry.fatherName || "",
      rollNumber: "",
      parentOrGuardianEmail: inquiry.email || "",
      parentOrGuardianPhone: inquiry.contactNumber || "",
      parentCNIC: inquiry.fatherCnic || "",
      address: inquiry.address || "",
      programId: inquiry.programInterest?.toString() || inquiry.program?.id?.toString() || "",
      classId: inquiry.classId?.toString() || "",
      sectionId: inquiry.sectionId?.toString() || "",
      gender: inquiry.gender || "",
      dob: inquiry.dob ? inquiry.dob.split('T')[0] : "",
      sessionId: inquiry.sessionId?.toString() || "",
      session: inquiry.session?.name || academicSessions?.find(s => s.id === inquiry.sessionId)?.name || "",
      documents: {
        fatherCnic: !!inquiry.fatherCnic,
        address: !!inquiry.address,
        // map other boolean flags if exist in inquiry
      }
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
    const lName = nameParts.slice(1).join(' ');

    const studentData = {
      fName,
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
      parentCNIC: "",
      documents: "{}",
    });
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
      updateComplaint({ id: editingComplaint.id, payload: complaintForm });
    } else {
      createComplaint({
        ...complaintForm,
        status: "Pending",
      });

    }
    closeComplaintDialog();
  };

  const handleDateSelect = (date) => {
    setDateFilter(date);
  };

  const handleEditComplaint = (complaint) => {
    setComplaintForm({
      ...complaint,
      details: complaint.description || "",
      assignedToIds: complaint.assignedTo?.map(a => a.id) || [],
    });
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
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "in_progress":
      case "in progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              Front Office Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Handle inquiries, visitors, complaints, and contacts
            </p>
          </div>
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
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingInquiry ? "Edit" : "New"} Inquiry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5">
                        {/* Student Information */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Student Information</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Student Name *</Label>
                              <Input value={inquiryForm.studentName} onChange={(e) => setInquiryForm({ ...inquiryForm, studentName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label>Father Name</Label>
                              <Input value={inquiryForm.fatherName} onChange={(e) => setInquiryForm({ ...inquiryForm, fatherName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label>Father CNIC</Label>
                              <Input value={inquiryForm.fatherCnic} onChange={(e) => setInquiryForm({ ...inquiryForm, fatherCnic: e.target.value })} placeholder="12345-1234567-1" />
                            </div>
                            <div className="space-y-1">
                              <Label>Contact Number *</Label>
                              <Input value={inquiryForm.contactNumber} onChange={(e) => setInquiryForm({ ...inquiryForm, contactNumber: e.target.value })} placeholder="0300-1234567" />
                            </div>
                            <div className="space-y-1">
                              <Label>Email</Label>
                              <Input value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} placeholder="email@example.com" />
                            </div>
                            <div className="space-y-1">
                              <Label>Gender</Label>
                              <Select value={inquiryForm.gender} onValueChange={(v) => setInquiryForm({ ...inquiryForm, gender: v })}>
                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label>Address</Label>
                              <Input value={inquiryForm.address} onChange={(e) => setInquiryForm({ ...inquiryForm, address: e.target.value })} />
                            </div>
                          </div>
                        </div>

                        {/* Inquiry Details */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Inquiry Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Program Interest</Label>
                              <Select value={String(inquiryForm.programInterest || "")} onValueChange={(v) => setInquiryForm({ ...inquiryForm, programInterest: v })}>
                                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                                <SelectContent>
                                  {programs?.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.department?.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Session</Label>
                              <Select value={inquiryForm.sessionId} onValueChange={(v) => setInquiryForm({ ...inquiryForm, sessionId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                                <SelectContent>
                                  {academicSessions?.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}{s.isActive ? " (Active)" : ""}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Inquiry Type</Label>
                              <Select value={inquiryForm.inquiryType} onValueChange={(v) => setInquiryForm({ ...inquiryForm, inquiryType: v })}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                                  <SelectItem value="HEAD_OFFICE">Head Office (HO)</SelectItem>
                                  <SelectItem value="REGIONAL_OFFICE">Regional Office (RO)</SelectItem>
                                  <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                  <SelectItem value="TELEPHONE">Telephone</SelectItem>
                                  <SelectItem value="REFERENCE">Reference</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Previous Institute</Label>
                              <Input value={inquiryForm.previousInstitute} onChange={(e) => setInquiryForm({ ...inquiryForm, previousInstitute: e.target.value })} />
                            </div>
                            {inquiryForm.inquiryType === "REFERENCE" && (
                              <div className="space-y-1">
                                <Label>Reference Name/Body</Label>
                                <Input value={inquiryForm.referenceBody} onChange={(e) => setInquiryForm({ ...inquiryForm, referenceBody: e.target.value })} placeholder="Enter reference name or body" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Prospectus */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Prospectus</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="space-y-1">
                              <Label>Prospectus Sold</Label>
                              <Select
                                value={inquiryForm.prospectusSold ? "yes" : "no"}
                                onValueChange={(v) => setInquiryForm({
                                  ...inquiryForm,
                                  prospectusSold: v === "yes",
                                  prospectusFee: v === "no" ? "" : inquiryForm.prospectusFee,
                                  prospectusReceipt: v === "no" ? "" : inquiryForm.prospectusReceipt,
                                })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">No</SelectItem>
                                  <SelectItem value="yes">Yes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {inquiryForm.prospectusSold && (
                              <>
                                <div className="space-y-1">
                                  <Label>Prospectus Fee (PKR)</Label>
                                  <Input type="number" value={inquiryForm.prospectusFee} onChange={(e) => setInquiryForm({ ...inquiryForm, prospectusFee: e.target.value })} placeholder="e.g. 500" />
                                </div>
                                <div className="space-y-1">
                                  <Label>Receipt Number</Label>
                                  <Input value={inquiryForm.prospectusReceipt} onChange={(e) => setInquiryForm({ ...inquiryForm, prospectusReceipt: e.target.value })} placeholder="Receipt #" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Follow Up */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Follow Up</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Follow Up Date</Label>
                              {inquiryForm.followUpSlab === "" ? null : inquiryForm.followUpSlab === "CUSTOM" ? (
                                <Input type="date" value={inquiryForm.followUpDate} onChange={(e) => setInquiryForm({ ...inquiryForm, followUpDate: e.target.value })} />
                              ) : (
                                <Input type="date" value={inquiryForm.followUpDate} readOnly />
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label>Follow Up Slab</Label>
                              <Select value={inquiryForm.followUpSlab} onValueChange={(v) => {
                                if (v === "1_DAY") {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v, followUpDate: format(addDays(new Date(), 1), "yyyy-MM-dd") });
                                } else if (v === "3_DAYS") {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v, followUpDate: format(addDays(new Date(), 3), "yyyy-MM-dd") });
                                } else if (v === "1_WEEK") {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v, followUpDate: format(addDays(new Date(), 7), "yyyy-MM-dd") });
                                } else if (v === "2_WEEKS") {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v, followUpDate: format(addDays(new Date(), 14), "yyyy-MM-dd") });
                                } else if (v === "1_MONTH") {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v, followUpDate: format(addMonths(new Date(), 1), "yyyy-MM-dd") });
                                } else {
                                  setInquiryForm({ ...inquiryForm, followUpSlab: v });
                                }
                              }}>
                                <SelectTrigger><SelectValue placeholder="Select slab" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1_DAY">1 Day</SelectItem>
                                  <SelectItem value="3_DAYS">3 Days</SelectItem>
                                  <SelectItem value="1_WEEK">1 Week</SelectItem>
                                  <SelectItem value="2_WEEKS">2 Weeks</SelectItem>
                                  <SelectItem value="1_MONTH">1 Month</SelectItem>
                                  <SelectItem value="CUSTOM">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Remarks */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Remarks</p>
                          {editingInquiry && Array.isArray(editingInquiry.remarks) && editingInquiry.remarks.length > 0 && (
                            <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-muted/20 rounded border text-sm mb-2 scrollbar-thin">
                              {editingInquiry.remarks.map((r, i) => (
                                <div key={i} className="border-b last:border-0 pb-1">
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span className="font-semibold">{r.author}</span>
                                    <span className="italic">{r.date ? new Date(r.date).toLocaleString() : ""}</span>
                                  </div>
                                  <p className="text-xs">{r.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {editingInquiry && typeof editingInquiry.remarks === 'string' && editingInquiry.remarks.trim() !== "" && (
                            <div className="p-2 bg-muted/20 rounded border text-sm mb-2">
                              <p className="text-xs">{editingInquiry.remarks}</p>
                            </div>
                          )}
                          <Textarea
                            placeholder={editingInquiry ? "Add a new remark..." : "Enter inquiry remarks..."}
                            value={inquiryForm.remarks}
                            onChange={(e) => setInquiryForm({ ...inquiryForm, remarks: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={closeInquiryDialog}>Cancel</Button>
                        <Button onClick={handleInquirySubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                          {createMutation.isPending || updateMutation.isPending ? "Saving..." : (editingInquiry ? "Update" : "Submit") + " Inquiry"}
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
                        <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Student Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Father Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Contact</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inquiries.length > 0 ? (
                        <>
                          {inquiries.map((inquiry, index) => (
                            <TableRow
                              key={inquiry.id}
                              ref={index === inquiries.length - 1 ? lastInquiryElementRef : null}
                            >
                              <TableCell className="py-2 px-3 text-sm">{inquiry.createdAt.split("T")[0]}</TableCell>
                              <TableCell className="py-2 px-3 text-sm font-medium">{inquiry.studentName}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{inquiry.fatherName}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{inquiry.contactNumber}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">{inquiry.program?.name}</TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                  {inquiry.status || "NEW"}
                                </span>
                              </TableCell>
                              <TableCell className="py-2 px-3 text-sm">
                                <div className="flex gap-2">
                                  {(inquiry.status === "NEW" || inquiry.status === "REJECTED" || !inquiry.status) && (
                                    <>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => handleAcceptInquiry(inquiry)}
                                          >
                                            <Check className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Accept Inquiry</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRejectInquiry(inquiry)}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{inquiry.status === "REJECTED" ? "Revert to NEW" : "Reject Inquiry"}</TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setViewDetailsDialog({
                                            open: true,
                                            type: "inquiry",
                                            data: inquiry,
                                          })
                                        }
                                      >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Details</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditInquiry(inquiry)}
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Inquiry</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteDialog({ open: true, type: "inquiry", id: inquiry.id })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Inquiry</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {isFetchingNextPage && (
                            <TableRow>
                              <TableCell colSpan={7} className="py-2 px-3 text-sm text-center text-muted-foreground animate-pulse">
                                Loading more inquiries...
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-2 px-3 text-sm text-center text-muted-foreground">
                            No inquiries found.
                          </TableCell>
                        </TableRow>
                      )}
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
                <div className="flex items-center gap-3">
                  <Input
                    type="month"
                    value={visitorMonthFilter}
                    onChange={(e) => setVisitorMonthFilter(e.target.value)}
                    className="w-[180px]"
                    placeholder="Filter by month"
                  />
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
                </div>
              </CardHeader>
              <CardContent>
                {visitorsLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading visitors...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Visitor Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Phone</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Purpose</TableHead>
                        <TableHead className="py-2 px-3 text-sm">In Time</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Out Time</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Persons</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-2 px-3 text-sm text-center text-muted-foreground">
                            No visitors recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        visitors.map((visitor) => (
                          <TableRow key={visitor.id}>
                            <TableCell className="py-2 px-3 text-sm">{visitor.date.split("T")[0]}</TableCell>
                            <TableCell className="py-2 px-3 text-sm font-medium truncate max-w-[130px] overflow-hidden whitespace-nowrap">{visitor.visitorName}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{visitor.phone}</TableCell>
                            <TableCell className="py-2 px-3 text-sm font-medium truncate max-w-[130px] overflow-hidden whitespace-nowrap">{visitor.purpose || "-"}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{formatTime(visitor.inTime)}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">{formatTime(visitor.outTime)}</TableCell>

                            <TableCell className="py-2 px-3 text-sm">{visitor.persons}</TableCell>
                            <TableCell className="py-2 px-3 text-sm">
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setViewDetailsDialog({
                                          open: true,
                                          type: "visitor",
                                          data: {
                                            ...visitor,
                                            inTime: formatTime(visitor.inTime),
                                            outTime: formatTime(visitor.outTime),
                                          },
                                        })
                                      }
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditVisitor(visitor)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Visitor</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Visitor</TooltipContent>
                                </Tooltip>
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

                        <div>
                          <Label>Assign To Employees</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between mt-1 h-auto min-h-[40px] py-2"
                              >
                                <div className="flex flex-wrap gap-1">
                                  {complaintForm.assignedToIds?.length > 0 ? (
                                    complaintForm.assignedToIds.map((id) => (
                                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                        {employees.find(e => e.id === id)?.name || id}
                                        <X
                                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const ids = complaintForm.assignedToIds || [];
                                            setComplaintForm({
                                              ...complaintForm,
                                              assignedToIds: ids.filter(aid => aid !== id),
                                            });
                                          }}
                                        />
                                      </Badge>
                                    ))
                                  ) : (
                                    "Select Employees"
                                  )}
                                </div>
                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search employee..."
                                  onValueChange={setEmployeeSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>No employee found.</CommandEmpty>
                                  <CommandGroup>
                                    {employees.map((employee) => (
                                      <CommandItem
                                        key={employee.id}
                                        value={employee.name}
                                        onSelect={() => {
                                          const ids = complaintForm.assignedToIds || [];
                                          const newIds = ids.includes(employee.id)
                                            ? ids.filter(id => id !== employee.id)
                                            : [...ids, employee.id];
                                          setComplaintForm({
                                            ...complaintForm,
                                            assignedToIds: newIds,
                                          });
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${complaintForm.assignedToIds?.includes(employee.id)
                                            ? "opacity-100"
                                            : "opacity-0"
                                            }`}
                                        />
                                        {employee.name} - {employee.empDepartment}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
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
                      <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Subject</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Assigned To</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints?.map(complaint => <TableRow key={complaint.id}>
                      <TableCell className="py-2 px-3 text-sm">{complaint.createdAt.split("T")[0]}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{complaint.type}</TableCell>
                      <TableCell className="py-2 px-3 text-sm font-medium">{complaint.complainantName}</TableCell>
                      <TableCell className="py-2 px-3 text-sm font-medium italic">{complaint.subject}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {complaint.assignedTo?.length > 0 ? (
                            complaint.assignedTo.map((emp) => (
                              <Badge key={emp.id} variant="secondary" className="text-[10px] h-5">
                                {emp.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Select
                          value={complaint.status}
                          onValueChange={(v) =>
                            updateComplaint({
                              id: complaint.id,
                              payload: { status: v },
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

                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setViewDetailsDialog({
                                open: true,
                                type: "complaint",
                                data: complaint
                              })}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => handleEditComplaint(complaint)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Complaint</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                                open: true,
                                type: "complaint",
                                id: complaint.id
                              })}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Complaint</TooltipContent>
                          </Tooltip>
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
                        <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Category</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Phone</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Email</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                        <TableHead className="py-2 px-3 text-sm no-print">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts?.map(contact => <TableRow key={contact.id}>
                        <TableCell className="py-2 px-3 text-sm font-medium">{contact.name}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {contact.category}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-sm">{contact.phone ? contact.phone : "-"}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">{contact.email ? contact.email : "-"}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">{contact.details ? contact.details : "-"}</TableCell>
                        <TableCell className="py-2 px-3 text-sm no-print">
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => handleEditContact(contact)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Contact</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                                  open: true,
                                  type: "contact",
                                  id: contact.id
                                })}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Contact</TooltipContent>
                            </Tooltip>
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
          <DialogContent className="max-h-[90vh] md:max-w-[680px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold border-b pb-4">
                {viewDetailsDialog.type ? viewDetailsDialog.type.charAt(0).toUpperCase() + viewDetailsDialog.type.slice(1) : "Details"} Information
              </DialogTitle>
            </DialogHeader>

            {viewDetailsDialog.data && viewDetailsDialog.type === "inquiry" ? (
              <div className="space-y-5 mt-2">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewDetailsDialog.data.status)}`}>
                    {viewDetailsDialog.data.status || "NEW"}
                  </span>
                  {viewDetailsDialog.data.inquiryType && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {viewDetailsDialog.data.inquiryType.replace(/_/g, " ")}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {viewDetailsDialog.data.createdAt ? new Date(viewDetailsDialog.data.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                  </span>
                </div>

                {/* Student Info */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Student Information</p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 rounded-lg p-3">
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Student Name</p><p className="text-sm font-medium">{viewDetailsDialog.data.studentName || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Father Name</p><p className="text-sm font-medium">{viewDetailsDialog.data.fatherName || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Contact</p><p className="text-sm font-medium">{viewDetailsDialog.data.contactNumber || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Email</p><p className="text-sm font-medium">{viewDetailsDialog.data.email || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Gender</p><p className="text-sm font-medium">{viewDetailsDialog.data.gender || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Father CNIC</p><p className="text-sm font-medium">{viewDetailsDialog.data.fatherCnic || "—"}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase font-semibold">Address</p><p className="text-sm font-medium">{viewDetailsDialog.data.address || "—"}</p></div>
                  </div>
                </div>

                {/* Inquiry Details */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Inquiry Details</p>
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 rounded-lg p-3">
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Program Interest</p><p className="text-sm font-medium">{viewDetailsDialog.data.program?.name || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Session</p><p className="text-sm font-medium">{viewDetailsDialog.data.session?.name || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Previous Institute</p><p className="text-sm font-medium">{viewDetailsDialog.data.previousInstitute || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Inquiry Type</p><p className="text-sm font-medium">{viewDetailsDialog.data.inquiryType?.replace(/_/g, " ") || "—"}</p></div>
                    {viewDetailsDialog.data?.inquiryType === "REFERENCE" && (
                      <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase font-semibold">Reference</p><p className="text-sm font-medium">{viewDetailsDialog.data.referenceBody || "—"}</p></div>
                    )}
                  </div>
                </div>

                {/* Prospectus */}
                {viewDetailsDialog.data.prospectusSold && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Prospectus</p>
                    <div className="grid grid-cols-3 gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Sold</p><p className="text-sm font-medium text-green-700">Yes</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Fee</p><p className="text-sm font-medium">PKR {viewDetailsDialog.data.prospectusFee || "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Receipt #</p><p className="text-sm font-medium">{viewDetailsDialog.data.prospectusReceipt || "—"}</p></div>
                    </div>
                  </div>
                )}

                {/* Follow Up */}
                {(viewDetailsDialog.data.followUpDate || viewDetailsDialog.data.followUpSlab) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Follow Up</p>
                    <div className="grid grid-cols-2 gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Follow Up Date</p><p className="text-sm font-medium">{viewDetailsDialog.data.followUpDate ? new Date(viewDetailsDialog.data.followUpDate).toLocaleDateString() : "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Slab</p><p className="text-sm font-medium">{viewDetailsDialog.data.followUpSlab?.replace(/_/g, " ") || "—"}</p></div>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                {Array.isArray(viewDetailsDialog.data.remarks) && viewDetailsDialog.data.remarks.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Remarks History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {viewDetailsDialog.data.remarks.map((remark, index) => (
                        <div key={index} className="bg-muted/30 p-3 rounded-md text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-primary text-xs">{remark.author || "Staff"}</span>
                            <span className="text-[10px] text-muted-foreground italic">{remark.date ? new Date(remark.date).toLocaleString() : ""}</span>
                          </div>
                          <p className="text-muted-foreground leading-snug text-xs">{remark.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {typeof viewDetailsDialog.data.remarks === 'string' && viewDetailsDialog.data.remarks.trim() && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Remark</p>
                    <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">{viewDetailsDialog.data.remarks}</div>
                  </div>
                )}
              </div>
            ) : viewDetailsDialog.data && (
              <div className="space-y-6 mt-4">
                {/* Primary Info Section */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(viewDetailsDialog.data)
                    .filter(([key]) => !["id", "assignedToId", "assignedTo", "remarks", "updatedAt", "description", "details", "documents"].includes(key))
                    .map(([key, value]) => {
                      if (!value && value !== 0) return null;
                      let displayValue = typeof value === "object" && value?.name ? value.name : String(value);
                      let label = key.replace(/([A-Z])/g, " $1").trim();
                      if (key.toLowerCase().includes("date") || key === "createdAt") {
                        if (value) displayValue = new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                        label = key === "createdAt" ? "Date" : label;
                      }
                      if (key === "status") {
                        displayValue = <span className={`px-2 py-0.5 rounded text-sm font-medium border ${value === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : value === 'Resolved' || value === 'Approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>{value}</span>;
                      }
                      return (
                        <div key={key} className="space-y-1">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
                          <div className="text-sm font-medium text-foreground">{displayValue}</div>
                        </div>
                      );
                    })}
                </div>

                {(viewDetailsDialog.data.description || viewDetailsDialog.data.details) && (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-semibold">Details / Description</h4>
                    <div className="bg-muted/30 p-4 rounded-md text-sm leading-relaxed whitespace-pre-wrap">
                      {viewDetailsDialog.data.description || viewDetailsDialog.data.details}
                    </div>
                  </div>
                )}

                {viewDetailsDialog.type === "complaint" && viewDetailsDialog.data.assignedTo?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Employees</h4>
                    <div className="flex flex-wrap gap-4">
                      {viewDetailsDialog.data.assignedTo.map((emp) => (
                        <div key={emp.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{emp.name?.charAt(0)}</div>
                          <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-muted-foreground">{emp.empDepartment}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewDetailsDialog.type === "complaint" && viewDetailsDialog.data.remarks?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status History & Remarks</h4>
                    <div className="space-y-3">
                      {viewDetailsDialog.data.remarks.map((remark) => (
                        <div key={remark.id} className="bg-muted/30 p-3 rounded-md text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-primary">{remark.author?.name || "Staff"}</span>
                            <span className="text-[10px] text-muted-foreground italic">{new Date(remark.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-muted-foreground leading-snug">{remark.remark}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewDetailsDialog.type !== "complaint" && viewDetailsDialog.data.assignedTo && (
                  <div className="space-y-1 pt-4 border-t">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Employee</h4>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{viewDetailsDialog.data.assignedTo.name?.charAt(0)}</div>
                      <div><p className="text-sm font-medium">{viewDetailsDialog.data.assignedTo.name}</p><p className="text-xs text-muted-foreground">{viewDetailsDialog.data.assignedTo.empDepartment}</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Accept Inquiry Dialog */}
        <Dialog open={acceptInquiryDialog} onOpenChange={setAcceptInquiryDialog}>
          <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Accept Inquiry - Create Student</DialogTitle>
            </DialogHeader>

            {selectedInquiryForAccept && (
              <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                  <Users className="w-5 h-5" />
                  <h3>Inquiry Details</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student Name</p>
                    <p className="font-medium">{selectedInquiryForAccept.studentName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Father Name</p>
                    <p className="font-medium">{selectedInquiryForAccept.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedInquiryForAccept.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Program Interested</p>
                    <Badge className="inline-block" variant="outline">
                      {programs?.find(p => p.id === selectedInquiryForAccept.programInterest)?.name || selectedInquiryForAccept.program?.name || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <StudentForm
              initialData={studentFormData}
              programs={programs}
              classes={classes}
              sections={sections}
              academicSessions={academicSessions}
              getLatestRollNumber={getLatestRollNumber}
              onCancel={closeAcceptInquiryDialog}
              onSubmit={(data) => {
                acceptInquiryMutation.mutate({
                  studentData: data,
                  inquiryId: selectedInquiryForAccept.id,
                });
              }}
              isSubmitting={acceptInquiryMutation.isPending}
            />
          </DialogContent>
        </Dialog>


      </div>
    </DashboardLayout>
  )
};
export default FrontOffice;
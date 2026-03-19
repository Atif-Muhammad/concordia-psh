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
import { useState, useEffect, useRef } from "react";
import { DollarSign, Plus, CheckCircle2, Edit, Trash2, Receipt, TrendingUp, Layers, Printer, Eye, History, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  createFeeHead, getFeeHeads, updateFeeHead, deleteFeeHead,
  createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
  getPrograms, getClasses, getStudents,
  getFeeChallans, getBulkChallans, updateFeeChallan, getStudentFeeHistory,
  searchStudents, getRevenueOverTime, getClassCollectionStats, getFeeCollectionSummary, getDefaultFeeChallanTemplate,
  getInstallmentPlans, generateChallansFromPlan,
  getInstituteSettings, updateInstituteSettings
} from "../../config/apis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
const FeeManagement = () => {

  const {
    toast
  } = useToast();

  // Student search state (for history tab)
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeHistory, setStudentFeeHistory] = useState([]);

  const [challanSearch, setChallanSearch] = useState("");
  const [challanFilter, setChallanFilter] = useState("all");
  const [selectedInstallment, setSelectedInstallment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [challanOpen, setChallanOpen] = useState(false);
  const [feeHeadOpen, setFeeHeadOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedChallanDetails, setSelectedChallanDetails] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToPay, setItemToPay] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    studentId: "",
    classId: "",
    sectionId: "",
    programId: "all"
  });
  const [generateResults, setGenerateResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMode, setGenerateMode] = useState("bulk"); // "bulk" or "student"
  const [genStudentSearch, setGenStudentSearch] = useState("");
  const [genStudentResults, setGenStudentResults] = useState([]);
  const [genSelectedStudent, setGenSelectedStudent] = useState(null);
  const [genStudentPlan, setGenStudentPlan] = useState([]);
  const [isSearchingGenStudent, setIsSearchingGenStudent] = useState(false);
  const [genStudentSearchOpen, setGenStudentSearchOpen] = useState(false);
  const [genCustomAmount, setGenCustomAmount] = useState("");
  const [genSelectedHeads, setGenSelectedHeads] = useState([]);
  const [genRemarks, setGenRemarks] = useState("");
  const [genDueDate, setGenDueDate] = useState("");
  const [bulkDueDate, setBulkDueDate] = useState(null);
  const [genCustomArrears, setGenCustomArrears] = useState("");
  const [genSelectedArrears, setGenSelectedArrears] = useState([]); // Array of installment IDs selected for billing
  const [bulkStudents, setBulkStudents] = useState([]);
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);
  const [bulkArrearsStudents, setBulkArrearsStudents] = useState([]);
  const [isFetchingBulkStudents, setIsFetchingBulkStudents] = useState(false);

  // Bulk Printing state
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [bulkPrintFilters, setBulkPrintFilters] = useState({
    programId: "all",
    classId: "all",
    sectionId: "all",
    month: new Date().toISOString().slice(0, 7)
  });
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkPreviewContent, setBulkPreviewContent] = useState("");
  const [bulkChallansList, setBulkChallansList] = useState([]);

  // Extra Challans tab state
  const [extraStudentSearchOpen, setExtraStudentSearchOpen] = useState(false);
  const [extraStudentResults, setExtraStudentResults] = useState([]);
  const [extraSelectedStudent, setExtraSelectedStudent] = useState(null);
  const [extraSelectedHeads, setExtraSelectedHeads] = useState([]);
  const [extraDueDate, setExtraDueDate] = useState(null);
  const [extraRemarks, setExtraRemarks] = useState("");


  const [challanForm, setChallanForm] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    fineAmount: 0,
    remarks: "",
    installmentNumber: "",
    selectedHeads: [],
    isArrearsPayment: false,
    arrearsInstallments: 1,
    arrearsAmount: "",
    arrearsSelections: [] // Added for granular arrears in Edit dialog
  });

  const [feeHeadForm, setFeeHeadForm] = useState({
    name: "",
    amount: "",
    type: "monthly",
    isTuition: false,
    isFine: false,
    isLabFee: false,
    isLibraryFee: false,
    isRegistrationFee: false,
    isAdmissionFee: false,
    isProspectusFee: false,
    isExaminationFee: false,
    isAlliedCharges: false,
    isHostelFee: false,
    isOther: false
  });
  const [structureForm, setStructureForm] = useState({
    programId: "",
    classId: "",
    feeHeads: [],
    installments: "1"
  });


  const queryClient = useQueryClient();

  const calculateLateFee = (dueDate, finePerDay) => {
    if (!dueDate || !finePerDay) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    // Late fee starts from the 1st of the NEXT month after the due date's month
    const lateStart = new Date(due.getFullYear(), due.getMonth() + 1, 1);
    if (now < lateStart) return 0;
    const diffTime = Math.abs(now.getTime() - lateStart.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because April 1st itself is day 1
    return diffDays * finePerDay;
  };

  const { data: feeHeads = [] } = useQuery({
    queryKey: ['feeHeads'],
    queryFn: getFeeHeads
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: getFeeStructures
  });

  useEffect(() => {
    if (generateForm.month) {
      // Set to 10th of that month by default
      const [year, month] = generateForm.month.split('-').map(Number);
      const defaultDate = new Date(year, month - 1, 10);
      setGenDueDate(defaultDate);
      setBulkDueDate(defaultDate);
    }
  }, [generateForm.month]);

  // Bulk student fetcher
  useEffect(() => {
    const fetchBulkStudentsData = async () => {
      if (!generateDialogOpen || generateMode !== "bulk") return;
      if (!generateForm.programId || generateForm.programId === "all") {
        setBulkStudents([]);
        setSelectedBulkStudents([]);
        return;
      }

      setIsFetchingBulkStudents(true);
      try {
        const results = await getStudents(
          generateForm.programId !== "all" ? generateForm.programId : "",
          generateForm.classId !== "all" ? generateForm.classId : "",
          generateForm.sectionId !== "all" ? generateForm.sectionId : "",
          "", // search
          "ACTIVE", // status
          "", "", // dates
          1, 1000 // page/limit
        );
        const studentList = results.students || [];
        setBulkStudents(studentList);
        setSelectedBulkStudents(studentList.map(s => s.id));
        setBulkArrearsStudents(studentList.map(s => s.id));
      } catch (error) {
        console.error("Failed to fetch bulk students:", error);
      } finally {
        setIsFetchingBulkStudents(false);
      }
    };

    fetchBulkStudentsData();
  }, [generateDialogOpen, generateMode, generateForm.programId, generateForm.classId, generateForm.sectionId]);

  const { data: instituteSettings } = useQuery({
    queryKey: ['instituteSettings'],
    queryFn: getInstituteSettings
  });

  const [lateFeeFine, setLateFeeFine] = useState(0);

  useEffect(() => {
    if (instituteSettings?.lateFeeFine !== undefined) {
      setLateFeeFine(instituteSettings.lateFeeFine);
    }
  }, [instituteSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateInstituteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['instituteSettings']);
      toast({ title: "Settings updated successfully" });
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [challanMeta, setChallanMeta] = useState(null);

  const { data: feeChallansData = { data: [], meta: {} }, isLoading: isChallansLoading } = useQuery({
    queryKey: ['feeChallans', challanSearch, challanFilter, selectedInstallment, selectedMonth, page, limit],
    queryFn: () => {
      let startDate = "";
      let endDate = "";
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay}`;
      }

      return getFeeChallans({
        search: challanSearch,
        status: challanFilter,
        installmentNumber: selectedInstallment === 'all' ? '' : selectedInstallment,
        startDate,
        endDate,
        page,
        limit
      });
    },
    keepPreviousData: true,
  });

  const feeChallans = feeChallansData.data || [];
  useEffect(() => {
    if (feeChallansData.meta) setChallanMeta(feeChallansData.meta);
  }, [feeChallansData]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: getClasses
  });

  const [reportFilter, setReportFilter] = useState('month');

  const { data: revenueData = [] } = useQuery({
    queryKey: ['revenueOverTime', reportFilter],
    queryFn: () => getRevenueOverTime({ period: reportFilter })
  });

  const { data: classCollectionData = [] } = useQuery({
    queryKey: ['classCollectionStats', reportFilter],
    queryFn: () => getClassCollectionStats({ period: reportFilter })
  });

  const { data: feeCollectionSummary = { totalRevenue: 0, totalOutstanding: 0 } } = useQuery({
    queryKey: ['feeCollectionSummary', reportFilter],
    queryFn: () => getFeeCollectionSummary({ period: reportFilter })
  });

  const { data: defaultChallanTemplate } = useQuery({
    queryKey: ['defaultChallanTemplate'],
    queryFn: getDefaultFeeChallanTemplate
  });

  // Derived state for summary cards (using fetched summary instead of local calc)
  const totalReceived = feeCollectionSummary.totalRevenue;
  const totalPending = feeCollectionSummary.totalOutstanding;

  // Helper function to format amounts as integers (no decimals)
  const formatAmount = (amount) => {
    const num = Number(amount) || 0;
    return Math.round(num).toLocaleString();
  };

  const numberToWords = (n) => {
    if (n < 0) return "Negative";
    if (n === 0) return "Zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convert = (num) => {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
      if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + convert(num % 100) : "");
      if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
      if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
      return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
    };
    return convert(n) + " Only";
  };

  const resetChallanForm = () => {
    setChallanForm({
      studentId: "",
      amount: "",
      dueDate: null,
      fineAmount: 0,
      remarks: "",
      installmentNumber: "",
      selectedHeads: [],
      isArrearsPayment: false,
      arrearsInstallments: 1,
      arrearsAmount: "",
      arrearsSelections: []
    });
    setEditingChallan(null);
    setGenStudentPlan([]);
  };

  const searchTimeoutRef = useRef(null);

  const handleStudentSearch = (query, setResults) => {
    if (!query) {
      setResults([]);
      return;
    }
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchStudents(query);
        setResults(results);
      } catch (error) {
        console.error(error);
      }
    }, 300); // 300ms debounce delay
  };

  // Mutations

  const updateChallanMutation = useMutation({
    mutationFn: ({ id, data }) => updateFeeChallan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      toast({ title: "Challan updated successfully" });
      setChallanOpen(false);
      setEditingChallan(null);
      resetChallanForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const generateChallansMutation = useMutation({
    mutationFn: generateChallansFromPlan,
    onSuccess: (data) => {
      setGenerateResults(data);
      setIsGenerating(false);
      setGenCustomAmount("");
      setGenSelectedHeads([]);
      setGenRemarks("");
      queryClient.invalidateQueries(['feeChallans']);
      toast({ title: "Challan generation process completed" });
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({ title: error.message, variant: "destructive" });
    }
  });


  const createHeadMutation = useMutation({
    mutationFn: createFeeHead,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeHeads']);
      toast({ title: "Fee head created successfully" });
      setFeeHeadOpen(false);
      resetFeeHeadForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const updateHeadMutation = useMutation({
    mutationFn: ({ id, data }) => updateFeeHead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeHeads']);
      toast({ title: "Fee head updated successfully" });
      setFeeHeadOpen(false);
      resetFeeHeadForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const deleteHeadMutation = useMutation({
    mutationFn: deleteFeeHead,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeHeads']);
      toast({ title: "Fee head deleted" });
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const createStructureMutation = useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeStructures']);
      toast({ title: "Fee structure created successfully" });
      setStructureOpen(false);
      resetStructureForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, data }) => updateFeeStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeStructures']);
      toast({ title: "Fee structure updated successfully" });
      setStructureOpen(false);
      resetStructureForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const deleteStructureMutation = useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeStructures']);
      toast({ title: "Fee structure deleted" });
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const handleSubmitChallan = () => {
    if (!challanForm.studentId || !challanForm.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const tuitionToStore = Math.round(parseFloat(challanForm.amount) || 0);
    const additionalToStore = Math.round(Number(challanForm.fineAmount) || 0);
    const discountToStore = 0;

    const installmentNumber = parseInt(challanForm.installmentNumber) || 0;

    const selectedHeadIds = (challanForm.selectedHeads || []).map(id => Number(id));

    // ONLY include fee heads that are actually selected
    const allFeeHeadDetails = (feeHeads || [])
      .filter(h => selectedHeadIds.includes(Number(h.id)))
      .map(h => ({
        id: Number(h.id),
        name: h.name,
        amount: Math.round(Number(h.amount) || 0),
        type: h.isTuition ? 'tuition' : 'additional',
        isSelected: true
      }));

    if (editingChallan) {
      updateChallanMutation.mutate({
        id: editingChallan.id,
        data: {
          studentId: parseInt(challanForm.studentId),
          amount: tuitionToStore + (parseFloat(challanForm.arrearsAmount) || 0), // Base billable (tuition + arrears)
          dueDate: challanForm.dueDate ? format(challanForm.dueDate, "yyyy-MM-dd") : undefined,
          fineAmount: additionalToStore,
          remarks: challanForm.remarks,
          installmentNumber: installmentNumber,
          selectedHeads: allFeeHeadDetails,
          customArrearsAmount: (challanForm.arrearsAmount !== "" && challanForm.arrearsAmount !== undefined) ? parseFloat(challanForm.arrearsAmount) : undefined,
          arrearsLateFee: (challanForm.arrearsSelections || []).reduce((sum, a) => sum + a.lateFee, 0)
        }
      });
    }
  };

  const handleSubmitFeeHead = () => {
    if (!feeHeadForm.name || !feeHeadForm.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const payload = {
      name: feeHeadForm.name,
      amount: parseFloat(feeHeadForm.amount),
      description: feeHeadForm.description,
      type: feeHeadForm.type,
      isTuition: feeHeadForm.isTuition,
      isFine: feeHeadForm.isFine,
      isLabFee: feeHeadForm.isLabFee,
      isLibraryFee: feeHeadForm.isLibraryFee,
      isRegistrationFee: feeHeadForm.isRegistrationFee,
      isAdmissionFee: feeHeadForm.isAdmissionFee,
      isProspectusFee: feeHeadForm.isProspectusFee,
      isExaminationFee: feeHeadForm.isExaminationFee,
      isAlliedCharges: feeHeadForm.isAlliedCharges,
      isHostelFee: feeHeadForm.isHostelFee,
      isOther: feeHeadForm.isOther
    };

    if (editingFeeHead) {
      updateHeadMutation.mutate({ id: editingFeeHead.id, data: payload });
    } else {
      createHeadMutation.mutate(payload);
    }
  };

  const handleSubmitStructure = () => {
    if (!structureForm.programId || !structureForm.classId || !structureForm.totalAmount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const payload = {
      programId: parseInt(structureForm.programId),
      classId: parseInt(structureForm.classId),
      totalAmount: parseFloat(structureForm.totalAmount),
      installments: parseInt(structureForm.installments) || 1
    };

    if (editingStructure) {
      updateStructureMutation.mutate({ id: editingStructure.id, data: payload });
    } else {
      createStructureMutation.mutate(payload);
    }
  };

  const handlePayment = (challan) => {
    setItemToPay(challan);
    // Default to full net payable
    const netPayable = (challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.paidAmount || 0);
    setPaymentAmount(Math.max(0, netPayable).toString());
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!itemToPay) return;

    const netPayable = (itemToPay.amount || 0) + (itemToPay.fineAmount || 0) + (itemToPay.lateFeeFine || 0);
    const remaining = Math.max(0, netPayable - (itemToPay.paidAmount || 0));

    if (remaining <= 0) {
      toast({ title: "Challan is already fully paid", variant: "destructive" });
      setPaymentDialogOpen(false);
      return;
    }

    const totalPaidAfter = (itemToPay.paidAmount || 0) + remaining;

    // Simplified installment tracking
    let coveredInstallments = '';
    if (itemToPay.installmentNumber > 0) {
      coveredInstallments = `${itemToPay.installmentNumber}`;
    }

    updateChallanMutation.mutate({
      id: itemToPay.id,
      data: {
        status: "PAID",
        paidDate: new Date().toISOString().split("T")[0],
        paidAmount: totalPaidAfter,
        coveredInstallments
      }
    }, {
      onSuccess: () => {
        toast({ title: "Payment recorded successfully" });
        setPaymentDialogOpen(false);
        setItemToPay(null);
        setPaymentAmount("");
      }
    });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "feeHead") {
      deleteHeadMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "structure") {
      deleteStructureMutation.mutate(itemToDelete.id);
    }
    setItemToDelete(null);
  };
  const resetFeeHeadForm = () => {
    setFeeHeadForm({
      name: "",
      description: "",
      amount: "",
      isTuition: false,
      isFine: false,
      isLabFee: false,
      isLibraryFee: false,
      isRegistrationFee: false,
      isAdmissionFee: false,
      isProspectusFee: false,
      isExaminationFee: false,
      isAlliedCharges: false,
      isHostelFee: false,
      isOther: false
    });
    setEditingFeeHead(null);
  };
  const resetStructureForm = () => {
    setStructureForm({
      programId: "",
      classId: "",
      totalAmount: "",
      installments: "1"
    });
    setEditingStructure(null);
  };

  const generateChallanHtml = (challan, manualTemplate = null) => {
    if (!challan || !challan.student) return "";

    const student = challan.student;
    const templateContent = manualTemplate || defaultChallanTemplate?.htmlContent;

    if (!templateContent) {
      return `
        <div style="padding:40px; text-align:center; border: 2px dashed #94a3b8; border-radius: 12px; background: #f8fafc; color: #64748b;">
          <h3 style="margin-bottom: 8px; font-weight: 600;">No Default Template Found</h3>
          <p>Please mark a template as "Default" in the Templates tab to enable preview and printing.</p>
        </div>
      `;
    }

    // Resolve Class/Program context
    const studentClass = challan.studentClass?.name || classes.find(c => c.id === student.classId)?.name || student.class?.name || "N/A";
    const studentProgram = challan.studentProgram?.name || programs.find(p => p.id === student.programId)?.name || student.program?.name || "";
    const fullClass = `${studentProgram} ${studentClass}`.trim();

    // Prepare Fee Heads Rows and Calculate Totals from SNAPSHOT if possible
    const rawHeads = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
      ? JSON.parse(challan.selectedHeads)
      : (challan.selectedHeads || []);

    const headLookup = (feeHeads || []).reduce((acc, h) => {
      acc[h.id] = h;
      return acc;
    }, {});

    let totalOtherHeadsFromSelection = 0;
    let feeHeadsRowsHtml = rawHeads.map(item => {
      // Handle both legacy (just IDs) and new snapshots (objects)
      if (typeof item === 'object' && item !== null) {
        // Snapshot Object: { id, name, amount, type, isSelected }
        if (item.isSelected && item.type === 'additional' && item.amount > 0) {
          totalOtherHeadsFromSelection += item.amount;
          const displayAmount = item.amount.toLocaleString();
          return `<tr><td>${item.name}</td><td>${displayAmount}</td></tr>`;
        }
      } else {
        // Just an ID
        const h = headLookup[Number(item)];
        if (h && !h.isTuition && !h.isDiscount) {
          const amount = parseFloat(h.amount) || 0;
          if (amount > 0) {
            totalOtherHeadsFromSelection += amount;
            return `<tr><td>${h.name}</td><td>${amount.toLocaleString()}</td></tr>`;
          }
        }
      }
      return "";
    }).join('');

    // Append dynamic late fine if applicable
    if (challan.lateFeeFine && challan.lateFeeFine > 0) {
      feeHeadsRowsHtml += `<tr><td>Late Fee (Overdue)</td><td>${challan.lateFeeFine.toLocaleString()}</td></tr>`;
    }

    // Totals Calculation
    // IMPORTANT: challan.fineAmount ALREADY contains the sum of selected heads from the DB
    // We only add lateFeeFine which is calculated at runtime.
    const fineTotal = (challan.fineAmount || 0) + (challan.lateFeeFine || 0);
    const scholarship = 0;
    const standardTotal = (challan.amount || 0) + fineTotal;
    const netPayable = standardTotal;

    // Common Date Format
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    // Replacements Map
    const tuitionOnly = (challan.amount || 0) - (challan.arrearsAmount || 0);
    const replacements = {
      // General Info
      '{{INSTITUTE_NAME}}': 'Concordia College Peshawar',
      '{{INSTITUTE_ADDRESS}}': '60-C, Near NCS School, University Town Peshawar',
      '{{INSTITUTE_PHONE}}': '091-5619915 | 0332-8581222',
      '{{CHALLAN_TITLE}}': challan.feeStructure?.title || "Fee Challan",

      // camelCase variants (used by seed template)
      '{{challanNumber}}': challan.challanNumber,
      '{{rollNumber}}': student.rollNumber,
      '{{className}}': studentClass,
      '{{programName}}': studentProgram,
      '{{installmentNumber}}': challan.installmentNumber > 0 ? `#${challan.installmentNumber}` : 'Additional',
      '{{amount}}': tuitionOnly.toLocaleString(),
      '{{fineAmount}}': fineTotal.toLocaleString(),
      '{{netPayable}}': netPayable.toLocaleString(),
      '{{instituteName}}': 'Concordia College Peshawar',
      '{{instituteAddress}}': '60-C, Near NCS School, University Town Peshawar',

      // Case-sensitive exact matches for temps.html
      '{{challanNo}}': challan.challanNumber,
      '{{issueDate}}': formatDate(challan.issueDate || challan.createdAt),
      '{{dueDate}}': formatDate(challan.dueDate),
      '{{studentName}}': `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
      '{{fatherName}}': student.fatherOrguardian || '',
      '{{rollNo}}': student.rollNumber,
      '{{class}}': studentClass,
      '{{section}}': '',
      '{{feeHeadsRows}}': feeHeadsRowsHtml,
      '{{Tuition Fee}}': tuitionOnly.toLocaleString(),
      '{{arrears}}': (challan.arrearsAmount || 0).toLocaleString(),
      '{{discount}}': scholarship.toLocaleString(),
      '{{totalPayable}}': netPayable.toLocaleString(),
      '{{rupeesInWords}}': numberToWords(netPayable),

      // Uppercase variants for modern templates
      '{{CHALLAN_NO}}': challan.challanNumber,
      '{{ISSUE_DATE}}': formatDate(new Date()),
      '{{DUE_DATE}}': formatDate(challan.dueDate),
      '{{VALID_DATE}}': formatDate(new Date(new Date(challan.dueDate).setDate(new Date(challan.dueDate).getDate() + 7))),
      '{{STUDENT_NAME}}': `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
      '{{FATHER_NAME}}': student.fatherOrguardian || '',
      '{{ROLL_NO}}': student.rollNumber,
      '{{CLASS}}': studentClass,
      '{{SECTION}}': '',
      '{{PROGRAM}}': studentProgram,
      '{{FULL_CLASS}}': fullClass,
      '{{TOTAL_AMOUNT}}': standardTotal.toLocaleString(),
      '{{SCHOLARSHIP}}': scholarship.toLocaleString(),
      '{{NET_PAYABLE}}': netPayable.toLocaleString(),
      '{{AMOUNT_IN_WORDS}}': numberToWords(netPayable),
      '{{FEE_HEADS_TABLE}}': feeHeadsRowsHtml,
    };

    let finalHtml = templateContent;

    // Runtime Injection for legacy templates missing {{FEE_HEADS_TABLE}}
    if (!finalHtml.includes('{{FEE_HEADS_TABLE}}') && !finalHtml.includes('{{feeHeadsRows}}')) {
      // Find where to inject. Usually before Tuition Fee row or within the particulars table.
      // We look for "Tuition Fee" label or the replacement tag.
      const tuitionRowRegex = /(<tr>\s*<td[^>]*>(?:Tuition Fee|{{Tuition Fee}})<\/td>)/i;
      if (tuitionRowRegex.test(finalHtml)) {
        finalHtml = finalHtml.replace(tuitionRowRegex, `${feeHeadsRowsHtml}$1`);
      }
    }

    // Perform Replacements
    Object.entries(replacements).forEach(([key, value]) => {
      // Escape for regex and replace all
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      finalHtml = finalHtml.replace(new RegExp(escapedKey, 'g'), value);
    });

    return finalHtml;
  };

  const handleBulkPrint = async () => {
    try {
      setBulkPrinting(true);
      const [year, month] = bulkPrintFilters.month.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;

      // Fetch all matching challans using the dedicated bulk API
      const response = await getBulkChallans({
        programId: bulkPrintFilters.programId === "all" ? "" : bulkPrintFilters.programId,
        classId: bulkPrintFilters.classId === "all" ? "" : bulkPrintFilters.classId,
        sectionId: bulkPrintFilters.sectionId === "all" ? "" : bulkPrintFilters.sectionId,
        startDate,
        endDate
      });

      const challans = response || [];
      if (challans.length === 0) {
        toast({ title: "No challans found", description: "No challans match the selected filters for this month.", variant: "destructive" });
        return;
      }

      const template = await getDefaultFeeChallanTemplate();
      if (!template || !template.htmlContent) {
        toast({ title: "Template Missing", description: "No default challan template found.", variant: "destructive" });
        return;
      }

      // Generate HTML with page breaks and spacing for preview (LIMIT TO 5)
      let previewHtml = "";
      const previewLimit = 5;
      const previewChallans = challans.slice(0, previewLimit);

      previewChallans.forEach((challan, index) => {
        const challanHtml = generateChallanHtml(challan, template.htmlContent);
        previewHtml += `
          <div class="bulk-challan-item" style="margin-bottom: 40px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 40px;">
            ${challanHtml}
          </div>
        `;
      });

      setBulkChallansList(challans);
      setBulkPreviewContent(previewHtml);
      setBulkPreviewOpen(true);
      setBulkPrintOpen(false); // Close the filter dialog
    } catch (error) {
      console.error("Bulk print failed:", error);
      toast({ title: "Print error", description: "Failed to generate bulk print view.", variant: "destructive" });
    } finally {
      setBulkPrinting(false);
    }
  };

  const finalizeBulkPrint = async () => {
    try {
      const template = await getDefaultFeeChallanTemplate();
      if (!template || !template.htmlContent) {
        toast({ title: "Template Missing", description: "No default challan template found.", variant: "destructive" });
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: "Pop-up blocked", description: "Please allow pop-ups to print challans.", variant: "destructive" });
        return;
      }

      let fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @media print {
              .page-break { page-break-after: always; }
              @page { margin: 0; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
      `;

      bulkChallansList.forEach((challan, index) => {
        const challanHtml = generateChallanHtml(challan, template.htmlContent);
        fullHtml += `<div class="${index < bulkChallansList.length - 1 ? 'page-break' : ''}">${challanHtml}</div>`;
      });

      fullHtml += `</body></html>`;

      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error) {
      console.error("Finalize print failed:", error);
      toast({ title: "Print error", description: "Failed to generate full print view.", variant: "destructive" });
    }
  };

  const printChallan = async challanId => {
    const challan = feeChallans.find(c => c.id === challanId);
    if (!challan) return;

    try {
      // 1. Fetch Fresh Default Template (bypass cache for latest print version)
      const template = await getDefaultFeeChallanTemplate();
      if (!template || !template.htmlContent) {
        toast({
          title: "Template Missing",
          description: "No default challan template found. Please mark a template as default first.",
          variant: "destructive",
        });
        return;
      }

      // 2. Generate HTML
      const finalHtml = generateChallanHtml(challan, template.htmlContent);

      // 3. Print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: "Pop-up blocked", description: "Please allow pop-ups to print challans.", variant: "destructive" });
        return;
      }

      printWindow.document.write(finalHtml);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        // Optional: printWindow.close();
      };
    } catch (error) {
      console.error("Print failed:", error);
      toast({ title: "Print error", description: "Failed to generate print view.", variant: "destructive" });
    }
  };

  const printFeeStructure = structureId => {
    const structure = feeStructures.find(s => s.id === structureId);
    if (!structure) return;
    const heads = structure.feeHeads.map(h => h.feeHead);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Structure - ${structure.program?.name} ${structure.class?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; }
            .total { font-weight: bold; font-size: 18px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEE STRUCTURE</h1>
            <h2>${structure.program?.name} - ${structure.class?.name}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fee Head</th>
                <th>Description</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${heads.map(head => `
                <tr>
                  <td>${head.name}</td>
                  <td>${head.description}</td>
                  <td>${head.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="2">Total Amount</td>
                <td>PKR ${structure.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2">Installments</td>
                <td>${structure.installments}</td>
              </tr>
              <tr>
                <td colspan="2">Per Installment</td>
                <td>PKR ${(structure.totalAmount / structure.installments).toLocaleString()}</td>
              </tr>
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

  return <DashboardLayout>
    <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="w-8 h-8 text-primary" />
              Fee Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive fee tracking and management system
            </p>
          </div>
        </div>

      <Tabs defaultValue="challans" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 h-auto gap-1">
          <TabsTrigger value="challans"><Receipt className="w-4 h-4 mr-2" />Challans</TabsTrigger>
          <TabsTrigger value="extra-challans"><Plus className="w-4 h-4 mr-2" />Extra Challans</TabsTrigger>
          <TabsTrigger value="student-history"><Eye className="w-4 h-4 mr-2" />Student History</TabsTrigger>
          <TabsTrigger value="feeheads"><Layers className="w-4 h-4 mr-2" />Fee Heads</TabsTrigger>
          <TabsTrigger value="structures"><TrendingUp className="w-4 h-4 mr-2" />Fee Structures</TabsTrigger>
          <TabsTrigger value="reports"><DollarSign className="w-4 h-4 mr-2" />Reports</TabsTrigger>
          <TabsTrigger value="settings"><Edit className="w-4 h-4 mr-2" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="challans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold text-success">PKR {formatAmount(totalReceived)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-warning">PKR {formatAmount(totalPending)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Challans</CardTitle>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Search</Label>
                  <Input
                    placeholder="Challan #, name, roll..."
                    value={challanSearch}
                    onChange={(e) => setChallanSearch(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={challanFilter} onValueChange={setChallanFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Billing Installment</Label>
                  <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Installments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Installments</SelectItem>
                      {Array.from({ length: Math.max(...feeStructures.map(s => s.installments || 0), 12) }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>Installment # {num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setChallanSearch("");
                      setChallanFilter("all");
                      setSelectedInstallment("all");
                      setSelectedMonth("");
                    }}
                    className="h-9 px-2 text-muted-foreground"
                  >
                    Reset
                  </Button>
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkPrintOpen(true)}
                    className="h-9 gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Printer className="w-4 h-4" /> Bulk Print
                  </Button> */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setGenerateResults(null);
                      setGenerateDialogOpen(true);
                    }}
                    className="h-9 gap-2"
                  >
                    <Plus className="w-4 h-4" /> Generate Challans
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Standard Amt</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeChallans
                      .map(challan => {
                        return <TableRow key={challan.id}>
                          <TableCell className="font-medium">{challan.challanNumber}</TableCell>
                          <TableCell>
                            <div>{challan.student?.fName} {challan.student?.lName}</div>
                            <div className="text-xs text-muted-foreground">{challan.student?.rollNumber}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {challan.coveredInstallments || (challan.installmentNumber === 0 ? "Additional Charges" : `#${challan.installmentNumber}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>PKR {formatAmount((challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0))}</TableCell>
                          <TableCell className="font-bold">PKR {formatAmount((challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0))}</TableCell>
                          <TableCell className="text-success">PKR {formatAmount(challan.paidAmount || 0)}</TableCell>
                          <TableCell>
                            <div>{new Date(challan.dueDate).toLocaleDateString()}</div>
                            {challan.lateFeeFine > 0 && (
                              <div className="text-[10px] text-destructive font-bold">
                                Late Fee: PKR {formatAmount(challan.lateFeeFine)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "PARTIAL" ? "warning" : "secondary"}>
                              {challan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setSelectedChallanDetails(challan);
                                setDetailsDialogOpen(true);
                              }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {challan.status !== "PAID" && <Button size="sm" variant="outline" onClick={async () => {
                                setEditingChallan(challan);
                                
                                // Fetch plan for the student to show arrears checklist
                                let fetchedPlan = [];
                                try {
                                  const results = await getInstallmentPlans({
                                    studentId: challan.studentId,
                                  });
                                  fetchedPlan = results[0]?.feeInstallments || [];
                                  setGenStudentPlan(fetchedPlan);
                                } catch (error) {
                                  console.error("Failed to fetch plan for edit:", error);
                                }

                                // Pre-populate arrears selections from covered installments
                                const coveredNums = challan.coveredInstallments
                                  ? challan.coveredInstallments.split(',').map(Number)
                                  : [];
                                const originalDate = new Date(challan.dueDate);
                                const currentInstNum = challan.installmentNumber || 0;
                                // Find past installments that were covered by this challan (excluding the current one)
                                const preSelectedArrears = fetchedPlan
                                  .filter(inst => {
                                    const instNum = inst.installmentNumber;
                                    return coveredNums.includes(instNum) && instNum !== currentInstNum;
                                  })
                                  .map(inst => ({
                                    id: inst.id,
                                    amount: inst.remainingAmount || (inst.amount - (inst.paidAmount || 0)),
                                    lateFee: calculateLateFee(inst.dueDate, lateFeeFine)
                                  }));
                                const preSelectedArrearsTotal = preSelectedArrears.reduce((sum, a) => sum + a.amount, 0);

                                setChallanForm({
                                  studentId: challan.studentId.toString(),
                                  amount: ((challan.amount || 0) - (challan.arrearsAmount || 0)).toString(),
                                  dueDate: new Date(challan.dueDate),
                                  arrearsAmount: preSelectedArrearsTotal > 0 ? preSelectedArrearsTotal.toString() : ((challan.arrearsAmount !== undefined && challan.arrearsAmount !== null) ? challan.arrearsAmount.toString() : "0"),
                                  arrearsSelections: preSelectedArrears,
                                  fineAmount: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);

                                      const selectedIds = Array.isArray(raw) ? raw.map(item => {
                                        if (typeof item === 'object' && item !== null) return item.isSelected ? Number(item.id) : null;
                                        return Number(item);
                                      }).filter(id => id !== null && !isNaN(id)) : [];

                                      const snapshotSum = Array.isArray(raw) ? raw.reduce((s, item) => {
                                        if (typeof item === 'object' && item !== null && item.isSelected && item.type === 'additional') {
                                          return s + (item.amount || 0);
                                        }
                                        return s;
                                      }, 0) : 0;

                                      if (snapshotSum > 0) return snapshotSum.toString();

                                      const lookupSum = feeHeads
                                        .filter(h => selectedIds.includes(Number(h.id)) && !h.isTuition)
                                        .reduce((s, h) => s + (parseFloat(h.amount) || 0), 0);

                                      return (lookupSum || challan.fineAmount || 0).toString();
                                    } catch (e) {
                                      return (challan.fineAmount || 0).toString();
                                    }
                                  })(),
                                  remarks: challan.remarks || "",
                                  installmentNumber: (challan.installmentNumber || 0).toString(),
                                  selectedHeads: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);
                                      if (!Array.isArray(raw)) return [];
                                      return raw.map(item => {
                                        if (typeof item === 'object' && item !== null) {
                                          return item.isSelected ? Number(item.id) : null;
                                        }
                                        return Number(item);
                                      }).filter(id => id !== null && !isNaN(id));
                                    } catch (e) {
                                      console.error("Failed to parse selectedHeads:", e);
                                      return [];
                                    }
                                  })()
                                });
                                setChallanOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>}
                              <Button size="sm" variant="outline" onClick={() => printChallan(challan.id)}>
                                <Printer className="w-4 h-4" />
                              </Button>
                              {challan.status !== "PAID" && <Button size="sm" variant="outline" onClick={() => handlePayment(challan)}>
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {feeChallans.length} of {challanMeta?.total || 0} challans
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isChallansLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {challanMeta?.lastPage || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= (challanMeta?.lastPage || 1) || isChallansLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extra-challans" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Extra / Fee-Head-Only Challans</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Generate challans for specific fee heads (exam fee, registration, lab, etc.) not tied to installments.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Search Student</Label>
                    <Popover open={extraStudentSearchOpen} onOpenChange={setExtraStudentSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                          {extraSelectedStudent ? `${extraSelectedStudent.fName} ${extraSelectedStudent.lName || ''} (${extraSelectedStudent.rollNumber})` : "Select Student..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search by name or roll..." onValueChange={v => handleStudentSearch(v, setExtraStudentResults)} />
                          <CommandList>
                            <CommandEmpty>No student found.</CommandEmpty>
                            <CommandGroup>
                              {extraStudentResults.map(student => (
                                <CommandItem
                                  key={student.id}
                                  value={student.id.toString()}
                                  onSelect={() => {
                                    setExtraSelectedStudent(student);
                                    setExtraStudentSearchOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", extraSelectedStudent?.id === student.id ? "opacity-100" : "opacity-0")} />
                                  {student.rollNumber} ({student.fName} {student.mName || ''} {student.lName || ''})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-9 text-sm justify-start text-left font-normal", !extraDueDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {extraDueDate ? format(extraDueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={extraDueDate} onSelect={setExtraDueDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {extraSelectedStudent && (
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/10">
                    <div>
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Select Fee Heads</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {feeHeads.filter(h => !h.isTuition).map(head => (
                          <div key={head.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-orange-50 transition-colors">
                            <input
                              type="checkbox"
                              id={`extra-head-${head.id}`}
                              className="accent-orange-600 h-4 w-4"
                              checked={extraSelectedHeads.includes(head.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExtraSelectedHeads([...extraSelectedHeads, head.id]);
                                } else {
                                  setExtraSelectedHeads(extraSelectedHeads.filter(id => id !== head.id));
                                }
                              }}
                            />
                            <label htmlFor={`extra-head-${head.id}`} className="text-sm cursor-pointer flex-1 flex justify-between">
                              <span>{head.name}</span>
                              <span className="text-muted-foreground italic">PKR {head.amount.toLocaleString()}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Remarks</Label>
                      <Textarea value={extraRemarks} onChange={e => setExtraRemarks(e.target.value)} placeholder="Optional notes..." className="text-sm min-h-[60px]" />
                    </div>

                    {extraSelectedHeads.length > 0 && (() => {
                      const charges = feeHeads.filter(h => extraSelectedHeads.includes(h.id) && !h.isDiscount).reduce((s, h) => s + h.amount, 0);
                      return (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex justify-between text-sm">
                            <span>Charges:</span><span className="font-semibold">PKR {charges.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-orange-300 mt-1 pt-1">
                            <span>Total:</span><span>PKR {charges.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end">
                      <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={extraSelectedHeads.length === 0 || !extraDueDate || isGenerating}
                        onClick={async () => {
                          setIsGenerating(true);
                          try {
                            const result = await generateChallansFromPlan({
                              month: format(extraDueDate, "yyyy-MM"),
                              studentId: extraSelectedStudent.id,
                              customAmount: 0,
                              selectedHeads: extraSelectedHeads,
                              customArrearsAmount: 0,
                              remarks: extraRemarks || "Extra fee head challan",
                              dueDate: format(extraDueDate, "yyyy-MM-dd"),
                            });

                            if (result && result.length > 0 && result[0].status === 'CREATED') {
                              toast({ title: "Extra challan created successfully" });
                              queryClient.invalidateQueries(['feeChallans']);
                              setExtraSelectedStudent(null);
                              setExtraSelectedHeads([]);
                              setExtraRemarks("");
                            } else {
                              const reason = result?.[0]?.reason || "Could not create challan. Student may not have an installment plan for this month.";
                              toast({ title: reason, variant: "destructive" });
                            }
                          } catch (err) {
                            toast({ title: err.message || "Failed to create extra challan", variant: "destructive" });
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                      >
                        {isGenerating ? "Creating..." : "Create Extra Challan"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-history">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Search Student:</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={studentSearchOpen} className="w-[300px] justify-between">
                    {selectedStudent ? `${selectedStudent.rollNumber} (${selectedStudent.fName} ${selectedStudent.mName} ${selectedStudent.lName})` : "Select Student..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search student..." onValueChange={v => handleStudentSearch(v, setStudentSearchResults)} />
                    <CommandList>
                      <CommandEmpty>No student found.</CommandEmpty>
                      <CommandGroup>
                        {studentSearchResults.map(student => (
                          <CommandItem
                            key={student.id}
                            value={student.id.toString()}
                            onSelect={async () => {
                              setSelectedStudent(student);
                              setStudentSearchOpen(false);
                              try {
                                const history = await getStudentFeeHistory(student.id);
                                setStudentFeeHistory(history);
                              } catch (err) {
                                console.error(err);
                                toast({ title: "Failed to fetch history", variant: "destructive" });
                              }
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedStudent?.id === student.id ? "opacity-100" : "opacity-0")} />
                            {student.rollNumber} ({student.fName} {student.mName} {student.lName})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedStudent && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Standard Amt</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFeeHistory.map(challan => (
                      <TableRow key={challan.id}>
                        <TableCell>{challan.challanNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">#{challan.installmentNumber}</Badge>
                        </TableCell>
                        <TableCell>PKR {formatAmount(challan.amount)}</TableCell>
                        <TableCell className="font-bold">PKR {formatAmount((challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0))}</TableCell>
                        <TableCell>{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : "secondary"}>
                            {challan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{challan.paidDate ? new Date(challan.paidDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{challan.paidAmount ? `PKR ${formatAmount(challan.paidAmount)}` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedChallanDetails(challan);
                            setDetailsDialogOpen(true);
                          }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {studentFeeHistory.length === 0 && <TableRow><TableCell colSpan={9} className="text-center">No history found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="feeheads" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Heads</CardTitle>
                <Button onClick={() => {
                  resetFeeHeadForm();
                  setFeeHeadOpen(true);
                }} className="gap-2">
                  <Plus className="w-4 h-4" />Add Fee Head
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeHeads.map(head => <TableRow key={head.id}>
                      <TableCell className="font-medium">{head.name}</TableCell>
                      <TableCell>{head.description}</TableCell>
                      <TableCell>PKR {(head.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge>Charge</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingFeeHead(head);
                            setFeeHeadForm({
                              name: head.name,
                              description: head.description,
                              amount: head.amount.toString(),
                              isTuition: head.isTuition || false,
                              isFine: head.isFine || false,
                              isLabFee: head.isLabFee || false,
                              isLibraryFee: head.isLibraryFee || false,
                              isRegistrationFee: head.isRegistrationFee || false,
                              isAdmissionFee: head.isAdmissionFee || false,
                              isProspectusFee: head.isProspectusFee || false,
                              isExaminationFee: head.isExaminationFee || false,
                              isAlliedCharges: head.isAlliedCharges || false,
                              isHostelFee: head.isHostelFee || false,
                              isOther: head.isOther || false
                            });
                            setFeeHeadOpen(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "feeHead",
                              id: head.id
                            });
                            setDeleteDialogOpen(true);
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

        <TabsContent value="structures" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fee Structures</CardTitle>
                <Button onClick={() => {
                  resetStructureForm();
                  setStructureOpen(true);
                }} className="gap-2">
                  <Plus className="w-4 h-4" />Add Structure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map(structure => <TableRow key={structure.id}>
                      <TableCell><Badge>{structure.program?.name}</Badge></TableCell>
                      <TableCell>{structure.class?.name}</TableCell>
                      <TableCell className="font-semibold">PKR {structure.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{structure.installments}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => printFeeStructure(structure.id)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingStructure(structure);
                            setStructureForm({
                              programId: structure.programId.toString(),
                              classId: structure.classId.toString(),
                              totalAmount: structure.totalAmount.toString(),
                              installments: structure.installments.toString()
                            });
                            setStructureOpen(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "structure",
                              id: structure.id
                            });
                            setDeleteDialogOpen(true);
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

        <TabsContent value="reports">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Collection Summary</CardTitle>
                  <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (Last 30 Days)</SelectItem>
                      <SelectItem value="weekly">Weekly (Last 12 Weeks)</SelectItem>
                      <SelectItem value="month">Monthly (Last 12 Months)</SelectItem>
                      <SelectItem value="year">Yearly (Last 5 Years)</SelectItem>
                      <SelectItem value="overall">Overall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between p-4 border rounded-lg">
                    <span>Total Revenue</span>
                    <span className="font-bold text-2xl">PKR {totalReceived?.toLocaleString() || "0"}</span>
                  </div>
                  <div className="flex justify-between p-4 border rounded-lg">
                    <span>Outstanding</span>
                    <span className="font-bold text-2xl text-warning">PKR {totalPending?.toLocaleString() || "0"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Revenue Over Time</CardTitle>
                    {/* Filter moved to top */}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tickFormatter={(value) => {
                            // Simple formatting for daily dates (YYYY-MM-DD) to (DD MMM)
                            if (reportFilter === 'daily' && value.includes('-')) {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                            }
                            return value;
                          }}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                        <Legend />
                        <Line type="monotone" dataKey="value" name="Revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Collection vs Outstanding (Per Class)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[500px] pr-4 border rounded-md">
                    {/* Dynamic height based on data length to ensure "at a glance" view without internal scroll */}
                    <div style={{ height: `${Math.max(500, (classCollectionData?.length || 0) * 50)}px` }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={classCollectionData}
                          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={160}
                            tick={{ fontSize: 11 }}
                            interval={0}
                          />
                          <Tooltip
                            formatter={(value) => `PKR ${value.toLocaleString()}`}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="collected" name="Collected" fill="#4ade80" radius={[0, 4, 4, 0]} barSize={15} />
                          <Bar dataKey="outstanding" name="Outstanding" fill="#facc15" radius={[0, 4, 4, 0]} barSize={15} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Institute Settings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Configure global parameters for the institute.</p>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lateFeeFine">Late Fee Fine (Per Day)</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="lateFeeFine"
                      type="number"
                      value={lateFeeFine}
                      onChange={(e) => setLateFeeFine(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount per day"
                    />
                    <Button
                      onClick={() => updateSettingsMutation.mutate({ lateFeeFine })}
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    This fine will be applied automatically to all overdue challans.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      <Dialog open={feeHeadOpen} onOpenChange={setFeeHeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeeHead ? "Edit" : "Add"} Fee Head</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={feeHeadForm.name} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                name: e.target.value
              })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={feeHeadForm.description} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                description: e.target.value
              })} />
            </div>
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input type="number" value={feeHeadForm.amount} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                amount: e.target.value
              })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isTuition" checked={feeHeadForm.isTuition} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isTuition: e.target.checked,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false,
                  isOther: false
                })} className="w-4 h-4" />
                <Label htmlFor="isTuition">Tuition Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isFine" checked={feeHeadForm.isFine} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isFine: e.target.checked,
                  isTuition: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false,
                  isOther: false
                })} className="w-4 h-4" />
                <Label htmlFor="isFine">Fine</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isLabFee" checked={feeHeadForm.isLabFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isTuition: false,
                  isFine: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false,
                  isOther: false
                })} className="w-4 h-4" />
                <Label htmlFor="isLabFee">Lab Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isLibraryFee" checked={feeHeadForm.isLibraryFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isLibraryFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isLibraryFee">Library Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isRegistrationFee" checked={feeHeadForm.isRegistrationFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isRegistrationFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isRegistrationFee">Registration Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isAdmissionFee" checked={feeHeadForm.isAdmissionFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isAdmissionFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isAdmissionFee">Admission Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isProspectusFee" checked={feeHeadForm.isProspectusFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isProspectusFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isProspectusFee">Prospectus Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isExaminationFee" checked={feeHeadForm.isExaminationFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isExaminationFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isExaminationFee">Examination Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isAlliedCharges" checked={feeHeadForm.isAlliedCharges} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isAlliedCharges: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isAlliedCharges">Allied Charges</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isHostelFee" checked={feeHeadForm.isHostelFee} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isHostelFee: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isOther: false
                })} className="w-4 h-4" />
                <Label htmlFor="isHostelFee">Hostel Fee</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isOther" checked={feeHeadForm.isOther} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isOther: e.target.checked,
                  isTuition: false,
                  isFine: false,
                  isLabFee: false,
                  isLibraryFee: false,
                  isRegistrationFee: false,
                  isAdmissionFee: false,
                  isProspectusFee: false,
                  isExaminationFee: false,
                  isAlliedCharges: false,
                  isHostelFee: false
                })} className="w-4 h-4" />
                <Label htmlFor="isOther">Others</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFeeHeadOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitFeeHead}
                disabled={createHeadMutation.isPending || updateHeadMutation.isPending}
              >
                {createHeadMutation.isPending || updateHeadMutation.isPending ? "Saving..." : (editingFeeHead ? "Update" : "Add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStructure ? "Edit" : "Add"} Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={structureForm.programId?.toString()} onValueChange={v => setStructureForm({
                  ...structureForm,
                  programId: v,
                  classId: ""
                })}>
                  <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={structureForm.classId?.toString()} onValueChange={v => setStructureForm({
                  ...structureForm,
                  classId: v
                })}>
                  <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>
                    {classes
                      .filter(c => !structureForm.programId || c.programId.toString() === structureForm.programId.toString())
                      .map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Amount (PKR)</Label>
              <Input
                type="number"
                value={structureForm.totalAmount || ''}
                onChange={e => setStructureForm({
                  ...structureForm,
                  totalAmount: e.target.value
                })}
                placeholder="Enter total tuition amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Installments</Label>
              <Input type="number" value={structureForm.installments} onChange={e => setStructureForm({
                ...structureForm,
                installments: e.target.value
              })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStructureOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitStructure}
                disabled={createStructureMutation.isPending || updateStructureMutation.isPending}
              >
                {createStructureMutation.isPending || updateStructureMutation.isPending ? "Saving..." : (editingStructure ? "Update" : "Add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) { setItemToPay(null); setPaymentAmount(""); }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {itemToPay && (() => {
                  const netPayable = (itemToPay.amount || 0) + (itemToPay.fineAmount || 0) + (itemToPay.lateFeeFine || 0);
                  const remaining = Math.max(0, netPayable - (itemToPay.paidAmount || 0));
                  return (
                    <div className="mt-2 space-y-3">
                      <div className="p-2 bg-muted rounded-md space-y-1 text-sm">
                        {(itemToPay.paidAmount || 0) > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Already Paid:</span>
                            <span>PKR {formatAmount(itemToPay.paidAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>Remaining Due:</span>
                          <span>PKR {formatAmount(remaining)}</span>
                        </div>
                      </div>
                      <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
                        <p className="text-xs text-center font-medium text-primary">
                          Confirming this will record the full amount of <strong>PKR {formatAmount(remaining)}</strong> as paid.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              disabled={updateChallanMutation.isPending}
            >
              {updateChallanMutation.isPending ? "Processing..." : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={challanOpen} onOpenChange={(open) => {
        setChallanOpen(open);
        if (!open) {
          resetChallanForm();
        }
      }}>
        <DialogContent className="max-w-4xl p-3 md:p-4 max-h-[96vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-1 border-b mb-2">
            <DialogTitle className="text-base font-bold">
              {challanForm.installmentNumber ? "Edit Fee Challan" : "Edit Extra Fee Challan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-0 overflow-y-auto overflow-x-hidden pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-2 bg-muted/15">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Student</Label>
                <Input
                  value={editingChallan?.student ? `${editingChallan.student.fName} ${editingChallan.student.lName} (${editingChallan.student.rollNumber})` : ""}
                  disabled
                  className="bg-muted/50 h-8 text-sm"
                />
              </div>
              {challanForm.installmentNumber > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Installment Details</Label>
                  <Input
                    value={`Installment #${challanForm.installmentNumber}`}
                    disabled
                    className="bg-muted/50 h-8 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full h-8 text-xs justify-start text-left font-normal",
                        !challanForm.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {challanForm.dueDate ? format(challanForm.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={challanForm.dueDate}
                      onSelect={(date) => setChallanForm({ ...challanForm, dueDate: date })}
                      initialFocus
                      disabled={(date) => {
                        if (!editingChallan) return false;
                        const originalDate = new Date(editingChallan.dueDate);
                        const start = startOfMonth(originalDate);
                        const end = endOfMonth(originalDate);
                        return date < start || date > end;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {challanForm.installmentNumber > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Billing Amount (Tuition)</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">Rs.</span>
                    <Input
                      type="number"
                      min="0"
                      value={challanForm.amount}
                      onChange={(e) => setChallanForm({ ...challanForm, amount: e.target.value })}
                      className="pl-8 h-8 text-sm font-semibold text-orange-700"
                    />
                  </div>
                </div>
              )}

              <div className="col-span-2 space-y-1 pt-1 border-t">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Unpaid Arrears / Past Installments</Label>
                <div className="border rounded-md overflow-hidden bg-white/40 shadow-inner">
                  <Table>
                    <TableHeader className="bg-muted/50 h-7">
                      <TableRow className="hover:bg-transparent border-b-0">
                        <TableHead className="w-[30px] p-0 text-center"></TableHead>
                        <TableHead className="text-[9px] uppercase font-bold p-1">Month</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold p-1">Class</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Balance</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Late Fee</TableHead>
                        <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        if (!editingChallan) return null;
                        const originalDate = new Date(editingChallan.dueDate);
                        const targetInst = genStudentPlan.find(inst => {
                          const d = new Date(inst.dueDate);
                          return d.getFullYear() === originalDate.getFullYear() && (d.getMonth() + 1) === (originalDate.getMonth() + 1);
                        });
                        const pastUnpaid = genStudentPlan.filter(inst => {
                          const d = new Date(inst.dueDate);
                          return targetInst ? d < new Date(targetInst.dueDate) : true;
                        }).filter(inst => (inst.amount - (inst.paidAmount || 0)) > 0);

                        if (pastUnpaid.length === 0) {
                          return <TableRow><TableCell colSpan={5} className="text-[10px] text-center py-2 text-muted-foreground">No unpaid past installments</TableCell></TableRow>;
                        }

                        return pastUnpaid.map(inst => {
                          const balance = inst.amount - (inst.paidAmount || 0);
                          const lateFee = calculateLateFee(inst.dueDate, lateFeeFine);
                          const rowTotal = balance + lateFee;
                          const isSelected = (challanForm.arrearsSelections || []).some(a => a.id === inst.id);
                          
                          return (
                            <TableRow key={inst.id} className={cn("hover:bg-orange-50/50 border-b border-muted/20 h-8", isSelected && "bg-orange-50/30")}>
                              <TableCell className="p-0 text-center">
                                <input
                                  type="checkbox"
                                  className="accent-orange-600 h-3 w-3 cursor-pointer"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    let newSelections = [...(challanForm.arrearsSelections || [])];
                                    if (e.target.checked) {
                                      newSelections.push({ id: inst.id, amount: balance, lateFee });
                                    } else {
                                      newSelections = newSelections.filter(a => a.id !== inst.id);
                                    }
                                    
                                    const totalArrears = newSelections.reduce((sum, a) => sum + a.amount, 0);
                                    setChallanForm({
                                      ...challanForm,
                                      arrearsSelections: newSelections,
                                      arrearsAmount: totalArrears.toString()
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-[10px] p-1 font-medium">{format(new Date(inst.dueDate), "MMM yyyy")}</TableCell>
                              <TableCell className="text-[10px] p-1 truncate max-w-[60px]">{inst.class?.name || "---"}</TableCell>
                              <TableCell className="text-[10px] p-1 text-right">Rs. {balance.toLocaleString()}</TableCell>
                              <TableCell className="text-[10px] p-1 text-right text-red-600 font-medium">+{lateFee.toLocaleString()}</TableCell>
                              <TableCell className="text-[10px] p-1 text-right font-bold">Rs. {rowTotal.toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="col-span-2 space-y-1 pt-1.5 border-t text-sm">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Additional Fee Heads</Label>
                  <div className="grid grid-cols-2 gap-1 border rounded-md p-1.5 max-h-[85px] overflow-y-auto bg-white/40 shadow-inner scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {feeHeads.filter(h => !h.isTuition).map(head => (
                      <div key={head.id} className="flex items-center space-x-2 p-1.5 hover:bg-orange-50 rounded transition-colors group">
                        <input
                          type="checkbox"
                          id={`edit-head-${head.id}`}
                          className="accent-orange-600 h-3.5 w-3.5 rounded"
                          checked={(challanForm.selectedHeads || []).some(id => Number(id) === Number(head.id))}
                          onChange={(e) => {
                            const headId = Number(head.id);
                            const selected = [...(challanForm.selectedHeads || [])].map(id => Number(id));

                            if (e.target.checked) {
                              if (!selected.includes(headId)) selected.push(headId);
                            } else {
                              const index = selected.indexOf(headId);
                              if (index > -1) selected.splice(index, 1);
                            }

                            const additionalSum = feeHeads
                              .filter(h => selected.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                              .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                            setChallanForm({
                              ...challanForm,
                              selectedHeads: selected,
                              fineAmount: additionalSum,
                              discount: "0"
                            });
                          }}
                        />
                        <label htmlFor={`edit-head-${head.id}`} className="text-[11px] cursor-pointer flex-1 flex justify-between items-center">
                          <span className="truncate group-hover:text-orange-700">{head.name}</span>
                          <span className="text-muted-foreground pl-1 italic">Rs. {head.amount.toLocaleString()}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Remarks</Label>
                  <Textarea
                    placeholder="Optional notes for this challan"
                    value={challanForm.remarks}
                    onChange={(e) => setChallanForm({ ...challanForm, remarks: e.target.value })}
                    className="text-xs min-h-[40px] h-[40px] resize-none py-1 px-2"
                  />
                </div>

                <div className="pt-2 border-t bg-orange-50/10 -mx-2 -mb-2 p-2 rounded-b-lg border-orange-100">
                  {(() => {
                    const originalDate = editingChallan ? new Date(editingChallan.dueDate) : new Date();
                    const selYear = originalDate.getFullYear();
                    const selMonth = originalDate.getMonth() + 1;

                    const targetInst = genStudentPlan.find(inst => {
                      const d = new Date(inst.dueDate);
                      return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                    });

                    // For editing, "paid" should exclude the current challan if possible,
                    // but usually challans are edited before being paid.
                    // If PAID, the paidAmount on installment includes this challan.
                    // This is just a UI preview.
                    const tuitionTotal = targetInst ? targetInst.amount : (parseFloat(editingChallan?.amount) || 0);
                    const tuitionPaid = targetInst ? (targetInst.paidAmount || 0) : (parseFloat(editingChallan?.paidAmount) || 0);
                    const tuitionPending = targetInst ? (targetInst.pendingAmount || 0) : 0;
                    const tuitionRemaining = targetInst ? (targetInst.remainingAmount || 0) : 0;

                    const tuitionSelected = parseFloat(challanForm.amount) || 0;

                    const arrears = (challanForm.arrearsSelections || []).reduce((sum, a) => sum + a.amount, 0);
                    const arrearsLateFee = (challanForm.arrearsSelections || []).reduce((sum, a) => sum + a.lateFee, 0);

                    const selectedHeadIds = (challanForm.selectedHeads || []).map(id => Number(id));
                    const additionalSum = feeHeads
                      .filter(h => selectedHeadIds.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                      .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                    const currentChallanLateFee = editingChallan?.lateFeeFine || 0;
                    const grandTotal = tuitionSelected + arrears + additionalSum + arrearsLateFee + currentChallanLateFee;

                    return (
                      <div className="space-y-1.5">
                        {challanForm.installmentNumber > 0 ? (
                          <>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                              <span>Inst. Overview</span>
                              <span className="text-orange-700">Total: Rs. {tuitionTotal.toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-center py-1">
                              <div className="flex flex-col border rounded bg-white p-1">
                                <span className="text-[8px] text-muted-foreground uppercase font-bold">Paid</span>
                                <span className="text-[10px] font-bold text-success">Rs. {tuitionPaid.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-orange-50 p-1 border-orange-100">
                                <span className="text-[8px] text-orange-600 uppercase font-bold">Pending</span>
                                <span className="text-[10px] font-bold text-orange-700">Rs. {tuitionPending.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-blue-50 p-1 border-blue-100">
                                <span className="text-[8px] text-blue-600 uppercase font-bold">Available</span>
                                <span className="text-[10px] font-bold text-blue-700">Rs. {tuitionRemaining.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-orange-600 p-1 border-orange-700 text-white">
                                <span className="text-[8px] uppercase font-bold opacity-80">This Bill</span>
                                <span className="text-[10px] font-bold">Rs. {tuitionSelected.toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                            <span>Extra Fee Bill</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] px-1 border-t pt-1">
                          <div className="flex justify-between text-red-600">
                            <span className="font-semibold italic flex items-center gap-1"><History className="h-2.5 w-2.5" /> Arrears:</span>
                            <span className="font-bold">Rs. {arrears.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-blue-600">
                            <span className="font-semibold italic flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Extra:</span>
                            <span className="font-bold">Rs. {additionalSum.toLocaleString()}</span>
                          </div>
                          {editingChallan?.lateFeeFine > 0 && (
                            <div className="col-span-2 flex justify-between border-t border-dashed pt-0.5 mt-0.5">
                              <span className="text-destructive font-semibold italic">Late Fee Fine:</span>
                              <span className="text-destructive font-bold">Rs. {editingChallan.lateFeeFine.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-1 mt-1 border-t-2 border-orange-300 flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-orange-800 uppercase">Grand Total Payable</span>
                          <span className="text-lg font-black text-orange-700">Rs. {grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setChallanOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmitChallan} disabled={updateChallanMutation.isPending} className="h-8 text-xs bg-orange-600 hover:bg-orange-700">
              {updateChallanMutation.isPending ? "Saving..." : "Update Challan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkPreviewOpen} onOpenChange={setBulkPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center gap-4">
              <div className="flex flex-col">
                <span>Bulk Challan Preview</span>
                <span className="text-xs font-normal text-muted-foreground mt-1">
                  Showing first {Math.min(bulkChallansList.length, 5)} of {bulkChallansList.length} challans
                </span>
              </div>
              <Button onClick={finalizeBulkPrint} className="gap-2 bg-success hover:bg-success/90">
                <Printer className="w-4 h-4" /> Print All {bulkChallansList.length} Challans
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: bulkPreviewContent }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkPrintOpen} onOpenChange={setBulkPrintOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Print Challans</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={bulkPrintFilters.programId}
                onValueChange={(val) => setBulkPrintFilters({ ...bulkPrintFilters, programId: val, classId: "all", sectionId: "all" })}
              >
                <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={bulkPrintFilters.classId}
                onValueChange={(val) => setBulkPrintFilters({ ...bulkPrintFilters, classId: val, sectionId: "all" })}
                disabled={bulkPrintFilters.programId === "all" || !bulkPrintFilters.programId}
              >
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes
                    .filter(c => c.programId.toString() === bulkPrintFilters.programId)
                    .map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select
                value={bulkPrintFilters.sectionId}
                onValueChange={(val) => setBulkPrintFilters({ ...bulkPrintFilters, sectionId: val })}
                disabled={bulkPrintFilters.classId === "all" || !bulkPrintFilters.classId}
              >
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {classes.find(c => c.id.toString() === bulkPrintFilters.classId)?.sections?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="month"
                value={bulkPrintFilters.month}
                onChange={(e) => setBulkPrintFilters({ ...bulkPrintFilters, month: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkPrintOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkPrint} disabled={bulkPrinting}>
              {bulkPrinting ? "Preparing..." : "Print Monthly Challans"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Challan Preview & Details</span>
              {selectedChallanDetails && (
                <Button variant="outline" size="sm" onClick={() => printChallan(selectedChallanDetails.id)} className="gap-2">
                  <Printer className="w-4 h-4" /> Print Challan
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedChallanDetails && (
            <div className="space-y-6">
              {/* Structured Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-soft border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      Payment Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-sm">Tuition Amount</span>
                      <span className="font-semibold">PKR {(selectedChallanDetails.amount - (selectedChallanDetails.arrearsAmount || 0)).toLocaleString()}</span>
                    </div>
                    
                    {selectedChallanDetails.arrearsAmount > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed text-red-600">
                        <span className="text-sm flex items-center gap-1"><History className="w-3 h-3" /> Previous Arrears</span>
                        <span className="font-semibold">PKR {selectedChallanDetails.arrearsAmount.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Dynamic Fee Heads Section */}
                    {(() => {
                      try {
                        const raw = (selectedChallanDetails.selectedHeads && typeof selectedChallanDetails.selectedHeads === 'string')
                          ? JSON.parse(selectedChallanDetails.selectedHeads)
                          : (selectedChallanDetails.selectedHeads || []);
                        
                        const activeHeads = Array.isArray(raw) ? raw.filter(h => 
                          (typeof h === 'object' && h !== null && h.isSelected && h.amount > 0) || 
                          (typeof h === 'number')
                        ) : [];

                        if (activeHeads.length === 0) return null;

                        return (
                          <div className="pt-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Additional Heads</p>
                            <div className="space-y-2">
                              {activeHeads.map((item, idx) => {
                                let name = "Additional Head";
                                let amount = 0;

                                if (typeof item === 'object' && item !== null) {
                                  name = item.name;
                                  amount = item.amount;
                                } else {
                                  // Fallback for ID-only legacy snapshots
                                  const head = (feeHeads || []).find(h => Number(h.id) === Number(item));
                                  if (head) {
                                    name = head.name;
                                    amount = parseFloat(head.amount) || 0;
                                  }
                                }

                                return (
                                  <div key={idx} className="flex justify-between items-center py-1 text-xs text-muted-foreground">
                                    <span>{name}</span>
                                    <span>PKR {amount.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}

                    {selectedChallanDetails.lateFeeFine > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-dashed text-destructive">
                        <span className="text-sm font-medium">Late Fee Fine</span>
                        <span className="font-bold">PKR {selectedChallanDetails.lateFeeFine.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20 mt-2">
                      <span className="text-base font-bold text-primary">Total Amount</span>
                      <span className="text-xl font-black text-primary">PKR {((selectedChallanDetails.amount || 0) + (selectedChallanDetails.fineAmount || 0) + (selectedChallanDetails.lateFeeFine || 0)).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft border-success/10 bg-success/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-success flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Collection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg border border-success/20 shadow-sm">
                        <p className="text-[10px] font-bold text-success uppercase">Paid Amount</p>
                        <p className="text-lg font-black text-success">PKR {(selectedChallanDetails.paidAmount || 0).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-warning/20 shadow-sm">
                        <p className="text-[10px] font-bold text-warning-700 uppercase">Balance Due</p>
                        <p className="text-lg font-black text-warning-700">
                          PKR {Math.max(0, ((selectedChallanDetails.amount || 0) + (selectedChallanDetails.fineAmount || 0) + (selectedChallanDetails.lateFeeFine || 0)) - (selectedChallanDetails.paidAmount || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={selectedChallanDetails.status === "PAID" ? "default" : "secondary"}>{selectedChallanDetails.status}</Badge>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Issue Date:</span>
                        <span className="font-medium">{new Date(selectedChallanDetails.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="font-medium text-destructive">{new Date(selectedChallanDetails.dueDate).toLocaleDateString()}</span>
                      </div>
                      {selectedChallanDetails.paidDate && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Payment Date:</span>
                          <span className="font-bold text-success">{new Date(selectedChallanDetails.paidDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Print Preview Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed border-muted-foreground/30"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground font-semibold tracking-widest">Official Print Preview</span>
                </div>
              </div>

              {/* HTML Preview */}
              <div
                className="w-full border rounded-xl p-8 bg-white shadow-inner overflow-x-auto"
                dangerouslySetInnerHTML={{
                  __html: generateChallanHtml(selectedChallanDetails)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={generateDialogOpen} onOpenChange={(open) => {
        setGenerateDialogOpen(open);
        if (!open) {
          setGenerateResults(null);
          setGenStudentSearch("");
          setGenStudentResults([]);
          setGenSelectedStudent(null);
          setGenStudentPlan([]);
          setGenCustomAmount("");
          setGenDueDate(null);
          setBulkDueDate(null);
          setGenRemarks("");
          setGenSelectedHeads([]);
          setGenCustomArrears("");
          setGenSelectedArrears([]);
          setBulkStudents([]);
          setSelectedBulkStudents([]);
          setBulkArrearsStudents([]);
        }
      }}>
        <DialogContent className="max-w-4xl p-3 md:p-4 max-h-[96vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-1 border-b mb-2">
            <DialogTitle className="text-base font-bold">Generate Monthly Challans</DialogTitle>
          </DialogHeader>

          <div className="mx-4 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[11px] text-yellow-800 leading-tight">
            <strong>Hint:</strong> To generate challans for fee heads like Fine, Lab Fee, Library Fee, etc. (not tied to installments), please use the <strong>"Extra Challans"</strong> tab.
          </div>

          {!generateResults ? (
            <div className="space-y-2 py-0 overflow-y-auto overflow-x-hidden pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="flex justify-center mb-1">
                <Tabs value={generateMode} onValueChange={setGenerateMode} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="bulk" className="text-xs py-1">Bulk (Class/Section)</TabsTrigger>
                    <TabsTrigger value="student" className="text-xs py-1">Individual Student</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-3">
                <div className={cn("grid gap-2", generateMode === "bulk" ? "grid-cols-3" : "grid-cols-2")}>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Month</Label>
                    <Input
                      type="month"
                      value={generateForm.month}
                      onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  {generateMode === "bulk" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-8 text-xs justify-start text-left font-normal px-2",
                                !bulkDueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              {bulkDueDate ? format(bulkDueDate, "PP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={bulkDueDate}
                              onSelect={setBulkDueDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Program (Optional)</Label>
                        <Select
                          value={generateForm.programId}
                          onValueChange={(v) => setGenerateForm({ ...generateForm, programId: v, classId: "", sectionId: "" })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="All Programs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Programs</SelectItem>
                            {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                {generateMode === "bulk" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Class (Optional)</Label>
                      <Select
                        value={generateForm.classId}
                        onValueChange={(v) => setGenerateForm({ ...generateForm, classId: v, sectionId: "" })}
                        disabled={!generateForm.programId || generateForm.programId === "all"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classes
                            .filter(c => c.programId === Number(generateForm.programId))
                            .map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Section (Optional)</Label>
                      <Select
                        value={generateForm.sectionId}
                        onValueChange={(v) => setGenerateForm({ ...generateForm, sectionId: v })}
                        disabled={!generateForm.classId || generateForm.classId === "all"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          {classes.find(c => c.id === Number(generateForm.classId))?.sections?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkStudents.length > 0 && (
                      <div className="col-span-2 space-y-2 pt-2 border-t">
                        <div className="flex justify-between items-center px-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase italic">Select Students ({selectedBulkStudents.length}/{bulkStudents.length})</Label>
                          <div className="flex gap-2">
                             <Button 
                               variant="ghost" 
                               size="xs" 
                               className="text-[10px] h-6 px-2 text-primary"
                               onClick={() => {
                                 setSelectedBulkStudents(bulkStudents.map(s => s.id));
                                 setBulkArrearsStudents(bulkStudents.map(s => s.id));
                               }}
                             >
                               Select All
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="xs" 
                               className="text-[10px] h-6 px-2 text-muted-foreground"
                               onClick={() => {
                                 setSelectedBulkStudents([]);
                                 setBulkArrearsStudents([]);
                               }}
                             >
                               Deselect All
                             </Button>
                          </div>
                        </div>
                        <div className="border rounded-md overflow-hidden bg-white/40 shadow-inner max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                          <Table>
                            <TableHeader className="bg-muted/50 h-8 sticky top-0 z-10">
                              <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="w-[40px] p-0 text-center"></TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2">Student</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Inst. Amt</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-center">Arrears?</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Arrears</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Total Due</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bulkStudents.map((student) => {
                                const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                                const currentInst = (student.feeInstallments || []).find(inst => {
                                  const d = new Date(inst.dueDate);
                                  return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                                });

                                const arrearsData = (student.feeInstallments || []).filter(inst => {
                                  const d = new Date(inst.dueDate);
                                  const targetDate = currentInst ? new Date(currentInst.dueDate) : new Date(selYear, selMonth - 1, 1);
                                  return d < targetDate && (inst.remainingAmount > 0);
                                }).map(inst => {
                                  const amount = inst.remainingAmount || 0;
                                  const lateFee = calculateLateFee(inst.dueDate, lateFeeFine);
                                  return { amount, lateFee };
                                });

                                const arrearsAmount = arrearsData.reduce((sum, a) => sum + a.amount, 0);
                                const arrearsLateFee = arrearsData.reduce((sum, a) => sum + a.lateFee, 0);

                                const instAmt = currentInst ? (currentInst.remainingAmount || 0) : 0;
                                const isSelected = selectedBulkStudents.includes(student.id);

                                return (
                                  <TableRow key={student.id} className={cn("hover:bg-orange-50/50 border-b border-muted/20 h-10", isSelected && "bg-orange-50/10")}>
                                    <TableCell className="p-0 text-center">
                                      <input
                                        type="checkbox"
                                        className="accent-orange-600 h-3.5 w-3.5 cursor-pointer"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedBulkStudents([...selectedBulkStudents, student.id]);
                                          } else {
                                            setSelectedBulkStudents(selectedBulkStudents.filter(id => id !== student.id));
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="p-2">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold">{student.fName} {student.lName || ""}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{student.rollNumber}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs p-2 text-right font-medium">Rs. {instAmt.toLocaleString()}</TableCell>
                                    <TableCell className="p-0 text-center">
                                      <input
                                        type="checkbox"
                                        className="accent-red-600 h-3 w-3 cursor-pointer"
                                        disabled={!isSelected}
                                        checked={bulkArrearsStudents.includes(student.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setBulkArrearsStudents([...bulkArrearsStudents, student.id]);
                                          } else {
                                            setBulkArrearsStudents(bulkArrearsStudents.filter(id => id !== student.id));
                                          }
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="text-xs p-2 text-right text-red-600 font-medium">
                                      <div>Rs. {arrearsAmount.toLocaleString()}</div>
                                      {arrearsLateFee > 0 && <div className="text-[9px] font-bold">+{arrearsLateFee.toLocaleString()} Fine</div>}
                                    </TableCell>
                                    <TableCell className="text-xs p-2 text-right font-black text-orange-700">
                                      Rs. {(instAmt + (bulkArrearsStudents.includes(student.id) ? (arrearsAmount + arrearsLateFee) : 0)).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {isFetchingBulkStudents && (
                      <div className="col-span-2 py-8 text-center text-muted-foreground animate-pulse">
                        <TrendingUp className="w-5 h-5 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Fetching students and balances...</p>
                      </div>
                    )}

                    {!isFetchingBulkStudents && bulkStudents.length === 0 && generateForm.programId !== "all" && (
                      <div className="col-span-2 py-6 text-center border border-dashed rounded-lg bg-muted/5">
                        <p className="text-xs text-muted-foreground italic">No students found matching filters.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Search Student</Label>
                      <Popover open={genStudentSearchOpen} onOpenChange={setGenStudentSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-8 text-xs"
                          >
                            {genSelectedStudent ? `${genSelectedStudent.fName} ${genSelectedStudent.lName || ""} (${genSelectedStudent.rollNumber})` : "Select Student..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by name or ID..."
                              value={genStudentSearch}
                              onValueChange={async (val) => {
                                setGenStudentSearch(val);
                                if (val.length > 2) {
                                  setIsSearchingGenStudent(true);
                                  try {
                                    const results = await searchStudents(val);
                                    setGenStudentResults(results);
                                  } catch (error) {
                                    console.error(error);
                                  } finally {
                                    setIsSearchingGenStudent(false);
                                  }
                                }
                              }}
                            />
                            <CommandList>
                              {isSearchingGenStudent && <CommandEmpty>Searching...</CommandEmpty>}
                              {!isSearchingGenStudent && genStudentResults.length === 0 && genStudentSearch.length > 2 && (
                                <CommandEmpty>No student found.</CommandEmpty>
                              )}
                              <CommandGroup>
                                {genStudentResults.map((student) => (
                                  <CommandItem
                                    key={student.id}
                                    value={student.id.toString()}
                                    onSelect={async () => {
                                      setGenSelectedStudent(student);
                                      setGenStudentSearchOpen(false);
                                      // Fetch installment plan for this student's current class
                                      try {
                                        const results = await getInstallmentPlans({
                                          studentId: student.id,
                                        });
                                        const installments = results[0]?.feeInstallments || [];
                                        setGenStudentPlan(installments);
                                        const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                                        const targetInst = installments.find(inst => {
                                          const d = new Date(inst.dueDate);
                                          return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                                        });

                                        const unpaidArrears = installments.filter(inst => {
                                          const d = new Date(inst.dueDate);
                                          return targetInst ? d < new Date(targetInst.dueDate) : false;
                                        }).reduce((sum, inst) => sum + (inst.remainingAmount || 0), 0);

                                        setGenCustomArrears(unpaidArrears.toString());
                                        setGenCustomAmount(targetInst ? targetInst.remainingAmount.toString() : "");
                                        setGenDueDate(targetInst ? new Date(targetInst.dueDate) : new Date(selYear, selMonth - 1, 10));
                                      } catch (error) {
                                        console.error("Failed to fetch plan:", error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to fetch student's installment plan.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    className="aria-selected:bg-orange-600 aria-selected:text-white cursor-pointer px-3 py-2 flex items-center gap-2"
                                  >
                                    <Check
                                      className={cn(
                                        "h-4 w-4 shrink-0",
                                        genSelectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-sm leading-tight text-inherit">
                                        {student.fName} {student.mName || ""} {student.lName || ""}
                                      </span>
                                      <span className="text-[11px] opacity-80 leading-tight text-inherit">
                                        Roll: {student.rollNumber} • {student.class?.name} / {student.section?.name || "No Section"}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {genSelectedStudent && genStudentPlan.length > 0 && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="grid grid-cols-2 gap-2 border rounded-lg p-2 bg-muted/15">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Student</Label>
                            <Input
                              value={`${genSelectedStudent.fName} ${genSelectedStudent.lName || ""} (${genSelectedStudent.rollNumber})`}
                              disabled
                              className="bg-muted/50 h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Installment Details</Label>
                            {(() => {
                              const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                              const targetInst = genStudentPlan.find(inst => {
                                const d = new Date(inst.dueDate);
                                return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                              });
                              return (
                                <Input
                                  value={targetInst ? `Installment #${targetInst.installmentNumber}` : "Ad-hoc Challan"}
                                  disabled
                                  className="bg-muted/50 h-8 text-sm"
                                />
                              );
                            })()}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Due Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-8 text-xs justify-start text-left font-normal",
                                    !genDueDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {genDueDate ? format(genDueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={genDueDate}
                                  onSelect={setGenDueDate}
                                  initialFocus
                                  disabled={(date) => {
                                    if (!generateForm.month) return false;
                                    const [year, month] = generateForm.month.split('-').map(Number);
                                    const start = startOfMonth(new Date(year, month - 1));
                                    const end = endOfMonth(new Date(year, month - 1));
                                    return date < start || date > end;
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Billing Amount (Tuition)</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">Rs.</span>
                              <Input
                                type="number"
                                min="0"
                                value={genCustomAmount}
                                onChange={(e) => setGenCustomAmount(e.target.value)}
                                className="pl-8 h-8 text-sm font-semibold text-orange-700"
                              />
                            </div>
                          </div>

                          <div className="col-span-2 space-y-1 pt-1 border-t">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Unpaid Arrears / Past Installments</Label>
                            <div className="border rounded-md overflow-hidden bg-white/40 shadow-inner">
                              <Table>
                                <TableHeader className="bg-muted/50 h-7">
                                  <TableRow className="hover:bg-transparent border-b-0">
                                    <TableHead className="w-[30px] p-0 text-center"></TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold p-1">Month</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold p-1">Class</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Balance</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Late Fee</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold p-1 text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                                    const targetInst = genStudentPlan.find(inst => {
                                      const d = new Date(inst.dueDate);
                                      return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                                    });
                                    const pastUnpaid = genStudentPlan.filter(inst => {
                                      const d = new Date(inst.dueDate);
                                      return targetInst ? d < new Date(targetInst.dueDate) : true;
                                    }).filter(inst => (inst.amount - (inst.paidAmount || 0)) > 0);

                                    if (pastUnpaid.length === 0) {
                                      return <TableRow><TableCell colSpan={5} className="text-[10px] text-center py-2 text-muted-foreground">No unpaid past installments</TableCell></TableRow>;
                                    }

                                    return pastUnpaid.map(inst => {
                                      const balance = Math.max(0, inst.amount - (inst.paidAmount || 0));
                                      const lateFee = calculateLateFee(inst.dueDate, lateFeeFine);
                                      const rowTotal = balance + lateFee;
                                      const isSelected = genSelectedArrears.some(a => a.id === inst.id);
                                      
                                      return (
                                        <TableRow key={inst.id} className={cn("hover:bg-orange-50/50 border-b border-muted/20 h-8", isSelected && "bg-orange-50/30")}>
                                          <TableCell className="p-0 text-center">
                                            <input
                                              type="checkbox"
                                              className="accent-orange-600 h-3 w-3 cursor-pointer"
                                              checked={isSelected}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setGenSelectedArrears([...genSelectedArrears, { id: inst.id, amount: balance, lateFee }]);
                                                } else {
                                                  setGenSelectedArrears(genSelectedArrears.filter(a => a.id !== inst.id));
                                                }
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell className="text-[10px] p-1 font-medium">{format(new Date(inst.dueDate), "MMM yyyy")}</TableCell>
                                          <TableCell className="text-[10px] p-1 truncate max-w-[60px]">{inst.class?.name || "---"}</TableCell>
                                          <TableCell className="text-[10px] p-1 text-right">Rs. {balance.toLocaleString()}</TableCell>
                                          <TableCell className="text-[10px] p-1 text-right text-red-600 font-medium">+{lateFee.toLocaleString()}</TableCell>
                                          <TableCell className="text-[10px] p-1 text-right font-bold">Rs. {rowTotal.toLocaleString()}</TableCell>
                                        </TableRow>
                                      );
                                    });
                                  })()}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div className="col-span-2 space-y-2 pt-1 border-t text-sm bg-orange-50/20 -mx-2 px-2 pb-1 rounded-b-lg">
                            {(() => {
                              const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                              const targetInst = genStudentPlan.find(inst => {
                                const d = new Date(inst.dueDate);
                                return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                              });

                              if (!targetInst) return null;

                              return (
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                                    <span>Installment Tracking</span>
                                    <span className="text-orange-700">Month: {generateForm.month}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="flex flex-col border rounded bg-white p-1">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold">Total</span>
                                      <span className="text-xs font-bold">Rs. {targetInst.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col border rounded bg-emerald-50 p-1 border-emerald-100 relative group">
                                      <span className="text-[9px] text-emerald-600 uppercase font-bold text-center">Paid</span>
                                      <span className="text-xs font-bold text-emerald-700 text-center">Rs. {(targetInst.paidAmount || 0).toLocaleString()}</span>
                                      {(targetInst.paidAmount || 0) > targetInst.amount && (
                                        <div className="absolute -top-2 -right-1 bg-emerald-600 text-white text-[8px] px-1 rounded-full font-bold shadow-sm">
                                          EXCESS
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col border rounded bg-orange-50 p-1 border-orange-100">
                                      <span className="text-[9px] text-orange-600 uppercase font-bold text-center">Pending</span>
                                      <span className="text-xs font-bold text-orange-700 text-center">Rs. {(targetInst.pendingAmount || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center px-1 pt-0.5">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-800 bg-orange-100/50 px-2 py-0.5 rounded-full border border-orange-200">
                                      <TrendingUp className="h-3 w-3" /> Available: Rs. {Math.max(0, targetInst.remainingAmount).toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                                      <History className="h-3 w-3" /> Arrears: Rs. {Math.max(0, genStudentPlan.filter(inst => {
                                        const d = new Date(inst.dueDate);
                                        return targetInst ? d < new Date(targetInst.dueDate) : false;
                                      }).reduce((sum, inst) => sum + (inst.amount - (inst.paidAmount || 0)), 0)).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Additional Fee Heads</Label>
                            <div className="grid grid-cols-2 gap-1 border rounded-md p-1.5 max-h-[85px] overflow-y-auto bg-white/40 shadow-inner scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                              {feeHeads.filter(h => !h.isTuition).map(head => (
                                <div key={head.id} className="flex items-center space-x-2 p-1.5 hover:bg-orange-50 rounded transition-colors group">
                                  <input
                                    type="checkbox"
                                    id={`gen-head-${head.id}`}
                                    className="accent-orange-600 h-3.5 w-3.5 rounded"
                                    checked={genSelectedHeads.includes(head.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setGenSelectedHeads([...genSelectedHeads, head.id]);
                                      } else {
                                        setGenSelectedHeads(genSelectedHeads.filter(id => id !== head.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={`gen-head-${head.id}`} className="text-[11px] cursor-pointer flex-1 flex justify-between items-center">
                                    <span className="truncate group-hover:text-orange-700">{head.name}</span>
                                    <span className="text-muted-foreground pl-1 italic">Rs. {head.amount.toLocaleString()}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Remarks</Label>
                            <Textarea
                              placeholder="Optional notes for this challan"
                              value={genRemarks}
                              onChange={(e) => setGenRemarks(e.target.value)}
                              className="text-xs min-h-[40px] h-[40px] resize-none py-1 px-2"
                            />
                          </div>

                          <div className="pt-2 border-t bg-orange-50/10 -mx-2 -mb-2 p-2 rounded-b-lg border-orange-100">
                            {(() => {
                              const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                              const targetInst = genStudentPlan.find(inst => {
                                const d = new Date(inst.dueDate);
                                return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                              });

                              const tuitionTotal = targetInst ? targetInst.amount : 0;
                              const tuitionPaid = targetInst ? (targetInst.paidAmount || 0) : 0;
                              const tuitionSelected = parseFloat(genCustomAmount) || 0;
                              const tuitionPending = Math.max(0, tuitionTotal - tuitionPaid - tuitionSelected);

                              const arrears = genSelectedArrears.reduce((sum, a) => sum + a.amount, 0);
                              const arrearsLateFee = genSelectedArrears.reduce((sum, a) => sum + a.lateFee, 0);

                              const additionalSum = feeHeads
                                .filter(h => genSelectedHeads.includes(h.id) && !h.isDiscount && !h.isTuition)
                                .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                              const currentLateFee = calculateLateFee(targetInst?.dueDate, lateFeeFine);
                              const grandTotal = tuitionSelected + arrears + additionalSum + arrearsLateFee + currentLateFee;

                              return (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                                    <span>Inst. Overview</span>
                                    <span className="text-orange-700">Total: Rs. {tuitionTotal.toLocaleString()}</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1 text-center py-1">
                                    <div className="flex flex-col border rounded bg-white p-1 relative">
                                      <span className="text-[8px] text-muted-foreground uppercase font-bold">Paid</span>
                                      <span className="text-[10px] font-bold text-success">Rs. {tuitionPaid.toLocaleString()}</span>
                                      {tuitionPaid > tuitionTotal && (
                                        <div className="absolute -top-1.5 -right-0.5 bg-emerald-600 text-white text-[7px] px-1 rounded-full font-bold shadow-sm">
                                          EXCESS
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col border rounded bg-orange-50 p-1 border-orange-100">
                                      <span className="text-[8px] text-orange-600 uppercase font-bold">Pending</span>
                                      <span className="text-[10px] font-bold text-orange-700">Rs. {(targetInst?.pendingAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col border rounded bg-blue-50 p-1 border-blue-100">
                                      <span className="text-[8px] text-blue-600 uppercase font-bold">Available</span>
                                      <span className="text-[10px] font-bold text-blue-700">Rs. {Math.max(0, targetInst?.remainingAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col border rounded bg-orange-600 p-1 border-orange-700 text-white">
                                      <span className="text-[8px] uppercase font-bold opacity-80">This Bill</span>
                                      <span className="text-[10px] font-bold">Rs. {tuitionSelected.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] px-1 border-t pt-1">
                                    <div className="flex justify-between text-red-600">
                                      <span className="font-semibold italic flex items-center gap-1"><History className="h-2.5 w-2.5" /> Arrears:</span>
                                      <span className="font-bold">Rs. {arrears.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600">
                                      <span className="font-semibold italic flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Extra:</span>
                                      <span className="font-bold">Rs. {additionalSum.toLocaleString()}</span>
                                    </div>
                                    {arrearsLateFee > 0 && (
                                      <div className="flex justify-between text-destructive col-span-2 border-t border-destructive/20 pt-1 mt-1">
                                        <span className="font-semibold italic flex items-center gap-1">Late Fee (Overdue Arrears):</span>
                                        <span className="font-bold">Rs. {arrearsLateFee.toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="pt-1 mt-1 border-t-2 border-orange-300 flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-orange-800 uppercase">Grand Total Payable</span>
                                    <span className="text-lg font-black text-orange-700">Rs. {grandTotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )
                    }
                    {genSelectedStudent && genStudentPlan.length === 0 && (
                      <div className="p-4 text-center border border-dashed rounded-md bg-yellow-50 text-yellow-700 text-sm mt-4">
                        No installment plan found for this student in their current class.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t bg-muted/10 -mx-3 -mb-3 p-3">
                <Button variant="outline" onClick={() => {
                  setGenerateDialogOpen(false);
                  setGenSelectedStudent(null);
                  setGenStudentPlan([]);
                }}>Cancel</Button>
                <Button
                  onClick={() => {
                    setIsGenerating(true);
                    generateChallansMutation.mutate({
                      month: generateForm.month,
                      studentId: generateMode === "student" ? genSelectedStudent?.id : "",
                      studentIds: generateMode === "bulk" ? selectedBulkStudents : [],
                      excludedArrearsStudentIds: generateMode === "bulk" 
                        ? selectedBulkStudents.filter(id => !bulkArrearsStudents.includes(id)) 
                        : [],
                      programId: generateMode === "bulk" && generateForm.programId !== "all" && selectedBulkStudents.length === 0 ? generateForm.programId : "",
                      classId: generateMode === "bulk" && generateForm.classId !== "all" && selectedBulkStudents.length === 0 ? generateForm.classId : "",
                      sectionId: generateMode === "bulk" && generateForm.sectionId !== "all" && selectedBulkStudents.length === 0 ? generateForm.sectionId : "",
                      // Custom fields for individual student
                      customAmount: generateMode === "student" && genCustomAmount ? parseFloat(genCustomAmount) : undefined,
                      selectedHeads: generateMode === "student" && genSelectedHeads.length > 0 ? genSelectedHeads : undefined,
                      customArrearsAmount: (generateMode === "student" && genSelectedArrears.length > 0) ? genSelectedArrears.reduce((sum, a) => sum + a.amount, 0) : undefined,
                      arrearsLateFee: (generateMode === "student" && genSelectedArrears.length > 0) ? genSelectedArrears.reduce((sum, a) => sum + a.lateFee, 0) : undefined,
                      selectedArrears: generateMode === "student" && genSelectedArrears.length > 0 ? genSelectedArrears : undefined,
                      remarks: generateMode === "student" ? genRemarks : undefined,
                      dueDate: generateMode === "student" 
                        ? (genDueDate ? format(genDueDate, "yyyy-MM-dd") : undefined)
                        : (bulkDueDate ? format(bulkDueDate, "yyyy-MM-dd") : undefined)
                    });
                  }}
                  disabled={(() => {
                    if (isGenerating) return true;
                    if (generateMode === "bulk") {
                      return selectedBulkStudents.length === 0;
                    }
                    if (generateMode === "student") {
                      if (!genSelectedStudent || genStudentPlan.length === 0) return true;
                      
                      const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                      const targetInst = genStudentPlan.find(inst => {
                        const d = new Date(inst.dueDate);
                        return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                      });

                      // Determine if trying to generate a standard tuition bill when it's already paid
                      const isFullyPaid = targetInst && (targetInst.paidAmount || 0) >= targetInst.amount;
                      
                      const isArrearsOnly = (genCustomAmount === "" || genCustomAmount === "0") && genSelectedArrears.length > 0;
                      const isFeeHeadOnly = (genCustomAmount === "" || genCustomAmount === "0") && genSelectedHeads.length > 0;
                      const hasIndividualBilling = (parseFloat(genCustomAmount) > 0 || genSelectedHeads.length > 0 || genSelectedArrears.length > 0);

                      // Prevent generation if fully paid and not explicitly generating a special alternate bill
                      if (isFullyPaid && !isArrearsOnly && !isFeeHeadOnly) {
                        return true;
                      }

                      // Also prevent if nothing selected at all
                      if (!hasIndividualBilling && (!targetInst || (targetInst.remainingAmount || 0) <= 0)) {
                        return true;
                      }
                    }
                    return false;
                  })()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating..." : "Generate Challans"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50 max-h-[400px] overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Generation Results</h4>
                  {generateResults.some(r => (r.status === 'CREATED' || (r.status === 'SKIPPED' && r.challan))) && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-[10px] gap-1 bg-success/10 hover:bg-success/20 text-success border-success/30"
                      onClick={() => {
                        const printableChallans = generateResults
                          .filter(r => (r.status === 'CREATED' || (r.status === 'SKIPPED' && r.challan)) && r.challan)
                          .map(r => r.challan);
                        
                        if (printableChallans.length > 0) {
                          printableChallans.forEach((c, idx) => {
                            setTimeout(() => {
                              const template = feeChallanTemplates.find(t => t.isDefault);
                              if (template) {
                                const finalHtml = generateChallanHtml(c, template.htmlContent);
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(finalHtml);
                                  printWindow.document.close();
                                  printWindow.onload = () => printWindow.print();
                                }
                              }
                            }, idx * 1000);
                          });
                        }
                      }}
                    >
                      <Printer className="w-3 h-3" /> Print All
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {generateResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-muted last:border-0 hover:bg-muted/30 px-1 rounded transition-colors group">
                      <div className="flex flex-col">
                        <span className="font-medium">{res.studentName}</span>
                        <span className="text-[10px] text-muted-foreground">ID: {res.studentId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={res.status === 'CREATED' ? 'default' : res.status === 'EXCEEDS_TOTAL_PLAN' ? 'warning' : 'secondary'} 
                          className="text-[10px] h-5"
                        >
                          {res.status === 'CREATED' ? `Success: ${res.challanNumber}` : res.reason}
                        </Badge>

                        {res.status === 'EXCEEDS_TOTAL_PLAN' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] px-2 font-bold border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 animate-pulse"
                            onClick={() => {
                              // Re-trigger generation capping tuition and adding the excess as a custom head object
                              generateChallansMutation.mutate({
                                month: generateForm.month,
                                studentId: res.studentId,
                                customAmount: res.maxAllowed, // Cap to what's available
                                selectedHeads: [
                                  ...(genSelectedHeads || []), 
                                  { name: "Overflow Tuition / Extra Head", amount: res.excessAmount }
                                ],
                                customArrearsAmount: genSelectedArrears.reduce((sum, a) => sum + a.amount, 0),
                                arrearsLateFee: genSelectedArrears.reduce((sum, a) => sum + a.lateFee, 0),
                                selectedArrears: genSelectedArrears,
                                remarks: genRemarks,
                                dueDate: genDueDate ? format(genDueDate, "yyyy-MM-dd") : undefined
                              });
                            }}
                          >
                            Bill Excess as Extra Head?
                          </Button>
                        )}

                        {(res.status === 'CREATED' || (res.status === 'SKIPPED' && res.challan)) && res.challan && (
                          <div className="flex items-center gap-1">
                            {res.status === 'SKIPPED' && <span className="text-[9px] text-muted-foreground italic">(Existing)</span>}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedChallanDetails(res.challan);
                                setDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                const template = feeChallanTemplates.find(t => t.isDefault);
                                if (template) {
                                  const finalHtml = generateChallanHtml(res.challan, template.htmlContent);
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    printWindow.document.write(finalHtml);
                                    printWindow.document.close();
                                    printWindow.onload = () => printWindow.print();
                                  }
                                }
                              }}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {generateResults.length === 0 && <p className="text-muted-foreground italic text-center py-4">No students found for selection.</p>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setGenerateDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </DashboardLayout>;
};

export default FeeManagement;
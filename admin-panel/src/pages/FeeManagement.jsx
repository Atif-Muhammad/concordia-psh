import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { DollarSign, Plus, CheckCircle2, Edit, Trash2, Receipt, TrendingUp, Layers, Printer, Eye, History, Calendar as CalendarIcon, ArrowRight, PlusCircle, MinusCircle, User, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  createFeeHead, getFeeHeads, updateFeeHead, deleteFeeHead,
  createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
  getPrograms, getClasses, getStudents, getDepartmentNames,
  getFeeChallans, getBulkChallans, updateFeeChallan, getStudentFeeHistory,
  searchStudents, getRevenueOverTime, getClassCollectionStats, getFeeCollectionSummary, getDefaultFeeChallanTemplate,
  getInstallmentPlans, generateChallansFromPlan,
  getInstituteSettings, updateInstituteSettings,
  getAcademicSessions,
  deleteFeeChallan
} from "../../config/apis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
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

  // Student History tab filters
  const [historySessionFilter, setHistorySessionFilter] = useState("all");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyChallanTypeFilter, setHistoryChallanTypeFilter] = useState("all");

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
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedChallanDetails, setSelectedChallanDetails] = useState(null);
  const [selectedChallanForHistory, setSelectedChallanForHistory] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToPay, setItemToPay] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState(() => {
    const _now = new Date();
    const _y = _now.getFullYear();
    const _m = _now.getMonth() + 1;
    return {
      month: _now.toISOString().slice(0, 7),
      sessionId: "all",
      studentId: "",
      classId: "",
      sectionId: "",
      programId: "all"
    };
  });
  const [generateResults, setGenerateResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkDueDate, setBulkDueDate] = useState(null);
  const [genStudentPlan, setGenStudentPlan] = useState([]);
  const [bulkStudents, setBulkStudents] = useState([]);
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);
  const [isFetchingBulkStudents, setIsFetchingBulkStudents] = useState(false);
  const [generationErrors, setGenerationErrors] = useState({});

  // Bulk Printing state
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [bulkPrintFilters, setBulkPrintFilters] = useState({
    programId: "all",
    classId: "all",
    sectionId: "all",
    month: new Date().toISOString().slice(0, 7),
    sessionId: "all"
  });
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkPreviewContent, setBulkPreviewContent] = useState("");
  const [bulkChallansList, setBulkChallansList] = useState([]);

  // Extra Challans tab state
  const [createExtraChallanOpen, setCreateExtraChallanOpen] = useState(false);
  const [extraStudentSearchOpen, setExtraStudentSearchOpen] = useState(false);
  const [extraStudentResults, setExtraStudentResults] = useState([]);
  const [extraSelectedStudent, setExtraSelectedStudent] = useState(null);
  const [extraSelectedHeads, setExtraSelectedHeads] = useState([]);
  const [extraDueDate, setExtraDueDate] = useState(null);
  const [extraRemarks, setExtraRemarks] = useState("");
  const [extraIsOtherEnabled, setExtraIsOtherEnabled] = useState(false);
  const [extraOtherAmount, setExtraOtherAmount] = useState("0");
  const sessionManuallySet = useRef(false);

  // Helper to extract year gap from program duration (e.g., "4 years" -> 4)
  const getProgramGap = (prog) => {
    if (!prog?.duration) return 1;
    const match = prog.duration.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // Helper to generate session string from a date/month and gap
  const getSessionLabelStr = (dateStr, gap = 1) => {
    if (!dateStr) return "";
    const [y, m] = dateStr.split('-').map(Number);
    // Academic year: if month >= April (4), session is y-(y+gap), else (y-1)-(y+gap-1)
    if (m >= 4) return `${y}-${y + gap}`;
    return `${y - 1}-${y + gap - 1}`;
  };


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
    arrearsSelections: [],
    isOtherEnabled: false,
    otherAmount: "0",
    discount: 0,
    paidDate: format(new Date(), "yyyy-MM-dd"),
    paidBy: "Cash"
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
    if (!dueDate || !finePerDay || finePerDay <= 0) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    if (now <= due) return 0;

    const diffTime = Math.abs(now.getTime() - due.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * finePerDay;
  };

  const getRecursiveArrears = (challan) => {
    if (!challan || !challan.previousChallans || !Array.isArray(challan.previousChallans) || challan.installmentNumber === 0) return 0;
    
    // Sum up the remaining balance of all linked previous challans recursively.
    // PAID ancestors: their chain is fully settled — stop recursion there.
    // VOID ancestors: real unpaid debt superseded into this chain — include them.
    return challan.previousChallans.reduce((total, prev) => {
      if (prev.status === 'PAID') return total; // settled — stop here
      const rem = Math.max(0, 
        (prev.amount || 0) + 
        (prev.fineAmount || 0) + 
        (prev.lateFeeFine || 0) - 
        (prev.paidAmount || 0) - 
        (prev.discount || 0)
      );
      return total + rem + getRecursiveArrears(prev);
    }, 0);
  };

  // Sum remaining amounts from VOID'd challans that this challan supersedes (recursively)
  // Only counts challans NOT already covered by the previousChallans (ArrearsChain) relation
  const getSupersededArrears = (challan) => {
    if (!challan || !challan.supersedes || !Array.isArray(challan.supersedes)) return 0;
    // Build set of IDs already counted via previousChallans to avoid double-counting
    const prevIds = new Set((challan.previousChallans || []).map(p => p.id));
    return challan.supersedes.reduce((total, prev) => {
      if (prev.status === 'VOID' && !prevIds.has(prev.id)) {
        const totalDue = Math.max(0,
          (prev.amount || 0) +
          (prev.fineAmount || 0) +
          (prev.lateFeeFine || 0) -
          (prev.discount || 0)
        );
        return total + totalDue + getSupersededArrears(prev);
      }
      return total;
    }, 0);
  };

  // Combined arrears: chain-linked (previousChallans) + superseded (supersedes)
  const getTotalArrears = (challan) => {
    return getRecursiveArrears(challan) + getSupersededArrears(challan);
  };

  // Sum of additional fee heads from selectedHeads JSON (NOT fineAmount)
  const getSelectedHeadsTotal = (challan) => {
    try {
      const raw = typeof challan?.selectedHeads === 'string'
        ? JSON.parse(challan.selectedHeads)
        : (challan?.selectedHeads || []);
      if (!Array.isArray(raw)) return 0;
      return raw
        .filter(h => typeof h === 'object' && h !== null && h.isSelected !== false && h.type === 'additional')
        .reduce((sum, h) => sum + (h.amount || 0), 0);
    } catch { return 0; }
  };

  // Total due for a challan: tuition + heads + late fee + arrears
  const getChallanTotal = (challan) => {
    return (challan.amount || 0) +
      getSelectedHeadsTotal(challan) +
      (challan.lateFeeFine || 0) +
      getTotalArrears(challan);
  };

  const { data: feeHeads = [] } = useQuery({
    queryKey: ['feeHeads'],
    queryFn: getFeeHeads
  });

  const { data: academicSessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: getAcademicSessions
  });

  const activeSessionId = academicSessions.find(s => s.isActive)?.id?.toString() || "all";

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: getFeeStructures
  });

  useEffect(() => {
    if (generateForm.month) {
      // Set to 10th of that month by default
      const [year, month] = generateForm.month.split('-').map(Number);
      const defaultDate = new Date(year, month - 1, 10);
      setBulkDueDate(defaultDate);
    }
  }, [generateForm.month]);


  useEffect(() => {
    if (activeSessionId !== "all" && !sessionManuallySet.current) {
        setGenerateForm(prev => ({ ...prev, sessionId: activeSessionId }));
        sessionManuallySet.current = true;
    }
  }, [generateDialogOpen, activeSessionId]);

  // Bulk student fetcher
  useEffect(() => {
    const fetchBulkStudentsData = async () => {
      if (!generateDialogOpen) return;
      
      // Clear previous state when filters change
      setGenerationErrors({});
      setGenerateResults(null);

      if (!generateForm.programId || generateForm.programId === "all") {
        setBulkStudents([]);
        setSelectedBulkStudents([]);
        return;
      }

      setIsFetchingBulkStudents(true);
      try {
        const studentList = await getInstallmentPlans({
          ...(generateForm.programId && generateForm.programId !== "all" ? { programId: generateForm.programId } : {}),
          ...(generateForm.classId && generateForm.classId !== "all" ? { classId: generateForm.classId } : {}),
          ...(generateForm.sectionId && generateForm.sectionId !== "all" ? { sectionId: generateForm.sectionId } : {}),
          ...(generateForm.sessionId && generateForm.sessionId !== "all" ? { sessionId: generateForm.sessionId } : {}),
        });

        const filtered = studentList;
        setBulkStudents(filtered);

        // Only auto-select students that have a matching installment for the selected month
        const [, sm] = generateForm.month.split('-').map(Number);
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const mName = (monthNames[sm - 1] || '').toLowerCase();
        const selectedSessionName = generateForm.sessionId && generateForm.sessionId !== 'all'
          ? (academicSessions.find(s => s.id.toString() === generateForm.sessionId)?.name || '')
          : '';
        const eligible = filtered.filter(s => {
          return (s.feeInstallments || []).some(inst => {
            const nameMatch = (inst.month || '').trim().toLowerCase() === mName;
            if (generateForm.sessionId && generateForm.sessionId !== 'all') {
              const byId = inst.sessionId?.toString() === generateForm.sessionId;
              const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
              return nameMatch && (byId || byName);
            }
            return nameMatch;
          });
        });
        setSelectedBulkStudents(eligible.map(s => s.id));

        // Auto-load due date from the first available installment matching the month
        if (filtered.length > 0 && generateForm.month) {
          const [selYear, selMonth] = generateForm.month.split('-').map(Number);
          const mName = new Date(selYear, selMonth - 1, 1).toLocaleString('default', { month: 'long' });
          const mSession = (selMonth >= 4) ? `${selYear}-${selYear + 1}` : `${selYear - 1}-${selYear}`;

          const firstWithInst = filtered.find(s => 
            (s.feeInstallments || []).some(inst => 
              (inst.month === mName && (inst.session === mSession || !inst.session)) || inst.month === generateForm.month
            )
          );

          if (firstWithInst) {
            const matchingInst = firstWithInst.feeInstallments.find(inst =>
              (inst.month === mName && (inst.session === mSession || !inst.session)) || inst.month === generateForm.month
            );
            if (matchingInst?.dueDate) {
              setBulkDueDate(new Date(matchingInst.dueDate));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch bulk students:", error);
      } finally {
        setIsFetchingBulkStudents(false);
      }
    };

    fetchBulkStudentsData();
  }, [generateDialogOpen, generateForm.month, generateForm.sessionId, generateForm.programId, generateForm.classId, generateForm.sectionId]);

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
  const [extraPage, setExtraPage] = useState(1);
  const [extraLimit, setExtraLimit] = useState(10);
  const [extraChallanMeta, setExtraChallanMeta] = useState(null);
  const [extraSearch, setExtraSearch] = useState("");
  const [extraStatusFilter, setExtraStatusFilter] = useState("all");
  const [extraMonth, setExtraMonth] = useState("");

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
        limit,
        excludeChallanType: 'FEE_HEADS_ONLY'
      });
    },
    keepPreviousData: true,
  });

  const feeChallans = feeChallansData.data || [];
  useEffect(() => {
    if (feeChallansData.meta) setChallanMeta(feeChallansData.meta);
  }, [feeChallansData]);

  const { data: extraChallansData = { data: [], meta: {} }, isLoading: isExtraLoading } = useQuery({
    queryKey: ['extraChallans', extraSearch, extraStatusFilter, extraMonth, extraPage, extraLimit],
    queryFn: () => {
      let startDate = "";
      let endDate = "";
      if (extraMonth) {
        const [year, month] = extraMonth.split('-');
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay}`;
      }
      return getFeeChallans({
        challanType: 'FEE_HEADS_ONLY',
        search: extraSearch,
        status: extraStatusFilter,
        startDate,
        endDate,
        page: extraPage,
        limit: extraLimit
      });
    },
    keepPreviousData: true,
  });

  const extraChallans = extraChallansData.data || [];
  useEffect(() => {
    if (extraChallansData.meta) setExtraChallanMeta(extraChallansData.meta);
  }, [extraChallansData]);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmentNames
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
      arrearsSelections: [],
      isOtherEnabled: false,
      otherAmount: "0",
      discount: 0,
      paidDate: format(new Date(), "yyyy-MM-dd"),
      paidBy: "Cash"
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
      queryClient.invalidateQueries(['extraChallans']);
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
      setIsGenerating(false);
      queryClient.invalidateQueries(['feeChallans']);
      
      const errors = {};
      const successCount = (data || []).filter(r => r.status === 'CREATED').length;
      
      (data || []).forEach(r => {
        if (r.status === 'PREVIOUS_UNGENERATED' || (r.status !== 'CREATED' && r.status !== 'SKIPPED')) {
          errors[r.studentId] = r.reason || r.status;
        }
      });

      setGenerationErrors(errors);
      const errorCount = Object.keys(errors).length;
      
      if (errorCount > 0) {
        toast({ 
          title: "Generation Blocked", 
          description: `${errorCount} student(s) failed. Check red labels in the list.`, 
          variant: "destructive" 
        });
        // Stay on form view
      } else {
        setGenerateResults(data);
        if (successCount > 0) {
          toast({ title: "Challans generated successfully" });
        } else {
          toast({ title: "Challan generation process completed" });
        }
      }
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

  const deleteChallanMutation = useMutation({
    mutationFn: deleteFeeChallan,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      queryClient.invalidateQueries(['extraChallans']);
      queryClient.invalidateQueries(['studentFeeHistory']);
      toast({ title: "Challan deleted successfully" });
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
    const isExtraOnly = editingChallan?.challanType === 'FEE_HEADS_ONLY' || editingChallan?.installmentNumber === 0;
    if (!challanForm.studentId || (!challanForm.amount && !isExtraOnly)) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    const tuitionToStore = Math.round(parseFloat(challanForm.amount) || 0);
    const additionalToStore = Math.round(Number(challanForm.fineAmount) || 0);
    const discountToStore = Math.round(parseFloat(challanForm.discount) || 0);

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

    // Add "Other" charges if enabled
    if (challanForm.isOtherEnabled && parseFloat(challanForm.otherAmount) > 0) {
      allFeeHeadDetails.push({
        id: -1, // Use -1 for virtual "Other" head
        name: 'Fine',
        amount: Math.round(parseFloat(challanForm.otherAmount)),
        type: 'additional',
        isSelected: true
      });
    }

    if (editingChallan) {
      // VOID challans only allow selectedHeads, dueDate, and remarks to be updated
      const isVoidChallan = editingChallan.status === 'VOID';
      updateChallanMutation.mutate({
        id: editingChallan.id,
        data: isVoidChallan ? {
          selectedHeads: allFeeHeadDetails,
          dueDate: challanForm.dueDate ? format(challanForm.dueDate, "yyyy-MM-dd") : undefined,
          remarks: challanForm.remarks,
        } : {
          studentId: parseInt(challanForm.studentId),
          amount: tuitionToStore + (parseFloat(challanForm.arrearsAmount) || 0),
          dueDate: challanForm.dueDate ? format(challanForm.dueDate, "yyyy-MM-dd") : undefined,
          fineAmount: additionalToStore,
          remarks: challanForm.remarks,
          installmentNumber: installmentNumber,
          selectedHeads: allFeeHeadDetails,
          customArrearsAmount: (challanForm.arrearsAmount !== "" && challanForm.arrearsAmount !== undefined) ? parseFloat(challanForm.arrearsAmount) : undefined,
          arrearsSelections: challanForm.arrearsSelections,
          arrearsLateFee: (challanForm.arrearsSelections || []).reduce((sum, a) => sum + a.lateFee, 0),
          discount: discountToStore
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

  const handlePayment = async (challan) => {
    setItemToPay(challan);
    const arrears = getTotalArrears(challan);
    const fine = getSelectedHeadsTotal(challan) + (challan.lateFeeFine || 0);
    const discount = (challan.discount || 0);
    const currentTotalDue = Math.max(0, (challan.amount || 0) + arrears + fine - discount - (challan.paidAmount || 0));
    
    setPaymentAmount(currentTotalDue.toString());
    
    // Attempt to pre-select arrears for checking (legacy compatibility and UI feedback)
    let preSelectedArrears = [];
    if (challan.previousChallans) {
       preSelectedArrears = challan.previousChallans.map(p => ({
         id: p.id,
         installmentNumber: p.installmentNumber,
         amount: Math.max(0, (p.amount || 0) + (p.fineAmount || 0) + (p.lateFeeFine || 0) - (p.paidAmount || 0) - (p.discount || 0)),
         lateFee: 0 
       }));
    }

    // Initialize payment form from challan
    setChallanForm({
      ...challanForm,
      studentId: challan.studentId.toString(),
      amount: (challan.amount || 0).toString(), // Tuition part
      arrearsAmount: arrears.toString(),
      fineAmount: (challan.fineAmount || 0),
      discount: "0",
      selectedHeads: (() => {
        try {
          const raw = (typeof challan.selectedHeads === 'string' ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []));
          return raw.map(h => {
             if (typeof h === 'object' && h !== null) {
               return (h.isSelected !== false) ? Number(h.id) : null;
             }
             return Number(h);
          }).filter(id => id !== null && !isNaN(id) && id !== -1);
        } catch (e) { return []; }
      })(),
      remarks: challan.remarks || "",
      arrearsSelections: preSelectedArrears,
      isOtherEnabled: (() => {
        try {
          const raw = (typeof challan.selectedHeads === 'string' ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []));
          return Array.isArray(raw) && raw.some(h => (typeof h === 'object' && h !== null && h.id === -1));
        } catch (e) { return false; }
      })(),
      otherAmount: (() => {
        try {
          const raw = (typeof challan.selectedHeads === 'string' ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []));
          if (!Array.isArray(raw)) return "0";
          const other = raw.find(h => (typeof h === 'object' && h !== null && h.id === -1));
          return other ? (other.amount || 0).toString() : "0";
        } catch (e) { return "0"; }
      })()
    });
    
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!itemToPay) return;

    const receiving = parseFloat(paymentAmount) || 0;
    const fine = getSelectedHeadsTotal(itemToPay) + (itemToPay.lateFeeFine || 0);
    const newTotalDiscount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
    const arrearsNeeded = getTotalArrears(itemToPay);
    const totalPayableNow = Math.max(0, (itemToPay.amount || 0) + arrearsNeeded + fine - newTotalDiscount - (itemToPay.paidAmount || 0));

    // Allow overpayment - FIFO credit allocation is handled by the backend
    // EXCEPT for the final installment, which has no future installments to adjust
    if (itemToPay.feeStructure?.installments && itemToPay.installmentNumber >= itemToPay.feeStructure.installments) {
        if (receiving > totalPayableNow + 0.01) {
            toast({
                title: "Overpayment Restricted",
                description: `Receiving amount (${receiving.toLocaleString()}) cannot exceed total payable (${totalPayableNow.toLocaleString()}) on the final installment.`,
                variant: "destructive",
            });
            return;
        }
    }

    const newPaidTotal = (itemToPay.paidAmount || 0) + receiving;
    const headsTotal = getSelectedHeadsTotal(itemToPay);

    const allFeeHeadDetails = (feeHeads || [])
      .filter(h => (challanForm.selectedHeads || []).includes(Number(h.id)))
      .map(h => ({
        id: Number(h.id),
        name: h.name,
        amount: Math.round(Number(h.amount) || 0),
        type: h.isTuition ? 'tuition' : (h.isDiscount ? 'discount' : 'additional'),
        isSelected: true
      }));

    if (challanForm.isOtherEnabled && parseFloat(challanForm.otherAmount) > 0) {
      allFeeHeadDetails.push({
        id: -1,
        name: 'Fine',
        amount: Math.round(parseFloat(challanForm.otherAmount)),
        type: 'additional',
        isSelected: true
      });
    }

    updateChallanMutation.mutate({
      id: itemToPay.id,
      data: {
        status: newPaidTotal >= ((itemToPay.amount || 0) + headsTotal + (itemToPay.lateFeeFine || 0) - newTotalDiscount) ? "PAID" : "PARTIAL",
        paidDate: challanForm.paidDate,
        paidBy: challanForm.paidBy,
        paidAmount: newPaidTotal,
        receivingAmount: receiving,
        discount: newTotalDiscount,
        remarks: challanForm.remarks,
        arrearsSelections: challanForm.arrearsSelections,
        selectedHeads: allFeeHeadDetails,
        customArrearsAmount: (challanForm.arrearsAmount !== "" && challanForm.arrearsAmount !== undefined) ? parseFloat(challanForm.arrearsAmount) : undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Payment recorded successfully" });
        setPaymentDialogOpen(false);
        setItemToPay(null);
        setPaymentAmount("");
        resetChallanForm();
      }
    });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "feeHead") {
      deleteHeadMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "structure") {
      deleteStructureMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "challan") {
      deleteChallanMutation.mutate(itemToDelete.id);
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
    // Section — only show if present
    const studentSection = challan.studentSection?.name || student.section?.name || student.sectionName || "";
    const classSection = studentSection ? `${studentClass} / ${studentSection}` : studentClass;
    const programClassSection = studentSection
      ? `${studentProgram} / ${studentClass} / ${studentSection}`.replace(/^\/\s*/, '').trim()
      : studentProgram ? `${studentProgram} / ${studentClass}` : studentClass;

    // All amounts derived strictly from the challan's own stored fields (snapshot at creation)
    // fineAmount = additional fee heads total, lateFeeFine = late fee, amount = tuition
    const tuitionOnly = challan.amount || 0;
    const headsTotal = challan.fineAmount || 0;
    const lateFee = challan.lateFeeFine || 0;
    const scholarship = parseFloat(challan.discount) || 0;
    const originalArrears = getTotalArrears(challan);

    const grossTotal = tuitionOnly + headsTotal + lateFee + originalArrears;
    const standardTotal = grossTotal - scholarship;
    const netPayable = Math.max(0, standardTotal - (challan.paidAmount || 0));
    const fineTotal = headsTotal + lateFee;

    // FIFO payment distribution for display purposes
    let remainingPaid = challan.paidAmount || 0;
    const arrearsPaid = Math.min(originalArrears, remainingPaid);
    remainingPaid -= arrearsPaid;
    const tuitionPaid = Math.min(tuitionOnly, remainingPaid);
    remainingPaid -= tuitionPaid;
    const finePaid = Math.min(fineTotal, remainingPaid);

    // Fee heads rows from snapshot
    const rawHeads = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
      ? JSON.parse(challan.selectedHeads)
      : (challan.selectedHeads || []);

    const headLookup = (feeHeads || []).reduce((acc, h) => {
      acc[h.id] = h;
      return acc;
    }, {});

    let totalOtherHeadsFromSelection = 0;
    let headRemainingPaid = Math.max(0, (challan.paidAmount || 0) - arrearsPaid - tuitionPaid);

    const distributedHeads = rawHeads.map(item => {
      let headInfo = null;
      if (typeof item === 'object' && item !== null) {
        headInfo = { ...item };
      } else {
        const h = headLookup[Number(item)];
        if (h && !h.isTuition && !h.isDiscount) {
          headInfo = { id: h.id, name: h.name, amount: parseFloat(h.amount) || 0, type: 'additional', isSelected: true };
        }
      }
      if (headInfo && headInfo.isSelected && headInfo.type === 'additional' && headInfo.amount > 0) {
        const paidForThisHead = Math.min(headInfo.amount, headRemainingPaid);
        headRemainingPaid -= paidForThisHead;
        return { ...headInfo, paid: paidForThisHead, balance: headInfo.amount - paidForThisHead };
      }
      return headInfo;
    });

    let feeHeadsRowsHtml = distributedHeads.filter(h => h && h.type === 'additional' && h.amount > 0).map(h => {
      totalOtherHeadsFromSelection += h.amount;
      return `<tr><td>${h.name}</td><td>${(h.balance ?? h.amount ?? 0).toLocaleString()}</td></tr>`;
    }).join('');

    if (lateFee > 0) {
      feeHeadsRowsHtml += `<tr><td>Late Fee (Overdue)</td><td>${lateFee.toLocaleString()}</td></tr>`;
    }

    // Recursively compute total owed for a challan including its own arrears chain
    const computeTotalOwed = (c) => {
      const own = (c.amount || 0) + (c.fineAmount || 0) + (c.lateFeeFine || 0) - (c.discount || 0);
      const chainArrears = (c.previousChallans || []).reduce((sum, prev) => {
        const prevOwed = computeTotalOwed(prev);
        return sum + Math.max(0, prevOwed - (prev.paidAmount || 0));
      }, 0);
      return Math.max(0, own + chainArrears);
    };

    // Recursively build arrear rows — expand each unpaid prev challan and its own chain
    const buildArrearRows = (prevChallans, depth = 0) => {
      const indent = depth > 0 ? `${'&nbsp;'.repeat(depth * 4)}↳ ` : '';
      return prevChallans
        .filter(prev => prev.status !== 'PAID')
        .flatMap(prev => {
          const ownAmount = Math.max(0,
            (prev.amount || 0) + (prev.fineAmount || 0) + (prev.lateFeeFine || 0) - (prev.discount || 0)
          );
          const label = `${indent}${prev.session || ''} - Installment ${prev.installmentNumber || ''} (${prev.month || ''}) - Balance`;
          const row = `<tr><td>${label}</td><td>${ownAmount.toLocaleString()}</td></tr>`;
          // Recursively expand this challan's own prev chain
          const childRows = prev.previousChallans?.length
            ? buildArrearRows(prev.previousChallans, depth + 1)
            : [];
          return [row, ...childRows];
        });
    };

    const arrearsDetailRows = buildArrearRows(challan.previousChallans || []).join('');

    // Build payment history — past installments of same student + same session only
    // (installmentNumber < current challan's installmentNumber)
    const sessionChallans = (feeChallans || [])
      .filter(c =>
        c.studentId === challan.studentId &&
        c.session === challan.session &&
        c.installmentNumber > 0 &&
        c.installmentNumber < (challan.installmentNumber || 0)
      )
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));

    const paymentHistoryMonths = sessionChallans.map(h =>
      `<td>Inst.${h.installmentNumber || ''}${h.month ? ` (${h.month})` : ''}</td>`
    ).join('');
    const paymentHistoryTotals = sessionChallans.map(h =>
      `<td>${computeTotalOwed(h).toLocaleString()}</td>`
    ).join('');
    const paymentHistoryPaid = sessionChallans.map(h =>
      `<td>${(h.paidAmount || 0).toLocaleString()}</td>`
    ).join('');

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
      '{{amount}}': (standardTotal - scholarship).toLocaleString(), // Full billed
      '{{fineAmount}}': (fineTotal - finePaid).toLocaleString(), // Remaining fine
      '{{netPayable}}': netPayable.toLocaleString(),
      '{{instituteName}}': 'Concordia College Peshawar',
      '{{instituteAddress}}': '60-C, Near NCS School, University Town Peshawar',

      // Case-sensitive exact matches for temps.html
      '{{challanNo}}': challan.challanNumber,
      '{{issueDate}}': formatDate(challan.issueDate || challan.createdAt),
      '{{dueDate}}': formatDate(challan.dueDate),
      '{{month}}': challan.month || '',
      '{{session}}': challan.session || '',
      '{{installmentNo}}': challan.installmentNumber > 0 ? `Installment #${challan.installmentNumber}` : 'Additional',
      '{{studentName}}': `${student.fName} ${student.lName || ''}`.trim(),
      '{{fatherName}}': student.fatherOrguardian || '',
      '{{rollNo}}': student.rollNumber,
      '{{class}}': studentClass,
      '{{section}}': studentSection,
      '{{program}}': studentProgram,
      '{{feeHeadsRows}}': feeHeadsRowsHtml,
      '{{Tuition Fee}}': tuitionOnly.toLocaleString(), // Show full tuition amount, not balance
      '{{arrears}}': (originalArrears - arrearsPaid).toLocaleString(),
      '{{arrearsRows}}': arrearsDetailRows,
      '{{discount}}': scholarship.toLocaleString(),
      '{{totalPayable}}': (() => {
        // For settled VOID challans, show 0 as total payable
        if (challan.status === 'VOID' && (challan.settledAmount || 0) > 0) {
          const totalDue = (challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.discount || 0);
          const remaining = Math.max(0, totalDue - (challan.settledAmount || 0));
          return remaining.toLocaleString();
        }
        return netPayable.toLocaleString();
      })(),
      '{{rupeesInWords}}': numberToWords(netPayable),
      '{{paymentHistoryMonths}}': paymentHistoryMonths,
      '{{paymentHistoryTotals}}': paymentHistoryTotals,
      '{{paymentHistoryPaid}}': paymentHistoryPaid,
      
      // Paid row - show for challans with payment or settlement
      '{{paidRow}}': (challan.paidAmount > 0 || (challan.status === 'VOID' && (challan.settledAmount || 0) > 0)) ? `
        <tr style="background-color: #d4edda;">
          <td style="font-weight: bold;">Paid</td>
          <td>${challan.status === 'VOID' ? (challan.settledAmount || 0).toLocaleString() : (challan.paidAmount || 0).toLocaleString()}</td>
        </tr>
      ` : '',
      
      // Payment details for PAID challans
      '{{totalPaid}}': (challan.paidAmount || 0).toLocaleString(),
      '{{paidDate}}': challan.paidDate ? formatDate(challan.paidDate) : 'N/A',
      '{{paymentRemarks}}': challan.paymentRemarks || challan.remarks || 'Paid cash in accounts office',
      '{{remaining}}': Math.max(0, standardTotal - (challan.paidAmount || 0)).toLocaleString(),
      
      // Payment details row - show for PAID challans or settled VOID challans
      '{{paymentDetailsRow}}': (challan.status === 'PAID' || (challan.status === 'VOID' && (challan.settledAmount || 0) > 0)) ? `
        <tr style="background-color: #d4edda; border: 2px solid #28a745;">
          <td colspan="2" style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Payment Details:</div>
            <div style="font-size: 9px;">
              <strong>Total ${challan.status === 'VOID' ? 'Settled' : 'Paid'}:</strong> Rs. ${challan.status === 'VOID' ? (challan.settledAmount || 0).toLocaleString() : (challan.paidAmount || 0).toLocaleString()} 
              <strong style="margin-left: 10px;">${challan.status === 'VOID' ? 'Settled' : 'Paid'} Date:</strong> ${(() => {
                if (challan.status === 'VOID') {
                  // For VOID challans, get the paidDate from the superseding challan
                  return challan.supersededBy?.paidDate ? formatDate(challan.supersededBy.paidDate) : 'N/A';
                }
                return challan.paidDate ? formatDate(challan.paidDate) : 'N/A';
              })()}
            </div>
            <div style="font-size: 9px; margin-top: 2px;">
              <strong>Remaining:</strong> Rs. ${(() => {
                if (challan.status === 'VOID') {
                  const totalDue = (challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.discount || 0);
                  return Math.max(0, totalDue - (challan.settledAmount || 0)).toLocaleString();
                }
                return Math.max(0, standardTotal - (challan.paidAmount || 0)).toLocaleString();
              })()}
            </div>
            <div style="font-size: 9px; margin-top: 2px; font-style: italic;">
              <strong>Remarks:</strong> ${challan.paymentRemarks || challan.remarks || (challan.status === 'VOID' ? 'Settled via superseding challan' : 'Paid cash in accounts office')}
            </div>
          </td>
        </tr>
      ` : '',

      // Uppercase variants for modern templates
      '{{CHALLAN_NO}}': challan.challanNumber,
      '{{ISSUE_DATE}}': formatDate(new Date()),
      '{{DUE_DATE}}': formatDate(challan.dueDate),
      '{{VALID_DATE}}': formatDate(new Date(new Date(challan.dueDate).setDate(new Date(challan.dueDate).getDate() + 7))),
      '{{STUDENT_NAME}}': `${student.fName} ${student.lName || ''}`.trim(),
      '{{FATHER_NAME}}': student.fatherOrguardian || '',
      '{{ROLL_NO}}': student.rollNumber,
      '{{CLASS}}': studentClass,
      '{{SECTION}}': studentSection,
      '{{PROGRAM}}': studentProgram,
      '{{FULL_CLASS}}': fullClass,
      '{{TOTAL_AMOUNT}}': standardTotal.toLocaleString(),
      '{{SCHOLARSHIP}}': scholarship.toLocaleString(),
      '{{NET_PAYABLE}}': netPayable.toLocaleString(),
      '{{AMOUNT_IN_WORDS}}': numberToWords(netPayable),
      '{{FEE_HEADS_TABLE}}': feeHeadsRowsHtml,
      '{{PAID_AMOUNT}}': (challan.paidAmount || 0).toLocaleString(),
      '{{REMAINING_AMOUNT}}': (challan.remainingAmount || 0).toLocaleString(),
      '{{paidAmount}}': (challan.paidAmount || 0).toLocaleString(),
      '{{remainingAmount}}': (challan.remainingAmount || 0).toLocaleString(),
      
      // Detailed Contextual Tags
      '{{TUITION_ORIGINAL}}': tuitionOnly.toLocaleString(),
      '{{TUITION_PAID}}': tuitionPaid.toLocaleString(),
      '{{TUITION_BALANCE}}': (tuitionOnly - tuitionPaid).toLocaleString(),
      '{{ARREARS_ORIGINAL}}': originalArrears.toLocaleString(),
      '{{ARREARS_PAID}}': arrearsPaid.toLocaleString(),
      '{{ARREARS_BALANCE}}': (originalArrears - arrearsPaid).toLocaleString(),
      '{{FINE_ORIGINAL}}': fineTotal.toLocaleString(),
      '{{FINE_PAID}}': finePaid.toLocaleString(),
      '{{FINE_BALANCE}}': (fineTotal - finePaid).toLocaleString(),
    };

    let finalHtml = templateContent;

    // Replace combined class/section patterns FIRST (before individual replacements)
    // This prevents trailing '/' when section is empty
    finalHtml = finalHtml.replace(/\{\{program\}\}\s*\/\s*\{\{class\}\}\s*\/\s*\{\{section\}\}/g, programClassSection);
    finalHtml = finalHtml.replace(/\{\{class\}\}\s*\/\s*\{\{section\}\}/g, classSection);

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
                      <TableHead>Base Payable</TableHead>
                      <TableHead>Extra/Heads</TableHead>
                      <TableHead>Fine (Late Fee)</TableHead>
                      <TableHead>Total</TableHead>
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
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-slate-800">
                                {challan.month || (challan.installmentNumber === 0 ? "Extra" : `Inst #${challan.installmentNumber}`)}
                              </div>
                              {challan.session && (
                                <div className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded inline-block w-fit">
                                  {challan.session}
                                </div>
                              )}
                              {!challan.month && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(challan.coveredInstallments || (challan.installmentNumber === 0 ? "Extra" : `${challan.installmentNumber}`)).split(/[,|-]/).map((num, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] h-4 min-w-[20px] justify-center px-1 rounded-full bg-slate-50 border-slate-200 text-slate-600 font-medium">
                                      {num.trim()}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">PKR {formatAmount(challan.amount)}</TableCell>
                          <TableCell className="font-medium text-orange-600">
                             PKR {formatAmount(getSelectedHeadsTotal(challan))}
                             {getTotalArrears(challan) > 0 && (
                               <div className="text-[10px] text-muted-foreground font-normal">
                                 + Arrears: {formatAmount(getTotalArrears(challan))}
                               </div>
                             )}
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            PKR {formatAmount(challan.lateFeeFine)}
                            {challan.status === "VOID" && (challan.lateFeeFine || 0) > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 inline-flex items-center cursor-help">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  Late fee of PKR {formatAmount(challan.lateFeeFine)} is preserved for audit.
                                  {challan.supersededBy ? ` Included in Challan #${challan.supersededBy.challanNumber}.` : " Rolled into superseding challan."}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="font-bold">
                            PKR {formatAmount(getChallanTotal(challan))}
                          </TableCell>
                          <TableCell className="text-success font-medium">PKR {formatAmount(challan.paidAmount || 0)}</TableCell>
                          <TableCell>
                            <div>{new Date(challan.dueDate).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "PARTIAL" ? "warning" : challan.status === "VOID" ? "outline" : "secondary"}>
                                {challan.status === "VOID" ? "Superseded" : challan.status}
                              </Badge>
                              {challan.status === "VOID" && challan.supersededBy && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground cursor-help">
                                      <span className="truncate max-w-[80px]">{challan.month || `Inst #${challan.installmentNumber}`}</span>
                                      <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate max-w-[80px] font-medium text-slate-600">#{challan.supersededBy.challanNumber}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    <p className="font-semibold mb-1">Superseding Chain</p>
                                    <p>This installment&apos;s debt (including late fees) was rolled into Challan #{challan.supersededBy.challanNumber}.</p>
                                    {(challan.lateFeeFine || 0) > 0 && (
                                      <p className="mt-1 text-amber-300">Late fee of PKR {formatAmount(challan.lateFeeFine)} is included in the superseding challan.</p>
                                    )}
                                    {(() => {
                                      const totalDue = (challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.discount || 0);
                                      const settled = challan.settledAmount || 0;
                                      if (settled <= 0) return null;
                                      const remaining = Math.max(0, totalDue - settled);
                                      return (
                                        <div className="mt-1 border-t border-white/20 pt-1 space-y-0.5">
                                          <p>Total: PKR {formatAmount(totalDue)}</p>
                                          <p className="text-green-300">Settled: PKR {formatAmount(settled)}</p>
                                          {remaining > 0
                                            ? <p className="text-amber-300">Remaining: PKR {formatAmount(remaining)}</p>
                                            : <p className="text-green-300">✓ Fully settled</p>
                                          }
                                        </div>
                                      );
                                    })()}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {challan.status === "VOID" && (challan.settledAmount || 0) > 0 && (
                                <div className="text-[9px] text-green-600 font-medium">
                                  Settled: PKR {formatAmount(challan.settledAmount)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedChallanDetails(challan);
                                    setDetailsDialogOpen(true);
                                  }}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              {challan.status !== "PAID" && !(challan.status === "VOID" && (challan.settledAmount || 0) > 0) && <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={async () => {
                                setEditingChallan(challan);
                                const isExtraChallan = challan.installmentNumber === 0 || challan.challanType === 'FEE_HEADS_ONLY';
                                
                                // Fetch plan for the student to show arrears checklist
                                let fetchedPlan = [];
                                if (!isExtraChallan) {
                                  try {
                                    const results = await getInstallmentPlans({
                                      studentId: challan.studentId,
                                    });
                                    fetchedPlan = results[0]?.feeInstallments || [];
                                    setGenStudentPlan(fetchedPlan);
                                  } catch (error) {
                                    console.error("Failed to fetch plan for edit:", error);
                                  }
                                }

                                // Auto-identify all potential past unpaid installments (for reference or if snapshot is missing)
                                let autoSelectedArrears = [];
                                let autoArrearsTotal = 0;

                                if (!isExtraChallan) {
                                  const targetInst = fetchedPlan.find(inst => inst.installmentNumber === challan.installmentNumber);
                                  
                                  const seenInstNums = new Set();
                                  const pastUnpaid = fetchedPlan.filter(inst => {
                                    if (!targetInst || inst.installmentNumber >= targetInst.installmentNumber) return false;
                                    if (seenInstNums.has(inst.installmentNumber)) return false;
                                    seenInstNums.add(inst.installmentNumber);
                                    return (inst.remainingAmount || (inst.amount - (inst.paidAmount || 0))) > 0;
                                  });

                                  autoSelectedArrears = pastUnpaid.map(inst => ({
                                    id: inst.id,
                                    installmentNumber: inst.installmentNumber,
                                    amount: inst.remainingAmount || (inst.amount - (inst.paidAmount || 0)),
                                    lateFee: inst.lateFeeAccrued != null ? inst.lateFeeAccrued : calculateLateFee(inst.dueDate, lateFeeFine)
                                  }));

                                  autoArrearsTotal = autoSelectedArrears.reduce((sum, a) => sum + a.amount, 0);
                                }

                                // Reconstruct arrearsSelections from coveredInstallments snapshot if available
                                const coveredStr = challan.coveredInstallments || "";
                                let snapshotArrears = [];
                                if (coveredStr && !isExtraChallan) {
                                  let coveredNums = [];
                                  if (coveredStr.includes("-")) {
                                    const [start, end] = coveredStr.split("-").map(Number);
                                    if (!isNaN(start) && !isNaN(end)) {
                                      for (let i = start; i <= end; i++) coveredNums.push(i);
                                    }
                                  } else {
                                    coveredNums = coveredStr.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n));
                                  }
                                  
                                  const currentInstNum = challan.installmentNumber || 0;
                                  snapshotArrears = fetchedPlan
                                    .filter(inst => coveredNums.includes(inst.installmentNumber) && inst.installmentNumber !== currentInstNum)
                                    .map(inst => ({
                                      id: inst.id,
                                      installmentNumber: inst.installmentNumber,
                                      amount: inst.remainingAmount || (inst.amount - (inst.paidAmount || 0)),
                                      lateFee: inst.lateFeeAccrued != null ? inst.lateFeeAccrued : calculateLateFee(inst.dueDate, lateFeeFine)
                                    }));
                                  
                                  // filter unique for safety
                                  const finalArrears = [];
                                  const finalSeen = new Set();
                                  snapshotArrears.forEach(a => {
                                    if (!finalSeen.has(a.installmentNumber)) {
                                      finalSeen.add(a.installmentNumber);
                                      finalArrears.push(a);
                                    }
                                  });
                                  snapshotArrears = finalArrears;
                                }

                                setChallanForm({
                                  ...challanForm,
                                  studentId: challan.studentId.toString(),
                                  amount: (challan.amount - (challan.arrearsAmount || 0)).toString(),
                                  dueDate: challan.dueDate ? new Date(challan.dueDate) : "",
                                  remarks: challan.remarks || "",
                                  installmentNumber: (challan.installmentNumber || 0).toString(),
                                  arrearsAmount: isExtraChallan ? "0" : (challan.arrearsAmount || 0).toString(),
                                  arrearsSelections: isExtraChallan ? [] : (snapshotArrears.length > 0 ? snapshotArrears : autoSelectedArrears),
                                  isOtherEnabled: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);
                                      const hasOtherHead = Array.isArray(raw) && raw.some(h => (typeof h === 'object' && h !== null && h.id === -1));
                                      return hasOtherHead || (isExtraChallan && (challan.fineAmount || 0) > 0);
                                    } catch (e) { return (isExtraChallan && (challan.fineAmount || 0) > 0); }
                                  })(),
                                  otherAmount: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);
                                      if (Array.isArray(raw)) {
                                        const other = raw.find(h => (typeof h === 'object' && h !== null && h.id === -1));
                                        if (other) return (other.amount || 0).toString();
                                      }
                                      if (isExtraChallan && (challan.fineAmount || 0) > 0) return (challan.fineAmount || 0).toString();
                                      return "0";
                                    } catch (e) { 
                                      return (isExtraChallan && (challan.fineAmount || 0) > 0) ? (challan.fineAmount || 0).toString() : "0"; 
                                    }
                                  })(),
                                  selectedHeads: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);
                                      if (!Array.isArray(raw)) return [];
                                      return raw.map(item => {
                                        if (typeof item === 'object' && item !== null) {
                                          const id = item.id !== undefined ? item.id : item;
                                          return (item.isSelected !== false) ? Number(id) : null;
                                        }
                                        return Number(item);
                                      }).filter(id => id !== null && !isNaN(id));
                                    } catch (e) { return []; }
                                  })(),
                                  fineAmount: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);
                                      const snapshotSum = Array.isArray(raw) ? raw.reduce((s, item) => {
                                        if (typeof item === 'object' && item !== null && (item.isSelected !== false) && item.type === 'additional') {
                                          return s + (item.amount || 0);
                                        }
                                        return s;
                                      }, 0) : 0;
                                      if (snapshotSum > 0) return snapshotSum.toString();
                                      return (challan.fineAmount || 0).toString();
                                    } catch (e) { return (challan.fineAmount || 0).toString(); }
                                  })(),
                                  discount: challan.discount || 0
                                });
                                setChallanOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Challan</TooltipContent>
                              </Tooltip>}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => printChallan(challan.id)}>
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print Challan</TooltipContent>
                              </Tooltip>
                              {challan.status !== "PAID" && challan.status !== "VOID" && <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-success border-success hover:bg-success hover:text-white" onClick={() => handlePayment(challan)}>
                                    Pay
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Record Payment</TooltipContent>
                              </Tooltip>}
                              {challan.paymentHistory && <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedChallanForHistory(challan);
                                    setHistoryDialogOpen(true);
                                  }}>
                                    <History className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Payment History</TooltipContent>
                              </Tooltip>}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setItemToDelete({ 
                                        type: "challan", 
                                        id: challan.id, 
                                        status: challan.status,
                                        number: challan.challanNumber 
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Challan</TooltipContent>
                              </Tooltip>
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
                <Button
                  className="bg-orange-600 hover:bg-orange-700 gap-2"
                  onClick={() => {
                    setExtraSelectedStudent(null);
                    setExtraSelectedHeads([]);
                    setExtraRemarks("");
                    setExtraIsOtherEnabled(false);
                    setExtraOtherAmount("0");
                    setExtraDueDate(null);
                    setCreateExtraChallanOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Create Extra Challan
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="mt-8">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Existing Extra Challans</CardTitle>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Search</Label>
                    <Input
                      placeholder="Challan #, name, roll..."
                      value={extraSearch}
                      onChange={(e) => { setExtraSearch(e.target.value); setExtraPage(1); }}
                      className="w-[200px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={extraStatusFilter} onValueChange={(v) => { setExtraStatusFilter(v); setExtraPage(1); }}>
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
                    <Label className="text-xs">Month</Label>
                    <Input
                      type="month"
                      value={extraMonth}
                      onChange={(e) => { setExtraMonth(e.target.value); setExtraPage(1); }}
                      className="w-[160px]"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExtraSearch(""); setExtraStatusFilter("all"); setExtraMonth(""); setExtraPage(1); }}
                    className="h-9 px-2 text-muted-foreground"
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Challan No</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Base Amount</TableHead>
                        <TableHead>Extra/Heads</TableHead>
                        <TableHead>Fine (Late Fee)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isExtraLoading ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8">Loading extra challans...</TableCell></TableRow>
                      ) : extraChallans.map(challan => (
                        <TableRow key={challan.id}>
                          <TableCell className="font-medium">{challan.challanNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium">{challan.student?.fName} {challan.student?.lName}</div>
                            <div className="text-xs text-muted-foreground">{challan.student?.rollNumber}</div>
                          </TableCell>
                          <TableCell>PKR {formatAmount(challan.amount)}</TableCell>
                          <TableCell className="font-medium text-orange-600">PKR {formatAmount(getSelectedHeadsTotal(challan))}</TableCell>
                          <TableCell className="font-medium text-red-600">PKR {formatAmount(challan.lateFeeFine)}</TableCell>
                          <TableCell className="font-bold">
                            PKR {formatAmount(getChallanTotal(challan))}
                          </TableCell>
                          <TableCell className="text-success font-medium">PKR {formatAmount(challan.paidAmount || 0)}</TableCell>
                          <TableCell>{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "PARTIAL" ? "warning" : challan.status === "VOID" ? "outline" : "secondary"}>
                              {challan.status === "VOID" ? "Superseded" : challan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setSelectedChallanDetails(challan);
                                    setDetailsDialogOpen(true);
                                  }}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => printChallan(challan.id)}>
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print Challan</TooltipContent>
                              </Tooltip>
                              {challan.status !== "PAID" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={async () => {
                                  setEditingChallan(challan);
                                  const isExtraChallan = true; // Always true for this table
                                  
                                  setChallanForm({
                                    ...challanForm,
                                    studentId: challan.studentId.toString(),
                                    amount: (challan.amount || 0).toString(),
                                    dueDate: challan.dueDate ? new Date(challan.dueDate) : "",
                                    remarks: challan.remarks || "",
                                    installmentNumber: "0",
                                    arrearsAmount: "0",
                                    arrearsSelections: [],
                                    isOtherEnabled: (() => {
                                      try {
                                        const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                          ? JSON.parse(challan.selectedHeads)
                                          : (challan.selectedHeads || []);
                                        return Array.isArray(raw) && raw.some(h => (typeof h === 'object' && h !== null && h.id === -1));
                                      } catch (e) { return false; }
                                    })(),
                                    otherAmount: (() => {
                                      try {
                                        const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                          ? JSON.parse(challan.selectedHeads)
                                          : (challan.selectedHeads || []);
                                        if (!Array.isArray(raw)) return "0";
                                        const other = raw.find(h => (typeof h === 'object' && h !== null && h.id === -1));
                                        return other ? (other.amount || 0).toString() : "0";
                                      } catch (e) { return "0"; }
                                    })(),
                                    selectedHeads: (() => {
                                      try {
                                        const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                          ? JSON.parse(challan.selectedHeads)
                                          : (challan.selectedHeads || []);
                                        if (!Array.isArray(raw)) return [];
                                        return raw.map(item => {
                                          if (typeof item === 'object' && item !== null) {
                                            const id = item.id !== undefined ? item.id : item;
                                            return (item.isSelected !== false) ? Number(id) : null;
                                          }
                                          return Number(item);
                                        }).filter(id => id !== null && !isNaN(id));
                                      } catch (e) { return []; }
                                    })(),
                                    fineAmount: (() => {
                                      try {
                                        const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                          ? JSON.parse(challan.selectedHeads)
                                          : (challan.selectedHeads || []);
                                        const snapshotSum = Array.isArray(raw) ? raw.reduce((s, item) => {
                                          if (typeof item === 'object' && item !== null && (item.isSelected !== false) && item.type === 'additional') {
                                            return s + (item.amount || 0);
                                          }
                                          return s;
                                        }, 0) : 0;
                                        if (snapshotSum > 0) return snapshotSum.toString();
                                        return (challan.fineAmount || 0).toString();
                                      } catch (e) { return (challan.fineAmount || 0).toString(); }
                                    })(),
                                    discount: challan.discount || 0
                                  });
                                  setChallanOpen(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Challan</TooltipContent>
                                </Tooltip>
                              )}
                              {challan.status !== "PAID" && challan.status !== "VOID" && (
                                <Button size="sm" variant="outline" className="text-success border-success hover:bg-success hover:text-white" onClick={() => handlePayment(challan)}>
                                  Pay
                                </Button>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setItemToDelete({ 
                                        type: "challan", 
                                        id: challan.id, 
                                        status: challan.status,
                                        number: challan.challanNumber 
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Challan</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isExtraLoading && extraChallans.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            No extra challans found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {extraChallans.length} of {extraChallanMeta?.total || 0} challans
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExtraPage(p => Math.max(1, p - 1))}
                      disabled={extraPage === 1 || isExtraLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {extraPage} of {extraChallanMeta?.lastPage || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExtraPage(p => p + 1)}
                      disabled={extraPage >= (extraChallanMeta?.lastPage || 1) || isExtraLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="student-history">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Search Student:</Label>
              <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={studentSearchOpen} className="w-[300px] justify-between">
                    {selectedStudent ? `${selectedStudent.rollNumber} (${selectedStudent.fName} ${selectedStudent.lName})` : "Select Student..."}
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
                              setHistorySessionFilter("all");
                              setHistoryStatusFilter("all");
                              setHistoryChallanTypeFilter("all");
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
                            {student.rollNumber} ({student.fName} {student.lName})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedStudent && (
              <div className="flex flex-wrap gap-3 items-end mb-2">
                <div className="min-w-[160px]">
                  <Label className="text-xs">Session</Label>
                  <Select value={historySessionFilter} onValueChange={setHistorySessionFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sessions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      {academicSessions.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name} {s.isActive ? "(Current)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px]">
                  <Label className="text-xs">Status</Label>
                  <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="VOID">Superseded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[160px]">
                  <Label className="text-xs">Challan Type</Label>
                  <Select value={historyChallanTypeFilter} onValueChange={setHistoryChallanTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="tuition">Tuition Fee Challan</SelectItem>
                      <SelectItem value="extra">Extra Challan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(historySessionFilter !== "all" || historyStatusFilter !== "all" || historyChallanTypeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setHistorySessionFilter("all"); setHistoryStatusFilter("all"); setHistoryChallanTypeFilter("all"); }}
                    className="text-muted-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}

            {selectedStudent && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Base Amount</TableHead>
                      <TableHead>Extra/Heads</TableHead>
                      <TableHead>Fine (Late Fee)</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFeeHistory.filter(challan => {
                      if (historyStatusFilter !== "all" && challan.status !== historyStatusFilter) return false;
                      if (historySessionFilter !== "all") {
                        const sessionName = academicSessions.find(s => s.id.toString() === historySessionFilter)?.name;
                        if (sessionName && challan.session !== sessionName) return false;
                      }
                      if (historyChallanTypeFilter === "tuition" && challan.challanType === "FEE_HEADS_ONLY") return false;
                      if (historyChallanTypeFilter === "extra" && challan.challanType !== "FEE_HEADS_ONLY") return false;
                      return true;
                    }).map(challan => (
                      <TableRow key={challan.id}>
                        <TableCell>{challan.challanNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm">
                              {challan.month || `Inst #${challan.installmentNumber}`}
                            </span>
                            {challan.session && (
                              <span className="text-[10px] text-muted-foreground">
                                {challan.session}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>PKR {formatAmount(challan.amount)}</TableCell>
                        <TableCell className="font-medium text-orange-600">PKR {formatAmount(getSelectedHeadsTotal(challan))}</TableCell>
                        <TableCell className="font-medium text-red-600">PKR {formatAmount(challan.lateFeeFine)}</TableCell>
                        <TableCell className="font-bold">
                          PKR {formatAmount(getChallanTotal(challan))}
                        </TableCell>
                        <TableCell>{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "VOID" ? "outline" : "secondary"}>
                            {challan.status === "VOID" ? "Superseded" : challan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{challan.paidDate ? new Date(challan.paidDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{challan.paidAmount ? `PKR ${formatAmount(challan.paidAmount)}` : '-'}</TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedChallanDetails(challan);
                                setDetailsDialogOpen(true);
                              }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                              {challan.paymentHistory && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setSelectedChallanForHistory(challan);
                                      setHistoryDialogOpen(true);
                                    }}>
                                      <History className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Payment History</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setItemToDelete({ 
                                        type: "challan", 
                                        id: challan.id, 
                                        status: challan.status,
                                        number: challan.challanNumber 
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Challan</TooltipContent>
                              </Tooltip>
                            </TableCell>
                      </TableRow>
                    ))}
                    {studentFeeHistory.length === 0 && <TableRow><TableCell colSpan={11} className="text-center">No history found</TableCell></TableRow>}
                    {studentFeeHistory.length > 0 && studentFeeHistory.filter(challan => {
                      if (historyStatusFilter !== "all" && challan.status !== historyStatusFilter) return false;
                      if (historySessionFilter !== "all") {
                        const sessionName = academicSessions.find(s => s.id.toString() === historySessionFilter)?.name;
                        if (sessionName && challan.session !== sessionName) return false;
                      }
                      if (historyChallanTypeFilter === "tuition" && challan.challanType === "FEE_HEADS_ONLY") return false;
                      if (historyChallanTypeFilter === "extra" && challan.challanType !== "FEE_HEADS_ONLY") return false;
                      return true;
                    }).length === 0 && (
                      <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">No records match the selected filters</TableCell></TableRow>
                    )}
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
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent>Edit Fee Head</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "feeHead",
                              id: head.id
                            });
                            setDeleteDialogOpen(true);
                          }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Fee Head</TooltipContent>
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
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {structure.program?.name}
                          {(() => {
                            const dept = departments.find(d => d.id === structure.program?.departmentId);
                            return dept ? ` (${dept.name})` : "";
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell>{structure.class?.name}</TableCell>
                      <TableCell className="font-semibold">PKR {structure.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{structure.installments}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => printFeeStructure(structure.id)}>
                                <Printer className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print Structure</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent>Edit Structure</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "structure",
                              id: structure.id
                            });
                            setDeleteDialogOpen(true);
                          }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Structure</TooltipContent>
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
                    {programs.map(p => {
                      const dept = departments.find(d => d.id === p.departmentId);
                      return <SelectItem key={p.id} value={p.id.toString()}>{p.name} {dept ? `(${dept.name})` : ""}</SelectItem>;
                    })}
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

      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) { 
          setItemToPay(null); 
          setPaymentAmount(""); 
          resetChallanForm();
        }
      }}>
         <DialogContent className="max-w-full h-[100vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="bg-white border-b p-4">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg font-bold text-slate-800">Pay Students Fee</DialogTitle>
            </div>
          </DialogHeader>

          {itemToPay && (
            <div className="p-4 space-y-6">
              {itemToPay.status === 'VOID' && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-md flex items-center gap-3 text-orange-800 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    This challan has been <span className="font-bold underline uppercase">Superseded</span> by a newer generation. 
                    Payment is disabled on this record. Please pay the latest challan.
                  </div>
                </div>
              )}
              {/* Payment Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[10px] font-bold text-center">
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Roll No</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Student / Father</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Class</th>
                      <th className="border-r border-slate-600 p-1.5 w-[55px]">Month</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Tuition Fee</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Arrears</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Extra/Heads</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Fine (Late Fee)</th>
                      <th className="border-r border-slate-600 p-1.5 w-[70px]">Discount</th>
                      <th className="border-r border-slate-600 p-1.5 w-[80px]">Total</th>
                      <th className="border-r border-slate-600 p-1.5 w-[65px]">Paid</th>
                      <th className="border-r border-slate-600 p-1.5 w-[80px]">Receiving</th>
                      <th className="p-1.5 w-[80px]">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[11px] text-center bg-white h-12">
                      <td className="border-r border-slate-200 p-2">{itemToPay.student?.rollNumber}</td>
                      <td className="border-r border-slate-200 p-2 text-left px-4">
                        <div className="text-blue-600 font-medium">{itemToPay.student?.fName} {itemToPay.student?.lName} /</div>
                        <div className="text-blue-600 font-medium">{itemToPay.student?.fatherOrguardian || "N/A"}</div>
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        {itemToPay.studentClass?.name || itemToPay.student?.class?.name || "N/A"}
                      </td>
                      <td className="border-r border-slate-200 p-2 font-bold text-slate-800">
                         {itemToPay.month || (itemToPay.issueDate ? format(new Date(itemToPay.issueDate), "MMMM") : "N/A")}
                         {itemToPay.session && <div className="text-[9px] text-slate-500 font-normal">{itemToPay.session}</div>}
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        {Math.max(0, (itemToPay.amount || 0) + getTotalArrears(itemToPay)).toLocaleString()}
                      </td>
                      <td className="border-r border-slate-200 p-2 text-orange-600 font-bold">
                        {getTotalArrears(itemToPay) > 0 ? getTotalArrears(itemToPay).toLocaleString() : <span className="text-slate-400">0</span>}
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="border border-slate-300 rounded px-1 py-1.5 h-8 flex items-center justify-center bg-slate-50">
                           {getSelectedHeadsTotal(itemToPay).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-200 p-2 text-red-600 font-bold">
                        <div className="border border-slate-300 rounded px-1 py-1.5 h-8 flex items-center justify-center bg-slate-50">
                           {itemToPay.lateFeeFine || 0}
                        </div>
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        <Input
                          type="number"
                          className="h-8 text-center text-[11px] border-slate-300 rounded"
                          value={challanForm.discount}
                          onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setChallanForm({...challanForm, discount: val.toString()});
                              const headsTotal = getSelectedHeadsTotal(itemToPay);
                              const alreadyPaid = (itemToPay.paidAmount || 0);
                              const totalDiscount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
                              const arrears = getTotalArrears(itemToPay);
                              const lateFee = itemToPay.lateFeeFine || 0;
                              const oldTotal = Math.max(0, (itemToPay.amount || 0) + arrears + headsTotal + lateFee - totalDiscount - alreadyPaid);
                              const newTotal = Math.max(0, (itemToPay.amount || 0) + arrears + headsTotal + lateFee - (itemToPay.discount || 0) - val - alreadyPaid);
                              const currentRec = parseFloat(paymentAmount) || 0;
                              if (currentRec >= oldTotal || currentRec === 0) {
                                 setPaymentAmount(Math.max(0, newTotal).toString());
                              }
                          }}
                        />
                        {itemToPay.discount > 0 && (
                          <div className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap">
                            Prev. Disc: {itemToPay.discount.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="border-r border-slate-200 p-2">
                        <div className="border border-slate-300 rounded px-1 py-1.5 h-8 flex items-center justify-center bg-slate-50 font-bold">
                          {(() => {
                             const arrears = getTotalArrears(itemToPay);
                             const headsTotal = getSelectedHeadsTotal(itemToPay);
                             const lateFee = itemToPay.lateFeeFine || 0;
                             const discount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
                             return Math.max(0, (itemToPay.amount || 0) + arrears + headsTotal + lateFee - discount).toLocaleString();
                          })()}
                        </div>
                      </td>
                      <td className="border-r border-slate-200 p-2">{(itemToPay.paidAmount || 0).toLocaleString()}</td>
                      <td className="border-r border-slate-200 p-2">
                        <Input
                          type="number"
                          autoFocus
                          className="h-8 text-center text-[11px] border-slate-300 rounded font-bold text-slate-800"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="border border-slate-300 rounded px-1 py-1.5 h-8 flex items-center justify-center bg-slate-50 font-bold text-red-600">
                           {(() => {
                               const arrears = getTotalArrears(itemToPay);
                               const headsTotal = getSelectedHeadsTotal(itemToPay);
                               const lateFee = itemToPay.lateFeeFine || 0;
                               const discount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
                               const alreadyPaid = (itemToPay.paidAmount || 0);
                               const totalDue = (itemToPay.amount || 0) + arrears + headsTotal + lateFee - discount - alreadyPaid;
                               const rec = parseFloat(paymentAmount) || 0;
                               const remaining = totalDue - rec;
                               if (remaining < 0) return `(${Math.abs(remaining).toLocaleString()}) Credit`;
                               return remaining.toLocaleString();
                            })()}
                        </div>
                      </td>
                    </tr>
                    {/* Grand Total Row */}
                    <tr className="bg-slate-800 text-white font-bold h-10 border-t border-slate-600">
                      <td colSpan={5} className="text-left px-4 text-[12px] border-r border-slate-600 uppercase tracking-wider">Grand Total</td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-orange-600 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center font-black">
                          {getTotalArrears(itemToPay).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center">
                          {getSelectedHeadsTotal(itemToPay).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center">
                          {(itemToPay.lateFeeFine || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center">
                          {((itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0)).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center font-black">
                          {(() => {
                            const arrears = getTotalArrears(itemToPay);
                            const headsTotal = getSelectedHeadsTotal(itemToPay);
                            const lateFee = itemToPay.lateFeeFine || 0;
                            const discount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
                            return Math.max(0, (itemToPay.amount || 0) + arrears + headsTotal + lateFee - discount).toLocaleString();
                          })()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center font-black">
                          {(itemToPay.paidAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="border-r border-slate-600 p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center font-black">
                          {(parseFloat(paymentAmount) || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-1">
                        <div className="bg-white text-slate-800 px-2 py-1.5 rounded text-[12px] h-8 flex items-center justify-center font-black">
                           {(() => {
                              const arrears = getTotalArrears(itemToPay);
                              const headsTotal = getSelectedHeadsTotal(itemToPay);
                              const lateFee = itemToPay.lateFeeFine || 0;
                              const discount = (itemToPay.discount || 0) + (parseFloat(challanForm.discount) || 0);
                              const alreadyPaid = (itemToPay.paidAmount || 0);
                              const totalDue = (itemToPay.amount || 0) + arrears + headsTotal + lateFee - discount - alreadyPaid;
                              const rec = parseFloat(paymentAmount) || 0;
                              const remaining = totalDue - rec;
                              if (remaining < 0) return `(${Math.abs(remaining).toLocaleString()}) Credit`;
                              return remaining.toLocaleString();
                           })()}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Form Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700">Paid Date</Label>
                    <div className="relative">
                       <Input 
                         type="date" 
                         value={challanForm.paidDate}
                         onChange={(e) => setChallanForm({...challanForm, paidDate: e.target.value})}
                         className="h-10 text-[13px] border-slate-300" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[12px] font-bold text-slate-700">Paid By</Label>
                    <Select value={challanForm.paidBy} onValueChange={(val) => setChallanForm({...challanForm, paidBy: val})}>
                      <SelectTrigger className="h-10 text-[13px] border-slate-300">
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="JazzCash">JazzCash</SelectItem>
                        <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                        <SelectItem value="Bank Account">Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[12px] font-bold text-slate-700">Remarks</Label>
                 <Textarea 
                   value={challanForm.remarks}
                   onChange={(e) => setChallanForm({...challanForm, remarks: e.target.value})}
                   className="min-h-[100px] border-slate-300 text-[13px]" 
                 />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button 
                   onClick={confirmPayment}
                   disabled={updateChallanMutation.isPending || itemToPay?.status === 'VOID'}
                   className={`px-8 h-10 font-bold rounded ${itemToPay?.status === 'VOID' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                 >
                   {updateChallanMutation.isPending ? "Processing..." : itemToPay?.status === 'VOID' ? "Superseded" : "Pay Fee"}
                 </Button>
                 <Button 
                   variant="outline"
                   onClick={() => setPaymentDialogOpen(false)}
                   className="border-slate-300 text-slate-600 px-8 h-10 rounded"
                 >
                   Close
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.type === "challan" ? `Delete Challan ${itemToDelete.number}` : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "challan" ? (
                <div className="space-y-2">
                  <p>Are you sure you want to delete this challan? This action will:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Restore the original amounts in the student's installment plan.</li>
                    <li>{itemToDelete.status === "PAID" || itemToDelete.status === "PARTIAL" ? <strong>Reverse all payments and restore arrears records.</strong> : "Delete the record permanently."}</li>
                  </ul>
                  <p className="font-bold text-destructive mt-2">This action cannot be undone.</p>
                </div>
              ) : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={itemToDelete?.type === "challan" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {deleteChallanMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Extra Challan Dialog */}
      <Dialog open={createExtraChallanOpen} onOpenChange={(open) => {
        setCreateExtraChallanOpen(open);
        if (!open) {
          setExtraSelectedStudent(null);
          setExtraSelectedHeads([]);
          setExtraRemarks("");
          setExtraIsOtherEnabled(false);
          setExtraOtherAmount("0");
          setExtraDueDate(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" />
              Create Extra Challan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
                              {student.rollNumber} ({student.fName} {student.lName || ''})
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
                          id={`dlg-extra-head-${head.id}`}
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
                        <label htmlFor={`dlg-extra-head-${head.id}`} className="text-sm cursor-pointer flex-1 flex justify-between">
                          <span>{head.name}</span>
                          <span className="text-muted-foreground italic">PKR {head.amount.toLocaleString()}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Other(fine) Option */}
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <div className="flex items-center space-x-2 p-2 border rounded hover:bg-orange-50 transition-colors">
                      <input
                        type="checkbox"
                        id="dlg-extra-other-fine"
                        className="accent-orange-600 h-4 w-4 cursor-pointer"
                        checked={extraIsOtherEnabled}
                        onChange={(e) => setExtraIsOtherEnabled(e.target.checked)}
                      />
                      <label htmlFor="dlg-extra-other-fine" className="text-sm cursor-pointer font-bold text-orange-700">Other(fine)</label>
                    </div>
                    {extraIsOtherEnabled && (
                      <div className="mt-2 pl-6">
                        <div className="relative">
                          <span className="absolute left-2 top-2.5 text-xs text-muted-foreground font-bold">Rs.</span>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Enter fine amount"
                            value={extraOtherAmount}
                            onChange={(e) => setExtraOtherAmount(e.target.value)}
                            className="pl-8 h-9 text-sm font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Remarks</Label>
                  <Textarea value={extraRemarks} onChange={e => setExtraRemarks(e.target.value)} placeholder="Optional notes..." className="text-sm min-h-[60px]" />
                </div>

                {(extraSelectedHeads.length > 0 || (extraIsOtherEnabled && parseFloat(extraOtherAmount) > 0)) && (() => {
                  const charges = feeHeads.filter(h => extraSelectedHeads.includes(h.id) && !h.isDiscount).reduce((s, h) => s + h.amount, 0);
                  const finalCharges = charges + (extraIsOtherEnabled ? (parseFloat(extraOtherAmount) || 0) : 0);
                  return (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex justify-between text-sm">
                        <span>Charges:</span><span className="font-semibold">PKR {finalCharges.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-orange-300 mt-1 pt-1">
                        <span>Total:</span><span>PKR {finalCharges.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setCreateExtraChallanOpen(false)}>Cancel</Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!extraSelectedStudent || (extraSelectedHeads.length === 0 && !(extraIsOtherEnabled && parseFloat(extraOtherAmount) > 0)) || !extraDueDate || isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const adHocHeads = [];
                    if (extraIsOtherEnabled && parseFloat(extraOtherAmount) > 0) {
                      adHocHeads.push({
                        name: 'Fine',
                        amount: parseFloat(extraOtherAmount),
                        type: 'additional',
                        isSelected: true,
                        isAdHoc: true
                      });
                    }
                    const result = await generateChallansFromPlan({
                      month: format(extraDueDate, "yyyy-MM"),
                      studentId: extraSelectedStudent.id,
                      customAmount: 0,
                      selectedHeads: extraSelectedHeads.length > 0 || adHocHeads.length > 0 ? [...extraSelectedHeads, ...adHocHeads] : [],
                      customArrearsAmount: 0,
                      remarks: extraRemarks || "Extra fee head challan",
                      dueDate: format(extraDueDate, "yyyy-MM-dd"),
                    });
                    if (result && result.length > 0 && result[0].status === 'CREATED') {
                      toast({ title: "Extra challan created successfully" });
                      queryClient.invalidateQueries(['feeChallans']);
                      queryClient.invalidateQueries(['extraChallans']);
                      setCreateExtraChallanOpen(false);
                    } else {
                      toast({ title: result?.[0]?.reason || "Could not create challan.", variant: "destructive" });
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
        </DialogContent>
      </Dialog>

      <Dialog open={challanOpen} onOpenChange={(open) => {
        setChallanOpen(open);
        if (!open) {
          resetChallanForm();
        }
      }}>
        <DialogContent className="max-w-4xl p-3 md:p-4 max-h-[96vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-1 border-b mb-2">
            <DialogTitle className="text-base font-bold">
              {parseInt(challanForm.installmentNumber) > 0 ? "Edit Fee Challan" : "Edit Extra Fee Challan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-0 overflow-y-auto overflow-x-hidden pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-2 bg-muted/15">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">STUDENT</Label>
                <Input
                  value={editingChallan?.student ? `${editingChallan.student.fName} ${editingChallan.student.lName} (${editingChallan.student.rollNumber})` : ""}
                  disabled
                  className="bg-muted/50 h-8 text-sm"
                />
              </div>
              {challanForm.installmentNumber > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">INSTALLMENT DETAILS</Label>
                  <Input
                    value={`Installment #${challanForm.installmentNumber}`}
                    disabled
                    className="bg-muted/50 h-8 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">DUE DATE</Label>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {parseInt(challanForm.installmentNumber) > 0 && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">INSTALLMENT AMOUNT (TUITION)</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">Rs.</span>
                    <Input
                      type="number"
                      min="0"
                      value={challanForm.amount}
                      disabled
                      className="pl-8 h-8 text-sm font-semibold text-orange-700 bg-orange-50/30"
                    />
                  </div>
                </div>
              )}

              {parseInt(challanForm.installmentNumber) > 0 && parseFloat(challanForm.arrearsAmount) > 0 && (
                <div className="col-span-2 space-y-1 pt-1 border-t">
                  <div className="flex justify-between items-center bg-red-50 p-2 rounded-md border border-red-100 italic transition-all animate-in fade-in slide-in-from-top-1">
                    <Label className="text-[10px] font-black text-red-700 uppercase flex items-center gap-2">
                       <History className="w-3.5 h-3.5" /> ARREARS INCLUDED (INST #: {[...new Set(challanForm.arrearsSelections.map(s => s.installmentNumber || 'S'))].join(', ')})
                    </Label>
                    <span className="text-sm font-black text-red-700">Rs. {parseFloat(challanForm.arrearsAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="col-span-2 space-y-3 pt-1.5 border-t text-sm">
                <div className="grid grid-cols-1 gap-3">
                  {/* Charges Heads */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 px-1 italic">
                      <PlusCircle className="w-3 h-3 text-blue-500" /> ADDITIONAL CHARGES
                    </Label>
                    <div className="grid grid-cols-1 gap-1 border rounded p-1.5 max-h-[140px] overflow-y-auto bg-white/40 shadow-inner scrollbar-thin scrollbar-thumb-gray-200">
                      {feeHeads.filter(h => !h.isTuition && !h.isDiscount).map(head => {
                        const isChecked = (challanForm.selectedHeads || []).some(id => Number(id) === Number(head.id));
                        return (
                          <div key={head.id} className="flex items-center space-x-2 p-1 hover:bg-blue-50/50 rounded transition-colors group">
                            <input
                              type="checkbox"
                              className="accent-blue-600 h-3 w-3 cursor-pointer"
                              checked={isChecked}
                              onChange={(e) => {
                                let selected = [...(challanForm.selectedHeads || [])].map(id => Number(id));
                                if (e.target.checked) {
                                  if (!selected.includes(Number(head.id))) selected.push(Number(head.id));
                                } else {
                                  selected = selected.filter(id => id !== Number(head.id));
                                }
                                
                                const additionalSum = feeHeads
                                  .filter(h => selected.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                                  .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
                                
                                setChallanForm({
                                  ...challanForm,
                                  selectedHeads: selected,
                                  fineAmount: (additionalSum + (challanForm.isOtherEnabled ? parseFloat(challanForm.otherAmount || "0") : 0)).toString()
                                });
                              }}
                            />
                            <span className="text-[10px] items-center flex gap-1 truncate flex-1 font-medium">{head.name}</span>
                            <span className="text-[9px] text-muted-foreground italic">Rs. {head.amount.toLocaleString()}</span>
                          </div>
                        );
                      })}

                      {/* Other Charges Option */}
                      <div className="mt-1 pt-1 border-t border-blue-200">
                        <div className="flex items-center space-x-2 p-1 hover:bg-blue-50/50 rounded transition-colors group">
                          <input
                            type="checkbox"
                            id="otherChargeToggle"
                            className="accent-orange-600 h-3 w-3 cursor-pointer"
                            checked={challanForm.isOtherEnabled}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentHeadsSum = feeHeads
                                .filter(h => (challanForm.selectedHeads || []).includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                                .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
                              
                              setChallanForm({
                                ...challanForm,
                                isOtherEnabled: isChecked,
                                fineAmount: (currentHeadsSum + (isChecked ? parseFloat(challanForm.otherAmount || "0") : 0)).toString()
                              });
                            }}
                          />
                          <label htmlFor="otherChargeToggle" className="text-[10px] font-bold text-orange-700 cursor-pointer">Other(fine) (Manual Amount)</label>
                        </div>
                        {challanForm.isOtherEnabled && (
                          <div className="px-5 pb-1">
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-[9px] text-muted-foreground font-bold">Rs.</span>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Enter fine amount"
                                value={challanForm.otherAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const currentHeadsSum = feeHeads
                                    .filter(h => (challanForm.selectedHeads || []).includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                                    .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
                                  
                                  setChallanForm({
                                    ...challanForm,
                                    otherAmount: val,
                                    fineAmount: (currentHeadsSum + (parseFloat(val) || 0)).toString()
                                  });
                                }}
                                className="pl-7 h-7 text-[10px] font-bold"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">INTERNAL REMARKS</Label>
                  <Textarea
                    placeholder="Enter any internal notes or adjustments..."
                    value={challanForm.remarks}
                    onChange={(e) => setChallanForm({ ...challanForm, remarks: e.target.value })}
                    className="text-[11px] min-h-[40px] h-[40px] resize-none py-1.5 px-2 bg-white border-slate-200"
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

                    const isExtra = parseInt(challanForm.installmentNumber) === 0;

                    const tuitionTotal = !isExtra && targetInst ? targetInst.amount : (parseFloat(editingChallan?.amount || "0"));
                    const tuitionPaid = !isExtra && targetInst ? (targetInst.paidAmount || 0) : (parseFloat(editingChallan?.paidAmount || "0"));
                    const tuitionPending = !isExtra && targetInst ? (targetInst.pendingAmount || 0) : 0;
                    const tuitionRemaining = !isExtra && targetInst ? (targetInst.remainingAmount || 0) : 0;

                    const tuitionSelected = parseFloat(challanForm.amount || "0") || 0;

                    const arrears = isExtra ? 0 : (parseFloat(challanForm.arrearsAmount) || 0);
                    const arrearsLateFee = isExtra ? 0 : (challanForm.arrearsSelections || []).reduce((sum, a) => sum + a.lateFee, 0);

                    const selectedHeadIds = (challanForm.selectedHeads || []).map(id => Number(id));
                    const additionalSum = feeHeads
                      .filter(h => selectedHeadIds.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                      .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                    const currentChallanLateFee = editingChallan?.lateFeeFine || 0;
                    const grandTotal = tuitionSelected + arrears + (parseFloat(challanForm.fineAmount) || 0) + arrearsLateFee + currentChallanLateFee;

                    return (
                      <div className="space-y-1.5">
                        {parseInt(challanForm.installmentNumber) > 0 ? (
                          <>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                              <span>Inst. Overview</span>
                              <span className="text-orange-700">Total: Rs. {tuitionTotal.toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-center py-1">
                              <div className="flex flex-col border rounded bg-white p-1">
                                <span className="text-[8px] text-muted-foreground uppercase font-bold">PAID</span>
                                <span className="text-[10px] font-bold text-success">Rs. {tuitionPaid.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-orange-50 p-1 border-orange-100">
                                <span className="text-[8px] text-orange-600 uppercase font-bold">PENDING</span>
                                <span className="text-[10px] font-bold text-orange-700">Rs. {tuitionPending.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-blue-50 p-1 border-blue-100">
                                <span className="text-[8px] text-blue-600 uppercase font-bold">AVAILABLE</span>
                                <span className="text-[10px] font-bold text-blue-700">Rs. {tuitionRemaining.toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col border rounded bg-[#f05a28] p-1 border-[#d04a18] text-white">
                                <span className="text-[8px] uppercase font-bold opacity-80">THIS BILL</span>
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
                          {!isExtra && (
                            <div className="flex justify-between text-red-600">
                              <span className="font-semibold italic flex items-center gap-1"><History className="h-2.5 w-2.5" /> Arrears:</span>
                              <span className="font-bold">Rs. {arrears.toLocaleString()}</span>
                            </div>
                          )}
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

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setChallanOpen(false)} className="h-8 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSubmitChallan} disabled={updateChallanMutation.isPending} className="h-8 text-xs bg-[#f05a28] hover:bg-[#d04a18] text-white font-bold">
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
                  {programs.map(p => {
                    const dept = departments.find(d => d.id === p.departmentId);
                    return <SelectItem key={p.id} value={p.id.toString()}>{p.name} {dept ? `(${dept.name})` : ""}</SelectItem>;
                  })}
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
              <Label>Session</Label>
              <Select
                value={bulkPrintFilters.sessionId}
                onValueChange={(val) => setBulkPrintFilters({ ...bulkPrintFilters, sessionId: val })}
              >
                <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {academicSessions.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.isActive ? "(Current)" : ""}
                    </SelectItem>
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
              {/* Header Info: Dates & Status */}
              <div className="bg-slate-50 border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Challan Number</p>
                  <p className="text-sm font-mono font-bold text-primary">{selectedChallanDetails.challanNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Issue Date</p>
                  <p className="text-sm font-semibold">{format(new Date(selectedChallanDetails.issueDate || selectedChallanDetails.createdAt), "dd MMM yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Due Date</p>
                  <p className="text-sm font-semibold text-destructive">{format(new Date(selectedChallanDetails.dueDate), "dd MMM yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</p>
                  <Badge 
                    className="uppercase text-[10px]"
                    variant={selectedChallanDetails.status === "PAID" ? "default" : selectedChallanDetails.status === "VOID" ? "outline" : "destructive"}
                  >
                    {selectedChallanDetails.status === "VOID" ? "Superseded" : selectedChallanDetails.status}
                  </Badge>
                </div>
              </div>

              {/* VOID Challan Transparency Note */}
              {selectedChallanDetails.status === "VOID" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1 text-sm w-full">
                    <p className="font-semibold text-amber-800">This challan was superseded</p>
                    {selectedChallanDetails.supersededBy && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <span className="font-medium">{selectedChallanDetails.month || `Inst #${selectedChallanDetails.installmentNumber}`} (VOID)</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-bold">#{selectedChallanDetails.supersededBy.challanNumber} ({selectedChallanDetails.supersededBy.status})</span>
                      </div>
                    )}
                    {/* Settlement breakdown */}
                    {(() => {
                      const totalDue = (selectedChallanDetails.amount || 0) + (selectedChallanDetails.fineAmount || 0) + (selectedChallanDetails.lateFeeFine || 0) - (selectedChallanDetails.discount || 0);
                      const settled = selectedChallanDetails.settledAmount || 0;
                      const remaining = Math.max(0, totalDue - settled);
                      const fullySettled = settled >= totalDue - 0.01 && totalDue > 0;
                      return (
                        <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white rounded p-1.5 border border-amber-200">
                            <p className="text-amber-600 font-semibold">Total Due</p>
                            <p className="font-bold">PKR {formatAmount(totalDue)}</p>
                          </div>
                          <div className="bg-white rounded p-1.5 border border-green-200">
                            <p className="text-green-600 font-semibold">Settled</p>
                            <p className="font-bold text-green-700">PKR {formatAmount(settled)}</p>
                          </div>
                          <div className={`bg-white rounded p-1.5 border ${fullySettled ? 'border-green-200' : 'border-amber-200'}`}>
                            <p className={`font-semibold ${fullySettled ? 'text-green-600' : 'text-amber-600'}`}>Remaining</p>
                            <p className={`font-bold ${fullySettled ? 'text-green-700' : 'text-amber-700'}`}>
                              {fullySettled ? '✓ Settled' : `PKR ${formatAmount(remaining)}`}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    {(selectedChallanDetails.lateFeeFine || 0) > 0 && (
                      <p className="text-amber-700 text-xs">
                        Late fee of <span className="font-bold">PKR {formatAmount(selectedChallanDetails.lateFeeFine)}</span> is locked for audit trail.
                      </p>
                    )}
                    {selectedChallanDetails.remarks && (
                      <p className="text-[10px] text-amber-600 italic mt-1">{selectedChallanDetails.remarks}</p>
                    )}
                  </div>
                </div>
              )}

              {/* itemized Financial Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50/50 border-b py-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      Itemized Bill Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/30">
                          <TableHead className="text-[10px] uppercase font-bold py-2">Description</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold py-2 text-right">Amount (PKR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Tuition Component — hidden for fee-head-only extra challans */}
                        {selectedChallanDetails.challanType !== 'FEE_HEADS_ONLY' && (
                        <TableRow>
                          <TableCell className="py-2">
                            <span className="font-semibold text-slate-700">Tuition Fee</span>
                            <p className="text-[10px] text-muted-foreground italic">
                              {selectedChallanDetails.installmentNumber > 0 ? `Installment #${selectedChallanDetails.installmentNumber}` : 'Standard Charge'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-bold py-2">
                             {formatAmount((selectedChallanDetails.amount || 0))}
                          </TableCell>
                        </TableRow>
                        )}

                        {/* Arrears Component */}
                        {getRecursiveArrears(selectedChallanDetails) > 0 && (
                          <TableRow className="text-amber-700 bg-amber-50/20">
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1.5 font-semibold">
                                <History className="w-3 h-3" />
                                Previous Arrears
                              </div>
                              <p className="text-[10px] opacity-70">Accumulated from previous sessions/unpaid bills</p>
                            </TableCell>
                            <TableCell className="text-right font-bold py-2">
                              {formatAmount(getRecursiveArrears(selectedChallanDetails))}
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Dynamic Fee Heads */}
                        {(() => {
                           try {
                             const raw = (selectedChallanDetails.selectedHeads && typeof selectedChallanDetails.selectedHeads === 'string')
                               ? JSON.parse(selectedChallanDetails.selectedHeads)
                               : (selectedChallanDetails.selectedHeads || []);
                             
                             const activeHeads = Array.isArray(raw) ? raw.filter(h => 
                               (typeof h === 'object' && h !== null && h.isSelected && h.amount > 0) || 
                               (typeof h === 'number')
                             ) : [];

                             return activeHeads.map((item, idx) => {
                               let name = "Additional Head";
                               let amount = 0;
                               if (typeof item === 'object' && item !== null) {
                                  name = item.name;
                                  amount = item.amount;
                               } else {
                                  const head = (feeHeads || []).find(h => Number(h.id) === Number(item));
                                  if (head) { name = head.name; amount = parseFloat(head.amount) || 0; }
                               }
                               return (
                                 <TableRow key={idx}>
                                   <TableCell className="py-2 text-slate-600">{name}</TableCell>
                                   <TableCell className="text-right font-medium py-2">{formatAmount(amount)}</TableCell>
                                 </TableRow>
                               );
                             });
                           } catch (e) { return null; }
                        })()}

                        {/* Fines & Late Fees */}
                        {selectedChallanDetails.lateFeeFine > 0 && (
                          <TableRow className="text-destructive bg-destructive/5 font-medium">
                            <TableCell className="py-2">
                              {selectedChallanDetails.status === "VOID"
                                ? <span className="flex items-center gap-1.5">
                                    Late Fee Fine (Preserved)
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertCircle className="w-3 h-3 text-amber-500 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs text-xs">
                                        This late fee is preserved on the VOID challan for audit trail. The debt (including this late fee) has been rolled into the superseding challan.
                                      </TooltipContent>
                                    </Tooltip>
                                  </span>
                                : "Late Fee Fine (Calculated Overdue)"
                              }
                            </TableCell>
                            <TableCell className="text-right font-bold py-2">{formatAmount(selectedChallanDetails.lateFeeFine)}</TableCell>
                          </TableRow>
                        )}

                        {/* Discounts */}
                        {(selectedChallanDetails.discount || 0) > 0 && (
                          <TableRow className="text-green-600 bg-green-50/30">
                            <TableCell className="py-2 italic">Applied Scholarship / Discount</TableCell>
                            <TableCell className="text-right font-bold py-2">- {formatAmount(selectedChallanDetails.discount)}</TableCell>
                          </TableRow>
                        )}

                        {/* Final Net Total Row */}
                        <TableRow className="bg-primary/5 border-t-2 border-primary/20">
                          <TableCell className="py-3">
                            <span className="text-base font-black text-primary uppercase tracking-tight">Net Payable Amount</span>
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <span className="text-xl font-black text-primary">
                              PKR {formatAmount(
                                (selectedChallanDetails.amount || 0) + 
                                getSelectedHeadsTotal(selectedChallanDetails) + 
                                (selectedChallanDetails.lateFeeFine || 0) + 
                                getRecursiveArrears(selectedChallanDetails) - 
                                (selectedChallanDetails.discount || 0)
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Collection Summary Sidebar */}
                <div className="space-y-6">
                  <Card className="shadow-sm border-success/20 bg-success/5">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4" />
                         Collection Summary
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const isVoid = selectedChallanDetails.status === 'VOID';
                        // For VOID challans: total due is own amount only (no arrears — those belong to superseding challan)
                        // effective paid = settledAmount (allocated from superseding challan payment)
                        const totalDue = isVoid
                          ? Math.max(0, (selectedChallanDetails.amount || 0) + (selectedChallanDetails.fineAmount || 0) + (selectedChallanDetails.lateFeeFine || 0) - (selectedChallanDetails.discount || 0))
                          : Math.max(0, (selectedChallanDetails.amount || 0) + getSelectedHeadsTotal(selectedChallanDetails) + (selectedChallanDetails.lateFeeFine || 0) + getRecursiveArrears(selectedChallanDetails) - (selectedChallanDetails.discount || 0));
                        const effectivePaid = isVoid
                          ? (selectedChallanDetails.settledAmount || 0)
                          : (selectedChallanDetails.paidAmount || 0);
                        const remaining = Math.max(0, totalDue - effectivePaid);
                        return (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Total Billed</span>
                              <span className="text-sm font-bold">PKR {formatAmount(totalDue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{isVoid ? "Settled via Superseding" : "Amount Paid"}</span>
                              <span className="text-sm font-bold text-success">PKR {formatAmount(effectivePaid)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-800">Remaining Balance</span>
                              <span className={`text-base font-black ${remaining === 0 ? 'text-success' : 'text-destructive'}`}>
                                {remaining === 0 ? '✓ Fully Settled' : `PKR ${formatAmount(remaining)}`}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Payment Metadata */}
                  <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b">
                      <CardTitle className="text-[10px] font-bold uppercase text-slate-500">Metadata & Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg"><User className="w-4 h-4 text-slate-600" /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Student</p>
                          <p className="text-xs font-bold">{selectedChallanDetails.student?.fName} {selectedChallanDetails.student?.lName}</p>
                          <p className="text-[10px] text-muted-foreground">{selectedChallanDetails.student?.rollNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg"><Clock className="w-4 h-4 text-slate-600" /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Timeline</p>
                          <div className="text-[10px] font-medium space-y-0.5">
                            <p>Issued: {selectedChallanDetails.issueDate || selectedChallanDetails.createdAt ? format(new Date(selectedChallanDetails.issueDate || selectedChallanDetails.createdAt), "dd MMM yyyy") : "N/A"}</p>
                            <p>Due: <span className="text-destructive font-bold">{selectedChallanDetails.dueDate ? format(new Date(selectedChallanDetails.dueDate), "dd MMM yyyy") : "N/A"}</span></p>
                            {selectedChallanDetails.paidDate && <p>Paid: <span className="text-success font-bold">{format(new Date(selectedChallanDetails.paidDate), "dd MMM yyyy")}</span></p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Enhanced Payment Breakdown Section */}
              {(() => {
                const history = typeof selectedChallanDetails.paymentHistory === 'string'
                  ? JSON.parse(selectedChallanDetails.paymentHistory)
                  : (selectedChallanDetails.paymentHistory || []);

                if (!Array.isArray(history) || history.length === 0) return null;

                return (
                  <Card className="shadow-soft border-primary/10 overflow-hidden">
                    <CardHeader className="pb-2 bg-primary/5">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <History className="w-3.5 h-3.5" />
                        Detailed Payment Breakdown (History)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow className="h-8">
                            <TableHead className="text-[10px] uppercase h-8">Date</TableHead>
                            <TableHead className="text-[10px] uppercase h-8">Amount</TableHead>
                            <TableHead className="text-[10px] uppercase h-8">Discount</TableHead>
                            <TableHead className="text-[10px] uppercase h-8">Method</TableHead>
                            <TableHead className="text-[10px] uppercase h-8">Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((entry, idx) => (
                            <TableRow key={idx} className="h-9 hover:bg-muted/20">
                              <TableCell className="text-xs py-1">{new Date(entry.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-xs font-bold text-success py-1">PKR {Math.round(entry.amount).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-bold text-orange-600 py-1">PKR {Math.round(entry.discount || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-xs py-1">{entry.method || 'Cash'}</TableCell>
                              <TableCell className="text-[10px] italic py-1 text-muted-foreground">{entry.remarks || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })()}

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
          setBulkDueDate(null);
          setBulkStudents([]);
          setSelectedBulkStudents([]);
          setGenerationErrors({});
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

              <div className="space-y-3">
                <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Select Month</Label>
                    <Select
                      value={generateForm.month}
                      onValueChange={(val) => {
                        setGenerateForm(prev => {
                          const newState = { ...prev, month: val };
                          if (!sessionManuallySet.current) {
                            // Find session that covers this month or use active one
                            const date = new Date(val);
                            const matchingSession = academicSessions.find(s => {
                              const start = new Date(s.startDate);
                              const end = new Date(s.endDate);
                              return date >= start && date <= end;
                            });
                            if (matchingSession) {
                              newState.sessionId = matchingSession.id.toString();
                            } else {
                              newState.sessionId = activeSessionId;
                            }
                          }
                          return newState;
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((monthName, index) => {
                          const monthNum = (index + 1).toString().padStart(2, '0');
                          const currentYear = new Date().getFullYear();
                          const monthValue = `${currentYear}-${monthNum}`;
                          return (
                            <SelectItem key={monthValue} value={monthValue}>
                              {monthName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Session</Label>
                    <Select
                      value={generateForm.sessionId}
                      onValueChange={(v) => {
                        sessionManuallySet.current = true;
                        setGenerateForm(prev => ({ ...prev, sessionId: v }));
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        {academicSessions.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name} {s.isActive ? "(Current)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Program (Optional)</Label>
                    <Select
                      value={generateForm.programId}
                      onValueChange={(v) => {
                        setGenerateForm(prev => {
                          const newState = { ...prev, programId: v, classId: "", sectionId: "" };
                          if (!sessionManuallySet.current && newState.month) {
                            const date = new Date(newState.month);
                            const matchingSession = academicSessions.find(s => {
                              const start = new Date(s.startDate);
                              const end = new Date(s.endDate);
                              return date >= start && date <= end;
                            });
                            if (matchingSession) {
                              newState.sessionId = matchingSession.id.toString();
                            } else {
                              newState.sessionId = activeSessionId;
                            }
                          }
                          return newState;
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Programs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map(p => {
                          const dept = departments.find(d => d.id === p.departmentId);
                          return <SelectItem key={p.id} value={p.id.toString()}>{p.name} {dept ? `(${dept.name})` : ""}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                                  const [,selMonth]=generateForm.month.split('-').map(Number);
                                  const mn=['January','February','March','April','May','June','July','August','September','October','November','December'];
                                  const mMatch=(mn[selMonth-1]||'').toLowerCase();
                                  setSelectedBulkStudents(bulkStudents.filter(student=>{
                                    const insts=(student.feeInstallments||[]).sort((a,b)=>a.installmentNumber-b.installmentNumber);
                                    const ci=insts.find(i=>(i.month||'').toLowerCase()===mMatch&&(!generateForm.sessionId||generateForm.sessionId==='all'||String(i.sessionId)===generateForm.sessionId));
                                    if(!ci)return false;
                                    if((ci.pendingAmount||0)>0||(ci.paidAmount||0)>0)return false;
                                    const tnum=ci.installmentNumber||0;
                                    const rank=(cls)=>cls?(Number(cls.year||0)*100+Number(cls.semester||0)):0;
                                    return!insts.some(i=>{const before=i.classId===ci.classId?i.installmentNumber<tnum:rank(i.class)<rank(ci.class);return before&&(i.pendingAmount||0)===0&&(i.paidAmount||0)===0;});
                                  }).map(s=>s.id));
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
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Late Fee</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Arrears</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold p-2 text-right">Total Due</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                const mNameMatch = monthNames[selMonth - 1];
                                const selectedSessionName = generateForm.sessionId && generateForm.sessionId !== 'all'
                                  ? (academicSessions.find(s => s.id.toString() === generateForm.sessionId)?.name || '')
                                  : '';

                                const filteredRows = bulkStudents.filter(student => {
                                  const studentInsts = (student.feeInstallments || []);
                                  return studentInsts.some(inst => {
                                    const instMonthStr = (inst.month || "").trim().toLowerCase();
                                    const nameMatches = instMonthStr === mNameMatch.toLowerCase();
                                    if (generateForm.sessionId && generateForm.sessionId !== "all") {
                                      const byId = inst.sessionId?.toString() === generateForm.sessionId;
                                      const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
                                      return nameMatches && (byId || byName);
                                    }
                                    return nameMatches;
                                  });
                                });

                                if (filteredRows.length === 0) {
                                  return (
                                    <TableRow>
                                      <TableCell colSpan={6} className="py-8 text-center text-red-500 font-medium italic">
                                        No installment plan found for {mNameMatch} {selYear} / {generateForm.sessionId !== 'all' ? (academicSessions.find(as => as.id.toString() === generateForm.sessionId)?.name || 'selected session') : 'any session'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                }

                                return filteredRows.map((student) => {
                                  const studentInsts = (student.feeInstallments || []).sort((a,b) => a.installmentNumber - b.installmentNumber);
                                  const currentInst = studentInsts.find(inst => {
                                    const instMonthStr = (inst.month || "").trim().toLowerCase();
                                    const nameMatches = instMonthStr === mNameMatch.toLowerCase();
                                    if (generateForm.sessionId && generateForm.sessionId !== "all") {
                                      const byId = inst.sessionId?.toString() === generateForm.sessionId;
                                      const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
                                      return nameMatches && (byId || byName);
                                    }
                                    return nameMatches;
                                  });
                                  
                                  const getClassRank = (cls) => {
                                    if (!cls) return 0;
                                    return (Number(cls.year || 0) * 100) + (Number(cls.semester || 0));
                                  };

                                  const getChronoRank = (inst) => {
                                    if (!inst || !inst.dueDate) return 0;
                                    const classRank = getClassRank(inst.class);
                                    // Combine Class Order (Year/Semester) with Due Date Time
                                    // Class is the primary sort, Time is the secondary sort.
                                    return (classRank * 1e14) + new Date(inst.dueDate).getTime();
                                  };

                                  const targetRank = getChronoRank(currentInst) || 0;
                                  const targetClassRank = getClassRank(currentInst?.class);
                                  const targetInstNum = currentInst?.installmentNumber || 0;
                                  const studentLateFee = student.lateFeeFine || lateFeeFine || 0;
                                  const installmentLateFee = currentInst?.lateFeeAccrued || 0;
                                  const recurringHeadsAmt = (student.feeStructure?.feeHeads || [])
                                    .filter(sh => !sh.feeHead?.isTuition && !sh.feeHead?.isDiscount)
                                    .reduce((sum, sh) => sum + (sh.amount || 0), 0);
                                  
                                  const getArrearsBreakdown = () => {
                                    if (!student) return { total: 0, tuition: 0, heads: 0, lateFees: 0 };

                                    // Recursive helper: walk previousChallans chain summing all non-PAID balances
                                    const sumChain = (challan) => {
                                      if (!challan) return 0;
                                      const ownBal = challan.status !== 'PAID'
                                        ? Math.max(0, (challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.paidAmount || 0) - (challan.discount || 0))
                                        : 0;
                                      const chainBal = Array.isArray(challan.previousChallans)
                                        ? challan.previousChallans.reduce((s, p) => p.status !== 'PAID' ? s + sumChain(p) : s, 0)
                                        : 0;
                                      return ownBal + chainBal;
                                    };
                                    
                                    // 1. From past challans — walk full chain
                                    // Exclude extra/fee-heads-only challans (not tied to installments)
                                    const pastChallans = (student.challans || []).filter(pc => {
                                      if (pc.challanType === 'FEE_HEADS_ONLY' || pc.installmentNumber === 0) return false;
                                      const pcRank = getChronoRank({ 
                                        installmentNumber: pc.installmentNumber, 
                                        dueDate: pc.dueDate,
                                        class: student.feeInstallments?.find(i => i.classId === pc.studentClassId)?.class || student.class 
                                      });
                                      return pcRank < targetRank;
                                    });

                                    let cRemaining = 0;
                                    const coveredInstIds = new Set();
                                    const coveredInstNums = new Set();

                                    pastChallans.forEach(pc => {
                                      cRemaining += sumChain(pc);
                                      if (pc.studentFeeInstallmentId) coveredInstIds.add(pc.studentFeeInstallmentId);
                                      if (pc.installmentNumber) coveredInstNums.add(pc.installmentNumber);
                                    });

                                    // 2. From Unbilled Past Installments (no challan ever generated)
                                    const unbilledPast = (student.feeInstallments || []).filter(inst => {
                                      const iClassRank = getClassRank(inst.class);
                                      let isBefore = false;
                                      if (currentInst && inst.classId === currentInst.classId) {
                                        isBefore = inst.installmentNumber < targetInstNum;
                                      } else {
                                        isBefore = iClassRank < targetClassRank;
                                      }
                                      if (coveredInstIds.has(inst.id) || coveredInstNums.has(inst.installmentNumber)) return false;
                                      if ((inst.pendingAmount || 0) > 0) return false;
                                      return isBefore && (inst.amount - (inst.paidAmount || 0)) > 0;
                                    });

                                    let uTuition = 0;
                                    let uLateFees = 0;
                                    let uHeads = 0;
                                    unbilledPast.forEach(inst => {
                                      uTuition += (inst.amount - (inst.paidAmount || 0));
                                      // Prefer stored incremental lateFeeAccrued if available, else calculate dynamically
                                      uLateFees += (inst.lateFeeAccrued != null ? inst.lateFeeAccrued : calculateLateFee(inst.dueDate, studentLateFee));
                                      uHeads += recurringHeadsAmt;
                                    });

                                    // 3. Session Arrears
                                    const granularClassIds = new Set((student.feeInstallments || []).map(i => i.classId));
                                    const filteredSessionArrears = (student.studentArrears || []).filter(sa => !granularClassIds.has(sa.classId));
                                    const sTotal = filteredSessionArrears.reduce((sum, sa) => sum + sa.arrearAmount, 0);

                                    // lateFees: only from non-PAID past challans (PAID challans have no outstanding late fee)
                                    const lateFees = pastChallans
                                      .filter(pc => pc.status !== 'PAID')
                                      .reduce((s, pc) => s + (pc.lateFeeFine || 0), 0) + uLateFees;

                                    // VOID predecessor breakdown for transparency (Task 4.3)
                                    const voidPredecessors = pastChallans
                                      .filter(pc => pc.status === 'VOID')
                                      .map(pc => ({
                                        month: pc.month || `Inst #${pc.installmentNumber}`,
                                        tuition: Math.max(0, (pc.amount || 0) - (pc.paidAmount || 0) - (pc.discount || 0)),
                                        lateFee: pc.lateFeeFine || 0,
                                        challanNumber: pc.challanNumber,
                                      }))
                                      .filter(p => p.tuition > 0 || p.lateFee > 0);

                                    return {
                                      total: cRemaining + uTuition + uLateFees + uHeads + sTotal,
                                      lateFees,
                                      tuition: uTuition,
                                      heads: uHeads,
                                      session: sTotal,
                                      voidPredecessors,
                                    };
                                  };

                                  const brk = getArrearsBreakdown();
                                  const arrearsAmount = brk.total;
                                  const unpaidInstAmt = currentInst ? (currentInst.amount - (currentInst.paidAmount || 0)) : 0;
                                  const isSelected = selectedBulkStudents.includes(student.id);
                                  
                                  const prevInsts = (student.feeInstallments || [])
                                     .filter(inst => !!inst.dueDate)
                                     .filter(inst => {
                                       if (!currentInst) return false;
                                       const iClassRank = getClassRank(inst.class);
                                       if (inst.classId === currentInst.classId) {
                                          return inst.installmentNumber < targetInstNum;
                                       } else {
                                          return iClassRank < targetClassRank;
                                       }
                                     }).sort((a,b) => getChronoRank(a) - getChronoRank(b));

                                  const missingPrev = prevInsts.filter(inst => {
                                    // Treat as billed if: has paidAmount, has pendingAmount, is PAID status,
                                    // OR has pendingAmount=0 and remainingAmount=0 (superseded via VOID chain)
                                    const isBilledStatus = (inst.paidAmount || 0) > 0 || 
                                      (inst.pendingAmount || 0) > 0 || 
                                      ['PAID', 'PARTIAL', 'ISSUED', 'UNPAID', 'SUCCESS', 'CREATED'].includes(inst.status) ||
                                      ((inst.remainingAmount || 0) === 0 && inst.amount > 0);
                                    return !isBilledStatus;
                                  });
                                  
                                  // isGenerated: installment already has an active (non-VOID) challan, or is fully paid
                                  const hasActiveChallan = (student.challans || []).some(c =>
                                    c.studentFeeInstallmentId === currentInst?.id
                                  );
                                  // pendingAmount > 0 but remainingAmount = 0 means it was billed and superseded (VOID chain)
                                  const isSuperseded = currentInst && (currentInst.pendingAmount || 0) > 0 && (currentInst.remainingAmount || 0) === 0 && !hasActiveChallan;
                                  const isGenerated = currentInst && !isSuperseded && (
                                    (currentInst.paidAmount || 0) >= currentInst.amount ||
                                    ['PAID'].includes(currentInst.status) ||
                                    hasActiveChallan
                                  );
                                  const hasMissing = missingPrev.length > 0;

                                  return (
                                    <TableRow key={student.id} className={cn(
                                      "hover:bg-orange-50/50 border-b border-muted/20 h-10 transition-colors", 
                                      isSelected && "bg-orange-50/10", 
                                      generationErrors[student.id] ? "bg-red-50/10" : ""
                                    )}>
                                      <TableCell className="p-0 text-center">
                                        <input
                                          type="checkbox"
                                          className="h-3.5 w-3.5 accent-orange-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                          checked={isSelected}
                                          disabled={hasMissing || currentInst?.status === 'PAID' || isGenerated}
                                          onChange={(e) => {
                                            if (e.target.checked && !(hasMissing || isGenerated)) {
                                              setSelectedBulkStudents([...selectedBulkStudents, student.id]);
                                            } else {
                                              setSelectedBulkStudents(selectedBulkStudents.filter(id => id !== student.id));
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="p-2">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                              <span className={cn("text-xs font-bold", (generationErrors[student.id] || hasMissing) && "text-red-600")}>
                                                {student.fName} {student.lName || ""}
                                              </span>
                                              {hasMissing && (
                                                <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-bold uppercase tracking-tight">
                                                  Missing Prev.
                                                </Badge>
                                              )}
                                            </div>
                                            {hasMissing && (
                                              <div className="text-[9px] font-bold text-red-500 italic mt-0.5 whitespace-nowrap">
                                                {missingPrev.map(m => `${m.month} ${m.session || ""}`).join(", ")} missing
                                              </div>
                                            )}
                                            <span className="text-[9px] text-muted-foreground uppercase">{student.rollNumber}</span>
                                            {generationErrors[student.id] && (
                                              <span className="text-[10px] font-bold text-red-500 italic mt-0.5 animate-pulse">
                                                {generationErrors[student.id]}
                                              </span>
                                            )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-right font-medium whitespace-nowrap">
                                        Rs. {(currentInst ? (currentInst.amount + (recurringHeadsAmt || 0)) : 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-right font-medium whitespace-nowrap text-orange-600">
                                        Rs. {(installmentLateFee || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-right text-red-600 font-medium whitespace-nowrap">
                                        <div>Rs. {arrearsAmount.toLocaleString()}</div>
                                        {brk.lateFees > 0 && (
                                          <div className="text-[10px] text-red-400 font-normal">
                                            incl. Late Fee: {brk.lateFees.toLocaleString()}
                                          </div>
                                        )}
                                        {brk.voidPredecessors && brk.voidPredecessors.length > 0 && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center justify-end gap-0.5 text-[9px] text-amber-600 cursor-help mt-0.5">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                <span>{brk.voidPredecessors.length} VOID</span>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs text-xs" side="left">
                                              <p className="font-semibold mb-1.5">Arrears Breakdown (VOID Predecessors)</p>
                                              <div className="space-y-1">
                                                {brk.voidPredecessors.map((vp, vi) => (
                                                  <div key={vi} className="flex justify-between gap-3 text-[10px]">
                                                    <span className="text-slate-300">{vp.month}</span>
                                                    <span>
                                                      {vp.tuition > 0 && <span>{vp.tuition.toLocaleString()}</span>}
                                                      {vp.lateFee > 0 && <span className="text-amber-300"> + Late Fee: {vp.lateFee.toLocaleString()}</span>}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                              <p className="mt-1.5 text-[9px] text-slate-400 italic">Total: PKR {arrearsAmount.toLocaleString()}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-xs p-2 text-right font-black text-orange-700 whitespace-nowrap">
                                        Rs. {(unpaidInstAmt + (recurringHeadsAmt || 0) + (installmentLateFee || 0) + arrearsAmount).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              })()}
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
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t bg-muted/10 -mx-3 -mb-3 p-3">
                <Button variant="outline" onClick={() => {
                  setGenerateDialogOpen(false);
                }}>Cancel</Button>
                <Button
                  onClick={() => {
                    setIsGenerating(true);
                    generateChallansMutation.mutate({
                      month: generateForm.month,
                      sessionId: generateForm.sessionId !== "all" ? generateForm.sessionId : "",
                      studentIds: selectedBulkStudents,
                      excludedArrearsStudentIds: [],
                      programId: generateForm.programId !== "all" && selectedBulkStudents.length === 0 ? generateForm.programId : "",
                      classId: generateForm.classId !== "all" && selectedBulkStudents.length === 0 ? generateForm.classId : "",
                      sectionId: generateForm.sectionId !== "all" && selectedBulkStudents.length === 0 ? generateForm.sectionId : "",
                      dueDate: bulkDueDate ? format(bulkDueDate, "yyyy-MM-dd") : undefined
                    });
                  }}
                  disabled={isGenerating || selectedBulkStudents.length === 0}
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
                              if (defaultChallanTemplate) {
                                const finalHtml = generateChallanHtml(c, defaultChallanTemplate.htmlContent);
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
                          variant={res.status === 'CREATED' ? 'default' : (res.status === 'PREVIOUS_UNGENERATED' ? 'destructive' : 'secondary')} 
                          className="text-[10px] h-5"
                        >
                          {res.status === 'CREATED' ? `Success: ${res.challanNumber}` : (res.status === 'PREVIOUS_UNGENERATED' ? (res.reason || 'Prev. Ungenerated') : res.reason || res.status)}
                        </Badge>


                        {(res.status === 'CREATED' || (res.status === 'SKIPPED' && res.challan)) && res.challan && (
                          <div className="flex items-center gap-1">
                            {res.status === 'SKIPPED' && <span className="text-[9px] text-muted-foreground italic">(Existing)</span>}
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => {
                                    if (defaultChallanTemplate) {
                                      const finalHtml = generateChallanHtml(res.challan, defaultChallanTemplate.htmlContent);
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
                              </TooltipTrigger>
                              <TooltipContent>Print Challan</TooltipContent>
                            </Tooltip>
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
      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction History - {selectedChallanForHistory?.challanNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (!selectedChallanForHistory?.paymentHistory) return <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transaction history found.</TableCell></TableRow>;
                    const history = typeof selectedChallanForHistory.paymentHistory === 'string' 
                      ? JSON.parse(selectedChallanForHistory.paymentHistory) 
                      : selectedChallanForHistory.paymentHistory;
                    
                    if (!Array.isArray(history) || history.length === 0) return <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transaction history found.</TableCell></TableRow>;
                    
                    return history.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-success">PKR {formatAmount(entry.amount)}</TableCell>
                        <TableCell className="font-bold text-orange-600">PKR {formatAmount(entry.discount || 0)}</TableCell>
                        <TableCell className="text-xs">{entry.method || 'Cash'}</TableCell>
                        <TableCell className="text-xs italic">{entry.remarks || '-'}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </DashboardLayout>;
};

export default FeeManagement;

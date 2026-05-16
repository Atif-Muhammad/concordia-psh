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
import { DollarSign, Plus, Minus, CheckCircle2, Edit, Trash2, Receipt, TrendingUp, Layers, Printer, Eye, History, Calendar as CalendarIcon, ArrowRight, PlusCircle, MinusCircle, User, AlertCircle, Clock, Lock, Info, SlidersHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  createFeeHead, getFeeHeads, updateFeeHead, deleteFeeHead,
  createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
  getPrograms, getClasses, getStudents, getDepartmentNames,
  getFeeChallans, getBulkChallans, updateFeeChallan, getStudentFeeHistory,
  searchStudents, getRevenueOverTime, getClassCollectionStats, getFeeCollectionSummary, getDefaultFeeChallanTemplate, getFeeChallanTemplates,
  getInstallmentPlans, generateChallansFromPlan,
  getInstituteSettings, updateInstituteSettings,
  getAcademicSessions,
  deleteFeeChallan,
  getHostelRegistrationByStudent,
  getHostelFeePayments,
  // New fee management redesign APIs
  bulkGenerateChallans,
  recordFeePayment,
  recordExtraFeePayment,
  generateExtraChallan,
  bulkGenerateExtraChallans,
  updateInstallment,
  getNewFeeReportSummary,
  getNewRevenueOverTime,
  getNewClassStats,
  getNewFeeReportsAnalytics,
  getNewFeeSettings,
  updateNewFeeSettings,
  getStudentInstallments,
  printFeeInstallmentChallan,
  getExtraChallansDedicated,
  updateExtraChallanDedicated,
  deleteExtraChallanDedicated,
  printExtraChallan
} from "../../config/apis";
import { computeOutstandingBalance } from "@/lib/hostelUtils";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModernTooltip } from "@/components/ui/modern-charts";
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
  const [challanFilter, setChallanFilter] = useState([]);
  const [challanSessionFilter, setChallanSessionFilter] = useState("all");
  const [selectedInstallment, setSelectedInstallment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [challanOpen, setChallanOpen] = useState(false);
  const [feeHeadOpen, setFeeHeadOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
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
  const [extraCustomHeads, setExtraCustomHeads] = useState([]); // [{ name, amount }]
  const [bulkExtraChallanOpen, setBulkExtraChallanOpen] = useState(false);
  const [selectedBulkExtraStudents, setSelectedBulkExtraStudents] = useState([]);
  const sessionManuallySet = useRef(false);

  // Helper to extract year gap from program duration (e.g., "4 years" -> 4)
  // Helper to get status color classes for badges/labels
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-success/10 text-success border-success/20';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'OVERDUE':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'VOID':
      case 'SUPERSEDED':
      case 'SETTLED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getBadgeColor = (status) => {
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

  /**
   * Normalize a FeeInstallmentChallan (new schema, fee_challan_v2) into the
   * legacy FeeChallan shape that all display/print/payment code expects.
   */
  const normalizeChallan = (c) => {
    if (!c || c._normalized) return c;
    const inst = c.installment || {};
    const student = inst.student || c.student || null;
    return {
      ...c,
      _normalized: true,
      student,
      studentId: student?.id ?? c.studentId,
      month: inst.month ?? c.month ?? null,
      installmentNumber: c.installmentNo ?? inst.installmentNumber ?? c.installmentNumber ?? 0,
      session: null,
      dueDate: inst.dueDate ?? c.dueDate ?? null,
      issueDate: c.generatedDate ?? c.issueDate ?? null,
      paidDate: c.paidAt ?? c.paidDate ?? null,
      studentClass: inst.class ?? student?.class ?? c.studentClass ?? null,
      studentProgram: inst.student?.program ?? student?.program ?? c.studentProgram ?? null,
      studentSection: inst.student?.section ?? student?.section ?? c.studentSection ?? null,
      fatherName: student?.fatherOrguardian ?? '',
      amount: Number(c.snapshotBaseAmount ?? c.amount ?? 0),
      // paidAmount = total received on this challan (includes advance credits).
      // For SUPERSEDED/SETTLED, use the installment's paidAmount (debt was absorbed by leading challan).
      paidAmount: (c.status === 'SUPERSEDED' || c.status === 'SETTLED')
        ? Number(inst.paidAmount ?? c.paidAmount ?? 0)
        : Number(c.amountReceived ?? c.paidAmount ?? 0),
      totalAmount: Number(c.snapshotTotalDue ?? c.totalAmount ?? 0),
      lateFeeFine: Number(c.snapshotLateFee ?? c.lateFeeFine ?? 0),
      fineAmount: 0,
      discount: 0,
      remainingAmount: Number(c.snapshotTotalDue ?? 0) - Number(c.amountReceived ?? 0),
      selectedHeads: c.heads ?? c.selectedHeads ?? null,
      status: c.status === 'SUPERSEDED' ? 'SUPERSEDED' : c.status === 'SETTLED' ? 'SETTLED' : (c.status ?? 'PENDING'),
      coveredInstallments: null,
      challanType: c.type === 'EXTRA' ? 'FEE_HEADS_ONLY' : 'INSTALLMENT',
      // Preserve backend chain relations when present; required for stable arrears display.
      previousChallans: Array.isArray(c.previousChallans) ? c.previousChallans : [],
      supersedes: Array.isArray(c.supersedes) ? c.supersedes : [],
      supersededBy: null,
      settledAmount: Number(c.settledAmount ?? 0),
      paymentHistory: null,
      feeStructure: null,
    };
  };

  // @deprecated — Use installment.totalAmount (from FeeInstallment) for new data.
  // Still used by legacy challan display and payment dialogs that read from the old FeeChallan schema.
  // Sum of additional fee heads from selectedHeads JSON (NOT fineAmount)
  const getSelectedHeadsTotal = (challan) => {
    if (!challan) return 0;

    // New schema: challanHeads snapshot from backend
    if (challan.challanHeads && Array.isArray(challan.challanHeads) && challan.challanHeads.length > 0) {
      return challan.challanHeads.reduce((sum, h) => sum + Math.max(0, Number(h.amount || 0)), 0);
    }
    
    // Support for ExtraChallan relation
    if (challan.heads && Array.isArray(challan.heads) && !challan.installmentNumber) {
      return challan.heads.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
    }

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

  // @deprecated — Arrears are now stored on FeeInstallment.arrears (backend-computed).
  // Still used by legacy challan display that reads from the old FeeChallan schema.
  const getRecursiveArrears = (challan) => {
    if (!challan || !challan.previousChallans || !Array.isArray(challan.previousChallans) || challan.installmentNumber === 0) return 0;
    
    // Sum up the remaining balance of all linked previous challans recursively.
    // PAID ancestors: their chain is fully settled — stop recursion there.
    // VOID ancestors: real unpaid debt superseded into this chain — include them.
    return challan.previousChallans.reduce((total, prev) => {
      if (prev.status === 'PAID') return total; // settled — stop here
      // Use getSelectedHeadsTotal for additional heads (fineAmount is 0 for installment challans;
      // actual heads are stored in selectedHeads JSON). Also recurse into prev's own chain.
      const prevHeads = getSelectedHeadsTotal(prev);
      const rem = Math.max(0, 
        (prev.amount || 0) + 
        prevHeads + 
        (prev.lateFeeFine || 0) - 
        (prev.paidAmount || 0) - 
        (prev.settledAmount || 0) -
        (prev.discount || 0)
      );
      return total + rem + getRecursiveArrears(prev);
    }, 0);
  };

  // @deprecated — Superseded arrears are now handled server-side via FeeInstallment.arrears.
  // Still used by legacy challan display that reads from the old FeeChallan schema.
  // Sum remaining amounts from VOID'd challans that this challan supersedes (recursively)
  // Only counts challans NOT already covered by the previousChallans (ArrearsChain) relation
  const getSupersededArrears = (challan) => {
    if (!challan || !challan.supersedes || !Array.isArray(challan.supersedes)) return 0;
    // Build set of IDs already counted via previousChallans to avoid double-counting
    const prevIds = new Set((challan.previousChallans || []).map(p => p.id));
    return challan.supersedes.reduce((total, prev) => {
      if (prev.status === 'VOID' && !prevIds.has(prev.id)) {
        const grossDue = Math.max(0,
          (prev.amount || 0) +
          getSelectedHeadsTotal(prev) +
          (prev.fineAmount || 0) +
          (prev.lateFeeFine || 0) -
          (prev.discount || 0)
        );
        const paidOrSettled = Math.max(0, (prev.paidAmount || 0) + (prev.settledAmount || 0));
        const remainingDue = Math.max(0, grossDue - paidOrSettled);
        return total + remainingDue + getSupersededArrears(prev);
      }
      return total;
    }, 0);
  };

  // @deprecated — Use FeeInstallment.arrears (backend-computed) for new data.
  // Still used by legacy challan display that reads from the old FeeChallan schema.
  // Combined arrears: chain-linked (previousChallans) + superseded (supersedes)
  const getTotalArrears = (challan) => {
    return getRecursiveArrears(challan) + getSupersededArrears(challan);
  };

  // @deprecated — For new FeeInstallmentChallan data, use challan.snapshotTotalDue instead.
  // Still used by legacy challan display that reads from the old FeeChallan schema.
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

  // Pre-select active session for challan filter once sessions load
  const challanSessionInitialized = useRef(false);
  useEffect(() => {
    if (!challanSessionInitialized.current && academicSessions.length > 0) {
      const active = academicSessions.find(s => s.isActive);
      if (active) {
        setChallanSessionFilter(active.id.toString());
        challanSessionInitialized.current = true;
      }
    }
  }, [academicSessions]);

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
      if (!generateDialogOpen && !bulkExtraChallanOpen) return;
      
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

        // Only au students that have a matching installment for the selected month
        const [selY, sm] = generateForm.month.split('-').map(Number);
        const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const mName = (monthNames[sm - 1] || '').toLowerCase();
        const selectedSessionName = generateForm.sessionId && generateForm.sessionId !== 'all'
          ? (academicSessions.find(s => s.id.toString() === generateForm.sessionId)?.name || '')
          : '';

        const getClassRankElig = (cls) => !cls ? 0 : (Number(cls.year || 0) * 100) + Number(cls.semester || 0);
        const getChronoRankElig = (inst) => {
          if (!inst?.dueDate) return 0;
          return (getClassRankElig(inst.class) * 1e14) + new Date(inst.dueDate).getTime();
        };

        const eligible = filtered.filter(s => {
          // Must have a matching installment for the selected month
          const hasMatchingInst = (s.feeInstallments || []).some(inst => {
            const nameMatch = (inst.month || '').trim().toLowerCase() === mName;
            const yearMatch = inst.dueDate ? new Date(inst.dueDate).getFullYear() === selY : true;
            if (generateForm.sessionId && generateForm.sessionId !== 'all') {
              const byId = inst.sessionId?.toString() === generateForm.sessionId;
              const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
              return nameMatch && yearMatch && (byId || byName);
            }
            return nameMatch && yearMatch;
          });
          if (!hasMatchingInst) return false;

          // Exclude students with missing previous installments (same logic as hasMissing in the table)
          const currentInst = (s.feeInstallments || []).find(inst => {
            const nameMatch = (inst.month || '').trim().toLowerCase() === mName;
            const yearMatch = inst.dueDate ? new Date(inst.dueDate).getFullYear() === selY : true;
            if (generateForm.sessionId && generateForm.sessionId !== 'all') {
              const byId = inst.sessionId?.toString() === generateForm.sessionId;
              const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
              return nameMatch && yearMatch && (byId || byName);
            }
            return nameMatch && yearMatch;
          });
          if (!currentInst) return false;

          const targetRank = getChronoRankElig(currentInst);
          const targetClassRank = getClassRankElig(currentInst.class);
          const targetInstNum = currentInst.installmentNumber || 0;

          const prevInsts = (s.feeInstallments || []).filter(inst => {
            if (!inst.dueDate) return false;
            const iClassRank = getClassRankElig(inst.class);
            if (inst.classId === currentInst.classId) return inst.installmentNumber < targetInstNum;
            return iClassRank < targetClassRank;
          });

          // Calculate hasMissingPrev using challans from new schema (fee_challan_v2)
          const hasMissingPrev = prevInsts.some(inst =>
            (inst.challans || []).some(c => c.status !== 'PAID')
          );

          // Requirement 11.2: if a challan is already settled, paid, or generated... uncheck/exclude
          const isBilledOrPaid = ['PAID', 'SETTLED'].includes(currentInst.status) ||
                                (currentInst.challanGenerated === true) ||
                                (Number(currentInst.pendingAmount || 0) <= 0 && Number(currentInst.paidAmount || 0) > 0);

          return !hasMissingPrev && !isBilledOrPaid;
        });
        setSelectedBulkStudents(eligible.map(s => s.id));

        // Au due date from the first available installment matching the month
        if (filtered.length > 0 && generateForm.month) {
          const [selYear, selMonth] = generateForm.month.split('-').map(Number);
          const mName = new Date(selYear, selMonth - 1, 1).toLocaleString('default', { month: 'long' });
          const mSession = (selMonth >= 4) ? `${selYear}-${selYear + 1}` : `${selYear - 1}-${selYear}`;

          const firstWithInst = filtered.find(s => 
            (s.feeInstallments || []).some(inst => 
              (inst.month === mName && (inst.session === mSession || !inst.session) && (inst.dueDate ? new Date(inst.dueDate).getFullYear() === selYear : true)) || inst.month === generateForm.month
            )
          );

          if (firstWithInst) {
            const matchingInst = firstWithInst.feeInstallments.find(inst =>
              (inst.month === mName && (inst.session === mSession || !inst.session) && (inst.dueDate ? new Date(inst.dueDate).getFullYear() === selYear : true)) || inst.month === generateForm.month
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
  }, [generateDialogOpen, bulkExtraChallanOpen, generateForm.month, generateForm.sessionId, generateForm.programId, generateForm.classId, generateForm.sectionId]);

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

  // New fee management redesign: lateFeeRatePerDay from /fee/settings
  const [lateFeeRatePerDay, setLateFeeRatePerDay] = useState(0);
  const [extraChallanLateFee, setExtraChallanLateFee] = useState(0);

  const { data: newFeeSettings } = useQuery({
    queryKey: ['newFeeSettings'],
    queryFn: getNewFeeSettings
  });

  useEffect(() => {
    if (newFeeSettings?.lateFeeRatePerDay !== undefined) {
      setLateFeeRatePerDay(newFeeSettings.lateFeeRatePerDay);
    }
    if (newFeeSettings?.extraChallanLateFee !== undefined) {
      setExtraChallanLateFee(newFeeSettings.extraChallanLateFee);
    }
  }, [newFeeSettings]);

  const updateNewFeeSettingsMutation = useMutation({
    mutationFn: updateNewFeeSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['newFeeSettings']);
      toast({ title: "Late fee settings updated successfully" });
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

  const { data: feeChallansData = { data: [], meta: {} }, isLoading: isChallansLoading } = useQuery({
    queryKey: ['feeChallans', challanSearch, challanFilter, challanSessionFilter, selectedInstallment, selectedMonth, page, limit],
    queryFn: () => {
      let monthName = "";
      let yr = "";
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthName = monthNames[parseInt(month) - 1];
        yr = year;
      }

      return getFeeChallans({
        search: challanSearch,
        status: challanFilter.length > 0 ? challanFilter.join(',') : undefined,
        sessionId: challanSessionFilter !== "all" ? challanSessionFilter : undefined,
        month: monthName || undefined,
        year: yr || undefined,
        page,
        limit,
        type: 'INSTALLMENT',
      });
    },
    keepPreviousData: true,
  });

  const feeChallans = (feeChallansData.data || []).map(normalizeChallan);
  useEffect(() => {
    if (feeChallansData.meta) setChallanMeta(feeChallansData.meta);
  }, [feeChallansData]);

  const { data: extraChallansData = { data: [], meta: {} }, isLoading: isExtraLoading } = useQuery({
    queryKey: ['extraChallans', extraSearch, extraStatusFilter, extraPage, extraLimit],
    queryFn: () => {
      return getExtraChallansDedicated({
        search: extraSearch,
        status: extraStatusFilter,
        page: extraPage,
        limit: extraLimit
      });
    },
    keepPreviousData: true,
  });

  const extraChallans = (extraChallansData.data || []).map(normalizeChallan);
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
  const [reportSessionFilter, setReportSessionFilter] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all'); // 'all' | 'installment' | 'extra'
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');

  const { data: revenueData = [] } = useQuery({
    queryKey: ['revenueOverTime', reportFilter],
    queryFn: () => getRevenueOverTime({ period: reportFilter })
  });

  const { data: classCollectionData = [] } = useQuery({
    queryKey: ['classCollectionStats', reportFilter],
    queryFn: () => getClassCollectionStats({ period: reportFilter })
  });

  const { data: feeCollectionSummary = { totalRevenue: 0, totalOutstanding: 0 } } = useQuery({
    queryKey: ['feeCollectionSummary', reportFilter, challanSessionFilter],
    queryFn: () => getFeeCollectionSummary({ period: reportFilter, sessionId: challanSessionFilter !== "all" ? challanSessionFilter : undefined })
  });

  // New fee management redesign: report summary from /fee/reports/summary
  const { data: newFeeReportSummary = { totalRevenue: 0, totalOutstanding: 0, regularRevenue: 0, extraRevenue: 0 } } = useQuery({
    queryKey: ['newFeeReportSummary', reportSessionFilter, reportTypeFilter, reportDateFrom, reportDateTo],
    queryFn: () => getNewFeeReportSummary(reportSessionFilter, reportTypeFilter, reportDateFrom || undefined, reportDateTo || undefined)
  });

  // New fee management redesign: revenue over time from /fee/reports/revenue-over-time
  const { data: newRevenueOverTime = [] } = useQuery({
    queryKey: ['newRevenueOverTime', reportSessionFilter],
    queryFn: () => getNewRevenueOverTime(reportSessionFilter)
  });

  // New fee management redesign: per-class stats from /fee/reports/class-stats
  const { data: newClassStats = [] } = useQuery({
    queryKey: ['newClassStats', reportSessionFilter],
    queryFn: () => getNewClassStats(reportSessionFilter)
  });

  const { data: newFeeAnalytics } = useQuery({
    queryKey: ['newFeeAnalytics', reportSessionFilter, reportTypeFilter, reportDateFrom, reportDateTo],
    queryFn: () =>
      getNewFeeReportsAnalytics({
        sessionId: reportSessionFilter,
        type: reportTypeFilter,
        dateFrom: reportDateFrom || undefined,
        dateTo: reportDateTo || undefined,
        groupBy: reportFilter === 'daily' ? 'day' : reportFilter === 'weekly' ? 'week' : reportFilter === 'year' ? 'year' : 'month',
      }),
    retry: 0,
  });

  const { data: challanTemplates = [] } = useQuery({
    queryKey: ['feeChallanTemplates'],
    queryFn: getFeeChallanTemplates
  });

  // Hostel registration and fee payments for selected student (Student History tab)
  const { data: hostelReg } = useQuery({
    queryKey: ['hostelRegistration', 'byStudent', selectedStudent?.id],
    queryFn: () => getHostelRegistrationByStudent(selectedStudent?.id),
    enabled: !!selectedStudent?.id
  });

  const { data: hostelFeePayments = [] } = useQuery({
    queryKey: ['hostelFeePayments', hostelReg?.id],
    queryFn: () => getHostelFeePayments(hostelReg?.id),
    enabled: !!hostelReg?.id
  });

  // New fee management redesign: student installments from GET /fee/installments?studentId=
  const { data: studentInstallments = [], isLoading: isInstallmentsLoading } = useQuery({
    queryKey: ['studentInstallments', selectedStudent?.id],
    queryFn: () => getStudentInstallments(selectedStudent?.id),
    enabled: !!selectedStudent?.id
  });

  // Derived state for summary cards — installment-only (excludes hostel and extra challans)
  const { data: installmentSummary = { totalRevenue: 0, totalOutstanding: 0 } } = useQuery({
    queryKey: ['installmentSummary', challanSessionFilter],
    queryFn: () => getNewFeeReportSummary(challanSessionFilter, 'installment'),
  });
  const totalReceived = installmentSummary.totalRevenue;
  const totalPending = installmentSummary.totalOutstanding;

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

  // Task 11.4: Mutation to update installment discount via PATCH /fee/installments/:id
  const updateInstallmentMutation = useMutation({
    mutationFn: ({ id, data }) => updateInstallment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      queryClient.invalidateQueries(['extraChallans']);
      toast({ title: "Installment discount updated successfully" });
    },
    onError: (error) => {
      // Show error if installment is locked (HTTP 400 from backend)
      toast({ title: error.message || "Failed to update installment", variant: "destructive" });
    }
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

  // New bulk generate mutation using POST /fee/challans/bulk-generate (Task 11.1)
  const bulkGenerateChallansMutation = useMutation({
    mutationFn: bulkGenerateChallans,
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries(['feeChallans']);
      queryClient.invalidateQueries(['extraChallans']);

      const results = Array.isArray(data) ? data : (data?.results || []);
      const createdCount = results.filter(r => r.status === 'CREATED').length;
      const blockedCount = results.filter(r => r.status === 'BLOCKED').length;
      const skippedCount = results.filter(r => r.status === 'SKIPPED').length;
      const existsCount = results.filter(r => r.status === 'ALREADY_EXISTS').length;

      // Map to the same shape as generateResults for display
      const mappedResults = results.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName || `Student #${r.studentId}`,
        status: r.status, // CREATED | SKIPPED | BLOCKED | ALREADY_EXISTS
        reason: r.reason || r.error || r.message || '',
        challanNumber: r.challanNumber || r.challan?.challanNumber,
        challan: r.challan || null,
      }));

      setGenerateResults(mappedResults);

      if (blockedCount > 0) {
        toast({
          title: `${createdCount} challan(s) generated`,
          description: `${blockedCount} blocked/failed. See details below.`,
          variant: "destructive"
        });
      } else if (existsCount > 0 && createdCount === 0) {
        toast({ title: "Challans already generated", description: "Selected installments already have challans." });
      } else if (createdCount > 0) {
        toast({ title: `${createdCount} challan(s) generated successfully` });
      } else {
        toast({ title: "No new challans were generated" });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({ title: error.message, variant: "destructive" });
    }
  });

  const bulkGenerateExtraChallansMutation = useMutation({
    mutationFn: bulkGenerateExtraChallans,
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries(['feeChallans']);
      queryClient.invalidateQueries(['extraChallans']);

      const results = Array.isArray(data) ? data : [];
      const createdCount = results.filter(r => r.status === 'CREATED').length;
      const failedCount = results.filter(r => r.status === 'FAILED').length;

      const mappedResults = results.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName || `Student #${r.studentId}`,
        status: r.status,
        reason: r.error || '',
        challanNumber: r.challanNumber,
      }));

      setGenerateResults(mappedResults);

      if (failedCount > 0) {
        toast({
          title: `${createdCount} extra challan(s) generated`,
          description: `${failedCount} failed.`,
          variant: "destructive"
        });
      } else if (createdCount > 0) {
        toast({ title: `${createdCount} extra challan(s) generated successfully` });
      } else if (results.some(r => r.status === 'ALREADY_EXISTS')) {
        toast({ title: "Challans already exist", description: "Selected students already have these extra challans for the current month." });
      } else {
        toast({ title: "No new challans were generated" });
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
      queryClient.invalidateQueries(['installmentSummary']);
      queryClient.invalidateQueries(['newFeeReportSummary']);
      queryClient.invalidateQueries(['feeCollectionSummary']);
      toast({ title: "Challan deleted successfully" });
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const deleteExtraChallanMutation = useMutation({
    mutationFn: deleteExtraChallanDedicated,
    onSuccess: () => {
      queryClient.invalidateQueries(['extraChallans']);
      queryClient.invalidateQueries(['studentFeeHistory']);
      queryClient.invalidateQueries(['newFeeReportSummary']);
      queryClient.invalidateQueries(['feeCollectionSummary']);
      toast({ title: "Extra Challan deleted successfully" });
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const updateExtraChallanMutation = useMutation({
    mutationFn: ({ id, data }) => updateExtraChallanDedicated(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['extraChallans']);
      queryClient.invalidateQueries(['studentFeeHistory']);
      toast({ title: "Extra Challan updated successfully" });
      setChallanOpen(false);
      setEditingChallan(null);
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
      if (editingChallan.isExtra) {
        updateExtraChallanMutation.mutate({
          id: editingChallan.id,
          data: {
            dueDate: challanForm.dueDate ? format(challanForm.dueDate, "yyyy-MM-dd") : undefined,
            remarks: challanForm.remarks,
            heads: allFeeHeadDetails.map(h => ({ headName: h.name, amount: h.amount }))
          }
        });
        setChallanOpen(false);
        return;
      }

      const isVoidChallan = editingChallan.status === 'VOID';
      const isNewSchema = editingChallan.snapshotTotalDue != null || editingChallan.installmentId != null;

      if (isNewSchema) {
        updateChallanMutation.mutate({
          id: editingChallan.id,
          data: {
            feeHeadIds: selectedHeadIds,
            // Do NOT include the manual fine in heads[] — it's already sent via fineAmount
            // which maps to extraFine on the installment. Sending it in both places causes
            // the amount to be counted twice in snapshotTotalDue.
            heads: [],
            fineAmount: challanForm.isOtherEnabled ? Math.round(parseFloat(challanForm.otherAmount) || 0) : 0,
            discount: -Math.abs(discountToStore),
            dueDate: challanForm.dueDate ? format(challanForm.dueDate, "yyyy-MM-dd") : undefined,
            remarks: challanForm.remarks,
            arrearsSelections: challanForm.arrearsSelections,
          }
        });
        setChallanOpen(false);
        return;
      }

      // Legacy path: update old-schema challan
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
    // For new-schema challans, use snapshotTotalDue vs the direct payment on this challan.
    // paidAmount is the normalized direct payment (excludes advance from previous challans).
    const currentTotalDue = challan.snapshotTotalDue != null
      ? Math.max(0, Number(challan.snapshotTotalDue) - Number(challan.paidAmount || 0))
      : Math.max(0, (challan.amount || 0) + getTotalArrears(challan) + getSelectedHeadsTotal(challan) + (challan.lateFeeFine || 0) - (challan.discount || 0) - (challan.paidAmount || 0));
    
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
      arrearsAmount: "0",
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

    if (receiving <= 0) {
      toast({ title: "Please enter a valid payment amount", variant: "destructive" });
      return;
    }

    const isExtraC = itemToPay.isExtra === true || itemToPay.challanType === 'FEE_HEADS_ONLY';
    const totalDue = isExtraC
      ? Number(itemToPay.totalAmount ?? 0)
      : Number(itemToPay.snapshotTotalDue ?? (Number(itemToPay.amount ?? 0) + getTotalArrears(itemToPay) + (itemToPay.lateFeeFine ?? 0) - (itemToPay.discount ?? 0)));
    // Use normalized paidAmount (direct payment on this challan, excluding advance credits)
    const alreadyPaid = Number(itemToPay.paidAmount || 0);
    const outstanding = Math.max(0, totalDue - alreadyPaid);
    const excess = receiving - outstanding;

    if (excess > 0) {
      // For new-schema challans, check if a next installment exists using the
      // installment data embedded in the challan. If no next installment exists,
      // the excess has nowhere to go — block the payment.
      const isNewSchema = itemToPay._normalized === true || itemToPay.snapshotTotalDue != null || itemToPay.installmentId != null;

      let isLastInstallment;
      let allStudentInsts = [];
      if (isNewSchema) {
        // Use the student's feeInstallments from the linked installment relation if available,
        // otherwise fall back to the installment number comparison.
        const linkedInst = itemToPay.installment;
        allStudentInsts = linkedInst?.student?.feeInstallments || itemToPay.student?.feeInstallments || [];
        if (allStudentInsts.length > 0) {
          const maxInstNum = Math.max(...allStudentInsts.map(i => Number(i.installmentNumber) || 0));
          isLastInstallment = (itemToPay.installmentNumber || 0) >= maxInstNum;
        } else {
          // No installment list available — check if the current installment has a supersededBy or any future installment.
          // Conservative: treat as last installment to prevent overpayment.
          isLastInstallment = true;
        }
      } else {
        allStudentInsts = itemToPay.student?.feeInstallments || [];
        const maxInstNum = Math.max(...(allStudentInsts.map(i => i.installmentNumber) || [0]));
        isLastInstallment = itemToPay.installmentNumber >= maxInstNum;
      }

      if (isLastInstallment) {
        toast({
          title: "Advance payment not allowed",
          description: `Installment #${itemToPay.installmentNumber} is the last scheduled installment. Payment cannot exceed the outstanding amount of PKR ${outstanding.toLocaleString()}.`,
          variant: "destructive"
        });
        return;
      }

      // Cap advance at the next installment's pending amount so excess cannot snowball
      const nextInst = allStudentInsts
        .filter(i => Number(i.installmentNumber) > (itemToPay.installmentNumber || 0))
        .sort((a, b) => Number(a.installmentNumber) - Number(b.installmentNumber))[0];
      const nextPending = nextInst ? Number(nextInst.pendingAmount ?? nextInst.snapshotTotalDue ?? 0) : 0;
      const maxAdvance = Math.max(0, nextPending);

      if (excess > maxAdvance) {
        toast({
          title: "Advance payment exceeds limit",
          description: `Advance amount cannot exceed the next installment's pending amount of PKR ${maxAdvance.toLocaleString()}. Maximum payment allowed is PKR ${(outstanding + maxAdvance).toLocaleString()}.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Advance payment is now allowed; excess will be carried to next installment in backend.

    // All challans in the list are normalized (new schema) — always use recordFeePayment
    const isNewSchemaChallan = itemToPay._normalized === true || itemToPay.snapshotTotalDue != null || itemToPay.installmentId != null;
    const isExtraChallan = itemToPay.isExtra === true || itemToPay.challanType === 'FEE_HEADS_ONLY';

    if (isExtraChallan) {
      setIsPaymentLoading(true);
      const submissionDate = (() => {
        const dateStr = challanForm.paidDate;
        if (!dateStr) return new Date().toISOString();
        const todayStr = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd
        if (dateStr === todayStr) return new Date().toISOString();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0).toISOString();
      })();

      try {
        await recordExtraFeePayment({
          id: itemToPay.id,
          data: {
            amount: receiving,
            paymentMode: challanForm.paidBy || 'Cash',
            paymentDate: submissionDate,
            remarks: challanForm.remarks || undefined,
          }
        });
        queryClient.invalidateQueries(['feeChallans']);
        queryClient.invalidateQueries(['extraChallans']);
        queryClient.invalidateQueries(['studentFeeHistory']);
        toast({ title: "Payment recorded successfully" });
        setPaymentDialogOpen(false);
        setItemToPay(null);
        setPaymentAmount("");
        resetChallanForm();
      } catch (err) {
        toast({ title: err.message || "Failed to record payment", variant: "destructive" });
      } finally {
        setIsPaymentLoading(false);
      }
      return;
    }

    if (isNewSchemaChallan) {
      setIsPaymentLoading(true);
      const submissionDate = (() => {
        const dateStr = challanForm.paidDate;
        if (!dateStr) return new Date().toISOString();
        const todayStr = new Date().toLocaleDateString('en-CA'); // yyyy-mm-dd
        if (dateStr === todayStr) return new Date().toISOString();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0).toISOString();
      })();

      try {
        await recordFeePayment({
          challanId: itemToPay.id,
          amount: receiving,
          paymentMode: challanForm.paidBy || 'Cash',
          paidDate: submissionDate,
          remarks: challanForm.remarks || undefined,
        });
        queryClient.invalidateQueries(['feeChallans']);
        queryClient.invalidateQueries(['extraChallans']);
        queryClient.invalidateQueries(['studentFeeHistory']);
        toast({ title: "Payment recorded successfully" });
        setPaymentDialogOpen(false);
        setItemToPay(null);
        setPaymentAmount("");
        resetChallanForm();
      } catch (err) {
        toast({ title: err.message || "Failed to record payment", variant: "destructive" });
      } finally {
        setIsPaymentLoading(false);
      }
      return;
    }

    // Legacy path for old-schema challans
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
    } else if (itemToDelete.type === "extraChallan") {
      deleteExtraChallanMutation.mutate(itemToDelete.id);
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

  const getPaidAtText = (challan) => {
    const latestPayment = Array.isArray(challan?.payments) && challan.payments.length > 0
      ? [...challan.payments].sort((a, b) => new Date(b.paymentDate || b.date || 0) - new Date(a.paymentDate || a.date || 0))[0]
      : null;
    const rawPaidAt = challan?.paidAt || challan?.paidDate || challan?.paymentDate || latestPayment?.paymentDate || latestPayment?.date;
    if (rawPaidAt) {
      const paidAt = new Date(rawPaidAt);
      if (!Number.isNaN(paidAt.getTime())) {
        return format(paidAt, "dd MMM yyyy hh:mm a");
      }
    }

    if (challan?.paymentInfo) {
      try {
        const info = typeof challan.paymentInfo === 'string' ? JSON.parse(challan.paymentInfo) : challan.paymentInfo;
        const infoPaidAt = info.paidAt || info.paidDate || info.paymentDate || info.date;
        if (infoPaidAt) {
          const paidAt = new Date(infoPaidAt);
          if (!Number.isNaN(paidAt.getTime())) {
            return format(paidAt, "dd MMM yyyy hh:mm a");
          }
        }
      } catch(e) {}
    }

    return "";
  };

  const getPaidChallanRemarks = (challan) => {
    let latestRemarks = "";

    if (Array.isArray(challan?.payments) && challan.payments.length > 0) {
      const latestPayment = [...challan.payments].sort((a, b) => new Date(b.paymentDate || b.date || 0) - new Date(a.paymentDate || a.date || 0))[0];
      latestRemarks = latestPayment?.remarks || "";
    }

    if (!latestRemarks) {
      latestRemarks = challan?.remarks || "";
    }

    if (!latestRemarks && challan?.paymentInfo) {
      try {
        const info = typeof challan.paymentInfo === 'string' ? JSON.parse(challan.paymentInfo) : challan.paymentInfo;
        latestRemarks = info.remarks || "";
      } catch(e) {}
    }
    return latestRemarks || '-';
  };

  const getPaidByText = (challan) => {
    if (Array.isArray(challan?.payments) && challan.payments.length > 0) {
      const latestPayment = [...challan.payments].sort((a, b) => new Date(b.paymentDate || b.date || 0) - new Date(a.paymentDate || a.date || 0))[0];
      const fromPayment =
        latestPayment?.receivedByName ||
        latestPayment?.receivedBy ||
        latestPayment?.paidBy ||
        latestPayment?.updatedByName ||
        latestPayment?.updatedBy;
      if (fromPayment) return String(fromPayment);
    }

    if (challan?.paymentInfo) {
      try {
        const info = typeof challan.paymentInfo === 'string' ? JSON.parse(challan.paymentInfo) : challan.paymentInfo;
        const fromInfo =
          info?.receivedByName ||
          info?.receivedBy ||
          info?.updatedByName ||
          info?.updatedBy ||
          info?.paidBy ||
          info?.paymentMode;
        if (fromInfo) return String(fromInfo);
      } catch (e) {}
    }

    if (challan?.paidBy) return String(challan.paidBy);
    if (challan?.updatedByName) return String(challan.updatedByName);
    if (challan?.updatedBy) return String(challan.updatedBy);
    if (challan?.createdByName) return String(challan.createdByName);
    if (challan?.createdBy) return String(challan.createdBy);
    return "System";
  };

  const isPaidChallanForPrint = (challan) => {
    const alreadyPaid = Number(challan?.paidAmount ?? challan?.amountReceived ?? 0);
    const totalDue = Number(challan?.snapshotTotalDue ?? challan?.totalAmount ?? challan?.amount ?? 0);
    return challan?.status === 'PAID' || challan?.status === 'SETTLED' || challan?.status === 'PARTIAL' || (totalDue > 0 && alreadyPaid >= totalDue);
  };

  const getPaidChallanRowsHtml = (challan) => {
    const paidRemarksStyle = 'background-color: #dcfce7; color: #14532d; font-weight: 700; font-size: 10px;';
    const blockBorder = 'border-left: 1px solid #9ca3af; border-right: 1px solid #9ca3af;';
    const topBorder = 'border-top: 1.5px solid #166534;';
    const bottomBorder = 'border-bottom: 1px solid #9ca3af;';
    const labelCellStyle = `${paidRemarksStyle} ${blockBorder}`;
    const valueCellStyle = `${paidRemarksStyle} ${blockBorder} text-align: left;`;
    
    const paidAtText = getPaidAtText(challan);
    const paidByText = getPaidByText(challan);
    const remarksRaw = String(getPaidChallanRemarks(challan) || '');
    const remarksClean = remarksRaw.replace(/\s+/g, ' ').trim();
    const remarksShort = remarksClean.length > 160 ? `${remarksClean.slice(0, 160)}...` : remarksClean;
    
    const isPartial = challan?.status === 'PARTIAL';
    const labelPrefix = isPartial ? 'Partial ' : '';
    const fallbackRemarks = '-';

    let rowsHtml = "";
    let isFirst = true;

    if (paidAtText) {
      rowsHtml += `<tr class="paid-at-row">
        <td style="${labelCellStyle} ${isFirst ? topBorder : ''}">${labelPrefix}Paid At</td>
        <td style="${valueCellStyle} ${isFirst ? topBorder : ''}">${paidAtText}</td>
      </tr>`;
      isFirst = false;
    }

    if (paidByText) {
      rowsHtml += `<tr class="paid-by-row">
        <td style="${labelCellStyle} ${isFirst ? topBorder : ''}">${labelPrefix}Paid By</td>
        <td style="${valueCellStyle} ${isFirst ? topBorder : ''}">${paidByText}</td>
      </tr>`;
      isFirst = false;
    }

    rowsHtml += `<tr class="paid-remarks-row">
      <td colspan="2" style="${valueCellStyle} ${bottomBorder} ${isFirst ? topBorder : ''}; white-space: normal; word-break: break-word; line-height: 1.35;">
        Remarks: ${remarksShort || fallbackRemarks}
        ${remarksClean.length > 160 ? '<div style="font-size: 9px; opacity: 0.8; margin-top: 3px;">(truncated for print layout)</div>' : ''}
      </td>
    </tr>`;

    return rowsHtml;
  };

  const applyPaidChallanPrintTreatment = (html, challan) => {
    if (!html || !isPaidChallanForPrint(challan)) return html;

    const hasPaidRows = html.includes('class="paid-at-row"') || html.includes('class="paid-remarks-row"');
    const paidRowsHtml = getPaidChallanRowsHtml(challan);
    const isFullyPaid = ['PAID', 'SETTLED'].includes(challan.status);

    let nextHtml = hasPaidRows ? html : html.replace(
      /<tr[^>]*>\s*<td[^>]*>\s*Remarks\s*<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/gi,
      paidRowsHtml
    );

    if (!hasPaidRows) {
      nextHtml = nextHtml.replace(
        /<tr[^>]*>\s*<td[^>]*>\s*Late Fee Fine after due date\s*<\/td>\s*<td[^>]*>\s*Rs\.\s*\d+\s*Per\s*Day\s*<\/td>\s*<\/tr>/gi,
        paidRowsHtml
      );
    }

    // Only replace signature block with system-generated note for fully paid challans.
    // Partial challans keep the signature fields (same as pending challans).
    if (isFullyPaid) {
      const systemGeneratedNote = `
        <div class="paid-system-note" style="padding: 8px 10px 5px 10px; margin-top: 4px; font-size: 8px; line-height: 1.35; color: #475569; font-style: italic;">
          * This paid challan is system generated and does not require bank/account officer or depositor signatures.
        </div>
      `;
      nextHtml = nextHtml.replace(
        /<div class="signatures">[\s\S]*?<div class="sig-label">Depositor Signature<\/div>\s*<\/div>\s*<\/div>/gi,
        systemGeneratedNote
      );
    }

    return nextHtml;
  };
  const generateChallanHtml = (challan, manualTemplate = null) => {
    if (!challan || !challan.student) return "";

    const student = challan.student;
    const templateContent = manualTemplate || (() => {
      let type = 'INSTALLMENT';
      if (challan.isExtra) type = 'EXTRA';
      if (challan.isHostel) type = 'HOSTEL';
      
      const found = challanTemplates.find(t => t.type === type && t.isDefault) || 
                    challanTemplates.find(t => t.type === type) || 
                    challanTemplates.find(t => t.isDefault) || 
                    challanTemplates[0];
      return found?.htmlContent;
    })();

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
    const tuitionOnly = Number(challan.snapshotBaseAmount ?? challan.amount ?? 0);
    let headsTotal = Number(challan.fineAmount ?? 0);
    const extraFine = Number(challan.installment?.extraFine || 0);
    const lateFee = Number(challan.snapshotLateFee ?? challan.lateFeeFine ?? 0);
    const scholarship = Number(challan.snapshotDiscount) || Number(challan.discount) || Number(challan.installment?.discount) || 0;
    const originalArrears = Number(challan.snapshotArrearsAmount ?? getTotalArrears(challan) ?? 0);

    let grossTotal = tuitionOnly + headsTotal + lateFee + originalArrears;
    let standardTotal = grossTotal - Math.abs(scholarship);
    let netPayable = Math.max(0, standardTotal - (challan.paidAmount || 0));
    let fineTotal = headsTotal + lateFee;

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

    // ── Build fee heads HTML rows ─────────────────────────────────────────────
    // Priority: challanHeads (snapshot) → installment.heads → challan.heads (extra challan relation)
    let headsSnapshot = challan.challanHeads || [];
    if (headsSnapshot.length === 0 && challan.installment?.heads) {
      headsSnapshot = challan.installment.heads.map(h => ({ headName: h.headName || h.name, amount: h.amount }));
    }
    // Extra challan: heads are stored directly on challan.heads (ExtraChallan relation)
    if (headsSnapshot.length === 0 && Array.isArray(challan.heads) && challan.heads.length > 0) {
      headsSnapshot = challan.heads.map(h => ({ headName: h.headName || h.name || h.feeHead?.name || 'Fee', amount: h.amount }));
    }

    const headsSnapshotTotal = headsSnapshot.reduce((sum, h) => sum + Math.max(0, Number(h.amount || 0)), 0);
    if (headsSnapshotTotal > 0 && headsTotal <= 0) {
      headsTotal = headsSnapshotTotal;
      grossTotal = tuitionOnly + headsTotal + lateFee + originalArrears;
      standardTotal = grossTotal - Math.abs(scholarship);
      netPayable = Math.max(0, standardTotal - (challan.paidAmount || 0));
      fineTotal = headsTotal + lateFee;
    }
    
    const headsRowsList = [];
    if (tuitionOnly > 0) {
      headsRowsList.push(`<tr><td>Tuition Fee</td><td>${tuitionOnly.toLocaleString()}</td></tr>`);
    }
    headsSnapshot.forEach(h => {
      const headName = h.headName || h.feeHead?.name || "Additional Fee";
      const amt = Number(h.amount);
      if (amt !== 0) {
        headsRowsList.push(`<tr><td>${headName}</td><td>${amt < 0 ? `- ${Math.abs(amt).toLocaleString()}` : amt.toLocaleString()}</td></tr>`);
      }
    });
    if (lateFee > 0) {
      headsRowsList.push(`<tr><td>Late Fee (Overdue)</td><td>${lateFee.toLocaleString()}</td></tr>`);
    }
    if (extraFine > 0) {
      headsRowsList.push(`<tr><td>Fine (Extra)</td><td>${extraFine.toLocaleString()}</td></tr>`);
    }
    if (Math.abs(scholarship) > 0) {
      headsRowsList.push(`<tr><td>Discount</td><td>-${Math.abs(scholarship).toLocaleString()}</td></tr>`);
    }
    let feeHeadsRowsHtml = headsRowsList.join('');

    // ── Build Arrears Rows ────────────────────────────────────────────────────
    // Use the backend-provided snapshot if available, or compute from chain
    let arrearsRowsHtml = "";
    const snapshotArrears = Number(challan.snapshotArrearsAmount || 0);
    if (snapshotArrears > 0) {
      try {
        const arrearsNums = typeof challan.installment?.arrearsInstallments === 'string'
          ? JSON.parse(challan.installment.arrearsInstallments)
          : (challan.installment?.arrearsInstallments || []);
        
        if (Array.isArray(arrearsNums) && arrearsNums.length > 0) {
          const allInsts = challan.installment?.student?.feeInstallments || [];
          const prevChallans = Array.isArray(challan.previousChallans) ? challan.previousChallans : [];
          const fallbackTotalArrears = Number(challan.snapshotArrearsAmount || 0);
          const fallbackPerRow = arrearsNums.length > 0 ? Math.round(fallbackTotalArrears / arrearsNums.length) : 0;
          arrearsRowsHtml = arrearsNums.map(num => {
            const match = allInsts.find(i => Number(i.installmentNumber) === Number(num));
            if (!match) return "";
            // IMPORTANT:
            // For settled arrears chains, installment live balances become 0.
            // So prefer the linked previous-challan snapshot/settled values.
            const prev = prevChallans.find((p) =>
              Number(p.installmentNo ?? p.installmentNumber ?? p.installment?.installmentNumber ?? -1) === Number(num)
            );
            const prevSettled = Number(prev?.settledAmount ?? 0);
            const prevSnapshotDue = Number(prev?.snapshotTotalDue ?? 0);
            const prevReceived = Number(prev?.amountReceived ?? prev?.paidAmount ?? 0);
            const prevRemainingAtRoll = Math.max(0, prevSnapshotDue - prevReceived);

            const snapArrears = Number(match.snapshotArrearsAmount ?? 0);
            const settledContribution = Number(match.settledAmount ?? 0);
            const outstandingPrincipal = Number(match.outstandingPrincipal ?? 0);
            const matchTotal = Number(match.totalAmount ?? 0);
            const matchPaid = Number(match.paidAmount ?? 0);
            const fallbackRemaining = Math.max(0, matchTotal - matchPaid);

            const amt = prevSettled > 0
              ? prevSettled
              : (prevRemainingAtRoll > 0
                ? prevRemainingAtRoll
                : (snapArrears > 0
                  ? snapArrears
                  : (settledContribution > 0
                    ? settledContribution
                    : (outstandingPrincipal > 0 ? outstandingPrincipal : fallbackRemaining))));
            const finalAmt = Number(amt) > 0
              ? Number(amt)
              : (arrearsNums.length === 1 ? fallbackTotalArrears : fallbackPerRow);
            // Build label: "Month - Installment X / Session"
            const monthLabel = match.month || `#${num}`;
            const instLabel = `Installment ${match.installmentNumber || num}`;
            const sessionLabel = (typeof match.session === 'object' ? match.session?.name : match.session) || match.sessionName || challan.installment?.session?.name || "";
            const rowLabel = `${monthLabel} - ${instLabel}${sessionLabel ? ` / ${sessionLabel}` : ''}`;
            return `<tr style="background-color: #fafafa; line-height: 1.2;">
              <td style="font-style: italic; font-size: 10px; color: #555;">${rowLabel}</td>
              <td style="font-size: 10px; color: #555;">${Number(finalAmt).toLocaleString()}</td>
            </tr>`;
          }).filter(Boolean).join('\n');
        } else if (challan.installment?.arrearsMonths) {
          const months = Array.isArray(challan.installment.arrearsMonths) 
            ? challan.installment.arrearsMonths 
            : JSON.parse(challan.installment.arrearsMonths);
          arrearsRowsHtml = months.map(m => `<tr><td>Arrears - ${m}</td><td>-</td></tr>`).join('');
        }

        if (arrearsRowsHtml) {
          // arrearsRowsHtml += `<tr style="background-color: #e0e0e0; line-height: 1.2;">
          //   <td style="padding-left: 10px; font-size: 10px;"><strong>Total Arrears Balance</strong></td>
          //   <td style="font-size: 11px;"><strong>${snapshotArrears.toLocaleString()}</strong></td>
          // </tr>`;
        } else {
          arrearsRowsHtml = `<tr><td>Arrears (Previous Balance)</td><td>${snapshotArrears.toLocaleString()}</td></tr>`;
        }
      } catch (e) {
        arrearsRowsHtml = `<tr><td>Arrears (Previous Balance)</td><td>${snapshotArrears.toLocaleString()}</td></tr>`;
      }
    }
    
    // ── Build Advance Rows (Applied Credits) ──────────────────────────────────
    let advanceRowsHtml = "";
    const appliedAdvance = Number(challan.advanceAmount || 0);
    if (appliedAdvance > 0) {
      const sourceChallanNo = challan.advanceFromChallanNo;
      // Priority: data from the challan's own nested student installments (now returned by getFeeChallans),
      // then fall back to component-level studentInstallments state.
      const allInsts = (() => {
        const seen = new Set();
        const merged = [
          ...(Array.isArray(challan.installment?.student?.feeInstallments) ? challan.installment.student.feeInstallments : []),
          ...(Array.isArray(challan.student?.feeInstallments) ? challan.student.feeInstallments : []),
          ...(Array.isArray(studentInstallments) ? studentInstallments : []),
        ];
        return merged.filter(inst => {
          if (seen.has(inst.id)) return false;
          seen.add(inst.id);
          return true;
        });
      })();
      
      let sourceInst = null;
      let sourceChallan = null;

      for (const inst of allInsts) {
        const found = (inst.challans || []).find(c => String(c.challanNumber) === String(sourceChallanNo));
        if (found) {
          sourceChallan = found;
          sourceInst = inst;
          break;
        }
      }

      const monthLabel = sourceInst?.month || "N/A";
      const instLabel = sourceInst?.installmentNumber ? `Installment ${sourceInst.installmentNumber}` : "";
      const sessionLabel = sourceInst?.session?.name || "";
      const rowLabel = `${monthLabel}${instLabel ? ` - ${instLabel}` : ''}${sessionLabel ? ` / ${sessionLabel}` : ''}`;
      
      advanceRowsHtml = `<tr style="background-color: #f0f9ff; line-height: 1.2;">
        <td style="font-style: italic; font-size: 10px; color: #0369a1;">${rowLabel} (Advance)</td>
        <td style="font-size: 10px; color: #0369a1;">- ${appliedAdvance.toLocaleString()}</td>
      </tr>`;

      // NOTE: Do NOT subtract advance from standardTotal here.
      // The advance is a credit from a previous challan; it is shown as an
      // informational line item but the challan's own total/remaining should
      // be computed from snapshotTotalDue vs the actual payment on this challan.
      // This keeps the print preview consistent with the details dialog.
    }
    
    if (advanceRowsHtml) {
      arrearsRowsHtml += advanceRowsHtml;
    }

    // ── Payment Adjustments ───────────────────────────────────────────────────
    // paidAmount = total amount received (includes advance credits from previous challans).
    const alreadyPaid = Number(challan.paidAmount || 0);
    const isExtraChallanType = challan.challanType === 'FEE_HEADS_ONLY' || challan.isExtra;
    const totalSnap = isExtraChallanType
      ? Math.max(Number(challan.snapshotTotalDue ?? 0), Number(challan.totalAmount ?? 0), standardTotal)
      : Number(challan.snapshotTotalDue ?? standardTotal ?? 0);
    // Keep negative value when overpaid so UI can show advance credit on this challan.
    const remainingPayable = totalSnap - alreadyPaid;
    const isFullyPaid = isPaidChallanForPrint(challan);

    // Paid/remaining rows are injected via {{paidRow}} only — do NOT append to arrearsRowsHtml

    // ── Replace placeholders ──────────────────────────────────────────────────
    let html = templateContent;

    // Mapping based on the collegiate template provided
    html = html.replace(/\{\{challanNo\}\}/g, challan.challanNumber || "");
    html = html.replace(/\{\{challanNumber\}\}/g, challan.challanNumber || "");
    html = html.replace(/\{\{issueDate\}\}/g, format(new Date(challan.generatedDate || challan.createdAt), "dd MMM yyyy"));
    html = html.replace(/\{\{dueDate\}\}/g, challan.dueDate ? format(new Date(challan.dueDate), "dd MMM yyyy") : "N/A");
    html = html.replace(/\{\{studentName\}\}/g, `${student.fName} ${student.lName}`);
    html = html.replace(/\{\{fatherName\}\}/g, student.fatherOrguardian || "");
    html = html.replace(/\{\{class\}\}/g, programClassSection);
    html = html.replace(/\{\{rollNo\}\}/g, student.rollNumber || "");
    html = html.replace(/\{\{session\}\}/g, challan.installment?.session?.name || "");
    html = html.replace(/\{\{month\}\}/g, challan.installment?.month || "");
    html = html.replace(/\{\{installmentNo\}\}/g, challan.installmentNumber || challan.installment?.installmentNumber || "");

    html = html.replace(/\{\{Tuition Fee\}\}/g, '');
    // Remove "Total Payable after due date" row from output
    html = html.replace(/<tr[^>]*>\s*<td[^>]*>\s*Total Payable after due date\s*<\/td>[\s\S]*?<\/tr>/gi, '');

    html = html.replace(/\{\{feeHeadsRows\}\}/g, feeHeadsRowsHtml);
    html = html.replace(/\{\{arrearsRows\}\}/g, arrearsRowsHtml);
    html = html.replace(/\{\{arrears\}\}/g, snapshotArrears.toLocaleString());
    html = html.replace(/\{\{lateFeeRatePerDay\}\}/g, (
      challan.installment?.lateFeeRatePerDay ||
      (isExtraChallanType ? extraChallanLateFee : lateFeeRatePerDay) ||
      150
    ).toString());
    html = html.replace(/\{\{discount\}\}/g, '');
    
    // Paid/remaining rows are useful for paid, partial, and pending challans.
    // Show paid/advance rows only when this challan has received payment.
    const shouldShowBalanceRows = alreadyPaid > 0 || ['PAID', 'SETTLED', 'PARTIAL'].includes(challan.status);
    if (shouldShowBalanceRows) {
      const paidDisplay = alreadyPaid > 0 ? `${alreadyPaid.toLocaleString()}` : '0';
      const showTotalRowInPaid = isFullyPaid ? `
        <tr style="font-weight: 700; border-top: 1px solid #e2e8f0; background-color: #b8b6b6ff;">
          <td>Total Amount</td>
          <td>${standardTotal.toLocaleString()}</td>
        </tr>` : '';

      const paidRowHtml = `
        ${showTotalRowInPaid}
        <tr style="color: #166534; background-color: #f0fdf4; font-weight: 600; font-size: 11px;">
          <td>Paid Amount</td>
          <td>${paidDisplay}</td>
        </tr>
        ${challan.status !== 'PENDING' ? `
        <tr style="font-weight: 700; border-top: 1px solid #e2e8f0;">
          <td>Remaining Balance</td>
          <td>${remainingPayable.toLocaleString()}</td>
        </tr>` : ''}
      `;
      html = html.replace(/\{\{paidRow\}\}/g, paidRowHtml);
    } else {
      html = html.replace(/\{\{paidRow\}\}/g, '');
    }

    const netPayableStr = netPayable.toLocaleString();
    const netInWords = numberToWords(netPayable);

    html = html.replace(/\{\{totalAmount\}\}/g, standardTotal.toLocaleString());
    html = html.replace(/\{\{netPayable\}\}/g, netPayableStr);
    // NOTE: {{totalPayable}} is intentionally NOT replaced here — it is handled
    // in the paid/partial block below so it shows the correct remaining balance.
    html = html.replace(/\{\{amountInWords\}\}/g, netInWords);
    html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${netInWords}</strong>`);

    // NOTE: paymentHistory placeholders are NOT cleared here — they are replaced
    // with actual data in the History Table block below.

    html = html.replace(/\{\{paymentDetailsRow\}\}/g, '');
    const cellStyle = 'background-color: #e0e0e0; font-weight: bold;';

    const isActuallyFullyPaid = ['PAID', 'SETTLED'].includes(challan.status) || (alreadyPaid >= standardTotal && standardTotal > 0);

    if (isFullyPaid) {
      let latestRemarks = challan.remarks || "";
      if (!latestRemarks && challan.paymentInfo) {
        try {
          const info = typeof challan.paymentInfo === 'string' ? JSON.parse(challan.paymentInfo) : challan.paymentInfo;
          latestRemarks = info.remarks || "";
        } catch(e) {}
      }

      // Inject a <style> block to hide .total-row via CSS — this avoids greedy
      // regex that would eat content across the 3 challan copies.
      // NOTE: We no longer hide .total-row here as the user wants to see it.
      const hideTotalRowStyle = '';
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${hideTotalRowStyle}</head>`);
      } else {
        html = hideTotalRowStyle + html;
      }

      if (isActuallyFullyPaid) {
        html = html.replace(/<tr[^>]*>\s*<td[^>]*>\s*Total Payable within due date\s*<\/td>[\s\S]*?<\/tr>/gi, '');
        html = html.replace(/<tr[^>]*>\s*<td[^>]*>\s*Total Payable after due date\s*<\/td>[\s\S]*?<\/tr>/gi, '');
        html = html.replace(/\{\{totalPayable\}\}/g, '');
      } else {
        // For partial challans, still show the remaining balance
        html = html.replace(/\{\{totalPayable\}\}/g, remainingPayable.toLocaleString());
      }
      
      // Update the late-fee row to show paid remarks and payment timestamp instead.
      html = html.replace(/<tr class="late-fee-row">[\s\S]*?<\/tr>/gi, getPaidChallanRowsHtml({ ...challan, remarks: latestRemarks }));
      html = html.replace(/\{\{lateFee\}\}/g, latestRemarks || (challan.status === 'PARTIAL' ? '-' : '-'));
    } else {
      // For pending/unpaid challans: remove late fee after due date row, show total payable.
      html = html.replace(/<tr class="late-fee-row">[\s\S]*?<\/tr>/gi, '');
      html = html.replace(/\{\{totalPayable\}\}/g, remainingPayable.toLocaleString());
      html = html.replace(/<td>Total Payable within due date<\/td>/gi,
        `<td style="${cellStyle}">Total Payable within due date</td>`);
      html = html.replace(/\{\{lateFee\}\}/g, lateFee.toLocaleString());
    }
    
    // History Table — previous installments in the same session
    // Use installmentNumber from the challan; for extra challans (installmentNumber=0) skip history
    const currentInstNo = challan.installmentNumber || challan.installment?.installmentNumber || 0;
    const allStudentInsts = Array.isArray(challan.installment?.student?.feeInstallments)
      ? challan.installment.student.feeInstallments
      : [];
    // Only show history for installment challans (installmentNumber > 0)
    const paymentHistory = currentInstNo > 0
      ? allStudentInsts.filter(i => Number(i.installmentNumber) < currentInstNo)
      : [];
    
    const histMonths = paymentHistory.map(i => `<td>${i.month || '—'}</td>`).join('');
    // Use snapshotTotalDue if available (most accurate), else totalAmount
    const histTotals = paymentHistory.map(i => `<td>${Number(i.snapshotTotalDue ?? i.totalAmount ?? 0).toFixed(0)}</td>`).join('');
    const histPaid = paymentHistory.map(i => `<td>${Number(i.paidAmount ?? 0).toFixed(0)}</td>`).join('');

    html = html.replace(/\{\{paymentHistoryMonths\}\}/g, histMonths);
    html = html.replace(/\{\{paymentHistoryTotals\}\}/g, histTotals);
    html = html.replace(/\{\{paymentHistoryPaid\}\}/g, histPaid);

    // Legacy/Extra fields
    html = html.replace(/\{\{paidRow\}\}/g, "");
    html = html.replace(/\{\{paymentDetailsRow\}\}/g, "");

    return applyPaidChallanPrintTreatment(html, challan);
  };

  const handleBulkPrint = async () => {
    try {
      setBulkPrinting(true);
      const [year, month] = bulkPrintFilters.month.split('-');
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const targetMonth = monthNames[parseInt(month) - 1];

      // Fetch all matching challans using the dedicated bulk API
      const response = await getBulkChallans({
        programId: bulkPrintFilters.programId === "all" ? "" : bulkPrintFilters.programId,
        classId: bulkPrintFilters.classId === "all" ? "" : bulkPrintFilters.classId,
        sectionId: bulkPrintFilters.sectionId === "all" ? "" : bulkPrintFilters.sectionId,
        month: targetMonth,
        year: year
      });

      const challans = response || [];
      if (challans.length === 0) {
        toast({ title: "No challans found", description: "No challans match the selected filters for this month.", variant: "destructive" });
        return;
      }

      // Detect new-schema challans: any challan with snapshotTotalDue or installmentId
      const hasNewSchema = challans.some(c => c.snapshotTotalDue != null || c.installmentId != null);

      if (hasNewSchema) {
        // New-schema: fetch rendered HTML from the print endpoint for each challan,
        // concatenate, and trigger a single browser print action
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({ title: "Pop-up blocked", description: "Please allow pop-ups to print challans.", variant: "destructive" });
          return;
        }

        const htmlParts = await Promise.all(
          challans.map(async challan => applyPaidChallanPrintTreatment(await printFeeInstallmentChallan(challan.id), challan))
        );

        const fullHtml = `
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
            ${htmlParts.map((html, index) =>
              `<div class="${index < htmlParts.length - 1 ? 'page-break' : ''}">${html}</div>`
            ).join('')}
          </body>
          </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        setBulkPrintOpen(false);
        return;
      }

      // Legacy challans: use the default template with preview flow
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
    let challan = feeChallans.find(c => c.id === challanId);
    let isDedicatedExtra = false;

    if (!challan) {
      challan = extraChallans.find(c => c.id === challanId);
      if (challan) isDedicatedExtra = true;
    }

    if (!challan) return;

    try {
      if (isDedicatedExtra) {
        const html = applyPaidChallanPrintTreatment(await printExtraChallan(challanId), challan);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({ title: "Pop-up blocked", description: "Please allow pop-ups to print challans.", variant: "destructive" });
          return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        return;
      }

      // Detect new-schema challan: has snapshotTotalDue or installmentId
      const isNewSchema = challan.snapshotTotalDue != null || challan.installmentId != null;

      if (isNewSchema) {
        // Use the new print endpoint which returns rendered HTML
        const html = applyPaidChallanPrintTreatment(await printFeeInstallmentChallan(challanId), challan);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast({ title: "Pop-up blocked", description: "Please allow pop-ups to print challans.", variant: "destructive" });
          return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        return;
      }

      // Legacy challan: use the default template
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
              ${heads.map(head => {
                const amount = head.amount;
                return `
                <tr>
                  <td>${head.name}</td>
                  <td>${head.description}</td>
                  <td>${head.amount.toLocaleString()}</td>
                </tr>
                `;
              }).join('')}
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
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
          <TabsTrigger value="feeheads"><Layers className="w-4 h-4 mr-2" />Fee Heads</TabsTrigger>
          <TabsTrigger value="structures"><TrendingUp className="w-4 h-4 mr-2" />Fee Structures</TabsTrigger>
          <TabsTrigger value="reports"><DollarSign className="w-4 h-4 mr-2" />Reports</TabsTrigger>
          <TabsTrigger value="settings"><Edit className="w-4 h-4 mr-2" />Settings</TabsTrigger>
          <TabsTrigger value="student-history"><History className="w-4 h-4 mr-2" />Student History</TabsTrigger>
        </TabsList>

        <TabsContent value="challans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-muted-foreground">Total Received</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold cursor-help">i</span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs space-y-1 p-3">
                          <p className="font-semibold mb-1">Installment Fee Only</p>
                          <p>Collected: PKR {formatAmount(installmentSummary.totalRevenue || 0)}</p>
                          <p>Outstanding: PKR {formatAmount(installmentSummary.totalOutstanding || 0)}</p>
                          <p className="text-muted-foreground text-[10px] mt-1">Excludes hostel & extra challans</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
              <div className="mt-4 flex items-center gap-2">
                {/* Search */}
                <Input
                  placeholder="Challan #, name, roll..."
                  value={challanSearch}
                  onChange={(e) => setChallanSearch(e.target.value)}
                  className="w-[220px] h-9"
                />

                {/* Filter icon popover — all filters inside */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-9 gap-1.5 ${
                        (challanFilter.length > 0 || challanSessionFilter !== activeSessionId || selectedInstallment !== "all" || selectedMonth)
                          ? "border-primary text-primary"
                          : ""
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                      {(challanFilter.length > 0 || challanSessionFilter !== activeSessionId || selectedInstallment !== "all" || selectedMonth) && (
                        <span className="ml-0.5 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                          {[
                            challanFilter.length > 0 ? 1 : 0,
                            challanSessionFilter !== activeSessionId ? 1 : 0,
                            selectedInstallment !== "all" ? 1 : 0,
                            selectedMonth ? 1 : 0,
                          ].reduce((a, b) => a + b, 0)}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-4 max-h-[80vh] overflow-y-auto" align="start" side="bottom" sideOffset={4}>
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-foreground">Filters</p>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { value: "pending", label: "Pending" },
                            { value: "partial", label: "Partial" },
                            { value: "paid", label: "Paid" },
                            { value: "overdue", label: "Overdue" },
                            { value: "void", label: "Voided" },
                            { value: "superseded", label: "Superseded" },
                            { value: "settled", label: "Settled" },
                          ].map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-input accent-primary"
                                checked={challanFilter.includes(value)}
                                onChange={(e) => {
                                  setChallanFilter(prev =>
                                    e.target.checked ? [...prev, value] : prev.filter(v => v !== value)
                                  );
                                  setPage(1);
                                }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Session */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Session</Label>
                        <Select value={challanSessionFilter} onValueChange={(v) => { setChallanSessionFilter(v); setPage(1); }}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="All Sessions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sessions</SelectItem>
                            {academicSessions.map(s => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}{s.isActive ? " (Active)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Installment */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Installment</Label>
                        <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="All Installments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Installments</SelectItem>
                            {Array.from({ length: Math.max(...feeStructures.map(s => s.installments || 0), 12) }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>Installment #{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Month */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Month</Label>
                        <Input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      {/* Reset */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-muted-foreground text-xs"
                        onClick={() => {
                          setChallanSearch("");
                          setChallanFilter([]);
                          setChallanSessionFilter(activeSessionId);
                          setSelectedInstallment("all");
                          setSelectedMonth("");
                          setPage(1);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" /> Reset all filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Active filter chips */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {challanFilter.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      <button onClick={() => { setChallanFilter(prev => prev.filter(v => v !== f)); setPage(1); }}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {challanSessionFilter !== activeSessionId && challanSessionFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {academicSessions.find(s => s.id.toString() === challanSessionFilter)?.name || "Session"}
                      <button onClick={() => { setChallanSessionFilter(activeSessionId); setPage(1); }}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedInstallment !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      Inst #{selectedInstallment}
                      <button onClick={() => setSelectedInstallment("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedMonth && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      {selectedMonth}
                      <button onClick={() => setSelectedMonth("")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {/* Generate button — stays in the toolbar */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setGenerateResults(null);
                    setGenerateDialogOpen(true);
                  }}
                  className="h-9 gap-2 ml-auto shrink-0"
                >
                  <Plus className="w-4 h-4" /> Generate Challans
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Challan No</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Student</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Installment</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Base Payable</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Extra/Heads</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Fine (Late Fee)</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-foreground bg-slate-100">Total</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-green-700 bg-green-50">Paid Amount</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Due Date</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeChallans
                      .map((challan, idx) => {
                        return <TableRow key={challan.id} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                          <TableCell className="text-sm px-3 py-2 font-medium">{challan.challanNumber}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div>{challan.student?.fName} {challan.student?.lName}</div>
                            <div className="text-xs text-muted-foreground">{challan.student?.rollNumber}</div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 font-bold text-slate-800">
                                {challan.month || (challan.installmentNumber === 0 ? "Extra" : `Inst #${challan.installmentNumber}`)}
                                {challan.installment?.isLocked && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center cursor-help">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Installment is locked (fully paid)</TooltipContent>
                                  </Tooltip>
                                )}
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
                          {/* Base Payable: use snapshotBaseAmount when available (new schema), fall back to challan.amount */}
                          <TableCell className="text-sm px-3 py-2 font-medium">PKR {formatAmount(challan.snapshotBaseAmount ?? challan.amount)}</TableCell>
                          {/* Extra/Heads + Arrears: use snapshotArrearsAmount when available (new schema), fall back to legacy computation */}
                          <TableCell className="text-sm px-3 py-2 font-medium text-orange-600">
                             {challan.snapshotArrearsAmount != null ? (
                               <>
                                 PKR {formatAmount(getSelectedHeadsTotal(challan))}
                                 {challan.snapshotArrearsAmount > 0 && (
                                   <div className="text-[10px] text-muted-foreground font-normal">
                                     + Arrears: {formatAmount(challan.snapshotArrearsAmount)}
                                   </div>
                                 )}
                               </>
                             ) : (
                               <>
                                 PKR {formatAmount(getSelectedHeadsTotal(challan))}
                                 {getTotalArrears(challan) > 0 && (
                                   <div className="text-[10px] text-muted-foreground font-normal">
                                     + Arrears: {formatAmount(getTotalArrears(challan))}
                                   </div>
                                 )}
                               </>
                             )}
                          </TableCell>
                          {/* Late Fee: use snapshotLateFee when available (new schema), fall back to challan.lateFeeFine */}
                          <TableCell className="text-sm px-3 py-2 font-medium text-red-600">
                            PKR {formatAmount(challan.snapshotLateFee ?? challan.lateFeeFine)}
                            {challan.status === "VOID" && ((challan.snapshotLateFee ?? challan.lateFeeFine) || 0) > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 inline-flex items-center cursor-help">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  Late fee of PKR {formatAmount(challan.snapshotLateFee ?? challan.lateFeeFine)} is preserved for audit.
                                  {challan.supersededBy ? ` Included in Challan #${challan.supersededBy.challanNumber}.` : " Rolled into superseding challan."}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          {/* Total Due: use snapshotTotalDue when available (new schema), fall back to legacy getChallanTotal */}
                          <TableCell className="text-sm px-3 py-2 font-bold bg-slate-50">
                            PKR {formatAmount(challan.snapshotTotalDue ?? getChallanTotal(challan))}
                          </TableCell>
                          <TableCell className="text-sm px-3 py-2 text-success font-medium bg-green-50/50">PKR {formatAmount(challan.paidAmount || 0)}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div>{challan.dueDate ? new Date(challan.dueDate).toLocaleDateString() : '—'}</div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "PARTIAL" ? "secondary" : (challan.status === "VOID" || challan.status === "SUPERSEDED" || challan.status === "SETTLED") ? "outline" : "secondary"}>
                                {challan.status === "VOID" ? "Voided" : 
                                 (challan.status === "SUPERSEDED" && (challan.settledAmount || 0) > 0) ? "Partially Settled" :
                                 challan.status === "SUPERSEDED" ? "Superseded" : 
                                 challan.status === "SETTLED" ? "Settled" : challan.status}
                              </Badge>
                              {/* Settled-by indicator for SUPERSEDED/SETTLED/PAID-via-leading-challan */}
                              {(challan.status === "SUPERSEDED" || challan.status === "SETTLED" || (challan.status === "PAID" && challan.settledByChallanNumber)) && challan.settledByChallanNumber && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground cursor-help">
                                      <CheckCircle2 className="w-2.5 h-2.5 text-green-500 shrink-0" />
                                      <span className="text-green-600 font-medium">via #{challan.settledByChallanNumber}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    {challan.status === "PAID"
                                      ? `Paid indirectly via leading challan #${challan.settledByChallanNumber}`
                                      : challan.status === "SETTLED"
                                      ? `Settled — debt was paid via leading challan #${challan.settledByChallanNumber}`
                                      : `Debt absorbed into challan #${challan.settledByChallanNumber}`}
                                  </TooltipContent>
                                </Tooltip>
                              )}
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
                              {/* Advance Payment Indicator */}
                              {Number(challan.advanceAmount || 0) > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-0.5 text-[9px] text-blue-600 font-bold cursor-help mt-0.5">
                                      <div className="bg-blue-50 px-1 py-0.5 rounded flex items-center gap-0.5 border border-blue-100">
                                        <span className="uppercase tracking-tighter opacity-70">Adv:</span>
                                        <span>PKR {formatAmount(challan.advanceAmount)}</span>
                                        {challan.advanceFromChallanNo && <span className="opacity-70 ml-0.5">via #{challan.advanceFromChallanNo}</span>}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    {`Paid in advance from Challan #${challan.advanceFromChallanNo}`}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="flex gap-1 justify-end">
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

                              {(challan.status !== "PAID" && challan.status !== "SETTLED") ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={async () => {
                                      setEditingChallan(challan);
                                      const isExtraChallan = challan.installmentNumber === 0 || challan.challanType === 'FEE_HEADS_ONLY';
                                      
                                      let fetchedPlan = [];
                                      if (!isExtraChallan) {
                                        try {
                                          const results = await getInstallmentPlans({ studentId: challan.studentId });
                                          fetchedPlan = results[0]?.feeInstallments || [];
                                          setGenStudentPlan(fetchedPlan);
                                        } catch (error) { console.error("Failed to fetch plan for edit:", error); }
                                      }

                                      let autoSelectedArrears = [];
                                      if (!isExtraChallan) {
                                        const targetInst = fetchedPlan.find(inst => inst.installmentNumber === challan.installmentNumber);
                                        const seenInstNums = new Set();
                                        const pastUnpaid = fetchedPlan.filter(inst => {
                                          if (!targetInst || inst.installmentNumber >= targetInst.installmentNumber) return false;
                                          if (seenInstNums.has(inst.installmentNumber)) return false;
                                          seenInstNums.add(inst.installmentNumber);
                                          const pending = inst.pendingAmount != null ? Number(inst.pendingAmount) : (inst.outstandingPrincipal || (Number(inst.basePayable ?? inst.amount ?? 0) - (inst.paidAmount || 0)));
                                          return pending > 0;
                                        });

                                        autoSelectedArrears = pastUnpaid.map(inst => ({
                                          id: inst.id,
                                          installmentNumber: inst.installmentNumber,
                                          amount: inst.pendingAmount != null ? Number(inst.pendingAmount) : (inst.outstandingPrincipal || (Number(inst.basePayable ?? inst.amount ?? 0) - (inst.paidAmount || 0))),
                                          lateFee: inst.lateFeeAccrued != null ? inst.lateFeeAccrued : calculateLateFee(inst.dueDate, lateFeeFine)
                                        }));
                                      }

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
                                            amount: inst.pendingAmount != null ? Number(inst.pendingAmount) : (inst.outstandingPrincipal || (Number(inst.basePayable ?? inst.amount ?? 0) - (inst.paidAmount || 0))),
                                            lateFee: inst.lateFeeAccrued != null ? inst.lateFeeAccrued : calculateLateFee(inst.dueDate, lateFeeFine)
                                          }));
                                        
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
                                        amount: (challan.snapshotBaseAmount || challan.amount || 0).toString(),
                                        dueDate: challan.dueDate ? new Date(challan.dueDate) : null,
                                        remarks: challan.remarks || "",
                                        installmentNumber: (challan.installmentNumber || 0).toString(),
                                        arrearsAmount: (challan.snapshotArrearsAmount || 0).toString(),
                                        arrearsSelections: isExtraChallan ? [] : (snapshotArrears.length > 0 ? snapshotArrears : autoSelectedArrears),
                                        isOtherEnabled: (() => {
                                          if (challan.installment?.extraFine > 0) return true;
                                          try {
                                            const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string') ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []);
                                            return Array.isArray(raw) && raw.some(h => typeof h === 'object' && h !== null && h.id === -1);
                                          } catch (e) { return false; }
                                        })(),
                                        otherAmount: (() => {
                                          if (challan.installment?.extraFine != null) return challan.installment.extraFine.toString();
                                          try {
                                            const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string') ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []);
                                            if (!Array.isArray(raw)) return "0";
                                            const other = raw.find(h => typeof h === 'object' && h !== null && h.id === -1);
                                            return other ? (other.amount || 0).toString() : "0";
                                          } catch (e) { return "0"; }
                                        })(),
                                        selectedHeads: (() => {
                                          if (challan.challanHeads && challan.challanHeads.length > 0) {
                                            return challan.challanHeads.map(h => Number(h.feeHeadId));
                                          }
                                          try {
                                            const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string') ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []);
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
                                          if (challan.installment?.extraFine != null) return challan.installment.extraFine.toString();
                                          try {
                                            const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string') ? JSON.parse(challan.selectedHeads) : (challan.selectedHeads || []);
                                            const snapshotSum = Array.isArray(raw) ? raw.reduce((s, item) => {
                                              if (typeof item === 'object' && item !== null && (item.isSelected !== false) && item.type === 'additional') return s + (item.amount || 0);
                                              return s;
                                            }, 0) : 0;
                                            return snapshotSum > 0 ? snapshotSum.toString() : (challan.fineAmount || 0).toString();
                                          } catch (e) { return (challan.fineAmount || 0).toString(); }
                                        })(),
                                        discount: Math.abs(challan.discount || challan.installment?.discount || 0)
                                      });
                                      setChallanOpen(true);
                                    }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Challan</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" disabled className="cursor-not-allowed text-muted-foreground/50">
                                      <Lock className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {challan.status === "PAID" ? "Paid challans cannot be edited" : "Fully settled challans cannot be edited"}
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => printChallan(challan.id)}>
                                    <Printer className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print Challan</TooltipContent>
                              </Tooltip>

                              {challan.status !== "PAID" && challan.status !== "VOID" && challan.status !== "SUPERSEDED" && challan.status !== "SETTLED" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-success border-success hover:bg-success hover:text-white" onClick={() => handlePayment(challan)}>
                                      Pay
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Record Payment</TooltipContent>
                                </Tooltip>
                              )}

                              {challan.paymentHistory && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => {
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-orange-200 hover:bg-orange-50 gap-2"
                    onClick={() => {
                      setSelectedBulkExtraStudents([]);
                      setExtraSelectedHeads([]);
                      setExtraCustomHeads([]);
                      setExtraRemarks("");
                      setExtraDueDate(null);
                      setBulkExtraChallanOpen(true);
                      setGenerateResults(null);
                    }}
                  >
                    <Layers className="w-4 h-4" /> Bulk Create
                  </Button>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700 gap-2"
                    onClick={() => {
                      setExtraSelectedStudent(null);
                      setExtraSelectedHeads([]);
                      setExtraCustomHeads([]);
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
                        <SelectItem value="void">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setExtraSearch(""); setExtraStatusFilter("all"); setExtraPage(1); }}
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
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Challan No</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Student</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Heads Amount</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Late Fee</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Discount</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-foreground bg-slate-100">Total</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-green-700 bg-green-50">Paid Amount</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Due Date</TableHead>
                        <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs px-3 py-2 text-right font-semibold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isExtraLoading ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8">Loading extra challans...</TableCell></TableRow>
                      ) : extraChallans.map((challan, idx) => (
                        <TableRow key={challan.id} className={idx % 2 === 1 ? "bg-muted/20" : ""}>
                          <TableCell className="text-sm px-3 py-2 font-medium">{challan.challanNumber}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="font-medium">{challan.student?.fName} {challan.student?.lName}</div>
                            <div className="text-xs text-muted-foreground">{challan.student?.rollNumber}</div>
                          </TableCell>
                          <TableCell className="text-sm px-3 py-2 font-medium text-blue-600">
                            PKR {formatAmount((Number(challan.totalAmount || 0) - Number(challan.lateFeeFine || 0) + Number(challan.discount || 0)))}
                          </TableCell>
                          <TableCell className="text-sm px-3 py-2 font-medium text-red-600">PKR {formatAmount(challan.lateFeeFine || 0)}</TableCell>
                          <TableCell className="text-sm px-3 py-2 font-medium text-green-600">PKR {formatAmount(challan.discount || 0)}</TableCell>
                          <TableCell className="text-sm px-3 py-2 font-bold bg-slate-50">
                            PKR {formatAmount(challan.totalAmount || 0)}
                          </TableCell>
                          <TableCell className="text-sm px-3 py-2 text-success font-medium bg-green-50/50">PKR {formatAmount(challan.paidAmount || 0)}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{challan.dueDate ? new Date(challan.dueDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : challan.status === "PARTIAL" ? "secondary" : (challan.status === "VOID" || challan.status === "SUPERSEDED" || challan.status === "SETTLED") ? "outline" : "secondary"}>
                              {challan.status === "VOID" ? "Voided" : 
                               (challan.status === "SUPERSEDED" && (challan.settledAmount || 0) > 0) ? "Partially Settled" :
                               challan.status === "SUPERSEDED" ? "Superseded" : 
                               challan.status === "SETTLED" ? "Settled" : challan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setSelectedChallanDetails({ ...challan, isExtra: true });
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
                              {challan.status !== "PAID" && challan.status !== "VOID" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-success border-success hover:bg-success hover:text-white"
                                      onClick={() => {
                                        const remaining = Number(challan.totalAmount || 0) - Number(challan.paidAmount || 0);
                                        setItemToPay({ ...challan, isExtra: true, challanType: 'FEE_HEADS_ONLY' });
                                        setPaymentAmount(Math.max(0, remaining).toString());
                                        setPaymentDialogOpen(true);
                                      }}
                                    >
                                      Pay
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Record Payment</TooltipContent>
                                </Tooltip>
                              )}
                              {(challan.status !== "PAID" && challan.status !== "SETTLED") ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="ghost" onClick={async () => {
                                  setEditingChallan({ ...challan, isExtra: true });
                                  const isExtraChallan = true; // Always true for this table
                                  
                                  setChallanForm({
                                    ...challanForm,
                                    studentId: (challan.studentId || "").toString(),
                                    amount: "0",
                                    dueDate: challan.dueDate ? new Date(challan.dueDate) : null,
                                    remarks: challan.remarks || "",
                                    installmentNumber: "0",
                                    arrearsAmount: "0",
                                    arrearsSelections: [],
                                    selectedHeads: (challan.heads || []).map(h => {
                                      const globalHead = feeHeads.find(gh => gh.name === h.headName && Number(gh.amount) === Number(h.amount));
                                      return globalHead ? globalHead.id : null;
                                    }).filter(id => id !== null),
                                    month: challan.month || "",
                                    isOtherEnabled: (challan.heads || []).some(h => !feeHeads.some(gh => gh.name === h.headName && Number(gh.amount) === Number(h.amount))),
                                    otherAmount: (challan.heads || [])
                                      .filter(h => !feeHeads.some(gh => gh.name === h.headName && Number(gh.amount) === Number(h.amount)))
                                      .reduce((sum, h) => sum + Number(h.amount), 0).toString(),
                                    fineAmount: (challan.totalAmount || 0).toString(),
                                    discount: 0
                                  });
                                  setChallanOpen(true);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Challan</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="p-2 text-muted-foreground/50 cursor-not-allowed">
                                      <Lock className="w-4 h-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {challan.status === "PAID" ? "Paid challans cannot be edited" : "Fully settled challans cannot be edited"}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setItemToDelete({ 
                                        type: "extraChallan", 
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
                      <TableHead className="py-2 px-3 text-sm">Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Amount</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeHeads.map(head => <TableRow key={head.id}>
                      <TableCell className="text-sm px-3 py-2 font-medium">{head.name}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{head.description}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">PKR {(head.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge>Charge</Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
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
                      <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Class</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Total Amount</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Installments</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map(structure => <TableRow key={structure.id}>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge variant="outline" className="font-normal">
                          {structure.program?.name}
                          {(() => {
                            const dept = departments.find(d => d.id === structure.program?.departmentId);
                            return dept ? ` (${dept.name})` : "";
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">{structure.class?.name}</TableCell>
                      <TableCell className="text-sm px-3 py-2 font-semibold">PKR {structure.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{structure.installments}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
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
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>Fee Collection Summary</CardTitle>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 gap-1.5 text-xs ${
                            reportSessionFilter !== "all" || reportFilter !== "month" || reportTypeFilter !== "all" || reportDateFrom || reportDateTo
                              ? "border-primary text-primary"
                              : ""
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Filters
                          {(reportSessionFilter !== "all" || reportFilter !== "month" || reportTypeFilter !== "all" || reportDateFrom || reportDateTo) && (
                            <span className="ml-0.5 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                              {[reportSessionFilter !== "all" ? 1 : 0, reportFilter !== "month" ? 1 : 0, reportTypeFilter !== "all" ? 1 : 0, (reportDateFrom || reportDateTo) ? 1 : 0].reduce((a, b) => a + b, 0)}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-4 max-h-[80vh] overflow-y-auto" align="end" side="bottom" sideOffset={4}>
                        <div className="space-y-4">
                          <p className="text-sm font-semibold">Report Filters</p>

                          {/* Date Range */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">From</Label>
                                <Input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} className="h-8 text-xs" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">To</Label>
                                <Input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} className="h-8 text-xs" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Session</Label>
                            <Select value={reportSessionFilter} onValueChange={setReportSessionFilter}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="All Sessions" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sessions</SelectItem>
                                {academicSessions.map(s => (
                                  <SelectItem key={s.id} value={s.id.toString()}>{s.name || s.sessionName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Period</Label>
                            <Select value={reportFilter} onValueChange={setReportFilter}>
                              <SelectTrigger className="h-8 text-sm">
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

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Fee Type</Label>
                            <div className="space-y-1">
                              {[
                                { value: "all", label: "All (Installment + Extra)" },
                                { value: "installment", label: "Installment Fee Only" },
                                { value: "extra", label: "Extra Challans Only" },
                              ].map(({ value, label }) => (
                                <label key={value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                                  <input
                                    type="radio"
                                    name="reportType"
                                    className="h-3.5 w-3.5 accent-primary"
                                    checked={reportTypeFilter === value}
                                    onChange={() => setReportTypeFilter(value)}
                                  />
                                  {label}
                                </label>
                              ))}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-muted-foreground text-xs"
                            onClick={() => { setReportSessionFilter("all"); setReportFilter("month"); setReportTypeFilter("all"); setReportDateFrom(""); setReportDateTo(""); }}
                          >
                            <X className="w-3 h-3 mr-1" /> Reset filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Active chips */}
                    {reportSessionFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {academicSessions.find(s => s.id.toString() === reportSessionFilter)?.name || "Session"}
                        <button onClick={() => setReportSessionFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {reportFilter !== "month" && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {reportFilter.charAt(0).toUpperCase() + reportFilter.slice(1)}
                        <button onClick={() => setReportFilter("month")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {reportTypeFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {reportTypeFilter === "installment" ? "Installment Fee" : "Extra Challans"}
                        <button onClick={() => setReportTypeFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {(reportDateFrom || reportDateTo) && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {reportDateFrom && reportDateTo ? `${reportDateFrom} → ${reportDateTo}` : reportDateFrom ? `From ${reportDateFrom}` : `To ${reportDateTo}`}
                        <button onClick={() => { setReportDateFrom(""); setReportDateTo(""); }}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Total Revenue */}
                  <div className="flex justify-between items-center p-4 border rounded-lg bg-success/5">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="font-bold text-2xl text-success">PKR {Math.round(newFeeReportSummary.totalRevenue ?? totalReceived).toLocaleString()}</p>
                    </div>
                    {reportTypeFilter === "all" && (
                      <div className="text-right text-xs text-muted-foreground space-y-0.5">
                        <p>Installment: PKR {Math.round(newFeeReportSummary.regularRevenue ?? 0).toLocaleString()}</p>
                        <p>Extra: PKR {Math.round(newFeeReportSummary.extraRevenue ?? 0).toLocaleString()}</p>
                        {(newFeeReportSummary.hostelRevenue ?? 0) > 0 && (
                          <p>Hostel: PKR {Math.round(newFeeReportSummary.hostelRevenue ?? 0).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Outstanding */}
                  <div className="flex justify-between items-center p-4 border rounded-lg bg-warning/5">
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="font-bold text-2xl text-warning">PKR {Math.round(newFeeReportSummary.totalOutstanding ?? totalPending).toLocaleString()}</p>
                    </div>
                    {reportTypeFilter === "all" && (
                      <div className="text-right text-xs text-muted-foreground space-y-0.5">
                        <p>Installment: PKR {Math.round(newFeeReportSummary.installmentOutstanding ?? 0).toLocaleString()}</p>
                        <p>Extra: PKR {Math.round(newFeeReportSummary.extraOutstanding ?? 0).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Collection rate */}
                  {(() => {
                    const rev = newFeeReportSummary.totalRevenue ?? 0;
                    const out = newFeeReportSummary.totalOutstanding ?? 0;
                    const total = rev + out;
                    const rate = total > 0 ? Math.round((rev / total) * 100) : 0;
                    return total > 0 ? (
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Collection Rate</span>
                          <span className="font-semibold text-foreground">{rate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-success h-2 rounded-full transition-all"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* ── Revenue Over Time ── */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue Over Time</CardTitle>
                  <p className="text-xs text-muted-foreground">Last 24 months — installment fee vs extra challans</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={newFeeAnalytics?.timeline?.length ? newFeeAnalytics.timeline : newRevenueOverTime.length > 0 ? newRevenueOverTime : revenueData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                      >
                        <defs>
                          <linearGradient id="colorInst" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          interval={1}
                          tickFormatter={(v) => {
                            if (!v || !v.includes('-')) return v;
                            const [yr, mo] = v.split('-');
                            const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo) - 1];
                            return `${monthShort} ${yr.slice(2)}`;
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                          width={45}
                        />
                        <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} />
                        <Legend
                          verticalAlign="top"
                          height={28}
                          formatter={(v) => v === 'installment' ? 'Installment Fee' : v === 'extra' ? 'Extra Challans' : 'Total'}
                          wrapperStyle={{ fontSize: 11 }}
                        />
                        {(newRevenueOverTime[0]?.installment !== undefined) ? (
                          <>
                            <Area type="monotone" dataKey="installment" name="installment" stroke="#6366f1" strokeWidth={2} fill="url(#colorInst)" dot={false} activeDot={{ r: 4 }} />
                            <Area type="monotone" dataKey="extra" name="extra" stroke="#f59e0b" strokeWidth={2} fill="url(#colorExtra)" dot={false} activeDot={{ r: 4 }} />
                          </>
                        ) : (
                          <Area type="monotone" dataKey="value" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorInst)" dot={false} activeDot={{ r: 4 }} />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* ── Collection vs Outstanding Per Class ── */}
              <Card className="col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Collection vs Outstanding (Per Class)</CardTitle>
                  <p className="text-xs text-muted-foreground">Collected amount vs pending outstanding per class</p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const chartData = newFeeAnalytics?.classComparison?.length ? newFeeAnalytics.classComparison : newClassStats.length > 0 ? newClassStats : classCollectionData;
                    if (!chartData || chartData.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                          No class data available
                        </div>
                      );
                    }
                    const barH = Math.max(28, Math.min(40, 320 / chartData.length));
                    const chartH = Math.max(320, chartData.length * (barH + 12) + 60);
                    return (
                      <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
                        <div style={{ height: chartH }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={chartData}
                              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                              barCategoryGap="20%"
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                tick={{ fontSize: 11 }}
                                interval={0}
                              />
                              <RechartsTooltip
                                formatter={(value, name) => [`PKR ${Number(value).toLocaleString()}`, name === 'collected' ? 'Collected' : 'Outstanding']}
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                              />
                              <Legend
                                verticalAlign="top"
                                height={28}
                                wrapperStyle={{ fontSize: 11 }}
                              />
                              <Bar dataKey="collected" name="Collected" fill="#4ade80" radius={[0, 4, 4, 0]} barSize={barH * 0.45} />
                              <Bar dataKey="outstanding" name="Outstanding" fill="#fb923c" radius={[0, 4, 4, 0]} barSize={barH * 0.45} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })()}
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
                  <Label htmlFor="lateFeeRatePerDay">Installment Late Fee Rate Per Day</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="lateFeeRatePerDay"
                      type="number"
                      value={lateFeeRatePerDay}
                      onChange={(e) => setLateFeeRatePerDay(parseFloat(e.target.value) || 0)}
                      placeholder="Enter rate per day"
                    />
                    <Button
                      onClick={() => updateNewFeeSettingsMutation.mutate({ lateFeeRatePerDay })}
                      disabled={updateNewFeeSettingsMutation.isPending}
                    >
                      {updateNewFeeSettingsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Global default rate used when creating new fee installments.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="extraChallanLateFee">Extra Challan Late Fee Rate Per Day</Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="extraChallanLateFee"
                      type="number"
                      value={extraChallanLateFee}
                      onChange={(e) => setExtraChallanLateFee(parseFloat(e.target.value) || 0)}
                      placeholder="Enter extra challan rate"
                    />
                    <Button
                      onClick={() => updateNewFeeSettingsMutation.mutate({ extraChallanLateFee })}
                      disabled={updateNewFeeSettingsMutation.isPending}
                    >
                      {updateNewFeeSettingsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Global default rate used for non-tuition/extra challans (Prospectus, Allied Charges, etc).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Student History Tab ── */}
        <TabsContent value="student-history" className="space-y-6">
          {/* Student Search */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Student Fee History
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Search for a student to view their complete fee installment history.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Search Student</Label>
                  <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {selectedStudent
                          ? `${selectedStudent.fName} ${selectedStudent.lName || ''} (${selectedStudent.rollNumber})`
                          : "Search by name or roll number..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Type name or roll number..."
                          onValueChange={(v) => handleStudentSearch(v, setStudentSearchResults)}
                        />
                        <CommandList>
                          <CommandEmpty>No students found.</CommandEmpty>
                          <CommandGroup>
                            {studentSearchResults.map((student) => (
                              <CommandItem
                                key={student.id}
                                value={student.id.toString()}
                                onSelect={() => {
                                  setSelectedStudent(student);
                                  setStudentSearchOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedStudent?.id === student.id ? "opacity-100" : "opacity-0")} />
                                {student.rollNumber} — {student.fName} {student.lName || ''}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {selectedStudent && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Selected student info */}
              {selectedStudent && (
                <div className="mt-4 p-3 rounded-lg bg-muted/40 border text-sm flex flex-wrap gap-4">
                  <span><span className="font-medium">Name:</span> {selectedStudent.fName} {selectedStudent.lName || ''}</span>
                  <span><span className="font-medium">Roll No:</span> {selectedStudent.rollNumber}</span>
                  {selectedStudent.class?.name && <span><span className="font-medium">Class:</span> {selectedStudent.class.name}</span>}
                  {selectedStudent.section?.name && <span><span className="font-medium">Section:</span> {selectedStudent.section.name}</span>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Installments (New System) */}
          {selectedStudent && (
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-base">Fee Installments</CardTitle>
                  {/* Session & Status Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 gap-1.5 text-xs ${
                            historySessionFilter !== "all" || historyStatusFilter !== "all"
                              ? "border-primary text-primary"
                              : ""
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Filters
                          {(historySessionFilter !== "all" || historyStatusFilter !== "all") && (
                            <span className="ml-0.5 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                              {[historySessionFilter !== "all" ? 1 : 0, historyStatusFilter !== "all" ? 1 : 0].reduce((a, b) => a + b, 0)}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-4 max-h-[80vh] overflow-y-auto" align="end" side="bottom" sideOffset={4}>
                        <div className="space-y-4">
                          <p className="text-sm font-semibold">Filters</p>

                          {/* Session */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Session</Label>
                            <Select value={historySessionFilter} onValueChange={setHistorySessionFilter}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="All Sessions" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sessions</SelectItem>
                                {(academicSessions || []).map((s) => (
                                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Status */}
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { value: "PENDING", label: "Pending" },
                                { value: "PARTIAL", label: "Partial" },
                                { value: "PAID", label: "Paid" },
                                { value: "OVERDUE", label: "Overdue" },
                                { value: "VOID", label: "Void" },
                                { value: "SUPERSEDED", label: "Superseded" },
                                { value: "SETTLED", label: "Settled" },
                              ].map(({ value, label }) => (
                                <label key={value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                                  <input
                                    type="radio"
                                    name="historyStatus"
                                    className="h-3.5 w-3.5 accent-primary"
                                    checked={historyStatusFilter === value}
                                    onChange={() => setHistoryStatusFilter(value)}
                                  />
                                  {label}
                                </label>
                              ))}
                              <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm col-span-2">
                                <input
                                  type="radio"
                                  name="historyStatus"
                                  className="h-3.5 w-3.5 accent-primary"
                                  checked={historyStatusFilter === "all"}
                                  onChange={() => setHistoryStatusFilter("all")}
                                />
                                All Statuses
                              </label>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-muted-foreground text-xs"
                            onClick={() => {
                              setHistorySessionFilter("all");
                              setHistoryStatusFilter("all");
                            }}
                          >
                            <X className="w-3 h-3 mr-1" /> Reset filters
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Active filter chips */}
                    {historySessionFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {academicSessions.find(s => String(s.id) === historySessionFilter)?.name || "Session"}
                        <button onClick={() => setHistorySessionFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                    {historyStatusFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                        {historyStatusFilter.charAt(0) + historyStatusFilter.slice(1).toLowerCase()}
                        <button onClick={() => setHistoryStatusFilter("all")}><X className="w-3 h-3" /></button>
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isInstallmentsLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Loading installments...
                  </div>
                ) : (() => {
                  // Apply session and status filters
                  const filtered = studentInstallments.filter((inst) => {
                    const sessionMatch = historySessionFilter === "all" || String(inst.sessionId) === historySessionFilter;
                    const statusMatch = historyStatusFilter === "all" || inst.status === historyStatusFilter;
                    return sessionMatch && statusMatch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-10 text-muted-foreground text-sm">
                        No installments found{historySessionFilter !== "all" || historyStatusFilter !== "all" ? " for the selected filters" : ""}.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {filtered.map((inst) => (
                        <div key={inst.id} className="border rounded-lg overflow-hidden">
                          {/* Installment header row */}
                          <div className="bg-muted/30 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 items-center text-sm border-b">
                            <span className="font-semibold text-base">#{inst.installmentNumber}</span>
                            {inst.month && <span className="text-muted-foreground">{inst.month}</span>}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                inst.status === "PAID" && "border-green-500 text-green-600",
                                inst.status === "PARTIAL" && "border-yellow-500 text-yellow-600",
                                inst.status === "PENDING" && "border-orange-400 text-orange-500",
                                inst.status === "VOID" && "border-red-400 text-red-500",
                                inst.status === "SUPERSEDED" && "border-gray-400 text-gray-500"
                              )}
                            >
                              {inst.status}
                            </Badge>
                            {inst.challanGenerated && (
                              <Badge variant="secondary" className="text-xs">Challan Generated</Badge>
                            )}
                            {inst.isLocked && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                            {inst.dueDate && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                Due: {new Date(inst.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Installment amounts table */}
                          <div className="overflow-x-auto border-t">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/60 border-b">
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Base Payable</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Arrears</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Late Fee</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Discount</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-foreground bg-slate-100">Total Amount</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-green-700 bg-green-50">Paid Amount</th>
                                  <th className="text-left px-4 py-2 text-xs font-semibold text-orange-700 bg-orange-50">Pending Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b last:border-0">
                                  <td className="px-4 py-2.5 text-sm">{formatAmount(inst.basePayable)}</td>
                                  <td className="px-4 py-2.5 text-sm">{Number(inst.arrears) > 0 ? <span className="text-orange-600 font-medium">{formatAmount(inst.arrears)}</span> : <span className="text-muted-foreground">0</span>}</td>
                                  <td className="px-4 py-2.5 text-sm">{Number(inst.lateFeeFine) > 0 ? <span className="text-red-500">{formatAmount(inst.lateFeeFine)}</span> : <span className="text-muted-foreground">0</span>}</td>
                                  <td className="px-4 py-2.5 text-sm">{Number(inst.discount) !== 0 ? <span className="text-blue-600">{formatAmount(inst.discount)}</span> : <span className="text-muted-foreground">0</span>}</td>
                                  <td className="px-4 py-2.5 text-sm font-semibold bg-slate-50">{formatAmount(inst.totalAmount)}</td>
                                  <td className="px-4 py-2.5 text-sm font-semibold text-green-600 bg-green-50/50">{formatAmount(inst.paidAmount)}</td>
                                  <td className={cn("px-4 py-2.5 text-sm font-semibold bg-orange-50/50", Number(inst.pendingAmount) > 0 ? "text-orange-600" : "text-green-600")}>
                                    {formatAmount(inst.pendingAmount)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Linked challans */}
                          {inst.challans && inst.challans.length > 0 && (
                            <div className="border-t">
                              <div className="px-4 py-2 bg-slate-50 border-b">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked Challans</p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 border-b">
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Challan #</th>
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Generated</th>
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Base</th>
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Arrears</th>
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Late Fee</th>
                                      <th className="text-left px-4 py-2 font-semibold text-foreground bg-slate-100">Total Due</th>
                                      <th className="text-left px-4 py-2 font-semibold text-green-700 bg-green-50">Received</th>
                                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inst.challans.map((challan, ci) => (
                                      <tr key={challan.id} className={cn("border-b last:border-0", ci % 2 === 1 && "bg-muted/20")}>
                                        <td className="px-4 py-2.5 font-mono font-semibold text-primary">{challan.challanNumber}</td>
                                        <td className="px-4 py-2.5 text-muted-foreground">{challan.generatedDate ? new Date(challan.generatedDate).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-2.5">{formatAmount(challan.snapshotBaseAmount)}</td>
                                        <td className="px-4 py-2.5">{Number(challan.snapshotArrearsAmount) > 0 ? <span className="text-orange-600">{formatAmount(challan.snapshotArrearsAmount)}</span> : <span className="text-muted-foreground">0</span>}</td>
                                        <td className="px-4 py-2.5">{Number(challan.snapshotLateFee) > 0 ? <span className="text-red-500">{formatAmount(challan.snapshotLateFee)}</span> : <span className="text-muted-foreground">0</span>}</td>
                                        <td className="px-4 py-2.5 font-semibold bg-slate-50">{formatAmount(challan.snapshotTotalDue)}</td>
                                        <td className="px-4 py-2.5 font-semibold text-green-600 bg-green-50/50">{formatAmount(challan.amountReceived)}</td>
                                        <td className="px-4 py-2.5">
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-xs",
                                              challan.status === "PAID" && "bg-green-50 border-green-400 text-green-700",
                                              challan.status === "PARTIAL" && "bg-yellow-50 border-yellow-400 text-yellow-700",
                                              challan.status === "PENDING" && "bg-orange-50 border-orange-400 text-orange-600",
                                              challan.status === "OVERDUE" && "bg-red-50 border-red-500 text-red-600",
                                              challan.status === "VOID" && "bg-slate-50 border-slate-400 text-slate-500",
                                              challan.status === "SUPERSEDED" && "bg-slate-50 border-slate-400 text-slate-500",
                                              challan.status === "SETTLED" && "bg-blue-50 border-blue-400 text-blue-600"
                                            )}
                                          >
                                            {challan.status}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
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
          setIsPaymentLoading(false);
          resetChallanForm();
        }
      }}>
         <DialogContent className="min-w-[92dvw] h-[100dvh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="bg-white border-b p-4">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg font-bold text-slate-800">
                {itemToPay?.challanType === 'FEE_HEADS_ONLY' ? 'Pay Extra Challan' : 'Pay Students Fee'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {itemToPay && (
            <div className="p-1 space-y-6">
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
              {(() => {
                const isExtraC = itemToPay.isExtra === true || itemToPay.challanType === 'FEE_HEADS_ONLY';
                const base = isExtraC
                  ? (Number(itemToPay.totalAmount ?? 0) - Number(itemToPay.lateFeeFine ?? 0) + Number(itemToPay.discount ?? 0))
                  : Number(itemToPay.snapshotBaseAmount ?? itemToPay.amount ?? 0);
                const arrears = isExtraC ? 0 : Number(itemToPay.snapshotArrearsAmount ?? 0);
                const lateFee = Number(itemToPay.snapshotLateFee ?? itemToPay.lateFeeFine ?? 0);
                const totalDue = isExtraC
                  ? Number(itemToPay.totalAmount ?? 0)
                  : Number(itemToPay.snapshotTotalDue ?? (base + arrears + lateFee));
                // Use normalized paidAmount (direct payment on this challan, excluding advance credits)
                const alreadyPaid = Number(itemToPay.paidAmount || 0);
                const remaining = Math.max(0, totalDue - alreadyPaid - (parseFloat(paymentAmount) || 0));
                const student = itemToPay.student;
                const studentClass = itemToPay.studentClass?.name || student?.class?.name || 'N/A';

                return (
                  <div className="border border-slate-300 rounded overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white text-[10px] font-bold text-center">
                          <th className="border-r border-slate-600 p-1.5">Roll No</th>
                          <th className="border-r border-slate-600 p-1.5">Student</th>
                          <th className="border-r border-slate-600 p-1.5">Class</th>
                          <th className="border-r border-slate-600 p-1.5">{itemToPay.challanType === 'FEE_HEADS_ONLY' ? 'Type' : 'Month'}</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[80px]">{itemToPay.challanType === 'FEE_HEADS_ONLY' ? 'Total' : 'Base Fee'}</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[80px]">Arrears</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[80px]">Late Fee</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[80px]">Total Due</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[65px]">Paid</th>
                          <th className="border-r border-slate-600 p-1.5 min-w-[100px]">
                            <div className="flex flex-col gap-0.5 items-center">
                              <span>Receiving</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 px-1 text-[8px] bg-white text-slate-800 hover:bg-slate-100 font-bold"
                                onClick={() => {
                                  const full = Math.max(0, totalDue - alreadyPaid);
                                  setPaymentAmount(full.toString());
                                }}
                              >
                                Fill All
                              </Button>
                            </div>
                          </th>
                          <th className="p-1.5 min-w-[80px]">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-[11px] text-center bg-white h-12">
                          <td className="border-r border-slate-200 p-2">{student?.rollNumber}</td>
                          <td className="border-r border-slate-200 p-2 text-left px-3">
                            <div className="text-blue-600 font-medium">{student?.fName} {student?.lName}</div>
                            <div className="text-[9px] text-slate-500">{student?.fatherOrguardian || ''}</div>
                          </td>
                          <td className="border-r border-slate-200 p-2">{studentClass}</td>
                          <td className="border-r border-slate-200 p-2 font-bold text-slate-800">
                            {itemToPay.challanType === 'FEE_HEADS_ONLY'
                              ? <span className="text-purple-700 text-[10px] font-black">EXTRA CHALLAN</span>
                              : (itemToPay.month || (itemToPay.installmentNo ? `Inst #${itemToPay.installmentNo}` : 'N/A'))}
                          </td>
                          <td className="border-r border-slate-200 p-2 font-medium">{base.toLocaleString()}</td>
                          <td className="border-r border-slate-200 p-2 text-orange-600 font-bold">
                            {arrears > 0 ? arrears.toLocaleString() : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="border-r border-slate-200 p-2 text-red-600 font-bold">
                            {lateFee > 0 ? lateFee.toLocaleString() : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="border-r border-slate-200 p-2 font-bold text-slate-900">{totalDue.toLocaleString()}</td>
                          <td className="border-r border-slate-200 p-2 text-green-600">{alreadyPaid.toLocaleString()}</td>
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
                            <div className={`border border-slate-300 rounded px-1 py-1.5 h-8 flex flex-col items-center justify-center font-bold text-sm ${remaining < 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600'}`}>
                               <div>
                                 {remaining < 0
                                   ? `${Math.abs(remaining).toLocaleString()} Advance`
                                   : remaining.toLocaleString()}
                               </div>
                               {remaining < 0 && (
                                 <div className="text-[9px] font-medium opacity-80 uppercase tracking-tighter">
                                   To Inst #{Number(itemToPay.installmentNumber || 0) + 1}
                                 </div>
                               )}
                             </div>
                          </td>
                        </tr>
                        {/* Grand Total Row */}
                        <tr className="bg-slate-800 text-white font-bold h-10 border-t border-slate-600 text-[12px] text-center">
                          <td colSpan={4} className="text-left px-4 border-r border-slate-600 uppercase tracking-wider">Grand Total</td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-slate-800 px-2 py-1 rounded h-7 flex items-center justify-center font-black">{base.toLocaleString()}</div>
                          </td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-orange-600 px-2 py-1 rounded h-7 flex items-center justify-center font-black">{arrears.toLocaleString()}</div>
                          </td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-red-600 px-2 py-1 rounded h-7 flex items-center justify-center">{lateFee.toLocaleString()}</div>
                          </td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-slate-800 px-2 py-1 rounded h-7 flex items-center justify-center font-black">{totalDue.toLocaleString()}</div>
                          </td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-green-600 px-2 py-1 rounded h-7 flex items-center justify-center">{alreadyPaid.toLocaleString()}</div>
                          </td>
                          <td className="border-r border-slate-600 p-1">
                            <div className="bg-white text-slate-800 px-2 py-1 rounded h-7 flex items-center justify-center font-black">{(parseFloat(paymentAmount) || 0).toLocaleString()}</div>
                          </td>
                          <td className="p-1">
                             <div className={`bg-white px-2 py-1 rounded h-7 flex flex-col items-center justify-center font-black ${remaining < 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                               <div className="text-[11px] leading-tight">
                                 {remaining < 0 ? `${Math.abs(remaining).toLocaleString()} (Adv)` : remaining.toLocaleString()}
                               </div>
                               {remaining < 0 && (
                                 <div className="text-[8px] font-bold opacity-70 leading-none">
                                   NEXT: #{Number(itemToPay.installmentNumber || 0) + 1}
                                 </div>
                               )}
                             </div>
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Extra Challan — Fee Heads Breakdown */}
              {itemToPay?.challanType === 'FEE_HEADS_ONLY' && (itemToPay?.heads?.length ?? 0) > 0 && (
                <div className="border border-purple-200 rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-4 py-2 border-b border-purple-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-800">Fee Heads Breakdown</span>
                  </div>
                  <div className="divide-y divide-purple-100">
                    {itemToPay.heads.map((h, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                        <span className="text-slate-700">{h.headName}</span>
                        <span className="font-medium text-slate-900">PKR {Number(h.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    {Number(itemToPay.lateFeeFine ?? 0) > 0 && (
                      <div className="flex justify-between items-center px-4 py-2 text-sm text-red-600">
                        <span>Late Fee Fine</span>
                        <span className="font-medium">PKR {Number(itemToPay.lateFeeFine).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-4 py-2 text-sm font-bold bg-purple-50">
                      <span className="text-purple-900">Total Due</span>
                      <span className="text-purple-900">PKR {Number(itemToPay.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

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
                   disabled={isPaymentLoading || updateChallanMutation.isPending || itemToPay?.status === 'VOID'}
                   className={`px-8 h-10 font-bold rounded ${itemToPay?.status === 'VOID' ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                 >
                   {(isPaymentLoading || updateChallanMutation.isPending) ? "Processing..." : itemToPay?.status === 'VOID' ? "Superseded" : "Pay Fee"}
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
            <AlertDialogTitle className={itemToDelete?.type === "challan" && itemToDelete?.status === "PAID" ? "text-destructive" : ""}>
              {itemToDelete?.type === "challan" ? `Delete Challan #${itemToDelete.number}` : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {itemToDelete?.type === "challan" ? (
                <div className="space-y-3">
                  {itemToDelete.status === "PAID" ? (
                    <>
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                        <p className="font-semibold text-destructive text-sm flex items-center gap-1.5">
                          ⚠️ You are deleting a PAID challan
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-destructive/80">
                          <li>All recorded payments on this challan will be <strong>permanently erased</strong>.</li>
                          <li>Any installments that were <strong>settled</strong> by this payment will be restored to <strong>SUPERSEDED</strong> (unpaid) state.</li>
                          <li>The student's installment plan will be reset as if this challan was never paid.</li>
                        </ul>
                      </div>
                      <p className="font-bold text-destructive text-sm">
                        ⛔ This action is irreversible. Deleted payment records cannot be recovered.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm">Are you sure you want to delete this challan? This action will:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Restore the original amounts in the student's installment plan.</li>
                        <li>Remove the challan record permanently.</li>
                      </ul>
                      <p className="font-bold text-destructive text-sm mt-2">This action cannot be undone.</p>
                    </div>
                  )}
                </div>
              ) : (
                <span>This action cannot be undone.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChallanMutation.isPending ? "Deleting..." : (itemToDelete?.status === "PAID" ? "Delete Paid Challan" : "Delete")}
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
          setExtraCustomHeads([]);
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

                  {/* Custom Fee Heads Section */}
                  <div className="mt-4 pt-3 border-t border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-bold text-orange-700 uppercase">Custom Fee Heads</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold"
                        onClick={() => setExtraCustomHeads([...extraCustomHeads, { headName: "", amount: "" }])}
                      >
                        <PlusCircle className="w-3 h-3 mr-1" /> Add Head
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {extraCustomHeads.map((ch, idx) => (
                        <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                          <Input
                            placeholder="Head Name (e.g. Library Fine)"
                            value={ch.headName}
                            onChange={(e) => {
                              const newHeads = [...extraCustomHeads];
                              newHeads[idx].headName = e.target.value;
                              setExtraCustomHeads(newHeads);
                            }}
                            className="h-8 text-xs flex-1"
                          />
                          <div className="relative w-28">
                            <span className="absolute left-1.5 top-2 text-[10px] text-muted-foreground">Rs.</span>
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={ch.amount}
                              onChange={(e) => {
                                const newHeads = [...extraCustomHeads];
                                newHeads[idx].amount = e.target.value;
                                setExtraCustomHeads(newHeads);
                              }}
                              className="h-8 text-xs pl-6"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setExtraCustomHeads(extraCustomHeads.filter((_, i) => i !== idx))}
                          >
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {extraCustomHeads.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic text-center py-2 bg-slate-50 rounded border border-dashed">
                          No custom heads added yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Remarks</Label>
                  <Textarea value={extraRemarks} onChange={e => setExtraRemarks(e.target.value)} placeholder="Optional notes..." className="text-sm min-h-[60px]" />
                </div>

                {(extraSelectedHeads.length > 0 || extraCustomHeads.some(h => h.headName && parseFloat(h.amount) > 0)) && (() => {
                  const charges = feeHeads.filter(h => extraSelectedHeads.includes(h.id)).reduce((s, h) => s + h.amount, 0);
                  const customCharges = extraCustomHeads.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0);
                  const finalCharges = charges + customCharges;
                  
                  // Calculate Late Fee for preview
                  const autoLateFee = calculateLateFee(extraDueDate, extraChallanLateFee);
                  const grandTotal = finalCharges + autoLateFee;

                  return (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Base Charges:</span><span>PKR {finalCharges.toLocaleString()}</span>
                      </div>
                      {autoLateFee > 0 && (
                        <div className="flex justify-between text-xs text-red-600 font-medium">
                          <span>Late Fee Fine:</span><span>+ PKR {autoLateFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t border-orange-300 mt-1 pt-1 text-orange-800">
                        <span>Grand Total:</span><span>PKR {grandTotal.toLocaleString()}</span>
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
                disabled={(() => {
                  const charges = feeHeads.filter(h => extraSelectedHeads.includes(h.id)).reduce((s, h) => s + h.amount, 0);
                  const customCharges = extraCustomHeads.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0);
                  const finalCharges = charges + customCharges;
                  return !extraSelectedStudent || finalCharges <= 0 || !extraDueDate || isGenerating;
                })()}
                onClick={async () => {
                   setIsGenerating(true);
                   try {
                     const headsPayload = feeHeads
                       .filter(h => extraSelectedHeads.includes(h.id))
                       .map(h => ({ headName: h.name, amount: h.amount }));

                     // Add custom heads
                     extraCustomHeads.forEach(ch => {
                       if (ch.headName && parseFloat(ch.amount) > 0) {
                         headsPayload.push({ headName: ch.headName, amount: parseFloat(ch.amount) });
                       }
                     });

                      const result = await generateExtraChallan({
                        studentId: extraSelectedStudent.id,
                        heads: headsPayload,
                        dueDate: format(extraDueDate, "yyyy-MM-dd"),
                        remarks: extraRemarks || "Extra fee head challan",
                      });

                     if (result) {
                       toast({ title: "Extra challan created successfully" });
                       queryClient.invalidateQueries(['feeChallans']);
                       queryClient.invalidateQueries(['extraChallans']);
                       setCreateExtraChallanOpen(false);
                     } else {
                       toast({ title: "Could not create challan.", variant: "destructive" });
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

      {/* Bulk Extra Challan Dialog */}
      <Dialog open={bulkExtraChallanOpen} onOpenChange={(open) => {
        setBulkExtraChallanOpen(open);
        if (!open) {
          setSelectedBulkExtraStudents([]);
          setExtraSelectedHeads([]);
          setExtraCustomHeads([]);
          setExtraRemarks("");
          setExtraDueDate(null);
          setGenerateResults(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Bulk Generate Extra Challans
            </DialogTitle>
          </DialogHeader>

          {generateResults ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Generation Results</h3>
                <Button variant="outline" size="sm" onClick={() => setGenerateResults(null)}>Back to Selection</Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Challan #</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generateResults.map((res, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{res.studentName}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px] h-5", res.status === 'CREATED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {res.status}
                          </Badge>
                          {res.reason && <p className="text-[9px] text-red-500 italic mt-0.5">{res.reason}</p>}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{res.challanNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          {res.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => printChallan(res.id)}
                            >
                              <Printer className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setBulkExtraChallanOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {/* Step 1: Student Selection Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-xl border border-dashed">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Program</Label>
                  <Select value={generateForm.programId} onValueChange={(v) => setGenerateForm({ ...generateForm, programId: v, classId: "all", sectionId: "all" })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Programs" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Class</Label>
                  <Select value={generateForm.classId} onValueChange={(v) => setGenerateForm({ ...generateForm, classId: v, sectionId: "all" })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.filter(c => generateForm.programId === "all" || c.programId.toString() === generateForm.programId).map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Section</Label>
                  <Select value={generateForm.sectionId} onValueChange={(v) => setGenerateForm({ ...generateForm, sectionId: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Sections" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {classes.find(c => c.id === Number(generateForm.classId))?.sections?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Step 2: Student List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Select Students ({selectedBulkExtraStudents.length})</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => setSelectedBulkExtraStudents(bulkStudents.map(s => s.id))}
                    >
                      Select All Visible
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-red-500"
                      onClick={() => setSelectedBulkExtraStudents([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  <Table>
                    <TableBody>
                      {isFetchingBulkStudents ? (
                        <TableRow><TableCell className="text-center py-4 text-xs text-muted-foreground animate-pulse">Fetching students...</TableCell></TableRow>
                      ) : bulkStudents.length === 0 ? (
                        <TableRow><TableCell className="text-center py-4 text-xs text-muted-foreground italic">No students match the filters.</TableCell></TableRow>
                      ) : (
                        bulkStudents.map(student => (
                          <TableRow key={student.id} className="h-9">
                            <TableCell className="w-10 text-center p-0">
                              <input
                                type="checkbox"
                                className="accent-orange-600 h-3.5 w-3.5 cursor-pointer"
                                checked={selectedBulkExtraStudents.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedBulkExtraStudents([...selectedBulkExtraStudents, student.id]);
                                  else setSelectedBulkExtraStudents(selectedBulkExtraStudents.filter(id => id !== student.id));
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-medium py-1 px-2">
                              {student.fName} {student.lName || ""}
                              <span className="text-[10px] text-muted-foreground ml-2 uppercase">({student.rollNumber})</span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Step 3: Fee Heads & Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-orange-50/30 rounded-xl border border-orange-100">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-orange-700">Fee Heads</Label>
                    <div className="grid grid-cols-1 gap-1.5 mt-2">
                      {feeHeads.filter(h => !h.isTuition).map(head => (
                        <label key={head.id} className="flex items-center gap-2 p-1.5 border rounded-lg bg-white cursor-pointer hover:border-orange-300 transition-colors">
                          <input
                            type="checkbox"
                            className="accent-orange-600 h-3.5 w-3.5"
                            checked={extraSelectedHeads.includes(head.id)}
                            onChange={(e) => {
                              if (e.target.checked) setExtraSelectedHeads([...extraSelectedHeads, head.id]);
                              else setExtraSelectedHeads(extraSelectedHeads.filter(id => id !== head.id));
                            }}
                          />
                          <span className="text-[11px] font-medium flex-1">{head.name}</span>
                          <span className="text-[10px] text-muted-foreground">PKR {head.amount.toLocaleString()}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-orange-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-[10px] font-bold text-orange-700 uppercase">Custom Heads</Label>
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] font-bold" onClick={() => setExtraCustomHeads([...extraCustomHeads, { headName: "", amount: "" }])}>+ Add</Button>
                      </div>
                      <div className="space-y-1.5">
                        {extraCustomHeads.map((ch, idx) => (
                          <div key={idx} className="flex gap-1.5 items-center">
                            <Input placeholder="Name" value={ch.headName} onChange={e => { const n = [...extraCustomHeads]; n[idx].headName = e.target.value; setExtraCustomHeads(n); }} className="h-7 text-[10px] flex-1" />
                            <Input placeholder="Amt" type="number" value={ch.amount} onChange={e => { const n = [...extraCustomHeads]; n[idx].amount = e.target.value; setExtraCustomHeads(n); }} className="h-7 text-[10px] w-20" />
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setExtraCustomHeads(extraCustomHeads.filter((_, i) => i !== idx))}><MinusCircle className="w-3.5 h-3.5" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-orange-700">Common Config</Label>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full h-8 text-xs justify-start text-left font-normal", !extraDueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {extraDueDate ? format(extraDueDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={extraDueDate} onSelect={setExtraDueDate} initialFocus /></PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Common Remarks</Label>
                      <Textarea value={extraRemarks} onChange={e => setExtraRemarks(e.target.value)} placeholder="e.g. Annual Sports Fee" className="text-xs min-h-[60px]" />
                    </div>
                  </div>

                  <div className="p-3 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold opacity-80">Students</span>
                      <span className="font-black text-sm">{selectedBulkExtraStudents.length}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold opacity-80">Per Student</span>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-sm">
                          PKR {(
                            feeHeads.filter(h => extraSelectedHeads.includes(h.id)).reduce((s, h) => s + h.amount, 0) +
                            extraCustomHeads.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0) +
                            calculateLateFee(extraDueDate, extraChallanLateFee)
                          ).toLocaleString()}
                        </span>
                        {calculateLateFee(extraDueDate, extraChallanLateFee) > 0 && (
                          <span className="text-[8px] font-bold opacity-70">
                            Incl. PKR {calculateLateFee(extraDueDate, extraChallanLateFee).toLocaleString()} Late Fee
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full bg-white text-orange-700 hover:bg-orange-50 font-bold h-9 mt-1"
                      disabled={(() => {
                        const charges = feeHeads.filter(h => extraSelectedHeads.includes(h.id)).reduce((s, h) => s + h.amount, 0);
                        const customCharges = extraCustomHeads.reduce((s, h) => s + (parseFloat(h.amount) || 0), 0);
                        const finalCharges = charges + customCharges;
                        return selectedBulkExtraStudents.length === 0 || finalCharges <= 0 || !extraDueDate || isGenerating;
                      })()}
                      onClick={async () => {
                        setIsGenerating(true);
                        const headsPayload = extraCustomHeads.filter(ch => ch.headName && parseFloat(ch.amount) > 0).map(ch => ({ headName: ch.headName, amount: parseFloat(ch.amount) }));

                        bulkGenerateExtraChallansMutation.mutate({
                          studentIds: selectedBulkExtraStudents,
                          feeHeadIds: extraSelectedHeads,
                          heads: headsPayload,
                          dueDate: format(extraDueDate, "yyyy-MM-dd"),
                          remarks: extraRemarks || "Bulk extra challan generation"
                        });
                      }}
                    >
                      {isGenerating ? "Generating..." : "Generate Bulk"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={challanOpen} onOpenChange={(open) => {
        setChallanOpen(open);
        if (!open) {
          resetChallanForm();
        }
      }}>
        <DialogContent className="max-w-4xl p-1 md:p-1 max-h-[96vh] flex flex-col overflow-hidden">
          <DialogHeader className="pb-1 border-b mb-0">
            <DialogTitle className="text-base font-bold">
              {parseInt(challanForm.installmentNumber) > 0 ? "Edit Fee Challan" : "Edit Extra Fee Challan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 py-0 overflow-y-auto overflow-x-hidden pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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
                  <div className="flex justify-between items-center bg-red-50 p-2 rounded-md border border-red-100 italic transition-all animate-in fade-in slide-in-">
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

                {/* Task 11.4: Discount field — calls PATCH /fee/installments/:id when installment is linked */}
                {parseInt(challanForm.installmentNumber) > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-green-700 uppercase italic px-1 flex items-center gap-1">
                      <MinusCircle className="w-3 h-3" /> DISCOUNT / SCHOLARSHIP
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">Rs.</span>
                      <Input
                        type="number"
                        min="0"
                        value={challanForm.discount}
                        onChange={(e) => setChallanForm({ ...challanForm, discount: parseFloat(e.target.value) || 0 })}
                        className="pl-8 h-8 text-sm font-semibold text-green-700 bg-green-50/30"
                        placeholder="0"
                      />
                    </div>
                    {editingChallan?.installment?.isLocked && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3" /> Installment is locked (fully paid) — discount cannot be changed.
                      </p>
                    )}
                    {updateInstallmentMutation.isError && (
                      <p className="text-[10px] text-red-600 mt-0.5">{updateInstallmentMutation.error?.message}</p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t bg-orange-50/10 -mx-2 -mb-2 p-2 rounded-b-lg border-orange-100">
                  {(() => {
                    const isExtra = parseInt(challanForm.installmentNumber) === 0;
                    
                    // 1. Resolve Tuition
                    const tuitionSelected = parseFloat(challanForm.amount || "0") || 0;
                    
                    // 2. Resolve Arrears
                    const arrearsBase = isExtra ? 0 : (parseFloat(challanForm.arrearsAmount) || 0);
                    const arrearsLateFee = isExtra ? 0 : (challanForm.arrearsSelections || []).reduce((sum, a) => sum + (Number(a.lateFee) || 0), 0);
                    const totalArrears = arrearsBase + arrearsLateFee;

                    // 3. Resolve Heads (excluding manual fine)
                    const selectedHeadIds = (challanForm.selectedHeads || []).map(id => Number(id));
                    const headsSum = feeHeads
                      .filter(h => selectedHeadIds.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                      .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);
                    
                    // 4. Resolve Fine (Extra)
                    const extraFine = challanForm.isOtherEnabled ? (parseFloat(challanForm.otherAmount) || 0) : 0;

                    // 5. Resolve Late Fee Fine (Live calculation based on selected due date)
                    const ratePerDay = isExtra 
                      ? Number(editingChallan?.lateFeeRatePerDay || extraChallanLateFee || 0)
                      : Number(editingChallan?.installment?.lateFeeRatePerDay || lateFeeRatePerDay || 0);
                    const autoLateFee = calculateLateFee(challanForm.dueDate, ratePerDay);
                    
                    // 6. Resolve Discount
                    const discount = parseFloat(challanForm.discount) || 0;

                    // Grand Total
                    const grandTotal = tuitionSelected + totalArrears + headsSum + extraFine + autoLateFee - discount;

                    return (
                      <div className="space-y-1.5">
                        {parseInt(challanForm.installmentNumber) > 0 && (
                          <>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1 border-b border-orange-200/50 pb-1">
                              <span>Inst. Overview</span>
                            </div>
                            {(() => {
                              // Find current installment details from the plan for context
                              const originalDate = editingChallan ? new Date(editingChallan.dueDate) : new Date();
                              const selYear = originalDate.getFullYear();
                              const selMonth = originalDate.getMonth() + 1;
                              const targetInst = genStudentPlan.find(inst => {
                                const d = new Date(inst.dueDate);
                                return d.getFullYear() === selYear && (d.getMonth() + 1) === selMonth;
                              });

                              const tuitionPaid = targetInst ? (targetInst.paidAmount || 0) : (parseFloat(editingChallan?.paidAmount || "0"));
                              const tuitionPending = targetInst ? (targetInst.pendingAmount || 0) : 0;
                              const tuitionRemaining = targetInst ? (targetInst.remainingAmount || 0) : 0;

                              return (
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
                                    <span className="text-[8px] uppercase font-bold opacity-80">BASE PAYABLE</span>
                                    <span className="text-[10px] font-bold">Rs. {tuitionSelected.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        )}
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] px-1 border-t pt-1">
                          {!isExtra && totalArrears > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span className="font-semibold italic flex items-center gap-1"><History className="h-2.5 w-2.5" /> Arrears:</span>
                              <span className="font-bold">Rs. {totalArrears.toLocaleString()}</span>
                            </div>
                          )}
                          {headsSum > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span className="font-semibold italic flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Heads:</span>
                              <span className="font-bold">Rs. {headsSum.toLocaleString()}</span>
                            </div>
                          )}
                          {extraFine > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span className="font-semibold italic flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Fine (Extra):</span>
                              <span className="font-bold">Rs. {extraFine.toLocaleString()}</span>
                            </div>
                          )}
                          {autoLateFee > 0 && (
                            <div className="flex justify-between text-destructive">
                              <span className="font-semibold italic flex items-center gap-1"><Plus className="h-2.5 w-2.5" /> Late Fee Fine:</span>
                              <span className="font-bold">Rs. {autoLateFee.toLocaleString()}</span>
                            </div>
                          )}
                          {discount > 0 && (
                            <div className="flex justify-between text-green-600 border-t border-dashed mt-0.5 pt-0.5 col-span-2">
                              <span className="font-semibold italic flex items-center gap-1"><Minus className="h-2.5 w-2.5" /> Discount / Scholarship:</span>
                              <span className="font-bold">Rs. {discount.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-1 mt-1 border-t-2 border-orange-300 flex justify-between items-center px-1 bg-orange-50/50 rounded p-1">
                          <span className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">Grand Total Payable</span>
                          <span className="text-xl font-black text-orange-700">Rs. {grandTotal.toLocaleString()}</span>
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
                  <p className="text-sm font-semibold text-destructive">{selectedChallanDetails.dueDate ? format(new Date(selectedChallanDetails.dueDate), "dd MMM yyyy") : "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</p>
                  <Badge 
                    className="uppercase text-[10px]"
                    variant={selectedChallanDetails.status === "PAID" ? "default" : selectedChallanDetails.status === "OVERDUE" ? "destructive" : selectedChallanDetails.status === "PARTIAL" ? "secondary" : (selectedChallanDetails.status === "VOID" || selectedChallanDetails.status === "SUPERSEDED" || selectedChallanDetails.status === "SETTLED") ? "outline" : "secondary"}
                  >
                    {selectedChallanDetails.status === "VOID" ? "Voided" : 
                     (selectedChallanDetails.status === "SUPERSEDED" && (selectedChallanDetails.settledAmount || 0) > 0) ? "Partially Settled" :
                     selectedChallanDetails.status === "SUPERSEDED" ? "Superseded" : 
                     selectedChallanDetails.status === "SETTLED" ? "Settled" : selectedChallanDetails.status}
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
                        <span className="font-medium">{selectedChallanDetails.installmentNumber > 0 ? `Inst #${selectedChallanDetails.installmentNumber}` : "Extra Challan"} (VOID)</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-bold">#{selectedChallanDetails.supersededBy.challanNumber} ({selectedChallanDetails.supersededBy.status})</span>
                      </div>
                    )}
                    {/* Settlement breakdown */}
                    {(() => {
                      const discountVal = Number(selectedChallanDetails.snapshotDiscount || selectedChallanDetails.discount || selectedChallanDetails.installment?.discount || 0);
                      const totalDue = (selectedChallanDetails.snapshotBaseAmount != null ? Number(selectedChallanDetails.snapshotBaseAmount) : (selectedChallanDetails.amount || 0)) + (selectedChallanDetails.snapshotExtraFine != null ? Number(selectedChallanDetails.snapshotExtraFine) : (selectedChallanDetails.fineAmount || 0)) + (selectedChallanDetails.snapshotLateFee != null ? Number(selectedChallanDetails.snapshotLateFee) : (selectedChallanDetails.lateFeeFine || 0)) - discountVal;
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                          <TableHead className="text-sm px-3 text-[10px] uppercase font-bold py-2">Description</TableHead>
                          <TableHead className="text-sm px-3 text-[10px] uppercase font-bold py-2 text-right">Amount (PKR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Tuition Component — hidden for extra challans */}
                        {(selectedChallanDetails.installmentNumber > 0 && selectedChallanDetails.challanType !== 'FEE_HEADS_ONLY' && !selectedChallanDetails.isExtra) && (
                        <TableRow>
                          <TableCell className="text-sm px-3 py-2">
                            <span className="font-semibold text-slate-700">Base Payable</span>
                            <p className="text-[10px] text-muted-foreground italic">
                              {selectedChallanDetails.installmentNumber > 0 ? `Installment #${selectedChallanDetails.installmentNumber}` : 'Standard Charge'}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm px-3 text-right font-bold py-2">
                             {/* Use snapshotBaseAmount when available (new schema), fall back to challan.amount */}
                             {formatAmount(selectedChallanDetails.snapshotBaseAmount ?? (selectedChallanDetails.amount || 0))}
                          </TableCell>
                        </TableRow>
                        )}

                        {/* Arrears Component with Detailed Breakdown */}
                        {(selectedChallanDetails.snapshotArrearsAmount != null
                          ? selectedChallanDetails.snapshotArrearsAmount > 0
                          : getRecursiveArrears(selectedChallanDetails) > 0) && (
                          <>
                            <TableRow className="text-amber-700 bg-amber-50/20">
                              <TableCell className="text-sm px-3 py-2">
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <History className="w-3 h-3" />
                                  Previous Arrears (Total)
                                </div>
                                <p className="text-[10px] opacity-70">Accumulated from previous unpaid installments</p>
                              </TableCell>
                              <TableCell className="text-sm px-3 text-right font-bold py-2">
                                {formatAmount(selectedChallanDetails.snapshotArrearsAmount ?? getRecursiveArrears(selectedChallanDetails))}
                              </TableCell>
                            </TableRow>
                            
                            {/* Chain breakdown */}
                            {(() => {
                              try {
                                const arrearsNums = typeof selectedChallanDetails.installment?.arrearsInstallments === 'string'
                                  ? JSON.parse(selectedChallanDetails.installment.arrearsInstallments)
                                  : (selectedChallanDetails.installment?.arrearsInstallments || []);
                                
                                if (!Array.isArray(arrearsNums) || arrearsNums.length === 0) return null;
                                
                                const allInsts = selectedChallanDetails.installment?.student?.feeInstallments || [];
                                const prevChallans = Array.isArray(selectedChallanDetails.previousChallans) ? selectedChallanDetails.previousChallans : [];
                                const fallbackTotalArrears = Number(selectedChallanDetails.snapshotArrearsAmount || 0);
                                const fallbackPerRow = arrearsNums.length > 0 ? Math.round(fallbackTotalArrears / arrearsNums.length) : 0;
                                return arrearsNums.map((num, idx) => {
                                  const match = allInsts.find(i => Number(i.installmentNumber) === Number(num));
                                  if (!match) return null;
                                  // For settled arrears, prefer previous challan settlement snapshot.
                                  const prev = prevChallans.find((p) =>
                                    Number(p.installmentNo ?? p.installmentNumber ?? p.installment?.installmentNumber ?? -1) === Number(num)
                                  );
                                  const prevSettled = Number(prev?.settledAmount ?? 0);
                                  const prevSnapshotDue = Number(prev?.snapshotTotalDue ?? 0);
                                  const prevReceived = Number(prev?.amountReceived ?? prev?.paidAmount ?? 0);
                                  const prevRemainingAtRoll = Math.max(0, prevSnapshotDue - prevReceived);

                                  const snapArrears = Number(match.snapshotArrearsAmount ?? 0);
                                  const settledContribution = Number(match.settledAmount ?? 0);
                                  const outstandingPrincipal = Number(match.outstandingPrincipal ?? 0);
                                  const matchTotal = Number(match.totalAmount ?? 0);
                                  const matchPaid = Number(match.paidAmount ?? 0);
                                  const fallbackRemaining = Math.max(0, matchTotal - matchPaid);
                                  const amt = prevSettled > 0
                                    ? prevSettled
                                    : (prevRemainingAtRoll > 0
                                      ? prevRemainingAtRoll
                                      : (snapArrears > 0
                                        ? snapArrears
                                        : (settledContribution > 0
                                          ? settledContribution
                                          : (outstandingPrincipal > 0 ? outstandingPrincipal : fallbackRemaining))));
                                  const finalAmt = Number(amt) > 0
                                    ? Number(amt)
                                    : (arrearsNums.length === 1 ? fallbackTotalArrears : fallbackPerRow);
                                  const sessionLabel = (typeof match.session === 'object' ? match.session?.name : match.session) || match.sessionName || selectedChallanDetails.installment?.session?.name || "";
                                  const monthLabel = match.month || `#${num}`;
                                  const instLabel = `Installment ${match.installmentNumber || num}`;
                                  const arrearsLabel = `${monthLabel} - ${instLabel}${sessionLabel ? ` / ${sessionLabel}` : ''}`;
                                  return (
                                    <TableRow key={`arr-${idx}`} className="bg-amber-50/10">
                                      <TableCell className="text-xs px-3 py-1.5 text-amber-600 italic">
                                        {arrearsLabel}
                                      </TableCell>
                                      <TableCell className="text-xs px-3 text-right py-1.5 text-amber-600">
                                        {formatAmount(finalAmt)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                }).filter(Boolean);
                              } catch (e) { 
                                return null; 
                              }
                            })()}
                          </>
                        )}

                        {/* Dynamic Fee Heads — use heads JSON snapshot (new schema) when available, fall back to selectedHeads */}
                        {(() => {
                           try {
                             // Task 11.3: Prefer heads JSON snapshot from FeeInstallmentChallan (frozen at generation time)
                             const headsSnapshot = selectedChallanDetails.challanHeads;
                             const rawHeads = headsSnapshot || null;

                             // Fall back to legacy selectedHeads if no heads snapshot
                             const raw = rawHeads || (
                               (selectedChallanDetails.selectedHeads && typeof selectedChallanDetails.selectedHeads === 'string')
                                 ? JSON.parse(selectedChallanDetails.selectedHeads)
                                 : (selectedChallanDetails.selectedHeads || [])
                             );
                             
                             const activeHeads = Array.isArray(raw) ? raw.filter(h => 
                               (typeof h === 'object' && h !== null && (h.isSelected !== false) && (h.amount > 0 || h.discountAmount > 0)) || 
                               (typeof h === 'number')
                             ) : [];

                             return activeHeads.map((item, idx) => {
                               let name = "Additional Head";
                               let amount = 0;
                               if (typeof item === 'object' && item !== null) {
                                  if (item.id === -1) return null; // Skip virtual heads, shown separately as Fine (Extra)
                                  name = item.headName || item.name || (item.feeHead?.name) || "Fee Head";
                                  amount = parseFloat(item.amount) || 0;
                               } else {
                                  const head = (feeHeads || []).find(h => Number(h.id) === Number(item));
                                  if (head) { name = head.name; amount = parseFloat(head.amount) || 0; }
                               }
                               if (!name || Number(amount) === 0) return null;
                               return (
                                 <TableRow key={idx}>
                                   <TableCell className="text-sm px-3 py-2 text-slate-600">{name}</TableCell>
                                   <TableCell className="text-sm px-3 text-right font-medium py-2">
                                     {Number(amount) < 0 ? `- ${formatAmount(Math.abs(amount))}` : formatAmount(amount)}
                                   </TableCell>
                                 </TableRow>
                               );
                             }).filter(Boolean);
                           } catch (e) { return null; }
                        })()}

                        {/* Fines & Late Fees */}
                        {/* Use snapshotLateFee when available (new schema), fall back to challan.lateFeeFine */}
                        {(selectedChallanDetails.snapshotLateFee ?? selectedChallanDetails.lateFeeFine) > 0 && (
                          <TableRow className="text-destructive bg-destructive/5 font-medium">
                            <TableCell className="text-sm px-3 py-2">
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
                            <TableCell className="text-sm px-3 text-right font-bold py-2">{formatAmount(selectedChallanDetails.snapshotLateFee ?? selectedChallanDetails.lateFeeFine)}</TableCell>
                          </TableRow>
                        )}

                        {/* Extra Fine Fallback */}
                        {(Number(selectedChallanDetails.installment?.extraFine || 0) > 0) && (
                          <TableRow className="text-destructive bg-destructive/5 font-medium border-t border-destructive/20">
                            <TableCell className="text-sm px-3 py-2 italic">Fine (Extra)</TableCell>
                            <TableCell className="text-sm px-3 text-right font-bold py-2">{formatAmount(selectedChallanDetails.installment.extraFine)}</TableCell>
                          </TableRow>
                        )}

                        {/* Discounts */}
                        {(() => {
                          const disc = Number(selectedChallanDetails.snapshotDiscount) || Number(selectedChallanDetails.discount) || Number(selectedChallanDetails.installment?.discount) || 0;
                          if (Math.abs(disc) === 0) return null;
                          return (
                            <TableRow className="text-green-600 bg-green-50/30">
                              <TableCell className="text-sm px-3 py-2 italic">Applied Discount</TableCell>
                              <TableCell className="text-sm px-3 text-right font-bold py-2">- {formatAmount(Math.abs(disc))}</TableCell>
                            </TableRow>
                          );
                        })()}

                        {/* Collection Summary Integrated into Table */}
                        {(() => {
                          const isVoid = selectedChallanDetails.status === 'VOID';
                          const discountVal = Number(selectedChallanDetails.snapshotDiscount) || Number(selectedChallanDetails.discount) || Number(selectedChallanDetails.installment?.discount) || 0;
                          const totalDue = (Number(selectedChallanDetails.snapshotTotalDue) || 0) > 0
                            ? Number(selectedChallanDetails.snapshotTotalDue)
                            : isVoid
                              ? Math.max(0, (selectedChallanDetails.amount || 0) + (selectedChallanDetails.fineAmount || 0) + (selectedChallanDetails.lateFeeFine || 0) - Math.abs(discountVal))
                              : Math.max(0, (selectedChallanDetails.amount || 0) + getSelectedHeadsTotal(selectedChallanDetails) + (selectedChallanDetails.lateFeeFine || 0) + getRecursiveArrears(selectedChallanDetails) - Math.abs(discountVal));
                          
                          const effectivePaid = isVoid
                            ? (selectedChallanDetails.settledAmount || 0)
                            : (selectedChallanDetails.paidAmount || 0);
                          
                          // Keep negative value when overpaid so it is visible as advance.
                          const remaining = totalDue - effectivePaid;

                          return (
                            <>
                              <TableRow className="bg-primary/5 border-t-2 border-border">
                                <TableCell className="text-sm px-3 py-3">
                                  <span className="text-base font-black text-primary uppercase tracking-tight">Total Payable Amount</span>
                                </TableCell>
                                <TableCell className="text-sm px-3 text-right py-3">
                                  <span className="text-xl font-black text-primary">PKR {formatAmount(totalDue)}</span>
                                </TableCell>
                              </TableRow>
                              
                              {effectivePaid > 0 && (
                                <TableRow className="bg-success/5">
                                  <TableCell className="text-sm px-3 py-2">
                                    <span className="font-semibold text-success">Amount Paid / Settled</span>
                                  </TableCell>
                                  <TableCell className="text-sm px-3 text-right font-bold py-2 text-success">
                                    - PKR {formatAmount(effectivePaid)}
                                  </TableCell>
                                </TableRow>
                              )}

                              <TableRow className="bg-slate-100/50 border-t">
                                <TableCell className="text-sm px-3 py-2">
                                  <span className="font-black text-slate-700 uppercase">Remaining Balance</span>
                                </TableCell>
                                <TableCell className="text-sm px-3 text-right py-2">
                                  <span className={cn("text-lg font-black", remaining < 0 ? "text-blue-600" : "text-slate-800")}>{remaining < 0 ? '-' : ''}PKR {formatAmount(Math.abs(remaining))}</span>
                                </TableCell>
                              </TableRow>
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Sidebar Info (Payment History etc) */}
                <div className="space-y-6">
                  {/* Status & Quick Info */}
                  <Card className="shadow-sm border-border">
                    <CardHeader className="pb-2 bg-slate-50/50 border-b">
                       <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                         <Info className="w-4 h-4" />
                         Challan Information
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Current Status:</span>
                        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(selectedChallanDetails.status))}>
                          {selectedChallanDetails.status}
                        </div>
                      </div>
                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground italic">Issued Date:</span>
                          <span className="font-medium text-slate-700">
                            {selectedChallanDetails.issueDate || selectedChallanDetails.createdAt ? format(new Date(selectedChallanDetails.issueDate || selectedChallanDetails.createdAt), "dd MMM yyyy") : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground italic text-destructive">Due Date:</span>
                          <span className="font-bold text-destructive">
                            {selectedChallanDetails.dueDate ? format(new Date(selectedChallanDetails.dueDate), "dd MMM yyyy") : "N/A"}
                          </span>
                        </div>
                        {selectedChallanDetails.paidDate && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground italic text-success">Paid Date:</span>
                            <span className="font-bold text-success">
                              {format(new Date(selectedChallanDetails.paidDate), "dd MMM yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-border bg-slate-50/50">
                    <CardHeader className="pb-2 py-3 border-b bg-white">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <History className="w-3.5 h-3.5" />
                        Session Payment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableBody>
                            {(() => {
                              const currentNum = selectedChallanDetails.installmentNo || selectedChallanDetails.installment?.installmentNumber || 0;
                              const history = (selectedChallanDetails.installment?.student?.feeInstallments || [])
                                .filter(i => i.installmentNumber < currentNum)
                                .sort((a,b) => a.installmentNumber - b.installmentNumber);
                              
                              if (history.length === 0) {
                                return (
                                  <TableRow className="h-8 bg-white">
                                    <TableCell colSpan={2} className="text-[10px] italic text-slate-400 py-1 px-3 text-center">
                                      No previous installments in this session history.
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              return (
                                <>
                                  <TableRow className="h-8 bg-white">
                                    <TableCell className="text-[10px] font-bold py-1 px-3 border-r bg-slate-50 w-24">Month</TableCell>
                                    {history.map((inst, idx) => (
                                      <TableCell key={idx} className="text-[10px] text-center py-1 px-2 border-r last:border-r-0 min-w-[60px]">
                                        {inst.month || `#${inst.installmentNumber}`}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                  <TableRow className="h-8 bg-white">
                                    <TableCell className="text-[10px] font-bold py-1 px-3 border-r bg-slate-50">Total</TableCell>
                                    {history.map((inst, idx) => (
                                      <TableCell key={idx} className="text-[10px] text-center py-1 px-2 border-r last:border-r-0 font-medium">
                                        {formatAmount(inst.totalAmount)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                  <TableRow className="h-8 bg-white">
                                    <TableCell className="text-[10px] font-bold py-1 px-3 border-r bg-slate-50">Paid</TableCell>
                                    {history.map((inst, idx) => (
                                      <TableCell key={idx} className="text-[10px] text-center py-1 px-2 border-r last:border-r-0 font-bold text-success">
                                        {formatAmount(inst.paidAmount)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </>
                              );
                            })()}
                          </TableBody>
                        </Table>
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
                  <Card className="shadow-soft border-border overflow-hidden">
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
                            <TableHead className="text-sm px-3 py-2 text-[10px] uppercase h-8">Date</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-[10px] uppercase h-8">Amount</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-[10px] uppercase h-8">Discount</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-[10px] uppercase h-8">Method</TableHead>
                            <TableHead className="text-sm px-3 py-2 text-[10px] uppercase h-8">Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((entry, idx) => (
                            <TableRow key={idx} className="h-9 hover:bg-muted/20">
                              <TableCell className="text-sm px-3 py-2 text-xs py-1">{new Date(entry.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm px-3 py-2 text-xs font-bold text-success py-1">PKR {Math.round(entry.amount).toLocaleString()}</TableCell>
                              <TableCell className="text-sm px-3 py-2 text-xs font-bold text-orange-600 py-1">PKR {Math.round(entry.discount || 0).toLocaleString()}</TableCell>
                              <TableCell className="text-sm px-3 py-2 text-xs py-1">{entry.method || 'Cash'}</TableCell>
                              <TableCell className="text-sm px-3 py-2 text-[10px] italic py-1 text-muted-foreground">{entry.remarks || '-'}</TableCell>
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
                    <Input
                      type="month"
                      value={generateForm.month}
                      onChange={(e) => {
                        const val = e.target.value;
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
                      className="h-8 text-xs"
                    />
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
                                   const [selYear, selMonth] = generateForm.month.split('-').map(Number);
                                   const mn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                   const mMatch = (mn[selMonth - 1] || '').toLowerCase();
                                   setSelectedBulkStudents(bulkStudents.filter(student => {
                                     const insts = (student.feeInstallments || []).sort((a, b) => a.installmentNumber - b.installmentNumber);
                                     const ci = insts.find(i => {
                                       const nameMatch = (i.month || '').toLowerCase() === mMatch;
                                       const yearMatch = i.dueDate ? new Date(i.dueDate).getFullYear() === selYear : true;
                                       const sessionMatch = !generateForm.sessionId || generateForm.sessionId === 'all' || String(i.sessionId) === generateForm.sessionId;
                                       return nameMatch && yearMatch && sessionMatch;
                                     });
                                     if (!ci) return false;
                                     
                                     // Requirement 11.2: exclude settled, paid, or already generated
                                     const isBilledOrPaidCi = ['PAID', 'SETTLED'].includes(ci.status) || 
                                                             (ci.challanGenerated === true) || 
                                                             (Number(ci.pendingAmount || 0) <= 0 && Number(ci.paidAmount || 0) > 0);
                                     if (isBilledOrPaidCi) return false;

                                     const tnum = ci.installmentNumber || 0;
                                     const rank = (cls) => cls ? (Number(cls.year || 0) * 100 + Number(cls.semester || 0)) : 0;
                                     return !insts.some(i => { const before = i.classId === ci.classId ? i.installmentNumber < tnum : rank(i.class) < rank(ci.class); return before && (i.pendingAmount || 0) === 0 && (i.paidAmount || 0) === 0; });
                                   }).map(s => s.id));
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
                                <TableHead className="text-sm px-3 py-2 w-[40px] p-0 text-center"></TableHead>
                                <TableHead className="text-sm px-3 py-2 text-[10px] uppercase font-bold p-2">Student</TableHead>
                                <TableHead className="text-sm px-3 py-2 text-[10px] uppercase font-bold p-2 text-right">Inst. Amt</TableHead>
                                <TableHead className="text-sm px-3 py-2 text-[10px] uppercase font-bold p-2 text-right">Late Fee</TableHead>
                                <TableHead className="text-sm px-3 py-2 text-[10px] uppercase font-bold p-2 text-right">Arrears</TableHead>
                                <TableHead className="text-sm px-3 py-2 text-[10px] uppercase font-bold p-2 text-right">Total Due</TableHead>
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
                                    const yearMatches = inst.dueDate ? new Date(inst.dueDate).getFullYear() === selYear : true;
                                    if (generateForm.sessionId && generateForm.sessionId !== "all") {
                                      const byId = inst.sessionId?.toString() === generateForm.sessionId;
                                      const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
                                      return nameMatches && yearMatches && (byId || byName);
                                    }
                                    return nameMatches && yearMatches;
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
                                    const yearMatches = inst.dueDate ? new Date(inst.dueDate).getFullYear() === selYear : true;
                                    if (generateForm.sessionId && generateForm.sessionId !== "all") {
                                      const byId = inst.sessionId?.toString() === generateForm.sessionId;
                                      const byName = selectedSessionName && (inst.session || '') === selectedSessionName;
                                      return nameMatches && yearMatches && (byId || byName);
                                    }
                                    return nameMatches && yearMatches;
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
                                    if (!student) return { total: 0, tuition: 0, heads: 0, lateFees: 0, voidPredecessors: [] };

                                    // New schema: arrears = sum of pendingAmount on all prior installments
                                    // EXCLUDE SUPERSEDED — their debt is already embedded in the active installment's pendingAmount
                                    const pastInsts = (student.feeInstallments || []).filter(inst => {
                                      const iClassRank = getClassRank(inst.class);
                                      let isBefore = false;
                                      if (currentInst && inst.classId === currentInst.classId) {
                                        isBefore = inst.installmentNumber < targetInstNum;
                                      } else {
                                        isBefore = iClassRank < targetClassRank;
                                      }
                                      return isBefore && inst.status !== 'SUPERSEDED' && inst.status !== 'VOID' && inst.status !== 'SETTLED';
                                    });

                                    const total = pastInsts.reduce((sum, inst) => {
                                      return sum + Number(inst.pendingAmount ?? 0);
                                    }, 0);

                                    return {
                                      total,
                                      lateFees: 0,
                                      tuition: total,
                                      heads: 0,
                                      session: 0,
                                      voidPredecessors: [],
                                    };
                                  };

                                  const brk = getArrearsBreakdown();
                                  const arrearsAmount = brk.total;
                                  const instBaseAmt = currentInst ? Number(currentInst.basePayable ?? currentInst.amount ?? 0) : 0;
                                  // Fix: use pendingAmount which already accounts for advance payments correctly
                                  const unpaidInstAmt = currentInst ? Math.max(0, Number(currentInst.pendingAmount ?? 0)) : 0;
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
                                    const isBilledStatus = (inst.paidAmount || 0) > 0 || 
                                      (inst.pendingAmount != null ? Number(inst.pendingAmount) > 0 : (inst.outstandingPrincipal || 0) > 0) || 
                                      inst.challanGenerated === true ||
                                      ['PAID', 'PARTIAL', 'ISSUED', 'UNPAID', 'SUCCESS', 'CREATED'].includes(inst.status);
                                    return !isBilledStatus;
                                  });
                                  
                                  // isGenerated: rely on current installment state (avoid legacy challan relation false positives)
                                  const hasActiveChallan = currentInst?.challanGenerated === true;
                                  const isSuperseded = false; // new schema doesn't use remainingAmount
                                  const isGenerated = currentInst && !isSuperseded && (
                                    (Number(currentInst.paidAmount) || 0) >= Number(currentInst.basePayable ?? currentInst.amount ?? 0) ||
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
                                      <TableCell className="text-sm px-3 py-2 p-0 text-center">
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
                                      <TableCell className="text-sm px-3 py-2 p-2">
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
                                      <TableCell className="text-sm px-3 py-2 text-xs p-2 text-right font-medium whitespace-nowrap">
                                        Rs. {(currentInst ? (Number(currentInst.basePayable ?? currentInst.amount ?? 0) + (recurringHeadsAmt || 0)) : 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-sm px-3 py-2 text-xs p-2 text-right font-medium whitespace-nowrap text-orange-600">
                                        Rs. {(installmentLateFee || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-sm px-3 py-2 text-xs p-2 text-right text-red-600 font-medium whitespace-nowrap">
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
                                      <TableCell className="text-sm px-3 py-2 text-xs p-2 text-right font-black text-orange-700 whitespace-nowrap">
                                        Rs. {(instBaseAmt + (recurringHeadsAmt || 0) + (installmentLateFee || 0) + arrearsAmount).toLocaleString()}
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
                    // Use new bulk-generate endpoint (Task 11.1)
                    const sessionIdNum = generateForm.sessionId && generateForm.sessionId !== "all" ? Number(generateForm.sessionId) : undefined;
                    if (!sessionIdNum) {
                      toast({ title: "Please select a session before generating challans.", variant: "destructive" });
                      setIsGenerating(false);
                      return;
                    }

                    // Convert YYYY-MM to Month Name for the backend
                    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    const monthPart = generateForm.month?.split('-')[1];
                    const targetMonthName = monthPart ? monthNames[parseInt(monthPart) - 1] : undefined;

                    if (!targetMonthName) {
                      toast({ title: "Please select a month before generating challans.", variant: "destructive" });
                      setIsGenerating(false);
                      return;
                    }

                    bulkGenerateChallansMutation.mutate({
                      programId: generateForm.programId && generateForm.programId !== "all" ? Number(generateForm.programId) : undefined,
                      classId: generateForm.classId && generateForm.classId !== "all" ? Number(generateForm.classId) : undefined,
                      sectionId: generateForm.sectionId && generateForm.sectionId !== "all" ? Number(generateForm.sectionId) : undefined,
                      sessionId: sessionIdNum,
                      targetMonth: targetMonthName,
                      targetYear: generateForm.month ? parseInt(generateForm.month.split('-')[0]) : undefined,
                      dueDate: bulkDueDate ? format(bulkDueDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                      studentIds: selectedBulkStudents.length > 0 ? selectedBulkStudents : undefined,
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
              {(() => {
                const created = generateResults.filter(r => r.status === 'CREATED');
                const blocked = generateResults.filter(r => r.status === 'BLOCKED');
                const exists = generateResults.filter(r => r.status === 'ALREADY_EXISTS');
                return (
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {created.length > 0 && <p className="text-green-700">{created.length} challan{created.length !== 1 ? 's' : ''} generated</p>}
                        {exists.length > 0 && <p className="text-slate-600 font-normal text-xs">{exists.length} already generated (skipped)</p>}
                        {blocked.length > 0 && <p className="text-red-600 font-bold text-xs">{blocked.length} blocked by sequential rule</p>}
                      </div>
                      {created.length > 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => {
                            created.forEach((r, idx) => {
                              if (!r.challan?.id) return;
                              setTimeout(async () => {
                                try {
                                  const html = await printFeeInstallmentChallan(r.challan.id);
                                  const w = window.open('', '_blank');
                                  if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
                                } catch { /* ignore */ }
                              }, idx * 800);
                            });
                          }}
                        >
                          <Printer className="w-3 h-3" /> Print All
                        </Button>
                      )}
                    </div>

                    {/* Created challans table */}
                    {created.length > 0 && (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 border-b">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Challan #</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Print</th>
                            </tr>
                          </thead>
                          <tbody>
                            {created.map((r, i) => (
                              <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                                <td className="px-3 py-2">
                                  <div className="font-medium text-slate-800">{r.studentName}</div>
                                  {r.rollNumber && <div className="text-xs text-muted-foreground">{r.rollNumber}</div>}
                                </td>
                                <td className="px-3 py-2 font-mono font-bold text-primary">{r.challanNumber}</td>
                                <td className="px-3 py-2 text-right">
                                  <Button size="icon" variant="ghost" className="h-7 w-7"
                                    onClick={async () => {
                                      if (!r.challan?.id) return;
                                      try {
                                        const html = await printFeeInstallmentChallan(r.challan.id);
                                        const w = window.open('', '_blank');
                                        if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
                                      } catch { /* ignore */ }
                                    }}
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Failures (compact) */}
                    {(blocked.length > 0 || exists.length > 0) && (
                      <div className="rounded-lg border border-red-100 bg-red-50/20 p-3 space-y-3">
                        {blocked.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Blocked (Sequential Compliance Error)
                            </p>
                            <div className="space-y-0.5 border-l-2 border-red-200 ml-1.5 pl-2">
                              {blocked.map((r, i) => (
                                <div key={i} className="text-[11px] text-red-600">
                                  <span className="font-bold">{r.studentName}</span>
                                  {r.reason && <span className="text-red-500 font-normal"> — {r.reason}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {exists.length > 0 && (
                          <div className="opacity-70">
                            <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-slate-400" /> Already Generated
                            </p>
                            <div className="space-y-0.5 border-l-2 border-slate-200 ml-1.5 pl-2">
                              {exists.map((r, i) => (
                                <div key={i} className="text-[11px] text-slate-600">
                                  <span className="font-bold">{r.studentName}</span>
                                  <span className="text-slate-500 font-normal"> — Challan already exists for this month.</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex justify-end pt-2">
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
                    <TableHead className="text-sm px-3 py-2 w-[120px]">Date</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Received</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Discount</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Method</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Remarks</TableHead>
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
                        <TableCell className="text-sm px-3 py-2 text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm px-3 py-2 font-bold text-success">PKR {formatAmount(entry.amount)}</TableCell>
                        <TableCell className="text-sm px-3 py-2 font-bold text-orange-600">PKR {formatAmount(entry.discount || 0)}</TableCell>
                        <TableCell className="text-sm px-3 py-2 text-xs">{entry.method || 'Cash'}</TableCell>
                        <TableCell className="text-sm px-3 py-2 text-xs italic">{entry.remarks || '-'}</TableCell>
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

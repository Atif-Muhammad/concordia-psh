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
import { DollarSign, Plus, CheckCircle2, Edit, Trash2, Receipt, TrendingUp, Layers, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  createFeeHead, getFeeHeads, updateFeeHead, deleteFeeHead,
  createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
  getPrograms, getClasses,
  getFeeChallans, getBulkChallans, updateFeeChallan, getStudentFeeHistory,
  searchStudents, getRevenueOverTime, getClassCollectionStats, getFeeCollectionSummary, getDefaultFeeChallanTemplate
} from "../../config/apis";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
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
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [bulkPrintFilters, setBulkPrintFilters] = useState({
    programId: "",
    classId: "",
    sectionId: "",
    month: new Date().toISOString().slice(0, 7)
  });
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkPreviewContent, setBulkPreviewContent] = useState("");
  const [bulkChallansList, setBulkChallansList] = useState([]);


  const [challanForm, setChallanForm] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    discount: "",
    fineAmount: 0,
    remarks: "",
    installmentNumber: "",
    selectedHeads: [],
    isArrearsPayment: false,
    arrearsInstallments: 1
  });

  const [feeHeadForm, setFeeHeadForm] = useState({
    name: "",
    amount: "",
    type: "monthly",
    isDiscount: false,
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

  const { data: feeHeads = [] } = useQuery({
    queryKey: ['feeHeads'],
    queryFn: getFeeHeads
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['feeStructures'],
    queryFn: getFeeStructures
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

  const { data: feeCollectionSummary = { totalRevenue: 0, totalOutstanding: 0, totalDiscounts: 0 } } = useQuery({
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
  const totalDiscount = feeCollectionSummary.totalDiscounts;

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
      dueDate: "",
      discount: "",
      fineAmount: 0,
      remarks: "",
      installmentNumber: "",
      selectedHeads: [],
      isArrearsPayment: false,
      arrearsInstallments: 1
    });
    setEditingChallan(null);
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
    const discountToStore = Math.round(Number(challanForm.discount) || 0);

    const installmentNumber = parseInt(challanForm.installmentNumber) || 0;

    const selectedHeadIds = (challanForm.selectedHeads || []).map(id => Number(id));

    // ONLY include fee heads that are actually selected
    const allFeeHeadDetails = (feeHeads || [])
      .filter(h => selectedHeadIds.includes(Number(h.id)))
      .map(h => ({
        id: Number(h.id),
        name: h.name,
        amount: Math.round(Number(h.amount) || 0),
        type: h.isDiscount ? 'discount' : h.isTuition ? 'tuition' : 'additional',
        isSelected: true
      }));

    if (editingChallan) {
      updateChallanMutation.mutate({
        id: editingChallan.id,
        data: {
          studentId: parseInt(challanForm.studentId),
          amount: tuitionToStore,
          dueDate: challanForm.dueDate,
          discount: discountToStore,
          fineAmount: additionalToStore,
          remarks: challanForm.remarks,
          installmentNumber: installmentNumber,
          selectedHeads: allFeeHeadDetails
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
      isDiscount: feeHeadForm.isDiscount,
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
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!itemToPay) return;

    // Simplified installment tracking: just use what is already on the challan
    let coveredInstallments = '';

    if (itemToPay.installmentNumber > 0) {
      // For pre-generated challans (#1, #2, etc.), just use that number
      coveredInstallments = `${itemToPay.installmentNumber}`;
    } else if (itemToPay.feeStructure) {
      // Fallback logic for ad-hoc or lumped challans only
      const perInstallment = itemToPay.feeStructure.totalAmount / itemToPay.feeStructure.installments;
      const tuitionPortion = itemToPay.amount;

      if (tuitionPortion > 0) {
        const installmentsCovered = Math.round(tuitionPortion / perInstallment);
        if (installmentsCovered > 0) {
          try {
            const summary = await getStudentFeeSummary(itemToPay.studentId);
            const nextInstallment = (summary?.summary?.paidInstallments || 0) + 1;
            const lastInstallment = nextInstallment + installmentsCovered - 1;
            coveredInstallments = installmentsCovered === 1 ?
              `${nextInstallment}` :
              `${nextInstallment}-${lastInstallment}`;
          } catch (error) {
            console.error('Error fetching fee summary:', error);
            coveredInstallments = installmentsCovered === 1 ? '1' : `1-${installmentsCovered}`;
          }
        }
      }
    }

    updateChallanMutation.mutate({
      id: itemToPay.id,
      data: {
        status: "PAID",
        paidDate: new Date().toISOString().split("T")[0],
        paidAmount: itemToPay.amount - itemToPay.discount + (itemToPay.fineAmount || 0) + (itemToPay.lateFeeFine || 0),
        coveredInstallments
      }
    }, {
      onSuccess: () => {
        toast({ title: "Payment recorded successfully" });
        setPaymentDialogOpen(false);
        setItemToPay(null);
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
      isDiscount: false,
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
    const feeHeadsRowsHtml = rawHeads.map(item => {
      // Handle both legacy (just IDs) and new snapshots (objects)
      if (typeof item === 'object' && item !== null) {
        // Snapshot Object: { id, name, amount, type, isSelected }
        if (item.isSelected && (item.type === 'additional' || item.type === 'discount') && item.amount > 0) {
          totalOtherHeadsFromSelection += (item.type === 'discount' ? -item.amount : item.amount);
          const displayAmount = item.type === 'discount' ? `- ${item.amount.toLocaleString()}` : item.amount.toLocaleString();
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

    // Totals Calculation
    // IMPORTANT: challan.fineAmount ALREADY contains the sum of selected heads from the DB
    // We only add lateFeeFine which is calculated at runtime.
    const fineTotal = (challan.fineAmount || 0) + (challan.lateFeeFine || 0);
    const scholarship = (challan.discount || 0);
    const standardTotal = (challan.amount || 0) + fineTotal;
    const netPayable = standardTotal - scholarship;

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

      // Case-sensitive exact matches for temps.html
      '{{challanNo}}': challan.challanNumber,
      '{{issueDate}}': formatDate(new Date()),
      '{{dueDate}}': formatDate(challan.dueDate),
      '{{studentName}}': `${student.fName} ${student.mName || ''} ${student.lName || ''}`.trim(),
      '{{fatherName}}': student.fatherOrguardian || '',
      '{{rollNo}}': student.rollNumber,
      '{{class}}': studentClass,
      '{{section}}': '',
      '{{feeHeadsRows}}': feeHeadsRowsHtml,
      '{{Tuition Fee}}': (challan.amount - (challan.arrearsAmount || 0)).toLocaleString(),
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
      <div className="flex items-center justify-between gap-4">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium flex-1">
          <h2 className="text-2xl font-bold mb-2">Fee Management</h2>
          <p className="text-primary-foreground/90">Comprehensive fee tracking and management system</p>
        </div>
      </div>

      <Tabs defaultValue="challans" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="challans"><Receipt className="w-4 h-4 mr-2" />Challans</TabsTrigger>
          <TabsTrigger value="feeheads"><Layers className="w-4 h-4 mr-2" />Fee Heads</TabsTrigger>
          <TabsTrigger value="structures"><TrendingUp className="w-4 h-4 mr-2" />Fee Structures</TabsTrigger>
          <TabsTrigger value="reports"><DollarSign className="w-4 h-4 mr-2" />Reports</TabsTrigger>
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
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Discounts</p>
                    <p className="text-2xl font-bold text-primary">PKR {formatAmount(totalDiscount)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkPrintOpen(true)}
                    className="h-9 gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Printer className="w-4 h-4" /> Bulk Print
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
                      <TableHead>Scholarship</TableHead>
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
                          <TableCell className="text-destructive">-PKR {formatAmount(challan.discount || 0)}</TableCell>
                          <TableCell className="font-bold">PKR {formatAmount((challan.amount || 0) + (challan.fineAmount || 0) + (challan.lateFeeFine || 0) - (challan.discount || 0))}</TableCell>
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
                            <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : "secondary"}>
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
                              {challan.status !== "PAID" && <Button size="sm" variant="outline" onClick={() => {
                                setEditingChallan(challan);
                                setChallanForm({
                                  studentId: challan.studentId.toString(),
                                  amount: (challan.amount || 0).toString(),
                                  dueDate: new Date(challan.dueDate).toISOString().split('T')[0],
                                  discount: (challan.discount || 0).toString(),
                                  fineAmount: (() => {
                                    try {
                                      const raw = (challan.selectedHeads && typeof challan.selectedHeads === 'string')
                                        ? JSON.parse(challan.selectedHeads)
                                        : (challan.selectedHeads || []);

                                      const selectedIds = Array.isArray(raw) ? raw.map(item => {
                                        if (typeof item === 'object' && item !== null) return item.isSelected ? Number(item.id) : null;
                                        return Number(item);
                                      }).filter(id => id !== null && !isNaN(id)) : [];

                                      // If we have a snapshot with amounts, use them. 
                                      // Otherwise, fallback to looking up in the current feeHeads array.
                                      const snapshotSum = Array.isArray(raw) ? raw.reduce((s, item) => {
                                        if (typeof item === 'object' && item !== null && item.isSelected && item.type === 'additional') {
                                          return s + (item.amount || 0);
                                        }
                                        return s;
                                      }, 0) : 0;

                                      if (snapshotSum > 0) return snapshotSum.toString();

                                      // Fallback for ID-only or empty snapshot sum
                                      const lookupSum = feeHeads
                                        .filter(h => selectedIds.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
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
                      <TableHead>Scholarship</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Paid Amount</TableHead>
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
                        <TableCell className="text-destructive">-PKR {formatAmount(challan.discount)}</TableCell>
                        <TableCell className="font-bold">PKR {formatAmount((challan.amount || 0) - (challan.discount || 0))}</TableCell>
                        <TableCell>{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={challan.status === "PAID" ? "default" : challan.status === "OVERDUE" ? "destructive" : "secondary"}>
                            {challan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{challan.paidDate ? new Date(challan.paidDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{challan.paidAmount ? `PKR ${formatAmount(challan.paidAmount)}` : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {studentFeeHistory.length === 0 && <TableRow><TableCell colSpan={7} className="text-center">No history found</TableCell></TableRow>}
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
                      <TableCell>PKR {head.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={head.isDiscount ? "secondary" : "default"}>
                          {head.isDiscount ? "Discount" : "Charge"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingFeeHead(head);
                            setFeeHeadForm({
                              name: head.name,
                              description: head.description,
                              amount: head.amount.toString(),
                              isDiscount: head.isDiscount || false,
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
                    <span className="font-bold text-2xl">PKR {totalReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 border rounded-lg">
                    <span>Outstanding</span>
                    <span className="font-bold text-2xl text-warning">PKR {totalPending.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 border rounded-lg">
                    <span>Total Discounts Given</span>
                    <span className="font-bold text-2xl text-primary">PKR {totalDiscount.toLocaleString()}</span>
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
                <input type="checkbox" id="isDiscount" checked={feeHeadForm.isDiscount} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isDiscount: e.target.checked,
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
                })} className="w-4 h-4" />
                <Label htmlFor="isDiscount">Discount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isTuition" checked={feeHeadForm.isTuition} onChange={e => setFeeHeadForm({
                  ...feeHeadForm,
                  isTuition: e.target.checked,
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isLabFee: e.target.checked,
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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
                  isDiscount: false,
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

      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this challan as PAID?
              {itemToPay && (
                <div className="mt-2 p-2 bg-muted rounded-md space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Standard Amt + Extras:</span>
                    <span>PKR {formatAmount((itemToPay.amount || 0) + (itemToPay.fineAmount || 0) + (itemToPay.lateFeeFine || 0))}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Scholarship Discount:</span>
                    <span>-PKR {formatAmount(itemToPay.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Net Payable:</span>
                    <span>PKR {formatAmount((itemToPay.amount || 0) + (itemToPay.fineAmount || 0) + (itemToPay.lateFeeFine || 0) - (itemToPay.discount || 0))}</span>
                  </div>
                </div>
              )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fee Challan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Input
                value={editingChallan?.student ? `${editingChallan.student.fName} ${editingChallan.student.lName} (${editingChallan.student.rollNumber})` : ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Installment #</Label>
              <Input value={challanForm.installmentNumber} disabled />
            </div>
            <div className="space-y-2">
              <Label>Standard Tuition</Label>
              <Input
                value={challanForm.amount}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2 text-destructive">
              <Label>Persisted Scholarship</Label>
              <Input
                value={challanForm.discount}
                disabled
                className="bg-muted text-destructive"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={challanForm.dueDate}
                onChange={(e) => setChallanForm({ ...challanForm, dueDate: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-4">
              <Label>Select Additional Fee Heads (Charges/Discounts)</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                {feeHeads.filter(h => !h.isTuition).map(head => (
                  <div key={head.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`head-${head.id}`}
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
                        // Calculate separate sums for charges and discounts
                        const additionalSum = feeHeads
                          .filter(h => selected.includes(Number(h.id)) && !h.isTuition && !h.isDiscount)
                          .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                        const discountSum = feeHeads
                          .filter(h => selected.includes(Number(h.id)) && h.isDiscount)
                          .reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

                        // fineAmount = additional charges only
                        // discount = persisted scholarship + selected discount heads
                        const baseDiscount = parseFloat(editingChallan?.discount || 0);

                        setChallanForm({
                          ...challanForm,
                          selectedHeads: selected,
                          fineAmount: additionalSum,
                          discount: (baseDiscount + discountSum).toString()
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`head-${head.id}`} className={`text-sm font-normal ${head.isDiscount ? 'text-primary' : ''}`}>
                      {head.name} (PKR {head.amount}) {head.isDiscount && '(Discount)'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={challanForm.remarks}
                onChange={(e) => setChallanForm({ ...challanForm, remarks: e.target.value })}
                placeholder="Add any specific notes for this challan..."
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-lg font-bold">
              Total Payable: PKR {formatAmount(
                parseFloat(challanForm.amount) +
                (parseFloat(challanForm.fineAmount) || 0) +
                (editingChallan?.lateFeeFine || 0) -
                (parseFloat(challanForm.discount) || 0)
              )}
              {editingChallan?.lateFeeFine > 0 && (
                <span className="text-xs text-destructive block mt-1">
                  (Includes PKR {formatAmount(editingChallan.lateFeeFine)} Late fee fine)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setChallanOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitChallan} disabled={updateChallanMutation.isPending}>
                {updateChallanMutation.isPending ? "Saving..." : "Update Challan"}
              </Button>
            </div>
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
            <DialogTitle>Challan Preview</DialogTitle>
          </DialogHeader>
          {selectedChallanDetails && (
            <div
              className="w-full"
              dangerouslySetInnerHTML={{
                __html: generateChallanHtml(selectedChallanDetails)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div >
  </DashboardLayout >;
};
export default FeeManagement;
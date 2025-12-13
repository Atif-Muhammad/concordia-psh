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
  createFeeChallan, getFeeChallans, updateFeeChallan, deleteFeeChallan, getStudentFeeHistory,
  searchStudents, getStudentFeeSummary, getRevenueOverTime, getClassCollectionStats, getStudentArrears, getFeeCollectionSummary
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

  // Unified student search state
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeHistory, setStudentFeeHistory] = useState([]);
  const [studentFeeSummary, setStudentFeeSummary] = useState(null);
  const [studentArrears, setStudentArrears] = useState(null);
  const [challanSearch, setChallanSearch] = useState("");
  const [challanFilter, setChallanFilter] = useState("all");

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
    queryKey: ['feeChallans', challanSearch, page, limit],
    queryFn: () => getFeeChallans(null, challanSearch, page, limit),
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

  // Derived state for summary cards (using fetched summary instead of local calc)
  const totalReceived = feeCollectionSummary.totalRevenue;
  const totalPending = feeCollectionSummary.totalOutstanding;
  const totalDiscount = feeCollectionSummary.totalDiscounts;

  // Helper function to format amounts as integers (no decimals)
  const formatAmount = (amount) => {
    const num = Number(amount) || 0;
    return Math.round(num).toLocaleString();
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
  const createChallanMutation = useMutation({
    mutationFn: createFeeChallan,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      toast({ title: "Challan created successfully" });
      setChallanOpen(false);
      resetChallanForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const updateChallanMutation = useMutation({
    mutationFn: ({ id, data }) => updateFeeChallan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      toast({ title: "Challan updated successfully" });
      setChallanOpen(false);
      resetChallanForm();
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" })
  });

  const deleteChallanMutation = useMutation({
    mutationFn: deleteFeeChallan,
    onSuccess: () => {
      queryClient.invalidateQueries(['feeChallans']);
      toast({ title: "Challan deleted" });
      setDeleteDialogOpen(false);
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

    const totalPayable = parseFloat(challanForm.amount) || 0;
    const additionalCharges = Number(challanForm.fineAmount) || 0;
    const discount = Number(challanForm.discount) || 0;

    // Calculate tuition amount: Total Payable - Additional Charges + Discount
    // This gives us the pure tuition component
    const tuitionAmount = Math.max(0, totalPayable - additionalCharges + discount);

    // Tuition and Additional Charges are stored separately
    // amount = tuition only (rounded to integer)
    // fineAmount = additional charges only (rounded to integer)
    const tuitionToStore = Math.round(tuitionAmount);
    const additionalToStore = Math.round(additionalCharges);
    const discountToStore = Math.round(discount);

    // Installment number only applies when tuition is being paid
    // If tuition is 0, this is an additional-charges-only challan
    const hasTuition = tuitionToStore > 0;
    const installmentNumber = hasTuition ? (parseInt(challanForm.installmentNumber) || 1) : 0;

    // Build complete fee head breakdown - ALL fee heads with 0 if not selected
    // This allows backend to calculate tuition vs additional charges separately
    const selectedHeadIds = challanForm.selectedHeads || [];
    const allFeeHeadDetails = feeHeads.map(h => ({
      id: h.id,
      name: h.name,
      amount: selectedHeadIds.includes(h.id) ? Math.round(h.amount) : 0,
      type: h.isDiscount ? 'discount' : h.isTuition ? 'tuition' : 'additional',
      isSelected: selectedHeadIds.includes(h.id)
    }));

    const payload = {
      studentId: parseInt(challanForm.studentId),
      amount: tuitionToStore, // Tuition fee only (integer)
      dueDate: challanForm.dueDate,
      discount: discountToStore, // Discount (integer)
      fineAmount: additionalToStore, // Additional charges only (integer)
      remarks: challanForm.remarks,
      installmentNumber: installmentNumber, // 0 when no tuition, else from form
      selectedHeads: allFeeHeadDetails, // Array of all fee heads with amounts (0 if not selected)
      // Arrears payment specific fields
      isArrearsPayment: challanForm.isArrearsPayment || false,
      studentArrearId: challanForm.studentArrearId || null,
    };

    if (editingChallan) {
      updateChallanMutation.mutate({ id: editingChallan.id, data: payload });
    } else {
      createChallanMutation.mutate(payload);
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

    // Calculate installments covered based on amount
    let coveredInstallments = '';
    if (itemToPay.feeStructure) {
      const perInstallment = itemToPay.feeStructure.totalAmount / itemToPay.feeStructure.installments;

      // Extract tuition portion only
      // Since we now store base tuition in 'amount', we can use it directly
      // But we should ensure we don't count it if it's 0
      const tuitionPortion = itemToPay.amount;

      // Only mark installments if tuition is being paid
      if (tuitionPortion > 0) {
        const installmentsCovered = Math.round(tuitionPortion / perInstallment);

        if (installmentsCovered > 0) {
          // Fetch fresh summary to get current paid installments
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
      // If tuitionPortion <= 0, coveredInstallments remains empty (only additional charges paid)
    }

    updateChallanMutation.mutate({
      id: itemToPay.id,
      data: {
        status: "PAID",
        paidDate: new Date().toISOString().split("T")[0],
        paidAmount: itemToPay.amount - itemToPay.discount + itemToPay.fineAmount,
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

    if (itemToDelete.type === "challan") {
      deleteChallanMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "feeHead") {
      deleteHeadMutation.mutate(itemToDelete.id);
    } else if (itemToDelete.type === "structure") {
      deleteStructureMutation.mutate(itemToDelete.id);
    }
    setItemToDelete(null);
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
      selectedHeads: []
    });
    setEditingChallan(null);
    setStudentFeeSummary(null);
    setSelectedStudent(null);
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

  const printChallan = challanId => {
    const challan = feeChallans.find(c => c.id === challanId);
    if (!challan || !challan.student) return;

    const student = challan.student;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Challan - ${challan.challanNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .challan-box { border: 2px solid #000; padding: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEE CHALLAN</h1>
            <p>Challan No: ${challan.challanNumber}</p>
          </div>
          <div class="challan-box">
            <div class="row"><span class="label">Student Name:</span> <span>${student.fName} ${student.mName || ''} ${student.lName || ''}</span></div>
            <div class="row"><span class="label">Registration No:</span> <span>${student.rollNumber}</span></div>
            <div class="row"><span class="label">Installment:</span> <span>#${challan.installmentNumber}</span></div>
            <div class="row"><span class="label">Amount:</span> <span>PKR ${challan.amount.toLocaleString()}</span></div>
            <div class="row"><span class="label">Discount:</span> <span>PKR ${challan.discount || 0}</span></div>
            <div class="row"><span class="label">Net Amount:</span> <span>PKR ${(challan.amount - (challan.discount || 0)).toLocaleString()}</span></div>
            <div class="row"><span class="label">Due Date:</span> <span>${new Date(challan.dueDate).toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Status:</span> <span>${challan.status}</span></div>
            ${challan.remarks ? `<div class="row"><span class="label">Remarks:</span> <span>${challan.remarks}</span></div>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function () {
      printWindow.print();
    };
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
                <Button onClick={() => {
                  resetChallanForm();
                  setChallanOpen(true);
                }} className="gap-2">
                  <Plus className="w-4 h-4" />Create Challan
                </Button>
              </div>
              <div className="mt-4 flex gap-4">
                <Input
                  placeholder="Search by challan number, student name, or roll number..."
                  value={challanSearch}
                  onChange={(e) => setChallanSearch(e.target.value)}
                  className="max-w-md"
                />
                <Select value={challanFilter} onValueChange={setChallanFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Challans</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeChallans
                      .filter(challan => {
                        if (challanFilter === "all") return true;
                        if (challanFilter === "paid") return challan.status === "PAID";
                        if (challanFilter === "pending") return challan.status === "PENDING";
                        if (challanFilter === "overdue") {
                          return challan.status === "PENDING" && new Date(challan.dueDate) < new Date();
                        }
                        return true;
                      })
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
                          <TableCell>PKR {formatAmount(challan.amount + (challan.fineAmount || 0) - (challan.discount || 0))}</TableCell>
                          <TableCell className="text-primary">-PKR {formatAmount(challan.discount)}</TableCell>
                          <TableCell className="text-success">PKR {formatAmount(challan.paidAmount)}</TableCell>
                          <TableCell>{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
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
                              <Button size="sm" variant="outline" onClick={() => printChallan(challan.id)}>
                                <Printer className="w-4 h-4" />
                              </Button>
                              {challan.status !== "PAID" && <Button size="sm" variant="outline" onClick={() => handlePayment(challan)}>
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>}
                              {challan.status !== "PAID" && <Button size="sm" variant="outline" onClick={() => {
                                setEditingChallan(challan);
                                setChallanForm({
                                  studentId: challan.studentId.toString(),
                                  amount: challan.amount,
                                  dueDate: new Date(challan.dueDate).toISOString().split('T')[0],
                                  discount: challan.discount,
                                  fineAmount: challan.fineAmount,
                                  remarks: challan.remarks,
                                  installmentNumber: challan.installmentNumber
                                });
                                setSelectedStudent(challan.student);
                                setChallanOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>}
                              <Button size="sm" variant="outline" onClick={() => {
                                setItemToDelete({
                                  type: "challan",
                                  id: challan.id
                                });
                                setDeleteDialogOpen(true);
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                      <TableHead>Amount</TableHead>
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

      <Dialog open={challanOpen} onOpenChange={(open) => {
        setChallanOpen(open);
        if (!open) {
          // Clean up when dialog closes
          resetChallanForm();
          setSelectedStudent(null);
          setStudentFeeSummary(null);
          setStudentArrears(null);
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChallan ? "Edit" : "Create"} Fee Challan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={studentSearchOpen} className="w-full justify-between">
                      {selectedStudent ? `${selectedStudent.rollNumber} (${selectedStudent.fName} ${selectedStudent.mName} ${selectedStudent.lName})` : "Search Student..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Search by name or roll no..." onValueChange={v => handleStudentSearch(v, setStudentSearchResults)} />
                      <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                          {studentSearchResults.map(student => (
                            <CommandItem
                              key={student.id}
                              value={student.id.toString()}
                              onSelect={async () => {
                                setSelectedStudent(student);
                                setChallanForm({ ...challanForm, studentId: student.id.toString() });
                                setStudentSearchOpen(false);
                                try {
                                  const summary = await getStudentFeeSummary(student.id);
                                  setStudentFeeSummary(summary);

                                  // Fetch arrears data
                                  try {
                                    const arrearsData = await getStudentArrears(student.id);
                                    console.log('🔍 Arrears Data:', arrearsData);
                                    console.log('📊 Total Arrears:', arrearsData?.totalArrears);
                                    console.log('📋 Arrears Count:', arrearsData?.arrearsCount);
                                    setStudentArrears(arrearsData);
                                  } catch (arrErr) {
                                    console.error('❌ Error fetching arrears:', arrErr);
                                    setStudentArrears(null);
                                  }

                                  // Auto-fill amount if available
                                  if (summary) {
                                    const perInstallment = summary.feeStructure ?
                                      (summary.feeStructure.totalAmount / summary.feeStructure.installments) : 0;

                                    // Set initial amount based on remaining tuition
                                    const remainingTuition = summary.summary.totalAmount - (summary.summary.tuitionPaid || 0);
                                    const initialAmount = remainingTuition <= 0 ? 0 : Math.round(perInstallment);

                                    setChallanForm(prev => ({
                                      ...prev,
                                      amount: initialAmount.toString()
                                    }));
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedStudent?.id === student.id ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{student.rollNumber} ({student.fName} {student.mName} {student.lName})</span>
                                <span className="text-xs text-muted-foreground">{student.program?.name} {student.class?.name}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {studentFeeSummary && (
                <div className="bg-muted p-4 rounded-lg text-sm space-y-3 relative">
                  {(studentFeeSummary.summary.totalAmount - (studentFeeSummary.summary.tuitionPaid || 0)) <= 0 && (
                    <div className="absolute top-2 right-2 bg-success text-success-foreground px-2 py-1 rounded text-xs font-bold">
                      FULLY PAID
                    </div>
                  )}
                  <div className="font-semibold border-b pb-2">Fee Summary ({studentFeeSummary.feeStructure?.class?.name || 'Current Class'})</div>

                  {/* Tuition Section */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">Tuition Fees:</div>
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      <div className="text-xs">Total: <span className="font-medium">PKR {studentFeeSummary.summary.totalAmount.toLocaleString()}</span></div>
                      <div className="text-xs">Paid: <span className="font-medium text-success">PKR {(studentFeeSummary.summary.tuitionPaid || 0).toLocaleString()}</span></div>
                      <div className="text-xs">Remaining: <span className="font-medium text-destructive">PKR {Math.max(0, studentFeeSummary.summary.totalAmount - (studentFeeSummary.summary.tuitionPaid || 0)).toLocaleString()}</span></div>
                      <div className="text-xs">Installments: <span className="font-medium">{studentFeeSummary.summary.paidInstallments} / {studentFeeSummary.summary.totalInstallments}</span></div>
                    </div>
                  </div>

                  {/* Additional Charges & Discounts Summary */}
                  {((studentFeeSummary.summary.additionalChargesPaid && Object.keys(studentFeeSummary.summary.additionalChargesPaid).length > 0) || studentFeeSummary.summary.totalDiscount > 0) && (
                    <div className="space-y-1 border-t pt-2">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <span>⚠️ Already Paid This Session:</span>
                      </div>
                      <div className="pl-2 space-y-1 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        {studentFeeSummary.summary.additionalChargesPaid && Object.keys(studentFeeSummary.summary.additionalChargesPaid).length > 0 && (
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-blue-900 dark:text-blue-100">Additional Charges:</div>
                            {Object.entries(studentFeeSummary.summary.additionalChargesPaid).map(([chargeName, amount]) => (
                              <div key={chargeName} className="text-xs pl-2 text-blue-800 dark:text-blue-200">
                                ✓ {chargeName}: <span className="font-medium">PKR {Number(amount).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="text-xs text-blue-700 dark:text-blue-300 italic mt-1">
                              Note: These charges have been paid. Avoid re-selecting them below.
                            </div>
                          </div>
                        )}
                        {studentFeeSummary.summary.totalDiscount > 0 && (
                          <div className="text-xs border-t border-blue-200 dark:border-blue-800 pt-1">
                            Total Discounts Applied: <span className="font-medium text-primary">PKR {studentFeeSummary.summary.totalDiscount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* This Challan Breakdown */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">This Challan:</div>
                    <div className="grid grid-cols-2 gap-2 pl-2 text-xs">
                      <div>
                        Base Amount:
                        <span className="font-medium text-foreground ml-1">
                          PKR {studentFeeSummary.feeStructure ?
                            (studentFeeSummary.feeStructure.totalAmount / studentFeeSummary.feeStructure.installments).toLocaleString() :
                            Number(challanForm.amount).toLocaleString()}
                        </span>
                        {(studentFeeSummary.summary.totalAmount - (studentFeeSummary.summary.tuitionPaid || 0)) <= 0 && (
                          <span className="ml-2 text-success font-bold">PAID</span>
                        )}
                      </div>
                      <div>Additions: <span className="font-medium text-warning">PKR {Number(challanForm.fineAmount || 0).toLocaleString()}</span></div>
                      <div>Discounts: <span className="font-medium text-primary">PKR {Number(challanForm.discount || 0).toLocaleString()}</span></div>
                      <div className="font-bold text-foreground">
                        Total Payable: PKR {Number(challanForm.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrears Warning */}
              {studentArrears && studentArrears.totalArrears > 0 && (
                <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-3 mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                      <h4 className="font-semibold text-destructive text-sm">PREVIOUS ARREARS FOUND</h4>
                    </div>
                    <div className="text-destructive font-bold">PKR {studentArrears.totalArrears.toLocaleString()}</div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {studentArrears.arrearsCount} unpaid session(s) from previous classes
                  </p>

                  {studentArrears.arrearsBySession && studentArrears.arrearsBySession.length > 0 && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer text-destructive hover:underline font-medium">
                        View Breakdown by Session
                      </summary>
                      <div className="mt-2 space-y-2 pl-2 border-l-2 border-destructive/30">
                        {studentArrears.arrearsBySession.map((session, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {session.className} - {session.programName}
                            </div>
                            <div>Arrears: PKR {session.totalArrears.toLocaleString()}</div>
                            <div className="text-[10px]">
                              {session.challans?.length || 0} challan(s),
                              {session.oldestDaysOverdue > 0 && ` oldest: ${session.oldestDaysOverdue} days overdue`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {/* asdasd */}
                  {/* Arrears Payment Checkbox */}
                  <div className="mt-3 pt-3 border-t border-destructive/30">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-destructive/5 p-2 rounded transition">
                      <input
                        type="checkbox"
                        checked={challanForm.isArrearsPayment || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          // Get first arrears session (highest arrears)
                          const firstArrearsSession = studentArrears.arrearsBySession?.[0];

                          setChallanForm(prev => ({
                            ...prev,
                            isArrearsPayment: isChecked,
                            amount: isChecked ? firstArrearsSession?.totalArrears?.toString() : prev.amount,
                            remarks: isChecked ? `Arrears payment for ${firstArrearsSession?.className || 'previous'} - ${firstArrearsSession?.programName || 'sessions'}` : (prev.remarks || ''),
                            // Pass the arrear record ID
                            studentArrearId: isChecked ? firstArrearsSession?.id : undefined,
                            // Clear other arrears-specific fields when unchecked
                            arrearsSessionClassId: undefined,
                            arrearsSessionProgramId: undefined,
                            arrearsSessionFeeStructureId: undefined,
                            arrearsInstallments: undefined
                          }));
                        }}
                        className="w-4 h-4 text-destructive border-destructive focus:ring-destructive"
                      />
                      <span className="text-sm font-medium text-destructive">
                        Pay arrears (PKR {studentArrears.totalArrears.toLocaleString()})
                      </span>

                    </label>

                    {/* Installment Option */}
                    {challanForm.isArrearsPayment && (
                      <div className="ml-6 mt-2 space-y-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={challanForm.arrearsInstallments > 1}
                            onChange={(e) => {
                              setChallanForm(prev => ({
                                ...prev,
                                arrearsInstallments: e.target.checked ? 2 : 1,
                                amount: e.target.checked
                                  ? (studentArrears.totalArrears / 2).toFixed(0)
                                  : studentArrears.totalArrears.toString()
                              }));
                            }}
                            className="w-3 h-3"
                          />
                          <span className="text-muted-foreground">Auto-calculate Installments</span>
                        </label>

                        {challanForm.arrearsInstallments > 1 && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Number of installments:</label>
                            <input
                              type="number"
                              min="2"
                              max="12"
                              value={challanForm.arrearsInstallments}
                              onChange={(e) => {
                                const installments = Math.max(2, Math.min(12, parseInt(e.target.value) || 2));
                                const perInstallment = Math.ceil(studentArrears.totalArrears / installments);
                                setChallanForm(prev => ({
                                  ...prev,
                                  arrearsInstallments: installments,
                                  amount: perInstallment.toString(),
                                  remarks: `Arrears payment - Installment 1 of ${installments} (PKR ${perInstallment.toLocaleString()} each)`
                                }));
                              }}
                              className="w-20 px-2 py-1 text-xs border rounded"
                            />
                            <p className="text-xs text-muted-foreground">
                              Per installment: PKR {Math.ceil(studentArrears.totalArrears / (challanForm.arrearsInstallments || 1)).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">
                              Creates 1st installment challan. Create remaining manually.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-1 ml-6">
                      {challanForm.arrearsInstallments > 1
                        ? `Arrears installment challan (${challanForm.arrearsInstallments} total)`
                        : 'Creates arrears challan linked to original session'}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>{challanForm.isArrearsPayment ? "Payment Amount (Partial or Full)" : "Payable (PKR)"}</Label>
                <Input
                  type="number"
                  value={challanForm.amount}
                  onChange={e => setChallanForm({ ...challanForm, amount: e.target.value })}
                  placeholder="Amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={challanForm.dueDate}
                  onChange={e => setChallanForm({ ...challanForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Additional Charges & Discounts</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-[400px] overflow-y-auto">
                  {feeHeads.filter(h => !h.isTuition).map(head => (
                    <div key={head.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`head-${head.id}`}
                          className="w-4 h-4"
                          checked={(challanForm.selectedHeads || []).includes(head.id)}
                          onChange={e => {
                            const currentHeads = challanForm.selectedHeads || [];
                            let newHeads;
                            if (e.target.checked) {
                              newHeads = [...currentHeads, head.id];
                            } else {
                              newHeads = currentHeads.filter(id => id !== head.id);
                            }

                            // Recalculate totals
                            const selectedHeadObjects = feeHeads.filter(h => newHeads.includes(h.id));
                            const newFine = selectedHeadObjects
                              .filter(h => !h.isDiscount && !h.isTuition)
                              .reduce((sum, h) => sum + h.amount, 0);
                            const newDiscount = selectedHeadObjects
                              .filter(h => h.isDiscount)
                              .reduce((sum, h) => sum + h.amount, 0);

                            // Calculate delta from current values
                            const oldFine = challanForm.fineAmount || 0;
                            const oldDiscount = challanForm.discount || 0;
                            const currentAmount = parseFloat(challanForm.amount) || 0;

                            // Apply delta to current amount
                            const deltaFine = newFine - oldFine;
                            const deltaDiscount = newDiscount - oldDiscount;
                            const newTotalAmount = currentAmount + deltaFine - deltaDiscount;

                            setChallanForm({
                              ...challanForm,
                              selectedHeads: newHeads,
                              fineAmount: newFine,
                              discount: newDiscount,
                              amount: Math.round(newTotalAmount).toString()
                            });
                          }}
                        />
                        <Label htmlFor={`head-${head.id}`} className={head.isDiscount ? "text-primary" : ""}>
                          {head.name}
                          {head.isDiscount && " (Discount)"}
                          {head.isFine && " (Fine)"}
                          {head.isLabFee && " (Lab)"}
                          {head.isLibraryFee && " (Library)"}
                          {head.isRegistrationFee && " (Registration)"}
                          {head.isAdmissionFee && " (Admission)"}
                          {head.isProspectusFee && " (Prospectus)"}
                          {head.isExaminationFee && " (Examination)"}
                          {head.isAlliedCharges && " (Allied)"}
                          {head.isHostelFee && " (Hostel)"}
                          {head.isOther && " (Other)"}
                          {studentFeeSummary?.summary?.additionalChargesPaid?.[head.name] !== undefined && (
                            <Badge variant="secondary" className="ml-2 text-[10px] h-5 bg-green-100 text-green-800 hover:bg-green-100">
                              PAID
                            </Badge>
                          )}
                        </Label>
                      </div>
                      <span className="text-sm font-medium">PKR {head.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea value={challanForm.remarks} onChange={e => setChallanForm({
                  ...challanForm,
                  remarks: e.target.value
                })} placeholder="Optional remarks..." rows={4} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setChallanOpen(false)
              setSelectedStudent(null)
            }}>Cancel</Button>
            <Button
              onClick={handleSubmitChallan}
              disabled={createChallanMutation.isPending || updateChallanMutation.isPending}
            >
              {createChallanMutation.isPending || updateChallanMutation.isPending ? "Processing..." : (editingChallan ? "Update" : "Create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog >

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
              <br />
              Amount: PKR {itemToPay ? Math.round(itemToPay.amount - itemToPay.discount + itemToPay.fineAmount).toLocaleString() : 0}
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

      {/* Challan Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Challan Details</DialogTitle>
          </DialogHeader>
          {selectedChallanDetails && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Challan #:</span>
                <span className="font-medium">{selectedChallanDetails.challanNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{selectedChallanDetails.student?.fName} {selectedChallanDetails.student?.lName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Roll Number:</span>
                <span className="font-medium">{selectedChallanDetails.student?.rollNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Installment:</span>
                <span className="font-medium">
                  {selectedChallanDetails.installmentNumber === 0
                    ? "Additional Charges Only"
                    : (selectedChallanDetails.coveredInstallments
                      ? `#${selectedChallanDetails.coveredInstallments}`
                      : `#${selectedChallanDetails.installmentNumber}`)}
                </span>
              </div>

              <hr className="my-4" />

              <div className="font-semibold text-sm mb-2">Fee Breakdown</div>

              {selectedChallanDetails.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tuition Fee</span>
                  <span className="font-medium">PKR {Math.round(selectedChallanDetails.amount).toLocaleString()}</span>
                </div>
              )}

              {(() => {
                // Handle both array format (new) and JSON string format (legacy)
                let heads = [];
                try {
                  if (typeof selectedChallanDetails.selectedHeads === 'string') {
                    heads = JSON.parse(selectedChallanDetails.selectedHeads || '[]');
                  } else if (Array.isArray(selectedChallanDetails.selectedHeads)) {
                    heads = selectedChallanDetails.selectedHeads;
                  }
                } catch {
                  heads = [];
                }

                // Only show heads with amount > 0 (selected ones)
                const additionalHeads = heads.filter(h => h.type === 'additional' && h.amount > 0);
                const discountHeads = heads.filter(h => h.type === 'discount' && h.amount > 0);

                if (additionalHeads.length === 0 && discountHeads.length === 0) {
                  // Fallback for old challans without detailed breakdown
                  return selectedChallanDetails.fineAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Additional Charges</span>
                      <span>PKR {Math.round(selectedChallanDetails.fineAmount).toLocaleString()}</span>
                    </div>
                  );
                }

                return (
                  <>
                    {additionalHeads.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium mt-2">Additional Charges:</div>
                        {additionalHeads.map((head, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-2">
                            <span className="text-muted-foreground">{head.name}</span>
                            <span>PKR {Math.round(head.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {discountHeads.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-medium mt-2">Discounts:</div>
                        {discountHeads.map((head, idx) => (
                          <div key={idx} className="flex justify-between text-sm pl-2 text-primary">
                            <span>{head.name}</span>
                            <span>-PKR {Math.round(head.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}

              {selectedChallanDetails.discount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-PKR {Math.round(selectedChallanDetails.discount).toLocaleString()}</span>
                </div>
              )}

              <hr className="my-2" />

              <div className="flex justify-between font-semibold">
                <span>Total Payable</span>
                <span>PKR {Math.round(
                  (selectedChallanDetails.amount || 0) +
                  (selectedChallanDetails.fineAmount || 0) -
                  (selectedChallanDetails.discount || 0)
                ).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-green-600">
                <span>Paid Amount</span>
                <span>PKR {Math.round(selectedChallanDetails.paidAmount || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge variant={selectedChallanDetails.status === "PAID" ? "default" : selectedChallanDetails.status === "OVERDUE" ? "destructive" : "secondary"}>
                  {selectedChallanDetails.status}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span>{new Date(selectedChallanDetails.dueDate).toLocaleDateString()}</span>
              </div>

              {selectedChallanDetails.remarks && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Remarks:</span>
                  <p className="mt-1 text-xs bg-muted p-2 rounded">{selectedChallanDetails.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  </DashboardLayout >;
};
export default FeeManagement;
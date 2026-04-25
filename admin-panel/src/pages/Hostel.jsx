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
import { useData } from "@/contexts/DataContext";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHostelRegistrations,
  createHostelRegistration,
  updateHostelRegistration,
  deleteHostelRegistration,
  getRooms,
  createRoom,
  updateRoom as updateRoomApi,
  deleteRoom as deleteRoomApi,
  allocateRoom,
  deallocateStudent,
  getHostelExpenses,
  createHostelExpense,
  updateHostelExpense,
  deleteHostelExpense,
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  searchStudents,
  getExternalChallansByRegistration,
  createExternalChallan,
  updateExternalChallan,
  deleteExternalChallan,
  getFeeHeads,
  getHostelFeePayments,
  createHostelFeePayment,
  deleteHostelFeePayment,
  searchHostelRegistrations,
  createHostelChallan,
  getHostelChallansByRegistration,
  updateHostelChallan,
  deleteHostelChallan,
  getInstituteSettings,
  getDefaultFeeChallanTemplate,
} from "../../config/apis";
import { computeOutstandingBalance } from "@/lib/hostelUtils";
import { Home, Bed, UtensilsCrossed, DollarSign, Edit, Trash2, UserPlus, Package, Search, X, Receipt, Plus, Eye, ExternalLink, Printer, AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Hostel = () => {
  const {
    students,
    messAllocations,
    addMessAllocation,
    updateMessAllocation,
    deleteMessAllocation,
  } = useData();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: hostelRegistrations = [] } = useQuery({
    queryKey: ['hostelRegistrations'],
    queryFn: getHostelRegistrations
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms
  });

  const { data: hostelExpenses = [] } = useQuery({
    queryKey: ['hostelExpenses'],
    queryFn: getHostelExpenses
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: getInventoryItems
  });

  // Fees tab queries — declared after state (see below for useState)
  const externalRegistrations = hostelRegistrations.filter(r => !r.studentId);

  const { data: feeHeads = [] } = useQuery({
    queryKey: ['feeHeads'],
    queryFn: getFeeHeads,
  });

  // UI State
  const [activeTab, setActiveTab] = useState("registration");
  const [regOpen, setRegOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [messOpen, setMessOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Student search state
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState("internal"); // "internal" or "external"

  const [regFormData, setRegFormData] = useState({
    studentId: "",
    externalName: "",
    externalInstitute: "",
    externalGuardianName: "",
    externalGuardianNumber: "",
    guardianCnic: "",
    studentCnic: "",
    address: "",
    decidedFeePerMonth: "",
    registrationDate: new Date().toISOString().split("T")[0],
    roomId: ""
  });
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: "",
    roomType: "Double",
    capacity: 2
  });
  const [messFormData, setMessFormData] = useState({
    studentId: "",
    messPlan: "Standard",
    monthlyCost: 3000,
    remarks: ""
  });
  const [expenseFormData, setExpenseFormData] = useState({
    expenseTitle: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    remarks: ""
  });
  const [inventoryFormData, setInventoryFormData] = useState({
    itemName: "",
    category: "Furniture",
    quantity: 1,
    condition: "New",
    allocatedToRoom: ""
  });

  // External student profile dialog state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileReg, setProfileReg] = useState(null);

  // Fees tab state (legacy challan — kept for backward compatibility)
  const [selectedExternalReg, setSelectedExternalReg] = useState(null);
  const [challanOpen, setChallanOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  // Fee tracking state (legacy simple payments)
  const [feeTrackingReg, setFeeTrackingReg] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({ month: "", paidDate: "", amount: "" });

  // Hostel challan state
  const [challanRegSearch, setChallanRegSearch] = useState("");
  const [challanRegResults, setChallanRegResults] = useState([]);
  const [selectedChallanReg, setSelectedChallanReg] = useState(null); // full registration object
  const [generateChallanOpen, setGenerateChallanOpen] = useState(false);
  const [generateChallanForm, setGenerateChallanForm] = useState({
    monthValue: new Date().toISOString().slice(0, 7), // "YYYY-MM" for the picker
    dueDate: new Date().toISOString().split('T')[0],
    fineAmount: "",
    discount: "",
    remarks: "",
  });
  const [bulkGenSearch, setBulkGenSearch] = useState("");
  const [bulkGenSelected, setBulkGenSelected] = useState([]); // array of registration IDs
  const [bulkGenResults, setBulkGenResults] = useState([]);
  const [bulkChallanMap, setBulkChallanMap] = useState({}); // registrationId -> challan[]
  const [payHostelChallanOpen, setPayHostelChallanOpen] = useState(false);
  const [payingChallan, setPayingChallan] = useState(null);
  const [payHostelAmount, setPayHostelAmount] = useState("");
  const [payHostelDate, setPayHostelDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanPreviewOpen, setChallanPreviewOpen] = useState(false);
  const [challanPreviewHtml, setChallanPreviewHtml] = useState("");
  const [editingHostelChallan, setEditingHostelChallan] = useState(null);
  const [editHostelChallanForm, setEditHostelChallanForm] = useState({ fineAmount: "", discount: "", remarks: "", dueDate: "" });
  const [challanDeleteConfirmOpen, setChallanDeleteConfirmOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);

  const { data: externalChallans = [], refetch: refetchExternalChallans } = useQuery({
    queryKey: ['externalChallans', selectedExternalReg],
    queryFn: () => getExternalChallansByRegistration(selectedExternalReg),
    enabled: !!selectedExternalReg,
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ['hostelFeePayments', feeTrackingReg],
    queryFn: () => getHostelFeePayments(feeTrackingReg),
    enabled: !!feeTrackingReg,
  });

  // Hostel challan queries
  const { data: hostelChallans = [], refetch: refetchHostelChallans } = useQuery({
    queryKey: ['hostelChallans', selectedChallanReg?.id],
    queryFn: () => getHostelChallansByRegistration(selectedChallanReg.id),
    enabled: !!selectedChallanReg?.id,
  });

  // Challans for the profile dialog (both internal and external)
  const { data: profileChallans = [] } = useQuery({
    queryKey: ['hostelChallans', profileReg?.id],
    queryFn: () => getHostelChallansByRegistration(profileReg.id),
    enabled: !!profileReg?.id,
  });

  const { data: instituteSettings } = useQuery({
    queryKey: ['instituteSettings'],
    queryFn: getInstituteSettings,
    staleTime: 5 * 60 * 1000,
  });
  const hostelLateFee = instituteSettings?.hostelLateFee ?? 0;

  const createPaymentMutation = useMutation({
    mutationFn: (data) => createHostelFeePayment(feeTrackingReg, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelFeePayments', feeTrackingReg] });
      setPaymentOpen(false);
      setPaymentFormData({ month: "", paidDate: "", amount: "" });
      toast({ title: "Payment recorded" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to record payment", variant: "destructive" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId) => deleteHostelFeePayment(feeTrackingReg, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelFeePayments', feeTrackingReg] });
      toast({ title: "Payment deleted" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to delete payment", variant: "destructive" });
    },
  });

  // Hostel challan mutations
  const createChallanMutation = useMutation({
    mutationFn: createHostelChallan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelChallans', selectedChallanReg?.id] });
    },
    onError: (e) => toast({ title: e.message || "Failed to generate challan", variant: "destructive" }),
  });

  const updateChallanMutation = useMutation({
    mutationFn: ({ id, dto }) => updateHostelChallan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelChallans', selectedChallanReg?.id] });
      setPayHostelChallanOpen(false);
      setPayingChallan(null);
      setEditingHostelChallan(null);
      toast({ title: "Challan updated" });
    },
    onError: (e) => toast({ title: e.message || "Failed to update challan", variant: "destructive" }),
  });

  const deleteChallanMutation = useMutation({
    mutationFn: deleteHostelChallan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelChallans', selectedChallanReg?.id] });
      toast({ title: "Challan deleted" });
    },
    onError: (e) => toast({ title: e.message || "Failed to delete challan", variant: "destructive" }),
  });
  const [challanFormData, setChallanFormData] = useState({
    amount: "",
    discount: "0",
    fineAmount: "0",
    dueDate: new Date().toISOString().split("T")[0],
    month: "",
    remarks: "",
    selectedHeads: []
  });

  // Search students using API with debouncing
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (studentSearch && studentSearch.length >= 2) {
        setSearchLoading(true);
        try {
          const results = await searchStudents(studentSearch);
          setSearchResults(results.slice(0, 10)); // Limit to 10 results
        } catch (error) {
          console.error('Student search failed:', error);
          setSearchResults([]);
        }
        setSearchLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchDebounce);
  }, [studentSearch]);

  // Search hostel registrations for the fees tab — client-side from already-loaded data
  useEffect(() => {
    if (challanRegSearch.length < 2) {
      setChallanRegResults([]);
      return;
    }
    const q = challanRegSearch.toLowerCase();
    const results = hostelRegistrations.filter(reg => {
      const name = reg.student
        ? `${reg.student.fName} ${reg.student.lName || ''}`.toLowerCase()
        : (reg.externalName || '').toLowerCase();
      const roll = reg.student?.rollNumber?.toLowerCase() || '';
      const regId = reg.id.toLowerCase();
      return name.includes(q) || roll.includes(q) || regId.includes(q);
    });
    setChallanRegResults(results.slice(0, 10));
  }, [challanRegSearch, hostelRegistrations]);

  // Hostel challan helpers
  const getChallanTotal = (c) =>
    (c.hostelFee || 0) + (c.fineAmount || 0) + (c.lateFeeFine || 0) + (c.arrearsAmount || 0) - (c.discount || 0);

  const getChallanBalance = (c) => Math.max(0, getChallanTotal(c) - (c.paidAmount || 0));

  // Effective total including client-computed late fee for overdue challans not yet updated
  const getChallanTotalEffective = (c) => {
    const lateFee = getEffectiveLateFee ? getEffectiveLateFee(c) : (c.lateFeeFine || 0);
    return (c.hostelFee || 0) + (c.fineAmount || 0) + lateFee + (c.arrearsAmount || 0) - (c.discount || 0);
  };

  const getChallanBalanceEffective = (c) => Math.max(0, getChallanTotalEffective(c) - (c.paidAmount || 0));

  // Convert "YYYY-MM" picker value to "Month YYYY" display string
  const monthValueToLabel = (val) => {
    if (!val) return "";
    const [y, m] = val.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' }) + ' ' + y;
  };

  const numberToWords = (n) => {
    if (!n || n === 0) return "Zero Only";
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    const convert = (num) => {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? " "+ones[num%10] : "");
      if (num < 1000) return ones[Math.floor(num/100)]+" Hundred"+(num%100 ? " and "+convert(num%100) : "");
      if (num < 100000) return convert(Math.floor(num/1000))+" Thousand"+(num%1000 ? " "+convert(num%1000) : "");
      return convert(Math.floor(num/100000))+" Lakh"+(num%100000 ? " "+convert(num%100000) : "");
    };
    return convert(Math.round(n)) + " Only";
  };

  // Calculate current late fee for a hostel challan (client-side, for display)
  const calculateHostelLateFee = (dueDate) => {
    if (!dueDate || !hostelLateFee || hostelLateFee <= 0) return 0;
    const now = new Date(); now.setHours(0,0,0,0);
    const due = new Date(dueDate); due.setHours(0,0,0,0);
    if (now <= due) return 0;
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays * hostelLateFee;
  };

  // Get effective late fee — use stored value or compute if overdue and not yet stored
  const getEffectiveLateFee = (challan) => {
    if ((challan.lateFeeFine || 0) > 0) return challan.lateFeeFine;
    if (challan.status === 'PAID' || challan.status === 'VOID') return 0;
    return calculateHostelLateFee(challan.dueDate);
  };

  const generateHostelChallanHtml = async (challan, reg) => {
    const template = await getDefaultFeeChallanTemplate();
    const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
    const rollNo = reg.student?.rollNumber || reg.id;
    const guardian = reg.student?.fatherOrguardian || reg.externalGuardianName || "—";
    const effectiveLateFee = getEffectiveLateFee(challan);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }) : "N/A";

    // Build arrears chain from previousChallan FK (like FeeManagement's previousChallans)
    const flattenPrevChain = (c) => {
      const result = [];
      let node = c.previousChallan;
      while (node) {
        result.unshift(node); // oldest first
        node = node.previousChallan;
      }
      return result;
    };
    const prevChainChallans = flattenPrevChain(challan); // oldest to newest, max 5

    // Arrears rows: one row per previous challan in the chain
    const arrearsRowsHtml = prevChainChallans.map(pc => {
      const pcTotal = (pc.hostelFee||0) + (pc.fineAmount||0) + (pc.lateFeeFine||0) + (pc.arrearsAmount||0) - (pc.discount||0);
      const pcBalance = Math.max(0, pcTotal - (pc.paidAmount||0));
      return `<tr><td>Arrears - ${pc.month}</td><td>${pcBalance.toLocaleString()}</td></tr>`;
    }).join('');

    // Total arrears = stored arrearsAmount (snapshot at creation)
    const arrearsAmount = challan.arrearsAmount || 0;

    // Fee heads rows — fine + late fee only (NOT arrears — those go in arrearsRows)
    const feeHeadsRowsHtml = [
      challan.fineAmount > 0 ? `<tr><td>Fine / Additional</td><td>${challan.fineAmount.toLocaleString()}</td></tr>` : '',
      effectiveLateFee > 0 ? `<tr><td>Late Fee (Overdue)</td><td>${effectiveLateFee.toLocaleString()}</td></tr>` : '',
    ].join('');

    const total = (challan.hostelFee||0) + (challan.fineAmount||0) + effectiveLateFee + arrearsAmount - (challan.discount||0);
    const balance = Math.max(0, total - (challan.paidAmount||0));

    // Payment history: last 5 months from the chain (oldest first)
    const historyChallans = prevChainChallans.slice(-5);
    const paymentHistoryMonths = historyChallans.map(h => `<td>${h.month}</td>`).join('');
    const paymentHistoryTotals = historyChallans.map(h => {
      const t = (h.hostelFee||0) + (h.fineAmount||0) + (h.lateFeeFine||0) + (h.arrearsAmount||0) - (h.discount||0);
      return `<td>${t.toLocaleString()}</td>`;
    }).join('');
    const paymentHistoryPaid = historyChallans.map(h => `<td>${(h.paidAmount||0).toLocaleString()}</td>`).join('');

    if (!template?.htmlContent) {
      return `<!DOCTYPE html><html><head><title>Hostel Fee Challan</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:20px}.challan{border:2px solid #333;padding:16px;max-width:420px;margin:auto}.header{text-align:center;border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:10px}.header h2{margin:0;font-size:14px}.header p{margin:2px 0;font-size:10px}table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:4px 6px}.info td:first-child{font-weight:bold;width:40%}.amounts td{border:1px solid #ccc}.amounts td:last-child{text-align:right;font-weight:bold}.total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #333}.paid-row td{background:#d4edda;font-weight:bold;border:1px solid #28a745}.words{font-style:italic;font-size:10px;margin:6px 0;border-top:1px dashed #ccc;padding-top:6px}.status{text-align:center;margin-top:8px;font-size:12px;font-weight:bold;padding:4px;border:1px solid #333}.void{background:#fee2e2;color:#991b1b}.paid{background:#d1fae5;color:#065f46}.pending{background:#fef3c7;color:#92400e}@media print{body{padding:0}}</style>
      </head><body><div class="challan"><div class="header"><h2>HOSTEL FEE CHALLAN</h2><p>Concordia College Peshawar</p></div>
      <table class="info"><tr><td>Challan No</td><td>${challan.challanNumber}</td></tr><tr><td>Student</td><td>${name}</td></tr><tr><td>Roll / Reg No</td><td>${rollNo}</td></tr><tr><td>Guardian</td><td>${guardian}</td></tr><tr><td>Month</td><td>${challan.month}</td></tr><tr><td>Issue Date</td><td>${formatDate(challan.createdAt)}</td></tr><tr><td>Due Date</td><td>${formatDate(challan.dueDate)}</td></tr></table>
      <table class="amounts"><tr><td>Hostel Fee</td><td>PKR ${(challan.hostelFee||0).toLocaleString()}</td></tr>${feeHeadsRowsHtml}${arrearsRowsHtml}${challan.discount > 0 ? `<tr><td>Discount</td><td>- PKR ${challan.discount.toLocaleString()}</td></tr>` : ''}<tr class="total-row"><td>Total Payable</td><td>PKR ${total.toLocaleString()}</td></tr>${challan.paidAmount > 0 ? `<tr class="paid-row"><td>Paid</td><td>PKR ${challan.paidAmount.toLocaleString()}</td></tr>` : ''}${balance > 0 ? `<tr><td>Balance Due</td><td>PKR ${balance.toLocaleString()}</td></tr>` : ''}</table>
      <div class="words">In Words: ${numberToWords(balance > 0 ? balance : total)}</div>
      ${challan.remarks ? `<div style="font-size:10px;margin-top:4px"><b>Remarks:</b> ${challan.remarks}</div>` : ''}
      <div class="status ${challan.status==='PAID'?'paid':challan.status==='VOID'?'void':'pending'}">${challan.status==='VOID'?'SUPERSEDED':challan.status}</div>
      </div></body></html>`;
    }

    const replacements = {
      '{{INSTITUTE_NAME}}': 'Concordia College Peshawar',
      '{{INSTITUTE_ADDRESS}}': '60-C, Near NCS School, University Town Peshawar',
      '{{INSTITUTE_PHONE}}': '091-5619915 | 0332-8581222',
      '{{CHALLAN_TITLE}}': 'Hostel Fee Challan',
      '{{challanNumber}}': challan.challanNumber,
      '{{CHALLAN_NO}}': challan.challanNumber,
      '{{challanNo}}': challan.challanNumber,
      '{{studentName}}': name,
      '{{STUDENT_NAME}}': name,
      '{{fatherName}}': guardian,
      '{{FATHER_NAME}}': guardian,
      '{{rollNumber}}': rollNo,
      '{{rollNo}}': rollNo,
      '{{ROLL_NO}}': rollNo,
      '{{className}}': reg.student?.program?.name || 'Hostel',
      '{{CLASS}}': reg.student?.program?.name || 'Hostel',
      '{{class}}': reg.student?.program?.name || 'Hostel',
      '{{programName}}': 'Hostel',
      '{{PROGRAM}}': 'Hostel',
      '{{program}}': 'Hostel',
      '{{section}}': '',
      '{{SECTION}}': '',
      '{{FULL_CLASS}}': reg.student?.program?.name || 'Hostel',
      '{{issueDate}}': formatDate(challan.createdAt),
      '{{ISSUE_DATE}}': formatDate(new Date()),
      '{{dueDate}}': formatDate(challan.dueDate),
      '{{DUE_DATE}}': formatDate(challan.dueDate),
      '{{VALID_DATE}}': formatDate(challan.dueDate),
      '{{month}}': challan.month || '',
      '{{session}}': '',
      '{{installmentNo}}': `Hostel Fee - ${challan.month}`,
      '{{installmentNumber}}': 'Hostel Fee',
      '{{Tuition Fee}}': (challan.hostelFee||0).toLocaleString(),
      '{{TUITION_ORIGINAL}}': (challan.hostelFee||0).toLocaleString(),
      '{{feeHeadsRows}}': feeHeadsRowsHtml,
      '{{FEE_HEADS_TABLE}}': feeHeadsRowsHtml,
      '{{arrears}}': arrearsAmount > 0 ? arrearsAmount.toLocaleString() : '',
      '{{arrearsRows}}': arrearsRowsHtml,
      '{{discount}}': (challan.discount||0).toLocaleString(),
      '{{SCHOLARSHIP}}': (challan.discount||0).toLocaleString(),
      '{{amount}}': total.toLocaleString(),
      '{{TOTAL_AMOUNT}}': total.toLocaleString(),
      '{{totalPayable}}': balance.toLocaleString(),
      '{{netPayable}}': balance.toLocaleString(),
      '{{NET_PAYABLE}}': balance.toLocaleString(),
      '{{rupeesInWords}}': numberToWords(balance > 0 ? balance : total),
      '{{AMOUNT_IN_WORDS}}': numberToWords(balance > 0 ? balance : total),
      '{{paidRow}}': challan.paidAmount > 0 ? `<tr style="background:#d4edda"><td style="font-weight:bold">Paid</td><td>${challan.paidAmount.toLocaleString()}</td></tr>` : '',
      '{{paymentDetailsRow}}': '',
      '{{paymentHistoryMonths}}': paymentHistoryMonths,
      '{{paymentHistoryTotals}}': paymentHistoryTotals,
      '{{paymentHistoryPaid}}': paymentHistoryPaid,
      '{{totalPaid}}': (challan.paidAmount||0).toLocaleString(),
      '{{PAID_AMOUNT}}': (challan.paidAmount||0).toLocaleString(),
      '{{paidAmount}}': (challan.paidAmount||0).toLocaleString(),
      '{{remaining}}': balance.toLocaleString(),
      '{{REMAINING_AMOUNT}}': balance.toLocaleString(),
      '{{remainingAmount}}': balance.toLocaleString(),
      '{{paidDate}}': challan.paidDate ? formatDate(challan.paidDate) : 'N/A',
      '{{paymentRemarks}}': challan.remarks || '',
      '{{fineAmount}}': effectiveLateFee.toLocaleString(),
      '{{FINE_ORIGINAL}}': effectiveLateFee.toLocaleString(),
      '{{ARREARS_ORIGINAL}}': arrearsAmount.toLocaleString(),
      '{{ARREARS_BALANCE}}': arrearsAmount.toLocaleString(),
      '{{instituteName}}': 'Concordia College Peshawar',
      '{{instituteAddress}}': '60-C, Near NCS School, University Town Peshawar',
    };

    let html = template.htmlContent;
    html = html.replace(/\{\{program\}\}\s*\/\s*\{\{class\}\}\s*\/\s*\{\{section\}\}/g, reg.student?.program?.name || 'Hostel');
    html = html.replace(/\{\{class\}\}\s*\/\s*\{\{section\}\}/g, reg.student?.program?.name || 'Hostel');

    Object.entries(replacements).forEach(([key, value]) => {
      try {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(new RegExp(escaped, 'g'), value);
      } catch {}
    });

    if (hostelLateFee > 0) {
      html = html.replace(/Rs\.?\s*150\s*\/?\s*-?\s*[Pp]er\s+[Dd]ay/g, `Rs. ${hostelLateFee}/- per day`);
      html = html.replace(/Rs\.?\s*150\s*[Pp]er\s+[Dd]ay/g, `Rs. ${hostelLateFee} Per Day`);
      html = html.replace(/150\s*\/?\s*-?\s*per\s+day/gi, `${hostelLateFee}/- per day`);
    }

    html = html.replace(
      /(<tr[^>]*>[\s\S]*?<td[^>]*>\s*Month\s*<\/td>[\s\S]*?<\/tr>[\s\S]*?<tr[^>]*>[\s\S]*?<td[^>]*>\s*Total\s*<\/td>[\s\S]*?<\/tr>[\s\S]*?<tr[^>]*>[\s\S]*?<td[^>]*>\s*Paid\s*<\/td>[\s\S]*?<\/tr>)/gi,
      `<tr><td>Month</td>${paymentHistoryMonths || `<td>${challan.month}</td>`}</tr><tr><td>Total</td>${paymentHistoryTotals || `<td>PKR ${total.toLocaleString()}</td>`}</tr><tr><td>Paid</td>${paymentHistoryPaid || `<td>PKR ${(challan.paidAmount||0).toLocaleString()}</td>`}</tr>`
    );

    return html;
  };

    const previewHostelChallan = async (challan, reg) => {
    try {
      const html = await generateHostelChallanHtml(challan, reg);
      setChallanPreviewHtml(html);
      setChallanPreviewOpen(true);
    } catch (e) {
      toast({ title: "Failed to generate preview", variant: "destructive" });
    }
  };

  const printHostelChallan = async (challan, reg) => {
    try {
      const html = await generateHostelChallanHtml(challan, reg);
      const w = window.open('', '_blank');
      if (!w) { toast({ title: "Pop-up blocked", variant: "destructive" }); return; }
      // Add au script if not already in template
      const printHtml = html.includes('window.print') ? html : html.replace('</body>', '<script>window.onload=()=>window.print()</script></body>');
      w.document.write(printHtml);
      w.document.close();
    } catch (e) {
      toast({ title: "Failed to generate print view", variant: "destructive" });
    }
  };

  const filteredRegistrations = hostelRegistrations.filter(reg => {
    const studentName = reg.student
      ? `${reg.student.fName} ${reg.student.lName || ''}`.toLowerCase()
      : (reg.externalName || '').toLowerCase();
    const rollNumber = reg.student?.rollNumber?.toLowerCase() || 'external';
    const programName = reg.student?.program?.name || reg.externalInstitute || '';

    const matchesProgram = filterProgram === "all" || programName === filterProgram;
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || rollNumber.includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });

  const handleStudentSelect = (student) => {
    const isRegistered = hostelRegistrations.some(reg => reg.studentId === student.id);
    if (isRegistered) {
      toast({ title: "Student is already registered", variant: "destructive" });
      return;
    }
    setSelectedStudent(student);
    setStudentSearch(`${student.fName} ${student.lName || ''} (${student.rollNumber})`);
    setRegFormData({ ...regFormData, studentId: student.id });
    setShowStudentDropdown(false);
    setSearchResults([]);
  };

  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setRegFormData({
      ...regFormData,
      studentId: "",
      externalName: "",
      externalInstitute: "",
      externalGuardianName: "",
      externalGuardianNumber: "",
      guardianCnic: "",
      studentCnic: "",
      address: "",
      decidedFeePerMonth: "",
    });
    setSearchResults([]);
  };

  const handleAddRegistration = async () => {
    if (registrationType === "internal" && !regFormData.studentId) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }
    if (registrationType === "external" && !regFormData.externalName) {
      toast({ title: "Please enter student name", variant: "destructive" });
      return;
    }
    if (!regFormData.roomId) {
      toast({ title: "Please select a room", variant: "destructive" });
      return;
    }

    try {
      if (editMode.reg) {
        // Update registration details
        const updateData = {
          registrationDate: regFormData.registrationDate,
          studentId: registrationType === "internal" ? Number(regFormData.studentId) : null,
          externalName: registrationType === "external" ? regFormData.externalName : null,
          externalInstitute: registrationType === "external" ? regFormData.externalInstitute : null,
          externalGuardianName: registrationType === "external" ? regFormData.externalGuardianName : null,
          externalGuardianNumber: registrationType === "external" ? regFormData.externalGuardianNumber : null,
          decidedFeePerMonth: regFormData.decidedFeePerMonth !== "" ? Number(regFormData.decidedFeePerMonth) : 0,
          // CNIC and address only stored for external students; internal students use Student table data
          ...(registrationType === "external" && {
            guardianCnic: regFormData.guardianCnic || null,
            studentCnic: regFormData.studentCnic || null,
            address: regFormData.address || null,
          }),
        };

        await updateHostelRegistration(editMode.reg, updateData);

        // Handle Room Change Logic
        const studentId = registrationType === "internal" ? Number(regFormData.studentId) : null;
        const externalName = registrationType === "external" ? regFormData.externalName : null;

        const currentRoom = rooms.find(r =>
          r.allocations?.some(alloc =>
            studentId ? alloc.studentId === studentId : alloc.externalName === externalName
          )
        );

        // If room has changed or wasn't assigned
        if (currentRoom && currentRoom.id !== regFormData.roomId) {
          // 1. Deallocate from old room
          const oldAllocation = currentRoom.allocations.find(alloc =>
            studentId ? alloc.studentId === studentId : alloc.externalName === externalName
          );
          if (oldAllocation) {
            await deallocateStudent(oldAllocation.id);
          }

          // 2. Allocate to new room
          await allocateRoom({
            roomId: regFormData.roomId,
            studentId: studentId,
            externalName: externalName,
            allocationDate: regFormData.registrationDate
          });
        } else if (!currentRoom) {
          // If no room was assigned previously, just allocate
          await allocateRoom({
            roomId: regFormData.roomId,
            studentId: studentId,
            externalName: externalName,
            allocationDate: regFormData.registrationDate
          });
        }

        toast({ title: "Registration updated" });
      } else {
        // Create registration
        const registrationData = {
          hostelName: "Main Hostel",
          registrationDate: regFormData.registrationDate,
          status: "active",
          decidedFeePerMonth: regFormData.decidedFeePerMonth !== "" ? Number(regFormData.decidedFeePerMonth) : 0,
          // CNIC and address only stored for external students; internal students use Student table data
          ...(registrationType === "external" && {
            guardianCnic: regFormData.guardianCnic || null,
            studentCnic: regFormData.studentCnic || null,
            address: regFormData.address || null,
          }),
        };

        if (registrationType === "internal") {
          registrationData.studentId = regFormData.studentId;
        } else {
          registrationData.externalName = regFormData.externalName;
          registrationData.externalInstitute = regFormData.externalInstitute;
          registrationData.externalGuardianName = regFormData.externalGuardianName;
          registrationData.externalGuardianNumber = regFormData.externalGuardianNumber;
        }

        await createHostelRegistration(registrationData);

        // Allocate room
        const allocationData = {
          roomId: regFormData.roomId,
          allocationDate: regFormData.registrationDate
        };

        if (registrationType === "internal") {
          allocationData.studentId = Number(regFormData.studentId);
        } else {
          allocationData.externalName = regFormData.externalName;
        }

        await allocateRoom(allocationData);

        toast({ title: "Student registered and room allocated" });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      setRegOpen(false);
      setEditMode({});
      clearStudentSelection();
      setRegFormData({
        studentId: "",
        externalName: "",
        externalInstitute: "",
        externalGuardianName: "",
        externalGuardianNumber: "",
        guardianCnic: "",
        studentCnic: "",
        address: "",
        decidedFeePerMonth: "",
        registrationDate: new Date().toISOString().split("T")[0],
        roomId: ""
      });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save registration", variant: "destructive" });
    }
  };

  const confirmDelete = (type, item) => {
    setDeleteItem({ type, item });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    const { type, item } = deleteItem;

    try {
      if (type === 'reg') {
        const studentRoom = rooms.find(r =>
          r.allocations?.some(alloc =>
            item.studentId ? alloc.studentId === item.studentId : alloc.externalName === item.externalName
          )
        );
        if (studentRoom) {
          const allocation = studentRoom.allocations.find(alloc =>
            item.studentId ? alloc.studentId === item.studentId : alloc.externalName === item.externalName
          );
          if (allocation) await deallocateStudent(allocation.id);
        }
        await deleteHostelRegistration(item.id);
        queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      } else if (type === 'room') {
        await deleteRoomApi(item.id);
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      } else if (type === 'mess') {
        await deleteMessAllocation(item.id);
        // Mess allocations are currently from context, might need to update that too or invalidate if moved to query
      } else if (type === 'expense') {
        await deleteHostelExpense(item.id);
        queryClient.invalidateQueries({ queryKey: ['hostelExpenses'] });
      } else if (type === 'inventory') {
        await deleteInventoryItem(item.id);
        queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      } else if (type === 'challan') {
        await deleteExternalChallan(item.id);
        refetchExternalChallans();
      }
      toast({ title: "Deleted successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
    setDeleteConfirmOpen(false);
    setDeleteItem(null);
  };

  const handleAddRoom = async () => {
    if (!roomFormData.roomNumber) {
      toast({ title: "Please enter room number", variant: "destructive" });
      return;
    }
    try {
      if (editMode.room) {
        await updateRoomApi(editMode.room, {
          roomNumber: roomFormData.roomNumber,
          roomType: roomFormData.roomType.toLowerCase(),
          capacity: Number(roomFormData.capacity)
        });
        toast({ title: "Room updated successfully" });
      } else {
        await createRoom({
          roomNumber: roomFormData.roomNumber,
          roomType: roomFormData.roomType.toLowerCase(),
          capacity: Number(roomFormData.capacity),
          hostelName: "Main Hostel",
          status: "vacant"
        });
        toast({ title: "Room added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomOpen(false);
      setEditMode({});
      setRoomFormData({ roomNumber: "", roomType: "Double", capacity: 2 });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save room", variant: "destructive" });
    }
  };

  const handleAddMess = () => {
    if (!messFormData.studentId && !editMode.mess) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }
    if (editMode.mess) {
      updateMessAllocation(editMode.mess, {
        messPlan: messFormData.messPlan.toLowerCase(),
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({ title: "Mess allocation updated" });
    } else {
      addMessAllocation({
        studentId: messFormData.studentId,
        messPlan: messFormData.messPlan.toLowerCase(),
        mealStatus: "active",
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({ title: "Mess allocation added" });
    }
    setMessOpen(false);
    setEditMode({});
    setMessFormData({ studentId: "", messPlan: "Standard", monthlyCost: 3000, remarks: "" });
  };

  const handleAddExpense = async () => {
    if (!expenseFormData.expenseTitle || !expenseFormData.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    try {
      if (editMode.expense) {
        await updateHostelExpense(editMode.expense, expenseFormData);
        toast({ title: "Expense updated" });
      } else {
        await createHostelExpense(expenseFormData);
        toast({ title: "Expense added" });
      }
      queryClient.invalidateQueries({ queryKey: ['hostelExpenses'] });
      setExpenseOpen(false);
      setEditMode({});
      setExpenseFormData({ expenseTitle: "", amount: 0, date: new Date().toISOString().split("T")[0], remarks: "" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save expense", variant: "destructive" });
    }
  };

  const handleAddInventory = async () => {
    if (!inventoryFormData.itemName) {
      toast({ title: "Please enter item name", variant: "destructive" });
      return;
    }
    try {
      if (editMode.inventory) {
        await updateInventoryItem(editMode.inventory, {
          ...inventoryFormData,
          category: inventoryFormData.category.toLowerCase(),
          quantity: Number(inventoryFormData.quantity)
        });
        toast({ title: "Inventory item updated" });
      } else {
        await createInventoryItem({
          ...inventoryFormData,
          category: inventoryFormData.category.toLowerCase(),
          quantity: Number(inventoryFormData.quantity),
          condition: inventoryFormData.condition.toLowerCase(),
          allocatedToRoom: inventoryFormData.allocatedToRoom || undefined
        });
        toast({ title: "Inventory item added" });
      }
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setInventoryOpen(false);
      setEditMode({});
      setInventoryFormData({ itemName: "", category: "Furniture", quantity: 1, condition: "New", allocatedToRoom: "" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save inventory", variant: "destructive" });
    }
  };

  // Get room for a student
  const getStudentRoom = (studentId, externalName) => {
    const room = rooms.find(r =>
      r.allocations?.some(alloc =>
        studentId ? alloc.studentId === studentId : (externalName && alloc.externalName === externalName)
      )
    );
    return room;
  };

  // Chart data
  const roomOccupancyData = [{
    name: "Occupied",
    value: rooms.reduce((acc, room) => acc + (room.currentOccupancy || 0), 0)
  }, {
    name: "Vacant",
    value: rooms.reduce((acc, room) => acc + (room.capacity - (room.currentOccupancy || 0)), 0)
  }];

  // Expenses Over Time Data
  const expensesOverTimeData = useMemo(() => {
    const data = {};
    hostelExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!data[monthYear]) data[monthYear] = 0;
      data[monthYear] += expense.amount;
    });
    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  }, [hostelExpenses]);

  const messPlansData = [{
    name: "Basic",
    count: messAllocations.filter(m => m.messPlan === "basic").length
  }, {
    name: "Standard",
    count: messAllocations.filter(m => m.messPlan === "standard").length
  }, {
    name: "Premium",
    count: messAllocations.filter(m => m.messPlan === "premium").length
  }];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Home className="w-8 h-8 text-primary" />
              Hostel Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage rooms, students, mess, and hostel finances
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hostelRegistrations.filter(r => r.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.filter(r => r.status === "vacant").length} / {rooms.length}</div>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mess Allocations</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messAllocations.filter(m => m.mealStatus === "active").length}</div>
            </CardContent>
          </Card> */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hostel Registration</CardTitle>
                  <Button onClick={() => {
                    setRegOpen(true);
                    clearStudentSelection();
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Registration
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
                  {/* <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      <SelectItem value="HSSC">HSSC</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="BS">BS</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 px-3 text-sm">Student Name</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Roll Number</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Program</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Room</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Registration Date</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                        <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map(reg => {
                        const studentRoom = getStudentRoom(reg.studentId, reg.externalName);
                        const studentName = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}` : reg.externalName;
                        const rollNumber = reg.student?.rollNumber || "External";
                        const program = reg.student?.program?.name || reg.externalInstitute || "N/A";

                        return <TableRow key={reg.id}>
                          <TableCell className="py-2 px-3 text-sm font-medium">{studentName}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{rollNumber}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">{program}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            {studentRoom ? (
                              <span className="text-sm">
                                Room {studentRoom.roomNumber}
                                <span className="text-muted-foreground ml-1">
                                  ({studentRoom.currentOccupancy}/{studentRoom.capacity})
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">{reg.registrationDate?.split("T")[0]}</TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <Badge variant={reg.status === "active" ? "default" : "secondary"}>
                              {reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-sm">
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    setProfileReg(reg);
                                    setProfileOpen(true);
                                  }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Profile</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => {
                                setEditMode({ reg: reg.id });
                                setRegistrationType(reg.studentId ? "internal" : "external");
                                const studentRoom = getStudentRoom(reg.studentId, reg.externalName);
                                setRegFormData({
                                  studentId: reg.studentId || "",
                                  externalName: reg.externalName || "",
                                  externalInstitute: reg.externalInstitute || "",
                                  externalGuardianName: reg.externalGuardianName || "",
                                  externalGuardianNumber: reg.externalGuardianNumber || "",
                                  guardianCnic: reg.guardianCnic || "",
                                  studentCnic: reg.studentCnic || "",
                                  address: reg.address || "",
                                  decidedFeePerMonth: reg.decidedFeePerMonth != null ? String(reg.decidedFeePerMonth) : "",
                                  registrationDate: reg.registrationDate,
                                  roomId: studentRoom?.id ? String(studentRoom.id) : ""
                                });
                                if (reg.student) {
                                  setStudentSearch(`${reg.student.fName} ${reg.student.lName || ''} (${reg.student.rollNumber})`);
                                  setSelectedStudent(reg.student);
                                }
                                setRegOpen(true);
                              }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="destructive" onClick={() => confirmDelete('reg', reg)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>;
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Room Occupancy (Seats)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={roomOccupancyData} cx="50%" cy="50%" labelLine={false} label={entry => `${entry.name}: ${entry.value}`} outerRadius={80} fill="hsl(var(--primary))" dataKey="value">
                        {roomOccupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expensesOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Room Management</CardTitle>
                  <Button onClick={() => setRoomOpen(true)}>
                    <Bed className="mr-2 h-4 w-4" />
                    Add Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Room Number</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Capacity</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Occupancy</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map(room => <TableRow key={room.id}>
                      <TableCell className="py-2 px-3 text-sm font-medium">{room.roomNumber}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{room.roomType}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{room.capacity}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{room.currentOccupancy} / {room.capacity}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge variant={room.status === "vacant" ? "success" : room.status === "occupied" ? "destructive" : "secondary"}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({ room: room.id });
                            setRoomFormData({
                              roomNumber: room.roomNumber,
                              roomType: room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1),
                              capacity: room.capacity
                            });
                            setRoomOpen(true);
                          }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => confirmDelete('room', room)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="mess" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mess Management</CardTitle>
                  <Button onClick={() => setMessOpen(true)}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Add Allocation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Mess Plan</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messAllocations.map(mess => {
                      const student = students.find(s => s.id === mess.studentId);
                      return <TableRow key={mess.id}>
                        <TableCell>{student?.name}</TableCell>
                        <TableCell className="capitalize">{mess.messPlan}</TableCell>
                        <TableCell>PKR {mess.monthlyCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={mess.mealStatus === "active" ? "default" : "secondary"}>
                            {mess.mealStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{mess.remarks}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditMode({ mess: mess.id });
                              setMessFormData({
                                studentId: mess.studentId,
                                messPlan: mess.messPlan.charAt(0).toUpperCase() + mess.messPlan.slice(1),
                                monthlyCost: mess.monthlyCost,
                                remarks: mess.remarks
                              });
                              setMessOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => confirmDelete('mess', mess)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>;
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent> */}

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hostel Expenses</CardTitle>
                  <Button onClick={() => setExpenseOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Title</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Amount</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Remarks</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostelExpenses.map(expense => <TableRow key={expense.id}>
                      <TableCell className="py-2 px-3 text-sm font-medium">{expense.expenseTitle}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">PKR {expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{expense.date}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{expense.remarks}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({ expense: expense.id });
                            setExpenseFormData({
                              expenseTitle: expense.expenseTitle,
                              amount: expense.amount,
                              date: expense.date,
                              remarks: expense.remarks
                            });
                            setExpenseOpen(true);
                          }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => confirmDelete('expense', expense)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-4">
            {/* Header with bulk generate button */}
            <div className="flex items-center justify-between">
              <div />
              <Button onClick={async () => {
                setBulkGenSearch("");
                setBulkGenSelected(hostelRegistrations.map(r => r.id)); // select all by default
                setBulkGenResults(hostelRegistrations);
                setGenerateChallanOpen(true);
                // Fetch challans for all registrations to show status in the list
                const map = {};
                await Promise.all(hostelRegistrations.map(async reg => {
                  try {
                    const challans = await getHostelChallansByRegistration(reg.id);
                    map[reg.id] = challans;
                  } catch {}
                }));
                setBulkChallanMap(map);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Generate Challans
              </Button>
            </div>

            {/* Search bar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hostel Fee Challans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, roll number, or registration ID..."
                    value={challanRegSearch}
                    onChange={e => { setChallanRegSearch(e.target.value); if (!e.target.value) setSelectedChallanReg(null); }}
                    className="pl-9"
                  />
                  {challanRegSearch && (
                    <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setChallanRegSearch(""); setSelectedChallanReg(null); setChallanRegResults([]); }}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Search results dropdown */}
                {challanRegResults.length > 0 && !selectedChallanReg && (
                  <div className="mt-1 border rounded-md shadow-md bg-popover max-h-60 overflow-auto">
                    {challanRegResults.map(reg => {
                      const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
                      const sub = reg.student ? reg.student.rollNumber : `External · ${reg.id}`;
                      return (
                        <div key={reg.id} className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => { setSelectedChallanReg(reg); setChallanRegSearch(name); setChallanRegResults([]); }}>
                          <div className="font-medium text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">{sub} · {reg.student ? 'Internal' : 'External'} · PKR {Number(reg.decidedFeePerMonth||0).toLocaleString()}/mo</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {challanRegSearch.length >= 2 && challanRegResults.length === 0 && !selectedChallanReg && (
                  <div className="mt-1 border rounded-md px-3 py-2 text-sm text-muted-foreground">No registrations found</div>
                )}
              </CardContent>
            </Card>

            {/* Challan panel — shown after selection */}
            {selectedChallanReg && (() => {
              const reg = selectedChallanReg;
              const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
              const activeChallan = hostelChallans.find(c => c.status !== 'VOID' && c.status !== 'PAID');
              return (
                <>
                  {/* Registration summary */}
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            {reg.student ? `Roll: ${reg.student.rollNumber}` : `Reg: ${reg.id}`} · Decided Fee: PKR {Number(reg.decidedFeePerMonth||0).toLocaleString()}/mo
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { setChallanRegSearch(""); setSelectedChallanReg(null); }}>
                          <X className="mr-1 h-3 w-3" /> Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Challan table */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Challans</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2 px-3 text-sm">Challan No</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Month</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Hostel Fee</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Fine</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Late Fee</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Arrears</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Total</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Paid</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Due Date</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Status</TableHead>
                            <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hostelChallans.length === 0 ? (
                            <TableRow><TableCell colSpan={11} className="py-2 px-3 text-sm text-center text-muted-foreground">No challans generated yet.</TableCell></TableRow>
                          ) : hostelChallans.map(c => {
                            const effectiveLateFee = getEffectiveLateFee(c);
                            const total = (c.hostelFee||0) + (c.fineAmount||0) + effectiveLateFee + (c.arrearsAmount||0) - (c.discount||0);
                            const balance = Math.max(0, total - (c.paidAmount||0));
                            const hasNewLateFee = effectiveLateFee > (c.lateFeeFine||0) && c.status !== 'PAID' && c.status !== 'VOID';
                            return (
                              <TableRow key={c.id} className={c.status === 'VOID' ? 'opacity-50' : ''}>
                                <TableCell className="py-2 px-3 text-sm font-medium">{c.challanNumber}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.month}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">PKR {(c.hostelFee||0).toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.fineAmount > 0 ? `PKR ${c.fineAmount.toLocaleString()}` : '—'}</TableCell>
                                <TableCell className={`py-2 px-3 text-sm ${effectiveLateFee > 0 ? 'text-red-600' : ''}`}>
                                  {effectiveLateFee > 0 ? (
                                    <div>
                                      PKR {effectiveLateFee.toLocaleString()}
                                      {hasNewLateFee && <div className="text-[9px] text-amber-600">accruing</div>}
                                    </div>
                                  ) : '—'}
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.arrearsAmount > 0 ? `PKR ${c.arrearsAmount.toLocaleString()}` : '—'}</TableCell>
                                <TableCell className="py-2 px-3 text-sm font-bold">PKR {total.toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm text-green-600">PKR {(c.paidAmount||0).toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="flex flex-col gap-0.5">
                                    <Badge variant={c.status === 'PAID' ? 'default' : c.status === 'VOID' ? 'outline' : c.status === 'PARTIAL' ? 'warning' : 'secondary'}>
                                      {c.status === 'VOID' ? 'Superseded' : c.status}
                                    </Badge>
                                    {c.status === 'VOID' && c.supersededBy && (
                                      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                        <ArrowRight className="w-2.5 h-2.5" />
                                        <span>#{c.supersededBy.challanNumber}</span>
                                      </div>
                                    )}
                                    {(c.status === 'PAID' || (c.status === 'VOID' && (c.settledAmount || 0) > 0)) && (
                                      <div className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                        <AlertCircle className="w-2.5 h-2.5" /> Locked
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => previewHostelChallan(c, reg)}>
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Preview</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => printHostelChallan(c, reg)}>
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Print</TooltipContent>
                                    </Tooltip>
                                    {c.status !== 'PAID' && c.status !== 'VOID' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                                            onClick={() => { setPayingChallan(c); setPayHostelAmount(String(balance)); setPayHostelDate(new Date().toISOString().split('T')[0]); setPayHostelChallanOpen(true); }}>
                                            Pay
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Record Payment</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {c.status !== 'PAID' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="outline" onClick={() => {
                                            setEditingHostelChallan(c);
                                            setEditHostelChallanForm({
                                              fineAmount: String(c.fineAmount || ""),
                                              discount: String(c.discount || ""),
                                              remarks: c.remarks || "",
                                              dueDate: c.dueDate ? new Date(c.dueDate).toISOString().split('T')[0] : "",
                                            });
                                          }}>
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit</TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="destructive" onClick={() => { setChallanToDelete(c); setChallanDeleteConfirmOpen(true); }}>
                                          <Trash2 className="h-4 w-4" />
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
                </>
              );
            })()}

            {!selectedChallanReg && challanRegSearch.length < 2 && (
              <Card>
                <CardContent className="text-center py-16 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Search for a student or registration to view and manage hostel fee challans</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Inventory Management</CardTitle>
                  <Button onClick={() => setInventoryOpen(true)}>
                    <Package className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Item Name</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Category</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Quantity</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Condition</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Allocated To</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map(item => <TableRow key={item.id}>
                      <TableCell className="py-2 px-3 text-sm font-medium">{item.itemName}</TableCell>
                      <TableCell className="py-2 px-3 text-sm capitalize">{item.category}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{item.quantity}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge variant={item.condition === "new" ? "default" : "secondary"}>
                          {item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">{item.allocatedToRoom || "Not Allocated"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({ inventory: item.id });
                            setInventoryFormData({
                              itemName: item.itemName,
                              category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
                              quantity: item.quantity,
                              condition: item.condition === "new" ? "New" : item.condition === "good" ? "Good" : "Repair Needed",
                              allocatedToRoom: item.allocatedToRoom
                            });
                            setInventoryOpen(true);
                          }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => confirmDelete('inventory', item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hostel Fee Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-sm">
                <div className="space-y-1.5">
                  <Label>Late Fee Fine (PKR per day)</Label>
                  <p className="text-xs text-muted-foreground">Applied automatically when a challan's due date has passed. Amount × overdue days = late fee.</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      defaultValue={hostelLateFee}
                      key={hostelLateFee}
                      id="hostelLateFeeInput"
                    />
                    <Button onClick={async () => {
                      const val = Number(document.getElementById('hostelLateFeeInput').value) || 0;
                      try {
                        const { updateInstituteSettings } = await import('../../config/apis');
                        await updateInstituteSettings({ hostelLateFee: val });
                        queryClient.invalidateQueries({ queryKey: ['instituteSettings'] });
                        toast({ title: "Settings saved" });
                      } catch (e) {
                        toast({ title: e.message || "Failed to save", variant: "destructive" });
                      }
                    }}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Registration Dialog */}
        <Dialog open={regOpen} onOpenChange={open => {
          setRegOpen(open);
          if (!open) {
            setEditMode({});
            clearStudentSelection();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editMode.reg ? "Edit Hostel Registration" : "New Hostel Registration"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                    registrationType === "internal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => { setRegistrationType("internal"); clearStudentSelection(); }}
                >
                  Internal Student
                </button>
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                    registrationType === "external" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => { setRegistrationType("external"); clearStudentSelection(); }}
                >
                  External Student
                </button>
              </div>

              {/* Student identity section */}
              {registrationType === "internal" ? (
                <div className="relative">
                  <Label>Search Student (by name or roll number)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type to search..."
                      value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="pl-9 pr-9"
                    />
                    {studentSearch && (
                      <button
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={clearStudentSelection}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {showStudentDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                      {searchLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
                      {!searchLoading && searchResults.map(student => {
                        const isRegistered = hostelRegistrations.some(reg => reg.studentId === student.id);
                        return (
                          <div
                            key={student.id}
                            className={`px-3 py-2 border-b last:border-b-0 ${isRegistered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}`}
                            onClick={() => !isRegistered && handleStudentSelect(student)}
                          >
                            <div className="font-medium flex justify-between">
                              <span>{student.fName} {student.lName}</span>
                              {isRegistered && <span className="text-xs text-red-500 font-normal">Already Registered</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">Roll: {student.rollNumber} • {student.program?.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showStudentDropdown && !searchLoading && studentSearch.length >= 2 && searchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">
                      No students found
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input placeholder="Student Name" value={regFormData.externalName} onChange={e => setRegFormData({ ...regFormData, externalName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Institute/Organization</Label>
                    <Input placeholder="Institute Name" value={regFormData.externalInstitute} onChange={e => setRegFormData({ ...regFormData, externalInstitute: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Parent/Guardian Name</Label>
                    <Input placeholder="Guardian Name" value={regFormData.externalGuardianName} onChange={e => setRegFormData({ ...regFormData, externalGuardianName: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guardian Contact Number</Label>
                    <Input placeholder="Contact Number" value={regFormData.externalGuardianNumber} onChange={e => setRegFormData({ ...regFormData, externalGuardianNumber: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Room + Date + Fee — always shown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Assign Room</Label>
                  <Select value={regFormData.roomId} onValueChange={value => setRegFormData({ ...regFormData, roomId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => {
                        const isFull = room.currentOccupancy >= room.capacity;
                        const isCurrentRoom = room.allocations?.some(a => a.studentId === Number(regFormData.studentId));
                        const isDisabled = isFull && !isCurrentRoom;
                        return (
                          <SelectItem key={room.id} value={String(room.id)} disabled={isDisabled}>
                            Room {room.roomNumber} ({room.roomType}) - {isFull ? "Full" : `${room.capacity - room.currentOccupancy} Available`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Registration Date</Label>
                  <Input type="date" value={regFormData.registrationDate} onChange={e => setRegFormData({ ...regFormData, registrationDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Decided Fee / Month (PKR) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={regFormData.decidedFeePerMonth}
                    onChange={e => setRegFormData({ ...regFormData, decidedFeePerMonth: e.target.value })}
                  />
                </div>
              </div>

              {/* External-only: CNIC + Address fields (internal students use data from Student table) */}
              {registrationType === "external" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Guardian CNIC <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="e.g. 12345-1234567-1"
                        value={regFormData.guardianCnic}
                        onChange={e => setRegFormData({ ...regFormData, guardianCnic: e.target.value })}
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Student CNIC <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        placeholder="e.g. 12345-1234567-1"
                        value={regFormData.studentCnic}
                        onChange={e => setRegFormData({ ...regFormData, studentCnic: e.target.value })}
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      placeholder="Home address"
                      value={regFormData.address}
                      onChange={e => setRegFormData({ ...regFormData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleAddRegistration} disabled={registrationType === "internal" ? !regFormData.studentId : !regFormData.externalName}>
              {editMode.reg ? "Save Changes" : "Add Registration"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Room Dialog */}
        <Dialog open={roomOpen} onOpenChange={open => {
          setRoomOpen(open);
          if (!open) setEditMode({});
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.room ? "Edit" : "Add"} Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Room Number</Label>
                <Input value={roomFormData.roomNumber} onChange={e => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select value={roomFormData.roomType} onValueChange={value => setRoomFormData({ ...roomFormData, roomType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single (1 person)</SelectItem>
                    <SelectItem value="Double">Double (2 person)</SelectItem>
                    <SelectItem value="Triple">Triple (3 person)</SelectItem>
                    <SelectItem value="Shared">Shared (4+ person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input type="number" min="1" value={roomFormData.capacity} onChange={e => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <Button onClick={handleAddRoom}>{editMode.room ? "Update" : "Add"} Room</Button>
          </DialogContent>
        </Dialog>

        {/* Mess Dialog */}
        {/* <Dialog open={messOpen} onOpenChange={open => {
          setMessOpen(open);
          if (!open) setEditMode({});
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.mess ? "Edit" : "Add"} Mess Allocation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Student</Label>
                <Select value={messFormData.studentId} onValueChange={value => setMessFormData({ ...messFormData, studentId: value })} disabled={!!editMode.mess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.status === "active").map(student => <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mess Plan</Label>
                <Select value={messFormData.messPlan} onValueChange={value => setMessFormData({ ...messFormData, messPlan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Cost</Label>
                <Input type="number" value={messFormData.monthlyCost} onChange={e => setMessFormData({ ...messFormData, monthlyCost: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={messFormData.remarks} onChange={e => setMessFormData({ ...messFormData, remarks: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddMess}>{editMode.mess ? "Update" : "Add"} Allocation</Button>
          </DialogContent>
        </Dialog> */}

        {/* Expense Dialog */}
        <Dialog open={expenseOpen} onOpenChange={open => {
          setExpenseOpen(open);
          if (!open) setEditMode({});
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.expense ? "Edit" : "Add"} Hostel Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Expense Title</Label>
                <Input value={expenseFormData.expenseTitle} onChange={e => setExpenseFormData({ ...expenseFormData, expenseTitle: e.target.value })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={expenseFormData.date} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={expenseFormData.remarks} onChange={e => setExpenseFormData({ ...expenseFormData, remarks: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddExpense}>{editMode.expense ? "Update" : "Add"} Expense</Button>
          </DialogContent>
        </Dialog>

        {/* Inventory Dialog */}
        <Dialog open={inventoryOpen} onOpenChange={open => {
          setInventoryOpen(open);
          if (!open) setEditMode({});
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.inventory ? "Edit" : "Add"} Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input value={inventoryFormData.itemName} onChange={e => setInventoryFormData({ ...inventoryFormData, itemName: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={inventoryFormData.category} onValueChange={value => setInventoryFormData({ ...inventoryFormData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Appliance">Appliance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={inventoryFormData.quantity} onChange={e => setInventoryFormData({ ...inventoryFormData, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={inventoryFormData.condition} onValueChange={value => setInventoryFormData({ ...inventoryFormData, condition: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Repair Needed">Repair Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Allocated To Room (optional)</Label>
                <Select
                  value={inventoryFormData.allocatedToRoom || "none"}
                  onValueChange={value => setInventoryFormData({ ...inventoryFormData, allocatedToRoom: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Allocated</SelectItem>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.roomNumber}>
                        Room {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddInventory}>{editMode.inventory ? "Update" : "Add"} Item</Button>
          </DialogContent>
        </Dialog>

        {/* External Challan Dialog */}
        <Dialog open={challanOpen} onOpenChange={open => { setChallanOpen(open); if (!open) setEditingChallan(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingChallan ? "Edit" : "Create"} Fee Challan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (PKR) *</Label>
                  <Input type="number" value={challanFormData.amount} onChange={e => setChallanFormData({ ...challanFormData, amount: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Month</Label>
                  <Input value={challanFormData.month} onChange={e => setChallanFormData({ ...challanFormData, month: e.target.value })} placeholder="e.g. January 2026" />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input type="date" value={challanFormData.dueDate} onChange={e => setChallanFormData({ ...challanFormData, dueDate: e.target.value })} />
                </div>
                <div>
                  <Label>Discount (PKR)</Label>
                  <Input type="number" value={challanFormData.discount} onChange={e => setChallanFormData({ ...challanFormData, discount: e.target.value })} />
                </div>
                <div>
                  <Label>Fine Amount (PKR)</Label>
                  <Input type="number" value={challanFormData.fineAmount} onChange={e => setChallanFormData({ ...challanFormData, fineAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Fee Heads (optional)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 mt-1">
                  {feeHeads.map(head => {
                    const isSelected = challanFormData.selectedHeads.some(h => h.id === head.id);
                    return (
                      <label key={head.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setChallanFormData({ ...challanFormData, selectedHeads: [...challanFormData.selectedHeads, { id: head.id, name: head.name, amount: head.amount, isSelected: true, type: 'additional' }] });
                            } else {
                              setChallanFormData({ ...challanFormData, selectedHeads: challanFormData.selectedHeads.filter(h => h.id !== head.id) });
                            }
                          }}
                        />
                        {head.name} — PKR {head.amount}
                      </label>
                    );
                  })}
                  {feeHeads.length === 0 && <p className="text-xs text-muted-foreground">No fee heads configured</p>}
                </div>
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={challanFormData.remarks} onChange={e => setChallanFormData({ ...challanFormData, remarks: e.target.value })} rows={2} />
              </div>
              {editingChallan && (
                <div>
                  <Label>Status</Label>
                  <Select value={editingChallan.status} onValueChange={val => setEditingChallan({ ...editingChallan, status: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="VOID">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setChallanOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!challanFormData.amount || !challanFormData.dueDate) {
                  toast({ title: "Amount and due date are required", variant: "destructive" });
                  return;
                }
                try {
                  if (editingChallan) {
                    await updateExternalChallan(editingChallan.id, {
                      amount: Number(challanFormData.amount),
                      discount: Number(challanFormData.discount),
                      fineAmount: Number(challanFormData.fineAmount),
                      dueDate: challanFormData.dueDate,
                      month: challanFormData.month,
                      remarks: challanFormData.remarks,
                      selectedHeads: challanFormData.selectedHeads,
                      status: editingChallan.status,
                    });
                    toast({ title: "Challan updated" });
                  } else {
                    await createExternalChallan({
                      registrationId: selectedExternalReg,
                      amount: Number(challanFormData.amount),
                      discount: Number(challanFormData.discount),
                      fineAmount: Number(challanFormData.fineAmount),
                      dueDate: challanFormData.dueDate,
                      month: challanFormData.month,
                      remarks: challanFormData.remarks,
                      selectedHeads: challanFormData.selectedHeads,
                    });
                    toast({ title: "Challan created" });
                  }
                  refetchExternalChallans();
                  setChallanOpen(false);
                  setEditingChallan(null);
                } catch (error) {
                  toast({ title: error.message || "Failed to save challan", variant: "destructive" });
                }
              }}>
                {editingChallan ? "Update" : "Create"} Challan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generate Hostel Challans — Bulk Dialog */}
      <Dialog open={generateChallanOpen} onOpenChange={open => { setGenerateChallanOpen(open); if (!open) setBulkGenSearch(""); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Hostel Fee Challans</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {/* Month picker */}
            <div className="space-y-1.5">
              <Label>Month <span className="text-destructive">*</span></Label>
              <Input
                type="month"
                value={generateChallanForm.monthValue}
                onChange={e => setGenerateChallanForm(f => ({ ...f, monthValue: e.target.value }))}
              />
              {generateChallanForm.monthValue && (
                <p className="text-xs text-muted-foreground">{monthValueToLabel(generateChallanForm.monthValue)}</p>
              )}
            </div>
            {/* Due date */}
            <div className="space-y-1.5">
              <Label>Due Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={generateChallanForm.dueDate}
                onChange={e => setGenerateChallanForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            {/* Fine */}
            <div className="space-y-1.5">
              <Label>Fine / Additional (PKR) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="number" min={0} placeholder="0" value={generateChallanForm.fineAmount}
                onChange={e => setGenerateChallanForm(f => ({ ...f, fineAmount: e.target.value }))} />
            </div>
            {/* Discount */}
            <div className="space-y-1.5">
              <Label>Discount (PKR) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="number" min={0} placeholder="0" value={generateChallanForm.discount}
                onChange={e => setGenerateChallanForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
          </div>

          {hostelLateFee > 0 && (
            <div className="text-xs text-muted-foreground bg-muted rounded p-2 flex-shrink-0">
              Late fee: PKR {hostelLateFee}/day — au if due date has passed
            </div>
          )}

          {/* Registration list with search + checkboxes */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter registrations..."
                  value={bulkGenSearch}
                  onChange={e => {
                    const q = e.target.value.toLowerCase();
                    setBulkGenSearch(e.target.value);
                    setBulkGenResults(hostelRegistrations.filter(reg => {
                      const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.toLowerCase() : (reg.externalName || '').toLowerCase();
                      const roll = reg.student?.rollNumber?.toLowerCase() || '';
                      return !q || name.includes(q) || roll.includes(q);
                    }));
                  }}
                  className="pl-9"
                />
              </div>
              <button
                className="text-xs text-primary hover:underline whitespace-nowrap"
                onClick={() => setBulkGenSelected(bulkGenResults.length > 0
                  ? bulkGenResults.filter(r => {
                      if (!generateChallanForm.monthValue || !r.registrationDate) return true;
                      const [y, m] = generateChallanForm.monthValue.split('-').map(Number);
                      const challanYM = new Date(y, m - 1, 1);
                      const regDate = new Date(r.registrationDate);
                      return challanYM >= new Date(regDate.getFullYear(), regDate.getMonth(), 1);
                    }).map(r => r.id)
                  : hostelRegistrations.filter(r => {
                      if (!generateChallanForm.monthValue || !r.registrationDate) return true;
                      const [y, m] = generateChallanForm.monthValue.split('-').map(Number);
                      const challanYM = new Date(y, m - 1, 1);
                      const regDate = new Date(r.registrationDate);
                      return challanYM >= new Date(regDate.getFullYear(), regDate.getMonth(), 1);
                    }).map(r => r.id)
                )}
              >Select all</button>
              <button
                className="text-xs text-muted-foreground hover:underline whitespace-nowrap"
                onClick={() => setBulkGenSelected([])}
              >None</button>
            </div>

            <div className="border rounded-md overflow-auto flex-1">
              {(bulkGenResults.length > 0 ? bulkGenResults : hostelRegistrations).map(reg => {
                const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
                const sub = reg.student ? reg.student.rollNumber : `External · ${reg.id}`;
                const checked = bulkGenSelected.includes(reg.id);
                // Find challan status for the selected month
                const selectedMonthLabel = monthValueToLabel(generateChallanForm.monthValue);
                const regChallans = bulkChallanMap[reg.id] || [];
                const monthChallan = regChallans.find(c => c.month === selectedMonthLabel && c.status !== 'VOID');
                const challanStatusBadge = monthChallan ? (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none ${
                    monthChallan.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    monthChallan.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {monthChallan.status === 'PAID' ? `Paid · ${selectedMonthLabel}` :
                     monthChallan.status === 'PARTIAL' ? `Partial · ${selectedMonthLabel}` :
                     `Challan Issued · ${selectedMonthLabel}`}
                  </span>
                ) : null;

                // Check if selected month is before registration month
                const isBeforeRegistration = (() => {
                  if (!generateChallanForm.monthValue || !reg.registrationDate) return false;
                  const [y, m] = generateChallanForm.monthValue.split('-').map(Number);
                  const challanYM = new Date(y, m - 1, 1);
                  const regDate = new Date(reg.registrationDate);
                  const regYM = new Date(regDate.getFullYear(), regDate.getMonth(), 1);
                  return challanYM < regYM;
                })();
                const regMonthLabel = reg.registrationDate
                  ? new Date(reg.registrationDate).toLocaleString('default', { month: 'long', year: 'numeric' })
                  : '';

                return (
                  <label key={reg.id} className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 ${isBeforeRegistration ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-accent cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={checked && !isBeforeRegistration}
                      disabled={isBeforeRegistration}
                      onChange={e => !isBeforeRegistration && setBulkGenSelected(prev =>
                        e.target.checked ? [...prev, reg.id] : prev.filter(id => id !== reg.id)
                      )}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{name}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{sub} · {reg.student ? 'Internal' : 'External'} · PKR {Number(reg.decidedFeePerMonth||0).toLocaleString()}/mo</span>
                        {challanStatusBadge}
                        {isBeforeRegistration && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none bg-red-100 text-red-700">
                            Registered {regMonthLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
              {hostelRegistrations.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No registrations found</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex-shrink-0">{bulkGenSelected.length} of {hostelRegistrations.length} selected</div>
          </div>

          <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setGenerateChallanOpen(false)}>Cancel</Button>
            <Button
              disabled={createChallanMutation.isPending || bulkGenSelected.length === 0}
              onClick={async () => {
                if (!generateChallanForm.monthValue || !generateChallanForm.dueDate) {
                  toast({ title: "Month and due date are required", variant: "destructive" }); return;
                }
                const monthLabel = monthValueToLabel(generateChallanForm.monthValue);
                let success = 0, failed = 0;
                for (const regId of bulkGenSelected) {
                  try {
                    await createHostelChallan({
                      registrationId: regId,
                      month: monthLabel,
                      dueDate: generateChallanForm.dueDate,
                      fineAmount: generateChallanForm.fineAmount ? Number(generateChallanForm.fineAmount) : 0,
                      discount: generateChallanForm.discount ? Number(generateChallanForm.discount) : 0,
                      remarks: generateChallanForm.remarks || undefined,
                    });
                    success++;
                  } catch { failed++; }
                }
                queryClient.invalidateQueries({ queryKey: ['hostelChallans'] });
                if (selectedChallanReg) queryClient.invalidateQueries({ queryKey: ['hostelChallans', selectedChallanReg.id] });
                setGenerateChallanOpen(false);
                setBulkGenSearch("");
                toast({ title: `${success} challan(s) generated${failed > 0 ? `, ${failed} failed` : ''}`, variant: failed > 0 ? 'destructive' : 'default' });
              }}
            >
              Generate {bulkGenSelected.length > 0 ? `(${bulkGenSelected.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Hostel Challan Dialog */}
      <Dialog open={payHostelChallanOpen} onOpenChange={setPayHostelChallanOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {payingChallan && (() => {
            const effectiveLF = getEffectiveLateFee(payingChallan);
            const effectiveTotal = (payingChallan.hostelFee||0) + (payingChallan.fineAmount||0) + effectiveLF + (payingChallan.arrearsAmount||0) - (payingChallan.discount||0);
            const effectiveBalance = Math.max(0, effectiveTotal - (payingChallan.paidAmount||0));
            return (
              <div className="text-sm text-muted-foreground mb-2 space-y-0.5">
                <div>{payingChallan.challanNumber} · {payingChallan.month}</div>
                <div>Balance: <span className="font-medium text-foreground">PKR {effectiveBalance.toLocaleString()}</span></div>
                {effectiveLF > (payingChallan.lateFeeFine||0) && (
                  <div className="text-xs text-amber-600">Includes accrued late fee: PKR {effectiveLF.toLocaleString()}</div>
                )}
              </div>
            );
          })()}
          <div className="space-y-3">
            <div>
              <Label>Amount Received (PKR) <span className="text-destructive">*</span></Label>
              <Input type="number" min={0} value={payHostelAmount}
                onChange={e => setPayHostelAmount(e.target.value)} />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={payHostelDate} onChange={e => setPayHostelDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPayHostelChallanOpen(false)}>Cancel</Button>
            <Button disabled={updateChallanMutation.isPending} onClick={() => {
              if (!payHostelAmount) { toast({ title: "Amount is required", variant: "destructive" }); return; }
              const effectiveLF = getEffectiveLateFee(payingChallan);
              updateChallanMutation.mutate({ id: payingChallan.id, dto: {
                paidAmount: Number(payHostelAmount),
                paidDate: payHostelDate,
                // Lock in the accrued late fee at payment time
                ...(effectiveLF > (payingChallan.lateFeeFine || 0) ? { lateFeeFine: effectiveLF } : {}),
              }});
            }}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hostel Challan Preview Dialog */}
      <Dialog open={challanPreviewOpen} onOpenChange={setChallanPreviewOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
            <DialogTitle>Challan Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 pb-4">
            <div
              className="border rounded-md overflow-hidden"
              dangerouslySetInnerHTML={{ __html: challanPreviewHtml }}
            />
          </div>
          <div className="flex justify-end gap-2 px-6 pb-6 flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setChallanPreviewOpen(false)}>Close</Button>
            <Button onClick={() => {
              const w = window.open('', '_blank');
              if (!w) { toast({ title: "Pop-up blocked", variant: "destructive" }); return; }
              const printHtml = challanPreviewHtml.includes('window.print')
                ? challanPreviewHtml
                : challanPreviewHtml.replace('</body>', '<script>window.onload=()=>window.print()</script></body>');
              w.document.write(printHtml);
              w.document.close();
            }}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Hostel Challan Dialog */}
      <Dialog open={!!editingHostelChallan} onOpenChange={open => { if (!open) setEditingHostelChallan(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Hostel Challan</DialogTitle>
          </DialogHeader>
          {editingHostelChallan && (
            <div className="text-sm text-muted-foreground mb-2">
              {editingHostelChallan.challanNumber} · {editingHostelChallan.month}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={editHostelChallanForm.dueDate}
                onChange={e => setEditHostelChallanForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <Label>Fine / Additional Amount (PKR)</Label>
              <Input type="number" min={0} placeholder="0" value={editHostelChallanForm.fineAmount}
                onChange={e => setEditHostelChallanForm(f => ({ ...f, fineAmount: e.target.value }))} />
            </div>
            <div>
              <Label>Discount (PKR)</Label>
              <Input type="number" min={0} placeholder="0" value={editHostelChallanForm.discount}
                onChange={e => setEditHostelChallanForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
            <div>
              <Label>Remarks</Label>
              <Input placeholder="Optional remarks" value={editHostelChallanForm.remarks}
                onChange={e => setEditHostelChallanForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
            {editingHostelChallan && editHostelChallanForm.dueDate && (() => {
              const newLateFee = calculateHostelLateFee(editHostelChallanForm.dueDate);
              return newLateFee > 0 ? (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  Late fee will be PKR {newLateFee.toLocaleString()} based on new due date ({hostelLateFee}/day × overdue days)
                </div>
              ) : null;
            })()}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingHostelChallan(null)}>Cancel</Button>
            <Button
              disabled={updateChallanMutation.isPending}
              onClick={() => {
                const newLateFee = calculateHostelLateFee(editHostelChallanForm.dueDate);
                updateChallanMutation.mutate({
                  id: editingHostelChallan.id,
                  dto: {
                    dueDate: editHostelChallanForm.dueDate || undefined,
                    fineAmount: editHostelChallanForm.fineAmount !== "" ? Number(editHostelChallanForm.fineAmount) : undefined,
                    discount: editHostelChallanForm.discount !== "" ? Number(editHostelChallanForm.discount) : undefined,
                    remarks: editHostelChallanForm.remarks || undefined,
                    ...(newLateFee > 0 ? { lateFeeFine: newLateFee } : {}),
                  },
                });
                setEditingHostelChallan(null);
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Hostel Challan Confirmation */}
      <AlertDialog open={challanDeleteConfirmOpen} onOpenChange={setChallanDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Challan?</AlertDialogTitle>
            <AlertDialogDescription>
              {challanToDelete && (
                <>Challan <strong>{challanToDelete.challanNumber}</strong> ({challanToDelete.month}) will be permanently deleted. This cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setChallanDeleteConfirmOpen(false); setChallanToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (challanToDelete) deleteChallanMutation.mutate(challanToDelete.id);
                setChallanDeleteConfirmOpen(false);
                setChallanToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Profile Dialog — works for both internal and external */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {profileReg?.studentId ? "Internal Student" : "External Student Profile"}
            </DialogTitle>
          </DialogHeader>
          {profileReg && (
            <div className="space-y-4">
              {profileReg.studentId ? (
                // Internal student — brief summary + navigate to full profile
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-muted-foreground font-medium">Full Name</span>
                    <span>{profileReg.student ? `${profileReg.student.fName} ${profileReg.student.lName || ''}`.trim() : "—"}</span>

                    <span className="text-muted-foreground font-medium">Roll Number</span>
                    <span>{profileReg.student?.rollNumber || "—"}</span>

                    <span className="text-muted-foreground font-medium">Program</span>
                    <span>{profileReg.student?.program?.name || "—"}</span>

                    <span className="text-muted-foreground font-medium">Decided Fee / Month</span>
                    <span>PKR {profileReg.decidedFeePerMonth != null ? Number(profileReg.decidedFeePerMonth).toLocaleString() : "—"}</span>
                  </div>
                  <div className="pt-2 border-t">
                    {/* Challan summary for internal student */}
                    {profileChallans.filter(c => c.status !== 'VOID').length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Recent Fee Challans</p>
                        {profileChallans.filter(c => c.status !== 'VOID').slice(0, 4).map(c => {
                          const total = (c.hostelFee||0) + (c.fineAmount||0) + (c.lateFeeFine||0) + (c.arrearsAmount||0) - (c.discount||0);
                          return (
                            <div key={c.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                              <span className="font-medium">{c.month}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">PKR {total.toLocaleString()}</span>
                                <span className={`font-semibold px-1.5 py-0.5 rounded leading-none ${
                                  c.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                  c.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{c.status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-2">Full student details are available in the Students module.</p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/students", { state: { openStudentId: profileReg.studentId } });
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full Profile in Students
                    </Button>
                  </div>
                </div>
              ) : (
                // External student — all personal info stored in HostelRegistration
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground font-medium">Full Name</span>
                  <span>{profileReg.externalName || "—"}</span>

                  <span className="text-muted-foreground font-medium">Institute</span>
                  <span>{profileReg.externalInstitute || "—"}</span>

                  <span className="text-muted-foreground font-medium">Guardian Name</span>
                  <span>{profileReg.externalGuardianName || "—"}</span>

                  <span className="text-muted-foreground font-medium">Guardian Phone</span>
                  <span>{profileReg.externalGuardianNumber || "—"}</span>

                  <span className="text-muted-foreground font-medium">Guardian CNIC</span>
                  <span>{profileReg.guardianCnic || "—"}</span>

                  <span className="text-muted-foreground font-medium">Student CNIC</span>
                  <span>{profileReg.studentCnic || "—"}</span>

                  <span className="text-muted-foreground font-medium">Address</span>
                  <span className="col-span-1">{profileReg.address || "—"}</span>

                  <span className="text-muted-foreground font-medium">Registration Date</span>
                  <span>{profileReg.registrationDate ? new Date(profileReg.registrationDate).toLocaleDateString() : "—"}</span>

                  <span className="text-muted-foreground font-medium">Status</span>
                  <span><Badge variant={profileReg.status === "active" ? "default" : "secondary"}>{profileReg.status}</Badge></span>

                  <span className="text-muted-foreground font-medium">Decided Fee / Month</span>
                  <span>PKR {profileReg.decidedFeePerMonth != null ? Number(profileReg.decidedFeePerMonth).toLocaleString() : "—"}</span>

                  <span className="text-muted-foreground font-medium">Registration ID</span>
                  <span className="font-mono text-xs">{profileReg.id}</span>
                  </div>
                  {/* Challan history for external student */}
                  {profileChallans.length > 0 && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-sm font-semibold">Fee Challans</p>
                      <div className="space-y-1">
                        {profileChallans.filter(c => c.status !== 'VOID').slice(0, 6).map(c => {
                          const total = (c.hostelFee||0) + (c.fineAmount||0) + (c.lateFeeFine||0) + (c.arrearsAmount||0) - (c.discount||0);
                          return (
                            <div key={c.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                              <span className="font-medium">{c.month}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">PKR {total.toLocaleString()}</span>
                                <span className={`font-semibold px-1.5 py-0.5 rounded leading-none ${
                                  c.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                  c.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>{c.status}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Hostel;
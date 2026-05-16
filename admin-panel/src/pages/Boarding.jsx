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
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHostelRegistrations,
  createHostelRegistration,
  updateHostelRegistration,
  deleteHostelRegistration,
  terminateHostelRegistration,
  withdrawHostelRegistration,
  readmitHostelRegistration,
  getHostelRegistrationHistory,
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
  getFeeHeads,
  searchHostelRegistrationsDedicated,
  createHostelChallanDedicated,
  getHostelChallansDedicated,
  updateHostelChallanDedicated,
  deleteHostelChallanDedicated,
  getInstituteSettings,
  getDefaultFeeChallanTemplate,
  recordHostelPayment,
  getHostelRevenue,
  getHostelReportsAnalytics,
} from "../../config/apis";
import { computeOutstandingBalance } from "@/lib/hostelUtils";
import { Home, Bed, UtensilsCrossed, DollarSign, Edit, Trash2, UserPlus, Package, Search, X, Receipt, Plus, Eye, ExternalLink, Printer, AlertCircle, ArrowRight, UserX, LogOut, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ModernChartCard, ModernTooltip, MODERN_CHART_COLORS } from "@/components/ui/modern-charts";
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

// ── Registration History Tab component ──────────────────────────────────────
// Helper: extract last termination reason from terminationReason field (now a JSON array)
function getLastTerminationReason(terminationReason) {
  if (!terminationReason) return null;
  try {
    const arr = JSON.parse(terminationReason);
    if (Array.isArray(arr)) {
      const last = [...arr].reverse().find(e => e.action === 'terminated' && e.reason);
      return last?.reason || null;
    }
  } catch {}
  // Legacy plain string
  return terminationReason;
}
function RegistrationHistoryTab({ regId }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['hostelRegHistory', regId],
    queryFn: () => getHostelRegistrationHistory(regId),
    enabled: !!regId,
  });

  const actionMeta = {
    registered:  { label: 'Registered',  color: 'bg-green-100 text-green-700' },
    terminated:  { label: 'Terminated',  color: 'bg-red-100 text-red-700' },
    withdrawn:   { label: 'Withdrawn',   color: 'bg-gray-100 text-gray-700' },
    readmitted:  { label: 'Readmitted',  color: 'bg-blue-100 text-blue-700' },
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  if (!history.length) return <p className="text-sm text-muted-foreground text-center py-6">No history yet.</p>;

  return (
    <div className="relative pl-4 space-y-0 max-h-72 overflow-y-auto">
      {/* vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
      {[...history].reverse().map((entry, i) => {
        const meta = actionMeta[entry.action] || { label: entry.action, color: 'bg-muted text-muted-foreground' };
        return (
          <div key={i} className="relative flex gap-3 pb-4">
            <div className="mt-1 w-3 h-3 rounded-full border-2 border-background bg-primary shrink-0 z-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                {entry.previousStatus && (
                  <span className="text-[10px] text-muted-foreground">from {entry.previousStatus}</span>
                )}
              </div>
              {entry.reason && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">"{entry.reason}"</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const Boarding = () => {
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

  // Registration filters
  const [regSearch, setRegSearch] = useState("");
  const [regStatusFilter, setRegStatusFilter] = useState("all");
  const [regTypeFilter, setRegTypeFilter] = useState("all");
  const scrollSentinelRef = useRef(null);

  const {
    data: regPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: regLoading,
    refetch: refetchRegistrations,
  } = useInfiniteQuery({
    queryKey: ['hostelRegistrations', regSearch, regStatusFilter, regTypeFilter],
    queryFn: ({ pageParam = 1 }) => getHostelRegistrations({
      search: regSearch || undefined,
      status: regStatusFilter !== 'all' ? regStatusFilter : undefined,
      type: regTypeFilter !== 'all' ? regTypeFilter : undefined,
      page: pageParam,
      limit: 20,
    }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const hostelRegistrations = regPages?.pages.flatMap(p => p.data) ?? [];

  // Infinite scroll observer
  useEffect(() => {
    const el = scrollSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
  const [editMode, setEditMode] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Terminate / Withdraw state
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateReg, setTerminateReg] = useState(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReg, setWithdrawReg] = useState(null);
  const [readmitOpen, setReadmitOpen] = useState(false);
  const [readmitReg, setReadmitReg] = useState(null);

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

  // Hostel challan state
  const [challanRegSearch, setChallanRegSearch] = useState("");
  const [challanRegResults, setChallanRegResults] = useState([]);
  const [selectedChallanReg, setSelectedChallanReg] = useState(null); // full registration object
  const [generateChallanOpen, setGenerateChallanOpen] = useState(false);
  const [generateChallanForm, setGenerateChallanForm] = useState({
    monthValue: new Date().toISOString().slice(0, 7), // "YYYY-MM" for the picker
    dueDate: new Date().toISOString().split('T')[0],
    remarks: "",
    selectedFeeHeadIds: [],
    customHeads: [{ headName: "", amount: "" }]
  });
  const [bulkGenSearch, setBulkGenSearch] = useState("");
  const [bulkGenSelected, setBulkGenSelected] = useState([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false); // array of registration IDs
  const [bulkGenResults, setBulkGenResults] = useState([]);
  const [bulkChallanMap, setBulkChallanMap] = useState({}); // registrationId -> challan[]
  const [payHostelChallanOpen, setPayHostelChallanOpen] = useState(false);
  const [payingChallan, setPayingChallan] = useState(null);
  const [payHostelAmount, setPayHostelAmount] = useState("");
  const [payHostelDate, setPayHostelDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanPreviewOpen, setChallanPreviewOpen] = useState(false);
  const [challanPreviewHtml, setChallanPreviewHtml] = useState("");
  const [editingHostelChallan, setEditingHostelChallan] = useState(null);
  const [editHostelChallanForm, setEditHostelChallanForm] = useState({ fineAmount: "", discount: "", remarks: "", dueDate: "", heads: [] });
  const [challanDeleteConfirmOpen, setChallanDeleteConfirmOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);

  // Revenue tab state
  const [revenueSearch, setRevenueSearch] = useState("");
  const [revenueSort, setRevenueSort] = useState({ col: 'name', dir: 'asc' });
  const [revenueFromDate, setRevenueFromDate] = useState("");
  const [revenueToDate, setRevenueToDate] = useState("");

  // All-challans pagination state (fees tab default view)
  const [allChallansPage, setAllChallansPage] = useState(1);
  const [allChallansSearch, setAllChallansSearch] = useState("");
  const [allChallansStatus, setAllChallansStatus] = useState("all");
  const allChallansLimit = 15;

  // All challans query — paginated, no registration filter
  const { data: allChallansResponse, isLoading: allChallansLoading } = useQuery({
    queryKey: ['hostelChallansAll', allChallansPage, allChallansSearch, allChallansStatus],
    queryFn: () => getHostelChallansDedicated({
      page: allChallansPage,
      limit: allChallansLimit,
      search: allChallansSearch || undefined,
      status: allChallansStatus !== 'all' ? allChallansStatus : undefined,
    }),
    keepPreviousData: true,
    staleTime: 30000,
  });
  const allChallans = allChallansResponse?.data || [];
  const allChallansMeta = allChallansResponse?.meta || { total: 0, lastPage: 1 };

  // Hostel challan queries
  const { data: hostelChallansResponse, refetch: refetchHostelChallans } = useQuery({
    queryKey: ['hostelChallans', selectedChallanReg?.id],
    queryFn: () => getHostelChallansDedicated({ registrationId: selectedChallanReg.id }),
    enabled: !!selectedChallanReg?.id,
  });
  const hostelChallans = hostelChallansResponse?.data || [];

  // Challans for the profile dialog (both internal and external)
  const { data: profileChallansResponse } = useQuery({
    queryKey: ['hostelChallans', profileReg?.id],
    queryFn: () => getHostelChallansDedicated({ registrationId: profileReg.id }),
    enabled: !!profileReg?.id,
  });
  const profileChallans = profileChallansResponse?.data || [];

  const { data: instituteSettings } = useQuery({
    queryKey: ['instituteSettings'],
    queryFn: getInstituteSettings,
    staleTime: 5 * 60 * 1000,
  });
  const hostelLateFee = instituteSettings?.hostelLateFee ?? 0;

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['hostelRevenue', revenueFromDate, revenueToDate],
    queryFn: () => {
      if (!revenueFromDate && !revenueToDate) return getHostelRevenue();
      return getHostelRevenue({
        ...(revenueFromDate ? { startDate: revenueFromDate } : {}),
        ...(revenueToDate ? { endDate: revenueToDate } : {}),
      });
    },
    enabled: activeTab === 'revenue',
    staleTime: 60000,
  });

  const { data: revenueAnalytics } = useQuery({
    queryKey: ['hostelRevenueAnalytics', revenueFromDate, revenueToDate],
    queryFn: () =>
      getHostelReportsAnalytics({
        ...(revenueFromDate ? { startDate: revenueFromDate } : {}),
        ...(revenueToDate ? { endDate: revenueToDate } : {}),
        groupBy: 'month',
      }),
    enabled: activeTab === 'revenue',
    retry: 0,
  });

  const { data: reportExpenses = [] } = useQuery({
    queryKey: ['hostelReportExpenses', revenueFromDate, revenueToDate],
    queryFn: () => {
      if (!revenueFromDate && !revenueToDate) return getHostelExpenses();
      return getHostelExpenses({
        ...(revenueFromDate ? { startDate: revenueFromDate } : {}),
        ...(revenueToDate ? { endDate: revenueToDate } : {}),
      });
    },
    enabled: activeTab === 'revenue',
    staleTime: 60000,
  });

  // Helper: invalidate all hostel challan queries at once
  const invalidateAllChallanQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['hostelChallans'] });
    queryClient.invalidateQueries({ queryKey: ['hostelChallansAll'] });
    queryClient.invalidateQueries({ queryKey: ['hostelRevenue'] });
  };

  // Hostel challan mutations
  const createChallanMutation = useMutation({
    mutationFn: createHostelChallanDedicated,
    onSuccess: () => {
      invalidateAllChallanQueries();
      toast({ title: "Challan generated" });
    },
    onError: (e) => toast({ title: e.message || "Failed to generate challan", variant: "destructive" }),
  });

  const updateChallanMutation = useMutation({
    mutationFn: ({ id, dto }) => updateHostelChallanDedicated(id, dto),
    onSuccess: () => {
      invalidateAllChallanQueries();
      setPayHostelChallanOpen(false);
      setPayingChallan(null);
      setEditingHostelChallan(null);
      toast({ title: "Challan updated" });
    },
    onError: (e) => toast({ title: e.message || "Failed to update challan", variant: "destructive" }),
  });

  const deleteChallanMutation = useMutation({
    mutationFn: deleteHostelChallanDedicated,
    onSuccess: () => {
      invalidateAllChallanQueries();
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
  const toHostelAmount = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const getHostelHeadsTotal = (c) => Array.isArray(c?.heads)
    ? c.heads.reduce((sum, h) => sum + toHostelAmount(h.amount), 0)
    : 0;

  const getHostelBaseFee = (c) => {
    const headsTotal = getHostelHeadsTotal(c);
    return headsTotal > 0 ? headsTotal : toHostelAmount(c?.hostelFee || c?.totalAmount);
  };

  const getChallanTotal = (c) =>
    getHostelBaseFee(c) + toHostelAmount(c.fineAmount) + toHostelAmount(c.lateFeeFine) + toHostelAmount(c.arrearsAmount) - toHostelAmount(c.discount);

  const getChallanBalance = (c) => Math.max(0, getChallanTotal(c) - toHostelAmount(c.paidAmount));

  // Effective total including client-computed late fee for overdue challans not yet updated
  const getChallanTotalEffective = (c) => {
    const lateFee = getEffectiveLateFee ? getEffectiveLateFee(c) : toHostelAmount(c.lateFeeFine);
    return getHostelBaseFee(c) + toHostelAmount(c.fineAmount) + lateFee + toHostelAmount(c.arrearsAmount) - toHostelAmount(c.discount);
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

  const formatHostelChallanDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getLatestHostelPayment = (challan) => {
    if (!Array.isArray(challan?.payments) || challan.payments.length === 0) return null;
    return [...challan.payments].sort((a, b) => new Date(b.paymentDate || b.date || 0) - new Date(a.paymentDate || a.date || 0))[0];
  };

  const getHostelPaidAtText = (challan) => {
    const latestPayment = getLatestHostelPayment(challan);
    const rawPaidAt = challan?.paidAt || challan?.paidDate || latestPayment?.paymentDate || latestPayment?.date;
    if (!rawPaidAt) return "";
    const paidAt = new Date(rawPaidAt);
    return Number.isNaN(paidAt.getTime()) ? "" : formatHostelChallanDate(paidAt);
  };

  const getHostelPaidRemarks = (challan) => {
    const latestPayment = getLatestHostelPayment(challan);
    return latestPayment?.remarks || challan?.paymentRemarks || challan?.remarks || 'FULLY PAID / SETTLED';
  };

  const getHostelPaidRowsHtml = (challan) => {
    const paidRemarksStyle = 'background-color: #dcfce7; color: #14532d; font-weight: bold;';
    const paidAtText = getHostelPaidAtText(challan);
    return `
      ${paidAtText ? `<tr class="paid-at-row"><td style="${paidRemarksStyle}">Paid At</td><td style="${paidRemarksStyle}">${paidAtText}</td></tr>` : ''}
      <tr class="paid-remarks-row">
        <td style="${paidRemarksStyle}; vertical-align: top;">Remarks</td>
        <td style="${paidRemarksStyle}; white-space: normal; text-align: left; line-height: 1.35;">${getHostelPaidRemarks(challan)}</td>
      </tr>
    `;
  };

  const getHostelPaidSystemNote = () => `
    <div class="paid-system-note" style="padding: 8px 10px 5px 10px; margin-top: 4px; font-size: 8px; line-height: 1.35; color: #475569; font-style: italic;">
      * This paid challan is system generated and does not require bank/account officer or depositor signatures.
    </div>
  `;
  const generateHostelChallanHtml = async (challan, reg) => {
    const template = await getDefaultFeeChallanTemplate();
    const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
    const registrationNo = challan.hostelRegNumber || reg.id;
    const rollNo = reg.student?.rollNumber || registrationNo;
    const guardian = reg.student?.fatherOrguardian || challan.student?.fatherOrguardian || reg.externalGuardianName || "-";
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
      const pcTotal = getChallanTotal(pc);
      const pcBalance = Math.max(0, pcTotal - (pc.paidAmount||0));
      return `<tr><td>Arrears - ${pc.month}</td><td>${pcBalance.toLocaleString()}</td></tr>`;
    }).join('');

    // Only include arrears when the rendered challan actually has an arrears chain.
    const arrearsAmount = prevChainChallans.length > 0 ? toHostelAmount(challan.arrearsAmount) : 0;

    const headsTotal = getHostelHeadsTotal(challan);
    const baseHostelFee = getHostelBaseFee(challan);

    // Fee heads rows - prefer stored heads for newer hostel challans.
    const feeHeadsRowsHtml = [
      ...(Array.isArray(challan.heads) && challan.heads.length > 0
        ? challan.heads.map(h => `<tr><td>${h.headName || 'Hostel Fee'}</td><td>${toHostelAmount(h.amount).toLocaleString()}</td></tr>`)
        : [baseHostelFee > 0 ? `<tr><td>Boarding Fee</td><td>${baseHostelFee.toLocaleString()}</td></tr>` : '']),
      challan.fineAmount > 0 ? `<tr><td>Fine / Additional</td><td>${challan.fineAmount.toLocaleString()}</td></tr>` : '',
      challan.discount > 0 ? `<tr><td>Discount</td><td>- ${challan.discount.toLocaleString()}</td></tr>` : '',
      effectiveLateFee > 0 ? `<tr><td>Late Fee (Overdue)</td><td>${effectiveLateFee.toLocaleString()}</td></tr>` : '',
    ].join('');

    const total = baseHostelFee + (challan.fineAmount||0) + effectiveLateFee + arrearsAmount - (challan.discount||0);
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
      const paidRowHtml = ['PAID', 'SETTLED', 'PARTIAL', 'PENDING', 'OVERDUE'].includes(challan.status) || (challan.paidAmount || 0) > 0 ? `
        <tr style="color:#166534;background:#f0fdf4;font-weight:600">
          <td>Paid Amount / Advance Credits</td><td>${(challan.paidAmount || 0) > 0 ? `- PKR ${(challan.paidAmount||0).toLocaleString()}` : 'PKR 0'}</td>
        </tr>
        <tr style="font-weight:700">
          <td>Remaining Balance</td><td>PKR ${balance.toLocaleString()}</td>
        </tr>` : '';
      const isFullyPaidFallback = challan.status === 'PAID' || challan.status === 'SETTLED' || balance <= 0;
      return `<!DOCTYPE html><html><head><title>Boarding Fee Challan</title>
      <style>body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:20px}.challan{border:2px solid #333;padding:16px;max-width:420px;margin:auto}.header{text-align:center;border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:10px}.header h2{margin:0;font-size:14px}.header p{margin:2px 0;font-size:10px}table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:4px 6px}.info td:first-child{font-weight:bold;width:40%}.amounts td{border:1px solid #ccc}.amounts td:last-child{text-align:right;font-weight:bold}.total-row td{background:#f0f0f0;font-weight:bold;border:1px solid #333}.words{font-style:italic;font-size:10px;margin:6px 0;border-top:1px dashed #ccc;padding-top:6px}.status{text-align:center;margin-top:8px;font-size:12px;font-weight:bold;padding:4px;border:1px solid #333}.void{background:#fee2e2;color:#991b1b}.paid{background:#d1fae5;color:#065f46}.pending{background:#fef3c7;color:#92400e}@media print{body{padding:0}}</style>
      </head><body><div class="challan"><div class="header"><h2>BOARDING FEE CHALLAN</h2><p>Concordia College Peshawar</p></div>
      <table class="info"><tr><td>Challan No</td><td>${challan.challanNumber}</td></tr><tr><td>Student</td><td>${name}</td></tr><tr><td>Student Id / Registration Number</td><td>${rollNo}</td></tr><tr><td>Father Name</td><td>${guardian}</td></tr><tr><td>Month</td><td>${challan.month}</td></tr><tr><td>Issue Date</td><td>${formatDate(challan.createdAt)}</td></tr><tr><td>Due Date</td><td>${formatDate(challan.dueDate)}</td></tr></table>
      <table class="amounts">${feeHeadsRowsHtml}${arrearsRowsHtml}${paidRowHtml}${!isFullyPaidFallback ? `<tr class="total-row"><td>Total Payable</td><td>PKR ${balance.toLocaleString()}</td></tr><tr><td>Late Fee Fine after due date</td><td>Rs. ${hostelLateFee || 150}/- per day</td></tr>` : getHostelPaidRowsHtml(challan)}</table>
      <div class="words">In Words: ${numberToWords(isFullyPaidFallback ? Math.round(total) : Math.round(balance))}</div>
      ${isFullyPaidFallback ? getHostelPaidSystemNote() : (challan.remarks ? `<div style="font-size:10px;margin-top:4px"><b>Remarks:</b> ${challan.remarks}</div>` : '')}
      <div class="status ${challan.status==='PAID'?'paid':challan.status==='VOID'?'void':'pending'}">${challan.status==='VOID'?'SUPERSEDED':challan.status}</div>
      </div></body></html>`;
    }

    const replacements = {
      '{{INSTITUTE_NAME}}': 'Concordia College Peshawar',
      '{{INSTITUTE_ADDRESS}}': '60-C, Near NCS School, University Town Peshawar',
      '{{INSTITUTE_PHONE}}': '091-5619915 | 0332-8581222',
      '{{CHALLAN_TITLE}}': 'Boarding Fee Challan',
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
      '{{className}}': reg.student?.program?.name || 'Boarding',
      '{{CLASS}}': reg.student?.program?.name || 'Boarding',
      '{{class}}': reg.student?.program?.name || 'Boarding',
      '{{programName}}': 'Boarding',
      '{{PROGRAM}}': 'Boarding',
      '{{program}}': 'Boarding',
      '{{section}}': '',
      '{{SECTION}}': '',
      '{{FULL_CLASS}}': reg.student?.program?.name || 'Boarding',
      '{{issueDate}}': formatDate(challan.createdAt),
      '{{ISSUE_DATE}}': formatDate(new Date()),
      '{{dueDate}}': formatDate(challan.dueDate),
      '{{DUE_DATE}}': formatDate(challan.dueDate),
      '{{VALID_DATE}}': formatDate(challan.dueDate),
      '{{month}}': challan.month || '',
      '{{session}}': '',
      '{{installmentNo}}': `Boarding Fee - ${challan.month}`,
      '{{installmentNumber}}': 'Boarding Fee',
      '{{Tuition Fee}}': '',  // hostel fee is now included in {{feeHeadsRows}} as first row
      '{{TUITION_ORIGINAL}}': (challan.hostelFee||0).toLocaleString(),
      '{{feeHeadsRows}}': feeHeadsRowsHtml,
      '{{FEE_HEADS_TABLE}}': feeHeadsRowsHtml,
      '{{arrears}}': arrearsAmount > 0 ? arrearsAmount.toLocaleString() : '',
      '{{arrearsRows}}': arrearsRowsHtml,
      '{{discount}}': '',  // discount is now included in {{feeHeadsRows}}
      '{{SCHOLARSHIP}}': (challan.discount||0).toLocaleString(),
      '{{amount}}': total.toLocaleString(),
      '{{TOTAL_AMOUNT}}': total.toLocaleString(),
      // Note: {{totalPayable}} and {{netPayable}} are handled after replacements loop
      //       based on paid/partial state — do not set them here to avoid double replacement
      '{{rupeesInWords}}': numberToWords(balance > 0 ? balance : total),
      '{{AMOUNT_IN_WORDS}}': numberToWords(balance > 0 ? balance : total),
      '{{paidRow}}': ['PAID', 'SETTLED', 'PARTIAL', 'PENDING', 'OVERDUE'].includes(challan.status) || (challan.paidAmount || 0) > 0 ? `
        <tr style="color: #166534; background-color: #f0fdf4; font-weight: 600; font-size: 11px;">
          <td>Paid Amount / Advance Credits</td>
          <td>${(challan.paidAmount || 0) > 0 ? `- ${(challan.paidAmount||0).toLocaleString()}` : '0'}</td>
        </tr>
        <tr style="font-weight: 700; border-top: 1px solid #e2e8f0;">
          <td>Remaining Balance</td>
          <td>${balance.toLocaleString()}</td>
        </tr>
      ` : '',
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
    html = html.replace(/\{\{program\}\}\s*\/\s*\{\{class\}\}\s*\/\s*\{\{section\}\}/g, reg.student?.program?.name || 'Boarding');
    html = html.replace(/\{\{class\}\}\s*\/\s*\{\{section\}\}/g, reg.student?.program?.name || 'Boarding');

    html = html.replace(/Student Id/g, 'Student Id / Registration Number');

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
    // Replace {{lateFeeRatePerDay}} placeholder (used in the installment template)
    html = html.replace(/\{\{lateFeeRatePerDay\}\}/g, hostelLateFee > 0 ? String(hostelLateFee) : '150');

    // ── Paid / Partial state handling ─────────────────────────────────────────
    const isFullyPaid = challan.status === 'PAID' || challan.status === 'SETTLED' || balance <= 0;
    const cellStyle = 'background-color: #e0e0e0; font-weight: bold;';

    if (isFullyPaid) {
      const paidRowsHtml = getHostelPaidRowsHtml(challan);

      // Remove "Total Payable within due date" row
      html = html.replace(/<tr[^>]*>\s*<td[^>]*>\s*Total Payable within due date\s*<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/gi, '');
      html = html.replace(/<tr[^>]*>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>\s*\{\{totalPayable\}\}\s*<\/td>\s*<\/tr>/gi, '');
      html = html.replace(/\{\{totalPayable\}\}/g, '');
      html = html.replace(/\{\{netPayable\}\}/g, '');
      html = html.replace(/\{\{NET_PAYABLE\}\}/g, '');
      html = html.replace(/\{\{amountInWords\}\}/g, numberToWords(Math.round(total)));
      html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${numberToWords(Math.round(total))}</strong>`);

      // Replace late fee row with paid date and remarks.
      html = html.replace(/<tr class="late-fee-row">[\s\S]*?<\/tr>/gi, paidRowsHtml);
      html = html.replace(/<tr[^>]*>\s*<td[^>]*>\s*Late Fee Fine after due date\s*<\/td>\s*<td[^>]*>\s*Rs\.?\s*\d+[\s\S]*?Per\s+Day\s*<\/td>\s*<\/tr>/gi, paidRowsHtml);
      html = html.replace(/\{\{lateFee\}\}/g, getHostelPaidRemarks(challan));
      html = html.replace(
        /<div class="signatures">[\s\S]*?<div class="sig-label">Depositor Signature<\/div>\s*<\/div>\s*<\/div>/gi,
        getHostelPaidSystemNote()
      );
    } else {
      html = html.replace(/<td>Total Payable within due date<\/td>/gi, `<td style="${cellStyle}">Total Payable within due date</td>`);
      html = html.replace(/<td>\{\{totalPayable\}\}<\/td>/gi, `<td style="${cellStyle}">${balance.toLocaleString()}</td>`);
      html = html.replace(/\{\{totalPayable\}\}/g, balance.toLocaleString());
      html = html.replace(/\{\{netPayable\}\}/g, balance.toLocaleString());
      html = html.replace(/\{\{NET_PAYABLE\}\}/g, balance.toLocaleString());
      html = html.replace(/\{\{amountInWords\}\}/g, numberToWords(Math.round(balance)));
      html = html.replace(/\{\{totalInWords\}\}/g, `<strong>${numberToWords(Math.round(balance))}</strong>`);
      html = html.replace(/\{\{lateFee\}\}/g, effectiveLateFee.toLocaleString());
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

  const handleStudentSelect = (student) => {
    // When editing, allow re-selecting the same student (their own registration)
    const isRegistered = hostelRegistrations.some(reg =>
      reg.studentId === student.id && reg.id !== editMode.reg
    );
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
    reportExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!data[monthYear]) data[monthYear] = 0;
      data[monthYear] += expense.amount;
    });
    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  }, [reportExpenses]);

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
              Boarding Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage rooms, students, mess, and boarding finances
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
              <div className="text-2xl font-bold">{regPages?.pages[0]?.total ?? hostelRegistrations.filter(r => r.status === "active").length}</div>
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="revenue">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Boarding Registration</CardTitle>
                  <Button onClick={() => {
                    setRegOpen(true);
                    clearStudentSelection();
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Registration
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, roll number, ID..."
                      value={regSearch}
                      onChange={e => setRegSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={regStatusFilter} onValueChange={setRegStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={regTypeFilter} onValueChange={setRegTypeFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
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
                      {regLoading ? (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                      ) : hostelRegistrations.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No registrations found.</TableCell></TableRow>
                      ) : hostelRegistrations.map(reg => {
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
                            <div className="flex flex-col gap-0.5">
                              <Badge variant={reg.status === "active" ? "default" : reg.status === "terminated" ? "destructive" : "secondary"}>
                                {reg.status}
                              </Badge>
                              {reg.status === "terminated" && reg.terminationReason && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={getLastTerminationReason(reg.terminationReason)}>
                                  {getLastTerminationReason(reg.terminationReason)}
                                </span>
                              )}
                            </div>
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
                                  registrationDate: reg.registrationDate ? reg.registrationDate.split("T")[0] : new Date().toISOString().split("T")[0],
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
                                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                    disabled={reg.status === 'terminated' || reg.status === 'withdrawn'}
                                    onClick={() => { setTerminateReg(reg); setTerminateReason(""); setTerminateOpen(true); }}>
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Terminate (expelled)</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                    disabled={reg.status === 'terminated' || reg.status === 'withdrawn'}
                                    onClick={() => { setWithdrawReg(reg); setWithdrawOpen(true); }}>
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Withdraw (checked out)</TooltipContent>
                              </Tooltip>
                              {(reg.status === 'terminated' || reg.status === 'withdrawn') && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50"
                                      onClick={() => { setReadmitReg(reg); setReadmitOpen(true); }}>
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Readmit</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>;
                      })}
                    </TableBody>
                  </Table>
                  {/* Infinite scroll sentinel */}
                  <div ref={scrollSentinelRef} className="py-2 flex justify-center">
                    {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {!hasNextPage && hostelRegistrations.length > 0 && (
                      <span className="text-xs text-muted-foreground">All registrations loaded ({hostelRegistrations.length})</span>
                    )}
                  </div>                </div>
              </CardContent>
            </Card>
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
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {/* Global search */}
                <div className="relative min-w-[220px] flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search challan #, student name, roll..."
                    value={allChallansSearch}
                    onChange={e => { setAllChallansSearch(e.target.value); setAllChallansPage(1); setSelectedChallanReg(null); setChallanRegSearch(""); }}
                    className="pl-9 h-9"
                  />
                </div>
                {/* Status filter */}
                <Select value={allChallansStatus} onValueChange={v => { setAllChallansStatus(v); setAllChallansPage(1); }}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                    <SelectItem value="SETTLED">Settled</SelectItem>
                  </SelectContent>
                </Select>
                {/* Student drill-down search */}
                <div className="relative min-w-[200px]">
                  
                  {challanRegSearch && (
                    <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setChallanRegSearch(""); setSelectedChallanReg(null); setChallanRegResults([]); }}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {/* Student search dropdown */}
                  {challanRegResults.length > 0 && !selectedChallanReg && (
                    <div className="absolute z-50 top-full mt-1 left-0 w-72 border rounded-md shadow-md bg-popover max-h-60 overflow-auto">
                      {challanRegResults.map(reg => {
                        const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
                        const sub = reg.student ? reg.student.rollNumber : `External · ${reg.id}`;
                        return (
                          <div key={reg.id} className="px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                            onClick={() => { setSelectedChallanReg(reg); setChallanRegSearch(name); setChallanRegResults([]); }}>
                            <div className="font-medium text-sm">{name}</div>
                            <div className="text-xs text-muted-foreground">{sub}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedChallanReg && (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => { setChallanRegSearch(""); setSelectedChallanReg(null); }}>
                    <X className="mr-1 h-3 w-3" /> Clear filter
                  </Button>
                )}
              </div>
              <Button onClick={async () => {
                setBulkGenSearch("");
                setBulkGenSelected(hostelRegistrations.map(r => r.id));
                setBulkGenResults(hostelRegistrations);
                setGenerateChallanOpen(true);
                const map = {};
                await Promise.all(hostelRegistrations.map(async reg => {
                  try {
                    const response = await getHostelChallansDedicated({ registrationId: reg.id });
                    map[reg.id] = response.data;
                  } catch {}
                }));
                setBulkChallanMap(map);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Generate Challans
              </Button>
            </div>

            {/* Per-student summary strip when filtered */}
            {selectedChallanReg && (() => {
              const reg = selectedChallanReg;
              const name = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}`.trim() : reg.externalName;
              return (
                <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  <span className="font-semibold">{name}</span>
                  <span className="text-muted-foreground">{reg.student ? `Roll: ${reg.student.rollNumber}` : `Reg: ${reg.id}`}</span>
                  <span className="text-muted-foreground">· PKR {Number(reg.decidedFeePerMonth||0).toLocaleString()}/mo</span>
                </div>
              );
            })()}

            {/* Main challans table — all challans (paginated) or filtered by student */}
            <Card>
              <CardContent className="pt-4">
                {(selectedChallanReg ? false : allChallansLoading) ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Challan No</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Student</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Month</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Heads</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-foreground bg-slate-100">Total</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-green-700 bg-green-50">Paid</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-orange-700 bg-orange-50">Balance</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Due Date</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</TableHead>
                          <TableHead className="py-2 px-3 text-xs font-semibold text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Use per-student challans if a student is selected, otherwise use paginated all-challans
                          const rows = selectedChallanReg ? hostelChallans : allChallans;
                          const reg = selectedChallanReg;
                          if (rows.length === 0) return (
                            <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                              {selectedChallanReg ? "No challans for this student yet." : "No challans found."}
                            </TableCell></TableRow>
                          );
                          return rows.map((c, idx) => {
                            const total = getChallanTotalEffective(c);
                            const paid = Number(c.paidAmount || 0);
                            const balance = Math.max(0, total - paid);
                            // Resolve student name for all-challans view
                            const studentName = c.student
                              ? `${c.student.fName} ${c.student.lName || ''}`.trim()
                              : c.hostelRegistration?.externalName || c.hostelRegNumber;
                            const rollNo = c.student?.rollNumber || '';
                            // For actions, we need the registration object — use selectedChallanReg if available
                            const challanReg = reg || { id: c.hostelRegNumber, student: c.student, externalName: c.hostelRegistration?.externalName, decidedFeePerMonth: c.hostelRegistration?.decidedFeePerMonth };
                            return (
                              <TableRow key={c.id} className={`${idx % 2 === 1 ? 'bg-muted/20' : ''} ${c.status === 'VOID' || c.status === 'SUPERSEDED' ? 'opacity-50' : ''}`}>
                                <TableCell className="py-2 px-3 text-sm font-medium">{c.challanNumber}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="font-medium text-sm">{studentName}</div>
                                  {rollNo && <div className="text-xs text-muted-foreground">{rollNo}</div>}
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.month}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="flex flex-col gap-0.5 max-w-[140px]">
                                    {c.heads?.map((h, i) => (
                                      <div key={i} className="flex justify-between text-[10px] text-muted-foreground gap-2">
                                        <span className="truncate">{h.headName}</span>
                                        <span>{Number(h.amount).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm font-bold bg-slate-50">PKR {total.toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm text-green-600 font-semibold bg-green-50/50">PKR {paid.toLocaleString()}</TableCell>
                                <TableCell className={`py-2 px-3 text-sm font-semibold bg-orange-50/50 ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>PKR {balance.toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">{c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="flex flex-col gap-0.5">
                                    <Badge variant={c.status === 'PAID' ? 'default' : (c.status === 'VOID' || c.status === 'SUPERSEDED') ? 'outline' : c.status === 'PARTIAL' ? 'warning' : 'secondary'}>
                                      {c.status}
                                    </Badge>
                                    {c.status === 'SUPERSEDED' && c.supersededBy && (
                                      <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                        <ArrowRight className="w-2.5 h-2.5" />
                                        <span>#{c.supersededBy.challanNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 px-3 text-sm">
                                  <div className="flex gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => previewHostelChallan(c, challanReg)}>
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Preview</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={() => printHostelChallan(c, challanReg)}>
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Print</TooltipContent>
                                    </Tooltip>
                                    {c.status !== 'PAID' && c.status !== 'VOID' && c.status !== 'SUPERSEDED' && c.status !== 'SETTLED' && (
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
                                    {c.status !== 'PAID' && c.status !== 'SUPERSEDED' && c.status !== 'SETTLED' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="outline" onClick={() => {
                                            setEditingHostelChallan(c);
                                            // Load existing heads — separate predefined (have feeHeadId) from custom
                                            const existingHeads = c.heads || [];
                                            const loadedCustomHeads = existingHeads
                                              .filter(h => !h.feeHeadId && h.headName !== 'Hostel Fee' && h.headName !== 'Arrears')
                                              .map(h => ({ headName: h.headName, amount: String(h.amount) }));
                                            setEditHostelChallanForm({
                                              fineAmount: String(c.fineAmount || ""),
                                              discount: String(c.discount || ""),
                                              remarks: c.remarks || "",
                                              dueDate: c.dueDate ? new Date(c.dueDate).toISOString().split('T')[0] : "",
                                              heads: loadedCustomHeads.length > 0 ? loadedCustomHeads : [{ headName: "", amount: "" }],
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
                          });
                        })()}
                      </TableBody>
                    </Table>

                    {/* Pagination — only shown in all-challans mode */}
                    {!selectedChallanReg && allChallansMeta.lastPage > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {allChallansMeta.total} total · page {allChallansPage} of {allChallansMeta.lastPage}
                        </span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={allChallansPage <= 1} onClick={() => setAllChallansPage(p => p - 1)}>← Prev</Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={allChallansPage >= allChallansMeta.lastPage} onClick={() => setAllChallansPage(p => p + 1)}>Next →</Button>
                        </div>
                      </div>
                    )}
                    {!selectedChallanReg && (
                      <div className="mt-2 text-xs text-muted-foreground text-right">
                        Showing {allChallans.length} of {allChallansMeta.total} challans
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
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

          <TabsContent value="revenue" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:ml-auto">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={revenueFromDate}
                    onChange={(e) => setRevenueFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={revenueToDate}
                    onChange={(e) => setRevenueToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {revenueLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        PKR {Math.round(revenueData?.totalCollected ?? 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Total Outstanding</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-600">
                        PKR {Math.round(revenueData?.totalOutstanding ?? 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Occupancy + Expenses charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernChartCard title="Room Occupancy (Seats)" subtitle="Live seat utilization">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={
                            revenueAnalytics?.occupancy
                              ? [
                                  { name: "Occupied", value: revenueAnalytics.occupancy.occupied },
                                  { name: "Vacant", value: revenueAnalytics.occupancy.vacant },
                                ]
                              : roomOccupancyData
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={88}
                          dataKey="value"
                        >
                          <Cell fill={MODERN_CHART_COLORS.primary} />
                          <Cell fill={MODERN_CHART_COLORS.slate} />
                        </Pie>
                        <RechartsTooltip content={<ModernTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ModernChartCard>
                  <ModernChartCard title="Expenses Over Time" subtitle="Trend by selected range">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={(revenueAnalytics?.expensesSeries || expensesOverTimeData).map((x) => ({ name: x.bucket || x.name, amount: x.amount }))}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} />
                        <Bar dataKey="amount" fill={MODERN_CHART_COLORS.warning} radius={[7, 7, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ModernChartCard>
                </div>

                {/* Monthly bar chart — zero-filled */}
                <Card>
                  <CardHeader><CardTitle>Monthly Collection</CardTitle></CardHeader>                  <CardContent>
                    {(() => {
                      const chartData = (revenueAnalytics?.collectionSeries || revenueData?.monthlyBreakdown || []).map(m => ({
                        month: m.month,
                        collected: m.collected,
                      }));

                      return (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={chartData} margin={{ bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11 }} />
                            <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} />
                            <Bar dataKey="collected" fill={MODERN_CHART_COLORS.success} radius={[8,8,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Per-student breakdown table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Per-Student Breakdown</CardTitle>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or registration ID..."
                        value={revenueSearch}
                        onChange={e => setRevenueSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          {[
                            { col: 'name', label: 'Student Name' },
                            { col: 'registrationId', label: 'Registration ID' },
                            { col: 'totalBilled', label: 'Total Billed' },
                            { col: 'totalPaid', label: 'Total Paid' },
                            { col: 'outstanding', label: 'Outstanding' },
                          ].map(({ col, label }) => (
                            <TableHead
                              key={col}
                              className="py-2 px-3 text-xs font-semibold cursor-pointer select-none hover:bg-accent"
                              onClick={() => setRevenueSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })}
                            >
                              {label} {revenueSort.col === col ? (revenueSort.dir === 'asc' ? '↑' : '↓') : ''}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const rows = (revenueData?.perStudent || [])
                            .filter(row => {
                              if (!revenueSearch) return true;
                              const q = revenueSearch.toLowerCase();
                              return (row.name || '').toLowerCase().includes(q) || (row.registrationId || '').toLowerCase().includes(q);
                            })
                            .sort((a, b) => {
                              const { col, dir } = revenueSort;
                              let av = a[col] ?? '';
                              let bv = b[col] ?? '';
                              if (typeof av === 'string') av = av.toLowerCase();
                              if (typeof bv === 'string') bv = bv.toLowerCase();
                              if (av < bv) return dir === 'asc' ? -1 : 1;
                              if (av > bv) return dir === 'asc' ? 1 : -1;
                              return 0;
                            });
                          if (rows.length === 0) return (
                            <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No data available.</TableCell></TableRow>
                          );
                          return rows.map((row, idx) => {
                            const outstanding = Math.round(row.outstanding ?? 0);
                            return (
                              <TableRow key={row.registrationId} className={idx % 2 === 1 ? 'bg-muted/20' : ''}>
                                <TableCell className="py-2 px-3 text-sm font-medium">{row.name}</TableCell>
                                <TableCell className="py-2 px-3 text-sm font-mono text-xs">{row.registrationId}</TableCell>
                                <TableCell className="py-2 px-3 text-sm">PKR {Math.round(row.totalBilled ?? 0).toLocaleString()}</TableCell>
                                <TableCell className="py-2 px-3 text-sm text-green-600 font-semibold">PKR {Math.round(row.totalPaid ?? 0).toLocaleString()}</TableCell>
                                <TableCell className={`py-2 px-3 text-sm font-semibold ${outstanding > 0 ? "text-orange-600" : "text-green-600"}`}>
                                  PKR {outstanding.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Boarding Fee Settings</CardTitle>
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
              <DialogTitle>{editMode.reg ? "Edit Boarding Registration" : "New Boarding Registration"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type toggle — only shown when creating, not editing */}
              {!editMode.reg && (
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
              )}
              {editMode.reg && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-muted font-medium text-foreground">
                    {registrationType === "internal" ? "Internal Student" : "External Student"}
                  </span>
                  <span className="text-xs">— type cannot be changed after registration</span>
                </div>
              )}

              {/* Student identity section */}
              {registrationType === "internal" ? (
                editMode.reg && selectedStudent ? (
                  // Edit mode — show read-only student info
                  <div className="space-y-1.5">
                    <Label>Student</Label>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border bg-muted/40">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{selectedStudent.fName} {selectedStudent.lName || ''}</div>
                        <div className="text-xs text-muted-foreground">Roll: {selectedStudent.rollNumber}{selectedStudent.program?.name ? ` · ${selectedStudent.program.name}` : ''}</div>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Locked</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-0">
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
                        // When editing, the student's own registration should not be blocked
                        const isRegistered = hostelRegistrations.some(reg =>
                          reg.studentId === student.id && reg.id !== editMode.reg
                        );
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
                )
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
                        // A room is the "current room" if the student/external is already allocated there
                        const isCurrentRoom = registrationType === "internal"
                          ? room.allocations?.some(a => a.studentId === Number(regFormData.studentId))
                          : room.allocations?.some(a => a.externalName === regFormData.externalName);
                        const isDisabled = isFull && !isCurrentRoom;
                        return (
                          <SelectItem key={room.id} value={String(room.id)} disabled={isDisabled}>
                            Room {room.roomNumber} ({room.roomType}) - {isCurrentRoom ? "Current Room" : isFull ? "Full" : `${room.capacity - room.currentOccupancy} Available`}
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
              <DialogTitle>{editMode.expense ? "Edit" : "Add"} Boarding Expense</DialogTitle>
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

      </div>

      {/* Generate Hostel Challans — Bulk Dialog */}
      <Dialog open={generateChallanOpen} onOpenChange={open => { setGenerateChallanOpen(open); if (!open) setBulkGenSearch(""); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Boarding Fee Challans</DialogTitle>
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
          </div>

          <div className="space-y-3 flex-shrink-0">
            <div>
              <Label className="text-xs">Predefined Fee Heads</Label>
              <div className="grid grid-cols-2 gap-2 mt-1 border rounded p-2 max-h-32 overflow-y-auto">
                {feeHeads.map(head => (
                  <label key={head.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateChallanForm.selectedFeeHeadIds.includes(head.id)}
                      onChange={e => {
                        const ids = e.target.checked
                          ? [...generateChallanForm.selectedFeeHeadIds, head.id]
                          : generateChallanForm.selectedFeeHeadIds.filter(id => id !== head.id);
                        setGenerateChallanForm({ ...generateChallanForm, selectedFeeHeadIds: ids });
                      }}
                    />
                    <span className="truncate">{head.name} (PKR {head.amount})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Custom / Ad-hoc Heads</Label>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setGenerateChallanForm({ ...generateChallanForm, customHeads: [...generateChallanForm.customHeads, { headName: "", amount: "" }] })}>
                  <Plus className="w-3 h-3 mr-1" /> Add Head
                </Button>
              </div>
              <div className="space-y-2 mt-1 max-h-32 overflow-y-auto pr-1">
                {generateChallanForm.customHeads.map((ch, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      placeholder="Head Name"
                      className="h-8 text-xs"
                      value={ch.headName}
                      onChange={e => {
                        const newHeads = [...generateChallanForm.customHeads];
                        newHeads[idx].headName = e.target.value;
                        setGenerateChallanForm({ ...generateChallanForm, customHeads: newHeads });
                      }}
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      className="h-8 text-xs w-24"
                      value={ch.amount}
                      onChange={e => {
                        const newHeads = [...generateChallanForm.customHeads];
                        newHeads[idx].amount = e.target.value;
                        setGenerateChallanForm({ ...generateChallanForm, customHeads: newHeads });
                      }}
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => {
                      const newHeads = generateChallanForm.customHeads.filter((_, i) => i !== idx);
                      setGenerateChallanForm({ ...generateChallanForm, customHeads: newHeads });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Textarea
                placeholder="Optional remarks..."
                className="h-16 text-xs"
                value={generateChallanForm.remarks}
                onChange={e => setGenerateChallanForm({ ...generateChallanForm, remarks: e.target.value })}
              />
            </div>
          </div>

          {hostelLateFee > 0 && (
            <div className="text-xs text-muted-foreground bg-muted rounded p-2 flex-shrink-0">
              Late fee: PKR {hostelLateFee}/day — applied automatically if due date has passed
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

                // Last Challan: most recent non-VOID challan
                const lastChallan = [...regChallans]
                  .filter(c => c.status !== 'VOID')
                  .sort((a, b) => new Date(b.generatedAt || b.createdAt) - new Date(a.generatedAt || a.createdAt))[0] || null;

                // Arrears: Σ(totalAmount - paidAmount) for PENDING/PARTIAL challans
                const arrearsTotal = regChallans
                  .filter(c => c.status === 'PENDING' || c.status === 'PARTIAL')
                  .reduce((sum, c) => sum + Math.max(0, getChallanTotalEffective(c) - Number(c.paidAmount || 0)), 0);

                // Duplicate check: non-VOID challan already exists for this month → block generation
                const isDuplicate = !!monthChallan && monthChallan.status !== 'SUPERSEDED';

                // Expected total for this student
                const predefinedHeadsTotal = generateChallanForm.selectedFeeHeadIds.reduce((sum, id) => {
                  const h = feeHeads.find(fh => fh.id === id);
                  return sum + (h ? Number(h.amount) : 0);
                }, 0);
                const customHeadsTotal = generateChallanForm.customHeads
                  .filter(h => h.headName && h.amount)
                  .reduce((sum, h) => sum + Number(h.amount), 0);
                const baseFee = Number(reg.decidedFeePerMonth || 0);
                const expectedTotal = baseFee + predefinedHeadsTotal + customHeadsTotal + arrearsTotal;

                return (
                  <label key={reg.id} className={`flex items-start gap-3 px-3 py-2 border-b last:border-b-0 ${isBeforeRegistration || isDuplicate ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-accent cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={checked && !isBeforeRegistration && !isDuplicate}
                      disabled={isBeforeRegistration || isDuplicate}
                      onChange={e => !isBeforeRegistration && !isDuplicate && setBulkGenSelected(prev =>
                        e.target.checked ? [...prev, reg.id] : prev.filter(id => id !== reg.id)
                      )}
                      className="h-4 w-4 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">{name}</div>
                        {/* Expected total */}
                        {!isDuplicate && !isBeforeRegistration && (
                          <span className="text-xs font-semibold text-foreground shrink-0">
                            PKR {Math.round(expectedTotal).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{sub} · {reg.student ? 'Internal' : 'External'} · PKR {Number(reg.decidedFeePerMonth||0).toLocaleString()}/mo</span>
                        {challanStatusBadge}
                        {isDuplicate && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none bg-orange-100 text-orange-700">
                            Already generated · {selectedMonthLabel}
                          </span>
                        )}
                        {isBeforeRegistration && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none bg-red-100 text-red-700">
                            Registered {regMonthLabel}
                          </span>
                        )}
                      </div>
                      {/* Last Challan + Arrears info */}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {lastChallan ? (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            Last: {lastChallan.month} ·{' '}
                            <span className={`font-semibold px-1 py-0.5 rounded leading-none ${
                              lastChallan.status === 'PAID' ? 'bg-green-100 text-green-700' :
                              lastChallan.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                              lastChallan.status === 'SUPERSEDED' ? 'bg-gray-100 text-gray-500' :
                              'bg-blue-100 text-blue-700'
                            }`}>{lastChallan.status}</span>
                            {' '}· {new Date(lastChallan.generatedAt || lastChallan.createdAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">No previous challan</span>
                        )}
                        {arrearsTotal > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600">
                            Arrears: PKR {Math.round(arrearsTotal).toLocaleString()}
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
              disabled={isBulkGenerating || bulkGenSelected.length === 0}
              onClick={async () => {
                if (!generateChallanForm.monthValue || !generateChallanForm.dueDate) {
                  toast({ title: "Month and due date are required", variant: "destructive" }); return;
                }
                setIsBulkGenerating(true);
                const monthLabel = monthValueToLabel(generateChallanForm.monthValue);
                let success = 0, failed = 0;
                for (const regId of bulkGenSelected) {
                  try {
                    await createHostelChallanDedicated({
                      hostelRegNumber: regId,
                      month: monthLabel,
                      dueDate: generateChallanForm.dueDate,
                      feeHeadIds: generateChallanForm.selectedFeeHeadIds,
                      heads: generateChallanForm.customHeads.filter(h => h.headName && h.amount).map(h => ({ headName: h.headName, amount: Number(h.amount) })),
                      remarks: generateChallanForm.remarks || undefined,
                    });
                    success++;
                  } catch { failed++; }
                }
                setIsBulkGenerating(false);
                invalidateAllChallanQueries();
                if (selectedChallanReg) queryClient.invalidateQueries({ queryKey: ['hostelChallans', selectedChallanReg.id] });
                setGenerateChallanOpen(false);
                setBulkGenSearch("");
                toast({ title: `${success} challan(s) generated${failed > 0 ? `, ${failed} failed` : ''}`, variant: failed > 0 ? 'destructive' : 'default' });
              }}
            >
              {isBulkGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : `Generate${bulkGenSelected.length > 0 ? ` (${bulkGenSelected.length})` : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Boarding Challan Dialog */}
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
            <Button disabled={updateChallanMutation.isPending} onClick={async () => {
              if (!payHostelAmount) { toast({ title: "Amount is required", variant: "destructive" }); return; }
              try {
                await recordHostelPayment(payingChallan.id, {
                  amount: Number(payHostelAmount),
                  paymentMode: 'Cash',
                  paidDate: payHostelDate,
                });
                invalidateAllChallanQueries();
                setPayHostelChallanOpen(false);
                setPayingChallan(null);
                toast({ title: "Payment recorded" });
              } catch (e) {
                toast({ title: e.message || "Failed to record payment", variant: "destructive" });
              }
            }}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boarding Challan Preview Dialog */}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Boarding Challan</DialogTitle>
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
              <Label>Discount (PKR)</Label>
              <Input type="number" min={0} placeholder="0" value={editHostelChallanForm.discount}
                onChange={e => setEditHostelChallanForm(f => ({ ...f, discount: e.target.value }))} />
            </div>

            {/* Custom / additional heads */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Additional Heads</Label>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                  onClick={() => setEditHostelChallanForm(f => ({ ...f, heads: [...(f.heads || []), { headName: "", amount: "" }] }))}>
                  <Plus className="w-3 h-3 mr-1" /> Add Head
                </Button>
              </div>
              <div className="space-y-2">
                {(editHostelChallanForm.heads || []).map((h, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Head Name"
                      className="h-8 text-xs flex-1"
                      value={h.headName}
                      onChange={e => {
                        const updated = [...editHostelChallanForm.heads];
                        updated[idx] = { ...updated[idx], headName: e.target.value };
                        setEditHostelChallanForm(f => ({ ...f, heads: updated }));
                      }}
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      className="h-8 text-xs w-24"
                      value={h.amount}
                      onChange={e => {
                        const updated = [...editHostelChallanForm.heads];
                        updated[idx] = { ...updated[idx], amount: e.target.value };
                        setEditHostelChallanForm(f => ({ ...f, heads: updated }));
                      }}
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive shrink-0"
                      onClick={() => setEditHostelChallanForm(f => ({ ...f, heads: f.heads.filter((_, i) => i !== idx) }))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
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
                const validHeads = (editHostelChallanForm.heads || [])
                  .filter(h => h.headName && h.amount)
                  .map(h => ({ headName: h.headName, amount: Number(h.amount) }));
                updateChallanMutation.mutate({
                  id: editingHostelChallan.id,
                  dto: {
                    dueDate: editHostelChallanForm.dueDate || undefined,
                    discount: editHostelChallanForm.discount !== "" ? Number(editHostelChallanForm.discount) : undefined,
                    remarks: editHostelChallanForm.remarks || undefined,
                    ...(newLateFee > 0 ? { lateFeeFine: newLateFee } : {}),
                    ...(validHeads.length > 0 ? { heads: validHeads } : {}),
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

      {/* Delete Boarding Challan Confirmation */}
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
      <Dialog open={profileOpen} onOpenChange={open => { setProfileOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {profileReg?.studentId ? "Internal Student" : "External Student"} — {profileReg?.student ? `${profileReg.student.fName} ${profileReg.student.lName || ''}`.trim() : profileReg?.externalName}
            </DialogTitle>
          </DialogHeader>
          {profileReg && (
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="challans" className="flex-1">Fee Challans</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
              </TabsList>

              {/* ── Details Tab ── */}
              <TabsContent value="details" className="mt-3 space-y-3">
                {profileReg.studentId ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground font-medium">Full Name</span>
                      <span>{profileReg.student ? `${profileReg.student.fName} ${profileReg.student.lName || ''}`.trim() : "—"}</span>
                      <span className="text-muted-foreground font-medium">Roll Number</span>
                      <span>{profileReg.student?.rollNumber || "—"}</span>
                      <span className="text-muted-foreground font-medium">Program</span>
                      <span>{profileReg.student?.program?.name || "—"}</span>
                      <span className="text-muted-foreground font-medium">Registration Date</span>
                      <span>{profileReg.registrationDate ? new Date(profileReg.registrationDate).toLocaleDateString() : "—"}</span>
                      <span className="text-muted-foreground font-medium">Status</span>
                      <span><Badge variant={profileReg.status === "active" ? "default" : profileReg.status === "terminated" ? "destructive" : "secondary"}>{profileReg.status}</Badge></span>
                      <span className="text-muted-foreground font-medium">Decided Fee / Month</span>
                      <span>PKR {profileReg.decidedFeePerMonth != null ? Number(profileReg.decidedFeePerMonth).toLocaleString() : "—"}</span>
                      {profileReg.terminationReason && getLastTerminationReason(profileReg.terminationReason) && (
                        <>
                          <span className="text-muted-foreground font-medium">Termination Reason</span>
                          <span className="text-red-600 text-xs">{getLastTerminationReason(profileReg.terminationReason)}</span>
                        </>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Full student details are in the Students module.</p>
                      <Button className="w-full gap-2" onClick={() => { setProfileOpen(false); navigate("/students", { state: { openStudentId: profileReg.studentId } }); }}>
                        <ExternalLink className="h-4 w-4" /> View Full Profile in Students
                      </Button>
                    </div>
                  </div>
                ) : (
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
                    <span>{profileReg.address || "—"}</span>
                    <span className="text-muted-foreground font-medium">Registration Date</span>
                    <span>{profileReg.registrationDate ? new Date(profileReg.registrationDate).toLocaleDateString() : "—"}</span>
                    <span className="text-muted-foreground font-medium">Status</span>
                    <span><Badge variant={profileReg.status === "active" ? "default" : profileReg.status === "terminated" ? "destructive" : "secondary"}>{profileReg.status}</Badge></span>
                    <span className="text-muted-foreground font-medium">Decided Fee / Month</span>
                    <span>PKR {profileReg.decidedFeePerMonth != null ? Number(profileReg.decidedFeePerMonth).toLocaleString() : "—"}</span>
                    <span className="text-muted-foreground font-medium">Registration ID</span>
                    <span className="font-mono text-xs">{profileReg.id}</span>
                    {profileReg.terminationReason && getLastTerminationReason(profileReg.terminationReason) && (
                      <>
                        <span className="text-muted-foreground font-medium">Termination Reason</span>
                        <span className="text-red-600 text-xs">{getLastTerminationReason(profileReg.terminationReason)}</span>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── Fee Challans Tab ── */}
              <TabsContent value="challans" className="mt-3">
                {profileChallans.filter(c => c.status !== 'VOID').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No challans yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {profileChallans.filter(c => c.status !== 'VOID').map(c => {
                      const total = (c.hostelFee||0) + (c.fineAmount||0) + (c.lateFeeFine||0) + (c.arrearsAmount||0) - (c.discount||0);
                      const balance = Math.max(0, total - (c.paidAmount||0));
                      return (
                        <div key={c.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-2">
                          <div>
                            <div className="font-medium">{c.month}</div>
                            <div className="text-muted-foreground">{c.challanNumber}</div>
                          </div>
                          <div className="text-right">
                            <div>PKR {total.toLocaleString()}</div>
                            {balance > 0 && <div className="text-red-600">Due: PKR {balance.toLocaleString()}</div>}
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
              </TabsContent>

              {/* ── History Tab ── */}
              <TabsContent value="history" className="mt-3">
                <RegistrationHistoryTab regId={profileReg.id} />
              </TabsContent>
            </Tabs>
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

      {/* Terminate Registration Dialog */}
      <Dialog open={terminateOpen} onOpenChange={open => { setTerminateOpen(open); if (!open) { setTerminateReg(null); setTerminateReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <UserX className="h-5 w-5" /> Terminate Registration
            </DialogTitle>
          </DialogHeader>
          {terminateReg && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are terminating the boarding registration for <span className="font-semibold text-foreground">
                  {terminateReg.student ? `${terminateReg.student.fName} ${terminateReg.student.lName || ''}`.trim() : terminateReg.externalName}
                </span>. This marks them as expelled. Please state the reason.
              </p>
              <div className="space-y-1.5">
                <Label>Reason for Termination <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="e.g. Violation of boarding rules, disciplinary action..."
                  value={terminateReason}
                  onChange={e => setTerminateReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTerminateOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={!terminateReason.trim()}
                  onClick={async () => {
                    try {
                      await terminateHostelRegistration(terminateReg.id, terminateReason);
                      // Room allocation is kept — not deallocated — so readmit can restore it
                      queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
                      toast({ title: "Registration terminated" });
                      setTerminateOpen(false);
                    } catch (e) {
                      toast({ title: e.message || "Failed to terminate", variant: "destructive" });
                    }
                  }}
                >
                  Terminate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Registration Dialog */}
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" /> Withdraw Registration
            </AlertDialogTitle>
            <AlertDialogDescription>
              This marks <span className="font-semibold">
                {withdrawReg?.student ? `${withdrawReg.student.fName} ${withdrawReg.student.lName || ''}`.trim() : withdrawReg?.externalName}
              </span> as withdrawn (checked out voluntarily). Their room will be deallocated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setWithdrawOpen(false); setWithdrawReg(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              try {
                await withdrawHostelRegistration(withdrawReg.id);
                // Room allocation is kept — not deallocated — so readmit can restore it
                queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
                toast({ title: "Registration withdrawn" });
                setWithdrawOpen(false);
                setWithdrawReg(null);
              } catch (e) {
                toast({ title: e.message || "Failed to withdraw", variant: "destructive" });
              }
            }}>Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Readmit Registration Dialog */}
      <AlertDialog open={readmitOpen} onOpenChange={open => { setReadmitOpen(open); if (!open) setReadmitReg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" /> Readmit Registration
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                You are readmitting <span className="font-semibold text-foreground">
                  {readmitReg?.student ? `${readmitReg.student.fName} ${readmitReg.student.lName || ''}`.trim() : readmitReg?.externalName}
                </span> back to boarding.
              </span>
              {readmitReg?.status === 'terminated' && readmitReg?.terminationReason && getLastTerminationReason(readmitReg.terminationReason) && (
                <span className="block text-xs text-red-600 mt-1">
                  Previously terminated for: "{getLastTerminationReason(readmitReg.terminationReason)}"
                </span>
              )}
              <span className="block text-xs text-muted-foreground mt-1">
                Their previous room allocation will be restored and status set back to active.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setReadmitOpen(false); setReadmitReg(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={async () => {
              try {
                await readmitHostelRegistration(readmitReg.id);
                queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
                queryClient.invalidateQueries({ queryKey: ['hostelRegHistory', readmitReg.id] });
                toast({ title: "Registration readmitted successfully" });
                setReadmitOpen(false);
                setReadmitReg(null);
              } catch (e) {
                toast({ title: e.message || "Failed to readmit", variant: "destructive" });
              }
            }}>Readmit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Boarding;

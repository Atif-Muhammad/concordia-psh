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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, FileText, Trash2, Info, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from "recharts";
import { ModernChartCard, ModernTooltip, ChartLegendPills, MODERN_CHART_COLORS } from "@/components/ui/modern-charts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinanceIncomes,
  createFinanceIncome,
  deleteFinanceIncome,
  getFinanceExpenses,
  createFinanceExpense,
  deleteFinanceExpense,
  getFinanceClosings,
  createFinanceClosing,
  updateFinanceClosing,
  deleteFinanceClosing,
  getFinanceReportsAnalytics
} from "../../config/apis";

// Helper to format date as YYYY-MM-DD in local time
const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to convert month to date range
const getMonthDateRange = (month) => {
  if (!month) return { dateFrom: '', dateTo: '' };
  const [year, monthNum] = month.split('-');
  const firstDay = `${year}-${monthNum}-01`;
  const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
  const lastDayStr = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;
  return { dateFrom: firstDay, dateTo: lastDayStr };
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getMonthDateRange(month);
};

const EXPENSE_CATEGORY_MAP = {
  Bills: ["Electricity Bill", "Gas Bill", "Water Bill", "Internet Bill", "Telephone Bill", "Generator Fuel"],
  Payroll: ["Teaching Salaries", "Non-Teaching Salaries", "Contract Wages", "Bonuses", "Payroll Taxes"],
  Operations: ["Office Supplies", "Printing & Stationery", "Software Subscription", "Bank Charges", "Courier"],
  Maintenance: ["Building Repair", "Equipment Repair", "Vehicle Maintenance", "Cleaning", "Security Services"],
  Academic: ["Books & Library", "Lab Consumables", "Exam Material", "Training & Workshops", "Sports Material"],
  StudentWelfare: ["Scholarships", "Events", "Medical Support", "Transport Support", "Meal Support"],
  Hostel: ["Hostel Food", "Hostel Utilities", "Hostel Maintenance", "Hostel Supplies"],
  Compliance: ["Tax Payment", "Legal Fee", "Licensing & NOC", "Audit Fee", "Insurance"],
  Miscellaneous: ["Donation", "Emergency", "Petty Cash", "Other"],
  Inventory: ["Inventory Purchase", "Inventory Maintenance"],
  Salaries: ["Salary Payment"],
  "Utility Bills": ["Electricity Bill", "Gas Bill", "Water Bill", "Internet Bill", "Telephone Bill"],
  Supplies: ["General Supplies"],
  Other: ["Other"],
};

const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_MAP);

const Finance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);

  // Separate filters for income and expense - using month picker
  const [incomeFilterCategory, setIncomeFilterCategory] = useState("all");
  const [incomeDateFrom, setIncomeDateFrom] = useState(() => getCurrentMonthRange().dateFrom);
  const [incomeDateTo, setIncomeDateTo] = useState(() => getCurrentMonthRange().dateTo);
  const [appliedIncomeFilter, setAppliedIncomeFilter] = useState(() => getCurrentMonthRange());

  const [expenseFilterCategory, setExpenseFilterCategory] = useState("all");
  const [expenseFilterSubCategory, setExpenseFilterSubCategory] = useState("all");
  const [expenseDateFrom, setExpenseDateFrom] = useState(() => getCurrentMonthRange().dateFrom);
  const [expenseDateTo, setExpenseDateTo] = useState(() => getCurrentMonthRange().dateTo);
  const [appliedExpenseFilter, setAppliedExpenseFilter] = useState(() => getCurrentMonthRange());

  // Dashboard filter for period
  const [dashboardPeriod, setDashboardPeriod] = useState("monthly"); // weekly, monthly, yearly
  const [dashboardDateFrom, setDashboardDateFrom] = useState("");
  const [dashboardDateTo, setDashboardDateTo] = useState("");
  const [appliedDashboardFilter, setAppliedDashboardFilter] = useState({ dateFrom: "", dateTo: "" });

  const [incomeFormData, setIncomeFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Donation",
    description: "",
    amount: 0
  });

  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Bills",
    subCategory: "Electricity Bill",
    description: "",
    amount: 0
  });

  const [closingType, setClosingType] = useState("daily");

  const [closingFormData, setClosingFormData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    remarks: "",
    incomeCount: 0,
    expenseCount: 0
  });

  const [closingDate, setClosingDate] = useState(toLocalDateString(new Date()));

  // Confirmation dialog states
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });

  // Edit closing state
  const [editClosingData, setEditClosingData] = useState(null);

  const [closingSubTab, setClosingSubTab] = useState("daily");
  const [dailyClosingFilterDate, setDailyClosingFilterDate] = useState(toLocalDateString(new Date()));
  const [monthlyClosingFilterMonth, setMonthlyClosingFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Reports filter - month string or empty for overall
  // Reports filter
  const [reportsDateFrom, setReportsDateFrom] = useState("");
  const [reportsDateTo, setReportsDateTo] = useState("");
  const [appliedReportsFilter, setAppliedReportsFilter] = useState({ dateFrom: "", dateTo: "" });


  // Helper to get date range based on dashboard period
  const getDashboardDateRange = () => {
    if (appliedDashboardFilter.dateFrom || appliedDashboardFilter.dateTo) {
      return {
        dateFrom: appliedDashboardFilter.dateFrom || "",
        dateTo: appliedDashboardFilter.dateTo || "",
      };
    }
    const now = new Date();
    let dateFrom, dateTo;

    if (dashboardPeriod === 'weekly') {
      // Last 7 days
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateTo = now;
    } else if (dashboardPeriod === 'monthly') {
      // Current month
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (dashboardPeriod === 'yearly') { // yearly
      // Current year
      dateFrom = new Date(now.getFullYear(), 0, 1);
      dateTo = new Date(now.getFullYear(), 11, 31);
    } else { // overall
      // Last 5 years
      dateFrom = new Date(now.getFullYear() - 4, 0, 1);
      dateTo = new Date(now.getFullYear(), 11, 31);
    }

    return {
      dateFrom: toLocalDateString(dateFrom),
      dateTo: toLocalDateString(dateTo)
    };
  };

  // Queries for dashboard data (always fetch based on period)
  const dashboardDateRange = getDashboardDateRange();
  const { data: dashboardIncomeData = [] } = useQuery({
    queryKey: ['dashboardIncome', dashboardDateRange.dateFrom, dashboardDateRange.dateTo, dashboardPeriod],
    queryFn: () => getFinanceIncomes({ dateFrom: dashboardDateRange.dateFrom, dateTo: dashboardDateRange.dateTo })
  });

  const { data: dashboardExpenseData = [] } = useQuery({
    queryKey: ['dashboardExpense', dashboardDateRange.dateFrom, dashboardDateRange.dateTo, dashboardPeriod],
    queryFn: () => getFinanceExpenses({ dateFrom: dashboardDateRange.dateFrom, dateTo: dashboardDateRange.dateTo })
  });

  // Queries for tabs
  const { data: incomeData = [], isLoading: incomeLoading } = useQuery({
    queryKey: ['financeIncome', appliedIncomeFilter.dateFrom, appliedIncomeFilter.dateTo, incomeFilterCategory],
    queryFn: () => getFinanceIncomes({ dateFrom: appliedIncomeFilter.dateFrom, dateTo: appliedIncomeFilter.dateTo, category: incomeFilterCategory }),
    enabled: !!appliedIncomeFilter.dateFrom && !!appliedIncomeFilter.dateTo
  });

  const { data: expenseData = [], isLoading: expenseLoading } = useQuery({
    queryKey: ['financeExpense', appliedExpenseFilter.dateFrom, appliedExpenseFilter.dateTo, expenseFilterCategory, expenseFilterSubCategory],
    queryFn: () => getFinanceExpenses({ dateFrom: appliedExpenseFilter.dateFrom, dateTo: appliedExpenseFilter.dateTo, category: expenseFilterCategory, subCategory: expenseFilterSubCategory }),
    enabled: !!appliedExpenseFilter.dateFrom && !!appliedExpenseFilter.dateTo
  });

  const { data: closingData = [], isLoading: closingLoading } = useQuery({
    queryKey: ['financeClosing', closingSubTab, dailyClosingFilterDate, monthlyClosingFilterMonth],
    queryFn: () => {
      if (closingSubTab === "daily") {
        if (!dailyClosingFilterDate) return [];
        return getFinanceClosings({
          type: "daily",
          dateFrom: dailyClosingFilterDate,
          dateTo: dailyClosingFilterDate,
        });
      }
      if (!monthlyClosingFilterMonth) return [];
      const range = getMonthDateRange(monthlyClosingFilterMonth);
      return getFinanceClosings({
        type: "monthly",
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
    },
    enabled: closingSubTab === "daily" ? !!dailyClosingFilterDate : !!monthlyClosingFilterMonth,
  });

  // Queries for Reports tab - separate data fetch
  const { data: reportsIncomeData = [] } = useQuery({
    queryKey: ['reportsIncome', appliedReportsFilter.dateFrom, appliedReportsFilter.dateTo],
    queryFn: () => getFinanceIncomes({ dateFrom: appliedReportsFilter.dateFrom, dateTo: appliedReportsFilter.dateTo })
  });

  const { data: reportsExpenseData = [] } = useQuery({
    queryKey: ['reportsExpense', appliedReportsFilter.dateFrom, appliedReportsFilter.dateTo],
    queryFn: () => getFinanceExpenses({ dateFrom: appliedReportsFilter.dateFrom, dateTo: appliedReportsFilter.dateTo })
  });

  const { data: reportsAnalytics } = useQuery({
    queryKey: ['financeReportsAnalytics', appliedReportsFilter.dateFrom, appliedReportsFilter.dateTo],
    queryFn: () =>
      getFinanceReportsAnalytics({
        dateFrom: appliedReportsFilter.dateFrom || undefined,
        dateTo: appliedReportsFilter.dateTo || undefined,
        groupBy: 'month',
      }),
    retry: 0,
  });

  // Mutations
  const addIncomeMutation = useMutation({
    mutationFn: createFinanceIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeIncome'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardIncome'] });
      toast({ title: "Income added successfully" });
      setIncomeOpen(false);
      setIncomeFormData({
        date: new Date().toISOString().split("T")[0],
        category: "Donation",
        description: "",
        amount: 0
      });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to add income", variant: "destructive" });
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: deleteFinanceIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeIncome'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardIncome'] });
      toast({ title: "Income record deleted" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to delete income", variant: "destructive" });
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: createFinanceExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeExpense'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardExpense'] });
      toast({ title: "Expense added successfully" });
      setExpenseOpen(false);
      setExpenseFormData({
        date: new Date().toISOString().split("T")[0],
        category: "Bills",
        subCategory: "Electricity Bill",
        description: "",
        amount: 0
      });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to add expense", variant: "destructive" });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteFinanceExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeExpense'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardExpense'] });
      toast({ title: "Expense record deleted" });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to delete expense", variant: "destructive" });
    }
  });

  const addClosingMutation = useMutation({
    mutationFn: createFinanceClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeClosing'] });
      toast({ title: `${closingType} closing completed` });
      if (closingType === "daily") {
        setDailyClosingFilterDate(closingDate);
      } else if (closingType === "monthly") {
        const d = new Date(closingDate);
        if (!Number.isNaN(d.getTime())) {
          setMonthlyClosingFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      }
      setClosingOpen(false);
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to create closing", variant: "destructive" });
    }
  });

  const updateClosingMutation = useMutation({
    mutationFn: updateFinanceClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeClosing'] });
      toast({ title: "Closing updated successfully" });
      setEditClosingData(null);
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to update closing", variant: "destructive" });
    }
  });

  const deleteClosingMutation = useMutation({
    mutationFn: deleteFinanceClosing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeClosing'] });
      toast({ title: "Closing deleted successfully" });
      setDeleteConfirm({ open: false, id: null, type: '' });
    },
    onError: (error) => {
      toast({ title: error.message || "Failed to delete closing", variant: "destructive" });
    }
  });


  // Calculate totals from dashboard data (based on selected period)
  const totalIncome = useMemo(() => dashboardIncomeData.reduce((sum, item) => sum + Number(item.amount), 0), [dashboardIncomeData]);
  const totalExpense = useMemo(() => dashboardExpenseData.reduce((sum, item) => sum + Number(item.amount), 0), [dashboardExpenseData]);
  const netBalance = totalIncome - totalExpense;

  const handleAddIncome = () => {
    if (!incomeFormData.description || !incomeFormData.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    addIncomeMutation.mutate(incomeFormData);
  };

  const handleAddExpense = () => {
    if (!expenseFormData.description || !expenseFormData.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    addExpenseMutation.mutate(expenseFormData);
  };

  const handleClosing = () => {
    const payload = {
      date: closingDate,
      type: closingType,
      remarks: closingFormData.remarks
    };
    addClosingMutation.mutate(payload);
  };

  // Calculate amounts based on closing type
  const getClosingAmounts = async () => {
    const selectedDate = new Date(closingDate);
    let dateFrom, dateTo;

    if (closingType === 'daily') {
      dateFrom = dateTo = closingDate;
    } else if (closingType === 'monthly') {
      dateFrom = toLocalDateString(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      dateTo = toLocalDateString(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0));
    } else { // quarterly
      const quarter = Math.floor(selectedDate.getMonth() / 3);
      dateFrom = toLocalDateString(new Date(selectedDate.getFullYear(), quarter * 3, 1));
      dateTo = toLocalDateString(new Date(selectedDate.getFullYear(), (quarter + 1) * 3, 0));
    }

    try {
      const [incomes, expenses] = await Promise.all([
        getFinanceIncomes({ dateFrom, dateTo }),
        getFinanceExpenses({ dateFrom, dateTo })
      ]);

      const income = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
      const expense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

      const periodLabel = closingType === 'daily'
        ? closingDate
        : `${dateFrom} to ${dateTo}`;

      setClosingFormData({
        totalIncome: income,
        totalExpense: expense,
        incomeCount: incomes.length,
        expenseCount: expenses.length,
        remarks: `${closingType.charAt(0).toUpperCase() + closingType.slice(1)} closing for ${periodLabel}`
      });
    } catch (error) {
      console.error('Error calculating closing amounts:', error);
    }
  };

  // Au when closing type changes or dialog opens
  React.useEffect(() => {
    if (closingOpen) {
      getClosingAmounts();
    }
  }, [closingType, closingOpen, closingDate]);

  // Chart data - dynamic based on selected period
  const getDateOnly = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return toLocalDateString(d);
  };

  const monthlyData = useMemo(() => {
    const rangeStart = dashboardDateRange.dateFrom ? new Date(dashboardDateRange.dateFrom) : null;
    const rangeEnd = dashboardDateRange.dateTo ? new Date(dashboardDateRange.dateTo) : null;
    const now = new Date();

    if (dashboardPeriod === 'weekly') {
      const days = [];
      const end = rangeEnd || now;
      for (let i = 6; i >= 0; i--) {
        const date = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = toLocalDateString(date);
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayIncome = dashboardIncomeData
          .filter(item => getDateOnly(item.date) === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const dayExpense = dashboardExpenseData
          .filter(item => getDateOnly(item.date) === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        days.push({
          month: dayLabel, // Reusing 'month' key for consistency
          income: dayIncome,
          expense: dayExpense,
          balance: dayIncome - dayExpense
        });
      }
      return days;
    } else if (dashboardPeriod === 'overall') {
      const years = [];
      const currentYear = (rangeEnd || now).getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearIncome = dashboardIncomeData
          .filter(item => getDateOnly(item.date).startsWith(`${year}-`))
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const yearExpense = dashboardExpenseData
          .filter(item => getDateOnly(item.date).startsWith(`${year}-`))
          .reduce((sum, item) => sum + Number(item.amount), 0);

        years.push({
          month: year.toString(),
          income: yearIncome,
          expense: yearExpense,
          balance: yearIncome - yearExpense
        });
      }
      return years;

    } else if (dashboardPeriod === 'monthly') {
      const days = [];
      const start = rangeStart || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = rangeEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const cursor = new Date(start);
      while (cursor <= end) {
        const dateStr = toLocalDateString(cursor);
        const dayLabel = String(cursor.getDate());

        const dayIncome = dashboardIncomeData
          .filter(item => getDateOnly(item.date) === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const dayExpense = dashboardExpenseData
          .filter(item => getDateOnly(item.date) === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        days.push({
          month: dayLabel,
          income: dayIncome,
          expense: dayExpense,
          balance: dayIncome - dayExpense
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      return days;

    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = (rangeStart || now).getFullYear();
      return months.map((month, index) => {
        const monthNum = (index + 1).toString().padStart(2, "0");
        const monthIncome = dashboardIncomeData
          .filter(i => getDateOnly(i.date).startsWith(`${currentYear}-${monthNum}`))
          .reduce((sum, i) => sum + Number(i.amount), 0);
        const monthExpense = dashboardExpenseData
          .filter(e => getDateOnly(e.date).startsWith(`${currentYear}-${monthNum}`))
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          month,
          income: monthIncome,
          expense: monthExpense,
          balance: monthIncome - monthExpense
        };
      });
    }
  }, [dashboardIncomeData, dashboardExpenseData, dashboardPeriod, dashboardDateRange.dateFrom, dashboardDateRange.dateTo]);


  // Stacked Chart Data - Aggregates by Date AND Category
  const stackedChartData = useMemo(() => {
    const getDateKey = (date, period) => {
      const d = new Date(date);
      if (period === 'weekly' || period === 'monthly') return toLocalDateString(d);
      if (period === 'yearly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return d.getFullYear().toString();
    };

    const getLabel = (dateStr, period) => {
      // Logic mirrors monthlyData logic somewhat but generalized
      if (period === 'weekly' || period === 'monthly') {
        // dateStr is YYYY-MM-DD. For weekly/monthly we want Day number or label.
        // In monthlyData 'weekly' used Day Name (Mon), 'monthly' used Day Number (1).
        // We'll stick to Day Number/Name based on logic below or simplify.
        const d = new Date(dateStr);
        if (period === 'weekly') return d.toLocaleDateString('en-US', { weekday: 'short' });
        return d.getDate().toString();
      }
      if (period === 'yearly') {
        // dateStr is YYYY-MM. Return Month Name.
        const [y, m] = dateStr.split('-');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[parseInt(m) - 1];
      }
      return dateStr; // yearly (YYYY)
    };

    // Helper to generate periods (Days/Months/Years) similar to monthlyData
    let periods = [];
    const now = new Date();
    const rangeStart = dashboardDateRange.dateFrom ? new Date(dashboardDateRange.dateFrom) : null;
    const rangeEnd = dashboardDateRange.dateTo ? new Date(dashboardDateRange.dateTo) : null;

    if (dashboardPeriod === 'weekly') {
      const end = rangeEnd || now;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end.getTime() - i * 86400000);
        periods.push(getDateKey(d, 'weekly'));
      }
    } else if (dashboardPeriod === 'monthly') {
      const start = rangeStart || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = rangeEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const cursor = new Date(start);
      while (cursor <= end) {
        periods.push(toLocalDateString(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    } else if (dashboardPeriod === 'yearly') {
      const baseYear = (rangeStart || now).getFullYear();
      for (let i = 0; i < 12; i++) {
        periods.push(`${baseYear}-${String(i + 1).padStart(2, '0')}`);
      }
    } else { // overall
      const currentYear = (rangeEnd || now).getFullYear();
      for (let i = 4; i >= 0; i--) {
        periods.push((currentYear - i).toString());
      }
    }

    // Initialize data structure
    const data = periods.map(p => ({
      name: getLabel(p, dashboardPeriod),
      // Incomes
      "Tuition Fee": 0, "Extra Challan": 0, "Hostel Challan": 0, Donation: 0, Funding: 0, Revenue: 0, Investments: 0,
      // Expenses
      Bills: 0, Payroll: 0, Operations: 0, Maintenance: 0, Academic: 0, StudentWelfare: 0, Hostel: 0, Compliance: 0, Miscellaneous: 0, Inventory: 0, Salaries: 0, "Utility Bills": 0, Supplies: 0, Other: 0
    }));

    // Fill Data
    const fillData = (sourceData, type) => {
      sourceData.forEach(item => {
        // Handle Date Parsing for ISO strings (paidDate etc)
        // item.date is full ISO. 
        let itemKey;
        try {
          // We need to match the period generated keys
          if (dashboardPeriod === 'weekly' || dashboardPeriod === 'monthly') {
            itemKey = getDateOnly(item.date);
          } else if (dashboardPeriod === 'yearly') {
            itemKey = getDateOnly(item.date).slice(0, 7); // YYYY-MM
          } else {
            itemKey = getDateOnly(item.date).slice(0, 4); // YYYY
          }
        } catch (e) { return; }

        const periodIndex = periods.indexOf(itemKey);
        if (periodIndex !== -1) {
          if (data[periodIndex][item.category] !== undefined) {
            data[periodIndex][item.category] += Number(item.amount);
          }
        }
      });
    };

    fillData(dashboardIncomeData, 'income');
    fillData(dashboardExpenseData, 'expense');

    return data;
  }, [dashboardIncomeData, dashboardExpenseData, dashboardPeriod, dashboardDateRange.dateFrom, dashboardDateRange.dateTo]);

  const incomeColors = {
    "Tuition Fee": "hsl(var(--primary))",
    "Extra Challan": "#22c55e",
    "Hostel Challan": "#06b6d4",
    Donation: "#10b981", // emerald-500
    Funding: "#3b82f6", // blue-500
    Revenue: "#f59e0b", // amber-500
    Investments: "#8b5cf6" // violet-500
  };

  const expenseColors = {
    Bills: "#ef4444",
    Payroll: "#3b82f6",
    Operations: "#0ea5e9",
    Academic: "#22c55e",
    StudentWelfare: "#a855f7",
    Compliance: "#f59e0b",
    Miscellaneous: "#6b7280",
    Inventory: "#f97316", // orange-500
    "Utility Bills": "#ef4444", // red-500
    Salaries: "#3b82f6", // blue-500
    Hostel: "#8b5cf6", // violet-500
    Maintenance: "#10b981", // emerald-500
    Supplies: "#f59e0b", // amber-500
    Other: "#6b7280" // gray-500
  };

  // Reports tab calculations (separate from dashboard)
  const reportsTotalIncome = useMemo(() => reportsIncomeData.reduce((sum, item) => sum + Number(item.amount), 0), [reportsIncomeData]);
  const reportsTotalExpense = useMemo(() => reportsExpenseData.reduce((sum, item) => sum + Number(item.amount), 0), [reportsExpenseData]);
  const reportsNetBalance = reportsTotalIncome - reportsTotalExpense;

  const reportsCategoryIncomeData = [
    { name: "Tuition Fee", amount: reportsIncomeData.filter(i => i.category === "Tuition Fee" || i.category === "Fee").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Extra Challan", amount: reportsIncomeData.filter(i => i.category === "Extra Challan" || i.category === "Extra Fee").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Hostel Challan", amount: reportsIncomeData.filter(i => i.category === "Hostel Challan" || i.category === "Hostel Fee").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Donation", amount: reportsIncomeData.filter(i => i.category === "Donation").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Funding", amount: reportsIncomeData.filter(i => i.category === "Funding").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Revenue", amount: reportsIncomeData.filter(i => i.category === "Revenue").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Investments", amount: reportsIncomeData.filter(i => i.category === "Investments").reduce((sum, i) => sum + Number(i.amount), 0) }
  ];

  const reportsCategoryExpenseData = useMemo(() => {
    const grouped = reportsExpenseData.reduce((acc, item) => {
      const category = item?.category || "Other";
      const subCategory = item?.subCategory || "General";
      const key = `${category} > ${subCategory}`;
      acc[key] = (acc[key] || 0) + Number(item?.amount || 0);
      return acc;
    }, {});
    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [reportsExpenseData]);

  const reportsTrendData = useMemo(() => {
    if (reportsAnalytics?.timeseries?.length) {
      return reportsAnalytics.timeseries.map((row) => ({
        name: row.bucket,
        income: Number(row.income || 0),
        expense: Number(row.expense || 0),
        net: Number(row.net || 0),
      }));
    }
    const map = {};
    [...reportsIncomeData, ...reportsExpenseData].forEach((row) => {
      const d = new Date(row.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { name: key, income: 0, expense: 0, net: 0 };
      if (reportsIncomeData.includes(row)) map[key].income += Number(row.amount || 0);
      else map[key].expense += Number(row.amount || 0);
      map[key].net = map[key].income - map[key].expense;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [reportsAnalytics, reportsIncomeData, reportsExpenseData]);

  const reportsIncomePieData = useMemo(
    () =>
      (reportsAnalytics?.incomeByCategory || reportsCategoryIncomeData.map((x) => ({ name: x.name, value: x.amount })))
        .filter((x) => Number(x.value || x.amount || 0) > 0)
        .map((x) => ({ name: x.name, value: Number(x.value ?? x.amount ?? 0) })),
    [reportsAnalytics, reportsCategoryIncomeData],
  );

  return <DashboardLayout>
    <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              Finance Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track income, expenses, and financial reports
            </p>
          </div>
        </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">PKR {totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">PKR {totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
              PKR {netBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="closing">Closing</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <Label>From</Label>
                  <Input type="date" value={dashboardDateFrom} onChange={(e) => setDashboardDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label>To</Label>
                  <Input type="date" value={dashboardDateTo} onChange={(e) => setDashboardDateTo(e.target.value)} />
                </div>
                <div>
                  <Button
                    onClick={() => setAppliedDashboardFilter({ dateFrom: dashboardDateFrom, dateTo: dashboardDateTo })}
                    className="w-full"
                  >
                    Apply
                  </Button>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setDashboardDateFrom("");
                      setDashboardDateTo("");
                      setAppliedDashboardFilter({ dateFrom: "", dateTo: "" });
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Balance Trend
                  <div className="group relative inline-block">
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-64 rounded-md bg-popover p-3 text-sm text-popover-foreground shadow-md border">
                      <p className="font-semibold mb-1">Net Profit/Loss Over Time</p>
                      <p className="text-xs">Shows your financial health by calculating <strong>Income - Expenses</strong> for each period. Positive values (green) indicate profit, negative values indicate loss.</p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <RechartsTooltip />
                    <Bar dataKey="balance" name="Balance">
                      {monthlyData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.balance >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stackedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <RechartsTooltip />
                    <Legend />
                    {Object.keys(incomeColors).map(key => (
                      <Bar key={key} dataKey={key} stackId="a" fill={incomeColors[key]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stackedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => value.toLocaleString()} />
                    <RechartsTooltip />
                    <Legend />
                    {Object.keys(expenseColors).map(key => (
                      <Bar key={key} dataKey={key} stackId="a" fill={expenseColors[key]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Income Records</CardTitle>
                <Button onClick={() => setIncomeOpen(true)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Add Income
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-4">
                <div>
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={incomeDateFrom}
                    onChange={e => setIncomeDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={incomeDateTo}
                    onChange={e => setIncomeDateTo(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={incomeFilterCategory} onValueChange={setIncomeFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                      <SelectItem value="Extra Challan">Extra Challan</SelectItem>
                      <SelectItem value="Hostel Challan">Hostel Challan</SelectItem>
                      <SelectItem value="Donation">Donation</SelectItem>
                      <SelectItem value="Funding">Funding</SelectItem>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                      <SelectItem value="Investments">Investments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setAppliedIncomeFilter({ dateFrom: incomeDateFrom, dateTo: incomeDateTo })}
                  >
                    Apply
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const current = getCurrentMonthRange();
                      setIncomeDateFrom(current.dateFrom);
                      setIncomeDateTo(current.dateTo);
                      setAppliedIncomeFilter(current);
                      setIncomeFilterCategory("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Category</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Amount</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Loading income data...
                        </TableCell>
                      </TableRow>
                    ) : incomeData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No income records found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                      incomeData.map(item => <TableRow key={item.id}>
                        <TableCell className="py-2 px-3 text-sm">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">
                          <Badge variant="default">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-sm">{item.description}</TableCell>
                        <TableCell className="text-sm px-3 py-2 font-bold text-success">PKR {Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell className="py-2 px-3 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm({ open: true, id: item.id, type: 'income' })}
                                disabled={!!item.source}
                                title={!!item.source ? `Cannot delete automated ${item.category} records` : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>)
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Expense Records</CardTitle>
                <Button onClick={() => setExpenseOpen(true)}>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mt-4">
                <div className="flex-1">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={expenseDateFrom}
                    onChange={e => setExpenseDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={expenseDateTo}
                    onChange={e => setExpenseDateTo(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label>Category</Label>
                  <Select value={expenseFilterCategory} onValueChange={(value) => {
                    setExpenseFilterCategory(value);
                    setExpenseFilterSubCategory("all");
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Sub Category</Label>
                  <Select
                    value={expenseFilterSubCategory}
                    onValueChange={setExpenseFilterSubCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub Categories</SelectItem>
                      {(expenseFilterCategory === "all"
                        ? Array.from(new Set(Object.values(EXPENSE_CATEGORY_MAP).flat()))
                        : (EXPENSE_CATEGORY_MAP[expenseFilterCategory] || [])
                      ).map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setAppliedExpenseFilter({ dateFrom: expenseDateFrom, dateTo: expenseDateTo })}
                  >
                    Apply
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const current = getCurrentMonthRange();
                      setExpenseDateFrom(current.dateFrom);
                      setExpenseDateTo(current.dateTo);
                      setAppliedExpenseFilter(current);
                      setExpenseFilterCategory("all");
                      setExpenseFilterSubCategory("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Category</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Sub Category</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Description</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Amount</TableHead>
                      <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Loading expense data...
                      </TableCell>
                    </TableRow>
                  ) : expenseData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No expense records found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseData.map(item => <TableRow key={item.id}>
                      <TableCell className="py-2 px-3 text-sm">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge variant="destructive">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">{item.subCategory || "-"}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">{item.description}</TableCell>
                      <TableCell className="text-sm px-3 py-2 font-bold text-destructive">PKR {Number(item.amount).toLocaleString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteConfirm({ open: true, id: item.id, type: 'expense' })}
                              disabled={!!item.source}
                              title={!!item.source ? `Cannot delete automated ${item.category} records` : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Financial Reports</CardTitle>
                <div className="flex gap-2 items-end">
                  <div>
                    <Label className="whitespace-nowrap">From</Label>
                    <Input
                      type="date"
                      value={reportsDateFrom}
                      onChange={(e) => setReportsDateFrom(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <div>
                    <Label className="whitespace-nowrap">To</Label>
                    <Input
                      type="date"
                      value={reportsDateTo}
                      onChange={(e) => setReportsDateTo(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAppliedReportsFilter({ dateFrom: reportsDateFrom, dateTo: reportsDateTo })}
                  >
                    Apply Filter
                  </Button>
                  {(appliedReportsFilter.dateFrom || appliedReportsFilter.dateTo) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReportsDateFrom("");
                        setReportsDateTo("");
                        setAppliedReportsFilter({ dateFrom: "", dateTo: "" });
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ModernChartCard title="Income vs Expense Trend" subtitle="Filtered reporting period" empty={!reportsTrendData.length}>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportsTrendData}>
                        <defs>
                          <linearGradient id="finIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={MODERN_CHART_COLORS.success} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={MODERN_CHART_COLORS.success} stopOpacity={0.04} />
                          </linearGradient>
                          <linearGradient id="finExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={MODERN_CHART_COLORS.danger} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={MODERN_CHART_COLORS.danger} stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} />
                        <Area type="monotone" dataKey="income" stroke={MODERN_CHART_COLORS.success} fill="url(#finIncomeGrad)" strokeWidth={2.5} />
                        <Area type="monotone" dataKey="expense" stroke={MODERN_CHART_COLORS.danger} fill="url(#finExpenseGrad)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ModernChartCard>
                <ModernChartCard title="Income Mix" subtitle="Category contribution" empty={!reportsIncomePieData.length}>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={reportsIncomePieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={98} paddingAngle={3}>
                          {reportsIncomePieData.map((item, index) => (
                            <Cell
                              key={`${item.name}-${index}`}
                              fill={[MODERN_CHART_COLORS.primary, MODERN_CHART_COLORS.secondary, MODERN_CHART_COLORS.success, MODERN_CHART_COLORS.warning, MODERN_CHART_COLORS.sky, MODERN_CHART_COLORS.pink][index % 6]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegendPills
                    items={reportsIncomePieData.slice(0, 6).map((x, i) => ({
                      label: x.name,
                      color: [MODERN_CHART_COLORS.primary, MODERN_CHART_COLORS.secondary, MODERN_CHART_COLORS.success, MODERN_CHART_COLORS.warning, MODERN_CHART_COLORS.sky, MODERN_CHART_COLORS.pink][i % 6],
                    }))}
                  />
                </ModernChartCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4">Income Summary</h3>
                  <div className="space-y-2">
                    {reportsCategoryIncomeData.map(cat => <div key={cat.name} className="flex justify-between">
                      <span>{cat.name}:</span>
                      <span className="font-bold">PKR {cat.amount.toLocaleString()}</span>
                    </div>)}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Income:</span>
                        <span className="text-success">PKR {reportsTotalIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-4">Expense Summary</h3>
                  <div className="space-y-2">
                    {reportsCategoryExpenseData.map(cat => <div key={cat.name} className="flex justify-between">
                      <span>{cat.name}:</span>
                      <span className="font-bold">PKR {cat.amount.toLocaleString()}</span>
                    </div>)}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Expense:</span>
                        <span className="text-destructive">PKR {reportsTotalExpense.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6 bg-muted">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-xl">Net Balance</h3>
                  <span className={`font-bold text-2xl ${reportsNetBalance >= 0 ? "text-success" : "text-destructive"}`}>
                    PKR {reportsNetBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Closing</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={closingSubTab} onValueChange={setClosingSubTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily">Daily Close</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Close</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="space-y-4">
                  <div className="flex justify-between items-end gap-3 flex-wrap">
                    <div className="flex items-end gap-2">
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={dailyClosingFilterDate} onChange={(e) => setDailyClosingFilterDate(e.target.value)} className="w-[180px]" />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setDailyClosingFilterDate(toLocalDateString(new Date()))}
                      >
                        Today
                      </Button>
                    </div>
                    <Button onClick={() => {
                      setClosingType("daily");
                      setClosingDate(dailyClosingFilterDate || toLocalDateString(new Date()));
                      setClosingOpen(true);
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      New Daily Close
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4">
                  <div className="flex justify-between items-end gap-3 flex-wrap">
                    <div className="flex items-end gap-2">
                      <div>
                        <Label>Month</Label>
                        <Input type="month" value={monthlyClosingFilterMonth} onChange={(e) => setMonthlyClosingFilterMonth(e.target.value)} className="w-[180px]" />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          setMonthlyClosingFilterMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                        }}
                      >
                        Current Month
                      </Button>
                    </div>
                    <Button onClick={() => {
                      setClosingType("monthly");
                      if (monthlyClosingFilterMonth) {
                        setClosingDate(`${monthlyClosingFilterMonth}-01`);
                      }
                      setClosingOpen(true);
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      New Monthly Close
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2 px-3 text-sm">Date</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Type</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Income</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Expense</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Balance</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Remarks</TableHead>
                    <TableHead className="py-2 px-3 text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closingLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Loading closing data...
                      </TableCell>
                    </TableRow>
                  ) : closingData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No closing records found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    closingData.map(closing => <TableRow key={closing.id}>
                      <TableCell className="py-2 px-3 text-sm">{new Date(closing.date).toLocaleDateString()}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <Badge>{closing.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm px-3 py-2 text-success">PKR {Number(closing.totalIncome).toLocaleString()}</TableCell>
                      <TableCell className="text-sm px-3 py-2 text-destructive">PKR {Number(closing.totalExpense).toLocaleString()}</TableCell>
                      <TableCell className={Number(closing.netBalance) >= 0 ? "py-2 px-3 text-sm text-success font-bold" : "py-2 px-3 text-sm text-destructive font-bold"}>
                        PKR {Number(closing.netBalance).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-sm">{closing.remarks}</TableCell>
                      <TableCell className="py-2 px-3 text-sm">
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditClosingData(closing)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteConfirm({ open: true, id: closing.id, type: 'closing' })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>)
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={incomeFormData.date} onChange={e => setIncomeFormData({ ...incomeFormData, date: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={incomeFormData.category} onValueChange={value => setIncomeFormData({ ...incomeFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Donation">Donation</SelectItem>
                  <SelectItem value="Funding">Funding</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Investments">Investments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={incomeFormData.description} onChange={e => setIncomeFormData({ ...incomeFormData, description: e.target.value })} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={incomeFormData.amount} onChange={e => setIncomeFormData({ ...incomeFormData, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <Button onClick={handleAddIncome} disabled={addIncomeMutation.isPending}>
            {addIncomeMutation.isPending ? "Adding..." : "Add Income"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={expenseFormData.date} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={expenseFormData.category} onValueChange={value => setExpenseFormData({
                ...expenseFormData,
                category: value,
                subCategory: (EXPENSE_CATEGORY_MAP[value] || [])[0] || ""
              })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub Category</Label>
              <Select value={expenseFormData.subCategory} onValueChange={value => setExpenseFormData({ ...expenseFormData, subCategory: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(EXPENSE_CATEGORY_MAP[expenseFormData.category] || []).map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={expenseFormData.description} onChange={e => setExpenseFormData({ ...expenseFormData, description: e.target.value })} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
            {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={closingOpen} onOpenChange={setClosingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Financial Closing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{closingType === 'daily' ? 'Date' : 'Selection Date'}</Label>
              <Input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Total Income</Label>
              <Input
                type="number"
                readOnly
                className="bg-muted"
                value={closingFormData.totalIncome}
                onChange={e => { }}
              />
            </div>
            <div>
              <Label>Total Expense</Label>
              <Input
                type="number"
                readOnly
                className="bg-muted"
                value={closingFormData.totalExpense}
                onChange={e => { }}
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={closingFormData.remarks}
                onChange={e => setClosingFormData({ ...closingFormData, remarks: e.target.value })}
                placeholder="Add any notes about this closing..."
              />
            </div>
            <div className="border rounded-lg p-4 space-y-2 bg-muted">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Summary for {closingDate}</span>
                <span>{closingFormData.incomeCount + closingFormData.expenseCount} records total</span>
              </div>
              <div className="flex justify-between">
                <span>Total Income ({closingFormData.incomeCount} records):</span>
                <span className="font-bold text-success">PKR {closingFormData.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expense ({closingFormData.expenseCount} records):</span>
                <span className="font-bold text-destructive">PKR {closingFormData.totalExpense.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">Net Balance:</span>
                <span className={`font-bold text-lg ${(closingFormData.totalIncome - closingFormData.totalExpense) >= 0 ? "text-success" : "text-destructive"}`}>
                  PKR {(closingFormData.totalIncome - closingFormData.totalExpense).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={handleClosing} disabled={addClosingMutation.isPending}>
            {addClosingMutation.isPending ? "Processing..." : "Complete Closing"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: null, type: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deleteConfirm.type} record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.type === 'income') {
                  deleteIncomeMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm.type === 'expense') {
                  deleteExpenseMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm.type === 'closing') {
                  deleteClosingMutation.mutate(deleteConfirm.id);
                }
                setDeleteConfirm({ open: false, id: null, type: '' });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Closing Dialog */}
      {editClosingData && (
        <Dialog open={!!editClosingData} onOpenChange={(open) => !open && setEditClosingData(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Closing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Total Income</Label>
                <Input
                  type="number"
                  readOnly
                  className="bg-muted"
                  value={editClosingData.totalIncome}
                  onChange={e => { }}
                />
              </div>
              <div>
                <Label>Total Expense</Label>
                <Input
                  type="number"
                  readOnly
                  className="bg-muted"
                  value={editClosingData.totalExpense}
                  onChange={e => { }}
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={editClosingData.remarks}
                  onChange={e => setEditClosingData({ ...editClosingData, remarks: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={() => {
              updateClosingMutation.mutate({
                id: editClosingData.id,
                data: {
                  totalIncome: editClosingData.totalIncome,
                  totalExpense: editClosingData.totalExpense,
                  netBalance: editClosingData.totalIncome - editClosingData.totalExpense,
                  remarks: editClosingData.remarks
                }
              });
            }} disabled={updateClosingMutation.isPending}>
              {updateClosingMutation.isPending ? "Updating..." : "Update Closing"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  </DashboardLayout>;
};

export default Finance;

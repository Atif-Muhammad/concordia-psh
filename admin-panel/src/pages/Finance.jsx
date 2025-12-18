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
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";
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
  deleteFinanceClosing
} from "../../config/apis";

const Finance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);

  // Separate filters for income and expense - using month picker
  const [incomeFilterCategory, setIncomeFilterCategory] = useState("all");
  const [incomeFilterMonth, setIncomeFilterMonth] = useState("");

  const [expenseFilterCategory, setExpenseFilterCategory] = useState("all");
  const [expenseFilterMonth, setExpenseFilterMonth] = useState("");

  // Dashboard filter for period
  const [dashboardPeriod, setDashboardPeriod] = useState("monthly"); // weekly, monthly, yearly

  const [incomeFormData, setIncomeFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Donation",
    description: "",
    amount: 0
  });

  const [expenseFormData, setExpenseFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Utility Bills",
    description: "",
    amount: 0
  });

  const [closingType, setClosingType] = useState("daily");

  // Closing form data
  const [closingFormData, setClosingFormData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    remarks: ""
  });

  // Confirmation dialog states
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, type: '' });

  // Edit closing state
  const [editClosingData, setEditClosingData] = useState(null);

  // Closing filter
  const [closingFilterMonth, setClosingFilterMonth] = useState("");

  // Reports filter - month string or empty for overall
  const [reportsFilterMonth, setReportsFilterMonth] = useState(""); // Empty = overall, or month string like "2024-12"


  // Helper to convert month to date range
  const getMonthDateRange = (month) => {
    if (!month) return { dateFrom: '', dateTo: '' };
    const [year, monthNum] = month.split('-');
    const firstDay = `${year}-${monthNum}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const lastDayStr = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;
    return { dateFrom: firstDay, dateTo: lastDayStr };
  };

  // Helper to get date range based on dashboard period
  const getDashboardDateRange = () => {
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
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0]
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

  // Queries for tabs (only fetch when month selected)
  const incomeMonthRange = getMonthDateRange(incomeFilterMonth);
  const { data: incomeData = [], isLoading: incomeLoading } = useQuery({
    queryKey: ['financeIncome', incomeMonthRange.dateFrom, incomeMonthRange.dateTo, incomeFilterCategory],
    queryFn: () => getFinanceIncomes({ dateFrom: incomeMonthRange.dateFrom, dateTo: incomeMonthRange.dateTo, category: incomeFilterCategory }),
    enabled: !!incomeFilterMonth // Only fetch when a month is selected
  });

  const expenseMonthRange = getMonthDateRange(expenseFilterMonth);
  const { data: expenseData = [], isLoading: expenseLoading } = useQuery({
    queryKey: ['financeExpense', expenseMonthRange.dateFrom, expenseMonthRange.dateTo, expenseFilterCategory],
    queryFn: () => getFinanceExpenses({ dateFrom: expenseMonthRange.dateFrom, dateTo: expenseMonthRange.dateTo, category: expenseFilterCategory }),
    enabled: !!expenseFilterMonth // Only fetch when a month is selected
  });

  const { data: closingData = [], isLoading: closingLoading } = useQuery({
    queryKey: ['financeClosing', closingFilterMonth],
    queryFn: () => {
      if (!closingFilterMonth) return [];
      const range = getMonthDateRange(closingFilterMonth);
      return getFinanceClosings({ dateFrom: range.dateFrom, dateTo: range.dateTo });
    },
    enabled: !!closingFilterMonth // Only fetch when a month is selected
  });

  // Queries for Reports tab - separate data fetch
  const reportsMonthRange = reportsFilterMonth ? getMonthDateRange(reportsFilterMonth) : {};
  const { data: reportsIncomeData = [] } = useQuery({
    queryKey: ['reportsIncome', reportsFilterMonth],
    queryFn: () => {
      if (!reportsFilterMonth) {
        return getFinanceIncomes({}); // No date filter = all time
      }
      return getFinanceIncomes({ dateFrom: reportsMonthRange.dateFrom, dateTo: reportsMonthRange.dateTo });
    }
  });

  const { data: reportsExpenseData = [] } = useQuery({
    queryKey: ['reportsExpense', reportsFilterMonth],
    queryFn: () => {
      if (!reportsFilterMonth) {
        return getFinanceExpenses({}); // No date filter = all time
      }
      return getFinanceExpenses({ dateFrom: reportsMonthRange.dateFrom, dateTo: reportsMonthRange.dateTo });
    }
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
        category: "Utility Bills",
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
    const closingData = {
      date: new Date().toISOString().split("T")[0],
      type: closingType,
      totalIncome: closingFormData.totalIncome,
      totalExpense: closingFormData.totalExpense,
      netBalance: closingFormData.totalIncome - closingFormData.totalExpense,
      remarks: closingFormData.remarks
    };
    addClosingMutation.mutate(closingData);
  };

  // Calculate amounts based on closing type
  const getClosingAmounts = async () => {
    const now = new Date();
    let dateFrom, dateTo;

    if (closingType === 'daily') {
      // Today
      dateFrom = dateTo = now.toISOString().split('T')[0];
    } else if (closingType === 'monthly') {
      // Current month
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else { // quarterly
      // Current quarter
      const quarter = Math.floor(now.getMonth() / 3);
      dateFrom = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
    }

    try {
      const [incomes, expenses] = await Promise.all([
        getFinanceIncomes({ dateFrom, dateTo }),
        getFinanceExpenses({ dateFrom, dateTo })
      ]);

      const income = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
      const expense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

      setClosingFormData({
        totalIncome: income,
        totalExpense: expense,
        remarks: `${closingType.charAt(0).toUpperCase() + closingType.slice(1)} closing for ${dateFrom}${dateFrom !== dateTo ? ` to ${dateTo}` : ''}`
      });
    } catch (error) {
      console.error('Error calculating closing amounts:', error);
    }
  };

  // Auto-calculate when closing type changes or dialog opens
  React.useEffect(() => {
    if (closingOpen) {
      getClosingAmounts();
    }
  }, [closingType, closingOpen]);

  // Chart data - dynamic based on selected period
  const monthlyData = useMemo(() => {
    if (dashboardPeriod === 'weekly') {
      // Last 7 days
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

        const dayIncome = dashboardIncomeData
          .filter(item => item.date.toString().split('T')[0] === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const dayExpense = dashboardExpenseData
          .filter(item => item.date.toString().split('T')[0] === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        days.push({
          month: dayLabel, // Reusing 'month' key for consistency
          income: dayIncome,
          expense: dayExpense,
          balance: dayIncome - dayExpense
        });
      }
      return days;

      return days;

    } else if (dashboardPeriod === 'overall') {
      // Last 5 years
      const years = [];
      const currentYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearIncome = dashboardIncomeData
          .filter(item => item.date.startsWith(`${year}-`))
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const yearExpense = dashboardExpenseData
          .filter(item => item.date.startsWith(`${year}-`))
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
      // Daily breakdown for current month
      const days = [];
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayLabel = String(i);

        const dayIncome = dashboardIncomeData
          .filter(item => item.date.toString().split('T')[0] === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);
        const dayExpense = dashboardExpenseData
          .filter(item => item.date.toString().split('T')[0] === dateStr)
          .reduce((sum, item) => sum + Number(item.amount), 0);

        days.push({
          month: dayLabel,
          income: dayIncome,
          expense: dayExpense,
          balance: dayIncome - dayExpense
        });
      }
      return days;

    } else {
      // Yearly (12 months of current year)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = new Date().getFullYear();
      return months.map((month, index) => {
        const monthNum = (index + 1).toString().padStart(2, "0");
        const monthIncome = dashboardIncomeData
          .filter(i => i.date.startsWith(`${currentYear}-${monthNum}`))
          .reduce((sum, i) => sum + Number(i.amount), 0);
        const monthExpense = dashboardExpenseData
          .filter(e => e.date.startsWith(`${currentYear}-${monthNum}`))
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          month,
          income: monthIncome,
          expense: monthExpense,
          balance: monthIncome - monthExpense
        };
      });
    }
  }, [dashboardIncomeData, dashboardExpenseData, dashboardPeriod]);


  // Stacked Chart Data - Aggregates by Date AND Category
  const stackedChartData = useMemo(() => {
    const getDateKey = (date, period) => {
      const d = new Date(date);
      if (period === 'weekly' || period === 'monthly') return d.toISOString().split('T')[0];
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

    if (dashboardPeriod === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        periods.push(getDateKey(d, 'weekly'));
      }
    } else if (dashboardPeriod === 'monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        periods.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
    } else if (dashboardPeriod === 'yearly') {
      for (let i = 0; i < 12; i++) {
        periods.push(`${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`);
      }
    } else { // overall
      const currentYear = now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        periods.push((currentYear - i).toString());
      }
    }

    // Initialize data structure
    const data = periods.map(p => ({
      name: getLabel(p, dashboardPeriod),
      // Incomes
      Fee: 0, Donation: 0, Funding: 0, Revenue: 0, Investments: 0,
      // Expenses
      Inventory: 0, 'Utility Bills': 0, Salaries: 0, Hostel: 0, Maintenance: 0, Supplies: 0, Other: 0
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
            itemKey = item.date.toString().split('T')[0];
          } else if (dashboardPeriod === 'yearly') {
            itemKey = item.date.toString().slice(0, 7); // YYYY-MM
          } else {
            itemKey = item.date.toString().slice(0, 4); // YYYY
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
  }, [dashboardIncomeData, dashboardExpenseData, dashboardPeriod]);

  const incomeColors = {
    Fee: "hsl(var(--primary))",
    Donation: "#10b981", // emerald-500
    Funding: "#3b82f6", // blue-500
    Revenue: "#f59e0b", // amber-500
    Investments: "#8b5cf6" // violet-500
  };

  const expenseColors = {
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
    { name: "Fee", amount: reportsIncomeData.filter(i => i.category === "Fee").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Donation", amount: reportsIncomeData.filter(i => i.category === "Donation").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Funding", amount: reportsIncomeData.filter(i => i.category === "Funding").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Revenue", amount: reportsIncomeData.filter(i => i.category === "Revenue").reduce((sum, i) => sum + Number(i.amount), 0) },
    { name: "Investments", amount: reportsIncomeData.filter(i => i.category === "Investments").reduce((sum, i) => sum + Number(i.amount), 0) }
  ];

  const reportsCategoryExpenseData = [
    { name: "Inventory", amount: reportsExpenseData.filter(e => e.category === "Inventory").reduce((sum, e) => sum + Number(e.amount), 0) },
    { name: "Utility Bills", amount: reportsExpenseData.filter(e => e.category === "Utility Bills").reduce((sum, e) => sum + Number(e.amount), 0) },
    { name: "Salaries", amount: reportsExpenseData.filter(e => e.category === "Salaries").reduce((sum, e) => sum + Number(e.amount), 0) },
    { name: "Maintenance", amount: reportsExpenseData.filter(e => e.category === "Maintenance").reduce((sum, e) => sum + Number(e.amount), 0) },
    { name: "Supplies", amount: reportsExpenseData.filter(e => e.category === "Supplies").reduce((sum, e) => sum + Number(e.amount), 0) },
    { name: "Other", amount: reportsExpenseData.filter(e => e.category === "Other").reduce((sum, e) => sum + Number(e.amount), 0) }
  ];

  return <DashboardLayout>
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Finance Management</h2>
            <p className="text-primary-foreground/90">
              Track income, expenses, and financial reports
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <Select value={dashboardPeriod} onValueChange={setDashboardPeriod}>
              <SelectTrigger className="w-[140px] bg-white text-primary border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="overall">Overall</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
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
                    <YAxis />
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
                    <YAxis />
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
                    <YAxis />
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={incomeFilterMonth}
                    onChange={e => setIncomeFilterMonth(e.target.value)}
                    placeholder="Select month"
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
                      <SelectItem value="Fee">Fee</SelectItem>
                      <SelectItem value="Donation">Donation</SelectItem>
                      <SelectItem value="Funding">Funding</SelectItem>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                      <SelectItem value="Investments">Investments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncomeFilterMonth("");
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
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
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
                          No income records found. Select a month to view data.
                        </TableCell>
                      </TableRow>
                    ) : (
                      incomeData.map(item => <TableRow key={item.id}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="default">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="font-bold text-success">PKR {Number(item.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm({ open: true, id: item.id, type: 'income' })}
                            disabled={item.source === 'fee-challan-aggregated'}
                            title={item.source === 'fee-challan-aggregated' ? 'Cannot delete aggregated fee records' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={expenseFilterMonth}
                    onChange={e => setExpenseFilterMonth(e.target.value)}
                    placeholder="Select month"
                  />
                </div>
                <div className="flex-1">
                  <Label>Category</Label>
                  <Select value={expenseFilterCategory} onValueChange={setExpenseFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Inventory">Inventory</SelectItem>
                      <SelectItem value="Utility Bills">Utility Bills</SelectItem>
                      <SelectItem value="Salaries">Salaries</SelectItem>
                      <SelectItem value="Hostel">Hostel</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExpenseFilterMonth("");
                      setExpenseFilterCategory("all");
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
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Loading expense data...
                      </TableCell>
                    </TableRow>
                  ) : expenseData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No expense records found. Select a month to view data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseData.map(item => <TableRow key={item.id}>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="font-bold text-destructive">PKR {Number(item.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteConfirm({ open: true, id: item.id, type: 'expense' })}
                          disabled={item.source === 'inventory-aggregated'}
                          title={item.source === 'inventory-aggregated' ? 'Cannot delete aggregated expense records' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                <div className="flex gap-2 items-center">
                  <Label className="whitespace-nowrap">Month</Label>
                  <Input
                    type="month"
                    value={reportsFilterMonth}
                    onChange={(e) => setReportsFilterMonth(e.target.value)}
                    className="w-[200px]"
                    placeholder="Select month (leave empty for overall)"
                  />
                  {reportsFilterMonth && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportsFilterMonth("")}
                    >
                      Clear
                    </Button>
                  )}
                  <Badge variant="secondary" className="ml-2">
                    {reportsFilterMonth ? `Month: ${reportsFilterMonth}` : "Overall (All Time)"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex justify-between items-center">
                <CardTitle>Financial Closing</CardTitle>
                <div className="flex gap-2">
                  <div className="flex gap-2 items-center">
                    <Label className="whitespace-nowrap">Month</Label>
                    <Input
                      type="month"
                      value={closingFilterMonth}
                      onChange={(e) => setClosingFilterMonth(e.target.value)}
                      className="w-[180px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClosingFilterMonth("")}
                    >
                      Clear
                    </Button>
                  </div>
                  <Button onClick={() => setClosingOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    New Closing
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
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
                        No closing records found. Select a month to view data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    closingData.map(closing => <TableRow key={closing.id}>
                      <TableCell>{new Date(closing.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge>{closing.type}</Badge>
                      </TableCell>
                      <TableCell className="text-success">PKR {Number(closing.totalIncome).toLocaleString()}</TableCell>
                      <TableCell className="text-destructive">PKR {Number(closing.totalExpense).toLocaleString()}</TableCell>
                      <TableCell className={Number(closing.netBalance) >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                        PKR {Number(closing.netBalance).toLocaleString()}
                      </TableCell>
                      <TableCell>{closing.remarks}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditClosingData(closing)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm({ open: true, id: closing.id, type: 'closing' })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              <Select value={expenseFormData.category} onValueChange={value => setExpenseFormData({ ...expenseFormData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Utility Bills">Utility Bills</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Supplies">Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
              <Label>Closing Type</Label>
              <Select value={closingType} onValueChange={value => setClosingType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Income</Label>
              <Input
                type="number"
                value={closingFormData.totalIncome}
                onChange={e => setClosingFormData({ ...closingFormData, totalIncome: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Total Expense</Label>
              <Input
                type="number"
                value={closingFormData.totalExpense}
                onChange={e => setClosingFormData({ ...closingFormData, totalExpense: parseFloat(e.target.value) || 0 })}
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
              <div className="flex justify-between">
                <span>Total Income:</span>
                <span className="font-bold text-success">PKR {closingFormData.totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expense:</span>
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
                  value={editClosingData.totalIncome}
                  onChange={e => setEditClosingData({ ...editClosingData, totalIncome: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Total Expense</Label>
                <Input
                  type="number"
                  value={editClosingData.totalExpense}
                  onChange={e => setEditClosingData({ ...editClosingData, totalExpense: parseFloat(e.target.value) || 0 })}
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
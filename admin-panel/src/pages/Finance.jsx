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
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
const Finance = () => {
  const {
    financeIncome,
    addFinanceIncome,
    updateFinanceIncome,
    deleteFinanceIncome,
    financeExpenses,
    addFinanceExpense,
    updateFinanceExpense,
    deleteFinanceExpense,
    financeClosings,
    addFinanceClosing
  } = useData();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
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

  // Filtered data
  const filteredIncome = financeIncome.filter(item => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesDateFrom = !filterDateFrom || item.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || item.date <= filterDateTo;
    return matchesCategory && matchesDateFrom && matchesDateTo;
  });
  const filteredExpense = financeExpenses.filter(item => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesDateFrom = !filterDateFrom || item.date >= filterDateFrom;
    const matchesDateTo = !filterDateTo || item.date <= filterDateTo;
    return matchesCategory && matchesDateFrom && matchesDateTo;
  });

  // Calculate totals
  const totalIncome = useMemo(() => filteredIncome.reduce((sum, item) => sum + item.amount, 0), [filteredIncome]);
  const totalExpense = useMemo(() => filteredExpense.reduce((sum, item) => sum + item.amount, 0), [filteredExpense]);
  const netBalance = totalIncome - totalExpense;
  const handleAddIncome = () => {
    if (!incomeFormData.description || !incomeFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    addFinanceIncome(incomeFormData);
    toast({
      title: "Income added successfully"
    });
    setIncomeOpen(false);
    setIncomeFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Donation",
      description: "",
      amount: 0
    });
  };
  const handleAddExpense = () => {
    if (!expenseFormData.description || !expenseFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    addFinanceExpense(expenseFormData);
    toast({
      title: "Expense added successfully"
    });
    setExpenseOpen(false);
    setExpenseFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Utility Bills",
      description: "",
      amount: 0
    });
  };
  const handleClosing = () => {
    const closingData = {
      date: new Date().toISOString().split("T")[0],
      type: closingType,
      totalIncome,
      totalExpense,
      netBalance,
      remarks: `${closingType} closing for ${new Date().toISOString().split("T")[0]}`
    };
    addFinanceClosing(closingData);
    toast({
      title: `${closingType} closing completed`
    });
    setClosingOpen(false);
  };

  // Chart data
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const monthNum = (index + 1).toString().padStart(2, "0");
      const monthIncome = financeIncome.filter(i => i.date.startsWith(`${currentYear}-${monthNum}`)).reduce((sum, i) => sum + i.amount, 0);
      const monthExpense = financeExpenses.filter(e => e.date.startsWith(`${currentYear}-${monthNum}`)).reduce((sum, e) => sum + e.amount, 0);
      return {
        month,
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      };
    });
  }, [financeIncome, financeExpenses]);
  const categoryIncomeData = [{
    name: "Donation",
    amount: financeIncome.filter(i => i.category === "Donation").reduce((sum, i) => sum + i.amount, 0)
  }, {
    name: "Funding",
    amount: financeIncome.filter(i => i.category === "Funding").reduce((sum, i) => sum + i.amount, 0)
  }, {
    name: "Revenue",
    amount: financeIncome.filter(i => i.category === "Revenue").reduce((sum, i) => sum + i.amount, 0)
  }, {
    name: "Investments",
    amount: financeIncome.filter(i => i.category === "Investments").reduce((sum, i) => sum + i.amount, 0)
  }];
  const categoryExpenseData = [{
    name: "Utility Bills",
    amount: financeExpenses.filter(e => e.category === "Utility Bills").reduce((sum, e) => sum + e.amount, 0)
  }, {
    name: "Salaries",
    amount: financeExpenses.filter(e => e.category === "Salaries").reduce((sum, e) => sum + e.amount, 0)
  }, {
    name: "Maintenance",
    amount: financeExpenses.filter(e => e.category === "Maintenance").reduce((sum, e) => sum + e.amount, 0)
  }, {
    name: "Supplies",
    amount: financeExpenses.filter(e => e.category === "Supplies").reduce((sum, e) => sum + e.amount, 0)
  }, {
    name: "Other",
    amount: financeExpenses.filter(e => e.category === "Other").reduce((sum, e) => sum + e.amount, 0)
  }];
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Finance Management</h2>
          <p className="text-primary-foreground/90">
            Track income, expenses, and financial reports
          </p>
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
                  <CardTitle>Monthly Balance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="balance" fill="hsl(var(--primary))" name="Balance" />
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
                    <BarChart data={categoryIncomeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="amount" fill="hsl(var(--success))" />
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
                    <BarChart data={categoryExpenseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="amount" fill="hsl(var(--destructive))" />
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
                    <Label>From Date</Label>
                    <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Donation">Donation</SelectItem>
                        <SelectItem value="Funding">Funding</SelectItem>
                        <SelectItem value="Revenue">Revenue</SelectItem>
                        <SelectItem value="Investments">Investments</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {filteredIncome.map(item => <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Badge variant="default">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="font-bold text-success">PKR {item.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => {
                          deleteFinanceIncome(item.id);
                          toast({
                            title: "Income record deleted"
                          });
                        }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>)}
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
                    <Label>From Date</Label>
                    <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>To Date</Label>
                    <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <Label>Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Utility Bills">Utility Bills</SelectItem>
                        <SelectItem value="Salaries">Salaries</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {filteredExpense.map(item => <TableRow key={item.id}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="font-bold text-destructive">PKR {item.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => {
                        deleteFinanceExpense(item.id);
                        toast({
                          title: "Expense record deleted"
                        });
                      }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">Income Summary</h3>
                    <div className="space-y-2">
                      {categoryIncomeData.map(cat => <div key={cat.name} className="flex justify-between">
                          <span>{cat.name}:</span>
                          <span className="font-bold">PKR {cat.amount.toLocaleString()}</span>
                        </div>)}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Income:</span>
                          <span className="text-success">PKR {totalIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">Expense Summary</h3>
                    <div className="space-y-2">
                      {categoryExpenseData.map(cat => <div key={cat.name} className="flex justify-between">
                          <span>{cat.name}:</span>
                          <span className="font-bold">PKR {cat.amount.toLocaleString()}</span>
                        </div>)}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Expense:</span>
                          <span className="text-destructive">PKR {totalExpense.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6 bg-muted">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-xl">Net Balance</h3>
                    <span className={`font-bold text-2xl ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
                      PKR {netBalance.toLocaleString()}
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
                  <Button onClick={() => setClosingOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    New Closing
                  </Button>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financeClosings.map(closing => <TableRow key={closing.id}>
                        <TableCell>{closing.date}</TableCell>
                        <TableCell>
                          <Badge>{closing.type}</Badge>
                        </TableCell>
                        <TableCell className="text-success">PKR {closing.totalIncome.toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">PKR {closing.totalExpense.toLocaleString()}</TableCell>
                        <TableCell className={closing.netBalance >= 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                          PKR {closing.netBalance.toLocaleString()}
                        </TableCell>
                        <TableCell>{closing.remarks}</TableCell>
                      </TableRow>)}
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
                <Input type="date" value={incomeFormData.date} onChange={e => setIncomeFormData({
                ...incomeFormData,
                date: e.target.value
              })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={incomeFormData.category} onValueChange={value => setIncomeFormData({
                ...incomeFormData,
                category: value
              })}>
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
                <Textarea value={incomeFormData.description} onChange={e => setIncomeFormData({
                ...incomeFormData,
                description: e.target.value
              })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={incomeFormData.amount} onChange={e => setIncomeFormData({
                ...incomeFormData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
            </div>
            <Button onClick={handleAddIncome}>Add Income</Button>
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
                <Input type="date" value={expenseFormData.date} onChange={e => setExpenseFormData({
                ...expenseFormData,
                date: e.target.value
              })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={expenseFormData.category} onValueChange={value => setExpenseFormData({
                ...expenseFormData,
                category: value
              })}>
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
                <Textarea value={expenseFormData.description} onChange={e => setExpenseFormData({
                ...expenseFormData,
                description: e.target.value
              })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={expenseFormData.amount} onChange={e => setExpenseFormData({
                ...expenseFormData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
            </div>
            <Button onClick={handleAddExpense}>Add Expense</Button>
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
              <div className="border rounded-lg p-4 space-y-2 bg-muted">
                <div className="flex justify-between">
                  <span>Total Income:</span>
                  <span className="font-bold text-success">PKR {totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expense:</span>
                  <span className="font-bold text-destructive">PKR {totalExpense.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold">Net Balance:</span>
                  <span className={`font-bold text-lg ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
                    PKR {netBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={handleClosing}>Complete Closing</Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Finance;
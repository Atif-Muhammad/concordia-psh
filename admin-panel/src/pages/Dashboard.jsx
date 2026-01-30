import DashboardLayout from "@/components/DashboardLayout";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../config/apis";
import { cn } from "@/lib/utils";
import { Users, DollarSign, TrendingUp, ClipboardCheck, UserPlus, FileText, BookOpen, GraduationCap, Building, Package, Briefcase, Loader2 } from "lucide-react";

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = React.useState("overall");
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear().toString());

  const queryFilters = {
    year: selectedYear,
    ...(selectedMonth !== "overall" && { month: selectedMonth })
  };

  // Fetch dashboard statistics from backend
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', selectedMonth, selectedYear],
    queryFn: () => getDashboardStats(queryFilters),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg text-destructive">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract data from API response
  const {
    students,
    fees,
    attendance,
    inventory,
    hostel,
    staff,
    exams,
    finance,
    charts,
  } = dashboardData;

  // Calculate stats from API data
  const totalStudents = students.total;
  const activeStudents = students.active;
  const totalFeeAmount = fees.totalAmount;
  const paidFees = fees.paidAmount;
  const pendingFees = fees.pendingAmount;
  const collectionRate = fees.collectionRate > 100 ? 100 : fees.collectionRate;
  const presentToday = attendance.today.present;
  const attendanceRate = attendance.today.rate;
  const totalInventoryValue = inventory.totalValue;
  const totalRooms = hostel.totalRooms;
  const occupiedRooms = hostel.occupiedRooms;
  const pendingInquiries = 0; // Not tracked in current API

  // Program distribution
  const intermediateCount = students.byProgram.intermediate;
  const diplomaCount = students.byProgram.diploma;
  const bsCount = students.byProgram.bs;
  const shortCourseCount = students.byProgram.shortCourse;
  const coachingCount = students.byProgram.coaching;

  const stats = [{
    title: "Total Students",
    value: totalStudents.toString(),
    change: `${activeStudents} active`,
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  }, {
    title: `Fee Collection (${selectedMonth === 'overall' ? 'Collected' : 'Received against Billing'})`,
    value: `PKR ${(paidFees / 1000).toFixed(0)}K`,
    change: selectedMonth === 'overall' ? `Total for ${selectedYear}` : `Month to date (${selectedMonth})`,
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  }, {
    title: `Attendance (${selectedMonth === 'overall' ? selectedYear : selectedMonth})`,
    value: `${attendanceRate}%`,
    change: `${presentToday} records`,
    icon: ClipboardCheck,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/20",
  }, {
    title: "Finance Balance",
    value: `PKR ${(finance.netBalance / 1000).toFixed(0)}K`,
    change: selectedMonth === 'overall' ? `Net profit (${selectedYear})` : `Net profit (${selectedMonth})`,
    icon: UserPlus,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/20",
  }];

  const recentActivity = [{
    action: "Dashboard loaded",
    student: `${totalStudents} total students`,
    time: "Just now",
    type: "system"
  }, {
    action: "Fee collection",
    student: `PKR ${(paidFees / 1000).toFixed(0)}K collected against billing`,
    time: selectedMonth === 'overall' ? selectedYear : selectedMonth,
    type: "fee"
  }, {
    action: "Attendance Summary",
    student: `${presentToday} presence records in ${selectedMonth === 'overall' ? 'the selected year' : 'this month'}`,
    time: selectedMonth === 'overall' ? selectedYear : selectedMonth,
    type: "attendance"
  }, {
    action: "Finance update",
    student: `Total cash received: PKR ${(finance.monthlyIncome / 1000).toFixed(0)}K`,
    time: selectedMonth === 'overall' ? selectedYear : selectedMonth,
    type: "finance"
  }, {
    action: "System metrics",
    student: `${staff.total} staff members`,
    time: "Current",
    type: "staff"
  }];

  const quickStats = [{
    label: "Intermediate",
    value: intermediateCount?.toString() || "0",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }, {
    label: "Diploma",
    value: diplomaCount.toString(),
    icon: GraduationCap,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }, {
    label: "BS Programs",
    value: bsCount.toString(),
    icon: FileText,
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  }, {
    label: "Short Courses",
    value: shortCourseCount?.toString() || "0",
    icon: Users,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }];

  // Chart data
  const studentDistribution = [{
    name: "Intermediate",
    value: intermediateCount || 0,
    fill: "hsl(var(--primary))"
  }, {
    name: "Diploma",
    value: diplomaCount || 0,
    fill: "hsl(var(--secondary))"
  }, {
    name: "BS",
    value: bsCount || 0,
    fill: "hsl(var(--accent))"
  }, {
    name: "Short Course",
    value: shortCourseCount || 0,
    fill: "hsl(var(--warning))"
  }, {
    name: "Coaching",
    value: coachingCount || 0,
    fill: "hsl(var(--destructive))"
  }];

  const monthlyFeeCollection = charts?.monthlyFeeCollection || [];

  const attendanceTrend = charts?.weeklyAttendance || [];

  // Module state data
  const studentStatusData = [{
    name: "Active",
    value: students.byStatus.active,
    fill: "hsl(var(--success))"
  }, {
    name: "Expelled",
    value: students.byStatus.expelled,
    fill: "hsl(var(--destructive))"
  }, {
    name: "Passed Out",
    value: students.byStatus.passedOut,
    fill: "hsl(var(--primary))"
  }];

  const feeStatusData = [{
    name: "Paid",
    value: fees.byStatus.paid,
    fill: "hsl(var(--success))"
  }, {
    name: "Pending",
    value: fees.byStatus.pending,
    fill: "hsl(var(--warning))"
  }, {
    name: "Overdue",
    value: fees.byStatus.overdue,
    fill: "hsl(var(--destructive))"
  }];

  const attendanceStatusData = [{
    name: "Present",
    value: attendance.byStatus.present,
    fill: "hsl(var(--success))"
  }, {
    name: "Absent",
    value: attendance.byStatus.absent,
    fill: "hsl(var(--destructive))"
  }, {
    name: "Leave",
    value: attendance.byStatus.leave,
    fill: "hsl(var(--warning))"
  }];

  const chartConfig = {
    collected: {
      label: "Collected",
      color: "hsl(var(--success))"
    },
    pending: {
      label: "Pending",
      color: "hsl(var(--warning))"
    },
    rate: {
      label: "Attendance %",
      color: "hsl(var(--primary))"
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/90 to-primary/70 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Welcome to Concordia College</h2>
            <p className="text-white/90 text-lg">
              Management Dashboard - Track and manage all college operations
            </p>
          </div>

          <div className="relative z-10 flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-white/10 text-white border-white/20">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => {
                  const year = (new Date().getFullYear() - i).toString();
                  return <SelectItem key={year} value={year}>{year}</SelectItem>
                })}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px] bg-white/10 text-white border-white/20">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall</SelectItem>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title}>
                <Card className={cn("shadow-sm hover:shadow-md transition-all duration-300 border-l-4", stat.borderColor)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{stat.change}</p>
                      </div>
                      <div className={cn("p-3 rounded-xl", stat.bgColor, stat.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label}>
                <Card className="shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm border-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", stat.bg)}>
                        <Icon className={cn("w-5 h-5", stat.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Distribution Pie Chart */}
          <div className="h-full">
            <Card className="shadow-sm hover:shadow-md transition-all h-full">
              <CardHeader>
                <CardTitle>Student Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-[250px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={studentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {studentDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fee Collection Bar Chart */}
          <div className="lg:col-span-2 h-full">
            <Card className="shadow-sm hover:shadow-md transition-all h-full">
              <CardHeader>
                <CardTitle>Fee Collection Trend ({selectedMonth === 'overall' ? selectedYear : `${selectedMonth} ${selectedYear}`})</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="w-full h-[250px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyFeeCollection} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} cursor={{ fill: 'transparent' }} />
                        <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                        <Bar dataKey="collected" fill="hsl(var(--success))" name="Collected" radius={[6, 6, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pending" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attendance Trend Line Chart */}
        <div>
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Attendance Trend ({selectedMonth === 'overall' ? selectedYear : `${selectedMonth} ${selectedYear}`})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full h-[300px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis domain={[80, 100]} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="hsl(var(--primary))"
                        strokeWidth={4}
                        dot={{ fill: "hsl(var(--primary))", r: 6, strokeWidth: 2, stroke: "white" }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        name="Attendance %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module State Charts */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Module Status Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Status */}
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Student Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full h-[180px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={studentStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                          {studentStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="bottom" height={24} iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fee Status */}
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  Fee Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full h-[180px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                          {feeStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="bottom" height={24} iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                  <ClipboardCheck className="w-4 h-4" />
                  {selectedMonth === 'overall' ? `Attendance (${selectedYear})` : `Attendance (${selectedMonth})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full h-[180px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attendanceStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                          {attendanceStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend verticalAlign="bottom" height={24} iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Metrics Summary (Grid Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shadow-[0_0_8px_hsl(var(--primary))]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.student}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">{activity.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-success/10 to-transparent border border-success/10 hover:scale-102 transition-transform duration-200">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cash Received</p>
                    <p className="text-2xl font-bold text-success">PKR {(finance.monthlyIncome / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-3 bg-success/20 rounded-full">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-warning/10 to-transparent border border-warning/10 hover:scale-102 transition-transform duration-200">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectedMonth === 'overall' ? 'Total Receivable (All Time)' : `Pending for ${selectedMonth}`}
                    </p>
                    <p className="text-2xl font-bold text-warning">
                      PKR {((selectedMonth === 'overall' ? finance.totalReceivable : finance.periodPendingFees) / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="p-3 bg-warning/20 rounded-full">
                    <DollarSign className="w-6 h-6 text-warning" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/10 hover:scale-102 transition-transform duration-200">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-accent">PKR {(finance.monthlyExpense / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-3 bg-accent/20 rounded-full">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../config/apis";
import { cn } from "@/lib/utils";
import { Users, DollarSign, TrendingUp, ClipboardCheck, UserPlus, FileText, BookOpen, GraduationCap, Building, Package, Briefcase, Loader2 } from "lucide-react";

const Dashboard = () => {
  // Fetch dashboard statistics from backend
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // Refetch every minute
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
  } = dashboardData;

  // Calculate stats from API data
  const totalStudents = students.total;
  const activeStudents = students.active;
  const totalFeeAmount = fees.totalAmount;
  const paidFees = fees.paidAmount;
  const pendingFees = fees.pendingAmount;
  const collectionRate = fees.collectionRate;
  const presentToday = attendance.today.present;
  const attendanceRate = attendance.today.rate;
  const totalInventoryValue = inventory.totalValue;
  const totalRooms = hostel.totalRooms;
  const occupiedRooms = hostel.occupiedRooms;
  const pendingInquiries = 0; // Not tracked in current API

  // Program distribution
  const hsscCount = students.byProgram.hssc;
  const diplomaCount = students.byProgram.diploma;
  const bsCount = students.byProgram.bs;

  const stats = [{
    title: "Total Students",
    value: totalStudents.toString(),
    change: `${activeStudents} active`,
    icon: Users,
    color: "text-primary"
  }, {
    title: "Fee Collection (Month)",
    value: `PKR ${(paidFees / 1000).toFixed(0)}K`,
    change: `${collectionRate}% collected`,
    icon: DollarSign,
    color: "text-success"
  }, {
    title: "Attendance Today",
    value: `${attendanceRate}%`,
    change: `${presentToday} present`,
    icon: ClipboardCheck,
    color: "text-secondary"
  }, {
    title: "Finance Balance",
    value: `PKR ${(finance.netBalance / 1000).toFixed(0)}K`,
    change: "This month",
    icon: UserPlus,
    color: "text-accent"
  }];
  const recentActivity = [{
    action: "Dashboard loaded",
    student: `${totalStudents} total students`,
    time: "Just now",
    type: "system"
  }, {
    action: "Fee collection",
    student: `PKR ${(paidFees / 1000).toFixed(0)}K collected`,
    time: "This month",
    type: "fee"
  }, {
    action: "Attendance marked",
    student: `${presentToday} students present`,
    time: "Today",
    type: "attendance"
  }, {
    action: "Finance update",
    student: `Balance: PKR ${(finance.netBalance / 1000).toFixed(0)}K`,
    time: "This month",
    type: "finance"
  }, {
    action: "System metrics",
    student: `${staff.total} staff members`,
    time: "Current",
    type: "staff"
  }];

  const quickStats = [{
    label: "HSSC Students",
    value: hsscCount.toString(),
    icon: BookOpen
  }, {
    label: "Diploma Students",
    value: diplomaCount.toString(),
    icon: GraduationCap
  }, {
    label: "BS Students",
    value: bsCount.toString(),
    icon: FileText
  }, {
    label: "Staff Members",
    value: staff.total.toString(),
    icon: Users
  }];

  // Chart data
  const studentDistribution = [{
    name: "HSSC",
    value: hsscCount,
    fill: "hsl(var(--primary))"
  }, {
    name: "Diploma",
    value: diplomaCount,
    fill: "hsl(var(--secondary))"
  }, {
    name: "BS",
    value: bsCount,
    fill: "hsl(var(--accent))"
  }];

  const monthlyFeeCollection = [{
    month: "Jan",
    collected: paidFees / 1000000,
    pending: pendingFees / 1000000
  }, {
    month: "Feb",
    collected: 2.5,
    pending: 0.3
  }, {
    month: "Mar",
    collected: 2.4,
    pending: 0.5
  }, {
    month: "Apr",
    collected: 2.6,
    pending: 0.4
  }, {
    month: "May",
    collected: 2.5,
    pending: 0.45
  }, {
    month: "Jun",
    collected: 2.7,
    pending: 0.3
  }];

  const attendanceTrend = [{
    day: "Mon",
    rate: 91
  }, {
    day: "Tue",
    rate: 93
  }, {
    day: "Wed",
    rate: 92
  }, {
    day: "Thu",
    rate: 94
  }, {
    day: "Fri",
    rate: parseFloat(attendanceRate.toString()) || 0
  }];

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
  return <DashboardLayout>
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
        <h2 className="text-2xl font-bold mb-2">Welcome to Concordia College</h2>
        <p className="text-primary-foreground/90">
          Management Dashboard - Track and manage all college operations
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>;
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(stat => {
          const Icon = stat.icon;
          return <Card key={stat.label} className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>;
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Distribution Pie Chart */}
        <Card className="shadow-soft">
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fee Collection Bar Chart */}
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Fee Collection (PKR Millions)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[250px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFeeCollection}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="collected" fill="hsl(var(--success))" name="Collected" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pending" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend Line Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Weekly Attendance Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="w-full h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[85, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{
                    fill: "hsl(var(--primary))",
                    r: 5
                  }} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Module State Charts */}
      <div>
        <h3 className="text-xl font-bold mb-4">Module Status Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fee Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="w-4 h-4" />
                Today's Attendance
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
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Metrics Summary */}
      <div>
        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.student}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
              </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-success/10">
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold text-success">PKR {(paidFees / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-warning/10">
                <div>
                  <p className="text-sm text-muted-foreground">Receivable</p>
                  <p className="text-2xl font-bold text-warning">PKR {(pendingFees / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-8 h-8 text-warning" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-accent">PKR 1.2M</p>
                </div>
                <FileText className="w-8 h-8 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>;
};
export default Dashboard;
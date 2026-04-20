import DashboardLayout from "@/components/DashboardLayout";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getAcademicSessions } from "../../config/apis";
import { cn } from "@/lib/utils";
import { Users, DollarSign, TrendingUp, ClipboardCheck, UserPlus, FileText, BookOpen, GraduationCap, Building, Package, Briefcase, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [selectedSessionId, setSelectedSessionId] = React.useState(null);

  // Fetch academic sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["academicSessions"],
    queryFn: getAcademicSessions,
    onSuccess: (data) => {
      // Auto-select active session on first load
      if (!selectedSessionId && data?.length > 0) {
        const active = data.find(s => s.isActive);
        setSelectedSessionId(active ? active.id.toString() : data[0].id.toString());
      }
    },
  });

  // Auto-select active session once sessions load
  React.useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const active = sessions.find(s => s.isActive);
      setSelectedSessionId(active ? active.id.toString() : sessions[0].id.toString());
    }
  }, [sessions, selectedSessionId]);

  const selectedSession = sessions.find(s => s.id.toString() === selectedSessionId);

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats', selectedSessionId],
    queryFn: () => getDashboardStats({ sessionId: selectedSessionId }),
    enabled: !!selectedSessionId,
    refetchInterval: 60000,
  });

  if (isLoading || !selectedSessionId) {
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

  const { students, fees, attendance, inventory, hostel, staff, exams, finance, charts } = dashboardData;

  const sessionLabel = selectedSessionId === 'all' ? 'All Time' : (selectedSession?.name || "—");

  const stats = [{
    title: "Total Students",
    value: students.total.toString(),
    change: `${students.active} active`,
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  }, {
    title: "Fee Collected",
    value: `PKR ${(fees.paidAmount / 1000).toFixed(0)}K`,
    change: `${sessionLabel}`,
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    breakdown: { regular: fees.regularRevenue || 0, extra: fees.extraRevenue || 0 },
  }, {
    title: "Attendance Rate",
    value: `${attendance.today.rate}%`,
    change: `${attendance.today.present} records · ${sessionLabel}`,
    icon: ClipboardCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  }, {
    title: "Finance Balance",
    value: `PKR ${(finance.netBalance / 1000).toFixed(0)}K`,
    change: `Net · ${sessionLabel}`,
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  }];

  const quickStats = [{
    label: "Intermediate",
    value: students.byProgram.intermediate?.toString() || "0",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }, {
    label: "Diploma",
    value: students.byProgram.diploma.toString(),
    icon: GraduationCap,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }, {
    label: "BS Programs",
    value: students.byProgram.bs.toString(),
    icon: FileText,
    color: "text-pink-500",
    bg: "bg-pink-500/10"
  }, {
    label: "Short Courses",
    value: students.byProgram.shortCourse?.toString() || "0",
    icon: Users,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  }];

  const studentDistribution = [
    { name: "Intermediate", value: students.byProgram.intermediate || 0, fill: "hsl(var(--primary))" },
    { name: "Diploma", value: students.byProgram.diploma || 0, fill: "hsl(var(--secondary))" },
    { name: "BS", value: students.byProgram.bs || 0, fill: "hsl(var(--accent))" },
    { name: "Short Course", value: students.byProgram.shortCourse || 0, fill: "hsl(var(--warning))" },
    { name: "Coaching", value: students.byProgram.coaching || 0, fill: "hsl(var(--destructive))" },
  ];

  const studentStatusData = [
    { name: "Active", value: students.byStatus.active, fill: "hsl(var(--success))" },
    { name: "Expelled", value: students.byStatus.expelled, fill: "hsl(var(--destructive))" },
    { name: "Passed Out", value: students.byStatus.passedOut, fill: "hsl(var(--primary))" },
  ];

  const feeStatusData = [
    { name: "Paid", value: fees.byStatus.paid, fill: "hsl(var(--success))" },
    { name: "Pending", value: fees.byStatus.pending, fill: "hsl(var(--warning))" },
    { name: "Overdue", value: fees.byStatus.overdue, fill: "hsl(var(--destructive))" },
  ];

  const attendanceStatusData = [
    { name: "Present", value: attendance.byStatus.present, fill: "hsl(var(--success))" },
    { name: "Absent", value: attendance.byStatus.absent, fill: "hsl(var(--destructive))" },
    { name: "Leave", value: attendance.byStatus.leave, fill: "hsl(var(--warning))" },
  ];

  const chartConfig = {
    collected: { label: "Collected", color: "hsl(var(--success))" },
    pending: { label: "Pending", color: "hsl(var(--warning))" },
    rate: { label: "Attendance %", color: "hsl(var(--primary))" },
  };

  const recentActivity = [
    { action: "Students", detail: `${students.total} total · ${students.active} active`, time: sessionLabel },
    { action: "Fee Collection", detail: `PKR ${(fees.paidAmount / 1000).toFixed(0)}K collected`, time: sessionLabel },
    { action: "Attendance", detail: `${attendance.today.present} presence records`, time: sessionLabel },
    { action: "Finance", detail: `Cash received: PKR ${(finance.monthlyIncome / 1000).toFixed(0)}K`, time: sessionLabel },
    { action: "Staff", detail: `${staff.total} staff members (${staff.teaching} teaching)`, time: "Current" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold">Concordia College Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening in your school.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedSessionId || ""} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.isActive && <Badge className="bg-green-500 text-white text-[10px] py-0 px-1 h-4">Active</Badge>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-sm hover:shadow-md transition-all border-l-4 border-border">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                        {stat.breakdown && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="text-xs space-y-1 p-3">
                              <p className="font-semibold mb-1">Breakdown</p>
                              <p>Regular Fee: PKR {Math.round(stat.breakdown.regular).toLocaleString()}</p>
                              <p>Extra Challans: PKR {Math.round(stat.breakdown.extra).toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold">{stat.value}</h3>
                      <p className="text-[10px] text-muted-foreground">{stat.change}</p>
                    </div>
                    <div className={cn("p-2 rounded-md", stat.bgColor, stat.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-sm hover:shadow-md transition-all bg-card/50 border-muted/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-md", stat.bg)}>
                      <Icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="shadow-sm hover:shadow-md transition-all h-full">
            <CardHeader><CardTitle>Student Distribution</CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="w-full h-[200px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={studentDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {studentDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card className="shadow-sm hover:shadow-md transition-all h-full">
              <CardHeader><CardTitle>Fee Collection Trend ({sessionLabel})</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="w-full h-[200px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts?.monthlyFeeCollection || []} barGap={8}>
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

        {/* Attendance Trend */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader><CardTitle>Attendance Trend ({sessionLabel})</CardTitle></CardHeader>
          <CardContent className="p-4">
            <div className="w-full h-[220px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.weeklyAttendance || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={4}
                      dot={{ fill: "hsl(var(--primary))", r: 6, strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 8, strokeWidth: 0 }} name="Attendance %" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Module Status */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Briefcase className="w-4 h-4 text-primary" />
            Module Status Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Student Status", icon: Users, data: studentStatusData },
              { title: "Fee Status", icon: DollarSign, data: feeStatusData },
              { title: `Attendance (${sessionLabel})`, icon: ClipboardCheck, data: attendanceStatusData },
            ].map(({ title, icon: Icon, data }) => (
              <Card key={title} className="shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                    <Icon className="w-4 h-4" />{title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full h-[180px]">
                    <ChartContainer config={chartConfig} className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend verticalAlign="bottom" height={24} iconSize={8} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.action}</p>
                      <p className="text-sm text-muted-foreground">{a.detail}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">{a.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader><CardTitle>Financial Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cash Received</p>
                    <p className="text-base font-semibold text-green-600">PKR {(finance.monthlyIncome / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded-md"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Receivable (All Time)</p>
                    <p className="text-base font-semibold text-yellow-600">PKR {(finance.totalReceivable / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-2 bg-yellow-500/20 rounded-md"><DollarSign className="w-4 h-4 text-yellow-600" /></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <p className="text-base font-semibold text-purple-600">PKR {(finance.monthlyExpense / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-2 bg-purple-500/20 rounded-md"><FileText className="w-4 h-4 text-purple-600" /></div>
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

import DashboardLayout from "@/components/DashboardLayout";
import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  getAcademicSessions,
  getDashboardStudents,
  getDashboardFees,
  getDashboardAttendance,
  getDashboardStaff,
  getDashboardFinance,
  getDashboardCharts,
} from "../../config/apis";
import { cn } from "@/lib/utils";
import { Users, DollarSign, TrendingUp, ClipboardCheck, FileText, BookOpen, GraduationCap, Briefcase, Loader2, Info, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ModernTooltip, ChartLegendPills, MODERN_CHART_COLORS } from "@/components/ui/modern-charts";

// -- Skeleton helpers ----------------------------------------------------------
const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse rounded bg-muted", className)} />
);

const CardSkeleton = ({ rows = 2 }) => (
  <Card className="shadow-sm">
    <CardContent className="pt-4 pb-3 px-4 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-1/2' : 'w-3/4'}`} />
      ))}
    </CardContent>
  </Card>
);

const ChartSkeleton = ({ height = 200 }) => (
  <div className="flex items-center justify-center bg-muted/30 rounded-lg" style={{ height }}>
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

const formatPKR = (amount = 0) => `PKR ${Math.round(Number(amount || 0)).toLocaleString()}`;
const SOFT_COLORS = ["#4f46e5", "#0ea5a4", "#f59e0b", "#3b82f6", "#a855f7"];

// -- Section components --------------------------------------------------------

const StatCard = ({ title, value, change, icon: Icon, color, bgColor, breakdown, loading, onClick }) => (
  <Card onClick={onClick} className={cn("shadow-sm hover:shadow-md transition-all border-l-4 border-border", onClick && "cursor-pointer")}>
    <CardContent className="pt-4 pb-3 px-4">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              {breakdown && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs space-y-1 p-3">
                    <p className="font-semibold mb-1">Breakdown</p>
                    <p>Regular Fee: PKR {Math.round(breakdown.regular).toLocaleString()}</p>
                    <p>Extra Challans: PKR {Math.round(breakdown.extra).toLocaleString()}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <h3 className="text-lg font-semibold">{value}</h3>
            <p className="text-[10px] text-muted-foreground">{change}</p>
          </div>
          <div className="flex items-start gap-1">
            {onClick && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />}
            <div className={cn("p-2 rounded-md", bgColor, color)}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// -- Main Dashboard ------------------------------------------------------------
const Dashboard = () => {
  const navigate = useNavigate();
  const go = (path) => navigate(path);
  const [selectedSessionId, setSelectedSessionId] = React.useState(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["academicSessions"],
    queryFn: getAcademicSessions,
  });

  React.useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const active = sessions.find(s => s.isActive);
      setSelectedSessionId(active ? active.id.toString() : sessions[0].id.toString());
    }
  }, [sessions, selectedSessionId]);

  const sid = selectedSessionId;
  const enabled = !!sid;
  const selectedSession = sessions.find(s => s.id.toString() === sid);
  const sessionLabel = sid === 'all' ? 'All Time' : (selectedSession?.name || "-");

  // -- Individual section queries ----------------------------------------------
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['dashboard-students', sid],
    queryFn: () => getDashboardStudents(sid),
    enabled,
    staleTime: 60000,
  });

  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['dashboard-fees', sid],
    queryFn: () => getDashboardFees(sid),
    enabled,
    staleTime: 60000,
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['dashboard-attendance', sid],
    queryFn: () => getDashboardAttendance(sid),
    enabled,
    staleTime: 60000,
  });

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['dashboard-staff'],
    queryFn: () => getDashboardStaff(sid),
    staleTime: 300000,
  });

  const { data: finance, isLoading: financeLoading } = useQuery({
    queryKey: ['dashboard-finance', sid],
    queryFn: () => getDashboardFinance(sid),
    enabled,
    staleTime: 60000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts', sid],
    queryFn: () => getDashboardCharts(sid),
    enabled,
    staleTime: 60000,
  });

  if (sessionsLoading || (sessions.length > 0 && !sid)) {
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

  // -- Derived display values --------------------------------------------------
  const studentDistribution = students ? [
    { name: "Intermediate", value: students.byProgram.intermediate || 0, fill: "hsl(var(--primary))" },
    { name: "Diploma",      value: students.byProgram.diploma || 0,      fill: "hsl(var(--secondary))" },
    { name: "BS",           value: students.byProgram.bs || 0,           fill: "hsl(var(--accent))" },
    { name: "Short Course", value: students.byProgram.shortCourse || 0,  fill: "hsl(var(--warning))" },
    { name: "Coaching",     value: students.byProgram.coaching || 0,     fill: "hsl(var(--destructive))" },
  ] : [];

  const studentStatusData = students ? [
    { name: "Active",      value: students.byStatus.active,     fill: "hsl(var(--success))" },
    { name: "Expelled",    value: students.byStatus.expelled,   fill: "hsl(var(--destructive))" },
    { name: "Passed Out",  value: students.byStatus.passedOut,  fill: "hsl(var(--primary))" },
  ] : [];

  const feeStatusData = fees ? [
    { name: "Paid",    value: fees.byStatus.paid,    fill: "hsl(var(--success))" },
    { name: "Pending", value: fees.byStatus.pending, fill: "hsl(var(--warning))" },
    { name: "Overdue", value: fees.byStatus.overdue, fill: "hsl(var(--destructive))" },
  ] : [];

  const feeBreakdown = {
    installment: fees?.breakdown?.installment || {
      collected: fees?.regularRevenue || 0,
      outstanding: fees?.installmentPendingAmount || fees?.pendingAmount || 0,
    },
    hostel: fees?.breakdown?.hostel || {
      collected: fees?.hostelRevenue || 0,
      outstanding: fees?.hostelPendingAmount || 0,
    },
    extraChallans: fees?.breakdown?.extraChallans || {
      collected: fees?.extraRevenue || 0,
      outstanding: fees?.extraPendingAmount || 0,
    },
  };
  const totalInflow = finance?.totalInflow ?? finance?.monthlyIncome ?? 0;
  const totalOutflow = finance?.totalOutflow ?? finance?.monthlyExpense ?? 0;
  const totalPending = finance?.totalPending ?? fees?.pendingAmount ?? finance?.totalReceivable ?? 0;
  const netBalance = finance?.netBalance ?? (totalInflow - totalOutflow);

  const attendanceStatusData = attendance ? [
    { name: "Present", value: attendance.byStatus.present, fill: "#22c55e" },
    { name: "Absent",  value: attendance.byStatus.absent,  fill: "#f97316" },
    { name: "Leave",   value: attendance.byStatus.leave,   fill: "#0ea5e9" },
  ] : [];
  const hasPieData = (arr) => Array.isArray(arr) && arr.some((x) => Number(x?.value || 0) > 0);
  const studentDistributionPie = (() => {
    const sorted = [...(studentDistribution || [])].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
    const top = sorted.slice(0, 4).map((item, idx) => ({ ...item, fill: SOFT_COLORS[idx % SOFT_COLORS.length] }));
    const othersTotal = sorted.slice(4).reduce((sum, item) => sum + Number(item.value || 0), 0);
    if (othersTotal > 0) top.push({ name: "Others", value: othersTotal, fill: "#94a3b8" });
    return top;
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold">Concordia College Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening in your institute.</p>
          </div>
          <Select value={sid || ""} onValueChange={setSelectedSessionId}>
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

        {/* -- Main Stats -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Students" icon={Users}
            onClick={() => go("/students")}
            color="text-primary" bgColor="bg-primary/10"
            loading={studentsLoading}
            value={students ? students.total.toString() : "-"}
            change={students ? `${students.active} active` : ""}
          />
          <StatCard
            title="Installment Fees" icon={DollarSign}
            onClick={() => go("/fee-management")}
            color="text-green-600" bgColor="bg-green-500/10"
            loading={feesLoading}
            value={fees ? formatPKR(feeBreakdown.installment.collected) : "---"}
            change={fees ? `Pending ${formatPKR(feeBreakdown.installment.outstanding)} - ${sessionLabel}` : ""}
          />
          <StatCard
            title="Hostel Fees" icon={Briefcase}
            onClick={() => go("/hostel")}
            color="text-blue-600" bgColor="bg-blue-500/10"
            loading={feesLoading}
            value={fees ? formatPKR(feeBreakdown.hostel.collected) : "---"}
            change={fees ? `Pending ${formatPKR(feeBreakdown.hostel.outstanding)} - ${sessionLabel}` : ""}
          />
          <StatCard
            title="Extra Challans" icon={FileText}
            onClick={() => go("/fee-management")}
            color="text-orange-600" bgColor="bg-orange-500/10"
            loading={feesLoading}
            value={fees ? formatPKR(feeBreakdown.extraChallans.collected) : "---"}
            change={fees ? `Pending ${formatPKR(feeBreakdown.extraChallans.outstanding)} - ${sessionLabel}` : ""}
          />
          <StatCard
            title="Attendance Rate" icon={ClipboardCheck}
            onClick={() => go("/attendance")}
            color="text-blue-600" bgColor="bg-blue-500/10"
            loading={attendanceLoading}
            value={attendance ? `${attendance.today.rate}%` : "-"}
            change={attendance ? `${attendance.today.present} records · ${sessionLabel}` : ""}
          />
          {/* <StatCard
            title="Finance Balance" icon={TrendingUp}
            color="text-purple-600" bgColor="bg-purple-500/10"
            loading={financeLoading}
            value={finance ? `PKR ${Math.round(finance.netBalance).toLocaleString()}` : "-"}
            change={`Net · ${sessionLabel}`}
          /> */}
        </div>

        {/* -- Quick Stats (students by program) -- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Intermediate", key: "intermediate", icon: BookOpen,      color: "text-blue-500",   bg: "bg-blue-500/10" },
            { label: "Diploma",      key: "diploma",       icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "BS Programs",  key: "bs",            icon: FileText,      color: "text-pink-500",   bg: "bg-pink-500/10" },
            { label: "Short Courses",key: "shortCourse",   icon: Users,         color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map(({ label, key, icon: Icon, color, bg }) => (
            <Card key={label} onClick={() => go("/students")} className="shadow-sm hover:shadow-md transition-all bg-card/50 border-muted/50 cursor-pointer relative">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-2 right-2" />
              <CardContent className="pt-4 pb-3 px-4">
                {studentsLoading ? (
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-8 h-8 rounded-md" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-md", bg)}>
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{students?.byProgram[key] ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* -- Charts Row -- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student Distribution */}
          <Card onClick={() => go("/students")} className="shadow-sm hover:shadow-md transition-all cursor-pointer relative">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3" />
            <CardHeader><CardTitle>Student Distribution</CardTitle></CardHeader>
            <CardContent className="p-4">
              {studentsLoading ? <ChartSkeleton height={200} /> : (
                <div className="w-full h-[240px] flex gap-2">
                  <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={studentDistributionPie} cx="50%" cy="50%" innerRadius={36} outerRadius={78} paddingAngle={2} dataKey="value">
                          {studentDistributionPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <RechartsTooltip content={<ModernTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-[130px] overflow-y-auto pr-1">
                    <div className="space-y-1.5 pt-2">
                      {studentDistributionPie.map((item, i) => (
                        <div key={`${item.name}-${i}`} className="text-[11px] flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                            <span className="truncate text-muted-foreground">{item.name}</span>
                          </span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Collection Trend */}
          <div className="lg:col-span-2">
            <Card onClick={() => go("/fee-management")} className="shadow-sm hover:shadow-md transition-all h-full cursor-pointer relative">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3" />
              <CardHeader><CardTitle>Fee Collection Trend ({sessionLabel})</CardTitle></CardHeader>
              <CardContent className="p-4">
                {chartsLoading ? <ChartSkeleton height={200} /> : (
                  <div className="w-full h-[250px]">
                    <div className="mb-2">
                      <ChartLegendPills items={[{ label: "Collected", color: MODERN_CHART_COLORS.success }, { label: "Pending", color: MODERN_CHART_COLORS.warning }]} />
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts?.monthlyFeeCollection || []} barGap={8} margin={{ top: 6, right: 8, left: 0, bottom: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} interval={0} tick={{ fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `PKR ${Number(v || 0).toLocaleString()}`} />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="collected" fill={MODERN_CHART_COLORS.success} name="Collected" radius={[8,8,0,0]} maxBarSize={42} />
                        <Bar dataKey="pending" fill={MODERN_CHART_COLORS.warning} name="Pending" radius={[8,8,0,0]} maxBarSize={42} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* -- Attendance Trend -- */}
        <Card onClick={() => go("/attendance")} className="shadow-sm hover:shadow-md transition-all cursor-pointer relative">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3" />
          <CardHeader><CardTitle>Attendance Trend ({sessionLabel})</CardTitle></CardHeader>
          <CardContent className="p-4">
            {chartsLoading ? <ChartSkeleton height={220} /> : (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts?.weeklyAttendance || []}>
                    <defs>
                      <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={MODERN_CHART_COLORS.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={MODERN_CHART_COLORS.primary} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<ModernTooltip valueFormatter={(v) => `${Number(v || 0)}%`} />} />
                    <Area type="monotone" dataKey="rate" stroke={MODERN_CHART_COLORS.primary} fill="url(#attnGrad)" strokeWidth={3} />
                    <Line type="monotone" dataKey="rate" stroke={MODERN_CHART_COLORS.primary} strokeWidth={2.5} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* -- Module Status -- */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Briefcase className="w-4 h-4 text-primary" />
            Module Status Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Student Status",              icon: Users,         data: studentStatusData,   loading: studentsLoading },
              { title: "Fee Status",                  icon: DollarSign,    data: feeStatusData,        loading: feesLoading },
              { title: `Attendance (${sessionLabel})`,icon: ClipboardCheck,data: attendanceStatusData, loading: attendanceLoading },
            ].map(({ title, icon: Icon, data, loading }) => (
              <Card
                key={title}
                onClick={() => go(title.startsWith("Student") ? "/students" : title.startsWith("Fee") ? "/fee-management" : "/attendance")}
                className="shadow-sm hover:shadow-md transition-all cursor-pointer relative"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3" />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                    <Icon className="w-4 h-4" />{title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {loading ? <ChartSkeleton height={180} /> : (
                    <div className="w-full h-[200px] flex gap-2">
                      <div className="flex-1 min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={0} outerRadius={68} paddingAngle={2} dataKey="value">
                              {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
                            </Pie>
                            <RechartsTooltip content={<ModernTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-[110px] flex flex-col gap-1 justify-center">
                        {data.map((d, i) => (
                          <div key={`${d.name}-${i}`} className="text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                            <span className="text-muted-foreground truncate">{d.name}</span>
                          </div>
                        ))}
                      </div>
                      {hasPieData(data) ? null : (
                        <div className="text-xs text-muted-foreground">No data</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* -- Bottom Row -- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Summary */}
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "Students",       detail: studentsLoading   ? null : `${students?.total ?? 0} total · ${students?.active ?? 0} active` },
                  { action: "Installment Fees", detail: feesLoading     ? null : `${formatPKR(feeBreakdown.installment.collected)} collected - ${formatPKR(feeBreakdown.installment.outstanding)} pending` },
                  { action: "Hostel Fees",      detail: feesLoading     ? null : `${formatPKR(feeBreakdown.hostel.collected)} collected - ${formatPKR(feeBreakdown.hostel.outstanding)} pending` },
                  { action: "Extra Challans",   detail: feesLoading     ? null : `${formatPKR(feeBreakdown.extraChallans.collected)} collected - ${formatPKR(feeBreakdown.extraChallans.outstanding)} pending` },
                  { action: "Attendance",     detail: attendanceLoading ? null : `${attendance?.today.present ?? 0} presence records` },
                  { action: "Finance",        detail: financeLoading    ? null : `Inflow: ${formatPKR(totalInflow)} - Outflow: ${formatPKR(totalOutflow)}` },
                  { action: "Staff",          detail: staffLoading      ? null : `${staff?.total ?? 0} staff members (${staff?.teaching ?? 0} teaching)` },
                ].map((a, i) => (
                  <div
                    key={i}
                    onClick={() => go(
                      a.action === "Students" ? "/students" :
                      a.action.includes("Fees") || a.action.includes("Challans") ? "/fee-management" :
                      a.action === "Attendance" ? "/attendance" :
                      a.action === "Finance" ? "/finance" :
                      a.action === "Staff" ? "/staff" : "/dashboard"
                    )}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.action}</p>
                      {a.detail === null
                        ? <Skeleton className="h-4 w-40 mt-1" />
                        : <p className="text-sm text-muted-foreground">{a.detail}</p>
                      }
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">{sessionLabel}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card onClick={() => go("/finance")} className="shadow-sm hover:shadow-md transition-all cursor-pointer relative">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3" />
            <CardHeader><CardTitle>Financial Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financeLoading ? (
                  <>
                    <Skeleton className="h-16 rounded-md" />
                    <Skeleton className="h-16 rounded-md" />
                    <Skeleton className="h-16 rounded-md" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Inflow</p>
                        <p className="text-base font-semibold text-green-600">{formatPKR(totalInflow)}</p>
                      </div>
                      <div className="p-2 bg-green-500/20 rounded-md"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                        <p className="text-base font-semibold text-yellow-600">{formatPKR(totalPending)}</p>
                      </div>
                      <div className="p-2 bg-yellow-500/20 rounded-md"><DollarSign className="w-4 h-4 text-yellow-600" /></div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Outflow</p>
                        <p className="text-base font-semibold text-purple-600">{formatPKR(totalOutflow)}</p>
                      </div>
                      <div className="p-2 bg-purple-500/20 rounded-md"><FileText className="w-4 h-4 text-purple-600" /></div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                        <p className={cn("text-base font-semibold", netBalance >= 0 ? "text-green-600" : "text-red-600")}>{formatPKR(netBalance)}</p>
                      </div>
                      <div className={cn("p-2 rounded-md", netBalance >= 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                        <Briefcase className={cn("w-4 h-4", netBalance >= 0 ? "text-green-600" : "text-red-600")} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;


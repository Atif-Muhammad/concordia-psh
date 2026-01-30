import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    User,
    Users,
    GraduationCap,
    Briefcase,
    UserCheck,
    Eye,
    X,
    Loader2,
    Phone,
    Mail,
    Upload,
    UserCog,
    Calendar as CalendarIcon,
    ChevronLeft as ChevronLeftIcon,
    IdCard,
    Shield,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import DashboardLayout from "@/components/DashboardLayout";
import {
    getAllStaff,
    createStaffAPI,
    updateStaffAPI,
    deleteStaffAPI,
    getDepartmentNames,
    getStaffById,
    getPayrollHistory,
    getStaffAttendance,
    markStaffAttendance,
} from "../../config/apis";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Constants
const STAFF_DOCUMENTS = [
    { key: "bsDegree", label: "BS/BSc Degree" },
    { key: "msDegree", label: "MS/MSc Degree" },
    { key: "phd", label: "PhD" },
    { key: "postDoc", label: "Postdoc" },
    { key: "experienceLetter", label: "Experience Letter" },
    { key: "cv", label: "CV" },
];

const EMP_DEPARTMENTS = [
    "ADMIN",
    "FINANCE",
    "SECURITY",
    "TRANSPORT",
    "CLASS_4",
    "MAINTENANCE",
    "IT_SUPPORT",
    "LIBRARY",
    "LAB",
    "OTHER",
];

const STAFF_TYPES = ["PERMANENT", "CONTRACT"];
const STAFF_STATUSES = ["ACTIVE", "TERMINATED", "RETIRED"];

const initialFormData = {
    name: "",
    fatherName: "",
    cnic: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    // Role flags
    isTeaching: false,
    isNonTeaching: false,
    // Employment
    staffType: "PERMANENT",
    status: "ACTIVE",
    basicPay: "",
    joinDate: "",
    leaveDate: "",
    contractStart: "",
    contractEnd: "",
    // Teaching fields
    specialization: "",
    highestDegree: "",
    departmentId: "",
    documents: {
        bsDegree: false,
        msDegree: false,
        phd: false,
        postDoc: false,
        experienceLetter: false,
        cv: false,
    },
    // Non-teaching fields
    designation: "",
    empDepartment: "",
    accessRights: [],
};

const STAFF_MODULES = [
    "Dashboard",
    "Students",
    "Academics",
    "Attendance",
    "Staff",
    "Examination",
    "Finance",
    "Fee Management",
    "HR & Payroll",
    "Front Office",
    "Hostel",
    "Inventory",
    "Configuration",
];

export default function Staff() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // States
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all"); // all, teaching, non-teaching, dual
    const [statusFilter, setStatusFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState(null);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [formTab, setFormTab] = useState("basic");

    // Attendance State
    const [activeTab, setActiveTab] = useState("directory");
    const [attendanceDate, setAttendanceDate] = useState(new Date());
    const [attendanceRoleFilter, setAttendanceRoleFilter] = useState("all");

    const photoInputRef = useRef(null);

    // Queries
    const { data: attendanceData = [], isFetching: attendanceLoading, refetch: refetchAttendance } = useQuery({
        queryKey: ["staffAttendance", attendanceDate],
        queryFn: () => getStaffAttendance(format(attendanceDate, "yyyy-MM-dd")),
        enabled: activeTab === "attendance",
    });

    const markAttendanceMutation = useMutation({
        mutationFn: markStaffAttendance,
        onSuccess: () => {
            toast({ title: "Success", description: "Attendance marked successfully" });
            refetchAttendance();
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });
    const { data: staffList = [], isLoading: staffLoading } = useQuery({
        queryKey: ["staff", roleFilter, statusFilter, searchTerm],
        queryFn: () => {
            const filters = {};
            if (roleFilter === "teaching") {
                filters.isTeaching = true;
                filters.isNonTeaching = false;
            } else if (roleFilter === "non-teaching") {
                filters.isTeaching = false;
                filters.isNonTeaching = true;
            } else if (roleFilter === "dual") {
                filters.isTeaching = true;
                filters.isNonTeaching = true;
            }
            if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
            if (searchTerm) filters.search = searchTerm;
            return getAllStaff(filters);
        },
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: getDepartmentNames,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createStaffAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast({ title: "Staff created successfully" });
            handleCloseDialog();
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateStaffAPI(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast({ title: "Staff updated successfully" });
            handleCloseDialog();
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStaffAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast({ title: "Staff deleted successfully" });
            setDeleteOpen(false);
            setStaffToDelete(null);
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Handlers
    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingStaff(null);
        setFormData(initialFormData);
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormTab("basic");
    };

    const handleOpenCreate = () => {
        setFormData(initialFormData);
        setEditingStaff(null);
        setDialogOpen(true);
    };

    const handleOpenEdit = (staff) => {
        setEditingStaff(staff);
        setFormData({
            name: staff.name || "",
            fatherName: staff.fatherName || "",
            cnic: staff.cnic || "",
            email: staff.email || "",
            phone: staff.phone || "",
            address: staff.address || "",
            password: "",
            isTeaching: staff.isTeaching || false,
            isNonTeaching: staff.isNonTeaching || false,
            staffType: staff.staffType || "PERMANENT",
            status: staff.status || "ACTIVE",
            basicPay: staff.basicPay ? String(staff.basicPay) : "",
            joinDate: staff.joinDate ? staff.joinDate.split("T")[0] : "",
            leaveDate: staff.leaveDate ? staff.leaveDate.split("T")[0] : "",
            contractStart: staff.contractStart ? staff.contractStart.split("T")[0] : "",
            contractEnd: staff.contractEnd ? staff.contractEnd.split("T")[0] : "",
            specialization: staff.specialization || "",
            highestDegree: staff.highestDegree || "",
            departmentId: staff.departmentId ? String(staff.departmentId) : "",
            documents: staff.documents || initialFormData.documents,
            designation: staff.designation || "",
            empDepartment: staff.empDepartment || "",
            accessRights: staff.permissions?.modules || [],
        });
        if (staff.photo_url) {
            setPhotoPreview(staff.photo_url);
        }
        setDialogOpen(true);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" });
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        // Validation
        if (!formData.name.trim()) {
            toast({ title: "Name is required", variant: "destructive" });
            return;
        }
        if (!formData.isTeaching && !formData.isNonTeaching) {
            toast({ title: "Select at least one role", description: "Staff must be Teaching or Non-Teaching", variant: "destructive" });
            return;
        }
        if (!editingStaff && !formData.password) {
            toast({ title: "Password is required for new staff", variant: "destructive" });
            return;
        }

        const submitData = new FormData();
        Object.keys(formData).forEach((key) => {
            if (key === "documents" || key === "accessRights") {
                // Skip these, handled separately or as permissions
            } else if (key === "password" && !formData[key]) {
                // Skip empty password on edit
            } else {
                submitData.append(key, formData[key]);
            }
        });

        // Add permissions structure that backend expects
        submitData.append("permissions", JSON.stringify({ modules: formData.accessRights || [] }));
        // Add documents
        submitData.append("documents", JSON.stringify(formData.documents));

        if (photoFile) {
            submitData.append("photo", photoFile);
        }

        if (editingStaff) {
            updateMutation.mutate({ id: editingStaff.id, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleConfirmDelete = () => {
        if (staffToDelete) {
            deleteMutation.mutate(staffToDelete.id);
        }
    };

    // Filter staff based on search (client-side additional filtering if needed)
    const filteredStaff = staffList;

    const getRoleBadges = (staff) => {
        const badges = [];
        if (staff.isTeaching) {
            badges.push(
                <Badge key="teaching" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Teaching
                </Badge>
            );
        }
        if (staff.isNonTeaching) {
            badges.push(
                <Badge key="non-teaching" className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Non-Teaching
                </Badge>
            );
        }
        return badges;
    };

    const getStatusBadge = (status) => {
        const colors = {
            ACTIVE: "bg-green-500",
            TERMINATED: "bg-red-500",
            RETIRED: "bg-gray-500",
        };
        return (
            <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
                {status}
            </Badge>
        );
    };

    // If viewing a staff member, show the detail view
    if (viewingStaff) {
        return (
            <DashboardLayout>
                <StaffDetailView
                    staffId={viewingStaff.id}
                    onBack={() => setViewingStaff(null)}
                    onEdit={() => {
                        handleOpenEdit(viewingStaff);
                        setViewingStaff(null);
                    }}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="w-8 h-8 text-primary" />
                            Staff Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage teaching and non-teaching staff members
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Staff
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="directory">Staff Directory</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="directory" className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter("all")}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Staff</p>
                                            <p className="text-2xl font-bold">{staffList.length}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-primary opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter("teaching")}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Teaching</p>
                                            <p className="text-2xl font-bold">
                                                {staffList.filter((s) => s.isTeaching && !s.isNonTeaching).length}
                                            </p>
                                        </div>
                                        <GraduationCap className="w-8 h-8 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter("non-teaching")}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Non-Teaching</p>
                                            <p className="text-2xl font-bold">
                                                {staffList.filter((s) => s.isNonTeaching && !s.isTeaching).length}
                                            </p>
                                        </div>
                                        <Briefcase className="w-8 h-8 text-purple-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter("dual")}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Dual Role</p>
                                            <p className="text-2xl font-bold">
                                                {staffList.filter((s) => s.isTeaching && s.isNonTeaching).length}
                                            </p>
                                        </div>
                                        <UserCog className="w-8 h-8 text-orange-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name, email, CNIC..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="teaching">Teaching Only</SelectItem>
                                            <SelectItem value="non-teaching">Non-Teaching Only</SelectItem>
                                            <SelectItem value="dual">Dual Role</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {STAFF_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Staff Table */}
                        <Card>
                            <CardContent className="pt-6">
                                {staffLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredStaff.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No staff members found</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[250px]">Staff</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Department / Position</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStaff.map((staff) => (
                                                <TableRow key={staff.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={staff.photo_url} alt={staff.name} />
                                                                <AvatarFallback>
                                                                    {staff.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">{staff.name}</p>
                                                                <p className="text-sm text-muted-foreground">{staff.cnic || "No CNIC"}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">{getRoleBadges(staff)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {staff.email && (
                                                                <p className="text-sm flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {staff.email}
                                                                </p>
                                                            )}
                                                            {staff.phone && (
                                                                <p className="text-sm flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {staff.phone}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {staff.isTeaching && staff.department?.name && (
                                                            <p className="text-sm">{staff.department.name}</p>
                                                        )}
                                                        {staff.isTeaching && staff.specialization && (
                                                            <p className="text-sm text-muted-foreground">{staff.specialization}</p>
                                                        )}
                                                        {staff.isNonTeaching && staff.designation && (
                                                            <p className="text-sm">{staff.designation}</p>
                                                        )}
                                                        {staff.isNonTeaching && staff.empDepartment && (
                                                            <p className="text-sm text-muted-foreground">{staff.empDepartment}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(staff.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setViewingStaff(staff)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenEdit(staff)}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600"
                                                                onClick={() => {
                                                                    setStaffToDelete(staff);
                                                                    setDeleteOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attendance" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Attendance Management</CardTitle>
                                <div className="flex items-center gap-4">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={`w-[240px] justify-start text-left font-normal ${!attendanceDate && "text-muted-foreground"}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                mode="single"
                                                selected={attendanceDate}
                                                onSelect={setAttendanceDate}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Select value={attendanceRoleFilter} onValueChange={setAttendanceRoleFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="teaching">Teaching</SelectItem>
                                            <SelectItem value="non-teaching">Non-Teaching</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nam/ID</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendanceData
                                                .filter(record => {
                                                    if (attendanceRoleFilter === "all") return true;
                                                    const isTeaching = record.staff?.isTeaching;
                                                    const isNonTeaching = record.staff?.isNonTeaching;
                                                    if (attendanceRoleFilter === "teaching") return isTeaching;
                                                    if (attendanceRoleFilter === "non-teaching") return isNonTeaching;
                                                    return true;
                                                })
                                                .map((record) => (
                                                    <TableRow key={record.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={record.staff?.photo_url} />
                                                                    <AvatarFallback>{record.staff?.name?.[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{record.staff?.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{record.staff?.id}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.staff?.isTeaching && <Badge variant="outline" className="mr-1">Teaching</Badge>}
                                                            {record.staff?.isNonTeaching && <Badge variant="secondary">Staff</Badge>}
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.staff?.isTeaching
                                                                ? record.staff?.department?.name
                                                                : record.staff?.empDepartment}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={record.status}
                                                                onValueChange={(val) =>
                                                                    markAttendanceMutation.mutate({
                                                                        staffId: record.staff?.id,
                                                                        date: format(attendanceDate, "yyyy-MM-dd"),
                                                                        status: val,
                                                                        notes: record.notes
                                                                    })
                                                                }
                                                            >
                                                                <SelectTrigger className="w-[130px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="PRESENT">Present</SelectItem>
                                                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                                                    <SelectItem value="LEAVE">Leave</SelectItem>
                                                                    <SelectItem value="LATE">Late</SelectItem>
                                                                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                className="h-8 w-[200px]"
                                                                placeholder="Notes..."
                                                                defaultValue={record.notes}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== record.notes) {
                                                                        markAttendanceMutation.mutate({
                                                                            staffId: record.staff?.id,
                                                                            date: format(attendanceDate, "yyyy-MM-dd"),
                                                                            status: record.status,
                                                                            notes: e.target.value
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {attendanceData.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-4">
                                                        No attendance records found for this date.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Add/Edit Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                            </DialogTitle>
                            <DialogDescription>
                                Fill in the details below. Staff can have teaching, non-teaching, or both roles.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={formTab} onValueChange={setFormTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="employment">Employment</TabsTrigger>
                                <TabsTrigger value="roles">Roles</TabsTrigger>
                                <TabsTrigger value="details">Role Details</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20 cursor-pointer" onClick={() => photoInputRef.current?.click()}>
                                        <AvatarImage src={photoPreview} />
                                        <AvatarFallback className="bg-muted">
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => photoInputRef.current?.click()}
                                        >
                                            Upload Photo
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                                    </div>
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div>
                                        <Label>Father's Name</Label>
                                        <Input
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                            placeholder="Father's Name"
                                        />
                                    </div>
                                    <div>
                                        <Label>CNIC</Label>
                                        <Input
                                            value={formData.cnic}
                                            onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                            placeholder="12345-1234567-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="03001234567"
                                        />
                                    </div>
                                    <div>
                                        <Label>{editingStaff ? "New Password (optional)" : "Password *"}</Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={editingStaff ? "Leave blank to keep current" : "Password"}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Address</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Full Address"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="employment" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Staff Type</Label>
                                        <Select
                                            value={formData.staffType}
                                            onValueChange={(value) => setFormData({ ...formData, staffType: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STAFF_TYPES.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STAFF_STATUSES.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Basic Pay (PKR)</Label>
                                        <Input
                                            type="number"
                                            value={formData.basicPay}
                                            onChange={(e) => setFormData({ ...formData, basicPay: e.target.value })}
                                            placeholder="50000"
                                        />
                                    </div>
                                    <div>
                                        <Label>Join Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.joinDate}
                                            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                                        />
                                    </div>
                                    {formData.staffType === "CONTRACT" && (
                                        <>
                                            <div>
                                                <Label>Contract Start</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.contractStart}
                                                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Contract End</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.contractEnd}
                                                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {(formData.status === "TERMINATED" || formData.status === "RETIRED") && (
                                        <div>
                                            <Label>Leave Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.leaveDate}
                                                onChange={(e) => setFormData({ ...formData, leaveDate: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="roles" className="space-y-6 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="w-6 h-6 text-blue-500" />
                                            <div>
                                                <p className="font-medium">Teaching Role</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Can be assigned to classes and subjects
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={formData.isTeaching}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isTeaching: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-6 h-6 text-purple-500" />
                                            <div>
                                                <p className="font-medium">Non-Teaching Role</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Administrative or support staff
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={formData.isNonTeaching}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isNonTeaching: checked })}
                                        />
                                    </div>

                                    {!formData.isTeaching && !formData.isNonTeaching && (
                                        <p className="text-sm text-red-500 text-center">
                                            Please select at least one role
                                        </p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="details" className="space-y-4 mt-4">
                                {/* Teaching Details */}
                                {formData.isTeaching && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-blue-500" />
                                            Teaching Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Specialization</Label>
                                                <Input
                                                    value={formData.specialization}
                                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                    placeholder="e.g., Computer Science"
                                                />
                                            </div>
                                            <div>
                                                <Label>Highest Degree</Label>
                                                <Input
                                                    value={formData.highestDegree}
                                                    onChange={(e) => setFormData({ ...formData, highestDegree: e.target.value })}
                                                    placeholder="e.g., PhD, MS"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Department</Label>
                                                <Select
                                                    value={formData.departmentId}
                                                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map((d) => (
                                                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Documents</Label>
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                {STAFF_DOCUMENTS.map((doc) => (
                                                    <label key={doc.key} className="flex items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={formData.documents[doc.key]}
                                                            onCheckedChange={(checked) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    documents: { ...formData.documents, [doc.key]: checked },
                                                                })
                                                            }
                                                        />
                                                        {doc.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Non-Teaching Details */}
                                {formData.isNonTeaching && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
                                        <h4 className="font-medium flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-purple-500" />
                                            Non-Teaching Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Designation</Label>
                                                <Input
                                                    value={formData.designation}
                                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                    placeholder="e.g., Office Manager"
                                                />
                                            </div>
                                            <div>
                                                <Label>Employee Department</Label>
                                                <Select
                                                    value={formData.empDepartment}
                                                    onValueChange={(value) => setFormData({ ...formData, empDepartment: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Department" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EMP_DEPARTMENTS.map((d) => (
                                                            <SelectItem key={d} value={d}>{d.replace("_", " ")}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Label className="mb-2 block">System Access Rights</Label>
                                            <div className="grid grid-cols-3 gap-2 p-3 bg-background rounded-md border">
                                                {STAFF_MODULES.map((module) => (
                                                    <label key={module} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                                                        <Checkbox
                                                            checked={formData.accessRights?.includes(module)}
                                                            onCheckedChange={(checked) => {
                                                                const rights = formData.accessRights || [];
                                                                if (checked) {
                                                                    setFormData({ ...formData, accessRights: [...rights, module] });
                                                                } else {
                                                                    setFormData({ ...formData, accessRights: rights.filter(r => r !== module) });
                                                                }
                                                            }}
                                                        />
                                                        {module}
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">Grant access to specific system modules for this staff member.</p>
                                        </div>
                                    </div>
                                )}

                                {!formData.isTeaching && !formData.isNonTeaching && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <UserCog className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Select a role in the "Roles" tab to configure details</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {(createMutation.isPending || updateMutation.isPending) && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                {editingStaff ? "Update Staff" : "Add Staff"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{staffToDelete?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Delete
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout >
    );
}

// Staff Detail View Component
function StaffDetailView({ staffId, onBack, onEdit }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("info");

    const { data: staff, isLoading } = useQuery({
        queryKey: ["staff", staffId],
        queryFn: () => getStaffById(staffId),
    });

    const { data: payrollHistory = [] } = useQuery({
        queryKey: ["payrollHistory", staffId],
        queryFn: () => getPayrollHistory(staffId, staff?.isTeaching ? "teacher" : "employee"),
        enabled: !!staff,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Staff member not found</p>
                <Button onClick={onBack} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const getRoleBadges = () => {
        const badges = [];
        if (staff.isTeaching) {
            badges.push(
                <Badge key="teaching" className="bg-blue-500 text-white">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Teaching
                </Badge>
            );
        }
        if (staff.isNonTeaching) {
            badges.push(
                <Badge key="non-teaching" className="bg-purple-500 text-white">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Non-Teaching
                </Badge>
            );
        }
        return badges;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back to Staff List
                </Button>
                <Button onClick={onEdit} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Staff
                </Button>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={staff.photo_url} alt={staff.name} />
                            <AvatarFallback className="text-2xl">
                                {staff.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">{staff.name}</h2>
                                <Badge className={staff.status === "ACTIVE" ? "bg-green-500" : "bg-gray-500"}>
                                    {staff.status}
                                </Badge>
                            </div>
                            <div className="flex gap-2 mt-2">{getRoleBadges()}</div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {staff.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        {staff.email}
                                    </div>
                                )}
                                {staff.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        {staff.phone}
                                    </div>
                                )}
                                {staff.cnic && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <IdCard className="w-4 h-4 text-muted-foreground" />
                                        {staff.cnic}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="info">Info</TabsTrigger>
                    {staff.isTeaching && <TabsTrigger value="teaching">Teaching Assignments</TabsTrigger>}
                    <TabsTrigger value="payroll">Payroll History</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Personal Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Father's Name</span>
                                    <span>{staff.fatherName || "-"}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Address</span>
                                    <span className="text-right max-w-[200px]">{staff.address || "-"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Employment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Staff Type</span>
                                    <span>{staff.staffType}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Basic Pay</span>
                                    <span>PKR {staff.basicPay?.toLocaleString() || "-"}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Join Date</span>
                                    <span>{staff.joinDate ? new Date(staff.joinDate).toLocaleDateString() : "-"}</span>
                                </div>
                                {staff.staffType === "CONTRACT" && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Contract Period</span>
                                            <span>
                                                {staff.contractStart ? new Date(staff.contractStart).toLocaleDateString() : "-"} to{" "}
                                                {staff.contractEnd ? new Date(staff.contractEnd).toLocaleDateString() : "-"}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Teaching Details */}
                        {staff.isTeaching && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="w-5 h-5 text-blue-500" />
                                        Teaching Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Specialization</span>
                                        <span>{staff.specialization || "-"}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Highest Degree</span>
                                        <span>{staff.highestDegree || "-"}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Department</span>
                                        <span>{staff.department?.name || "-"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Non-Teaching Details */}
                        {staff.isNonTeaching && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-purple-500" />
                                        Non-Teaching Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Designation</span>
                                        <span>{staff.designation || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Employee Department</span>
                                        <span>{staff.empDepartment?.replace("_", " ") || "-"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* System Access Rights */}
                        {staff.isNonTeaching && staff.permissions?.modules?.length > 0 && (
                            <Card className="col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-orange-500" />
                                        System Access Rights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {staff.permissions.modules.map((module) => (
                                            <Badge key={module} variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100">
                                                {module}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="teaching" className="mt-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Assigned Classes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Assigned Classes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {staff.classSectionMappings?.length > 0 ? (
                                    <div className="space-y-2">
                                        {staff.classSectionMappings.map((mapping) => (
                                            <div key={mapping.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <span>{mapping.class?.name} - {mapping.class?.program?.name}</span>
                                                {mapping.section && <Badge variant="outline">{mapping.section.name}</Badge>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No classes assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Assigned Subjects */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Assigned Subjects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {staff.subjects?.length > 0 ? (
                                    <div className="space-y-2">
                                        {staff.subjects.map((mapping) => (
                                            <div key={mapping.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <span>{mapping.subject?.name}</span>
                                                {mapping.subject?.code && (
                                                    <Badge variant="outline">{mapping.subject.code}</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No subjects assigned</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="payroll" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payroll History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {payrollHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Basic Salary</TableHead>
                                            <TableHead>Deductions</TableHead>
                                            <TableHead>Allowances</TableHead>
                                            <TableHead>Net Salary</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrollHistory.map((payroll) => (
                                            <TableRow key={payroll.id}>
                                                <TableCell>{payroll.month}</TableCell>
                                                <TableCell>PKR {payroll.basicSalary?.toLocaleString()}</TableCell>
                                                <TableCell className="text-red-500">
                                                    -PKR {payroll.totalDeductions?.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-green-500">
                                                    +PKR {payroll.totalAllowances?.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    PKR {payroll.netSalary?.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={payroll.status === "PAID" ? "bg-green-500" : "bg-yellow-500"}>
                                                        {payroll.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No payroll records found</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}

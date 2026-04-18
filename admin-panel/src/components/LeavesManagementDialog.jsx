import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, ChevronsUpDown, CalendarIcon, Trash2, MoreVertical, Lock, Unlock, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    getLeaveSheet,
    upsertLeave,
    getAllStaff,
    deleteStaffLeave,
    getStaffLeaveBalance,
    toggleLockStaffLeave,
    updateStaffLeaveStatus,
} from "../../config/apis";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const EditLeaveDialog = ({ open, onOpenChange, record, onSuccess }) => {
    const [selectedDates, setSelectedDates] = useState([]);
    const [calOpen, setCalOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [leaveType, setLeaveType] = useState("CASUAL");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Fetch leave balance for the staff member being edited
    const { data: leaveBalance, isFetching: balanceFetching } = useQuery({
        queryKey: ["leaveBalance", record?.staffId],
        queryFn: () => getStaffLeaveBalance(record.staffId),
        enabled: !!record?.staffId && open,
    });

    useEffect(() => {
        if (record) {
            const parseLocalDate = (str) => {
                if (!str) return null;
                const d = str.split("T")[0];
                const [y, m, day] = d.split("-").map(Number);
                return new Date(y, m - 1, day, 12, 0, 0);
            };
            const start = parseLocalDate(record.startDate);
            const end = parseLocalDate(record.endDate);
            // Expand the full range so all days between start and end are pre-selected
            const dates = [];
            if (start) {
                const cursor = new Date(start);
                const last = end || start;
                while (cursor <= last) {
                    dates.push(new Date(cursor));
                    cursor.setDate(cursor.getDate() + 1);
                }
            }
            setSelectedDates(dates);
            setReason(record.reason || "");
            setLeaveType(record.leaveType || "CASUAL");
            setCalOpen(false);
        }
    }, [record]);

    const handleSave = async () => {
        if (!record) return;
        setIsSubmitting(true);
        try {
            await upsertLeave({
                leaveId: record.leaveId,
                staffId: record.staffId,
                startDate: format(selectedDates[0], "yyyy-MM-dd"),
                endDate: format(selectedDates[selectedDates.length - 1], "yyyy-MM-dd"),
                days: selectedDates.length,
                month: record.month,
                reason,
                status: record.status,
                leaveType,
            });
            onSuccess();
            onOpenChange(false);
            setIsSubmitting(false);
        } catch (error) {
            toast({
                title: error.message || "Failed to update leave request",
                variant: "destructive",
            });
            setIsSubmitting(false);
        }
    };

    const dateLabel = selectedDates.length === 0
        ? "Pick dates..."
        : `${selectedDates.length} date(s) selected`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Leave Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label>Staff Member</Label>
                        <p className="text-sm font-medium mt-1">{record?.name || "—"}</p>
                    </div>

                    {/* Balance summary */}
                    {record?.staffId && (
                        <div>
                            {balanceFetching ? (
                                <p className="text-xs text-muted-foreground">Loading leave balance...</p>
                            ) : leaveBalance ? (
                                <div className="grid grid-cols-3 gap-1.5 text-xs">
                                    {[["CASUAL","Casual"],["SICK","Sick"],["ANNUAL","Annual"]].map(([type, label]) => {
                                        const b = leaveBalance[type];
                                        const rem = b ? b.allowed - b.taken : 0;
                                        return (
                                            <div key={type} className={`rounded px-2 py-1 text-center border ${type === leaveType ? "ring-1 ring-primary" : ""} ${rem <= 0 ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted/40"}`}>
                                                <div className="font-medium">{label}</div>
                                                <div>{b ? `${b.taken}/${b.allowed}` : "—"}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div>
                        <Label>Leave Type</Label>
                        <Select value={leaveType} onValueChange={setLeaveType}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASUAL">Casual Leave</SelectItem>
                                <SelectItem value="SICK">Sick Leave</SelectItem>
                                <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                            </SelectContent>
                        </Select>
                        {leaveBalance && (
                            <p className="text-xs mt-1 text-muted-foreground">
                                {(() => {
                                    const b = leaveBalance[leaveType];
                                    if (!b) return null;
                                    const rem = b.allowed - b.taken;
                                    return <span className={rem <= 0 ? "text-destructive font-medium" : ""}>Used: {b.taken}/{b.allowed} · Remaining: {Math.max(0, rem)}</span>;
                                })()}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label>Dates</Label>
                        <Popover open={calOpen} onOpenChange={setCalOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start mt-1 font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {dateLabel}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="multiple"
                                    selected={selectedDates}
                                    onSelect={(dates) => setSelectedDates(dates || [])}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div>
                        <Label>Reason</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for leave..."
                            rows={2}
                            className="mt-1"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting || selectedDates.length === 0}>
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const LeavesManagementDialog = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeTab, setActiveTab] = useState("teacher");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState({
        personId: "",
        personName: "",
        reason: "",
        leaveType: "CASUAL",
    });
    const [selectedDates, setSelectedDates] = useState([]);
    const [dateError, setDateError] = useState("");
    const [calOpen, setCalOpen] = useState(false);
    const [staffSearch, setStaffSearch] = useState("");
    const [comboOpen, setComboOpen] = useState(false);
    const [staffError, setStaffError] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Leave balance for selected staff
    const { data: leaveBalance, isFetching: balanceFetching } = useQuery({
        queryKey: ["leaveBalance", leaveFormData.personId],
        queryFn: () => getStaffLeaveBalance(parseInt(leaveFormData.personId)),
        enabled: !!leaveFormData.personId,
    });

    const {
        data: leaveData = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["leaveSheet", month, activeTab],
        queryFn: () => getLeaveSheet(month, activeTab),
        enabled: !!month
    });

    // Fetch unified staff list
    const { data: staffList = [], isLoading: staffLoading } = useQuery({
        queryKey: ["allStaff"],
        queryFn: () => getAllStaff({ status: 'ACTIVE' }),
    });

    // Per-record edit state
    const [editingRecord, setEditingRecord] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // leaveId of in-progress action

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        setConfirmDeleteId(null);
        try {
            await deleteStaffLeave(confirmDeleteId);
            toast({ title: "Leave request deleted" });
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({ title: error.message || "Failed to delete", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (leaveId, status) => {
        setActionLoading(leaveId);
        try {
            await updateStaffLeaveStatus(leaveId, status);
            toast({ title: `Status updated to ${status}` });
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({ title: error.message || "Failed to update status", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleLock = async (leaveId, locked) => {
        setActionLoading(leaveId);
        try {
            await toggleLockStaffLeave(leaveId, locked);
            toast({ title: locked ? "Leave locked" : "Leave unlocked" });
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({ title: error.message || "Failed to toggle lock", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const statusBadge = (status) => {
        if (status === "APPROVED") return <Badge className="bg-green-500 text-white">APPROVED</Badge>;
        if (status === "REJECTED") return <Badge variant="destructive">REJECTED</Badge>;
        return <Badge variant="secondary">PENDING</Badge>;
    };

    const roleLabel = (s) => {
        if (s.isTeaching && s.isNonTeaching) return "Dual";
        if (s.isTeaching) return "Teacher";
        return "Non-Teaching";
    };

    // Handle create leave
    const handleCreateLeave = async () => {
        if (!leaveFormData.personId) {
            setStaffError("Please select a staff member");
            return;
        }
        if (!leaveFormData.reason) {
            toast({ title: "Please fill all required fields", variant: "destructive" });
            return;
        }
        if (selectedDates.length === 0) {
            setDateError("Please select at least one date");
            return;
        }

        try {
            for (const date of selectedDates) {
                const dateStr = format(date, "yyyy-MM-dd");
                await upsertLeave({
                    staffId: parseInt(leaveFormData.personId),
                    startDate: dateStr,
                    endDate: dateStr,
                    days: 1,
                    month: format(date, "yyyy-MM"),
                    reason: leaveFormData.reason,
                    status: "PENDING",
                    leaveType: leaveFormData.leaveType,
                });
            }
            toast({ title: "Leave request(s) created successfully" });
            setCreateDialogOpen(false);
            setLeaveFormData({ personId: "", personName: "", reason: "", leaveType: "CASUAL" });
            setSelectedDates([]);
            setDateError("");
            setCalOpen(false);
            setStaffSearch("");
            setComboOpen(false);
            setStaffError("");
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({
                title: error.message || "Failed to create leave request",
                variant: "destructive",
            });
            // Keep dialog open, refetch to show partial results
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        }
    };

    return (
        <div className="w-full h-full flex flex-col min-h-[600px]">
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Label>Month:</Label>
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label>Role:</Label>
                    <Select value={activeTab} onValueChange={setActiveTab}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            <SelectItem value="teacher">Teachers</SelectItem>
                            <SelectItem value="employee">Non-Teaching Staff</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    variant="outline"
                    className="ml-auto"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Leave Request
                </Button>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="min-w-[160px]">Staff Name</TableHead>
                                <TableHead className="min-w-[160px]">Role / Dept</TableHead>
                                <TableHead className="min-w-[100px]">Leave Type</TableHead>
                                <TableHead className="min-w-[200px]">Dates</TableHead>
                                <TableHead className="min-w-[60px]">Days</TableHead>
                                <TableHead className="min-w-[200px]">Reason</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[80px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaveData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No leave records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaveData.map((row, index) => (
                                    <TableRow key={`${row.leaveId ?? row.id}-${index}`}>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell>
                                            <div>{roleLabel(row)}</div>
                                            <div className="text-xs text-muted-foreground">{row.department?.name || row.department || "—"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {row.leaveType === "SICK" ? "Sick" : row.leaveType === "ANNUAL" ? "Annual" : "Casual"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {row.startDate?.split("T")[0] || ""}
                                            {row.endDate && row.endDate !== row.startDate
                                                ? ` – ${row.endDate.split("T")[0]}`
                                                : ""}
                                        </TableCell>
                                        <TableCell>{row.days}</TableCell>
                                        <TableCell>{row.reason || ""}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {statusBadge(row.status)}
                                                {row.locked && <Badge variant="outline" className="text-xs w-fit gap-1"><Lock className="h-3 w-3" />Locked</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                            {actionLoading === row.leaveId ? (
                                                <Loader2 className="h-4 w-4 animate-spin mx-2" />
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            disabled={row.locked}
                                                            onClick={() => { setEditingRecord(row); setEditDialogOpen(true); }}
                                                        >
                                                            <Pencil className="h-4 w-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger disabled={row.locked}>
                                                                <Clock className="h-4 w-4 mr-2" /> Change Status
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(row.leaveId, "PENDING")}>
                                                                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> Pending
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(row.leaveId, "APPROVED")}>
                                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Approve
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleStatusChange(row.leaveId, "REJECTED")}>
                                                                    <XCircle className="h-4 w-4 mr-2 text-destructive" /> Reject
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleToggleLock(row.leaveId, !row.locked)}>
                                                            {row.locked
                                                                ? <><Unlock className="h-4 w-4 mr-2" /> Unlock</>
                                                                : <><Lock className="h-4 w-4 mr-2" /> Lock</>}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            disabled={row.locked}
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setConfirmDeleteId(row.leaveId)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Edit Leave Request Dialog */}
            <EditLeaveDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                record={editingRecord}
                onSuccess={() => {
                    queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
                    refetch();
                }}
            />

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            Create Leave Request
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Staff Combobox */}
                        <div>
                            <Label>Select Staff Member *</Label>
                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboOpen}
                                        className="w-full justify-between mt-1"
                                        disabled={staffLoading}
                                    >
                                        {leaveFormData.personId
                                            ? staffList.find(s => s.id === parseInt(leaveFormData.personId))?.name || "Select staff member..."
                                            : staffLoading ? "Loading..." : "Select staff member..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search staff..."
                                            value={staffSearch}
                                            onValueChange={setStaffSearch}
                                            disabled={staffLoading}
                                        />
                                        <CommandEmpty>No staff found</CommandEmpty>
                                        <CommandList>
                                            {staffList
                                                .filter(s => s.name.toLowerCase().includes(staffSearch.toLowerCase()))
                                                .map(s => (
                                                    <CommandItem
                                                        key={s.id}
                                                        value={s.id.toString()}
                                                        onSelect={() => {
                                                            setLeaveFormData({ ...leaveFormData, personId: s.id.toString(), personName: s.name });
                                                            setStaffError("");
                                                            setComboOpen(false);
                                                        }}
                                                    >
                                                        {s.name} · {roleLabel(s)} · {s.department?.name || s.empDepartment || "—"}
                                                    </CommandItem>
                                                ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {staffError && <p className="text-sm text-destructive mt-1">{staffError}</p>}
                            {/* All-type balance summary */}
                            {leaveFormData.personId && leaveBalance && !balanceFetching && (
                                <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
                                    {[["CASUAL","Casual"],["SICK","Sick"],["ANNUAL","Annual"]].map(([type, label]) => {
                                        const b = leaveBalance[type];
                                        const rem = b ? b.allowed - b.taken : 0;
                                        return (
                                            <div key={type} className={`rounded px-2 py-1 text-center border ${rem <= 0 ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted/40"}`}>
                                                <div className="font-medium">{label}</div>
                                                <div>{b ? `${b.taken}/${b.allowed}` : "—"}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {leaveFormData.personId && balanceFetching && (
                                <p className="text-xs text-muted-foreground mt-1">Loading leave balance...</p>
                            )}
                        </div>

                        {/* Leave Type */}
                        {/* <div>
                            <Label>Leave Type *</Label>
                            <Select
                                value={leaveFormData.leaveType}
                                onValueChange={(value) => setLeaveFormData({ ...leaveFormData, leaveType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASUAL">Casual</SelectItem>
                                    <SelectItem value="SICK">Sick</SelectItem>
                                    <SelectItem value="ANNUAL">Annual</SelectItem>
                                    <SelectItem value="MATERNITY">Maternity</SelectItem>
                                    <SelectItem value="PATERNITY">Paternity</SelectItem>
                                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div> */}

                        {/* Dates */}
                        <div>
                            <Label>Select Dates *</Label>
                            <Popover open={calOpen} onOpenChange={setCalOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start mt-1 font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {selectedDates.length === 0
                                            ? "Pick dates..."
                                            : `${selectedDates.length} date(s) selected`}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="multiple"
                                        selected={selectedDates}
                                        onSelect={(dates) => { setSelectedDates(dates || []); setDateError(""); }}
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateError && <p className="text-sm text-destructive mt-1">{dateError}</p>}
                        </div>

                        {/* Leave Type */}
                        <div>
                            <Label>Leave Type *</Label>
                            <Select
                                value={leaveFormData.leaveType}
                                onValueChange={(v) => setLeaveFormData({ ...leaveFormData, leaveType: v })}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASUAL">Casual Leave</SelectItem>
                                    <SelectItem value="SICK">Sick Leave</SelectItem>
                                    <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Balance indicator */}
                            {leaveFormData.personId && (
                                <div className="mt-1.5 text-xs text-muted-foreground">
                                    {balanceFetching ? "Loading balance..." : leaveBalance ? (() => {
                                        const b = leaveBalance[leaveFormData.leaveType];
                                        if (!b) return null;
                                        const remaining = b.allowed - b.taken;
                                        return (
                                            <span className={remaining <= 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                                                Used: {b.taken}/{b.allowed} · Remaining: {Math.max(0, remaining)}
                                            </span>
                                        );
                                    })() : null}
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div>
                            <Label>Reason *</Label>
                            <Textarea
                                value={leaveFormData.reason}
                                onChange={(e) =>
                                    setLeaveFormData({ ...leaveFormData, reason: e.target.value })
                                }
                                placeholder="Enter reason for leave..."
                                rows={3}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCreateDialogOpen(false);
                                    setLeaveFormData({ personId: "", personName: "", reason: "", leaveType: "CASUAL" });
                                    setSelectedDates([]);
                                    setDateError("");
                                    setCalOpen(false);
                                    setStaffSearch("");
                                    setComboOpen(false);
                                    setStaffError("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateLeave}>Create Leave Request</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this leave request? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default LeavesManagementDialog;

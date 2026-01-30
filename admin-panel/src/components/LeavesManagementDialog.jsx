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
import { Loader2, SaveAll, CheckCircle, Printer, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getLeaveSheet,
    upsertLeave,
    getAllStaff,
} from "../../config/apis";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus } from "lucide-react";

const LeavesManagementDialog = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [activeTab, setActiveTab] = useState("teacher");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState({
        personId: "",
        personName: "",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();

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
    const { data: staffList = [] } = useQuery({
        queryKey: ["allStaff"],
        queryFn: () => getAllStaff({ status: 'ACTIVE' }),
    });

    // Bulk save functionality
    const [isSaving, setIsSaving] = useState(false);

    const handleBulkSave = async () => {
        setIsSaving(true);
        try {
            for (const row of localData) {
                await upsertLeave({
                    leaveId: row.leaveId,
                    month,
                    startDate: row.startDate,
                    endDate: row.endDate,
                    days: row.days,
                    reason: row.reason || "",
                    status: row.status || "PENDING",
                    staffId: row.id,
                });
            }
            toast({ title: "All leave records saved successfully" });
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({
                title: error.message || "Failed to save leaves",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Checkbox selection state
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedRows(new Set(localData.map((_, index) => index)));
        } else {
            setSelectedRows(new Set());
        }
    };

    // Handle individual row selection
    const handleRowSelect = (index, checked) => {
        const newSelected = new Set(selectedRows);
        if (checked) {
            newSelected.add(index);
        } else {
            newSelected.delete(index);
        }
        setSelectedRows(newSelected);
    };

    // Bulk mark as approved
    const handleBulkMarkApproved = () => {
        const newData = [...localData];
        selectedRows.forEach((index) => {
            newData[index].status = "APPROVED";
        });
        setLocalData(newData);
        toast({ title: `${selectedRows.size} record(s) marked as APPROVED` });
    };

    // Bulk mark as rejected
    const handleBulkMarkRejected = () => {
        const newData = [...localData];
        selectedRows.forEach((index) => {
            newData[index].status = "REJECTED";
        });
        setLocalData(newData);
        toast({ title: `${selectedRows.size} record(s) marked as REJECTED` });
    };

    // Local state to handle input changes before saving
    const [localData, setLocalData] = useState([]);

    useEffect(() => {
        setLocalData(leaveData);
    }, [leaveData]);

    // Reset selections when data changes
    useEffect(() => {
        setSelectedRows(new Set());
    }, [localData.length, month, activeTab]);

    const handleInputChange = (index, field, value) => {
        const newData = [...localData];
        newData[index] = { ...newData[index], [field]: value };

        // Auto-calculate days if start and end dates are set
        if (
            (field === "startDate" || field === "endDate") &&
            newData[index].startDate &&
            newData[index].endDate
        ) {
            const start = new Date(newData[index].startDate);
            const end = new Date(newData[index].endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            newData[index].days = diffDays;
        }

        setLocalData(newData);
    };

    // Handle create leave
    const handleCreateLeave = async () => {
        if (
            !leaveFormData.personId ||
            !leaveFormData.startDate ||
            !leaveFormData.endDate ||
            !leaveFormData.reason
        ) {
            toast({
                title: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        try {
            const start = new Date(leaveFormData.startDate);
            const end = new Date(leaveFormData.endDate);
            const diffTime = Math.abs(end - start);
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const leaveMonth = leaveFormData.startDate.slice(0, 7); // YYYY-MM

            await upsertLeave({
                month: leaveMonth,
                startDate: leaveFormData.startDate,
                endDate: leaveFormData.endDate,
                days,
                reason: leaveFormData.reason,
                status: "PENDING",
                staffId: parseInt(leaveFormData.personId),
            });

            toast({ title: "Leave request created successfully" });
            setCreateDialogOpen(false);
            setLeaveFormData({
                personId: "",
                personName: "",
                startDate: "",
                endDate: "",
                reason: "",
            });
            queryClient.invalidateQueries(["leaveSheet", month, activeTab]);
            refetch();
        } catch (error) {
            toast({
                title: error.message || "Failed to create leave request",
                variant: "destructive",
            });
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

            <div className="flex items-center justify-end gap-2 mb-4">
                <Button
                    onClick={handleBulkMarkApproved}
                    disabled={selectedRows.size === 0}
                    variant="outline"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve ({selectedRows.size})
                </Button>
                <Button
                    onClick={handleBulkMarkRejected}
                    disabled={selectedRows.size === 0}
                    variant="outline"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject ({selectedRows.size})
                </Button>
                <Button onClick={handleBulkSave} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <SaveAll className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
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
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={
                                            selectedRows.size === localData.length &&
                                            localData.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="min-w-[200px]">
                                    Staff Details
                                </TableHead>
                                <TableHead className="min-w-[120px]">From Date</TableHead>
                                <TableHead className="min-w-[120px]">To Date</TableHead>
                                <TableHead className="min-w-[80px]">Days</TableHead>
                                <TableHead className="min-w-[200px]">Reason</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localData.map((row, index) => (
                                <TableRow key={`${row.id}-${index}`}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.has(index)}
                                            onCheckedChange={(checked) =>
                                                handleRowSelect(index, checked)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{row.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.designation}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.department}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            value={row.startDate?.split("T")[0] || ""}
                                            onChange={(e) =>
                                                handleInputChange(index, "startDate", e.target.value)
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            value={row.endDate?.split("T")[0] || ""}
                                            onChange={(e) =>
                                                handleInputChange(index, "endDate", e.target.value)
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.days}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={row.reason || ""}
                                            onChange={(e) =>
                                                handleInputChange(index, "reason", e.target.value)
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                row.status === "APPROVED"
                                                    ? "default"
                                                    : row.status === "REJECTED"
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const statuses = ["PENDING", "APPROVED", "REJECTED"];
                                                const currentIndex = statuses.indexOf(row.status);
                                                handleInputChange(
                                                    index,
                                                    "status",
                                                    statuses[(currentIndex + 1) % statuses.length]
                                                );
                                            }}
                                        >
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Create Leave Request Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Create Leave Request
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Person Selection */}
                        <div>
                            <Label>Select Staff Member *</Label>
                            <Select
                                value={leaveFormData.personId}
                                onValueChange={(value) => {
                                    const person = staffList.find((s) => s.id === parseInt(value));
                                    setLeaveFormData({
                                        ...leaveFormData,
                                        personId: value,
                                        personName: person?.name || "",
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {staffList
                                        .filter(p => p.status === "ACTIVE")
                                        .map((person) => (
                                            <SelectItem key={person.id} value={person.id.toString()}>
                                                {person.name} - {person.isTeaching ? (person.specialization || "Teacher") : (person.designation || "Staff")}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
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

                        {/* Start Date */}
                        <div>
                            <Label>From Date *</Label>
                            <Input
                                type="date"
                                value={leaveFormData.startDate}
                                onChange={(e) =>
                                    setLeaveFormData({
                                        ...leaveFormData,
                                        startDate: e.target.value,
                                    })
                                }
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <Label>To Date *</Label>
                            <Input
                                type="date"
                                value={leaveFormData.endDate}
                                onChange={(e) =>
                                    setLeaveFormData({
                                        ...leaveFormData,
                                        endDate: e.target.value,
                                    })
                                }
                            />
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
                                onClick={() => setCreateDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateLeave}>Create Leave Request</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
};

export default LeavesManagementDialog;

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
    getTeachers,
    getEmp,
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
        enabled: !!activeTab
    });

    // Fetch teachers and employees for the create form
    const { data: teachers = [] } = useQuery({
        queryKey: ["teachers"],
        queryFn: getTeachers,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ["employees"],
        queryFn: () => getEmp(""),
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
                    employeeId: activeTab === "employee" ? row.id : undefined,
                    teacherId: activeTab === "teacher" ? row.id : undefined,
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
                employeeId:
                    activeTab === "employee"
                        ? parseInt(leaveFormData.personId)
                        : undefined,
                teacherId:
                    activeTab === "teacher"
                        ? parseInt(leaveFormData.personId)
                        : undefined,
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
        <div className="max-w-[95vw] h-[90vh] flex flex-col">
            <div className="flex">
                <div className="flex items-center gap-4">
                    <Label>Select Month:</Label>
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-48"
                    />
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    variant="outline"
                    className="w-fit ml-auto mb-4"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Leave Request
                </Button>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4 ml-auto">

                <div className="flex gap-2">
                    <Button
                        onClick={handleBulkMarkApproved}
                        disabled={selectedRows.size === 0}
                        variant="outline"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Approved ({selectedRows.size})
                    </Button>
                    <Button
                        onClick={handleBulkMarkRejected}
                        disabled={selectedRows.size === 0}
                        variant="outline"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark as Rejected ({selectedRows.size})
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
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="teacher">Teachers</TabsTrigger>
                    <TabsTrigger value="employee">Staff (Non-Teaching)</TabsTrigger>
                </TabsList>

                <TabsContent
                    value={activeTab}
                    className="flex-1 overflow-auto border rounded-md"
                >
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
                                        Employee Details
                                    </TableHead>
                                    <TableHead className="min-w-[150px]">Start Date</TableHead>
                                    <TableHead className="min-w-[150px]">End Date</TableHead>
                                    <TableHead className="min-w-[80px]">Days</TableHead>
                                    <TableHead className="min-w-[250px]">Reason</TableHead>
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
                                            {row.startDate.split("T")[0]}
                                        </TableCell>
                                        <TableCell>
                                            {row.endDate.split("T")[0]}
                                        </TableCell>
                                        <TableCell>
                                            {row.days}
                                        </TableCell>
                                        <TableCell>
                                            {row.reason}
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
                                                    const newData = [...localData];
                                                    const statuses = ["PENDING", "APPROVED", "REJECTED"];
                                                    const currentIndex = statuses.indexOf(row.status);
                                                    newData[index].status =
                                                        statuses[(currentIndex + 1) % statuses.length];
                                                    setLocalData(newData);
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
                </TabsContent>
            </Tabs>

            {/* Create Leave Request Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Create Leave Request -{" "}
                            {activeTab === "teacher" ? "Teacher" : "Employee"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Person Selection */}
                        <div>
                            <Label>
                                {activeTab === "teacher" ? "Select Teacher" : "Select Employee"}{" "}
                                *
                            </Label>
                            <Select
                                value={leaveFormData.personId}
                                onValueChange={(value) => {
                                    const person =
                                        activeTab === "teacher"
                                            ? teachers.find((t) => t.id === parseInt(value))
                                            : employees.find((e) => e.id === parseInt(value));
                                    setLeaveFormData({
                                        ...leaveFormData,
                                        personId: value,
                                        personName: person?.name || "",
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={`Select ${activeTab === "teacher" ? "teacher" : "employee"
                                            }`}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {(activeTab === "teacher" ? teachers : employees)
                                        .filter(
                                            (p) =>
                                                p.status === "ACTIVE" || p.teacherStatus === "ACTIVE"
                                        )
                                        .map((person) => (
                                            <SelectItem key={person.id} value={person.id.toString()}>
                                                {person.name} -{" "}
                                                {person.specialization || person.designation}
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
            </Dialog>
        </div>
    );
};

export default LeavesManagementDialog;

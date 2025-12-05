import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, SaveAll, CheckCircle, XCircle, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayrollSheet, upsertPayroll } from "../../config/apis";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const PayrollManagementDialog = ({ open, onOpenChange }) => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("teacher");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: payrollData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["payrollSheet", month, activeTab],
    queryFn: () => getPayrollSheet(month, activeTab),
    enabled: open,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertPayroll,
    onSuccess: () => {
      toast({ title: "Payroll updated successfully" });
      queryClient.invalidateQueries(["payrollSheet", month, activeTab]);
      refetch();
    },
    onError: (err) => toast({ title: err.message, variant: "destructive" }),
  });

  // Bulk save functionality
  const [isSaving, setIsSaving] = useState(false);

  const handleBulkSave = async () => {
    setIsSaving(true);
    try {
      for (const row of localData) {
        await upsertMutation.mutate({
          id: row.payrollId,
          month,
          basicSalary: Number(row.basicSalary) || 0,
          securityDeduction: Number(row.securityDeduction) || 0,
          advanceDeduction: Number(row.advanceDeduction) || 0,
          absentDeduction: Number(row.absentDeduction) || 0,
          leaveDeduction: Number(row.leaveDeduction) || 0, // Added this line
          otherDeduction: Number(row.otherDeduction) || 0,
          extraAllowance: Number(row.extraAllowance) || 0,
          travelAllowance: Number(row.travelAllowance) || 0,
          otherAllowance: Number(row.otherAllowance) || 0,
          status: row.status || "UNPAID",
          employeeId: activeTab === "employee" ? row.id : undefined,
          teacherId: activeTab === "teacher" ? row.id : undefined,
        });
      }
      toast({ title: "All payroll records saved successfully" });
      queryClient.invalidateQueries(["payrollSheet", month, activeTab]);
      refetch();
    } catch (error) {
      toast({
        title: error.message || "Failed to save payrolls",
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

  // Bulk mark as paid
  const handleBulkMarkPaid = () => {
    const newData = [...localData];
    selectedRows.forEach((index) => {
      newData[index].status = "PAID";
    });
    setLocalData(newData);
    toast({ title: `${selectedRows.size} record(s) marked as PAID` });
  };

  // Bulk mark as unpaid
  const handleBulkMarkUnpaid = () => {
    const newData = [...localData];
    selectedRows.forEach((index) => {
      newData[index].status = "UNPAID";
    });
    setLocalData(newData);
    toast({ title: `${selectedRows.size} record(s) marked as UNPAID` });
  };

  // Print individual payslip
  const handlePrintPayslip = (row) => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Payslip - ${row.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        .company-name { font-size: 24px; font-weight: bold; }
                        .title { font-size: 18px; margin-top: 5px; }
                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total-row { display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; }
                        .net-salary { font-size: 20px; font-weight: bold; text-align: right; margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">Concordia College</div>
                        <div class="title">Payslip for ${new Date(
      month
    ).toLocaleString("default", {
      month: "long",
      year: "numeric",
    })}</div>
                    </div>
                    
                    <div class="details-grid">
                        <div>
                            <div class="row"><span>Name:</span> <strong>${row.name
      }</strong></div>
                            <div class="row"><span>Designation:</span> <strong>${row.designation
      }</strong></div>
                        </div>
                        <div>
                            <div class="row"><span>Department:</span> <strong>${row.department
      }</strong></div>
                            <div class="row"><span>Status:</span> <strong>${row.status
      }</strong></div>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div class="section">
                            <div class="section-title">Earnings</div>
                            <div class="row"><span>Basic Pay:</span> <span>${Number(
        row.basicSalary
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Extra Allowance:</span> <span>${Number(
        row.extraAllowance
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Travel Allowance:</span> <span>${Number(
        row.travelAllowance
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Other Allowance:</span> <span>${Number(
        row.otherAllowance
      ).toLocaleString()}</span></div>
                            <div class="total-row"><span>Total Earnings:</span> <span>${(
        Number(row.basicSalary) +
        Number(row.totalAllowances)
      ).toLocaleString()}</span></div>
                        </div>
                        <div class="section">
                            <div class="section-title">Deductions</div>
                            <div class="row"><span>Security:</span> <span>${Number(
        row.securityDeduction
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Advance:</span> <span>${Number(
        row.advanceDeduction
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Absent:</span> <span>${Number(
        row.absentDeduction
      ).toLocaleString()}</span></div>
                            <div class="row"><span>Other:</span> <span>${Number(
        row.otherDeduction
      ).toLocaleString()}</span></div>
                            <div class="total-row"><span>Total Deductions:</span> <span>${Number(
        row.totalDeductions
      ).toLocaleString()}</span></div>
                        </div>
                    </div>

                    <div class="net-salary">
                        Net Salary: PKR ${Number(
        row.netSalary
      ).toLocaleString()}
                    </div>
                    
                    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                        <div style="text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 5px;">Employee Signature</div>
                        <div style="text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 5px;">Authorized Signature</div>
                    </div>
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.print();
  };

  // Print monthly sheet
  const handlePrintMonth = () => {
    const printWindow = window.open("", "", "width=1000,height=800");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Payroll Sheet - ${new Date(month).toLocaleString(
      "default",
      { month: "long", year: "numeric" }
    )}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        h1 { margin: 0; font-size: 20px; }
                        h2 { margin: 5px 0; font-size: 16px; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
                        .text-right { text-align: right; }
                        .center { text-align: center; }
                        .total-row { font-weight: bold; background-color: #eee; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Concordia College</h1>
                        <h2>Payroll Sheet - ${activeTab === "teacher" ? "Teachers" : "Staff"
      }</h2>
                        <h3>${new Date(month).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}</h3>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Basic Pay</th>
                                <th>Total Allowances</th>
                                <th>Total Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${localData
        .map(
          (row) => `
                                <tr>
                                    <td>${row.name}</td>
                                    <td>${row.designation}</td>
                                    <td class="text-right">${Number(
            row.basicSalary
          ).toLocaleString()}</td>
                                    <td class="text-right">${Number(
            row.totalAllowances
          ).toLocaleString()}</td>
                                    <td class="text-right">${Number(
            row.totalDeductions
          ).toLocaleString()}</td>
                                    <td class="text-right"><strong>${Number(
            row.netSalary
          ).toLocaleString()}</strong></td>
                                    <td class="center">${row.status}</td>
                                </tr>
                            `
        )
        .join("")}
                            <tr class="total-row">
                                <td colspan="2">Total</td>
                                <td class="text-right">${localData
        .reduce(
          (sum, row) => sum + Number(row.basicSalary),
          0
        )
        .toLocaleString()}</td>
                                <td class="text-right">${localData
        .reduce(
          (sum, row) =>
            sum + Number(row.totalAllowances),
          0
        )
        .toLocaleString()}</td>
                                <td class="text-right">${localData
        .reduce(
          (sum, row) =>
            sum + Number(row.totalDeductions),
          0
        )
        .toLocaleString()}</td>
                                <td class="text-right">${localData
        .reduce(
          (sum, row) => sum + Number(row.netSalary),
          0
        )
        .toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.print();
  };

  // Local state to handle input changes before saving
  const [localData, setLocalData] = useState([]);

  useEffect(() => {
    if (payrollData && payrollData.length > 0) {
      // Ensure all numeric fields are properly initialized
      const initializedData = payrollData.map((row) => ({
        ...row,
        basicSalary: Number(row.basicSalary),
        securityDeduction: Number(row.securityDeduction),
        advanceDeduction: Number(row.advanceDeduction),
        absentDeduction: Number(row.absentDeduction),
        otherDeduction: Number(row.otherDeduction),
        totalDeductions: Number(row.totalDeductions),
        extraAllowance: Number(row.extraAllowance),
        travelAllowance: Number(row.travelAllowance),
        otherAllowance: Number(row.otherAllowance),
        totalAllowances: Number(row.totalAllowances),
        netSalary: Number(row.netSalary),
      }));
      setLocalData(initializedData);
    }
  }, [payrollData]);

  // Reset selections when data changes
  useEffect(() => {
    setSelectedRows(new Set());
  }, [localData.length, month, activeTab]);

  // Add this function after the other handler functions but before the return statement

  // Handle input changes and recalculate totals
  const handleInputChange = (index, field, value) => {
    const newData = [...localData];

    // Parse the value
    const numValue = Number(value) || 0;

    // Update the specific field
    newData[index][field] = numValue;

    // Recalculate totals based on what changed
    if (field === 'securityDeduction' || field === 'advanceDeduction' ||
      field === 'absentDeduction' || field === 'leaveDeduction' ||
      field === 'otherDeduction') {
      // Recalculate total deductions
      newData[index].totalDeductions =
        Number(newData[index].securityDeduction || 0) +
        Number(newData[index].advanceDeduction || 0) +
        Number(newData[index].absentDeduction || 0) +
        Number(newData[index].leaveDeduction || 0) +
        Number(newData[index].otherDeduction || 0);
    }
    else if (field === 'extraAllowance' || field === 'travelAllowance' ||
      field === 'otherAllowance') {
      // Recalculate total allowances
      newData[index].totalAllowances =
        Number(newData[index].extraAllowance || 0) +
        Number(newData[index].travelAllowance || 0) +
        Number(newData[index].otherAllowance || 0);
    }

    // Always recalculate net salary
    newData[index].netSalary =
      Number(newData[index].basicSalary || 0) -
      Number(newData[index].totalDeductions || 0) +
      Number(newData[index].totalAllowances || 0);

    // Ensure net salary is not negative (or handle as per your business logic)
    if (newData[index].netSalary < 0) {
      newData[index].netSalary = 0;
    }

    setLocalData(newData);
  };
  return (
    <div className="max-w-[95vw] h-[90vh] flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Label>Select Month:</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrintMonth} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Sheet
          </Button>
          <Button
            onClick={handleBulkMarkPaid}
            disabled={selectedRows.size === 0}
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark Paid ({selectedRows.size})
          </Button>
          <Button
            onClick={handleBulkMarkUnpaid}
            disabled={selectedRows.size === 0}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark Unpaid ({selectedRows.size})
          </Button>
          <Button onClick={handleBulkSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SaveAll className="mr-2 h-4 w-4" />
            )}
            Save All Payrolls
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList>
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
                  <TableHead className="min-w-[100px]">Basic Pay</TableHead>

                  {/* Deductions */}
                  <TableHead
                    className="text-center border-l-2 border-red-400 bg-red-100 dark:bg-red-950/40 dark:border-red-700"
                    colSpan={6}
                  >
                    Deductions (PKR)
                  </TableHead>

                  {/* Allowances */}
                  <TableHead
                    className="text-center border-l-2 border-green-400 bg-green-100 dark:bg-green-950/40 dark:border-green-700"
                    colSpan={4}
                  >
                    Allowances (PKR)
                  </TableHead>

                  <TableHead className="min-w-[100px] border-l font-bold">
                    Net Salary
                  </TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[50px]"></TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>

                  {/* Deduction Sub-headers */}
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                    Security
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                    Advance
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                    Absent
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                    Leave
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                    Other
                  </TableHead>
                  <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs font-bold border-r-2 border-red-400 dark:border-red-700">
                    Total
                  </TableHead>

                  {/* Allowance Sub-headers */}
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                    Extra
                  </TableHead>
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                    Travel
                  </TableHead>
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                    Other
                  </TableHead>
                  <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs font-bold border-r-2 border-green-400 dark:border-green-700">
                    Total
                  </TableHead>

                  <TableHead className="border-l"></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localData.map((row, index) => (
                  <TableRow key={row.id}>
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
                      {Number(row.basicSalary).toLocaleString()}
                    </TableCell>

                    {/* Deductions Inputs */}
                    <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.securityDeduction}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "securityDeduction",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.advanceDeduction}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "advanceDeduction",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.absentDeduction}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "absentDeduction",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.leaveDeduction || 0}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "leaveDeduction",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.otherDeduction}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "otherDeduction",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-red-100 dark:bg-red-950/30 font-medium text-red-700 dark:text-red-400 border-r-2 border-red-400 dark:border-red-700">
                      {Number(row.totalDeductions).toLocaleString()}
                    </TableCell>

                    {/* Allowances Inputs */}
                    <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.extraAllowance}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "extraAllowance",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.travelAllowance}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "travelAllowance",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                      <Input
                        type="number"
                        className="h-8 w-20"
                        value={row.otherAllowance}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "otherAllowance",
                            e.target.value
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="bg-green-100 dark:bg-green-950/30 font-medium text-green-700 dark:text-green-400 border-r-2 border-green-400 dark:border-green-700">
                      {Number(row.totalAllowances).toLocaleString()}
                    </TableCell>

                    <TableCell className="border-l font-bold">
                      {Number(row.netSalary).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "PAID" ? "default" : "destructive"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const newData = [...localData];
                          newData[index].status =
                            row.status === "PAID" ? "UNPAID" : "PAID";
                          setLocalData(newData);
                        }}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePrintPayslip(row)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PayrollManagementDialog;

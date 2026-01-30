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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, SaveAll, CheckCircle, XCircle, Printer, MoreHorizontal, Eye } from "lucide-react";


import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayrollSheet, upsertPayroll, getPayrollTemplates, getPayrollHistory } from "../../config/apis";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const PayrollManagementDialog = ({ open, onOpenChange }) => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState("all");
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

  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    if (open) {
      getPayrollTemplates().then(data => {
        console.log("Fetched Payroll Templates:", data);
        setTemplates(data);
      }).catch(console.error);
    }
  }, [open]);

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
          leaveDeduction: Number(row.leaveDeduction) || 0,
          otherDeduction: Number(row.otherDeduction) || 0,
          incomeTax: Number(row.incomeTax) || 0,
          eobi: Number(row.eobi) || 0,
          lateArrivalDeduction: Number(row.lateArrivalDeduction) || 0,
          extraAllowance: Number(row.extraAllowance) || 0,
          travelAllowance: Number(row.travelAllowance) || 0,
          houseRentAllowance: Number(row.houseRentAllowance) || 0,
          medicalAllowance: Number(row.medicalAllowance) || 0,
          insuranceAllowance: Number(row.insuranceAllowance) || 0,
          otherAllowance: Number(row.otherAllowance) || 0,
          status: row.status || "UNPAID",
          staffId: row.id,
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
    let updatedCount = 0;
    selectedRows.forEach((index) => {
      if (localData[index].status !== "PAID") {
        newData[index].status = "UNPAID";
        updatedCount++;
      }
    });
    setLocalData(newData);
    if (updatedCount < selectedRows.size) {
      toast({
        title: "Bulk update partial",
        description: `${updatedCount} records marked as UNPAID. ${selectedRows.size - updatedCount} PAID records skipped.`,
        variant: "warning"
      });
    } else {
      toast({ title: `${selectedRows.size} record(s) marked as UNPAID` });
    }
  };

  // Preview state
  const [previewHtml, setPreviewHtml] = useState(null);

  // Print individual payslip (Salary Slip)
  const handlePrintPayslip = (row) => {
    // 1. Try Specific (Default)
    let template = templates.find(t => (t.type || '').toUpperCase().includes('SLIP') && t.isDefault);

    // 2. Try Specific (Any)
    if (!template) {
      template = templates.find(t => (t.type || '').toUpperCase().includes('SLIP'));
    }

    // 3. Fallback to ANY template if nothing else works (Fail-safe)
    if (!template && templates.length > 0) {
      console.warn("No 'SLIP' template found. Falling back to first available template.");
      template = templates[0];
    }

    console.log("Selected Template:", template);

    const htmlContent = generatePayslipHtml(template, row, "Salary Slip");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePreviewPayslip = (row) => {
    // 1. Try Specific (Default)
    let template = templates.find(t => (t.type || '').toUpperCase().includes('SLIP') && t.isDefault);

    // 2. Try Specific (Any)
    if (!template) {
      template = templates.find(t => (t.type || '').toUpperCase().includes('SLIP'));
    }

    // 3. Fallback to ANY template if nothing else works (Fail-safe)
    if (!template && templates.length > 0) {
      console.warn("No 'SLIP' template found. Falling back to first available template.");
      template = templates[0];
    }

    const htmlContent = generatePayslipHtml(template, row, "Salary Slip Preview");
    setPreviewHtml(htmlContent);
  };

  const generatePayslipHtml = (template, row, title) => {
    let htmlContent = "";
    if (template) {
      let content = template.htmlContent || "";
      // Basic check if it looks like HTML
      if (!content.trim().startsWith("<")) {
        content = `<div style="white-space: pre-wrap; font-family: monospace;">${content}</div>`;
      }

      htmlContent = content
        .replace(/{{name}}/g, row.name)
        .replace(/{{id}}/g, row.id)
        .replace(/{{designation}}/g, row.designation)
        .replace(/{{department}}/g, row.department)
        .replace(/{{month}}/g, new Date(month).toLocaleString("default", { month: "long", year: "numeric" }))
        .replace(/{{basicSalary}}/g, Number(row.basicSalary).toLocaleString())
        .replace(/{{securityDeduction}}/g, Number(row.securityDeduction).toLocaleString())
        .replace(/{{advanceDeduction}}/g, Number(row.advanceDeduction).toLocaleString())
        .replace(/{{absentDeduction}}/g, Number(row.absentDeduction).toLocaleString())
        .replace(/{{leaveDeduction}}/g, Number(row.leaveDeduction).toLocaleString())
        .replace(/{{otherDeduction}}/g, Number(row.otherDeduction).toLocaleString())
        .replace(/{{incomeTax}}/g, Number(row.incomeTax).toLocaleString())
        .replace(/{{eobi}}/g, Number(row.eobi).toLocaleString())
        .replace(/{{lateArrivalDeduction}}/g, Number(row.lateArrivalDeduction).toLocaleString())
        .replace(/{{totalDeductions}}/g, Number(row.totalDeductions).toLocaleString())
        .replace(/{{extraAllowance}}/g, Number(row.extraAllowance).toLocaleString())
        .replace(/{{travelAllowance}}/g, Number(row.travelAllowance).toLocaleString())
        .replace(/{{houseRentAllowance}}/g, Number(row.houseRentAllowance).toLocaleString())
        .replace(/{{medicalAllowance}}/g, Number(row.medicalAllowance).toLocaleString())
        .replace(/{{insuranceAllowance}}/g, Number(row.insuranceAllowance).toLocaleString())
        .replace(/{{otherAllowance}}/g, Number(row.otherAllowance).toLocaleString())
        .replace(/{{totalAllowances}}/g, Number(row.totalAllowances).toLocaleString())
        .replace(/{{netSalary}}/g, Number(row.netSalary).toLocaleString())
        .replace(/{{status}}/g, row.status)
        .replace(/{{paymentDate}}/g, row.paymentDate || "N/A");
    } else {
      htmlContent = `
            <html>
                <head><title>${title}</title></head>
                <body>
                    <div style="text-align: center; padding: 20px;">
                        <h1>${title}</h1>
                        <p style="color: red; font-weight: bold;">CRITICAL ERROR: No Template Object Selected.</p>
                        <p>We tried finding 'SLIP'. We tried falling back to [0]. Nothing worked.</p>
                        <p>Employee: ${row.name}</p>
                        <hr/>
                        <p style="color: grey; font-size: 12px; white-space: pre-wrap; text-align: left;">
                            Debug Info:<br/>
                            Templates Loaded: ${templates.length}<br/>
                            Raw Data: ${JSON.stringify(templates, null, 2)}
                        </p>
                    </div>
                </body>
            </html>
        `;
    }
    return htmlContent;
  }

  // Payroll Print (History)
  const handlePrintPayrollDetails = async (row) => {
    try {
      const historyData = await getPayrollHistory(row.id, row.isTeaching ? 'teacher' : 'all');

      let template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET') && t.isDefault);
      if (!template) {
        template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET'));
      }
      if (!template && templates.length > 0) {
        template = templates[0];
      }

      const htmlContent = generateSheetHtml(template, historyData, `Payroll History - ${row.name}`);

      const printWindow = window.open("", "", "width=1000,height=800");
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Wait for images/styles to load then print
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error("Failed to fetch payroll history", error);
      toast({ title: "Failed to load history", variant: "destructive" });
    }
  };

  const printTemplate = (template, row, title) => {
    // Deprecated in favor of generatePayslipHtml separation
  }




  // Print monthly sheet
  const handlePrintMonth = () => {
    let template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET') && t.isDefault);
    if (!template) {
      template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET'));
    }
    if (!template && templates.length > 0) {
      template = templates[0];
    }
    const htmlContent = generateSheetHtml(template);

    const printWindow = window.open("", "", "width=1000,height=800");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePreviewSheet = () => {
    let template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET') && t.isDefault);
    if (!template) {
      template = templates.find(t => (t.type || '').toUpperCase().includes('SHEET'));
    }
    if (!template && templates.length > 0) {
      template = templates[0];
    }
    const htmlContent = generateSheetHtml(template);
    setPreviewHtml(htmlContent);
  };

  const generateSheetHtml = (template, data = null, customTitle = null) => {
    // data allows overriding (e.g. for history print)
    const rowsData = data || localData;
    const title = customTitle || new Date(month).toLocaleString("default", { month: "long", year: "numeric" });

    // Generate rows HTML
    const rowsHtml = rowsData.map((row, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${row.name}</td>
        <td>${row.designation}</td>
        <td class="text-right">${Number(row.basicSalary).toLocaleString()}</td>
        <td class="text-right">${Number(row.totalAllowances).toLocaleString()}</td>
        <td class="text-right">${Number(row.totalDeductions).toLocaleString()}</td>
        <td class="text-right"><strong>${Number(row.netSalary).toLocaleString()}</strong></td>
      </tr>
    `).join("");

    let htmlContent = "";
    if (template) {
      let content = template.htmlContent || "";
      if (!content.trim().startsWith("<")) {
        content = `<div style="white-space: pre-wrap; font-family: monospace;">${content}</div>`;
      }

      htmlContent = content
        .replace(/{{month}}/g, title) // Use title instead of month for flexibility
        .replace(/{{rows}}/g, rowsHtml)
        .replace(/{{totalBasicSalary}}/g, rowsData.reduce((sum, row) => sum + Number(row.basicSalary), 0).toLocaleString())
        .replace(/{{totalAllowances}}/g, rowsData.reduce((sum, row) => sum + Number(row.totalAllowances), 0).toLocaleString())
        .replace(/{{totalDeductions}}/g, rowsData.reduce((sum, row) => sum + Number(row.totalDeductions), 0).toLocaleString())
        .replace(/{{totalNetSalary}}/g, rowsData.reduce((sum, row) => sum + Number(row.netSalary), 0).toLocaleString());
    } else {
      // Fallback
      htmlContent = `
            <html>
                <head><title>Payroll Sheet</title></head>
                <body>
                    <div style="text-align: center; padding: 20px;">
                        <h1>Payroll Sheet - ${new Date(month).toLocaleString("default", { month: "long", year: "numeric" })}</h1>
                        <p style="color: red;">CRITICAL ERROR: No Template Found.</p>
                        <hr/>
                        <p style="color: gray; font-size: 10px; white-space: pre-wrap; text-align: left;">
                            <strong>Debug Info:</strong><br/>
                            Loaded Templates: ${templates.length}<br/>
                            Raw Data: ${JSON.stringify(templates, null, 2)}
                        </p>
                    </div>
                </body>
            </html>
        `;
    }
    return htmlContent;
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
        leaveDeduction: Number(row.leaveDeduction),
        otherDeduction: Number(row.otherDeduction),
        incomeTax: Number(row.incomeTax),
        eobi: Number(row.eobi),
        lateArrivalDeduction: Number(row.lateArrivalDeduction),
        totalDeductions: Number(row.totalDeductions),
        extraAllowance: Number(row.extraAllowance),
        travelAllowance: Number(row.travelAllowance),
        houseRentAllowance: Number(row.houseRentAllowance),
        medicalAllowance: Number(row.medicalAllowance),
        insuranceAllowance: Number(row.insuranceAllowance),
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
    if (['securityDeduction', 'advanceDeduction', 'absentDeduction', 'leaveDeduction', 'otherDeduction', 'incomeTax', 'eobi', 'lateArrivalDeduction'].includes(field)) {
      newData[index].totalDeductions =
        Number(newData[index].securityDeduction || 0) +
        Number(newData[index].advanceDeduction || 0) +
        Number(newData[index].absentDeduction || 0) +
        Number(newData[index].leaveDeduction || 0) +
        Number(newData[index].otherDeduction || 0) +
        Number(newData[index].incomeTax || 0) +
        Number(newData[index].eobi || 0) +
        Number(newData[index].lateArrivalDeduction || 0);
    }
    else if (['extraAllowance', 'travelAllowance', 'otherAllowance', 'houseRentAllowance', 'medicalAllowance', 'insuranceAllowance'].includes(field)) {
      newData[index].totalAllowances =
        Number(newData[index].extraAllowance || 0) +
        Number(newData[index].travelAllowance || 0) +
        Number(newData[index].otherAllowance || 0) +
        Number(newData[index].houseRentAllowance || 0) +
        Number(newData[index].medicalAllowance || 0) +
        Number(newData[index].insuranceAllowance || 0);
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
        <div className="flex gap-2 ml-auto">
          <Button onClick={handlePrintMonth} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Sheet
          </Button>
          <Button onClick={handlePreviewSheet} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Sheet
          </Button>
          <Button
            onClick={handleBulkMarkPaid}
            disabled={selectedRows.size === 0}
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Paid ({selectedRows.size})
          </Button>
          <Button
            onClick={handleBulkMarkUnpaid}
            disabled={selectedRows.size === 0}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Unpaid ({selectedRows.size})
          </Button>
          <Button onClick={handleBulkSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SaveAll className="mr-2 h-4 w-4" />
            )}
            Save All
          </Button>
        </div>
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
                <TableHead className="min-w-[100px]">Basic Pay</TableHead>

                <TableHead
                  className="text-center border-l-2 border-red-400 bg-red-100 dark:bg-red-950/40 dark:border-red-700"
                  colSpan={9}
                >
                  Deductions (PKR)
                </TableHead>

                <TableHead
                  className="text-center border-l-2 border-green-400 bg-green-100 dark:bg-green-950/40 dark:border-green-700"
                  colSpan={7}
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
                <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                  Tax
                </TableHead>
                <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                  EOBI
                </TableHead>
                <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs border-r border-red-200 dark:border-red-800">
                  Late
                </TableHead>
                <TableHead className="bg-red-100 dark:bg-red-950/40 text-xs font-bold border-r-2 border-red-400 dark:border-red-700">
                  Total
                </TableHead>

                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  Extra
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  Travel
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  Other
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  House Rent
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  Medical
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/40 text-xs border-r border-green-200 dark:border-green-800">
                  Insurance
                </TableHead>
                <TableHead className="bg-green-100 dark:bg-green-950/30 text-xs font-bold border-r-2 border-green-400 dark:border-green-700">
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "otherDeduction",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.incomeTax}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "incomeTax",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.eobi}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "eobi",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-red-50 dark:bg-red-950/20 border-r border-red-200 dark:border-red-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.lateArrivalDeduction}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "lateArrivalDeduction",
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
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
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "otherAllowance",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.houseRentAllowance}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "houseRentAllowance",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.medicalAllowance}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "medicalAllowance",
                          e.target.value
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="bg-green-50 dark:bg-green-950/20 border-r border-green-200 dark:border-green-800">
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={row.insuranceAllowance}
                      disabled={row.status === "PAID"}
                      onChange={(e) =>
                        handleInputChange(
                          index,
                          "insuranceAllowance",
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
                      className={row.status === "PAID" ? "opacity-80 shadow-none" : "cursor-pointer"}
                      onClick={() => {
                        if (row.status === "PAID") return;
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePrintPayslip(row)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print Salary Slip
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePrintPayrollDetails(row)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Payroll Print
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePreviewPayslip(row)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Preview Slip
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payslip Preview</DialogTitle>
          </DialogHeader>
          <div dangerouslySetInnerHTML={{ __html: previewHtml || "" }} />
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default PayrollManagementDialog;

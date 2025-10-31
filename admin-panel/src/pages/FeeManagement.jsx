import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import { useState } from "react";
import { DollarSign, Plus, CheckCircle2, Edit, Trash2, Receipt, TrendingUp, Layers, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
const FeeManagement = () => {
  const {
    students,
    fees,
    addFee,
    updateFee,
    deleteFee,
    feeHeads,
    addFeeHead,
    updateFeeHead,
    deleteFeeHead,
    feeStructures,
    addFeeStructure,
    updateFeeStructure,
    deleteFeeStructure
  } = useData();
  const {
    toast
  } = useToast();
  const [challanOpen, setChallanOpen] = useState(false);
  const [feeHeadOpen, setFeeHeadOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingFeeHead, setEditingFeeHead] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [challanForm, setChallanForm] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    discount: "",
    remarks: ""
  });
  const [feeHeadForm, setFeeHeadForm] = useState({
    name: "",
    description: "",
    amount: "",
    isDiscount: false
  });
  const [structureForm, setStructureForm] = useState({
    program: "",
    className: "",
    feeHeads: [],
    installments: ""
  });
  const handleSubmitChallan = () => {
    if (!challanForm.studentId || !challanForm.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    const amount = parseFloat(challanForm.amount);
    const discount = parseFloat(challanForm.discount) || 0;
    if (editingChallan) {
      updateFee(editingChallan.id, {
        studentId: challanForm.studentId,
        amount,
        dueDate: challanForm.dueDate,
        discount,
        remarks: challanForm.remarks
      });
      toast({
        title: "Challan updated successfully"
      });
    } else {
      addFee({
        studentId: challanForm.studentId,
        challanNumber: `CH-${Date.now()}`,
        amount,
        dueDate: challanForm.dueDate,
        status: "pending",
        fineAmount: 0,
        discount,
        paidAmount: 0,
        remarks: challanForm.remarks
      });
      toast({
        title: "Challan created successfully"
      });
    }
    setChallanOpen(false);
    resetChallanForm();
  };
  const handleSubmitFeeHead = () => {
    if (!feeHeadForm.name || !feeHeadForm.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingFeeHead) {
      updateFeeHead(editingFeeHead.id, {
        name: feeHeadForm.name,
        description: feeHeadForm.description,
        amount: parseFloat(feeHeadForm.amount),
        isDiscount: feeHeadForm.isDiscount
      });
      toast({
        title: "Fee head updated successfully"
      });
    } else {
      addFeeHead({
        name: feeHeadForm.name,
        description: feeHeadForm.description,
        amount: parseFloat(feeHeadForm.amount),
        isDiscount: feeHeadForm.isDiscount
      });
      toast({
        title: "Fee head created successfully"
      });
    }
    setFeeHeadOpen(false);
    resetFeeHeadForm();
  };
  const handleSubmitStructure = () => {
    if (!structureForm.program || !structureForm.className || structureForm.feeHeads.length === 0) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    const totalAmount = structureForm.feeHeads.reduce((sum, headId) => {
      const head = feeHeads.find(h => h.id === headId);
      return sum + (head?.amount || 0);
    }, 0);
    if (editingStructure) {
      updateFeeStructure(editingStructure.id, {
        program: structureForm.program,
        className: structureForm.className,
        feeHeads: structureForm.feeHeads,
        totalAmount,
        installments: parseInt(structureForm.installments) || 1
      });
      toast({
        title: "Fee structure updated successfully"
      });
    } else {
      addFeeStructure({
        program: structureForm.program,
        className: structureForm.className,
        feeHeads: structureForm.feeHeads,
        totalAmount,
        installments: parseInt(structureForm.installments) || 1
      });
      toast({
        title: "Fee structure created successfully"
      });
    }
    setStructureOpen(false);
    resetStructureForm();
  };
  const handlePayment = (feeId, amount) => {
    const fee = fees.find(f => f.id === feeId);
    if (!fee) return;
    const payAmount = amount || fee.amount - fee.discount + fee.fineAmount;
    updateFee(feeId, {
      status: "paid",
      paidDate: new Date().toISOString().split("T")[0],
      paidAmount: payAmount
    });
    toast({
      title: "Payment recorded successfully"
    });
  };
  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "fee") {
      deleteFee(itemToDelete.id);
      toast({
        title: "Challan deleted"
      });
    } else if (itemToDelete.type === "feeHead") {
      deleteFeeHead(itemToDelete.id);
      toast({
        title: "Fee head deleted"
      });
    } else if (itemToDelete.type === "structure") {
      deleteFeeStructure(itemToDelete.id);
      toast({
        title: "Fee structure deleted"
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  const resetChallanForm = () => {
    setChallanForm({
      studentId: "",
      amount: "",
      dueDate: "",
      discount: "",
      remarks: ""
    });
    setEditingChallan(null);
  };
  const resetFeeHeadForm = () => {
    setFeeHeadForm({
      name: "",
      description: "",
      amount: "",
      isDiscount: false
    });
    setEditingFeeHead(null);
  };
  const resetStructureForm = () => {
    setStructureForm({
      program: "",
      className: "",
      feeHeads: [],
      installments: ""
    });
    setEditingStructure(null);
  };
  const printChallan = feeId => {
    const fee = fees.find(f => f.id === feeId);
    const student = students.find(s => s.id === fee?.studentId);
    if (!fee || !student) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Challan - ${fee.challanNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .challan-box { border: 2px solid #000; padding: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEE CHALLAN</h1>
            <p>Challan No: ${fee.challanNumber}</p>
          </div>
          <div class="challan-box">
            <div class="row"><span class="label">Student Name:</span> <span>${student.name}</span></div>
            <div class="row"><span class="label">Registration No:</span> <span>${student.rollNumber}</span></div>
            <div class="row"><span class="label">Class:</span> <span>${student.class}</span></div>
            <div class="row"><span class="label">Amount:</span> <span>PKR ${fee.amount.toLocaleString()}</span></div>
            <div class="row"><span class="label">Discount:</span> <span>PKR ${fee.discount}</span></div>
            <div class="row"><span class="label">Net Amount:</span> <span>PKR ${(fee.amount - fee.discount).toLocaleString()}</span></div>
            <div class="row"><span class="label">Due Date:</span> <span>${fee.dueDate}</span></div>
            <div class="row"><span class="label">Status:</span> <span>${fee.status.toUpperCase()}</span></div>
            ${fee.remarks ? `<div class="row"><span class="label">Remarks:</span> <span>${fee.remarks}</span></div>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function () {
      printWindow.print();
    };
  };
  const printFeeStructure = structureId => {
    const structure = feeStructures.find(s => s.id === structureId);
    if (!structure) return;
    const heads = structure.feeHeads.map(headId => feeHeads.find(h => h.id === headId)).filter(Boolean);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Structure - ${structure.program} ${structure.className}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; }
            .total { font-weight: bold; font-size: 18px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FEE STRUCTURE</h1>
            <h2>${structure.program} - ${structure.className}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fee Head</th>
                <th>Description</th>
                <th>Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${heads.map(head => `
                <tr>
                  <td>${head.name}</td>
                  <td>${head.description}</td>
                  <td>${head.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="2">Total Amount</td>
                <td>PKR ${structure.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2">Installments</td>
                <td>${structure.installments}</td>
              </tr>
              <tr>
                <td colspan="2">Per Installment</td>
                <td>PKR ${(structure.totalAmount / structure.installments).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function () {
      printWindow.print();
    };
  };
  const totalReceived = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalPending = fees.reduce((sum, f) => sum + (f.status !== "paid" ? f.amount - f.discount + f.fineAmount : 0), 0);
  const totalDiscount = fees.reduce((sum, f) => sum + f.discount, 0);
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium flex-1">
            <h2 className="text-2xl font-bold mb-2">Fee Management</h2>
            <p className="text-primary-foreground/90">Comprehensive fee tracking and management system</p>
          </div>
        </div>

        <Tabs defaultValue="challans" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="challans"><Receipt className="w-4 h-4 mr-2" />Challans</TabsTrigger>
            <TabsTrigger value="feeheads"><Layers className="w-4 h-4 mr-2" />Fee Heads</TabsTrigger>
            <TabsTrigger value="structures"><TrendingUp className="w-4 h-4 mr-2" />Fee Structures</TabsTrigger>
            <TabsTrigger value="reports"><DollarSign className="w-4 h-4 mr-2" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="challans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Received</p>
                      <p className="text-2xl font-bold text-success">PKR {(totalReceived / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-warning">PKR {(totalPending / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Discount</p>
                      <p className="text-2xl font-bold text-primary">PKR {(totalDiscount / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Challans</CardTitle>
                  <Button onClick={() => {
                  resetChallanForm();
                  setChallanOpen(true);
                }} className="gap-2">
                    <Plus className="w-4 h-4" />Create Challan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map(fee => {
                      const student = students.find(s => s.id === fee.studentId);
                      return <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.challanNumber}</TableCell>
                          <TableCell>{student?.name}</TableCell>
                          <TableCell>PKR {fee.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-primary">-PKR {fee.discount}</TableCell>
                          <TableCell className="text-success">PKR {fee.paidAmount}</TableCell>
                          <TableCell>{fee.dueDate}</TableCell>
                          <TableCell>
                            <Badge variant={fee.status === "paid" ? "default" : fee.status === "overdue" ? "destructive" : "secondary"}>
                              {fee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => printChallan(fee.id)}>
                                <Printer className="w-4 h-4" />
                              </Button>
                              {fee.status !== "paid" && <Button size="sm" variant="outline" onClick={() => handlePayment(fee.id)}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>}
                              <Button size="sm" variant="outline" onClick={() => {
                              setEditingChallan(fee);
                              setChallanForm({
                                studentId: fee.studentId,
                                amount: fee.amount.toString(),
                                dueDate: fee.dueDate,
                                discount: fee.discount.toString(),
                                remarks: fee.remarks || ""
                              });
                              setChallanOpen(true);
                            }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                              setItemToDelete({
                                type: "fee",
                                id: fee.id
                              });
                              setDeleteDialogOpen(true);
                            }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>;
                    })}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feeheads" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Heads</CardTitle>
                  <Button onClick={() => {
                  resetFeeHeadForm();
                  setFeeHeadOpen(true);
                }} className="gap-2">
                    <Plus className="w-4 h-4" />Add Fee Head
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeHeads.map(head => <TableRow key={head.id}>
                        <TableCell className="font-medium">{head.name}</TableCell>
                        <TableCell>{head.description}</TableCell>
                        <TableCell>PKR {head.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={head.isDiscount ? "secondary" : "default"}>
                            {head.isDiscount ? "Discount" : "Charge"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                            setEditingFeeHead(head);
                            setFeeHeadForm({
                              name: head.name,
                              description: head.description,
                              amount: head.amount.toString(),
                              isDiscount: head.isDiscount
                            });
                            setFeeHeadOpen(true);
                          }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "feeHead",
                              id: head.id
                            });
                            setDeleteDialogOpen(true);
                          }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structures" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Structures</CardTitle>
                  <Button onClick={() => {
                  resetStructureForm();
                  setStructureOpen(true);
                }} className="gap-2">
                    <Plus className="w-4 h-4" />Add Structure
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.map(structure => <TableRow key={structure.id}>
                        <TableCell><Badge>{structure.program}</Badge></TableCell>
                        <TableCell>{structure.className}</TableCell>
                        <TableCell className="font-semibold">PKR {structure.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{structure.installments}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => printFeeStructure(structure.id)}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                            setEditingStructure(structure);
                            setStructureForm({
                              program: structure.program,
                              className: structure.className,
                              feeHeads: structure.feeHeads,
                              installments: structure.installments.toString()
                            });
                            setStructureOpen(true);
                          }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                            setItemToDelete({
                              type: "structure",
                              id: structure.id
                            });
                            setDeleteDialogOpen(true);
                          }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-6">
              <Card>
                <CardHeader><CardTitle>Fee Collection Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between p-4 border rounded-lg">
                      <span>Total Revenue</span>
                      <span className="font-bold text-2xl">PKR {totalReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 border rounded-lg">
                      <span>Outstanding</span>
                      <span className="font-bold text-2xl text-warning">PKR {totalPending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 border rounded-lg">
                      <span>Total Discounts Given</span>
                      <span className="font-bold text-2xl text-primary">PKR {totalDiscount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={challanOpen} onOpenChange={setChallanOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChallan ? "Edit" : "Create"} Fee Challan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={challanForm.studentId} onValueChange={v => setChallanForm({
                ...challanForm,
                studentId: v
              })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.rollNumber} - {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (PKR)</Label>
                  <Input type="number" value={challanForm.amount} onChange={e => setChallanForm({
                  ...challanForm,
                  amount: e.target.value
                })} />
                </div>
                <div className="space-y-2">
                  <Label>Discount (PKR)</Label>
                  <Input type="number" value={challanForm.discount} onChange={e => setChallanForm({
                  ...challanForm,
                  discount: e.target.value
                })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={challanForm.dueDate} onChange={e => setChallanForm({
                ...challanForm,
                dueDate: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea value={challanForm.remarks} onChange={e => setChallanForm({
                ...challanForm,
                remarks: e.target.value
              })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setChallanOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitChallan}>{editingChallan ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={feeHeadOpen} onOpenChange={setFeeHeadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFeeHead ? "Edit" : "Add"} Fee Head</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={feeHeadForm.name} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                name: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={feeHeadForm.description} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                description: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Amount (PKR)</Label>
                <Input type="number" value={feeHeadForm.amount} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                amount: e.target.value
              })} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isDiscount" checked={feeHeadForm.isDiscount} onChange={e => setFeeHeadForm({
                ...feeHeadForm,
                isDiscount: e.target.checked
              })} className="w-4 h-4" />
                <Label htmlFor="isDiscount">Is Discount</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setFeeHeadOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitFeeHead}>{editingFeeHead ? "Update" : "Add"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={structureOpen} onOpenChange={setStructureOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStructure ? "Edit" : "Add"} Fee Structure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={structureForm.program} onValueChange={v => setStructureForm({
                  ...structureForm,
                  program: v
                })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HSSC">HSSC</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="BS">BS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Input value={structureForm.className} onChange={e => setStructureForm({
                  ...structureForm,
                  className: e.target.value
                })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Installments</Label>
                <Input type="number" value={structureForm.installments} onChange={e => setStructureForm({
                ...structureForm,
                installments: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Fee Heads</Label>
                {feeHeads.map(head => <div key={head.id} className="flex items-center space-x-2">
                    <input type="checkbox" checked={structureForm.feeHeads.includes(head.id)} onChange={e => {
                  if (e.target.checked) {
                    setStructureForm({
                      ...structureForm,
                      feeHeads: [...structureForm.feeHeads, head.id]
                    });
                  } else {
                    setStructureForm({
                      ...structureForm,
                      feeHeads: structureForm.feeHeads.filter(id => id !== head.id)
                    });
                  }
                }} className="w-4 h-4" />
                    <Label>{head.name} - PKR {head.amount}</Label>
                  </div>)}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStructureOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitStructure}>{editingStructure ? "Update" : "Add"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>;
};
export default FeeManagement;
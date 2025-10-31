import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Pencil, Trash2, DollarSign, TrendingUp, AlertCircle, ClipboardList, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "../components/ui/badge";
const Inventory = () => {
  const {
    schoolInventory,
    inventoryExpenses,
    addSchoolInventory,
    updateSchoolInventory,
    deleteSchoolInventory,
    addInventoryExpense,
    updateInventoryExpense,
    deleteInventoryExpense,
    addFinanceExpense
  } = useData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isExpenseEditOpen, setIsExpenseEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [formData, setFormData] = useState({
    itemName: "",
    category: "Lab Equipment",
    quantity: 0,
    unitPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: "",
    condition: "New",
    location: "",
    assignedTo: "Unassigned",
    assignedToName: "",
    warrantyExpiry: "",
    description: ""
  });
  const [expenseData, setExpenseData] = useState({
    expenseType: "Maintenance",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: "",
    vendor: ""
  });
  const categories = ["Lab Equipment", "Sports Equipment", "Library Books", "Office Supplies", "Computer Equipment", "Furniture", "Teaching Aids", "Other"];
  const conditions = ["New", "Good", "Fair", "Needs Repair", "Damaged"];
  const assignmentTypes = ["Class", "Department", "Lab", "Unassigned"];
  const expenseTypes = ["Maintenance", "Repair", "Upgrade", "Replacement", "Other"];
  const handleAddItem = () => {
    if (!formData.itemName || !formData.supplier || !formData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const totalValue = formData.quantity * formData.unitPrice;
    const newItem = {
      ...formData,
      totalValue,
      assignedDate: formData.assignedTo !== "Unassigned" ? new Date().toISOString().split('T')[0] : undefined
    };
    addSchoolInventory(newItem);
    addFinanceExpense({
      date: formData.purchaseDate,
      category: "Inventory Purchase",
      description: `${formData.itemName} - ${formData.quantity} units from ${formData.supplier}`,
      amount: totalValue
    });
    toast({
      title: "Success",
      description: "Inventory item added and recorded in finance"
    });
    resetForm();
    setIsAddOpen(false);
  };
  const handleEditItem = () => {
    if (!selectedItem) return;
    const totalValue = formData.quantity * formData.unitPrice;
    updateSchoolInventory(selectedItem.id, {
      ...formData,
      totalValue
    });
    toast({
      title: "Success",
      description: "Inventory item updated successfully"
    });
    resetForm();
    setIsEditOpen(false);
    setSelectedItem(null);
  };
  const handleAssignItem = () => {
    if (!selectedItem) return;
    if (formData.assignedTo !== "Unassigned" && !formData.assignedToName) {
      toast({
        title: "Error",
        description: "Please enter assignment details",
        variant: "destructive"
      });
      return;
    }
    updateSchoolInventory(selectedItem.id, {
      assignedTo: formData.assignedTo,
      assignedToName: formData.assignedToName || undefined,
      assignedDate: formData.assignedTo !== "Unassigned" ? new Date().toISOString().split('T')[0] : undefined
    });
    toast({
      title: "Success",
      description: `Item ${formData.assignedTo === "Unassigned" ? "unassigned" : "assigned"} successfully`
    });
    setIsAssignOpen(false);
    setSelectedItem(null);
  };
  const handleAddExpense = () => {
    if (!selectedItem || !expenseData.description || expenseData.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const newExpense = {
      inventoryItemId: selectedItem.id,
      itemName: selectedItem.itemName,
      ...expenseData
    };
    addInventoryExpense(newExpense);
    addFinanceExpense({
      date: expenseData.date,
      category: `Inventory ${expenseData.expenseType}`,
      description: `${selectedItem.itemName} - ${expenseData.description}`,
      amount: expenseData.amount
    });
    const currentMaintenance = selectedItem.maintenanceCost || 0;
    updateSchoolInventory(selectedItem.id, {
      maintenanceCost: currentMaintenance + expenseData.amount,
      lastMaintenanceDate: expenseData.date
    });
    toast({
      title: "Success",
      description: "Expense added and recorded in finance"
    });
    resetExpenseForm();
    setIsExpenseOpen(false);
    setSelectedItem(null);
  };
  const handleDeleteItem = id => {
    if (confirm("Are you sure you want to delete this item? Related expenses will remain in records.")) {
      deleteSchoolInventory(id);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully"
      });
    }
  };
  const handleDeleteExpense = id => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      deleteInventoryExpense(id);
      toast({
        title: "Success",
        description: "Expense record deleted"
      });
    }
  };
  const handleEditExpense = () => {
    if (!selectedExpense || !expenseData.description || expenseData.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    updateInventoryExpense(selectedExpense.id, expenseData);
    toast({
      title: "Success",
      description: "Expense updated successfully"
    });
    resetExpenseForm();
    setIsExpenseEditOpen(false);
    setSelectedExpense(null);
  };
  const openExpenseEditDialog = expense => {
    setSelectedExpense(expense);
    setExpenseData({
      expenseType: expense.expenseType,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      vendor: expense.vendor || ""
    });
    setIsExpenseEditOpen(true);
  };
  const openEditDialog = item => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchaseDate: item.purchaseDate,
      supplier: item.supplier,
      condition: item.condition,
      location: item.location,
      assignedTo: item.assignedTo || "Unassigned",
      assignedToName: item.assignedToName || "",
      warrantyExpiry: item.warrantyExpiry || "",
      description: item.description || ""
    });
    setIsEditOpen(true);
  };
  const openAssignDialog = item => {
    setSelectedItem(item);
    setFormData({
      ...formData,
      assignedTo: item.assignedTo || "Unassigned",
      assignedToName: item.assignedToName || ""
    });
    setIsAssignOpen(true);
  };
  const openExpenseDialog = item => {
    setSelectedItem(item);
    resetExpenseForm();
    setIsExpenseOpen(true);
  };
  const resetForm = () => {
    setFormData({
      itemName: "",
      category: "Lab Equipment",
      quantity: 0,
      unitPrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      supplier: "",
      condition: "New",
      location: "",
      assignedTo: "Unassigned",
      assignedToName: "",
      warrantyExpiry: "",
      description: ""
    });
  };
  const resetExpenseForm = () => {
    setExpenseData({
      expenseType: "Maintenance",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: "",
      vendor: ""
    });
  };
  const filteredInventory = schoolInventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || item.location.toLowerCase().includes(searchTerm.toLowerCase()) || item.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesAssignment = filterAssignment === "all" || (item.assignedTo || "Unassigned") === filterAssignment;
    return matchesSearch && matchesCategory && matchesAssignment;
  });
  const totalInventoryValue = schoolInventory.reduce((sum, item) => sum + item.totalValue, 0);
  const totalMaintenanceCost = inventoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalItems = schoolInventory.reduce((sum, item) => sum + item.quantity, 0);
  const assignedItems = schoolInventory.filter(item => item.assignedTo && item.assignedTo !== "Unassigned").length;
  const getConditionBadge = condition => {
    const variants = {
      "New": "default",
      "Good": "secondary",
      "Fair": "outline",
      "Needs Repair": "destructive",
      "Damaged": "destructive"
    };
    return <Badge variant={variants[condition]}>{condition}</Badge>;
  };
  const getAssignmentBadge = assignedTo => {
    if (!assignedTo || assignedTo === "Unassigned") {
      return <Badge variant="outline">Unassigned</Badge>;
    }
    return <Badge>{assignedTo}</Badge>;
  };
  return <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inventory Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track assets, assignments, and maintenance costs</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Fill in the details to add a new item to the inventory</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input id="itemName" value={formData.itemName} onChange={e => setFormData({
                    ...formData,
                    itemName: e.target.value
                  })} placeholder="Enter item name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={value => setFormData({
                    ...formData,
                    category: value
                  })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input id="quantity" type="number" min="1" value={formData.quantity} onChange={e => setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (PKR) *</Label>
                    <Input id="unitPrice" type="number" min="0" value={formData.unitPrice} onChange={e => setFormData({
                    ...formData,
                    unitPrice: parseFloat(e.target.value) || 0
                  })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier *</Label>
                    <Input id="supplier" value={formData.supplier} onChange={e => setFormData({
                    ...formData,
                    supplier: e.target.value
                  })} placeholder="Supplier name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({
                    ...formData,
                    location: e.target.value
                  })} placeholder="e.g., Lab A, Office" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input id="purchaseDate" type="date" value={formData.purchaseDate} onChange={e => setFormData({
                    ...formData,
                    purchaseDate: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select value={formData.condition} onValueChange={value => setFormData({
                    ...formData,
                    condition: value
                  })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map(cond => <SelectItem key={cond} value={cond}>{cond}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select value={formData.assignedTo} onValueChange={value => setFormData({
                    ...formData,
                    assignedTo: value
                  })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.assignedTo !== "Unassigned" && <div className="space-y-2">
                      <Label htmlFor="assignedToName">Assignment Name</Label>
                      <Input id="assignedToName" value={formData.assignedToName} onChange={e => setFormData({
                    ...formData,
                    assignedToName: e.target.value
                  })} placeholder="e.g., Biology Lab, HSSC XI-A" />
                    </div>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiry">Warranty Expiry Date</Label>
                  <Input id="warrantyExpiry" type="date" value={formData.warrantyExpiry} onChange={e => setFormData({
                  ...formData,
                  warrantyExpiry: e.target.value
                })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({
                  ...formData,
                  description: e.target.value
                })} placeholder="Additional details about the item" rows={3} />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total Value: PKR {(formData.quantity * formData.unitPrice).toLocaleString()}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                resetForm();
                setIsAddOpen(false);
              }}>Cancel</Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {totalInventoryValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">{assignedItems} assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {totalMaintenanceCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schoolInventory.filter(item => item.condition === "Needs Repair" || item.condition === "Damaged").length}
              </div>
              <p className="text-xs text-muted-foreground">Require repair</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">
              <Package className="mr-2 h-4 w-4" />
              Inventory Items
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <Wrench className="mr-2 h-4 w-4" />
              Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Manage all inventory items, assignments, and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Input placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterAssignment} onValueChange={setFilterAssignment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignments</SelectItem>
                      {assignmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.length === 0 ? <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No inventory items found
                          </TableCell>
                        </TableRow> : filteredInventory.map(item => <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="font-semibold">PKR {item.totalValue.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getAssignmentBadge(item.assignedTo)}
                                {item.assignedToName && <span className="text-xs text-muted-foreground">{item.assignedToName}</span>}
                              </div>
                            </TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{getConditionBadge(item.condition)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)} title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openAssignDialog(item)} title="Assign">
                                  <ClipboardList className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openExpenseDialog(item)} title="Add Expense">
                                  <Wrench className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)} title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                  </TableBody>
                </Table>
                </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Expenses</CardTitle>
                <CardDescription>Track maintenance, repairs, and other inventory-related expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryExpenses.length === 0 ? <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No expenses recorded
                          </TableCell>
                        </TableRow> : inventoryExpenses.map(expense => <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{expense.itemName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.expenseType}</Badge>
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.vendor || "-"}</TableCell>
                            <TableCell className="font-semibold">PKR {expense.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openExpenseEditDialog(expense)} title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteExpense(expense.id)} title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                  </TableBody>
                </Table>
                </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>Update item details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={formData.itemName} onChange={e => setFormData({
                  ...formData,
                  itemName: e.target.value
                })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={value => setFormData({
                  ...formData,
                  category: value
                })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={formData.quantity} onChange={e => setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0
                })} />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input type="number" value={formData.unitPrice} onChange={e => setFormData({
                  ...formData,
                  unitPrice: parseFloat(e.target.value) || 0
                })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={value => setFormData({
                  ...formData,
                  condition: value
                })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conditions.map(cond => <SelectItem key={cond} value={cond}>{cond}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={e => setFormData({
                  ...formData,
                  location: e.target.value
                })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
              setIsEditOpen(false);
              setSelectedItem(null);
            }}>Cancel</Button>
              <Button onClick={handleEditItem}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Inventory Item</DialogTitle>
              <DialogDescription>Assign this item to a class, department, or lab</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={formData.assignedTo} onValueChange={value => setFormData({
                ...formData,
                assignedTo: value
              })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assignmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formData.assignedTo !== "Unassigned" && <div className="space-y-2">
                  <Label>Assignment Name</Label>
                  <Input value={formData.assignedToName} onChange={e => setFormData({
                ...formData,
                assignedToName: e.target.value
              })} placeholder="e.g., Biology Lab, HSSC XI-A, IT Department" />
                </div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
              setIsAssignOpen(false);
              setSelectedItem(null);
            }}>Cancel</Button>
              <Button onClick={handleAssignItem}>Save Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense for {selectedItem?.itemName}</DialogTitle>
              <DialogDescription>Record maintenance, repair, or other expenses</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Expense Type *</Label>
                <Select value={expenseData.expenseType} onValueChange={value => setExpenseData({
                ...expenseData,
                expenseType: value
              })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (PKR) *</Label>
                <Input type="number" min="0" value={expenseData.amount} onChange={e => setExpenseData({
                ...expenseData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseData.date} onChange={e => setExpenseData({
                ...expenseData,
                date: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={expenseData.vendor} onChange={e => setExpenseData({
                ...expenseData,
                vendor: e.target.value
              })} placeholder="Service provider or supplier" />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={expenseData.description} onChange={e => setExpenseData({
                ...expenseData,
                description: e.target.value
              })} placeholder="Details about the expense" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
              setIsExpenseOpen(false);
              setSelectedItem(null);
            }}>Cancel</Button>
              <Button onClick={handleAddExpense}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isExpenseEditOpen} onOpenChange={setIsExpenseEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense for {selectedExpense?.itemName}</DialogTitle>
              <DialogDescription>Update expense details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Expense Type *</Label>
                <Select value={expenseData.expenseType} onValueChange={value => setExpenseData({
                ...expenseData,
                expenseType: value
              })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (PKR) *</Label>
                <Input type="number" min="0" step="0.01" value={expenseData.amount} onChange={e => setExpenseData({
                ...expenseData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseData.date} onChange={e => setExpenseData({
                ...expenseData,
                date: e.target.value
              })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={expenseData.description} onChange={e => setExpenseData({
                ...expenseData,
                description: e.target.value
              })} placeholder="Describe the expense" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={expenseData.vendor} onChange={e => setExpenseData({
                ...expenseData,
                vendor: e.target.value
              })} placeholder="Vendor or service provider name" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
              setIsExpenseEditOpen(false);
              setSelectedExpense(null);
            }}>Cancel</Button>
              <Button onClick={handleEditExpense}>Update Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Inventory;
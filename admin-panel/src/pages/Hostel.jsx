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
import { Home, Bed, UtensilsCrossed, DollarSign, Edit, Trash2, UserPlus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const Hostel = () => {
  const {
    students,
    hostelRegistrations,
    addHostelRegistration,
    updateHostelRegistration,
    deleteHostelRegistration,
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    messAllocations,
    addMessAllocation,
    updateMessAllocation,
    deleteMessAllocation,
    hostelExpenses,
    addHostelExpense,
    updateHostelExpense,
    deleteHostelExpense,
    inventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  } = useData();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState("registration");
  const [regOpen, setRegOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [messOpen, setMessOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState({});
  const [regFormData, setRegFormData] = useState({
    studentId: "",
    hostelName: "Main Hostel",
    registrationDate: new Date().toISOString().split("T")[0]
  });
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: "",
    roomType: "Double",
    capacity: 2
  });
  const [messFormData, setMessFormData] = useState({
    studentId: "",
    messPlan: "Standard",
    monthlyCost: 3000,
    remarks: ""
  });
  const [expenseFormData, setExpenseFormData] = useState({
    expenseTitle: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    remarks: ""
  });
  const [inventoryFormData, setInventoryFormData] = useState({
    itemName: "",
    category: "Furniture",
    quantity: 1,
    condition: "New",
    allocatedToRoom: ""
  });
  const filteredRegistrations = hostelRegistrations.filter(reg => {
    const student = students.find(s => s.id === reg.studentId);
    if (!student) return false;
    const matchesProgram = filterProgram === "all" || student.program === filterProgram;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });
  const handleAddRegistration = () => {
    if (!regFormData.studentId) {
      toast({
        title: "Please select a student",
        variant: "destructive"
      });
      return;
    }
    const student = students.find(s => s.id === regFormData.studentId);
    if (!student) return;
    if (editMode.reg) {
      updateHostelRegistration(editMode.reg, {
        hostelName: regFormData.hostelName,
        registrationDate: regFormData.registrationDate
      });
      toast({
        title: "Registration updated"
      });
    } else {
      addHostelRegistration({
        studentId: regFormData.studentId,
        studentName: student.name,
        classProgram: `${student.class} ${student.program}`,
        hostelName: regFormData.hostelName,
        registrationDate: regFormData.registrationDate,
        status: "active"
      });
      toast({
        title: "Student registered for hostel"
      });
    }
    setRegOpen(false);
    setEditMode({});
    setRegFormData({
      studentId: "",
      hostelName: "Main Hostel",
      registrationDate: new Date().toISOString().split("T")[0]
    });
  };
  const handleAddRoom = () => {
    if (!roomFormData.roomNumber) {
      toast({
        title: "Please enter room number",
        variant: "destructive"
      });
      return;
    }
    if (editMode.room) {
      updateRoom(editMode.room, {
        roomNumber: roomFormData.roomNumber,
        roomType: roomFormData.roomType.toLowerCase(),
        capacity: roomFormData.capacity
      });
      toast({
        title: "Room updated successfully"
      });
    } else {
      addRoom({
        roomNumber: roomFormData.roomNumber,
        roomType: roomFormData.roomType.toLowerCase(),
        capacity: roomFormData.capacity,
        allocatedTo: [],
        allocationDate: "",
        status: "vacant"
      });
      toast({
        title: "Room added successfully"
      });
    }
    setRoomOpen(false);
    setEditMode({});
    setRoomFormData({
      roomNumber: "",
      roomType: "Double",
      capacity: 2
    });
  };
  const handleAddMess = () => {
    if (!messFormData.studentId && !editMode.mess) {
      toast({
        title: "Please select a student",
        variant: "destructive"
      });
      return;
    }
    if (editMode.mess) {
      updateMessAllocation(editMode.mess, {
        messPlan: messFormData.messPlan.toLowerCase(),
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({
        title: "Mess allocation updated"
      });
    } else {
      addMessAllocation({
        studentId: messFormData.studentId,
        messPlan: messFormData.messPlan.toLowerCase(),
        mealStatus: "active",
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({
        title: "Mess allocation added"
      });
    }
    setMessOpen(false);
    setEditMode({});
    setMessFormData({
      studentId: "",
      messPlan: "Standard",
      monthlyCost: 3000,
      remarks: ""
    });
  };
  const handleAddExpense = () => {
    if (!expenseFormData.expenseTitle || !expenseFormData.amount) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editMode.expense) {
      updateHostelExpense(editMode.expense, expenseFormData);
      toast({
        title: "Expense updated"
      });
    } else {
      addHostelExpense(expenseFormData);
      toast({
        title: "Expense added"
      });
    }
    setExpenseOpen(false);
    setEditMode({});
    setExpenseFormData({
      expenseTitle: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      remarks: ""
    });
  };
  const handleAddInventory = () => {
    if (!inventoryFormData.itemName) {
      toast({
        title: "Please enter item name",
        variant: "destructive"
      });
      return;
    }
    if (editMode.inventory) {
      updateInventoryItem(editMode.inventory, {
        ...inventoryFormData,
        category: inventoryFormData.category.toLowerCase(),
        condition: inventoryFormData.condition === "New" ? "new" : inventoryFormData.condition === "Good" ? "good" : "repair-needed"
      });
      toast({
        title: "Inventory item updated"
      });
    } else {
      addInventoryItem({
        ...inventoryFormData,
        category: inventoryFormData.category.toLowerCase(),
        condition: inventoryFormData.condition === "New" ? "new" : inventoryFormData.condition === "Good" ? "good" : "repair-needed"
      });
      toast({
        title: "Inventory item added"
      });
    }
    setInventoryOpen(false);
    setEditMode({});
    setInventoryFormData({
      itemName: "",
      category: "Furniture",
      quantity: 1,
      condition: "New",
      allocatedToRoom: ""
    });
  };

  // Chart data
  const roomOccupancyData = [{
    name: "Occupied",
    value: rooms.filter(r => r.status === "occupied").length
  }, {
    name: "Vacant",
    value: rooms.filter(r => r.status === "vacant").length
  }];
  const messPlansData = [{
    name: "Basic",
    count: messAllocations.filter(m => m.messPlan === "basic").length
  }, {
    name: "Standard",
    count: messAllocations.filter(m => m.messPlan === "standard").length
  }, {
    name: "Premium",
    count: messAllocations.filter(m => m.messPlan === "premium").length
  }];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Hostel Management</h2>
          <p className="text-primary-foreground/90">
            Manage rooms, students, mess, and hostel finances
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hostelRegistrations.filter(r => r.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.filter(r => r.status === "vacant").length} / {rooms.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mess Allocations</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messAllocations.filter(m => m.mealStatus === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="mess">Mess</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hostel Registration</CardTitle>
                  <Button onClick={() => setRegOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Student
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      <SelectItem value="HSSC">HSSC</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="BS">BS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class/Program</TableHead>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map(reg => <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.studentName}</TableCell>
                        <TableCell>{reg.classProgram}</TableCell>
                        <TableCell>{reg.hostelName}</TableCell>
                        <TableCell>{reg.registrationDate}</TableCell>
                        <TableCell>
                          <Badge variant={reg.status === "active" ? "default" : "secondary"}>
                            {reg.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({
                              reg: reg.id
                            });
                            setRegFormData({
                              studentId: reg.studentId,
                              hostelName: reg.hostelName,
                              registrationDate: reg.registrationDate
                            });
                            setRegOpen(true);
                          }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                            deleteHostelRegistration(reg.id);
                            toast({
                              title: "Registration removed"
                            });
                          }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Room Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={roomOccupancyData} cx="50%" cy="50%" labelLine={false} label={entry => `${entry.name}: ${entry.value}`} outerRadius={80} fill="hsl(var(--primary))" dataKey="value">
                        {roomOccupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mess Plans Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={messPlansData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Room Management</CardTitle>
                  <Button onClick={() => setRoomOpen(true)}>
                    <Bed className="mr-2 h-4 w-4" />
                    Add Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map(room => <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.roomNumber}</TableCell>
                        <TableCell>{room.roomType}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={room.status === "vacant" ? "default" : "secondary"}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                          setEditMode({
                            room: room.id
                          });
                          setRoomFormData({
                            roomNumber: room.roomNumber,
                            roomType: room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1),
                            capacity: room.capacity
                          });
                          setRoomOpen(true);
                        }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                          deleteRoom(room.id);
                          toast({
                            title: "Room deleted"
                          });
                        }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mess" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mess Management</CardTitle>
                  <Button onClick={() => setMessOpen(true)}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Add Allocation
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Mess Plan</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messAllocations.map(mess => {
                    const student = students.find(s => s.id === mess.studentId);
                    return <TableRow key={mess.id}>
                          <TableCell>{student?.name}</TableCell>
                          <TableCell>{mess.messPlan}</TableCell>
                          <TableCell>PKR {mess.monthlyCost.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={mess.mealStatus === "active" ? "default" : "secondary"}>
                              {mess.mealStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{mess.remarks}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({
                              mess: mess.id
                            });
                            setMessFormData({
                              studentId: mess.studentId,
                              messPlan: mess.messPlan.charAt(0).toUpperCase() + mess.messPlan.slice(1),
                              monthlyCost: mess.monthlyCost,
                              remarks: mess.remarks
                            });
                            setMessOpen(true);
                          }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => {
                            deleteMessAllocation(mess.id);
                            toast({
                              title: "Allocation removed"
                            });
                          }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>;
                  })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hostel Expenses</CardTitle>
                  <Button onClick={() => setExpenseOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostelExpenses.map(expense => <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.expenseTitle}</TableCell>
                        <TableCell>PKR {expense.amount.toLocaleString()}</TableCell>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>{expense.remarks}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                          setEditMode({
                            expense: expense.id
                          });
                          setExpenseFormData({
                            expenseTitle: expense.expenseTitle,
                            amount: expense.amount,
                            date: expense.date,
                            remarks: expense.remarks
                          });
                          setExpenseOpen(true);
                        }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                          deleteHostelExpense(expense.id);
                          toast({
                            title: "Expense deleted"
                          });
                        }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Inventory Management</CardTitle>
                  <Button onClick={() => setInventoryOpen(true)}>
                    <Package className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Allocated To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map(item => <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={item.condition === "new" ? "default" : "secondary"}>
                            {item.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.allocatedToRoom || "Not Allocated"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => {
                          setEditMode({
                            inventory: item.id
                          });
                          setInventoryFormData({
                            itemName: item.itemName,
                            category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
                            quantity: item.quantity,
                            condition: item.condition === "new" ? "New" : item.condition === "good" ? "Good" : "Repair Needed",
                            allocatedToRoom: item.allocatedToRoom
                          });
                          setInventoryOpen(true);
                        }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                          deleteInventoryItem(item.id);
                          toast({
                            title: "Item deleted"
                          });
                        }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={regOpen} onOpenChange={open => {
        setRegOpen(open);
        if (!open) setEditMode({});
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.reg ? "Edit" : "Register Student for"} Hostel Registration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Student</Label>
                <Select value={regFormData.studentId} onValueChange={value => setRegFormData({
                ...regFormData,
                studentId: value
              })} disabled={!!editMode.reg}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.status === "active").map(student => <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.class} {student.program}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hostel Name</Label>
                <Input value={regFormData.hostelName} onChange={e => setRegFormData({
                ...regFormData,
                hostelName: e.target.value
              })} />
              </div>
              <div>
                <Label>Registration Date</Label>
                <Input type="date" value={regFormData.registrationDate} onChange={e => setRegFormData({
                ...regFormData,
                registrationDate: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddRegistration}>{editMode.reg ? "Update" : "Register"}</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={roomOpen} onOpenChange={open => {
        setRoomOpen(open);
        if (!open) setEditMode({});
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.room ? "Edit" : "Add"} Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Room Number</Label>
                <Input value={roomFormData.roomNumber} onChange={e => setRoomFormData({
                ...roomFormData,
                roomNumber: e.target.value
              })} />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select value={roomFormData.roomType} onValueChange={value => setRoomFormData({
                ...roomFormData,
                roomType: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Double">Double</SelectItem>
                    <SelectItem value="Shared">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input type="number" value={roomFormData.capacity} onChange={e => setRoomFormData({
                ...roomFormData,
                capacity: parseInt(e.target.value) || 1
              })} />
              </div>
            </div>
            <Button onClick={handleAddRoom}>{editMode.room ? "Update" : "Add"} Room</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={messOpen} onOpenChange={open => {
        setMessOpen(open);
        if (!open) setEditMode({});
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.mess ? "Edit" : "Add"} Mess Allocation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Student</Label>
                <Select value={messFormData.studentId} onValueChange={value => setMessFormData({
                ...messFormData,
                studentId: value
              })} disabled={!!editMode.mess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.filter(s => s.status === "active").map(student => <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mess Plan</Label>
                <Select value={messFormData.messPlan} onValueChange={value => setMessFormData({
                ...messFormData,
                messPlan: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Cost</Label>
                <Input type="number" value={messFormData.monthlyCost} onChange={e => setMessFormData({
                ...messFormData,
                monthlyCost: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={messFormData.remarks} onChange={e => setMessFormData({
                ...messFormData,
                remarks: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddMess}>{editMode.mess ? "Update" : "Add"} Allocation</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={expenseOpen} onOpenChange={open => {
        setExpenseOpen(open);
        if (!open) setEditMode({});
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.expense ? "Edit" : "Add"} Hostel Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Expense Title</Label>
                <Input value={expenseFormData.expenseTitle} onChange={e => setExpenseFormData({
                ...expenseFormData,
                expenseTitle: e.target.value
              })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={expenseFormData.amount} onChange={e => setExpenseFormData({
                ...expenseFormData,
                amount: parseFloat(e.target.value) || 0
              })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={expenseFormData.date} onChange={e => setExpenseFormData({
                ...expenseFormData,
                date: e.target.value
              })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={expenseFormData.remarks} onChange={e => setExpenseFormData({
                ...expenseFormData,
                remarks: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddExpense}>{editMode.expense ? "Update" : "Add"} Expense</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={inventoryOpen} onOpenChange={open => {
        setInventoryOpen(open);
        if (!open) setEditMode({});
      }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode.inventory ? "Edit" : "Add"} Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input value={inventoryFormData.itemName} onChange={e => setInventoryFormData({
                ...inventoryFormData,
                itemName: e.target.value
              })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={inventoryFormData.category} onValueChange={value => setInventoryFormData({
                ...inventoryFormData,
                category: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Appliance">Appliance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={inventoryFormData.quantity} onChange={e => setInventoryFormData({
                ...inventoryFormData,
                quantity: parseInt(e.target.value) || 1
              })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={inventoryFormData.condition} onValueChange={value => setInventoryFormData({
                ...inventoryFormData,
                condition: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Repair Needed">Repair Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Allocated To Room (optional)</Label>
                <Input value={inventoryFormData.allocatedToRoom} onChange={e => setInventoryFormData({
                ...inventoryFormData,
                allocatedToRoom: e.target.value
              })} />
              </div>
            </div>
            <Button onClick={handleAddInventory}>{editMode.inventory ? "Update" : "Add"} Item</Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Hostel;
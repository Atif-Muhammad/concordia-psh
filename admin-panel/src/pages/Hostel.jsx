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
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHostelRegistrations,
  createHostelRegistration,
  updateHostelRegistration,
  deleteHostelRegistration,
  getRooms,
  createRoom,
  updateRoom as updateRoomApi,
  deleteRoom as deleteRoomApi,
  allocateRoom,
  deallocateStudent,
  getHostelExpenses,
  createHostelExpense,
  updateHostelExpense,
  deleteHostelExpense,
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  searchStudents
} from "../../config/apis";
import { Home, Bed, UtensilsCrossed, DollarSign, Edit, Trash2, UserPlus, Package, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
import { cn } from "@/lib/utils";

const Hostel = () => {
  const {
    students,
    messAllocations,
    addMessAllocation,
    updateMessAllocation,
    deleteMessAllocation,
  } = useData();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: hostelRegistrations = [] } = useQuery({
    queryKey: ['hostelRegistrations'],
    queryFn: getHostelRegistrations
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms
  });

  const { data: hostelExpenses = [] } = useQuery({
    queryKey: ['hostelExpenses'],
    queryFn: getHostelExpenses
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: getInventoryItems
  });

  // UI State
  const [activeTab, setActiveTab] = useState("registration");
  const [regOpen, setRegOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [messOpen, setMessOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [filterProgram, setFilterProgram] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Student search state
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState("internal"); // "internal" or "external"

  const [regFormData, setRegFormData] = useState({
    studentId: "",
    externalName: "",
    externalInstitute: "",
    externalGuardianName: "",
    externalGuardianNumber: "",
    registrationDate: new Date().toISOString().split("T")[0],
    roomId: ""
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

  // Search students using API with debouncing
  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      if (studentSearch && studentSearch.length >= 2) {
        setSearchLoading(true);
        try {
          const results = await searchStudents(studentSearch);
          setSearchResults(results.slice(0, 10)); // Limit to 10 results
        } catch (error) {
          console.error('Student search failed:', error);
          setSearchResults([]);
        }
        setSearchLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchDebounce);
  }, [studentSearch]);

  const filteredRegistrations = hostelRegistrations.filter(reg => {
    const studentName = reg.student
      ? `${reg.student.fName} ${reg.student.lName || ''}`.toLowerCase()
      : (reg.externalName || '').toLowerCase();
    const rollNumber = reg.student?.rollNumber?.toLowerCase() || 'external';
    const programName = reg.student?.program?.name || reg.externalInstitute || '';

    const matchesProgram = filterProgram === "all" || programName === filterProgram;
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || rollNumber.includes(searchQuery.toLowerCase());
    return matchesProgram && matchesSearch;
  });

  const handleStudentSelect = (student) => {
    const isRegistered = hostelRegistrations.some(reg => reg.studentId === student.id);
    if (isRegistered) {
      toast({ title: "Student is already registered", variant: "destructive" });
      return;
    }
    setSelectedStudent(student);
    setStudentSearch(`${student.fName} ${student.lName || ''} (${student.rollNumber})`);
    setRegFormData({ ...regFormData, studentId: student.id });
    setShowStudentDropdown(false);
    setSearchResults([]);
  };

  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setRegFormData({
      ...regFormData,
      studentId: "",
      externalName: "",
      externalInstitute: "",
      externalGuardianName: "",
      externalGuardianNumber: ""
    });
    setSearchResults([]);
  };

  const handleAddRegistration = async () => {
    if (registrationType === "internal" && !regFormData.studentId) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }
    if (registrationType === "external" && !regFormData.externalName) {
      toast({ title: "Please enter student name", variant: "destructive" });
      return;
    }
    if (!regFormData.roomId) {
      toast({ title: "Please select a room", variant: "destructive" });
      return;
    }

    try {
      if (editMode.reg) {
        // Update registration details
        const updateData = {
          registrationDate: regFormData.registrationDate,
          studentId: registrationType === "internal" ? Number(regFormData.studentId) : null,
          externalName: registrationType === "external" ? regFormData.externalName : null,
          externalInstitute: registrationType === "external" ? regFormData.externalInstitute : null,
          externalGuardianName: registrationType === "external" ? regFormData.externalGuardianName : null,
          externalGuardianNumber: registrationType === "external" ? regFormData.externalGuardianNumber : null,
        };

        await updateHostelRegistration(editMode.reg, updateData);

        // Handle Room Change Logic
        const studentId = registrationType === "internal" ? Number(regFormData.studentId) : null;
        const externalName = registrationType === "external" ? regFormData.externalName : null;

        const currentRoom = rooms.find(r =>
          r.allocations?.some(alloc =>
            studentId ? alloc.studentId === studentId : alloc.externalName === externalName
          )
        );

        // If room has changed or wasn't assigned
        if (currentRoom && currentRoom.id !== regFormData.roomId) {
          // 1. Deallocate from old room
          const oldAllocation = currentRoom.allocations.find(alloc =>
            studentId ? alloc.studentId === studentId : alloc.externalName === externalName
          );
          if (oldAllocation) {
            await deallocateStudent(oldAllocation.id);
          }

          // 2. Allocate to new room
          await allocateRoom({
            roomId: regFormData.roomId,
            studentId: studentId,
            externalName: externalName,
            allocationDate: regFormData.registrationDate
          });
        } else if (!currentRoom) {
          // If no room was assigned previously, just allocate
          await allocateRoom({
            roomId: regFormData.roomId,
            studentId: studentId,
            externalName: externalName,
            allocationDate: regFormData.registrationDate
          });
        }

        toast({ title: "Registration updated" });
      } else {
        // Create registration
        const registrationData = {
          hostelName: "Main Hostel", // Default value
          registrationDate: regFormData.registrationDate,
          status: "active",
        };

        if (registrationType === "internal") {
          registrationData.studentId = regFormData.studentId;
        } else {
          registrationData.externalName = regFormData.externalName;
          registrationData.externalInstitute = regFormData.externalInstitute;
          registrationData.externalGuardianName = regFormData.externalGuardianName;
          registrationData.externalGuardianNumber = regFormData.externalGuardianNumber;
        }

        await createHostelRegistration(registrationData);

        // Allocate room
        const allocationData = {
          roomId: regFormData.roomId,
          allocationDate: regFormData.registrationDate
        };

        if (registrationType === "internal") {
          allocationData.studentId = Number(regFormData.studentId);
        } else {
          allocationData.externalName = regFormData.externalName;
        }

        await allocateRoom(allocationData);

        toast({ title: "Student registered and room allocated" });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      setRegOpen(false);
      setEditMode({});
      clearStudentSelection();
      setRegFormData({
        studentId: "",
        externalName: "",
        externalInstitute: "",
        externalGuardianName: "",
        externalGuardianNumber: "",
        registrationDate: new Date().toISOString().split("T")[0],
        roomId: ""
      });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save registration", variant: "destructive" });
    }
  };

  const confirmDelete = (type, item) => {
    setDeleteItem({ type, item });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    const { type, item } = deleteItem;

    try {
      if (type === 'reg') {
        const studentRoom = rooms.find(r =>
          r.allocations?.some(alloc =>
            item.studentId ? alloc.studentId === item.studentId : alloc.externalName === item.externalName
          )
        );
        if (studentRoom) {
          const allocation = studentRoom.allocations.find(alloc =>
            item.studentId ? alloc.studentId === item.studentId : alloc.externalName === item.externalName
          );
          if (allocation) await deallocateStudent(allocation.id);
        }
        await deleteHostelRegistration(item.id);
        queryClient.invalidateQueries({ queryKey: ['hostelRegistrations'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      } else if (type === 'room') {
        await deleteRoomApi(item.id);
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      } else if (type === 'mess') {
        await deleteMessAllocation(item.id);
        // Mess allocations are currently from context, might need to update that too or invalidate if moved to query
      } else if (type === 'expense') {
        await deleteHostelExpense(item.id);
        queryClient.invalidateQueries({ queryKey: ['hostelExpenses'] });
      } else if (type === 'inventory') {
        await deleteInventoryItem(item.id);
        queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      }
      toast({ title: "Deleted successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
    setDeleteConfirmOpen(false);
    setDeleteItem(null);
  };

  const handleAddRoom = async () => {
    if (!roomFormData.roomNumber) {
      toast({ title: "Please enter room number", variant: "destructive" });
      return;
    }
    try {
      if (editMode.room) {
        await updateRoomApi(editMode.room, {
          roomNumber: roomFormData.roomNumber,
          roomType: roomFormData.roomType.toLowerCase(),
          capacity: Number(roomFormData.capacity)
        });
        toast({ title: "Room updated successfully" });
      } else {
        await createRoom({
          roomNumber: roomFormData.roomNumber,
          roomType: roomFormData.roomType.toLowerCase(),
          capacity: Number(roomFormData.capacity),
          hostelName: "Main Hostel",
          status: "vacant"
        });
        toast({ title: "Room added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setRoomOpen(false);
      setEditMode({});
      setRoomFormData({ roomNumber: "", roomType: "Double", capacity: 2 });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save room", variant: "destructive" });
    }
  };

  const handleAddMess = () => {
    if (!messFormData.studentId && !editMode.mess) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }
    if (editMode.mess) {
      updateMessAllocation(editMode.mess, {
        messPlan: messFormData.messPlan.toLowerCase(),
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({ title: "Mess allocation updated" });
    } else {
      addMessAllocation({
        studentId: messFormData.studentId,
        messPlan: messFormData.messPlan.toLowerCase(),
        mealStatus: "active",
        monthlyCost: messFormData.monthlyCost,
        remarks: messFormData.remarks
      });
      toast({ title: "Mess allocation added" });
    }
    setMessOpen(false);
    setEditMode({});
    setMessFormData({ studentId: "", messPlan: "Standard", monthlyCost: 3000, remarks: "" });
  };

  const handleAddExpense = async () => {
    if (!expenseFormData.expenseTitle || !expenseFormData.amount) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    try {
      if (editMode.expense) {
        await updateHostelExpense(editMode.expense, expenseFormData);
        toast({ title: "Expense updated" });
      } else {
        await createHostelExpense(expenseFormData);
        toast({ title: "Expense added" });
      }
      queryClient.invalidateQueries({ queryKey: ['hostelExpenses'] });
      setExpenseOpen(false);
      setEditMode({});
      setExpenseFormData({ expenseTitle: "", amount: 0, date: new Date().toISOString().split("T")[0], remarks: "" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save expense", variant: "destructive" });
    }
  };

  const handleAddInventory = async () => {
    if (!inventoryFormData.itemName) {
      toast({ title: "Please enter item name", variant: "destructive" });
      return;
    }
    try {
      if (editMode.inventory) {
        await updateInventoryItem(editMode.inventory, {
          ...inventoryFormData,
          category: inventoryFormData.category.toLowerCase(),
          quantity: Number(inventoryFormData.quantity)
        });
        toast({ title: "Inventory item updated" });
      } else {
        await createInventoryItem({
          ...inventoryFormData,
          category: inventoryFormData.category.toLowerCase(),
          quantity: Number(inventoryFormData.quantity),
          condition: inventoryFormData.condition.toLowerCase(),
          allocatedToRoom: inventoryFormData.allocatedToRoom || undefined
        });
        toast({ title: "Inventory item added" });
      }
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      setInventoryOpen(false);
      setEditMode({});
      setInventoryFormData({ itemName: "", category: "Furniture", quantity: 1, condition: "New", allocatedToRoom: "" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to save inventory", variant: "destructive" });
    }
  };

  // Get room for a student
  const getStudentRoom = (studentId, externalName) => {
    const room = rooms.find(r =>
      r.allocations?.some(alloc =>
        studentId ? alloc.studentId === studentId : (externalName && alloc.externalName === externalName)
      )
    );
    return room;
  };

  // Chart data
  const roomOccupancyData = [{
    name: "Occupied",
    value: rooms.reduce((acc, room) => acc + (room.currentOccupancy || 0), 0)
  }, {
    name: "Vacant",
    value: rooms.reduce((acc, room) => acc + (room.capacity - (room.currentOccupancy || 0)), 0)
  }];

  // Expenses Over Time Data
  const expensesOverTimeData = useMemo(() => {
    const data = {};
    hostelExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!data[monthYear]) data[monthYear] = 0;
      data[monthYear] += expense.amount;
    });
    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  }, [hostelExpenses]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Hostel Management</h2>
          <p className="text-primary-foreground/90">
            Manage rooms, students, mess, and hostel finances
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mess Allocations</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messAllocations.filter(m => m.mealStatus === "active").length}</div>
            </CardContent>
          </Card> */}
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            {/* <TabsTrigger value="mess">Mess</TabsTrigger> */}
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="registration" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hostel Registration</CardTitle>
                  <Button onClick={() => {
                    setRegOpen(true);
                    clearStudentSelection();
                  }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Student
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Input placeholder="Search students..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1" />
                  {/* <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      <SelectItem value="HSSC">HSSC</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="BS">BS</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.map(reg => {
                        const studentRoom = getStudentRoom(reg.studentId, reg.externalName);
                        const studentName = reg.student ? `${reg.student.fName} ${reg.student.lName || ''}` : reg.externalName;
                        const rollNumber = reg.student?.rollNumber || "External";
                        const program = reg.student?.program?.name || reg.externalInstitute || "N/A";

                        return <TableRow key={reg.id}>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          <TableCell>{rollNumber}</TableCell>
                          <TableCell>{program}</TableCell>
                          <TableCell>
                            {studentRoom ? (
                              <span className="text-sm">
                                Room {studentRoom.roomNumber}
                                <span className="text-muted-foreground ml-1">
                                  ({studentRoom.currentOccupancy}/{studentRoom.capacity})
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>{reg.registrationDate}</TableCell>
                          <TableCell>
                            <Badge variant={reg.status === "active" ? "default" : "secondary"}>
                              {reg.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditMode({ reg: reg.id });
                                setRegistrationType(reg.studentId ? "internal" : "external");
                                const studentRoom = getStudentRoom(reg.studentId, reg.externalName);
                                setRegFormData({
                                  studentId: reg.studentId || "",
                                  externalName: reg.externalName || "",
                                  externalInstitute: reg.externalInstitute || "",
                                  externalGuardianName: reg.externalGuardianName || "",
                                  externalGuardianNumber: reg.externalGuardianNumber || "",
                                  registrationDate: reg.registrationDate,
                                  roomId: studentRoom?.id ? String(studentRoom.id) : ""
                                });
                                if (reg.student) {
                                  setStudentSearch(`${reg.student.fName} ${reg.student.lName || ''} (${reg.student.rollNumber})`);
                                  setSelectedStudent(reg.student);
                                }
                                setRegOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => confirmDelete('reg', reg)}>
                                <Trash2 className="h-4 w-4" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Room Occupancy (Seats)</CardTitle>
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
                  <CardTitle>Expenses Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expensesOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
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
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map(room => <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.roomNumber}</TableCell>
                      <TableCell>{room.roomType}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>{room.currentOccupancy} / {room.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={room.status === "vacant" ? "success" : room.status === "occupied" ? "destructive" : "secondary"}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditMode({ room: room.id });
                            setRoomFormData({
                              roomNumber: room.roomNumber,
                              roomType: room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1),
                              capacity: room.capacity
                            });
                            setRoomOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => confirmDelete('room', room)}>
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

          {/* <TabsContent value="mess" className="space-y-4">
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
                        <TableCell className="capitalize">{mess.messPlan}</TableCell>
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
                              setEditMode({ mess: mess.id });
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
                            <Button size="sm" variant="destructive" onClick={() => confirmDelete('mess', mess)}>
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
          </TabsContent> */}

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
                            setEditMode({ expense: expense.id });
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
                          <Button size="sm" variant="destructive" onClick={() => confirmDelete('expense', expense)}>
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
                      <TableCell className="capitalize">{item.category}</TableCell>
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
                            setEditMode({ inventory: item.id });
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
                          <Button size="sm" variant="destructive" onClick={() => confirmDelete('inventory', item)}>
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

        {/* Registration Dialog */}
        <Dialog open={regOpen} onOpenChange={open => {
          setRegOpen(open);
          if (!open) {
            setEditMode({});
            clearStudentSelection();
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode.reg ? "Edit" : "Register Student for"} Hostel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                    registrationType === "internal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    setRegistrationType("internal");
                    clearStudentSelection();
                  }}
                >
                  Internal Student
                </button>
                <button
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                    registrationType === "external" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => {
                    setRegistrationType("external");
                    clearStudentSelection();
                  }}
                >
                  External Student
                </button>
              </div>

              {registrationType === "internal" ? (
                /* Student Search (Internal) */
                <div className="relative">
                  <Label>Search Student (by name or roll number)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type to search..."
                      value={studentSearch}
                      onChange={e => {
                        setStudentSearch(e.target.value);
                        setShowStudentDropdown(true);
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="pl-9 pr-9"
                    />
                    {studentSearch && (
                      <button
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        onClick={clearStudentSelection}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Student Dropdown */}
                  {showStudentDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                      {searchLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                      )}
                      {!searchLoading && searchResults.map(student => {
                        const isRegistered = hostelRegistrations.some(reg => reg.studentId === student.id);
                        return (
                          <div
                            key={student.id}
                            className={`px-3 py-2 border-b last:border-b-0 ${isRegistered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}`}
                            onClick={() => !isRegistered && handleStudentSelect(student)}
                          >
                            <div className="font-medium flex justify-between">
                              <span>{student.fName} {student.lName}</span>
                              {isRegistered && <span className="text-xs text-red-500 font-normal">Already Registered</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Roll: {student.rollNumber} • {student.program?.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showStudentDropdown && !searchLoading && studentSearch.length >= 2 && searchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md px-3 py-2 text-sm text-muted-foreground">
                      No students found
                    </div>
                  )}
                </div>
              ) : (
                /* External Student Fields */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Student Name"
                        value={regFormData.externalName}
                        onChange={e => setRegFormData({ ...regFormData, externalName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institute/Organization</Label>
                      <Input
                        placeholder="Institute Name"
                        value={regFormData.externalInstitute}
                        onChange={e => setRegFormData({ ...regFormData, externalInstitute: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Parent/Guardian Name</Label>
                      <Input
                        placeholder="Guardian Name"
                        value={regFormData.externalGuardianName}
                        onChange={e => setRegFormData({ ...regFormData, externalGuardianName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Guardian Contact Number</Label>
                      <Input
                        placeholder="Contact Number"
                        value={regFormData.externalGuardianNumber}
                        onChange={e => setRegFormData({ ...regFormData, externalGuardianNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Room Selection */}
              <div>
                <Label>Assign Room</Label>
                <Select
                  value={regFormData.roomId}
                  onValueChange={value => setRegFormData({ ...regFormData, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => {
                      const isFull = room.currentOccupancy >= room.capacity;
                      const isCurrentRoom = room.allocations?.some(a => a.studentId === Number(regFormData.studentId));
                      const isDisabled = isFull && !isCurrentRoom;

                      return (
                        <SelectItem key={room.id} value={String(room.id)} disabled={isDisabled}>
                          Room {room.roomNumber} ({room.roomType}) - {isFull ? "Full" : `${room.capacity - room.currentOccupancy} Available`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Registration Date */}
              <div>
                <Label>Registration Date</Label>
                <Input type="date" value={regFormData.registrationDate} onChange={e => setRegFormData({ ...regFormData, registrationDate: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddRegistration} disabled={registrationType === "internal" ? !regFormData.studentId : !regFormData.externalName}>
              {editMode.reg ? "Update" : "Register"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Room Dialog */}
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
                <Input value={roomFormData.roomNumber} onChange={e => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} />
              </div>
              <div>
                <Label>Room Type</Label>
                <Select value={roomFormData.roomType} onValueChange={value => setRoomFormData({ ...roomFormData, roomType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single (1 person)</SelectItem>
                    <SelectItem value="Double">Double (2 person)</SelectItem>
                    <SelectItem value="Triple">Triple (3 person)</SelectItem>
                    <SelectItem value="Shared">Shared (4+ person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity</Label>
                <Input type="number" min="1" value={roomFormData.capacity} onChange={e => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <Button onClick={handleAddRoom}>{editMode.room ? "Update" : "Add"} Room</Button>
          </DialogContent>
        </Dialog>

        {/* Mess Dialog */}
        {/* <Dialog open={messOpen} onOpenChange={open => {
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
                <Select value={messFormData.studentId} onValueChange={value => setMessFormData({ ...messFormData, studentId: value })} disabled={!!editMode.mess}>
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
                <Select value={messFormData.messPlan} onValueChange={value => setMessFormData({ ...messFormData, messPlan: value })}>
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
                <Input type="number" value={messFormData.monthlyCost} onChange={e => setMessFormData({ ...messFormData, monthlyCost: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={messFormData.remarks} onChange={e => setMessFormData({ ...messFormData, remarks: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddMess}>{editMode.mess ? "Update" : "Add"} Allocation</Button>
          </DialogContent>
        </Dialog> */}

        {/* Expense Dialog */}
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
                <Input value={expenseFormData.expenseTitle} onChange={e => setExpenseFormData({ ...expenseFormData, expenseTitle: e.target.value })} />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={expenseFormData.amount} onChange={e => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={expenseFormData.date} onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })} />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea value={expenseFormData.remarks} onChange={e => setExpenseFormData({ ...expenseFormData, remarks: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleAddExpense}>{editMode.expense ? "Update" : "Add"} Expense</Button>
          </DialogContent>
        </Dialog>

        {/* Inventory Dialog */}
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
                <Input value={inventoryFormData.itemName} onChange={e => setInventoryFormData({ ...inventoryFormData, itemName: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={inventoryFormData.category} onValueChange={value => setInventoryFormData({ ...inventoryFormData, category: value })}>
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
                <Input type="number" value={inventoryFormData.quantity} onChange={e => setInventoryFormData({ ...inventoryFormData, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={inventoryFormData.condition} onValueChange={value => setInventoryFormData({ ...inventoryFormData, condition: value })}>
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
                <Select
                  value={inventoryFormData.allocatedToRoom || "none"}
                  onValueChange={value => setInventoryFormData({ ...inventoryFormData, allocatedToRoom: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Allocated</SelectItem>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.roomNumber}>
                        Room {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddInventory}>{editMode.inventory ? "Update" : "Add"} Item</Button>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Hostel;
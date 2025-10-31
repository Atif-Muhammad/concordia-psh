import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/DataContext";
import { useState } from "react";
import { UserPlus, Users, MessageSquare, Phone, Edit, Trash2, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const FrontOffice = () => {
  const {
    inquiries,
    addInquiry,
    updateInquiry,
    deleteInquiry,
    visitors,
    addVisitor,
    updateVisitor,
    deleteVisitor,
    complaints,
    addComplaint,
    updateComplaint,
    deleteComplaint,
    contacts,
    addContact,
    updateContact,
    deleteContact
  } = useData();
  const {
    toast
  } = useToast();

  // Inquiry State
  const [inquiryDialog, setInquiryDialog] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    studentName: "",
    fatherName: "",
    fatherCnic: "",
    contactNumber: "",
    email: "",
    address: "",
    programInterest: "",
    previousInstitute: "",
    remarks: ""
  });

  // Visitor State
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [visitorForm, setVisitorForm] = useState({
    visitorName: "",
    phoneNumber: "",
    purpose: "",
    visitDate: new Date().toISOString().split("T")[0],
    inTime: "",
    outTime: "",
    remarks: ""
  });

  // Complaint State
  const [complaintDialog, setComplaintDialog] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    complainantType: "Student",
    complainantName: "",
    contactNumber: "",
    complaintNature: "",
    details: "",
    assignedTo: ""
  });

  // Contact State
  const [contactDialog, setContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    contactName: "",
    category: "Emergency",
    phoneNumber: "",
    email: "",
    description: ""
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    id: ""
  });
  const [viewDetailsDialog, setViewDetailsDialog] = useState({
    open: false,
    type: "",
    data: null
  });

  // Inquiry Handlers
  const handleInquirySubmit = () => {
    if (!inquiryForm.studentName || !inquiryForm.contactNumber) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingInquiry) {
      updateInquiry(editingInquiry, inquiryForm);
      toast({
        title: "Inquiry updated successfully"
      });
    } else {
      addInquiry({
        ...inquiryForm,
        status: "new",
        date: new Date().toISOString().split("T")[0]
      });
      toast({
        title: "Inquiry registered successfully"
      });
    }
    setInquiryForm({
      studentName: "",
      fatherName: "",
      fatherCnic: "",
      contactNumber: "",
      email: "",
      address: "",
      programInterest: "",
      previousInstitute: "",
      remarks: ""
    });
    setEditingInquiry(null);
    setInquiryDialog(false);
  };
  const handleEditInquiry = inquiry => {
    setInquiryForm({
      studentName: inquiry.studentName,
      fatherName: inquiry.fatherName,
      fatherCnic: inquiry.fatherCnic,
      contactNumber: inquiry.contactNumber,
      email: inquiry.email,
      address: inquiry.address,
      programInterest: inquiry.programInterest,
      previousInstitute: inquiry.previousInstitute,
      remarks: inquiry.remarks
    });
    setEditingInquiry(inquiry.id);
    setInquiryDialog(true);
  };

  // Visitor Handlers
  const handleVisitorSubmit = () => {
    if (!visitorForm.visitorName || !visitorForm.phoneNumber) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingVisitor) {
      updateVisitor(editingVisitor, visitorForm);
      toast({
        title: "Visitor updated successfully"
      });
    } else {
      addVisitor(visitorForm);
      toast({
        title: "Visitor recorded successfully"
      });
    }
    setVisitorForm({
      visitorName: "",
      phoneNumber: "",
      purpose: "",
      visitDate: new Date().toISOString().split("T")[0],
      inTime: "",
      outTime: "",
      remarks: ""
    });
    setEditingVisitor(null);
    setVisitorDialog(false);
  };
  const handleEditVisitor = visitor => {
    setVisitorForm(visitor);
    setEditingVisitor(visitor.id);
    setVisitorDialog(true);
  };

  // Complaint Handlers
  const handleComplaintSubmit = () => {
    if (!complaintForm.complainantName || !complaintForm.details) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingComplaint) {
      updateComplaint(editingComplaint, complaintForm);
      toast({
        title: "Complaint updated successfully"
      });
    } else {
      addComplaint({
        ...complaintForm,
        status: "pending",
        date: new Date().toISOString().split("T")[0]
      });
      toast({
        title: "Complaint registered successfully"
      });
    }
    setComplaintForm({
      complainantType: "Student",
      complainantName: "",
      contactNumber: "",
      complaintNature: "",
      details: "",
      assignedTo: ""
    });
    setEditingComplaint(null);
    setComplaintDialog(false);
  };
  const handleEditComplaint = complaint => {
    setComplaintForm({
      complainantType: complaint.complainantType,
      complainantName: complaint.complainantName,
      contactNumber: complaint.contactNumber,
      complaintNature: complaint.complaintNature,
      details: complaint.details,
      assignedTo: complaint.assignedTo
    });
    setEditingComplaint(complaint.id);
    setComplaintDialog(true);
  };

  // Contact Handlers
  const handleContactSubmit = () => {
    if (!contactForm.contactName || !contactForm.phoneNumber) {
      toast({
        title: "Please fill required fields",
        variant: "destructive"
      });
      return;
    }
    if (editingContact) {
      updateContact(editingContact, contactForm);
      toast({
        title: "Contact updated successfully"
      });
    } else {
      addContact(contactForm);
      toast({
        title: "Contact added successfully"
      });
    }
    setContactForm({
      contactName: "",
      category: "Emergency",
      phoneNumber: "",
      email: "",
      description: ""
    });
    setEditingContact(null);
    setContactDialog(false);
  };
  const handleEditContact = contact => {
    setContactForm(contact);
    setEditingContact(contact.id);
    setContactDialog(true);
  };

  // Delete Handler
  const handleDelete = () => {
    const {
      type,
      id
    } = deleteDialog;
    switch (type) {
      case "inquiry":
        deleteInquiry(id);
        toast({
          title: "Inquiry deleted"
        });
        break;
      case "visitor":
        deleteVisitor(id);
        toast({
          title: "Visitor record deleted"
        });
        break;
      case "complaint":
        deleteComplaint(id);
        toast({
          title: "Complaint deleted"
        });
        break;
      case "contact":
        deleteContact(id);
        toast({
          title: "Contact deleted"
        });
        break;
    }
    setDeleteDialog({
      open: false,
      type: "",
      id: ""
    });
  };
  const getStatusColor = status => {
    switch (status) {
      case "approved":
      case "resolved":
        return "bg-success/20 text-success";
      case "rejected":
        return "bg-destructive/20 text-destructive";
      case "in-progress":
      case "follow-up":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  return <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">Front Office Management</h2>
          <p className="text-primary-foreground/90">
            Handle inquiries, visitors, complaints, and contacts
          </p>
        </div>

        <Tabs defaultValue="inquiry" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="inquiry">Inquiry</TabsTrigger>
            <TabsTrigger value="visitor">Visitor Book</TabsTrigger>
            <TabsTrigger value="complaint">Complaints</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* INQUIRY TAB */}
          <TabsContent value="inquiry" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  All Inquiries
                </CardTitle>
                <Dialog open={inquiryDialog} onOpenChange={setInquiryDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingInquiry(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Inquiry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingInquiry ? "Edit" : "New"} Inquiry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Student Name *</Label>
                          <Input value={inquiryForm.studentName} onChange={e => setInquiryForm({
                          ...inquiryForm,
                          studentName: e.target.value
                        })} placeholder="Enter student name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Father Name</Label>
                          <Input value={inquiryForm.fatherName} onChange={e => setInquiryForm({
                          ...inquiryForm,
                          fatherName: e.target.value
                        })} placeholder="Enter father name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Father CNIC</Label>
                          <Input value={inquiryForm.fatherCnic} onChange={e => setInquiryForm({
                          ...inquiryForm,
                          fatherCnic: e.target.value
                        })} placeholder="12345-1234567-1" />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Number *</Label>
                          <Input value={inquiryForm.contactNumber} onChange={e => setInquiryForm({
                          ...inquiryForm,
                          contactNumber: e.target.value
                        })} placeholder="0300-1234567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={inquiryForm.email} onChange={e => setInquiryForm({
                          ...inquiryForm,
                          email: e.target.value
                        })} placeholder="student@email.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Program Interest</Label>
                          <Select value={inquiryForm.programInterest} onValueChange={v => setInquiryForm({
                          ...inquiryForm,
                          programInterest: v
                        })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HSSC Pre-Engineering">HSSC Pre-Engineering</SelectItem>
                              <SelectItem value="HSSC Pre-Medical">HSSC Pre-Medical</SelectItem>
                              <SelectItem value="BS Computer Science">BS Computer Science</SelectItem>
                              <SelectItem value="BS Software Engineering">BS Software Engineering</SelectItem>
                              <SelectItem value="Diploma in IT">Diploma in IT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={inquiryForm.address} onChange={e => setInquiryForm({
                        ...inquiryForm,
                        address: e.target.value
                      })} placeholder="Enter address" />
                      </div>
                      <div className="space-y-2">
                        <Label>Previous Institute</Label>
                        <Input value={inquiryForm.previousInstitute} onChange={e => setInquiryForm({
                        ...inquiryForm,
                        previousInstitute: e.target.value
                      })} placeholder="Enter previous institute" />
                      </div>
                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea value={inquiryForm.remarks} onChange={e => setInquiryForm({
                        ...inquiryForm,
                        remarks: e.target.value
                      })} placeholder="Add remarks" rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInquiryDialog(false)}>Cancel</Button>
                      <Button onClick={handleInquirySubmit}>
                        {editingInquiry ? "Update" : "Submit"} Inquiry
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map(inquiry => <TableRow key={inquiry.id}>
                        <TableCell>{inquiry.date}</TableCell>
                        <TableCell className="font-medium">{inquiry.studentName}</TableCell>
                        <TableCell>{inquiry.contactNumber}</TableCell>
                        <TableCell>{inquiry.programInterest}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setViewDetailsDialog({
                            open: true,
                            type: "inquiry",
                            data: inquiry
                          })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditInquiry(inquiry)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                            open: true,
                            type: "inquiry",
                            id: inquiry.id
                          })}>
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

          {/* VISITOR TAB */}
          <TabsContent value="visitor" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Visitor Log
                </CardTitle>
                <Dialog open={visitorDialog} onOpenChange={setVisitorDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingVisitor(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Visitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingVisitor ? "Edit" : "New"} Visitor Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Visitor Name *</Label>
                          <Input value={visitorForm.visitorName} onChange={e => setVisitorForm({
                          ...visitorForm,
                          visitorName: e.target.value
                        })} placeholder="Enter visitor name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input value={visitorForm.phoneNumber} onChange={e => setVisitorForm({
                          ...visitorForm,
                          phoneNumber: e.target.value
                        })} placeholder="0300-1234567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Visit Date</Label>
                          <Input type="date" value={visitorForm.visitDate} onChange={e => setVisitorForm({
                          ...visitorForm,
                          visitDate: e.target.value
                        })} />
                        </div>
                        <div className="space-y-2">
                          <Label>In Time</Label>
                          <Input type="time" value={visitorForm.inTime} onChange={e => setVisitorForm({
                          ...visitorForm,
                          inTime: e.target.value
                        })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Out Time</Label>
                          <Input type="time" value={visitorForm.outTime} onChange={e => setVisitorForm({
                          ...visitorForm,
                          outTime: e.target.value
                        })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Purpose</Label>
                        <Input value={visitorForm.purpose} onChange={e => setVisitorForm({
                        ...visitorForm,
                        purpose: e.target.value
                      })} placeholder="Purpose of visit" />
                      </div>
                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea value={visitorForm.remarks} onChange={e => setVisitorForm({
                        ...visitorForm,
                        remarks: e.target.value
                      })} placeholder="Additional notes" rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVisitorDialog(false)}>Cancel</Button>
                      <Button onClick={handleVisitorSubmit}>
                        {editingVisitor ? "Update" : "Record"} Visit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Visitor Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>In Time</TableHead>
                      <TableHead>Out Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map(visitor => <TableRow key={visitor.id}>
                        <TableCell>{visitor.visitDate}</TableCell>
                        <TableCell className="font-medium">{visitor.visitorName}</TableCell>
                        <TableCell>{visitor.phoneNumber}</TableCell>
                        <TableCell>{visitor.purpose}</TableCell>
                        <TableCell>{visitor.inTime}</TableCell>
                        <TableCell>{visitor.outTime}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditVisitor(visitor)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                          open: true,
                          type: "visitor",
                          id: visitor.id
                        })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPLAINT TAB */}
          <TabsContent value="complaint" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  All Complaints
                </CardTitle>
                <Dialog open={complaintDialog} onOpenChange={setComplaintDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingComplaint(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Register Complaint
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingComplaint ? "Edit" : "Register"} Complaint</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Complainant Type *</Label>
                          <Select value={complaintForm.complainantType} onValueChange={v => setComplaintForm({
                          ...complaintForm,
                          complainantType: v
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Student">Student</SelectItem>
                              <SelectItem value="Parent">Parent</SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Complainant Name *</Label>
                          <Input value={complaintForm.complainantName} onChange={e => setComplaintForm({
                          ...complaintForm,
                          complainantName: e.target.value
                        })} placeholder="Enter name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Number</Label>
                          <Input value={complaintForm.contactNumber} onChange={e => setComplaintForm({
                          ...complaintForm,
                          contactNumber: e.target.value
                        })} placeholder="0300-1234567" />
                        </div>
                        <div className="space-y-2">
                          <Label>Complaint Nature</Label>
                          <Input value={complaintForm.complaintNature} onChange={e => setComplaintForm({
                          ...complaintForm,
                          complaintNature: e.target.value
                        })} placeholder="e.g., Facility Issue" />
                        </div>
                        <div className="space-y-2">
                          <Label>Assign To</Label>
                          <Select value={complaintForm.assignedTo} onValueChange={v => setComplaintForm({
                          ...complaintForm,
                          assignedTo: v
                        })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MD">MD</SelectItem>
                              <SelectItem value="Principal">Principal</SelectItem>
                              <SelectItem value="HOD Science">HOD Science</SelectItem>
                              <SelectItem value="HOD IT">HOD IT</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Complaint Details *</Label>
                        <Textarea value={complaintForm.details} onChange={e => setComplaintForm({
                        ...complaintForm,
                        details: e.target.value
                      })} placeholder="Describe the complaint in detail" rows={4} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setComplaintDialog(false)}>Cancel</Button>
                      <Button onClick={handleComplaintSubmit}>
                        {editingComplaint ? "Update" : "Submit"} Complaint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Nature</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map(complaint => <TableRow key={complaint.id}>
                        <TableCell>{complaint.date}</TableCell>
                        <TableCell>{complaint.complainantType}</TableCell>
                        <TableCell className="font-medium">{complaint.complainantName}</TableCell>
                        <TableCell>{complaint.complaintNature}</TableCell>
                        <TableCell>{complaint.assignedTo}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setViewDetailsDialog({
                          open: true,
                          type: "complaint",
                          data: complaint
                        })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditComplaint(complaint)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                          open: true,
                          type: "complaint",
                          id: complaint.id
                        })}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Directory
                </CardTitle>
                <Dialog open={contactDialog} onOpenChange={setContactDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingContact(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingContact ? "Edit" : "Add"} Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Contact Name *</Label>
                          <Input value={contactForm.contactName} onChange={e => setContactForm({
                          ...contactForm,
                          contactName: e.target.value
                        })} placeholder="Enter name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Category *</Label>
                          <Select value={contactForm.category} onValueChange={v => setContactForm({
                          ...contactForm,
                          category: v
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Emergency">Emergency</SelectItem>
                              <SelectItem value="Academic">Academic</SelectItem>
                              <SelectItem value="Technical">Technical</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone *</Label>
                          <Input value={contactForm.phoneNumber} onChange={e => setContactForm({
                          ...contactForm,
                          phoneNumber: e.target.value
                        })} placeholder="Enter phone" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={contactForm.email} onChange={e => setContactForm({
                          ...contactForm,
                          email: e.target.value
                        })} placeholder="email@example.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={contactForm.description} onChange={e => setContactForm({
                        ...contactForm,
                        description: e.target.value
                      })} placeholder="Additional details" rows={2} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setContactDialog(false)}>Cancel</Button>
                      <Button onClick={handleContactSubmit}>
                        {editingContact ? "Update" : "Add"} Contact
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map(contact => <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.contactName}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            {contact.category}
                          </span>
                        </TableCell>
                        <TableCell>{contact.phoneNumber}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditContact(contact)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteDialog({
                          open: true,
                          type: "contact",
                          id: contact.id
                        })}>
                              <Trash2 className="w-4 h-4" />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({
        ...deleteDialog,
        open
      })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsDialog.open} onOpenChange={open => setViewDetailsDialog({
        ...viewDetailsDialog,
        open
      })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
            </DialogHeader>
            {viewDetailsDialog.data && <div className="space-y-3">
                {Object.entries(viewDetailsDialog.data).map(([key, value]) => <div key={key} className="flex justify-between border-b pb-2">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>)}
              </div>}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default FrontOffice;
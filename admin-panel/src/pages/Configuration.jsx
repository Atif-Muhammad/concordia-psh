import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  Shield,
  Eye,
  GraduationCap,
  MoreVertical,
  Check,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAdmins,
  createAdmin as createAdminAPI,
  updateAdmin as updateAdminAPI,
  deleteAdmin as deleteAdminAPI,
  getReportCardTemplates,
  createReportCardTemplate,
  updateReportCardTemplate,
  deleteReportCardTemplate,
  getInstituteSettings,
  updateInstituteSettings,
} from "../../config/apis";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
const Configuration = () => {
  const {
    config,
    branches,
    roles,
    challanTemplates,
    idCardTemplates,
    updateConfig,
    addBranch,
    updateBranch,
    deleteBranch,
    addRole,
    updateRole,
    deleteRole,
    addChallanTemplate,
    updateChallanTemplate,
    deleteChallanTemplate,
    addIDCardTemplate,
    updateIDCardTemplate,
    deleteIDCardTemplate,
  } = useData();
  const { toast } = useToast();
  const [dialog, setDialog] = useState({
    type: "",
    open: false,
  });
  const [editing, setEditing] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [configForm, setConfigForm] = useState(config);
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "",
    address: "",
  });
  const [roleForm, setRoleForm] = useState({
    role: "",
    permissions: [],
  });
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    adminId: "",
    newPassword: "",
    confirmPassword: "",
  });
  const allModules = [
    "Dashboard",
    "Students",
    "Academics",
    "Attendance",
    "Teacher",
    "Examination",
    "Finance",
    "Fee Management",
    "HR & Payroll",
    "Front Office",
    "Hostel",
    "Inventory",
    "Configuration",
  ];

  // Template states
  const [challanDialog, setChallanDialog] = useState(false);
  const [marksheetDialog, setMarksheetDialog] = useState(false);
  const [idCardDialog, setIdCardDialog] = useState(false);
  const [challanForm, setChallanForm] = useState({
    name: "",
    htmlContent: "",
    isDefault: false,
  });
  const [marksheetForm, setMarksheetForm] = useState({
    name: "",
    htmlContent: "",
    isDefault: false,
  });
  const [idCardForm, setIdCardForm] = useState({
    name: "",
    htmlContent: "",
    isDefault: false,
  });
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingMarksheet, setEditingMarksheet] = useState(null);
  const [editingIdCard, setEditingIdCard] = useState(null);
  const [previewChallan, setPreviewChallan] = useState(null);
  const [previewMarksheet, setPreviewMarksheet] = useState(null);
  const [previewIdCard, setPreviewIdCard] = useState(null);

  // Admins state for rendering - fetched directly from API in apis.js
  const [admins, setAdmins] = useState([]);

  // Helper function to map admin data from API response
  const mapAdminData = (admin) => ({
    id: admin.id,
    name: admin.name || admin.email.split("@")[0],
    email: admin.email,
    accessRights: admin.permissions?.modules || [],
  });

  // Fetch admins on component mount using API from apis.js
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const adminsData = await getAdmins();
        if (Array.isArray(adminsData)) {
          setAdmins(adminsData.map(mapAdminData));
        }
      } catch (error) {
        console.error("Failed to fetch admins:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch admins",
          variant: "destructive",
        });
      }
    };
    loadAdmins();
  }, []); // Empty dependency array means it runs once on mount

  // Report Card Templates state - managed directly in this component
  const [marksheetTemplates, setMarksheetTemplates] = useState([]);

  // Fetch Report Card Templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templates = await getReportCardTemplates();
        setMarksheetTemplates(templates);
      } catch (error) {
        console.error("Failed to fetch report card templates:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch report card templates",
          variant: "destructive",
        });
      }
    };
    loadTemplates();
  }, []);

  // Fetch Institute Settings on component mount
  useEffect(() => {
    const loadInstituteSettings = async () => {
      try {
        const settings = await getInstituteSettings();
        setConfigForm({
          instituteName: settings.instituteName || '',
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          facebook: settings.facebook || '',
          instagram: settings.instagram || '',
          logo: settings.logo || '',
        });
      } catch (error) {
        console.error("Failed to fetch institute settings:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch institute settings",
          variant: "destructive",
        });
      }
    };
    loadInstituteSettings();
  }, []);

  const handleConfigUpdate = async () => {
    try {
      await updateInstituteSettings(configForm);
      toast({
        title: "Configuration updated successfully",
      });
    } catch (error) {
      console.error("Failed to update institute settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    }
  };
  const handleBranchSubmit = () => {
    if (editing) {
      updateBranch(editing.id, branchForm);
      toast({
        title: "Branch updated successfully",
      });
    } else {
      addBranch(branchForm);
      toast({
        title: "Branch added successfully",
      });
    }
    setDialog({
      type: "",
      open: false,
    });
    setEditing(null);
    setBranchForm({
      name: "",
      city: "",
      address: "",
    });
  };
  const handleRoleSubmit = () => {
    if (editing) {
      updateRole(editing.id, roleForm);
      toast({
        title: "Role updated successfully",
      });
    } else {
      addRole(roleForm);
      toast({
        title: "Role created successfully",
      });
    }
    setDialog({
      type: "",
      open: false,
    });
    setEditing(null);
    setRoleForm({
      role: "",
      permissions: [],
    });
  };
  const handleAdminSubmit = async () => {
    try {
      // Map frontend data to backend format
      // Role is always "ADMIN", access rights determine the role access
      const adminData = {
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
        role: "ADMIN", // Always ADMIN, access rights determine permissions
        permissions: adminForm.accessRights
          ? { modules: adminForm.accessRights }
          : { modules: [] },
      };

      if (editing) {
        // For update, don't send password if it's not being changed
        const updateData = { ...adminData };
        if (!adminForm.password) {
          delete updateData.password;
        }
        await updateAdminAPI(editing.id, updateData);

        // Refetch admins to get updated data using API from apis.js
        const adminsData = await getAdmins();
        if (Array.isArray(adminsData)) {
          setAdmins(adminsData.map(mapAdminData));
        }

        toast({
          title: "Admin updated successfully",
        });
      } else {
        await createAdminAPI(adminData);

        // Refetch admins to get updated data using API from apis.js
        const adminsData = await getAdmins();
        if (Array.isArray(adminsData)) {
          setAdmins(adminsData.map(mapAdminData));
        }

        toast({
          title: "Admin created successfully",
        });
      }

      setDialog({
        type: "",
        open: false,
      });
      setEditing(null);
      setAdminForm({
        name: "",
        email: "",
        password: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save admin",
        variant: "destructive",
      });
    }
  };
  const toggleAccessRight = async (adminId, module) => {
    const admin = admins.find((a) => a.id === adminId);
    if (!admin) return;
    const hasAccess = admin.accessRights.includes(module);
    const newAccessRights = hasAccess
      ? admin.accessRights.filter((m) => m !== module)
      : [...admin.accessRights, module];

    try {
      // Update only permissions, role remains "ADMIN"
      const updateData = {
        permissions: { modules: newAccessRights },
      };

      await updateAdminAPI(adminId, updateData);

      // Refetch admins to get updated data using API from apis.js
      const adminsData = await getAdmins();
      if (Array.isArray(adminsData)) {
        setAdmins(adminsData.map(mapAdminData));
      }

      toast({
        title: "Success",
        description: `Access ${hasAccess ? "removed" : "granted"
          } for ${module}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update access rights",
        variant: "destructive",
      });
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "admin") {
        await deleteAdminAPI(deleteTarget.id);
        // Refetch admins to get updated data using API from apis.js
        const adminsData = await getAdmins();
        if (Array.isArray(adminsData)) {
          setAdmins(adminsData.map(mapAdminData));
        }
        toast({
          title: "Admin deleted successfully",
        });
      } else if (deleteTarget.type === "branch") {
        deleteBranch(deleteTarget.id);
        toast({
          title: "Branch deleted successfully",
        });
      } else if (deleteTarget.type === "role") {
        deleteRole(deleteTarget.id);
        toast({
          title: "Role deleted successfully",
        });
      }

      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${deleteTarget.type}`,
        variant: "destructive",
      });
    }
  };
  const openEditBranch = (branch) => {
    setEditing(branch);
    setBranchForm(branch);
    setDialog({
      type: "branch",
      open: true,
    });
  };
  const openEditRole = (role) => {
    setEditing(role);
    setRoleForm(role);
    setDialog({
      type: "role",
      open: true,
    });
  };
  const openEditAdmin = (admin) => {
    setEditing(admin);
    // Map admin data to form, excluding roleId since role is always ADMIN
    setAdminForm({
      name: admin.name || "",
      email: admin.email || "",
      password: "", // Don't set password when editing
    });
    setDialog({
      type: "admin",
      open: true,
    });
  };
  const handlePasswordUpdate = async () => {
    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update password via API
      const updateData = {
        password: passwordForm.newPassword,
      };
      await updateAdminAPI(passwordForm.adminId, updateData);

      // Refetch admins to get updated data using API from apis.js
      const adminsData = await getAdmins();
      if (Array.isArray(adminsData)) {
        setAdmins(adminsData.map(mapAdminData));
      }

      toast({
        title: "Password updated successfully",
      });
      setPasswordDialog(false);
      setPasswordForm({
        adminId: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };
  const openPasswordDialog = (adminId) => {
    setPasswordForm({
      adminId,
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordDialog(true);
  };
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-medium">
          <h2 className="text-2xl font-bold mb-2">System Configuration</h2>
          <p className="text-primary-foreground/90">
            Configure institute settings, users, and system preferences
          </p>
        </div>

        <Tabs defaultValue="institute" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="institute">Institute</TabsTrigger>
            {/* <TabsTrigger value="branches">Branches</TabsTrigger> */}
            {/* <TabsTrigger value="roles">Roles</TabsTrigger> */}
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="institute">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Institute Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Institute Name</Label>
                  <Input
                    value={configForm.instituteName}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        instituteName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={configForm.email}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={configForm.phone}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={configForm.address}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input
                    value={configForm.facebook}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        facebook: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={configForm.instagram}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        instagram: e.target.value,
                      })
                    }
                  />
                </div>
                <Button onClick={handleConfigUpdate}>Save Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Branches
                </CardTitle>
                <Dialog
                  open={dialog.type === "branch" && dialog.open}
                  onOpenChange={(open) =>
                    setDialog({
                      type: "branch",
                      open,
                    })
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setBranchForm({
                          name: "",
                          city: "",
                          address: "",
                        });
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editing ? "Edit Branch" : "Add Branch"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Branch Name</Label>
                        <Input
                          value={branchForm.name}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          value={branchForm.city}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Textarea
                          value={branchForm.address}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              address: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button onClick={handleBranchSubmit} className="w-full">
                        {editing ? "Update" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {branches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell>{branch.name}</TableCell>
                          <TableCell>{branch.city}</TableCell>
                          <TableCell>{branch.address}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditBranch(branch)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "branch",
                                    id: branch.id,
                                  });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Roles
                </CardTitle>
                <Dialog
                  open={dialog.type === "role" && dialog.open}
                  onOpenChange={(open) =>
                    setDialog({
                      type: "role",
                      open,
                    })
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setRoleForm({
                          role: "",
                          permissions: [],
                        });
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editing ? "Edit Role" : "Add Role"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Role Name</Label>
                        <Input
                          value={roleForm.role}
                          onChange={(e) =>
                            setRoleForm({
                              ...roleForm,
                              role: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Permissions (comma separated)</Label>
                        <Input
                          value={roleForm.permissions.join(", ")}
                          onChange={(e) =>
                            setRoleForm({
                              ...roleForm,
                              permissions: e.target.value
                                .split(",")
                                .map((p) => p.trim()),
                            })
                          }
                        />
                      </div>
                      <Button onClick={handleRoleSubmit} className="w-full">
                        {editing ? "Update" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* <TableHead>Role</TableHead> */}
                      <TableHead>Permissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.role}</TableCell>
                        <TableCell>{role.permissions.join(", ")}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditRole(role)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({
                                  type: "role",
                                  id: role.id,
                                });
                                setDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin Management
                </CardTitle>
                <Dialog
                  open={dialog.type === "admin" && dialog.open}
                  onOpenChange={(open) =>
                    setDialog({
                      type: "admin",
                      open,
                    })
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditing(null);
                        setAdminForm({
                          name: "",
                          email: "",
                          password: "",
                        });
                      }}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editing ? "Edit Admin" : "Add Admin"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={adminForm.name}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={adminForm.email}
                          onChange={(e) =>
                            setAdminForm({
                              ...adminForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      {!editing && (
                        <div>
                          <Label>Password</Label>
                          <PasswordInput
                            value={adminForm.password}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                password: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                      <Button onClick={handleAdminSubmit} className="w-full">
                        {editing ? "Update" : "Add"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      {/* <TableHead>Role</TableHead> */}
                      <TableHead>Access Rights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => {
                      return (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.name}</TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>ADMIN</TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full max-w-3xl p-4 bg-popover shadow-lg"
                                align="start"
                                sideOffset={5}
                              >
                                <div className="space-y-3">
                                  <div className="px-2 py-1 text-sm font-semibold text-foreground">
                                    Module Access
                                  </div>

                                  {/* HORIZONTAL GRID – 3 or 4 columns */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {allModules.map((module) => {
                                      const hasAccess =
                                        admin.accessRights.includes(module);
                                      return (
                                        <div
                                          key={module}
                                          onClick={() =>
                                            toggleAccessRight(admin.id, module)
                                          }
                                          className={`
              flex items-center justify-between 
              px-3 py-2 text-sm rounded-md 
              cursor-pointer transition-all duration-200
              border
              ${hasAccess
                                              ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                                              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                                            }
            `}
                                        >
                                          <span className="truncate">
                                            {module}
                                          </span>
                                          {hasAccess && (
                                            <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditAdmin(admin)}
                              >
                                <Edit className="w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPasswordDialog(admin.id)}
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "admin",
                                    id: admin.id,
                                  });
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Fee Challan Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog
                      open={challanDialog}
                      onOpenChange={setChallanDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingChallan(null);
                            setChallanForm({
                              name: "",
                              htmlContent: "",
                              isDefault: false,
                            });
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingChallan ? "Edit" : "Add"} Challan Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={challanForm.name}
                              onChange={(e) =>
                                setChallanForm({
                                  ...challanForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>HTML Content</Label>
                            <Textarea
                              rows={10}
                              value={challanForm.htmlContent}
                              onChange={(e) =>
                                setChallanForm({
                                  ...challanForm,
                                  htmlContent: e.target.value,
                                })
                              }
                              placeholder="Enter HTML template with placeholders like {{studentName}}, {{amount}}, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={challanForm.isDefault}
                              onChange={(e) =>
                                setChallanForm({
                                  ...challanForm,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <Label>Set as Default Template</Label>
                          </div>
                          <Button
                            onClick={() => {
                              if (editingChallan) {
                                updateChallanTemplate(editingChallan, {
                                  ...challanForm,
                                  createdAt: new Date().toISOString(),
                                  createdBy: "admin",
                                });
                                toast({
                                  title: "Template updated successfully",
                                });
                              } else {
                                addChallanTemplate({
                                  ...challanForm,
                                  createdAt: new Date().toISOString(),
                                  createdBy: "admin",
                                });
                                toast({
                                  title: "Template added successfully",
                                });
                              }
                              setChallanDialog(false);
                            }}
                            className="w-full"
                          >
                            {editingChallan ? "Update" : "Add"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challanTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            {template.isDefault ? <Badge>Default</Badge> : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingChallan(template.id);
                                  setChallanForm(template);
                                  setChallanDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewChallan(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  deleteChallanTemplate(template.id);
                                  toast({
                                    title: "Template deleted",
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    ID Card Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog open={idCardDialog} onOpenChange={setIdCardDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingIdCard(null);
                            setIdCardForm({
                              name: "",
                              htmlContent: "",
                              isDefault: false,
                            });
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingIdCard ? "Edit" : "Add"} ID Card Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={idCardForm.name}
                              onChange={(e) =>
                                setIdCardForm({
                                  ...idCardForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>HTML Content</Label>
                            <Textarea
                              rows={10}
                              value={idCardForm.htmlContent}
                              onChange={(e) =>
                                setIdCardForm({
                                  ...idCardForm,
                                  htmlContent: e.target.value,
                                })
                              }
                              placeholder="Enter HTML template with placeholders like {{studentName}}, {{rollNumber}}, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={idCardForm.isDefault}
                              onChange={(e) =>
                                setIdCardForm({
                                  ...idCardForm,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <Label>Set as Default Template</Label>
                          </div>
                          <Button
                            onClick={() => {
                              if (editingIdCard) {
                                updateIDCardTemplate(editingIdCard, {
                                  ...idCardForm,
                                  createdAt: new Date().toISOString(),
                                  createdBy: "admin",
                                });
                                toast({
                                  title: "Template updated successfully",
                                });
                              } else {
                                addIDCardTemplate({
                                  ...idCardForm,
                                  createdAt: new Date().toISOString(),
                                  createdBy: "admin",
                                });
                                toast({
                                  title: "Template added successfully",
                                });
                              }
                              setIdCardDialog(false);
                            }}
                            className="w-full"
                          >
                            {editingIdCard ? "Update" : "Add"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {idCardTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            {template.isDefault ? <Badge>Default</Badge> : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingIdCard(template.id);
                                  setIdCardForm(template);
                                  setIdCardDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewIdCard(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  deleteIDCardTemplate(template.id);
                                  toast({
                                    title: "Template deleted",
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Report Card Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog
                      open={marksheetDialog}
                      onOpenChange={setMarksheetDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingMarksheet(null);
                            setMarksheetForm({
                              name: "",
                              htmlContent: "",
                              isDefault: false,
                            });
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingMarksheet ? "Edit" : "Add"} Report Card
                            Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={marksheetForm.name}
                              onChange={(e) =>
                                setMarksheetForm({
                                  ...marksheetForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>HTML Content</Label>
                            <Textarea
                              rows={10}
                              value={marksheetForm.htmlContent}
                              onChange={(e) =>
                                setMarksheetForm({
                                  ...marksheetForm,
                                  htmlContent: e.target.value,
                                })
                              }
                              placeholder="Enter HTML template with placeholders like {{studentName}}, {{examName}}, {{subjects}}, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={marksheetForm.isDefault}
                              onChange={(e) =>
                                setMarksheetForm({
                                  ...marksheetForm,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <Label>Set as Default Template</Label>
                          </div>
                          <Button
                            onClick={async () => {
                              try {
                                if (editingMarksheet) {
                                  const updatedTemplate = await updateReportCardTemplate(editingMarksheet, {
                                    ...marksheetForm,
                                  });
                                  setMarksheetTemplates(
                                    marksheetTemplates.map((t) =>
                                      t.id === editingMarksheet ? updatedTemplate : t
                                    )
                                  );
                                  toast({
                                    title: "Template updated successfully",
                                  });
                                } else {
                                  const newTemplate = await createReportCardTemplate({
                                    ...marksheetForm,
                                  });
                                  setMarksheetTemplates([...marksheetTemplates, newTemplate]);
                                  toast({
                                    title: "Template added successfully",
                                  });
                                }
                                setMarksheetDialog(false);
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to save template",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="w-full"
                          >
                            {editingMarksheet ? "Update" : "Add"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marksheetTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            {template.isDefault ? <Badge>Default</Badge> : "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(template.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingMarksheet(template.id);
                                  setMarksheetForm(template);
                                  setMarksheetDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewMarksheet(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await deleteReportCardTemplate(template.id);
                                    setMarksheetTemplates(
                                      marksheetTemplates.filter((t) => t.id !== template.id)
                                    );
                                    toast({
                                      title: "Template deleted",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to delete template",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Dialogs */}
        <Dialog
          open={!!previewChallan}
          onOpenChange={() => setPreviewChallan(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Challan Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewChallan || "",
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!previewIdCard}
          onOpenChange={() => setPreviewIdCard(null)}
        >
          <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>ID Card Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewIdCard || "",
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!previewMarksheet}
          onOpenChange={() => setPreviewMarksheet(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Report Card Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewMarksheet || "",
              }}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Password Update Dialog */}
        <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Update Password
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Password</Label>
                <PasswordInput
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <PasswordInput
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-type new password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordUpdate}>Update Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
export default Configuration;

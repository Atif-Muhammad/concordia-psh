import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getMyComplaints, addComplaintRemark, updateComplaint as updateComplaintApi } from "../../config/apis";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Send, CheckCircle2, AlertCircle, Loader2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const Complaints = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["myComplaints", filterMonth, filterYear],
    queryFn: () => getMyComplaints(filterMonth, filterYear),
    placeholderData: keepPreviousData,
  });

  const selectedComplaint = complaints?.find(c => c.id === selectedComplaintId);

  const { mutate: addRemark, isPending: isAddingRemark } = useMutation({
    mutationFn: ({ id, remark }) => addComplaintRemark(id, { remark }),
    onSuccess: () => {
      toast({ title: "Remark added successfully" });
      setRemarkText("");
      queryClient.invalidateQueries(["myComplaints"]);
    },
    onError: (err) => {
      toast({
        title: err.message || "Failed to add remark",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: ({ id, status }) => updateComplaintApi(id, { status }),
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries(["myComplaints"]);
    },
    onError: (err) => {
      toast({
        title: err.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status) => {
    const s = status?.replace("_", " ");
    switch (s) {
      case "Resolved":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white font-medium border-none">Resolved</Badge>;
      case "In Progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium border-none">In Progress</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium border-none">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium border-none">Pending</Badge>;
    }
  };

  const statusOptions = ["Pending", "In_Progress", "Resolved", "Rejected"];
  
  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    addRemark({ id: selectedComplaint.id, remark: remarkText });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Assigned Complaints
          </h1>
          <p className="text-muted-foreground">
            Manage complaints assigned to you and track their progress with remarks.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end bg-card/30 p-4 rounded-xl border border-border/50">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Year</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month</Label>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">All Months</SelectItem>
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-10 hover:bg-primary/10"
            onClick={() => {
              setFilterMonth("*");
              setFilterYear(String(new Date().getFullYear()));
            }}
          >
            Reset Filters
          </Button>
        </div>

        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 px-6">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Active Assignments
            </CardTitle>
            <CardDescription>
              A list of all complaints where you are an assignee.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse font-medium">Fetching your assignments...</p>
              </div>
            ) : complaints?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-muted">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/40" />
                <div>
                  <p className="text-lg font-semibold text-foreground">All caught up!</p>
                  <p className="text-muted-foreground">You don't have any assigned complaints right now.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold py-4">Subject</TableHead>
                      <TableHead className="font-bold py-4">Complainant</TableHead>
                      <TableHead className="font-bold py-4">Type</TableHead>
                      <TableHead className="font-bold py-4">Status</TableHead>
                      <TableHead className="font-bold py-4">Date</TableHead>
                      <TableHead className="font-bold py-4 text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints?.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-muted/30 transition-colors group">
                        <TableCell className="font-medium">{complaint.subject}</TableCell>
                        <TableCell>{complaint.complainantName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal capitalize shadow-xs">
                            {complaint.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(complaint.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all shadow-xs"
                              onClick={() => {
                                setSelectedComplaintId(complaint.id);
                                setRemarkDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Remarks ({complaint.remarks?.length || 0})
                            </Button>
                            
                            <Select
                              value={complaint.status}
                              onValueChange={(status) => updateStatus({ id: complaint.id, status })}
                              disabled={isUpdatingStatus}
                            >
                              <SelectTrigger className="w-[140px] h-9 bg-background shadow-xs text-xs font-medium border-muted-foreground/20">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((opt) => (
                                  <SelectItem key={opt} value={opt} className="text-xs">
                                    {opt.replace("_", " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remarks Dialog */}
        <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-none shadow-2xl rounded-2xl overflow-hidden p-0">
            <DialogHeader className="p-6 bg-primary/5 border-b border-border">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
                Case Remarks: {selectedComplaint?.subject}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col h-[60vh]">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {(!selectedComplaint?.remarks || selectedComplaint.remarks.length === 0) ? (
                    <p className="text-center text-muted-foreground py-10 animate-fade-in">No remarks yet. Start the conversation.</p>
                  ) : (
                    [...selectedComplaint.remarks].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((remark, idx) => (
                      <div
                        key={remark.id || idx}
                        className="flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-300"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-primary">{remark.author?.name || "System User"}</span>
                          <span className="text-muted-foreground flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold">
                            <Clock className="w-3 h-3" />
                            {format(new Date(remark.createdAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-4 text-sm leading-relaxed border border-border shadow-xs text-foreground/90">
                          {remark.remark}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 bg-muted/30 border-t border-border mt-auto">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Type your remark here..."
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    className="min-h-[100px] bg-background border-muted-foreground/10 focus:border-primary transition-all resize-none shadow-inner"
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleAddRemark}
                    disabled={isAddingRemark || !remarkText.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {isAddingRemark ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Add Remark
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Complaints;

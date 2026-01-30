import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
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
  getPayrollTemplates,
  createPayrollTemplate,
  updatePayrollTemplate,
  deletePayrollTemplate,
  getStaffIDCardTemplates,
  createStaffIDCardTemplate,
  updateStaffIDCardTemplate,
  deleteStaffIDCardTemplate,
  getStudentIDCardTemplates,
  createStudentIDCardTemplate,
  updateStudentIDCardTemplate,
  deleteStudentIDCardTemplate,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "../lib/utils";

const salarySlipTemplate = `
<div style="display: flex; gap: 20px; font-family: Arial, sans-serif; font-size: 12px; min-width: 900px;">
  <!-- Employee Copy -->
  <div style="flex: 1; border: 1px solid #ccc; padding: 10px;">
     <div style="text-align: center; margin-bottom: 5px;">
        <h2 style="margin: 0; font-size: 18px; color: #333;">Concordia College Peshawar</h2>
        <p style="margin: 0; font-size: 11px; color: #555;">60-C, Near NCS School, University Town Peshawar<br>091-5619915 | 0332-8581222</p>
     </div>
     <div style="background-color: #ed7d31; color: white; text-align: center; padding: 5px; font-weight: bold; margin-bottom: 10px; border: 1px solid #d66d28;">
        Salary Slip FMO {{month}}
     </div>
     
     <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9; width: 30%;">Employee Name</td><td style="border: 1px solid #ccc; padding: 4px;">{{name}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Employee Id</td><td style="border: 1px solid #ccc; padding: 4px;">{{id}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Designation</td><td style="border: 1px solid #ccc; padding: 4px;">{{designation}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Department</td><td style="border: 1px solid #ccc; padding: 4px;">{{department}}</td></tr>
     </table>

     <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 10px; font-size: 11px;">
        <thead>
            <tr style="background-color: #fce4d6;">
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Allowances</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Amount</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Deductions</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Travelling</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{travelAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">EOBI</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{eobi}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">House Rent</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{houseRentAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Income Tax</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{incomeTax}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Medical</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{medicalAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Security</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{securityDeduction}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Insurance</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{insuranceAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Advance Salary</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{advanceDeduction}}</td></tr>
             <tr><td style="border: 1px solid #ccc; padding: 3px;">Other</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{otherAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Absentee</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{absentDeduction}}</td></tr>
             <tr><td style="border: 1px solid #ccc; padding: 3px;">Extra</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{extraAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Leave</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{leaveDeduction}}</td></tr>
              <tr><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;">Late Arrival</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{lateArrivalDeduction}}</td></tr>
              <tr><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;">Other</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{otherDeduction}}</td></tr>
        </tbody>
     </table>

     <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <tr><td style="border: 1px solid #ccc; padding: 4px; width: 60%;">Basic Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right; font-weight: bold;">{{basicSalary}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Advance Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{advanceDeduction}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Total Allowances</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{totalAllowances}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Total Deductions</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{totalDeductions}}</td></tr>
        <tr style="background-color: #f7f7f7;"><td style="border: 1px solid #ccc; padding: 4px; font-weight: bold;">Total Paid Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right; font-weight: bold;">{{netSalary}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Salary Paid Date</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{paymentDate}}</td></tr>
     </table>

     <div style="display: flex; justify-content: space-between; margin-top: 40px; border-top: 2px solid #ed7d31; padding-top: 5px;">
        <span style="font-size: 10px;">Accounts Officer Signature</span>
        <span style="font-size: 10px;">Employee Signature</span>
     </div>
     <div style="background-color: #ed7d31; color: white; text-align: center; padding: 2px; font-size: 10px; margin-top: 5px;">Employee Copy</div>
  </div>

  <!-- Institute Copy -->
  <div style="flex: 1; border: 1px solid #ccc; padding: 10px;">
     <div style="text-align: center; margin-bottom: 5px;">
        <h2 style="margin: 0; font-size: 18px; color: #333;">Concordia College Peshawar</h2>
        <p style="margin: 0; font-size: 11px; color: #555;">60-C, Near NCS School, University Town Peshawar<br>091-5619915 | 0332-8581222</p>
     </div>
     <div style="background-color: #ed7d31; color: white; text-align: center; padding: 5px; font-weight: bold; margin-bottom: 10px; border: 1px solid #d66d28;">
        Salary Slip FMO {{month}}
     </div>
     
     <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9; width: 30%;">Employee Name</td><td style="border: 1px solid #ccc; padding: 4px;">{{name}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Employee Id</td><td style="border: 1px solid #ccc; padding: 4px;">{{id}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Designation</td><td style="border: 1px solid #ccc; padding: 4px;">{{designation}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px; background-color: #f9f9f9;">Department</td><td style="border: 1px solid #ccc; padding: 4px;">{{department}}</td></tr>
     </table>

     <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 10px; font-size: 11px;">
        <thead>
            <tr style="background-color: #fce4d6;">
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Allowances</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Amount</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Deductions</th>
                <th style="border: 1px solid #ccc; padding: 4px; width: 25%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Travelling</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{travelAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">EOBI</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{eobi}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">House Rent</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{houseRentAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Income Tax</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{incomeTax}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Medical</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{medicalAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Security</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{securityDeduction}}</td></tr>
            <tr><td style="border: 1px solid #ccc; padding: 3px;">Insurance</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{insuranceAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Advance Salary</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{advanceDeduction}}</td></tr>
             <tr><td style="border: 1px solid #ccc; padding: 3px;">Other</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{otherAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Absentee</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{absentDeduction}}</td></tr>
             <tr><td style="border: 1px solid #ccc; padding: 3px;">Extra</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{extraAllowance}}</td><td style="border: 1px solid #ccc; padding: 3px;">Leave</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{leaveDeduction}}</td></tr>
              <tr><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;">Late Arrival</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{lateArrivalDeduction}}</td></tr>
              <tr><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;"></td><td style="border: 1px solid #ccc; padding: 3px;">Other</td><td style="border: 1px solid #ccc; padding: 3px; text-align: right;">{{otherDeduction}}</td></tr>
        </tbody>
     </table>

     <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
        <tr><td style="border: 1px solid #ccc; padding: 4px; width: 60%;">Basic Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right; font-weight: bold;">{{basicSalary}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Advance Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{advanceDeduction}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Total Allowances</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{totalAllowances}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Total Deductions</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{totalDeductions}}</td></tr>
        <tr style="background-color: #f7f7f7;"><td style="border: 1px solid #ccc; padding: 4px; font-weight: bold;">Total Paid Salary</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right; font-weight: bold;">{{netSalary}}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 4px;">Salary Paid Date</td><td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{{paymentDate}}</td></tr>
     </table>

     <div style="display: flex; justify-content: space-between; margin-top: 40px; border-top: 2px solid #ed7d31; padding-top: 5px;">
        <span style="font-size: 10px;">Accounts Officer Signature</span>
        <span style="font-size: 10px;">Employee Signature</span>
     </div>
     <div style="background-color: #ed7d31; color: white; text-align: center; padding: 2px; font-size: 10px; margin-top: 5px;">Institute Copy</div>
  </div>
</div>
`;

const payrollSheetTemplate = `
<div style="font-family: Arial, sans-serif; font-size: 12px; width: 100%;">
    <div style="text-align: center; margin-bottom: 10px;">
        <h1 style="margin: 5px 0; font-size: 24px; color: #333;">Concordia College Peshawar</h1>
        <p style="margin: 0; color: #666; font-size: 12px;">60-C, Near NCS School, University Town Peshawar<br>091-5619915 | 0332-8581222</p>
    </div>
    <div style="background-color: #ed7d31; color: white; text-align: center; padding: 8px; font-weight: bold; font-size: 16px; margin-bottom: 15px; border: 1px solid #d66d28;">
        Employees Salary / Payroll Sheet
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; border: 1px solid #ccc; padding: 8px; background-color: #f9f9f9;">
        <div><strong>Month:</strong> {{month}}</div>
        <div><strong>Session:</strong> 2024-2025</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
            <tr style="background-color: #fce4d6;">
                <th style="border: 1px solid #ccc; padding: 8px; text-align: center; width: 5%;">Sr.</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; width: 20%;">Employee Name</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: left; width: 15%;">Designation</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Basic Salary</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Allowances</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Deductions</th>
                <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">Total Payable</th>
            </tr>
        </thead>
        <tbody>
            {{rows}}
        </tbody>
        <tfoot>
             <tr style="background-color: #fce4d6; font-weight: bold;">
                <td colspan="3" style="border: 1px solid #ccc; padding: 8px; text-align: center;">Total</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">{{totalBasicSalary}}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">{{totalAllowances}}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">{{totalDeductions}}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">{{totalNetSalary}}</td>
             </tr>
        </tfoot>
    </table>
</div>
`;

const reportCardDesignTemplate = `
<div style="width: 210mm; padding: 10mm; font-family: 'Times New Roman', serif; border: 3px solid #336699; position: relative; margin: 0 auto; box-sizing: border-box;">
  <!-- Corner Decorations -->
  <div style="position: absolute; top: 5px; left: 5px; width: 20px; height: 20px; border-top: 3px solid #336699; border-left: 3px solid #336699;"></div>
  <div style="position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; border-top: 3px solid #336699; border-right: 3px solid #336699;"></div>
  <div style="position: absolute; bottom: 5px; left: 5px; width: 20px; height: 20px; border-bottom: 3px solid #336699; border-left: 3px solid #336699;"></div>
  <div style="position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px; border-bottom: 3px solid #336699; border-right: 3px solid #336699;"></div>

  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
    <div style="width: 100px;">
       <img src="{{logoUrl}}" alt="Logo" style="width: 80px; height: auto;">
    </div>
    <div style="text-align: center; flex: 1;">
       <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #000; font-family: serif;">Concordia College Peshawar</h1>
       <p style="margin: 5px 0 0 0; font-size: 14px;">60-C A University Road, University Town, Peshawar</p>
       <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold;">091-5619915 | 0332-8581222</p>
    </div>
    <div style="width: 100px; display: flex; justify-content: flex-end;">
       <div style="width: 90px; height: 110px; border: 2px solid #ccc; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          {{studentPhotoOrPlaceholder}}
       </div>
    </div>
  </div>

  <!-- Title Bar -->
  <div style="background-color: #BDD7EE; padding: 8px; text-align: center; margin-bottom: 25px; border-top: 2px solid #336699; border-bottom: 2px solid #336699;">
     <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 1px;">RESULT CARD ({{examType}})</h2>
  </div>

  <!-- Student Info -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px 40px; margin-bottom: 25px; font-size: 15px;">
     <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Student Name:</span>
       <span style="flex: 1; padding-left: 10px;">{{studentName}}</span>
     </div>
     <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Father Name:</span>
       <span style="flex: 1; padding-left: 10px;">{{fatherName}}</span>
     </div>
      <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Class/Section:</span>
       <span style="flex: 1; padding-left: 10px;">{{class}} / {{section}}</span>
     </div>
     <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Session:</span>
       <span style="flex: 1; padding-left: 10px;">{{session}}</span>
     </div>
      <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Adm No:</span>
       <span style="flex: 1; padding-left: 10px;">{{admNo}}</span>
     </div>
     <div style="display: flex; align-items: flex-end; border-bottom: 2px solid #000;">
       <span style="font-weight: bold; width: 130px;">Reg No:</span>
       <span style="flex: 1; padding-left: 10px;">{{regNo}}</span>
     </div>
  </div>

  <!-- Marks Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; border: 2px solid #000;">
    <thead>
      <tr style="background-color: #BDD7EE; border-bottom: 2px solid #000; text-align: center;">
        <th style="border: 1px solid #000; padding: 8px; width: 60px;">S.NO</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: left;">SUBJECTS</th>
        <th style="border: 1px solid #000; padding: 8px; width: 80px;">TOTAL</th>
        <th style="border: 1px solid #000; padding: 8px; width: 100px;">OBTAINED</th>
        <th style="border: 1px solid #000; padding: 8px; width: 100px;">PERCENTAGE</th>
        <th style="border: 1px solid #000; padding: 8px; width: 60px;">Grade</th>
      </tr>
    </thead>
    <tbody>
      {{marksRows}}
      
      <!-- Total Row -->
      <tr style="background-color: #BDD7EE; font-weight: bold; border-top: 2px solid #000;">
         <td colspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; text-transform: uppercase;">TOTAL</td>
         <td style="border: 1px solid #000; padding: 8px; text-align: center;">{{totalMarks}}</td>
         <td style="border: 1px solid #000; padding: 8px; text-align: center;">{{obtainedMarks}}</td>
         <td style="border: 1px solid #000; padding: 8px; text-align: center;">{{percentage}}%</td>
         <td style="border: 1px solid #000; padding: 8px; text-align: center;">{{grade}}</td>
      </tr>
    </tbody>
  </table>

  <!-- Remarks Panel -->
  <div style="border: 2px solid #336699; margin-bottom: 50px;">
    <div style="display: flex; border-bottom: 1px solid #336699; background-color: #BDD7EE;">
       <div style="flex: 1; border-right: 1px solid #336699; padding: 8px; text-align: center; font-weight: bold;">
          Grade: {{grade}}
       </div>
       <div style="flex: 2; padding: 8px; text-align: center; font-weight: bold;">
          Remarks: {{remarks}}
       </div>
    </div>
    <div style="display: flex; padding: 12px; align-items: flex-start; min-height: 40px;">
       <span style="font-weight: bold; margin-right: 10px; white-space: nowrap;">Teacher Remarks:</span>
       <span style="font-style: italic; font-family: cursive;">{{teacherRemarks}}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px;">
     <div style="text-align: center;">
        <div style="border-bottom: 2px solid #000; width: 180px; margin-bottom: 8px;"></div>
        <span style="font-weight: bold;">Exam Controller Signature</span>
     </div>
     
     <div style="text-align: center;">
        <!-- Badge Icon Gold -->
        <div style="width: 80px; height: 80px; background: radial-gradient(circle, #fdb931 0%, #d4af37 100%); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #fff;">
           <span style="font-size: 20px; text-shadow: 1px 1px 2px #000;">{{position}}</span>
           <span style="font-size: 10px; text-transform: uppercase;">Position</span>
        </div>
     </div>

     <div style="text-align: center;">
        <div style="border-bottom: 2px solid #000; width: 180px; margin-bottom: 8px;"></div>
        <span style="font-weight: bold;">Principal's Signature</span>
     </div>
  </div>
</div>
`;

const challanDesignTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
  body { font-family: 'Roboto', sans-serif; font-size: 10px; margin: 0; padding: 10px; -webkit-print-color-adjust: exact; }
  .challan-container { display: flex; justify-content: space-between; gap: 10px; width: 100%; box-sizing: border-box; }
  .challan-copy { flex: 1; border: 1px solid #999; padding: 0; max-width: 32.5%; box-sizing: border-box; display: flex; flex-direction: column; }
  
  /* Header */
  .header { display: flex; padding: 10px; align-items: center; justify-content: center; gap: 10px; border-bottom: 1px solid #ccc; }
  .logo { width: 40px; height: 40px; background-color: #f29200; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; }
  .institute-info { text-align: center; }
  .institute-info h1 { margin: 0; font-size: 14px; font-weight: bold; color: #000; }
  .institute-info p { margin: 2px 0; font-size: 9px; color: #333; }

  /* Bank Info */
  .bank-info { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 5px; border-bottom: 1px solid #ccc; }
  .bank-logo { font-weight: bold; color: #0056b3; font-style: italic; font-size: 12px; }
  .account-info { text-align: center; font-size: 10px; }
  .account-info strong { display: block; }

  /* Student Details Grid */
  .details-grid { display: grid; grid-template-columns: 100px 1fr; border-bottom: 1px solid #ccc; }
  .grid-row { display: contents; }
  .grid-label { padding: 4px 8px; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; font-weight: bold; background-color: #f9f9f9; }
  .grid-value { padding: 4px 8px; border-bottom: 1px solid #ccc; }
  .grid-row:last-child .grid-label, .grid-row:last-child .grid-value { border-bottom: none; }

  /* Fee Table */
  .fee-table { width: 100%; border-collapse: collapse; margin-top: 0; flex-grow: 1; }
  .fee-table th { background-color: #ed7d31; color: black; padding: 4px 8px; text-align: left; border: 1px solid #ccc; font-weight: bold; font-size: 10px; }
  .fee-table th:last-child { text-align: right; }
  .fee-table td { padding: 4px 8px; border: 1px solid #ccc; font-size: 10px; }
  .fee-table td:last-child { text-align: right; }
  
  /* Fee Rows Height Fix to match look */
  .fee-table tbody tr td { height: 14px; } 

  /* Totals */
  .total-row td { background-color: #ed7d31; color: black; font-weight: bold; border-top: 2px solid #000; }
  .late-fee-row td { color: black; font-weight: bold; text-align: center; border: 1px solid #ccc; padding: 5px; }

  /* Instructions */
  .instructions { padding: 10px; font-size: 8px; border-top: 1px solid #ccc; }
  .instructions h3 { margin: 0 0 2px 0; font-size: 9px; font-weight: bold; }
  .instructions ol { margin: 0; padding-left: 15px; }
  .instructions li { margin-bottom: 1px; }

  /* Signatures */
  .signatures { display: flex; justify-content: space-between; padding: 20px 10px 5px 10px; margin-top: auto; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px solid #000; width: 80px; margin-bottom: 2px; }
  .sig-label { font-size: 8px; }

  /* Footer Label */
  .footer-label { background-color: #ed7d31; color: black; text-align: center; padding: 4px; font-weight: bold; font-size: 10px; border-top: 1px solid #000; }
</style>
</head>
<body>
<div class="challan-container">
  <!-- Copy Loop -->
  ${['Bank Copy', 'Institute Copy', 'Student Copy'].map(copyName => `
  <div class="challan-copy">
    <!-- Header -->
    <div class="header">
      <div class="logo">LOGO</div>
      <div class="institute-info">
        <h1>Concordia College Peshawar</h1>
        <p>60-C, Near NCS School, University Town Peshawar</p>
        <p>091-5619915 | 0332-8581222</p>
      </div>
    </div>

    <!-- Bank -->
    <div class="bank-info">
      <div class="bank-logo">UBL</div>
      <div class="account-info">
        <strong>United Bank Limited</strong>
        <span>A/C No. 340346138</span>
      </div>
    </div>

    <!-- Student Details -->
    <div class="info-grid">
    <div>
      <div class="info-row"><span class="label">Student Name:</span> {{studentName}}</div>
      <div class="info-row"><span class="label">Father Name:</span> {{fatherName}}</div>
      <div class="info-row"><span class="label">Roll Number:</span> {{rollNo}}</div>
      <div class="info-row"><span class="label">Class:</span> {{className}}</div>
    </div>
    <div>
      <div class="info-row"><span class="label">Registration No:</span> {{regNo}}</div>
      <div class="info-row"><span class="label">Track/Group:</span> {{group}}</div>
      <div class="info-row"><span class="label">Session:</span> {{session}}</div>
      <div class="info-row"><span class="label">Section:</span> {{sectionName}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="subject-col">Subject</th>
        <th>Total Marks</th>
        <th>Obtained Marks</th>
        <th>Percentage</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      {{marksRows}}
    </tbody>
    <tfoot>
      <tr style="font-weight: bold; background: #f0f0f0;">
        <td class="subject-col">Grand Total</td>
        <td>{{totalMarks}}</td>
        <td>{{obtainedMarks}}</td>
        <td>{{percentage}}%</td>
        <td>{{grade}}</td>
      </tr>
    </tfoot>
  </table>

  <div class="summary">
    <div class="summary-item">
      <span class="big-text">{{percentage}}%</span>
      Percentage
    </div>
    <div class="summary-item">
      <span class="big-text" style="color: {{gradeColor}}">{{grade}}</span>
      Grade
    </div>
    <div class="summary-item">
      <span class="big-text">{{gpa}}</span>
      GPA
    </div>
    <div class="summary-item">
      <span class="big-text">{{position}}</span>
      Position
    </div>
  </div>

  <div class="footer">
    <div class="signature">Controller of Exams</div>
    <div class="signature">Principal</div>
  </div>
</body>
</html>
  `).join('')}
</div>
</body>
</html>
`;

const teacherIdCardDesignTemplate = `
<div class="id-card-container" style="font-family: 'Times New Roman', serif; display: flex; gap: 20px; padding: 20px;">
    <!-- Front Side -->
    <div style="width: 322px; height: 530px; background-image: url('https://placehold.co/322x530/orange/white?text=Background+Image'); background-size: cover; background-position: center; border: 1px solid #ccc; position: relative; overflow: hidden; color: #000; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; padding: 15px 15px 5px 15px; align-items: flex-start;">
             <div style="display: flex; align-items: center;">
                <img src="{{logoUrl}}" alt="Concordia" style="height: 40px; display: block;">
             </div>
             <div>
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Beaconhouse_School_System_logo.svg/1200px-Beaconhouse_School_System_logo.svg.png" alt="Beaconhouse" style="height: 35px; display: block;">
             </div>
        </div>

        <div style="text-align: center; margin-top: 5px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #000; line-height: 1.1; font-family: 'Times New Roman', serif; text-shadow: 0px 0px 1px rgba(0,0,0,0.1);">CONCORDIA COLLEGE<br>PESHAWAR CAMPUS</h1>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; font-family: 'UnifrakturMaguntia', 'Gothic', serif; color: #000;">A Project of Beaconhouse</p>
        </div>

        <!-- Photo -->
         <div style="display: flex; justify-content: center; margin-top: 25px;">
            <div style="width: 150px; height: 150px; border-radius: 50%; border: 5px solid #F29200; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center;">
                {{employeePhoto}} 
            </div>
         </div>

         <!-- Details -->
         <div style="text-align: center; margin-top: 20px;">
            <h2 style="margin: 0; font-size: 26px; font-weight: 900; color: #4a3b2b; text-transform: uppercase; font-family: Arial, sans-serif;">{{name}}</h2>
             <div style="border-bottom: 2px solid #000; width: 85%; margin: 8px auto;"></div>
            <p style="margin: 5px 0; font-size: 18px; font-weight: 900; color: #4a3b2b; text-transform: uppercase; letter-spacing: 0.5px; font-family: Arial, sans-serif;">{{designation}}</p>
            <p style="margin: 15px 0; font-size: 18px; font-weight: 900; color: #4a3b2b; font-family: Arial, sans-serif;">EMPLOYEE ID: {{employeeId}}</p>
         </div>

         <!-- Footer -->
         <div style="position: absolute; bottom: 0; width: 100%;">
            <div style="padding: 5px 15px; font-size: 14px; font-weight: bold; color: #4a3b2b; display: flex; flex-direction: column;">
                <span style="text-decoration: underline; font-weight: 900; font-size: 16px; font-family: Arial, sans-serif;">Issued</span>
                <span style="font-family: Arial, sans-serif;">{{issueDate}}</span>
            </div>
            <div style="background-color: #F29200; color: #4a3b2b; text-align: center; padding: 8px 0; font-weight: 900; font-size: 22px; letter-spacing: 1px; font-family: 'Times New Roman', serif; text-transform: uppercase; border-top: 1px solid #da8300;">
                EMPLOYEE
            </div>
         </div>
    </div>

    <!-- Back Side -->
    <div style="width: 322px; height: 530px; background-image: url('https://placehold.co/322x530/orange/white?text=Background+Image'); background-size: cover; background-position: center; border: 1px solid #ccc; position: relative; overflow: hidden; color: #000; padding: 20px; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; align-items: flex-start;">
             <div style="display: flex; align-items: center;">
                <img src="{{logoUrl}}" alt="Concordia" style="height: 40px; display: block;">
             </div>
             <div>
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Beaconhouse_School_System_logo.svg/1200px-Beaconhouse_School_System_logo.svg.png" alt="Beaconhouse" style="height: 35px; display: block;">
             </div>
        </div>

        <h3 style="color: #F29200; font-size: 18px; font-weight: 900; text-transform: uppercase; border-bottom: 2px solid #F29200; display: inline-block; padding-bottom: 2px; margin: 0 0 25px 0; font-family: 'Times New Roman', serif;">PERSONAL INFORMATION</h3>

        <div style="font-size: 13px; font-weight: 900; line-height: 1.6; color: #4a3b2b; font-family: Arial, sans-serif;">
            <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Father Name :</span>
                <span style="flex: 1;">{{fatherName}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Contact Number :</span>
                <span style="flex: 1;">{{phone}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">CNIC No:</span>
                <span style="flex: 1;">{{cnic}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Date of Birth :</span>
                <span style="flex: 1;">{{dob}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Email Address:</span>
                <span style="flex: 1; word-break: break-all;">{{email}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Blood Group:</span>
                <span style="flex: 1;">{{bloodGroup}}</span>
            </div>
             <div style="display: flex; margin-bottom: 5px;">
                <span style="width: 130px; color: #4a3b2b;">Address :</span>
                <span style="flex: 1; line-height: 1.2;">{{address}}</span>
            </div>
        </div>

        <div style="border-bottom: 2px solid #000; margin: 25px 0;"></div>

        <div style="text-align: center; font-size: 11px; font-weight: 900; color: #4a3b2b; line-height: 1.4; font-family: Arial, sans-serif;">
            <p style="margin: 0;">This card is the Property of Concordia College Peshawar.</p>
            <p style="margin: 0;">This Card is non-transferable and is valid for Concordia<br>College Peshawar Campus ONLY.</p>
            
            <p style="margin: 15px 0 5px 0;">If Found Please return to:</p>
            <p style="margin: 5px 0; font-size: 11px;">Concordia College Peshawar<br>Address: 60-C University Road, University Town,<br>Peshawar, KPK, Pakistan</p>
             <p style="margin: 10px 0;">Telephone: 091-5619915 &nbsp; WhatsApp: 0332-8581222</p>
        </div>

        <!-- Barcode Placeholder -->
        <div style="position: absolute; bottom: 20px; width: 100%; text-align: center; left: 0;">
             <div style="font-family: 'Code 39', sans-serif; font-size: 30px;">|| ||| || ||| || |||</div>
        </div>

    </div>
</div>
`;

const studentIdCardDesignTemplate = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Playfair+Display:wght@700&family=UnifrakturMaguntia&display=swap');
  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
</style>
</head>
<body>
<!-- FRONT SIDE -->
<div style="width: 322px; height: 530px; position: relative; background-color: #ffe4c4; overflow: hidden; border: 1px solid #ccc; font-family: 'Roboto', sans-serif; display: flex; flex-direction: column;">
  <!-- Sunburst Background -->
  <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: repeating-conic-gradient(#ffe4c4 0% 10%, #fff0db 10% 20%); animation: rotate 20s linear infinite; z-index: 0; opacity: 0.6;"></div>
  
  <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 20px 15px 0 15px;">
    <!-- Headers -->
    <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-bottom: 5px;">
       <div style="display: flex; align-items: center; gap: 5px;">
           <img src="{{logoUrl}}" style="height: 45px; object-fit: contain;">
       </div>
       <div>
           <img src="https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Beaconhouse_School_System_logo.svg/1200px-Beaconhouse_School_System_logo.svg.png" style="height: 40px; object-fit: contain;">
       </div>
    </div>

    <!-- College Name -->
    <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="margin: 0; font-family: 'Times New Roman', serif; font-weight: 900; font-size: 26px; color: #000; line-height: 1.1;">CONCORDIA COLLEGE<br>PESHAWAR CAMPUS</h1>
        <div style="font-family: 'UnifrakturMaguntia', cursive; font-size: 20px; color: #000; margin-top: 5px;">A Project of Beaconhouse</div>
    </div>

    <!-- Photo -->
    <div style="width: 170px; height: 170px; border-radius: 50%; border: 6px solid #f29200; overflow: hidden; background: #fff; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
             {{studentPhoto}}
        </div>
    </div>

    <!-- Name & Details -->
    <div style="text-align: center; width: 100%;">
        <div style="color: #4a3b2b; font-size: 28px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase;">{{name}}</div>
        
        <div style="width: 90%; height: 2px; background-color: #000; margin: 5px auto 15px auto;"></div>
        
        <div style="color: #4a3b2b; font-size: 18px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase;">ADMISSION NO: {{admissionNo}}</div>
        <div style="color: #4a3b2b; font-size: 18px; font-weight: 900; text-transform: uppercase;">{{classGroup}}</div>
    </div>

    <div style="flex: 1;"></div>

    <!-- Footer Dates -->
    <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 5px; margin-bottom: 10px; box-sizing: border-box;">
        <div style="text-align: left;">
            <div style="font-size: 16px; font-weight: 900; text-decoration: underline; color: #4a3b2b;">Issued</div>
            <div style="font-size: 14px; color: #4a3b2b;">{{issueDate}}</div>
        </div>
        <div style="text-align: right;">
             <div style="font-size: 16px; font-weight: 900; text-decoration: underline; color: #4a3b2b;">Expiry</div>
            <div style="font-size: 14px; color: #4a3b2b;">{{expiryDate}}</div>
        </div>
    </div>
  </div>

  <!-- Bottom Strip -->
  <div style="background-color: #f29200; height: 45px; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
      <span style="color: #4a3b2b; font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 900; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px;">STUDENT</span>
  </div>
</div>

<!-- BACK SIDE -->
<div style="width: 322px; height: 530px; position: relative; background-color: #ffe4c4; overflow: hidden; border: 1px solid #ccc; font-family: 'Roboto', sans-serif; display: flex; flex-direction: column; margin-top: 20px;">
   <!-- Sunburst Background -->
  <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: repeating-conic-gradient(#ffe4c4 0% 10%, #fff0db 10% 20%); z-index: 0; opacity: 0.6;"></div>

  <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; padding: 20px;">
      <!-- Headers -->
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 5px;">
           <img src="{{logoUrl}}" style="height: 45px; object-fit: contain;">
        </div>
        <div>
           <img src="https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Beaconhouse_School_System_logo.svg/1200px-Beaconhouse_School_System_logo.svg.png" style="height: 40px; object-fit: contain;">
        </div>
      </div>

      <!-- Personal Info Section -->
      <h2 style="color: #f29200; font-size: 20px; font-weight: 900; text-decoration: underline; text-transform: uppercase; margin: 0 0 15px 0;">PERSONAL INFORMATION</h2>
      
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #4a3b2b; font-weight: 900;">
          <div style="display: flex;">
              <span style="width: 140px;">Father Name :</span>
              <span>{{fatherName}}</span>
          </div>
          <div style="display: flex;">
              <span style="width: 140px;">Contact Number :</span>
              <span>{{phone}}</span>
          </div>
           <div style="display: flex;">
              <span style="width: 140px;">Father Contact :</span>
              <span>{{fatherContact}}</span>
          </div>
           <div style="display: flex;">
              <span style="width: 140px;">Date of Birth :</span>
              <span>{{dob}}</span>
          </div>
           <div style="display: flex;">
              <span style="width: 140px;">Address :</span>
              <span style="flex: 1; line-height: 1.2;">{{address}}</span>
          </div>
      </div>

      <div style="margin-top: 30px;">
           <h2 style="color: #f29200; font-size: 20px; font-weight: 900; text-decoration: underline; text-transform: uppercase; margin: 0 0 15px 0;">STUDENT CONDUCT REMINDER</h2>
           
           <div style="font-size: 13px; color: #4a3b2b; font-weight: 900; line-height: 1.4;">
               <div style="margin-bottom: 5px;">By using this ID, you agree to:</div>
               <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
                   <li style="margin-bottom: 4px;">Follow campus rules</li>
                   <li style="margin-bottom: 4px;">Protect your ID from misuse</li>
                   <li style="margin-bottom: 4px;">Represent your College with integrity</li>
               </ul>
           </div>
      </div>

      <div style="margin-top: auto;">
          <div style="color: #4a3b2b; font-weight: 900; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">
              <div>This card is the Property of Concordia College Peshawar.</div>
              <div>This Card is non-transferable and is valid for Concordia College Peshawar Campus ONLY.</div>
          </div>

          <div style="color: #4a3b2b; font-weight: 900; font-size: 13px; margin-bottom: 15px;">
              If Found Please return to:
          </div>

          <div style="color: #4a3b2b; font-weight: 900; font-size: 13px; margin-bottom: 15px;">
              <div>Concordia College Peshawar</div>
               <div style="line-height: 1.3;">Address: 60-C University Road, University Town,<br>Peshawar, KPK, Pakistan</div>
          </div>

           <div style="color: #4a3b2b; font-weight: 900; font-size: 13px; display: flex; gap: 10px; align-items: center;">
              <span>Telephone: 091-5619915</span>
              <span>WhatsApp: 0332-8581222</span>
          </div>

          <!-- Barcode Placeholder -->
          <div style="margin-top: 10px; height: 40px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px); width: 100%;"></div>
      </div>
  </div>
</div>
</body>
</html>
`;


const Configuration = () => {
  const {
    config,
    branches,
    roles,
    challanTemplates,
    idCardTemplates,
    // updateConfig removed as per user request to use backend only for institute
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
  const [configForm, setConfigForm] = useState({
    instituteName: "",
    email: "",
    phone: "",
    address: "",
    facebook: "",
    instagram: "",
    logo: "",
  });
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "",
    address: "",
  });

  const queryClient = useQueryClient();
  const [roleForm, setRoleForm] = useState({
    role: "",
    permissions: [],
  });
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
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
  const [teacherIdCardDialog, setTeacherIdCardDialog] = useState(false);
  const [studentIdCardDialog, setStudentIdCardDialog] = useState(false);
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
  const [teacherIdCardForm, setTeacherIdCardForm] = useState({
    name: "",
    htmlContent: "",
    isDefault: false,
  });
  const [studentIdCardForm, setStudentIdCardForm] = useState({
    name: "",
    htmlContent: "",
    isDefault: false,
  });
  const [editingChallan, setEditingChallan] = useState(null);
  const [editingMarksheet, setEditingMarksheet] = useState(null);
  const [editingIdCard, setEditingIdCard] = useState(null);
  const [editingTeacherIdCard, setEditingTeacherIdCard] = useState(null);
  const [editingStudentIdCard, setEditingStudentIdCard] = useState(null);
  const [previewChallan, setPreviewChallan] = useState(null);
  const [previewMarksheet, setPreviewMarksheet] = useState(null);
  const [previewIdCard, setPreviewIdCard] = useState(null);
  const [previewTeacherIdCard, setPreviewTeacherIdCard] = useState(null);
  const [previewStudentIdCard, setPreviewStudentIdCard] = useState(null);



  // Helper function to map admin data from API response
  const mapAdminData = (admin) => ({
    id: admin.id,
    name: admin.name || admin.email.split("@")[0],
    email: admin.email,
    role: admin.role,
    accessRights: admin.permissions?.modules || [],
  });

  // Fetch admins using React Query
  const { data: adminsRaw = [], isLoading: adminsLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: getAdmins,
  });

  const admins = Array.isArray(adminsRaw)
    ? adminsRaw.filter(a => a.role === "SUPER_ADMIN").map(mapAdminData)
    : [];

  // Mutations
  const createAdminMutation = useMutation({
    mutationFn: createAdminAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast({ title: "Admin created successfully" });
      setDialog({ type: "", open: false });
      setAdminForm({ name: "", email: "", password: "", role: "ADMIN" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create admin", variant: "destructive" });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "Admin updated successfully" });
      setDialog({ type: "", open: false });
      setEditing(null);
      setAdminForm({ name: "", email: "", password: "", role: "ADMIN" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update admin", variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: deleteAdminAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "Admin deleted successfully" });
      setDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete admin", variant: "destructive" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast({ title: "Password updated successfully" });
      setPasswordDialog(false);
      setPasswordForm({ adminId: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminAPI(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({
        title: "Success",
        description: `Access updated for ${variables.module}`,
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update access rights", variant: "destructive" });
    },
  });

  // Teacher ID Card State (Refactored to Backend)
  const [teacherIdCardTemplates, setTeacherIdCardTemplates] = useState([]);
  const [studentIdCardTemplates, setStudentIdCardTemplates] = useState([]);

  // Marks Templates
  const [marksheetTemplates, setMarksheetTemplates] = useState([]);
  const [payrollTemplates, setPayrollTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [marksheetData, payrollData, staffIdCardData, studentIdCardData] = await Promise.all([
          getReportCardTemplates(),
          getPayrollTemplates(),
          getStaffIDCardTemplates(),
          getStudentIDCardTemplates()
        ]);
        setMarksheetTemplates(marksheetData);
        setPayrollTemplates(payrollData);
        setTeacherIdCardTemplates(staffIdCardData);
        setStudentIdCardTemplates(studentIdCardData);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Error fetching templates",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    };
    fetchTemplates();
  }, []);

  // Payroll Templates state
  const [payrollDialog, setPayrollDialog] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    name: "",
    type: "SALARY_SLIP",
    htmlContent: "",
    isDefault: false,
  });
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [previewPayroll, setPreviewPayroll] = useState(null);

  // Fetch Payroll Templates on component mount
  useEffect(() => {
    const loadPayrollTemplates = async () => {
      try {
        const templates = await getPayrollTemplates();
        setPayrollTemplates(templates);
      } catch (error) {
        console.error("Failed to fetch payroll templates:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch payroll templates",
          variant: "destructive",
        });
      }
    };
    loadPayrollTemplates();
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
      const updated = await updateInstituteSettings(configForm);
      // Invalidate the query to refresh header/sidebar logo and name
      queryClient.invalidateQueries({ queryKey: ["instituteSettings"] });
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
    // Map frontend data to backend format
    // Role is always "ADMIN", access rights determine the role access
    const adminData = {
      name: adminForm.name,
      email: adminForm.email,
      password: adminForm.password,
      role: adminForm.role,
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
      updateAdminMutation.mutate({ id: editing.id, data: updateData });
    } else {
      createAdminMutation.mutate(adminData);
    }
  };
  const toggleAccessRight = async (adminId, module) => {
    const admin = admins.find((a) => a.id === adminId);
    if (!admin) return;
    const hasAccess = admin.accessRights.includes(module);
    const newAccessRights = hasAccess
      ? admin.accessRights.filter((m) => m !== module)
      : [...admin.accessRights, module];

    // Update only permissions, role remains "ADMIN"
    const updateData = {
      permissions: { modules: newAccessRights },
    };

    toggleAccessMutation.mutate({ id: adminId, data: updateData, module });
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "admin") {
      deleteAdminMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "branch") {
      deleteBranch(deleteTarget.id);
      toast({
        title: "Branch deleted successfully",
      });
      setDeleteDialog(false);
      setDeleteTarget(null);
    } else if (deleteTarget.type === "role") {
      deleteRole(deleteTarget.id);
      toast({
        title: "Role deleted successfully",
      });
      setDeleteDialog(false);
      setDeleteTarget(null);
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
      role: admin.role || "ADMIN",
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

    // Update password via mutation
    const updateData = {
      password: passwordForm.newPassword,
    };
    updatePasswordMutation.mutate({ id: passwordForm.adminId, data: updateData });
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
          <TabsList className="mb-8">
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

          {/* <TabsContent value="branches">
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
          </TabsContent> */}

          {/* <TabsContent value="roles">
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
          {/* <TableHead>Permissions</TableHead>
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
          </TabsContent> */}

          <TabsContent value="admins">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  System Administrators
                </CardTitle>
              </CardHeader>

              <Dialog
                open={dialog.type === "admin" && dialog.open}
                onOpenChange={(open) =>
                  setDialog({
                    type: "admin",
                    open,
                  })
                }
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Super Admin</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
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
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        value={adminForm.email}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAdminSubmit} className="w-full">
                        Update Account
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Access Rights</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminsLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Loading admins...
                        </TableCell>
                      </TableRow>
                    ) : admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No admins found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.map((admin) => {
                        return (
                          <TableRow key={admin.id}>
                            <TableCell>{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge variant={admin.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                                {admin.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {admin.role === "SUPER_ADMIN" ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50/50 px-3 py-1.5 rounded-full w-fit border border-green-100">
                                  <Shield className="h-3.5 w-3.5" />
                                  <span className="text-xs font-semibold uppercase tracking-wider">Full system Access</span>
                                </div>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-2 border-dashed hover:border-primary hover:text-primary transition-colors"
                                    >
                                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs">Manage Permissions</span>
                                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">
                                        {admin.accessRights.length}
                                      </Badge>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-[450px] p-0 bg-popover shadow-2xl border-border rounded-xl overflow-hidden"
                                    align="start"
                                    sideOffset={8}
                                  >
                                    <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                                      <div>
                                        <h4 className="font-bold text-sm text-foreground">Module Access</h4>
                                        <p className="text-[10px] text-muted-foreground">Toggle module permissions for this admin</p>
                                      </div>
                                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                                        {admin.accessRights.length} Active
                                      </Badge>
                                    </div>

                                    <div className="p-3 grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto">
                                      {allModules.map((module) => {
                                        const hasAccess = admin.accessRights.includes(module);
                                        return (
                                          <div
                                            key={module}
                                            onClick={() => toggleAccessRight(admin.id, module)}
                                            className={cn(
                                              "group flex items-center justify-between px-3 py-2.5 text-[11px] rounded-lg cursor-pointer transition-all border duration-200",
                                              hasAccess
                                                ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                                : "bg-background text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
                                            )}
                                          >
                                            <span className="font-medium mr-2">{module}</span>
                                            <div className={cn(
                                              "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                                              hasAccess
                                                ? "bg-primary border-primary"
                                                : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                            )}>
                                              {hasAccess && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="bg-muted/10 px-4 py-2 border-t mt-1">
                                      <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-semibold italic">
                                        Changes are saved automatically
                                      </p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
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
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
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
                            <div className="flex justify-between items-center mb-2">
                              <Label>HTML Content</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setChallanForm({
                                    ...challanForm,
                                    htmlContent: challanDesignTemplate,
                                  })
                                }
                              >
                                Load Standard Design
                              </Button>
                            </div>
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
                              const payload = {
                                name: challanForm.name,
                                htmlContent: challanForm.htmlContent,
                                isDefault: challanForm.isDefault,
                              };

                              if (editingChallan) {
                                // "editingChallan" is the ID of the template being edited
                                updateChallanTemplate(editingChallan, payload)
                                  .then(() => {
                                    toast({
                                      title: "Template updated successfully",
                                    });
                                    setChallanDialog(false);
                                  })
                                  .catch((err) => {
                                    toast({
                                      title: "Failed to update template",
                                      description: err.message,
                                      variant: "destructive",
                                    });
                                  });
                              } else {
                                addChallanTemplate(payload)
                                  .then(() => {
                                    toast({
                                      title: "Template added successfully",
                                    });
                                    setChallanDialog(false);
                                  })
                                  .catch((err) => {
                                    toast({
                                      title: "Failed to add template",
                                      description: err.message,
                                      variant: "destructive",
                                    });
                                  });
                              }
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
                              {!template.isDefault && (
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
                              )}
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
                    Teacher & Employee ID Card Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog open={teacherIdCardDialog} onOpenChange={setTeacherIdCardDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingTeacherIdCard(null);
                            setTeacherIdCardForm({
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
                            {editingTeacherIdCard ? "Edit" : "Add"} Teacher ID Card Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={teacherIdCardForm.name}
                              onChange={(e) =>
                                setTeacherIdCardForm({
                                  ...teacherIdCardForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label>HTML Content</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setTeacherIdCardForm({
                                    ...teacherIdCardForm,
                                    htmlContent: teacherIdCardDesignTemplate,
                                  })
                                }
                              >
                                Load Standard Design
                              </Button>
                            </div>
                            <Textarea
                              rows={10}
                              value={teacherIdCardForm.htmlContent}
                              onChange={(e) =>
                                setTeacherIdCardForm({
                                  ...teacherIdCardForm,
                                  htmlContent: e.target.value,
                                })
                              }
                              placeholder="Enter HTML template with placeholders like {{name}}, {{designation}}, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={teacherIdCardForm.isDefault}
                              onChange={(e) =>
                                setTeacherIdCardForm({
                                  ...teacherIdCardForm,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <Label>Set as Default Template</Label>
                          </div>
                          <Button
                            onClick={async () => {
                              const payload = {
                                name: teacherIdCardForm.name,
                                htmlContent: teacherIdCardForm.htmlContent,
                                isDefault: teacherIdCardForm.isDefault,
                              };

                              if (editingTeacherIdCard) {
                                try {
                                  const updated = await updateStaffIDCardTemplate(editingTeacherIdCard, payload);
                                  setTeacherIdCardTemplates(prev => prev.map(t => t.id === editingTeacherIdCard ? updated : t));
                                  toast({
                                    title: "Template updated successfully",
                                  });
                                  setTeacherIdCardDialog(false);
                                } catch (err) {
                                  toast({
                                    title: "Error updating template",
                                    description: err.message,
                                    variant: "destructive"
                                  });
                                }
                              } else {
                                try {
                                  const newTemplate = await createStaffIDCardTemplate(payload);
                                  setTeacherIdCardTemplates(prev => [...prev, newTemplate]);
                                  toast({
                                    title: "Template added successfully",
                                  });
                                  setTeacherIdCardDialog(false);
                                } catch (err) {
                                  toast({
                                    title: "Error creating template",
                                    description: err.message,
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                            className="w-full"
                          >
                            {editingTeacherIdCard ? "Update" : "Add"}
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
                      {teacherIdCardTemplates && teacherIdCardTemplates.map((template) => (
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
                                  setEditingTeacherIdCard(template.id);
                                  setTeacherIdCardForm(template);
                                  setTeacherIdCardDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewTeacherIdCard(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!template.isDefault && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await deleteStaffIDCardTemplate(template.id);
                                      setTeacherIdCardTemplates(prev => prev.filter(t => t.id !== template.id));
                                      toast({
                                        title: "Template deleted",
                                      });
                                    } catch (err) {
                                      toast({
                                        title: "Error deleting template",
                                        description: err.message,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
                    Student ID Card Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog open={studentIdCardDialog} onOpenChange={setStudentIdCardDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingStudentIdCard(null);
                            setStudentIdCardForm({
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
                            {editingStudentIdCard ? "Edit" : "Add"} Student ID Card Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Template Name</Label>
                            <Input
                              value={studentIdCardForm.name}
                              onChange={(e) =>
                                setStudentIdCardForm({
                                  ...studentIdCardForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label>HTML Content</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setStudentIdCardForm({
                                    ...studentIdCardForm,
                                    htmlContent: studentIdCardDesignTemplate,
                                  })
                                }
                              >
                                Load Standard Design
                              </Button>
                            </div>
                            <Textarea
                              rows={10}
                              value={studentIdCardForm.htmlContent}
                              onChange={(e) =>
                                setStudentIdCardForm({
                                  ...studentIdCardForm,
                                  htmlContent: e.target.value,
                                })
                              }
                              placeholder="Enter HTML template with placeholders like {{name}}, {{studentId}}, {{class}}, etc."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={studentIdCardForm.isDefault}
                              onChange={(e) =>
                                setStudentIdCardForm({
                                  ...studentIdCardForm,
                                  isDefault: e.target.checked,
                                })
                              }
                            />
                            <Label>Set as Default Template</Label>
                          </div>
                          <Button
                            onClick={async () => {
                              const payload = {
                                name: studentIdCardForm.name,
                                htmlContent: studentIdCardForm.htmlContent,
                                isDefault: studentIdCardForm.isDefault,
                              };

                              if (editingStudentIdCard) {
                                try {
                                  const updated = await updateStudentIDCardTemplate(editingStudentIdCard, payload);
                                  setStudentIdCardTemplates(prev => prev.map(t => t.id === editingStudentIdCard ? updated : t));
                                  toast({
                                    title: "Template updated successfully",
                                  });
                                  setStudentIdCardDialog(false);
                                } catch (err) {
                                  toast({
                                    title: "Error updating template",
                                    description: err.message,
                                    variant: "destructive"
                                  });
                                }
                              } else {
                                try {
                                  const newTemplate = await createStudentIDCardTemplate(payload);
                                  setStudentIdCardTemplates(prev => [...prev, newTemplate]);
                                  toast({
                                    title: "Template added successfully",
                                  });
                                  setStudentIdCardDialog(false);
                                } catch (err) {
                                  toast({
                                    title: "Error creating template",
                                    description: err.message,
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                            className="w-full"
                          >
                            {editingStudentIdCard ? "Update" : "Add"}
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
                      {studentIdCardTemplates && studentIdCardTemplates.map((template) => (
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
                                  setEditingStudentIdCard(template.id);
                                  setStudentIdCardForm(template);
                                  setStudentIdCardDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewStudentIdCard(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!template.isDefault && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await deleteStudentIDCardTemplate(template.id);
                                      setStudentIdCardTemplates(prev => prev.filter(t => t.id !== template.id));
                                      toast({
                                        title: "Template deleted",
                                      });
                                    } catch (err) {
                                      toast({
                                        title: "Error deleting template",
                                        description: err.message,
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
                            <div className="flex items-center justify-between">
                              <Label>HTML Content</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() =>
                                  setMarksheetForm({
                                    ...marksheetForm,
                                    htmlContent: reportCardDesignTemplate,
                                  })
                                }
                              >
                                Load Standard Design
                              </Button>
                            </div>
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
                                    name: marksheetForm.name,
                                    htmlContent: marksheetForm.htmlContent,
                                    isDefault: marksheetForm.isDefault,
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
                                    name: marksheetForm.name,
                                    htmlContent: marksheetForm.htmlContent,
                                    isDefault: marksheetForm.isDefault,
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
                              {!template.isDefault && (
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
                              )}
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
                    Payroll & Salary Slip Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog
                      open={payrollDialog}
                      onOpenChange={setPayrollDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingPayroll(null);
                            setPayrollForm({
                              name: "",
                              type: "SALARY_SLIP",
                              htmlContent: "",
                              isDefault: false,
                            });
                          }}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>
                            {editingPayroll ? "Edit" : "Add"} Payroll Template
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 p-3 flex-1 overflow-y-auto">
                          <div className="grid grid-row-4 gap-4">
                            <Label htmlFor="pay_name" className="text-left">
                              Template Name
                            </Label>
                            <Input
                              id="pay_name"
                              value={payrollForm.name}
                              onChange={(e) =>
                                setPayrollForm({ ...payrollForm, name: e.target.value })
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-row-4 gap-4">
                            <Label htmlFor="pay_type" className="text-left">
                              Type
                            </Label>
                            <Select
                              value={payrollForm.type}
                              onValueChange={(value) =>
                                setPayrollForm({ ...payrollForm, type: value })
                              }
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SALARY_SLIP">Salary Slip</SelectItem>
                                <SelectItem value="PAYROLL_SHEET">Payroll Sheet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-row-4 gap-4">
                            <div className="col-span-4 flex items-center justify-between pt-2 space-y-2">
                              <Label htmlFor="content">
                                HTML Content
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => {
                                  if (payrollForm.type === 'SALARY_SLIP') {
                                    setPayrollForm(prev => ({ ...prev, htmlContent: salarySlipTemplate }));
                                  } else if (payrollForm.type === 'PAYROLL_SHEET') {
                                    setPayrollForm(prev => ({ ...prev, htmlContent: payrollSheetTemplate }));
                                  } else {
                                    toast({ title: "Please select a type first", variant: "destructive" });
                                  }
                                }}
                              >
                                Load Default Design
                              </Button>
                            </div>
                            <div className="col-span-4">
                              <Textarea
                                id="content"
                                value={payrollForm.htmlContent}
                                onChange={(e) => setPayrollForm({ ...payrollForm, htmlContent: e.target.value })}
                                className="h-[300px] mb-12 font-mono text-xs"
                                placeholder="Enter HTML content..."
                              />
                            </div>
                          </div>
                          <div className="flex items-center  gap-4">
                            <Checkbox
                              id="pay_default"
                              checked={payrollForm.isDefault}
                              onCheckedChange={(checked) =>
                                setPayrollForm({ ...payrollForm, isDefault: checked })
                              }
                            />
                            <Label htmlFor="pay_default" className="text-left">
                              Set as Default
                            </Label>
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              if (editingPayroll) {
                                const updatedTemplate = await updatePayrollTemplate(editingPayroll, {
                                  ...payrollForm,
                                });
                                setPayrollTemplates(
                                  payrollTemplates.map((t) =>
                                    t.id === editingPayroll ? updatedTemplate : t
                                  )
                                );
                                toast({
                                  title: "Template updated successfully",
                                });
                              } else {
                                const newTemplate = await createPayrollTemplate({
                                  ...payrollForm,
                                });
                                setPayrollTemplates([...payrollTemplates, newTemplate]);
                                toast({
                                  title: "Template added successfully",
                                });
                              }
                              setPayrollDialog(false);
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
                          {editingPayroll ? "Update" : "Add"}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>{template.type.replace('_', ' ')}</TableCell>
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
                                  setEditingPayroll(template.id);
                                  setPayrollForm(template);
                                  setPayrollDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewPayroll(template.htmlContent)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!template.isDefault && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await deletePayrollTemplate(template.id);
                                      setPayrollTemplates(payrollTemplates.filter(t => t.id !== template.id));
                                      toast({
                                        title: "Template deleted",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to delete template",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
        </Tabs >

        {/* Preview Dialogs */}
        < Dialog
          open={!!previewChallan}
          onOpenChange={() => setPreviewChallan(null)}
        >
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Challan Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewChallan || "",
              }}
            />
          </DialogContent>
        </Dialog >

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
          open={!!previewTeacherIdCard}
          onOpenChange={() => setPreviewTeacherIdCard(null)}
        >
          <DialogContent className="max-w-fit max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Teacher ID Card Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewTeacherIdCard || "",
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!previewStudentIdCard}
          onOpenChange={() => setPreviewStudentIdCard(null)}
        >
          <DialogContent className="max-w-fit max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Student ID Card Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewStudentIdCard || "",
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

        <Dialog
          open={!!previewPayroll}
          onOpenChange={() => setPreviewPayroll(null)}
        >
          <DialogContent className="max-w-7xl max-h-[95dvh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Payroll Template Preview</DialogTitle>
            </DialogHeader>
            <div
              dangerouslySetInnerHTML={{
                __html: previewPayroll || "",
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
      </div >
    </DashboardLayout >
  );
};
export default Configuration;

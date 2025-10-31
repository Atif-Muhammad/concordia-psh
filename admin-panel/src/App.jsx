import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import FeeManagement from "./pages/FeeManagement";
import Attendance from "./pages/Attendance";
import FrontOffice from "./pages/FrontOffice";
import Examination from "./pages/Examination";
import Academics from "./pages/Academics";
import HRPayroll from "./pages/HRPayroll";
import Hostel from "./pages/Hostel";
import Finance from "./pages/Finance";
import Configuration from "./pages/Configuration";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/front-office" element={<FrontOffice />} />
          <Route path="/students" element={<Students />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/fee-management" element={<FeeManagement />} />
          <Route path="/examination" element={<Examination />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/hr-payroll" element={<HRPayroll />} />
          <Route path="/hostel" element={<Hostel />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/configuration" element={<Configuration />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const {
    admins
  } = useData();
  const {
    toast
  } = useToast();
  const handleLogin = e => {
    e.preventDefault();
    const admin = admins.find(a => a.email === email && a.password === password);
    if (admin) {
      localStorage.setItem("adminId", admin.id);
      navigate("/dashboard");
    } else {
      toast({
        title: "Invalid credentials",
        description: "Email or password is incorrect",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-strong p-8 space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Concordia College</h1>
            <p className="text-muted-foreground">Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@concordia.edu" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <PasswordInput id="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo: ali@concordia.edu.pk / admin123</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-white/80">
          <p>© 2025 Concordia College. All rights reserved.</p>
        </div>
      </div>
    </div>;
};
export default Login;
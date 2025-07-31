import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      toast({
        title: "Invalid Access",
        description: "Please go through the forgot password process first.",
        variant: "destructive",
      });
      navigate('/forgot-password');
    }
  }, [location, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    if (!email || !pin) {
      toast({
        title: "Error",
        description: "Please enter your email and PIN.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('https://student-portal-lms-seven.vercel.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, new_password: password }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Password Reset Successful!",
          description: data.message || "Your password has been updated. Please sign in with your new password.",
        });
        navigate("/login");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                SUTI
              </h1>
              <p className="text-sm text-muted-foreground">
                Sabriy Ultrasound Training Institute
              </p>
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Create a new password for your account</p>
        </div>

        <Card className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="mt-1 bg-muted/50"
              />
            </div>

            <div>
              <Label htmlFor="pin">Reset PIN</Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter the 6-digit PIN"
                maxLength={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>

            <Button type="submit" className="w-full btn-neon">
              Update Password
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

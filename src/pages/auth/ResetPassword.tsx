import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="relative min-h-screen w-full bg-gray-900 flex items-center justify-center overflow-hidden p-4">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">SUTI</h1>
          </Link>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Reset Password</h2>
          <p className="text-gray-400 mt-1">Create a new password for your account</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="mt-2 bg-gray-800/80 border-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="pin" className="text-gray-300 font-medium">Reset PIN</Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter the 6-digit PIN from your email"
                maxLength={6}
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 font-medium">New Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
            </div>

            <Button type="submit" className="w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full py-3 text-base font-semibold">
              Update Password
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

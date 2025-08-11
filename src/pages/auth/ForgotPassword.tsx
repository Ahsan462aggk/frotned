import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GraduationCap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('https://student-portal-lms-seven.vercel.app/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "PIN Sent Successfully!",
          description: data.message || "Check your email for the reset PIN.",
        });
        navigate('/reset-password', { state: { email } });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset link.",
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
          <h2 className="text-2xl md:text-3xl font-bold text-white">Forgot Password</h2>
          <p className="text-gray-400 mt-1">
            {isSubmitted 
              ? "A reset PIN has been sent to your email"
              : "Enter your email to receive a reset PIN"
            }
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <Button type="submit" className="w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full py-3 text-base font-semibold">
                Send Reset PIN
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 text-white">
              <p className="text-gray-300">
                We've sent a password reset PIN to <strong className="font-bold text-purple-300">{email}</strong>
              </p>
              <p className="text-sm text-gray-400">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={() => setIsSubmitted(false)} 
                  variant="outline"
                  className="w-full bg-transparent text-white border-purple-400 hover:bg-purple-400/20 hover:text-white rounded-full"
                >
                  Try Different Email
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

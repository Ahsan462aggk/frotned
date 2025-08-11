import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let response, data;
    try {
      const body = new URLSearchParams();
      body.append('username', email);
      body.append('password', password);

      const url = 'https://student-portal-lms-seven.vercel.app/api/auth/token';

      response = await fetch(url, {
        method: 'POST',
        body: body,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.detail || errorData.message || 'Invalid credentials');
      }
      
      data = await response.json();


      // Clear previous tokens before saving new session
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('user');

      // Store user session data based on role
      const { access_token, role } = data;

      if (role === 'admin') {
        localStorage.setItem('admin_access_token', access_token);
      } else {
        // For students, fetch profile to get full name
        const profileResponse = await fetch('https://student-portal-lms-seven.vercel.app/api/profile/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (!profileResponse.ok) {
          console.error('Failed to fetch profile after login.');
          const userSession = {
            email: email,
            role: 'student',
            full_name: email.split('@')[0], // Fallback name
            access_token: access_token,
          };
          localStorage.setItem('user', JSON.stringify(userSession));
        } else {
          const profileData = await profileResponse.json();
          const userSession = {
            email: email,
            role: 'student',
            full_name: profileData.full_name || email.split('@')[0],
            access_token: access_token,
          };
          localStorage.setItem('user', JSON.stringify(userSession));
        }
      }

      toast({
        title: "Login Successful!",
        description: data.message || `Welcome back to SUTI!`,
      });
      
      const redirectUrl = localStorage.getItem('redirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        const enrollCourseId = localStorage.getItem('enrollCourseId');
        if (enrollCourseId) {
          localStorage.removeItem('enrollCourseId');
          navigate(`/student/payment?course_id=${enrollCourseId}`);
        } else {
          // Role-based redirection
          if (data.role === 'admin') {
            navigate("/admin/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('invalid credentials') || error.message.toLowerCase().includes('not found')) {
          toast({
            title: "User Not Found",
            description: "No account found with that email. Please sign up.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
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
          <h2 className="text-2xl md:text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-400 mt-1">Sign in to continue your learning journey</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                    autoComplete="current-password"
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
            </div>

            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" className="w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full py-3 text-base font-semibold" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center text-gray-400">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

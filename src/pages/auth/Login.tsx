import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
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
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue your learning journey</p>
        </div>

        <Card className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">


            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
            </div>

            <Button type="submit" className="w-full btn-neon" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

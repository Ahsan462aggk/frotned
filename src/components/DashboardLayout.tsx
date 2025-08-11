import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  User, 
  LogOut,
  Users,
  Menu,
  X,
  UserCheck,
  CheckCircle,
  Clock,
  Bell,
  ClipboardEdit
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "student" | "admin";
}

const DashboardLayout = ({ children, userType }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
    { icon: BookOpen, label: "Courses", path: "/student/courses" },
    { icon: BookOpen, label: "My Courses", path: "/student/my-courses" },
    { icon: FileText, label: "Assignments", path: "/student/assignments" },
    { icon: HelpCircle, label: "Quizzes", path: "/student/quizzes" },
    { icon: User, label: "Profile", path: "/student/profile" },
  ];

  const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
    { icon: Users, label: "Students", path: "/admin/students" },
    { icon: UserCheck, label: "Enrollments", path: "/admin/enrollments" },
    { icon: ClipboardEdit, label: "Applications", path: "/admin/applications" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Clock, label: "Manage Assignments", path: "/admin/manage-assignments" },
    { icon: CheckCircle, label: "Manage Quizzes", path: "/admin/manage-quizzes" },
    { icon: HelpCircle, label: "Manage Questions", path: "/admin/manage-questions" },
    { icon: FileText, label: "Manage Videos", path: "/admin/manage-videos" },
  ];

  const menuItems = userType === "student" ? studentMenuItems : adminMenuItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/50 backdrop-blur-xl border-r border-purple-500/20 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-purple-500/20">
          <Link to="/" className="flex items-center space-x-3">
            <GraduationCap className="h-10 w-10 text-purple-400" />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                SUTI
              </span>
              <p className="text-xs text-gray-500 leading-tight">LMS Platform</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 styled-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ease-in-out group overflow-hidden ${ 
                  isActive 
                    ? 'text-white shadow-lg shadow-purple-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'}`} />
                <div className={`absolute left-0 top-0 h-full w-1 bg-pink-400 transition-all duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`} />
                <item.icon className={`relative z-10 h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4 pt-2">
          <div className="border-t border-purple-500/20 mb-4" />
          <Button 
            variant="ghost" 
            onClick={() => {
              localStorage.clear();
              toast({ title: "Logged Out", description: "You have been successfully logged out." });
              navigate("/");
            }}
            className="w-full justify-start text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors duration-200 group"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden bg-card/50 backdrop-blur-sm border-b border-border/50 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

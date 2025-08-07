import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { 
  GraduationCap, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  CreditCard, 
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
    { icon: FileText, label: "Manage Videos", path: "/admin/manage-videos" },
  ];

  const menuItems = userType === "student" ? studentMenuItems : adminMenuItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-card/50 backdrop-blur-sm border-r border-border/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                SUTI
              </span>
              <span className="text-xs text-muted-foreground">
                Sabriy Ultrasound Training Institute
              </span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent">
  <div className="flex flex-col gap-1 p-4">
    {menuItems.map((item, idx) => {
      const isActive = location.pathname === item.path;
      // Add extra margin below 'Manage Videos' if admin
      const isManageVideos = item.label === "Manage Videos";
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          } ${isManageVideos ? 'mb-3 md:mb-4' : ''}`}
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-base md:text-sm">{item.label}</span>
        </Link>
      );
    })}
  </div>
</nav>

{/* Divider and Logout always at bottom, clearly separated */}
<div className="px-6 pb-6 pt-2">
  <div className="border-t border-border/30 mb-2" />
  <Button 
    variant="ghost" 
    onClick={() => {
      localStorage.clear(); // Clear user session
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    }}
    className="w-full justify-start text-muted-foreground hover:text-destructive text-base md:text-sm"
    style={{ minHeight: 48 }}
  >
    <LogOut className="mr-3 h-5 w-5" />
    Logout
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

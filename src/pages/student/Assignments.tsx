import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from "@/lib/api";

// Define types for our data
interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  course_title: string; 
  status: 'pending' | 'submitted' | 'graded';
}

const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const coursesRes = await fetchWithAuth('/api/courses/my-courses');
        const enrolledCourses = await handleApiResponse(coursesRes);

        if (!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) {
          setAssignments([]);
          return;
        }

        const assignmentsPromises = enrolledCourses.map(async (course: any) => {
          try {
            const assignmentsRes = await fetchWithAuth(`/api/student/assignments/courses/${course.id}/assignments`);
            const courseAssignments = await handleApiResponse(assignmentsRes) as Assignment[];
            return courseAssignments.map((assignment) => ({
              ...assignment,
              course_id: course.id,
              course_title: course.title,
            }));
          } catch (e) {
            if (e instanceof UnauthorizedError) throw e;
            console.error(`Error processing assignments for course ${course.title}:`, e);
            return [];
          }
        });

        const assignmentsByCourse = await Promise.all(assignmentsPromises);
        setAssignments(assignmentsByCourse.flat());
      } catch (err: any) {
        if (err instanceof UnauthorizedError) {
          toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
          navigate('/auth/login');
        } else {
          setError(err.message || "Could not fetch assignments.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [toast, navigate]);

  const pendingAssignments = assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded');
  const submittedAssignments = assignments.filter(a => a.status === 'submitted' || a.status === 'graded');

  const renderAssignmentCard = (assignment: Assignment) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
      submitted: { label: "Submitted", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
      graded: { label: "Graded", className: "bg-green-500/10 text-green-400 border-green-500/30" },
    };

    return (
      <div key={assignment.id} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-sm ring-1 ring-white/10 rounded-lg overflow-hidden h-full flex flex-col p-6 transition-all duration-300 group-hover:ring-purple-500">
          <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm text-gray-400 font-medium line-clamp-1 pr-4">{assignment.course_title}</p>
              <Badge variant="outline" className={`capitalize text-xs font-semibold px-2 py-1 ${statusConfig[assignment.status]?.className}`}>
                {statusConfig[assignment.status]?.label}
              </Badge>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white group-hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 transition-colors">
              {assignment.title}
            </h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-3 h-16">{assignment.description}</p>
          </div>
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Calendar className="h-4 w-4 mr-2 text-purple-400" />
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full">
              <Link to={`/student/assignments/${assignment.course_id}/${assignment.id}`}>
                {assignment.status === 'pending' ? 'View & Submit' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">An Error Occurred</h2>
            <p className="text-gray-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderEmptyState = (icon: React.ReactNode, title: string, message: string) => (
    <div className="text-center py-20 bg-gray-900/50 backdrop-blur-sm ring-1 ring-white/10 rounded-lg mt-6">
      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white mb-6">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mt-4 text-white">{title}</h3>
      <p className="text-gray-400 mt-2">{message}</p>
    </div>
  );

  return (
    <DashboardLayout userType="student">
      <div className="relative px-4 py-6 md:px-6 text-white min-h-full overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-900 to-transparent opacity-30 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-pink-900 to-transparent opacity-30 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Assignments</span>
          </h1>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
              <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-md">Pending ({pendingAssignments.length})</TabsTrigger>
              <TabsTrigger value="submitted" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-md">Submitted ({submittedAssignments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              {pendingAssignments.length > 0 ? (
                <div className="grid gap-8 mt-6 md:grid-cols-2 lg:grid-cols-3">
                  {pendingAssignments.map(renderAssignmentCard)}
                </div>
              ) : (
                renderEmptyState(<CheckCircle className="h-8 w-8" />, "All Caught Up!", "You have no pending assignments.")
              )}
            </TabsContent>
            <TabsContent value="submitted">
              {submittedAssignments.length > 0 ? (
                <div className="grid gap-8 mt-6 md:grid-cols-2 lg:grid-cols-3">
                  {submittedAssignments.map(renderAssignmentCard)}
                </div>
              ) : (
                renderEmptyState(<FileText className="h-8 w-8" />, "No Submitted Assignments", "Your submitted assignments will appear here.")
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
        
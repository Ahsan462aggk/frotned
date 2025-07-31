import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
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
          setIsLoading(false);
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
            // Also handle UnauthorizedError here if fetching assignments fails
            if (e instanceof UnauthorizedError) {
                throw e; // Re-throw to be caught by the outer catch block
            }
            console.error(`Error processing assignments for course ${course.title}:`, e);
            return []; // Return empty array on error to not break Promise.all
          }
        });

        const assignmentsByCourse = await Promise.all(assignmentsPromises);
        const allAssignments = assignmentsByCourse.flat();

        setAssignments(allAssignments);
      } catch (err: any) {
        if (err instanceof UnauthorizedError) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          navigate('/auth/login');
        } else {
          setError(err.message);
          toast({
            title: "Error",
            description: err.message || "Could not fetch assignments.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [toast, navigate]);

  const pendingAssignments = assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded');
  const submittedAssignments = assignments.filter(a => a.status === 'submitted' || a.status === 'graded');

  const renderAssignmentCard = (assignment: Assignment) => (
    <Card key={assignment.id} className="p-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">{assignment.course_title}</p>
            <Badge variant={assignment.status === 'graded' ? 'default' : 'secondary'}>{assignment.status?.toUpperCase()}</Badge>
        </div>
        <h3 className="text-lg font-semibold mb-2">{assignment.title}</h3>
        <p className="text-sm mb-4 line-clamp-3">{assignment.description}</p>
      </div>
      <div>
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Due: {new Date(assignment.due_date)?.toLocaleDateString()}</span>
        </div>
        <Link to={`/student/assignments/${assignment.course_id}/${assignment.id}`}>
          <Button className="w-full">
            {assignment.status === 'pending' ? 'View & Submit' : 'View Details'}
          </Button>
        </Link>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">An Error Occurred</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="px-4 py-6 md:px-6">
        <h1 className="text-3xl font-bold mb-6">My Assignments</h1>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({submittedAssignments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {pendingAssignments.length > 0 ? (
              <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingAssignments.map(renderAssignmentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="text-xl font-semibold mt-4">All Caught Up!</h3>
                <p className="text-muted-foreground mt-2">You have no pending assignments.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="submitted">
            {submittedAssignments.length > 0 ? (
              <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                {submittedAssignments.map(renderAssignmentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold mt-4">No Submitted Assignments</h3>
                <p className="text-muted-foreground mt-2">Your submitted assignments will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
        
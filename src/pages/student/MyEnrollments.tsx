import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';

// Interfaces
interface Enrollment {
  id: number;
  course_id: number;
  course_title: string;
  status: 'pending' | 'enrolled' | 'rejected' | 'not_enrolled' | 'approved';
}

interface Course {
  id: number;
  title: string;
}

interface StatusResponse {
  status: 'pending' | 'enrolled' | 'rejected' | 'not_enrolled' | 'approved';
}

const MyEnrollments = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      setError(null);
      try {
        const coursesRes = await fetchWithAuth(`/api/courses/my-courses`);
        const coursesData = await handleApiResponse<Course[]>(coursesRes);

        if (Array.isArray(coursesData) && coursesData.length > 0) {
          const enrollmentsWithStatus = await Promise.all(
            coursesData.map(async (course: Course): Promise<Enrollment> => {
              try {
                const statusRes = await fetchWithAuth(`/api/enrollments/${course.id}/status`);
                let status: Enrollment['status'] = 'not_enrolled';
                if (statusRes.ok) {
                  const statusData = await handleApiResponse<StatusResponse>(statusRes);
                  status = statusData.status;
                }
                return {
                  id: course.id,
                  course_title: course.title,
                  status: status,
                  course_id: course.id
                };
              } catch (e) {
                if (e instanceof UnauthorizedError) throw e;
                console.error(`Failed to fetch status for course ${course.id}:`, e);
                return {
                  id: course.id,
                  course_title: course.title,
                  status: 'not_enrolled',
                  course_id: course.id
                };
              }
            })
          );
          setEnrollments(enrollmentsWithStatus);
        } else {
          setEnrollments([]);
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast.error('Session expired. Please log in again.');
          navigate('/auth/login');
        } else if (err instanceof Error) {
          setError(err.message);
          toast.error(err.message);
        } else {
          const errorMessage = 'An unexpected error occurred.';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [navigate]);

  const getStatusColor = (status: Enrollment['status']) => {
    switch (status) {
      case 'enrolled':
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return '';
    }
  };

  if (loading) {
    return <DashboardLayout userType="student"><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout userType="student"><div className="text-center text-red-500">{error}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout userType="student">
      <Card>
        <CardHeader>
          <CardTitle>My Enrollments</CardTitle>
          <CardDescription>Here is the status of all your course enrollments.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <ul className="space-y-4">
              {enrollments.map(enrollment => (
                <li key={enrollment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-3 text-primary" />
                    <span className="font-medium">{enrollment.course_title}</span>
                  </div>
                  <div className="flex items-center">
                    {enrollment.status !== 'not_enrolled' && (
                      <span className={`text-sm font-semibold capitalize mr-4 ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status.replace('_', ' ')}
                      </span>
                    )}
                    {(enrollment.status === 'rejected' || enrollment.status === 'not_enrolled') && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/student/payment/${enrollment.course_id}`}>Pay Now</Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You have no active enrollments.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MyEnrollments;

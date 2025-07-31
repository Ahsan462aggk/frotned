import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, Edit, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  youtube_url: string;
  title: string;
  description: string;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
  difficulty_level: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  status: string;
  videos: Video[];
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return match ? match[1] : '';
}

const AdminCourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_access_token');
        const response = await fetchWithAuth(
          `https://student-portal-lms-seven.vercel.app/api/admin/courses/${courseId}`,
          { 
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await handleApiResponse(response);
        setCourse(data);
      } catch (error) {
        toast.error('Failed to fetch course details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout userType="admin">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout userType="admin">
        <div className="text-center">
          <p className="text-xl">Course not found.</p>
          <Link to="/admin/courses">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="admin">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/admin/courses">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-center flex-1">{course.title}</h1>
        <Button disabled>
          <Edit className="mr-2 h-4 w-4" />
          Edit Course
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Price:</strong> ${course.price}</div>
                <div><strong>Difficulty:</strong> <Badge variant="secondary">{course.difficulty_level}</Badge></div>
                <div><strong>Status:</strong> <Badge variant={course.status === 'active' ? 'default' : 'destructive'}>{course.status}</Badge></div>
                <div><strong>Created By:</strong> {course.created_by}</div>
                <div><strong>Last Updated:</strong> {new Date(course.updated_at).toLocaleDateString()}</div>
                <div><strong>Created At:</strong> {new Date(course.created_at).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="mr-2" />
                Course Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell>{video.description}</TableCell>
                      <TableCell>
                        <div className="aspect-w-16 aspect-h-9 w-40 max-w-xs">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(video.youtube_url)}?modestbranding=1&rel=0&showinfo=0`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="rounded"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Thumbnail</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={course.thumbnail_url || 'https://placehold.co/600x400'} alt={course.title} className="rounded-lg w-full object-cover" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCourseDetail;

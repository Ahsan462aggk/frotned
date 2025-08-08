import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Progress component removed; no longer needed
import { Play, BookOpen, User, Clock } from 'lucide-react';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from '@/components/ui/skeleton';

interface EnrolledCourse {
  id: string;
  title: string;
  instructor?: string;
  progress?: number;
  totalLessons?: number;
  completedLessons?: number;
  description?: string;
  thumbnail_url?: string;
  expiration_date?: string;
}

const MyCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithAuth('/api/courses/my-courses');
        const data = await handleApiResponse<EnrolledCourse[]>(response);
        setEnrolledCourses(data);
      } catch (err) {
        console.error('Failed to fetch enrolled courses:', err);
        // Optionally set an error state here to show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  const CourseCardSkeleton = () => (
    <Card className="overflow-hidden h-full flex flex-col border border-gray-200 rounded-xl bg-background">
      <Skeleton className="w-full h-48" />
      <CardContent className="p-5 flex flex-col flex-grow">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="mt-auto">
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  const generatePlaceholder = (title: string) => {
    const bgColor = '#3b82f6'; // blue-600
    const textColor = '#FFFFFF';
    const svg = `
      <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"></rect>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" fill="${textColor}" font-weight="bold">
          ${title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto px-4 py-8 bg-background">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 mb-2 drop-shadow-xl animate-pulse">My Learning Journey</h1>
          <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-200 mb-4">Continue your courses and track your progress</p>
        {/* Hero CTA Section */}
        {enrolledCourses.length > 0 && (
  <div className="mt-8 mb-8 p-8 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between hover:scale-105 transform transition duration-300 ease-in-out text-center">
    <div className="mb-4 md:mb-0">
      <h2 className="text-5xl md:text-6xl font-extrabold text-center text-white drop-shadow-2xl mb-2">Start Your Journey With a Beautiful Vision</h2>
      <p className="text-sm md:text-base mt-2">Embrace the future of learning and unlock your potential.</p>
    </div>
    <Link
      to={`/student/courses/${
        enrolledCourses.find((c) => (c.progress ?? 0) < 100)?.id || enrolledCourses[0].id
      }`}
      className="inline-flex items-center px-6 py-3 bg-white text-pink-600 font-semibold rounded-lg hover:bg-gray-100 transition-shadow"
    >
      <Play className="mr-2 h-5 w-5" />
      Continue Course
    </Link>
  </div>
)}
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : enrolledCourses.length > 0 ? (
          <>
              {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enrolled Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
                  </div>
                </div>
              </Card>
              
              
            </div>
            
            {/* Courses Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <Link to={`/student/courses/${course.id}`} key={course.id} className="block hover:no-underline">
                  <Card className="overflow-hidden transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl h-full flex flex-col border border-gray-200 rounded-xl bg-background">
                    {/* Course Image */}
                    <div className="relative">
                      <img 
                        src={course.thumbnail_url || generatePlaceholder(course.title)} 
                        alt={course.title} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-gray-800 backdrop-blur-sm px-3 py-1">
                          <BookOpen className="h-4 w-4 mr-1" />
                          Course
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Course Content */}
                    <CardContent className="p-5 flex flex-col flex-grow">
                      {/* Video Checkpoint Section */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                          <Play className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-lg font-semibold text-blue-800">Video Checkpoint</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Access your course videos and track your learning progress through interactive video checkpoints.
                        </p>
                      </div>
                      
                      {/* Progress Section Removed */}
                      
                      {/* Expiration Date */}
                      {course.expiration_date && (
                        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex items-center text-amber-700">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Expires on:</span>
                          </div>
                          <p className="text-amber-600 text-sm mt-1">
                            {new Date(course.expiration_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      
                      {/* CTA Button */}
                      <button className="mt-auto w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                        <Play className="mr-2 h-5 w-5" />
                        {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                      </button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 max-w-md mx-auto rounded-lg p-6 bg-background border border-gray-200">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Enrolled Courses</h3>
            <p className="text-gray-600 mb-6">You haven't enrolled in any courses yet. Start your learning journey today!</p>
            <Link 
              to="/student/courses" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrolledCourses();
  }, []);

  const CourseCardSkeleton = () => (
    <div className="bg-gray-900/50 backdrop-blur-sm ring-1 ring-white/10 rounded-lg p-6 h-full flex flex-col">
      <Skeleton className="w-full h-40 rounded-md bg-gray-700/50" />
      <Skeleton className="h-6 w-3/4 mt-4 rounded-md bg-gray-700/50" />
      <Skeleton className="h-4 w-1/2 mt-2 rounded-md bg-gray-700/50" />
      <div className="mt-auto pt-4">
        <Skeleton className="h-2 w-full mb-2 rounded-md bg-gray-700/50" />
        <Skeleton className="h-10 w-full rounded-md bg-gray-700/50" />
      </div>
    </div>
  );

  const generatePlaceholder = (title: string) => {
    const gradient = 'linear-gradient(135deg, #6B21A8, #D946EF)';
    const svg = `
      <svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#D946EF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#6B21A8;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"></rect>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="#FFFFFF" font-weight="bold" letter-spacing="0.1em">
          ${title.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase()}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <DashboardLayout userType="student">
      <div className="relative px-4 py-6 md:px-6 text-white min-h-full overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
              My Learning Journey
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Your gateway to continued growth. Dive back into your courses and conquer new skills.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => <CourseCardSkeleton key={index} />)}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledCourses.map(course => (
                <Link to={`/student/courses/${course.id}`} key={course.id} className="group block">
                  <div className="relative bg-gray-900/70 backdrop-blur-sm ring-1 ring-white/10 rounded-lg overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:ring-purple-500 group-hover:scale-105 transform">
                    <div className="relative">
                      <img 
                        src={course.thumbnail_url || generatePlaceholder(course.title)} 
                        alt={`${course.title} thumbnail`} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-white mb-2 leading-tight">{course.title}</h3>
                      {course.instructor && <p className="text-sm text-purple-400 font-medium mb-4">By {course.instructor}</p>}
                      <div className="mt-auto">
                        <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-2">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${course.progress || 0}%` }}></div>
                        </div>
                        <p className="text-right text-xs text-gray-400 mb-4">{Math.round(course.progress || 0)}% Complete</p>
                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-transform duration-300 transform group-hover:scale-105 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                          <Play className="mr-2 h-5 w-5" />
                          {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 max-w-md mx-auto bg-gray-900/70 backdrop-blur-sm ring-1 ring-white/10 rounded-lg p-8">
              <div className="bg-purple-500/10 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Journey Awaits</h3>
              <p className="text-gray-400 mb-6">You haven't enrolled in any courses yet. Explore our catalog and start learning today!</p>
              <Link 
                to="/student/courses" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/30 transform hover:scale-105"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyCourses;

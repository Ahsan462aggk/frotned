import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom'; // Removed unused import

import CourseCard from '@/components/CourseCard';
// import { Badge } from '@/components/ui/badge'; // Removed unused Badge component
// Loader2 removed; not needed
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from "@/components/DashboardLayout";

interface ExploreCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
}

const Courses = () => {
  const CourseCardSkeleton = () => (
    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl flex flex-col space-y-4 animate-pulse">
      <Skeleton className="w-full h-40 rounded-lg bg-white/20" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 rounded bg-white/20" />
        <Skeleton className="h-4 w-1/2 rounded bg-white/20" />
      </div>
    </div>
  );
  const [exploreCourses, setExploreCourses] = useState<ExploreCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExploreCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithAuth('/api/courses/explore-courses');
        const data = await handleApiResponse<ExploreCourse[]>(response);
        setExploreCourses(data);
      } catch (err) {
        console.error('Failed to fetch explore courses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreCourses();
  }, []);

  return (
    <DashboardLayout userType="student">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">Explore Courses</h1>
          
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : exploreCourses.length > 0 ? (
            <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {exploreCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center h-64 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h3 className="text-2xl font-bold text-white">No Courses Yet</h3>
              <p className='text-gray-400 mt-2'>You are not enrolled in any courses. Explore and start learning!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
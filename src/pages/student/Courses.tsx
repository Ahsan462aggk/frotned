import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom'; // Removed unused import
import { Card } from '@/components/ui/card';
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
    <Card className="overflow-hidden h-full flex flex-col border border-gray-200 rounded-xl bg-background">
      <Skeleton className="w-full h-32" />
      <div className="p-4 flex flex-col flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
      </div>
    </Card>
  );
  const [exploreCourses, setExploreCourses] = useState<ExploreCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExploreCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithAuth('/api/courses/explore-courses');
        const data = await handleApiResponse<ExploreCourse[]>(response);
        setExploreCourses(data);
      } catch (err) {
        console.error('Failed to fetch explore courses:', err);
        setError('Failed to load explore courses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreCourses();
  }, []);

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto px-4 py-8 bg-background min-h-screen flex flex-col">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 mb-6">Explore Courses</h1>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        ) : exploreCourses.length > 0 ? (
          <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
            {exploreCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-200">No Courses to Explore</h3>
            <p className="text-gray-400 mt-2">We're adding new courses all the time. Check back soon!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Courses;
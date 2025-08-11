import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Loader2, Search } from "lucide-react";
import { fetchWithAuth } from '@/lib/api';

// Type to match the API response from /api/courses/explore-courses
interface Course {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string | null;
  category?: string; // Optional field
}

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const handleViewDetailsClick = (courseId: string) => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate(`/student/courses/${courseId}`);
    } else {
      // Store the intended destination before redirecting to login
      localStorage.setItem('redirectUrl', `/student/courses/${courseId}`);
      navigate('/login');
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
                const response = await fetchWithAuth('/api/courses/explore-courses');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch courses' }));
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const coursesToShow = showAll ? filteredCourses : filteredCourses.slice(0, 3);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400 bg-red-900/30 p-6 rounded-lg">
          <h3 className="font-semibold text-lg">Could Not Load Courses</h3>
          <p className="text-red-400/80">{error}</p>
        </div>
      );
    }

    if (courses.length > 0 && filteredCourses.length === 0) {
      return <p className="text-center text-gray-400 py-10">No courses match your search.</p>;
    }

    if (courses.length === 0) {
      return <p className="text-center text-gray-400">No featured courses available right now.</p>;
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {coursesToShow.map((course) => (
          <div key={course.id} className="relative group cursor-pointer" onClick={() => handleViewDetailsClick(course.id)}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm ring-1 ring-white/10 rounded-lg overflow-hidden h-full flex flex-col">
              <div className="relative">
                <img 
                  src={course.thumbnail_url || `https://placehold.co/600x400/0f172a/ffffff?text=SUTI`}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="border-2 border-white rounded-full p-3">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
                {course.category && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {course.category}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 transition-colors min-h-[3.5rem]">
                  {course.title}
                </h3>
                <div className="mt-auto pt-4 flex items-center justify-between gap-4 border-t border-gray-700/50">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {course.price > 0 ? `PKR ${course.price}` : 'Free'}
                  </span>
                  <Button onClick={(e) => { e.stopPropagation(); handleViewDetailsClick(course.id); }} size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full px-5 py-3">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section id="courses" className="relative py-20 md:py-32 px-6 bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Courses</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Discover a wide range of courses designed to elevate your skills, from foundational concepts to advanced techniques in ultrasound diagnostics.
          </p>
        </div>

        <div className="mb-12 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search for a course..."
              className="pl-12 w-full bg-gray-800/50 border-2 border-gray-700 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 py-3 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {renderContent()}
        
        {!showAll && filteredCourses.length > 3 && (
          <div className="text-center mt-16">
            <Button 
              onClick={() => setShowAll(true)} 
              variant="outline" 
              className="text-lg font-semibold border-2 border-purple-500/50 text-white bg-transparent hover:bg-purple-500/10 hover:border-purple-500 rounded-full px-10 py-6 transition-all duration-300 transform hover:scale-105"
            >
              View All Courses
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;

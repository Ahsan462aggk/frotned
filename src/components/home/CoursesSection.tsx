import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Loader2, Search } from "lucide-react";

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

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/courses/explore-courses');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch courses' }));
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch homepage courses:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnrollClick = (courseId: string) => {
    const user = localStorage.getItem('user');
    if (user) {
      // User is logged in, redirect to payment page with course id
      navigate(`/student/payment?course_id=${courseId}`);
    } else {
      // User is not logged in, save course ID and redirect to login
      localStorage.setItem('enrollCourseId', courseId);
      navigate('/login');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const coursesToShow = showAll ? filteredCourses : filteredCourses.slice(0, 3);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">
          <h3 className="font-semibold">Could Not Load Courses</h3>
          <p>{error}</p>
        </div>
      );
    }
    
    if (courses.length > 0 && filteredCourses.length === 0) {
      return <p className="text-center text-muted-foreground py-10">No courses match your search.</p>;
    }

    if (courses.length === 0) {
      return <p className="text-center text-muted-foreground">No featured courses available right now.</p>;
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {coursesToShow.map((course) => (
          <Card key={course.id} className="course-card overflow-hidden group">
            <Link to={`/student/courses/${course.id}`} className="block">
              <div className="relative">
                <img 
                  src={course.thumbnail_url || `https://placehold.co/600x400/1e293b/ffffff?text=SUTI`}
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button className="btn-neon" asChild>
                      <Link to={`/student/courses/${course.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        View Course
                      </Link>
                    </Button>
                </div>
                {course.category && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {course.category}
                    </span>
                  </div>
                )}
              </div>
            </Link>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                <Link to={`/student/courses/${course.id}`}>{course.title}</Link>
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-border/50">
                <span className="text-2xl font-bold text-primary">
                  {course.price > 0 ? `$${course.price}` : 'Free'}
                </span>
                <Button onClick={() => handleEnrollClick(course.id)} className="btn-neon">
                  Enroll Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <section id="courses" className="py-12 md:py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Explore Our <span className="text-primary">Courses</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the perfect course to help you achieve your goals.
          </p>
        </div>

        <div className="mb-12 max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search courses by name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {renderContent()}
        
        {!showAll && filteredCourses.length > 3 && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => setShowAll(true)} 
              variant="outline" 
              className="border-primary/50 hover:bg-primary/10 px-8 py-3"
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

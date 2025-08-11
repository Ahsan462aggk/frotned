import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Define the structure of a Course object
interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
}

// Define the props for the CourseCard component
interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const thumbnailUrl = course.thumbnail_url || 'default-thumbnail.jpg'; // Fallback image

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
      <div className="relative h-48 w-full overflow-hidden">
        <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 truncate flex-grow text-white">{course.title}</h3>
        <p className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">PKR {course.price}</p>
        <Link to={`/student/courses/${course.id}`} className="mt-auto">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300">Details</Button>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;

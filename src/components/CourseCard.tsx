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
    <div className="bg-background text-foreground rounded-lg shadow-lg overflow-hidden flex flex-col h-full border border-gray-200">
      <div className="relative h-48 w-full">
        <img src={thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 truncate flex-grow text-foreground">{course.title}</h3>
        <p className="text-primary text-lg font-semibold mb-4">${course.price}</p>
        <Link to={`/student/courses/${course.id}`} className="mt-auto">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">Details</Button>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;

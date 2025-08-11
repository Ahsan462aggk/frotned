import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Play, Trophy, Target, Loader2 } from "lucide-react";
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';
import { toast } from 'sonner';

// Interfaces
interface Quiz {
  id: string;
  title: string;
  description?: string;
  course_id: string;
  course_title: string;
  is_submitted: boolean;
  score: number | null;
  total_questions: number;
}

interface Course {
  id: string;
  title: string;
}

const Quizzes = () => {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesRes = await fetchWithAuth('/api/courses/my-courses');
      const enrolledCourses: Course[] = await handleApiResponse(coursesRes);

      if (enrolledCourses.length === 0) {
        setAvailableQuizzes([]);
        setCompletedQuizzes([]);
        setLoading(false);
        return;
      }

      const quizPromises = enrolledCourses.map(async (course) => {
        try {
          const quizzesRes = await fetchWithAuth(`/api/student/courses/${course.id}/quizzes`);
          const courseQuizzes: Omit<Quiz, 'course_title'>[] = await handleApiResponse(quizzesRes);
          return courseQuizzes.map(quiz => ({ ...quiz, course_title: course.title }));
        } catch (e) {
          console.error(`Failed to fetch quizzes for course ${course.title}`, e);
          return [];
        }
      });

      const quizzesByCourse = await Promise.all(quizPromises);
      const allQuizzes = quizzesByCourse.flat();
      
      const available = allQuizzes.filter((quiz: Quiz) => !quiz.is_submitted);
      const completed = allQuizzes.filter((quiz: Quiz) => quiz.is_submitted);

      setAvailableQuizzes(available);
      setCompletedQuizzes(completed);

    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError('Failed to load quizzes. Please try again later.');
        if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error('An unexpected error occurred.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchQuizzes(); // Initial fetch

    const handleQuizUpdate = () => {
      console.log('Quiz update event received, refetching quizzes.');
      toast.info('The quiz list has been updated.');
      fetchQuizzes();
    };

    window.addEventListener('quiz-updated', handleQuizUpdate);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('quiz-updated', handleQuizUpdate);
    };
  }, [fetchQuizzes]);

  const renderQuizCard = (quiz: Quiz) => {
    const isCompleted = quiz.is_submitted;

    return (
      <div key={quiz.id} className="bg-gray-900/50 backdrop-blur-lg border border-white/10 shadow-lg rounded-2xl p-6 transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-sm text-purple-400 mb-1">{quiz.course_title}</p>
            <h3 className="text-2xl font-bold text-white">{quiz.title}</h3>
            <p className="text-gray-400 mt-2">{quiz.description}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            {isCompleted ? (
              <div className="space-y-2">
                <p className="text-lg font-bold text-green-400">Score: {quiz.score}/{quiz.total_questions}</p>
                
              </div>
            ) : (
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:scale-105 transform transition-transform duration-300">
                <Link to={`/student/quizzes/${quiz.course_id}/${quiz.id}/attempt`}>Start Quiz</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold">Oops! Something went wrong.</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-6">Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Quizzes</h1>
            <p className="text-gray-400 mt-1">Test your knowledge and track your progress.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[{
              icon: Target,
              label: 'Available',
              value: availableQuizzes.length,
              color: 'blue'
            }, {
              icon: CheckCircle,
              label: 'Completed',
              value: completedQuizzes.length,
              color: 'green'
            }, {
              icon: Trophy,
              label: 'Avg Score',
              value: 'N/A',
              color: 'yellow'
            }, {
              icon: Clock,
              label: 'Avg Time',
              value: 'N/A',
              color: 'purple'
            }].map(stat => (
              <div key={stat.label} className="bg-gray-900/50 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-6 flex items-center gap-4">
                <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center border border-${stat.color}-500/20`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <Tabs defaultValue="available" className="w-full">
            <TabsList className="bg-gray-900/50 backdrop-blur-lg border border-white/10 p-1 rounded-xl w-full sm:w-auto">
              <TabsTrigger value="available" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Available Quizzes</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Completed Quizzes</TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="mt-6 space-y-4">
              {availableQuizzes.length > 0 ? availableQuizzes.map(renderQuizCard) : <p className="text-center text-gray-500 py-12">No available quizzes at the moment.</p>}
            </TabsContent>
            <TabsContent value="completed" className="mt-6 space-y-4">
              {completedQuizzes.length > 0 ? completedQuizzes.map(renderQuizCard) : <p className="text-center text-gray-500 py-12">You have not completed any quizzes yet.</p>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Quizzes;

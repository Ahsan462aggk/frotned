import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';
import { toast } from 'sonner';

// Interfaces based on provided schema
interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  is_multiple_choice: boolean;
  options: QuizOption[];
}

interface QuizDetails {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

interface Answer {
  question_id: string;
  selected_option_id: string;
}

interface SubmissionResult {
  id: string;
  student_id: string;
  submitted_at: string; 
  score: number | null;
  is_graded: boolean;
}

const QuizAttempt = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!courseId || !quizId) return;
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/student/quizzes/courses/${courseId}/quizzes/${quizId}`);
        const data: QuizDetails = await handleApiResponse(res);
        setQuiz(data);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load quiz details.');
          if (err instanceof Error) {
            toast.error(err.message);
          } else {
            toast.error('An unexpected error occurred.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [courseId, quizId, navigate]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const otherAnswers = prev.filter(a => a.question_id !== questionId);
      return [...otherAnswers, { question_id: questionId, selected_option_id: optionId }];
    });
  };

  const handleSubmit = async () => {
    if (!courseId || !quizId || !quiz) return;
    if (answers.length !== quiz.questions.length) {
      return toast.warning('Please answer all questions before submitting.');
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/student/quizzes/courses/${courseId}/quizzes/${quizId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data:{ answers },
      });
      const result: SubmissionResult = await handleApiResponse(res);
      toast.success('Quiz submitted successfully!');
      // Navigate to results page with submission ID
      navigate(`/student/quizzes/${courseId}/${quizId}/results/${result.id}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        toast.error('Session expired. Please log in again.');
        navigate('/login');
      } else {
        if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error('Failed to submit quiz.');
        }
      }
    } finally {
      setSubmitting(false);
    }
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

  if (error || !quiz) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-2xl font-bold text-destructive mb-2">An Error Occurred</h2>
            <p className="text-muted-foreground">{error || 'Quiz not found.'}</p>
            <Button onClick={() => navigate('/student/quizzes')} className="mt-4">Back to Quizzes</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-5000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2">{quiz.title}</h1>
              <p className="text-gray-400 max-w-2xl mx-auto">{quiz.description}</p>
            </div>

            <div className="space-y-10">
              {quiz.questions.map((q, index) => (
                <div key={q.id} className="bg-gray-900/40 p-6 rounded-xl border border-white/10">
                  <p className="text-xl font-semibold mb-6 text-white"><span className="text-purple-400">{index + 1}.</span> {q.text}</p>
                  <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)} className="space-y-4">
                    {q.options.map(opt => (
                      <Label key={opt.id} htmlFor={`${q.id}-${opt.id}`} className="flex items-center p-4 rounded-lg bg-gray-800/50 border border-transparent hover:border-purple-500 cursor-pointer transition-all duration-300">
                        <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} className="text-purple-500 border-gray-600" />
                        <span className="ml-4 text-lg text-gray-300">{opt.text}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <Button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="w-full mt-8 py-3 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Submit Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizAttempt;

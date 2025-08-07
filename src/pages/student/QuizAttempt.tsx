import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {quiz.questions.map((q, index) => (
              <div key={q.id}>
                <p className="font-semibold mb-4">{index + 1}. {q.text}</p>
                  <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)}>
                    {q.options.map(opt => (
                      <div key={opt.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                        <Label htmlFor={`${q.id}-${opt.id}`}>{opt.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
              </div>
            ))}
            <Button onClick={handleSubmit} disabled={submitting} className="w-full mt-8">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuizAttempt;

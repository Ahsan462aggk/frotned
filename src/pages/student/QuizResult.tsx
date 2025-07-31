import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';
import { toast } from 'sonner';

// Interfaces based on provided schema
interface ResultAnswer {
  question_id: string;
  question_text: string;
  selected_option_id: string;
  selected_option_text: string;
  correct_option_id: string;
  correct_option_text: string;
  is_correct: boolean;
}

interface QuizResultDetails {
  submission_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  answers: ResultAnswer[];
}

const QuizResult = () => {
  const { courseId, quizId, submissionId } = useParams<{ courseId: string; quizId: string; submissionId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<QuizResultDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResultDetails = async () => {
      if (!courseId || !quizId || !submissionId) return;
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/student/courses/${courseId}/quizzes/${quizId}/results/${submissionId}`);
        const data: QuizResultDetails = await handleApiResponse(res);
        setResult(data);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load quiz results.');
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

    fetchResultDetails();
  }, [courseId, quizId, submissionId, navigate]);

  if (loading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-2xl font-bold text-destructive mb-2">An Error Occurred</h2>
            <p className="text-muted-foreground">{error || 'Quiz results not found.'}</p>
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
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Quiz Results</CardTitle>
            <CardDescription className="text-xl">{result.quiz_title}</CardDescription>
            <div className="mt-4">
              <p className="text-4xl font-bold">Your Score: {result.score}/{result.total_questions}</p>
              <p className="text-lg text-muted-foreground">({((result.score / result.total_questions) * 100).toFixed(2)}%)</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="text-2xl font-semibold border-b pb-2">Review Your Answers</h3>
            {result.answers.map((ans, index) => (
              <div key={ans.question_id} className={`p-4 rounded-lg ${ans.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                <p className="font-semibold mb-2 text-black">{index + 1}. {ans.question_text}</p>
                <div className="flex items-center space-x-2">
                  {ans.is_correct ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                  <p>Your answer: <span className={ans.is_correct ? 'text-green-700' : 'text-red-700'}>{ans.selected_option_text}</span></p>
                </div>
                {!ans.is_correct && (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p>Correct answer: <span className="text-green-700">{ans.correct_option_text}</span></p>
                  </div>
                )}
              </div>
            ))}
            <div className="text-center mt-8">
                <Button asChild>
                    <Link to="/student/quizzes">Back to Quizzes</Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuizResult;

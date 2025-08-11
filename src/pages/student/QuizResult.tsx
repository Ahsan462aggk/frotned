import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from "@/components/DashboardLayout";

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

  const percentage = ((result.score / result.total_questions) * 100).toFixed(2);

  return (
    <DashboardLayout userType="student">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2">Quiz Results</h1>
              <p className="text-xl text-gray-300">{result.quiz_title}</p>
            </div>

            <div className="text-center bg-gray-900/40 border border-white/10 rounded-2xl p-8 mb-10">
              <p className="text-gray-400 text-lg">Your Score</p>
              <p className="text-6xl font-bold text-white my-2">{result.score} <span className="text-4xl text-gray-500">/ {result.total_questions}</span></p>
              <p className="text-2xl font-bold text-purple-400">{percentage}%</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white text-center mb-6">Review Your Answers</h3>
              {result.answers.map((ans, index) => (
                <div key={ans.question_id} className={`bg-gray-900/50 p-6 rounded-xl border-l-4 ${ans.is_correct ? 'border-green-500' : 'border-red-500'}`}>
                  <p className="text-lg font-semibold mb-4 text-gray-300">{index + 1}. {ans.question_text}</p>
                  <div className={`flex items-start space-x-3 p-3 rounded-md ${ans.is_correct ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {ans.is_correct ? <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />}
                    <p className="text-gray-300">Your answer: <span className={`font-semibold ${ans.is_correct ? 'text-green-400' : 'text-red-400'}`}>{ans.selected_option_text}</span></p>
                  </div>
                  {!ans.is_correct && (
                    <div className="flex items-start space-x-3 mt-3 p-3 rounded-md bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-300">Correct answer: <span className="font-semibold text-green-400">{ans.correct_option_text}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:scale-105 transform transition-transform duration-300 px-8 py-3 text-lg">
                <Link to="/student/quizzes">Back to Quizzes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizResult;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface QuizProps {
  quiz: QuizData;
  onQuizComplete: () => void;
}

interface SubmissionResult {
  score: number;
  passed: boolean;
}

const Quiz = ({ quiz, onQuizComplete }: QuizProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submissionPayload = {
      answers: Object.entries(answers).map(([question_id, option_id]) => ({ question_id, option_id }))
    };

    try {
      const response = await fetchWithAuth(`/api/v1/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionPayload),
      });
      const result = await handleApiResponse(response);

      if (result && typeof result === 'object' && 'score' in result && 'passed' in result) {
        const submissionResultData = result as SubmissionResult;
        setSubmissionResult(submissionResultData);
        if (submissionResultData.passed) {
          toast({ title: 'Congratulations!', description: `You passed with a score of ${submissionResultData.score.toFixed(2)}%` });
          onQuizComplete();
        } else {
          toast({ title: 'Quiz Failed', description: `Your score was ${submissionResultData.score.toFixed(2)}%. Please try again later.`, variant: 'destructive' });
        }
      } else {
        throw new Error('Invalid response format from server.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to submit quiz.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult) {
    return (
      <Card className={`mt-4 ${submissionResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardHeader>
          <CardTitle>{submissionResult.passed ? 'Quiz Passed!' : 'Quiz Failed'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your score: <strong>{submissionResult.score.toFixed(2)}%</strong></p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{quiz.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div key={q.id}>
            <p className="font-semibold mb-2">{index + 1}. {q.text}</p>
            <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)} value={answers[q.id]}>
              {q.options.map(opt => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                  <Label htmlFor={`${q.id}-${opt.id}`}>{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || Object.keys(answers).length !== quiz.questions.length}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit Quiz
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Quiz;

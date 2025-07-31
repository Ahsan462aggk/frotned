import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// --- Type Definitions ---
interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Submission {
  id: string;
  student: Student;
  submitted_at: string;
  score: number | null;
  is_graded: boolean;
}

// Types for Grading Modal
interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizWithDetails {
  id: string;
  title: string;
  questions: Question[];
}

interface Answer {
  question_id: string;
  selected_option_id: string | null;
  selected_option_ids: string[];
}

interface SubmissionWithDetails extends Submission {
  answers: Answer[];
  feedback: string | null;
}

interface GradingViewData {
  submission: SubmissionWithDetails;
  quiz: QuizWithDetails;
}

const ViewSubmissions: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmissionData, setSelectedSubmissionData] = useState<GradingViewData | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<string>('');
  const [currentFeedback, setCurrentFeedback] = useState<string>('');

  const calculateAutoScore = (data: GradingViewData): number => {
    let score = 0;
    for (const question of data.quiz.questions) {
      const studentAnswer = data.submission.answers.find(a => a.question_id === question.id);
      if (!studentAnswer) continue;

      const correctOptions = new Set(question.options.filter(o => o.is_correct).map(o => o.id));
      const studentOptions = new Set(studentAnswer.selected_option_ids || (studentAnswer.selected_option_id ? [studentAnswer.selected_option_id] : []));

      if (correctOptions.size > 0 && correctOptions.size === studentOptions.size && [...correctOptions].every(id => studentOptions.has(id))) {
        score += 1; // Assume 1 point per correct question
      }
    }
    return score;
  };

  const fetchSubmissions = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      // Fetch quiz details to get the title
      const quizResponse = await fetchWithAuth(`/api/admin/quizzes/${quizId}`);
      const quizData = await handleApiResponse(quizResponse);
      setQuizTitle(quizData.title);

      // Fetch submissions
      const submissionsResponse = await fetchWithAuth(`/api/admin/quizzes/${quizId}/submissions`);
      const submissionsData = await handleApiResponse(submissionsResponse);
      setSubmissions(submissionsData || []);
    } catch (error) {
      toast.error('Failed to fetch submissions.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleViewDetails = async (submissionId: string) => {
    setIsGradingModalOpen(true);
    setGradingLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/submissions/${submissionId}/grading-view`);
      const data = await handleApiResponse(response);
      setSelectedSubmissionData(data);

      // Auto-calculate score if not already graded
      if (data.submission.is_graded) {
        setCurrentGrade(data.submission.score?.toString() || '');
      } else {
        const autoScore = calculateAutoScore(data);
        setCurrentGrade(autoScore.toString());
      }
      
      setCurrentFeedback(data.submission.feedback || '');
    } catch (error) {
      toast.error('Failed to load submission details.');
      setIsGradingModalOpen(false);
    } finally {
      setGradingLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmissionData) return;

    const submissionId = selectedSubmissionData.submission.id;
    const score = parseFloat(currentGrade);

    if (isNaN(score)) {
      toast.error('Please enter a valid number for the score.');
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/admin/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback: currentFeedback }),
      });
      await handleApiResponse(response);
      toast.success('Grade saved successfully!');
      setIsGradingModalOpen(false);
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      toast.error('Failed to save grade.');
    }
  };

  return (
    <DashboardLayout userType="admin">
      <div className="container mx-auto py-8">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate('/admin/manage-quizzes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quiz Submissions</CardTitle>
            <CardDescription>Submissions for: {quizTitle || 'Loading...'}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{sub.student.email}</div>
                      </TableCell>
                      <TableCell>{format(new Date(sub.submitted_at), 'PPP p')}</TableCell>
                      <TableCell>{sub.is_graded ? 'Graded' : 'Pending'}</TableCell>
                      <TableCell>{sub.score ?? 'N/A'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(sub.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View & Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No submissions found for this quiz.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grading Modal */}
        <Dialog open={isGradingModalOpen} onOpenChange={setIsGradingModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                Reviewing submission from {selectedSubmissionData?.submission.student.full_name}
              </DialogDescription>
            </DialogHeader>
            {gradingLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : selectedSubmissionData && (
              <div className="max-h-[70vh] overflow-y-auto pr-4">
                <div className="space-y-6">
                  {selectedSubmissionData.quiz.questions.map((q, index) => {
                    const studentAnswer = selectedSubmissionData.submission.answers.find(a => a.question_id === q.id);
                    return (
                      <div key={q.id} className="border-b pb-4">
                        <p className="font-semibold">{index + 1}. {q.text}</p>
                        <div className="mt-2 space-y-2">
                          {q.options.map(opt => {
                            const isSelectedByStudent = studentAnswer?.selected_option_id === opt.id || studentAnswer?.selected_option_ids?.includes(opt.id);
                            const isCorrect = opt.is_correct;
                            let indicator = null;
                            if (isSelectedByStudent && isCorrect) {
                              indicator = <CheckCircle2 className="h-5 w-5 text-green-500" />;
                            } else if (isSelectedByStudent && !isCorrect) {
                              indicator = <XCircle className="h-5 w-5 text-red-500" />;
                            } else if (!isSelectedByStudent && isCorrect) {
                              indicator = <CheckCircle2 className="h-5 w-5 text-gray-400" />;
                            }

                            return (
                              <div key={opt.id} className={`flex items-center gap-3 p-2 rounded-md ${isCorrect ? 'bg-green-100' : ''} ${isSelectedByStudent && !isCorrect ? 'bg-red-100' : ''}`}>
                                {indicator}
                                <span className={`${isSelectedByStudent ? 'font-bold' : ''}`}>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="score">Score</Label>
                        <Input id="score" type="number" value={currentGrade} onChange={(e) => setCurrentGrade(e.target.value)} placeholder={`Auto-score: ${calculateAutoScore(selectedSubmissionData)} / ${selectedSubmissionData.quiz.questions.length}`} />
                    </div>
                    <div>
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea id="feedback" value={currentFeedback} onChange={(e) => setCurrentFeedback(e.target.value)} placeholder="Provide feedback to the student..." />
                    </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleGradeSubmit}>Save Grade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ViewSubmissions;

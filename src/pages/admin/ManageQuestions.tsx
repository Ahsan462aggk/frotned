import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, X } from 'lucide-react';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// --- Type Definitions ---
interface Option {
  id?: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizDetails {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

// --- Utility Functions ---
const getNewQuestionTemplate = (): Partial<Question> => ({
  text: '',
  options: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
  ],
});

const ManageQuestions: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchQuizDetails = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/quizzes/${quizId}`);
      const data = await handleApiResponse(response);
      setQuizDetails(data);
    } catch (error) {
      toast.error('Failed to fetch quiz details.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuizDetails();
  }, [fetchQuizDetails]);

  const openModal = (question: Partial<Question> | null = null) => {
    if (question) {
      setCurrentQuestion(JSON.parse(JSON.stringify(question))); // Deep copy
    } else {
      setCurrentQuestion(getNewQuestionTemplate());
    }
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion || !quizId) return;

    // Basic validation
    if (!currentQuestion.text?.trim()) {
      toast.error('Question text cannot be empty.');
      return;
    }
    if (!currentQuestion.options || currentQuestion.options.length < 2) {
      toast.error('A question must have at least two options.');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.text.trim())) {
      toast.error('Option text cannot be empty.');
      return;
    }
    if (!currentQuestion.options.some(opt => opt.is_correct)) {
      toast.error('At least one option must be marked as correct.');
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!currentQuestion.id;
      const url = isEditing
        ? `/api/admin/questions/${currentQuestion.id}`
        : `/api/admin/quizzes/${quizId}/questions`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        text: currentQuestion.text,
        options: currentQuestion.options?.map(({ text, is_correct }) => ({ text, is_correct })) || [],
      };

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await handleApiResponse(response);
      toast.success(`Question successfully ${isEditing ? 'updated' : 'saved'}!`);
      setIsModalOpen(false);
      fetchQuizDetails(); // Refresh data
    } catch (error) {
      toast.error('Failed to save question.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Question deleted successfully.');
        fetchQuizDetails(); // Refresh data
      } else {
        throw new Error('Failed to delete question');
      }
    } catch (error) {
      toast.error('Failed to delete question.');
    }
  };

  // --- Modal Option Handlers ---
  const handleOptionChange = (index: number, text: string) => {
    if (!currentQuestion?.options) return;
    const newOptions = [...currentQuestion.options];
    newOptions[index].text = text;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleCorrectChange = (index: number) => {
    if (!currentQuestion?.options) return;

    const newOptions = [...currentQuestion.options];
    newOptions[index].is_correct = !newOptions[index].is_correct;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    if (!currentQuestion?.options) return;
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: '', is_correct: false }],
    });
  };

  const removeOption = (index: number) => {
    if (!currentQuestion?.options || currentQuestion.options.length <= 2) {
      toast.warning('A question must have at least two options.');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="container mx-auto py-8">
        {/* Header and Actions */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={() => navigate('/admin/manage-quizzes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Question
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Questions</CardTitle>
            {loading ? (
              <CardDescription>Loading quiz details...</CardDescription>
            ) : (
              <CardDescription>For quiz: {quizDetails?.title || 'Unknown'}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : quizDetails && quizDetails.questions.length > 0 ? (
              <div className="space-y-4">
                {quizDetails.questions.map((q, index) => (
                  <Card key={q.id}>
                    <CardHeader className="flex flex-row justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{index + 1}. {q.text}</CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openModal(q)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {q.options.map(opt => (
                          <li key={opt.id} className={`${opt.is_correct ? 'font-semibold text-green-600' : ''}`}>
                            {opt.text}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500"><p>No questions found. Start by adding one!</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Question Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{currentQuestion?.id ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          </DialogHeader>
          {currentQuestion && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Input id="question-text" value={currentQuestion.text} onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />
              </div>

              {/* Options Editor */}
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox id={`correct-${index}`} checked={opt.is_correct} onCheckedChange={() => handleCorrectChange(index)} />
                      <Input placeholder={`Option ${index + 1}`} value={opt.text} onChange={(e) => handleOptionChange(index, e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => removeOption(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={addOption}>Add Option</Button>
              </div>

            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default ManageQuestions;

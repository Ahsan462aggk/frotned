import { useState, useEffect, useCallback, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, X, HelpCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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

const ManageQuestions: FC = () => {
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
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  }, [quizId, navigate]);

  useEffect(() => {
    fetchQuizDetails();
  }, [fetchQuizDetails]);

  const openModal = (question: Partial<Question> | null = null) => {
    setCurrentQuestion(question ? JSON.parse(JSON.stringify(question)) : getNewQuestionTemplate());
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion || !quizId) return;
    if (!currentQuestion.text?.trim() || !currentQuestion.options || currentQuestion.options.length < 2 || currentQuestion.options.some(opt => !opt.text.trim()) || !currentQuestion.options.some(opt => opt.is_correct)) {
      toast.error('Please ensure the question has text and at least two options, with one marked as correct.');
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!currentQuestion.id;
      const url = isEditing ? `/api/admin/questions/${currentQuestion.id}` : `/api/admin/quizzes/${quizId}/questions`;
      const method = isEditing ? 'PUT' : 'POST';
      const payload = { text: currentQuestion.text, options: currentQuestion.options.map(({ text, is_correct }) => ({ text, is_correct })) };

      await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, data: payload });
      toast.success(`Question successfully ${isEditing ? 'updated' : 'saved'}!`);
      setIsModalOpen(false);
      fetchQuizDetails();
    } catch (error) {
      toast.error('Failed to save question.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetchWithAuth(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
      toast.success('Question deleted successfully!');
      fetchQuizDetails();
    } catch (error) {
      toast.error('Failed to delete question.');
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    if (!currentQuestion?.options) return;
    const newOptions = [...currentQuestion.options];
    newOptions[index].text = text;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleCorrectChange = (index: number) => {
    if (!currentQuestion?.options) return;
    const newOptions = currentQuestion.options.map((opt, i) => ({ ...opt, is_correct: i === index }));
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    if (!currentQuestion?.options) return;
    setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, { text: '', is_correct: false }] });
  };

  const removeOption = (index: number) => {
    if (!currentQuestion?.options || currentQuestion.options.length <= 2) {
      toast.error('A question must have at least two options.');
      return;
    }
    setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.filter((_, i) => i !== index) });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-600 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => navigate('/admin/quizzes')} className="bg-gray-800/70 border-gray-700 hover:bg-gray-700/50 flex items-center gap-2 rounded-xl">
              <ArrowLeft className="h-5 w-5" /> Back to Quizzes
            </Button>
            <Button onClick={() => openModal()} className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold hover:scale-105 transition-transform shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Add New Question
            </Button>
          </div>

          <Card className="bg-gray-900/50 backdrop-blur-lg border border-cyan-500/20 shadow-2xl rounded-2xl">
            <CardContent className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-cyan-400" /></div>
              ) : quizDetails ? (
                <>
                  <div className="mb-6 pb-4 border-b border-cyan-500/20">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text flex items-center gap-3">
                      <HelpCircle className="w-10 h-10" /> {quizDetails.title}
                    </h1>
                    <p className="text-gray-400 mt-2">{quizDetails.description}</p>
                  </div>
                  <div className="space-y-4">
                    {quizDetails.questions.length > 0 ? quizDetails.questions.map((q, index) => (
                      <div key={q.id} className="bg-gray-800/60 p-4 rounded-xl border border-gray-700/50 flex justify-between items-start group">
                        <div>
                          <p className="font-semibold text-lg text-cyan-300">{index + 1}. {q.text}</p>
                          <ul className="mt-2 space-y-1 text-sm pl-2">
                            {q.options.map(opt => (
                              <li key={opt.id} className={`flex items-center gap-2 ${opt.is_correct ? 'font-semibold text-teal-400' : 'text-gray-300'}`}>
                                {opt.is_correct ? <CheckCircle className="w-4 h-4 text-teal-400" /> : <MessageSquare className="w-4 h-4 text-gray-500" />} {opt.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openModal(q)} className="text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 rounded-full"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-20 text-gray-500">
                        <p className="text-lg">This quiz has no questions yet.</p>
                        <p>Click "Add New Question" to get started.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-cyan-500/30 text-white max-w-2xl rounded-2xl shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-transparent bg-clip-text pb-2 flex items-center gap-3"><HelpCircle className="w-8 h-8" />{currentQuestion?.id ? 'Edit Question' : 'Add New Question'}</DialogTitle></DialogHeader>
            {currentQuestion && (
              <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="question-text" className="text-gray-400 text-sm">Question Text</Label>
                  <Input id="question-text" value={currentQuestion.text} onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} className="bg-gray-800/70 border-gray-700 focus:border-cyan-500 mt-2" />
                </div>
                <div className="space-y-3">
                  <Label className="text-gray-400 text-sm">Options (select the correct one)</Label>
                  {currentQuestion.options?.map((opt, index) => (
                    <div key={index} className="flex items-center gap-3 group/option">
                      <Checkbox id={`correct-${index}`} checked={opt.is_correct} onCheckedChange={() => handleCorrectChange(index)} className="w-5 h-5 border-gray-600 data-[state=checked]:bg-teal-500" />
                      <Input placeholder={`Option ${index + 1}`} value={opt.text} onChange={(e) => handleOptionChange(index, e.target.value)} className="flex-grow bg-gray-800/70 border-gray-700 focus:border-teal-500" />
                      <Button variant="ghost" size="icon" onClick={() => removeOption(index)} className="text-gray-600 hover:bg-red-500/20 hover:text-red-400 rounded-full w-7 h-7 opacity-0 group-hover/option:opacity-100 transition-opacity"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addOption} className="border-dashed border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:text-white">Add Option</Button>
              </div>
            )}
            <DialogFooter className="mt-auto pt-4 border-t border-gray-700/50 gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-700 hover:bg-gray-800">Cancel</Button>
              <Button onClick={handleSaveQuestion} disabled={isSaving} className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold hover:scale-105 transition-transform">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageQuestions;

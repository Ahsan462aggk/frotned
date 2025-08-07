import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// --- Type Definitions ---
interface Option {
  text: string;
  is_correct: boolean;
}

interface Question {
  text: string;
  options: Option[];
}

interface Course {
  id: string;
  title: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  course_id: string;
  due_date: string | null;
  questions?: Question[];
}

const ManageQuizzes: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);

  const fetchQuizzesByCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingQuizzes(true);
    setQuizzes([]);
    try {
      const response = await fetchWithAuth(`/api/admin/quizzes?course_id=${courseId}`);
      const data = await handleApiResponse(response);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch quizzes for the selected course.');
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetchWithAuth('/api/admin/courses');
      const data = await handleApiResponse(response);
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch courses.');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchQuizzesByCourse(selectedCourseId);
    }
  }, [selectedCourseId, fetchQuizzesByCourse]);

  const handleAdd = () => {
    if (!selectedCourseId) {
      toast.error('Please select a course first to add a quiz.');
      return;
    }
    setCurrentQuiz({
      id: '',
      title: '',
      description: '',
      course_id: selectedCourseId,
      due_date: null,
      questions: [], // Initialize with an empty question
    });
    setIsModalOpen(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/quizzes/${quizId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Quiz deleted successfully!');
        if (selectedCourseId) {
          fetchQuizzesByCourse(selectedCourseId);
        }
        window.dispatchEvent(new CustomEvent('quiz-updated')); // Notify other components
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail);
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete quiz.');
    }
  };

  const handleSave = async () => {
    if (!currentQuiz) return;

    const method = currentQuiz.id ? 'PUT' : 'POST';
    const url = currentQuiz.id ? `/api/admin/quizzes/${currentQuiz.id}` : '/api/admin/quizzes';

    const payload = {
      ...currentQuiz,
      course_id: selectedCourseId,
      due_date: currentQuiz.due_date ? new Date(currentQuiz.due_date).toISOString() : null,
    };

    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });

      await handleApiResponse(response);
      toast.success(`Quiz ${currentQuiz.id ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      if (selectedCourseId) {
        fetchQuizzesByCourse(selectedCourseId);
      }
      window.dispatchEvent(new CustomEvent('quiz-updated'));
    } catch (error) {
      toast.error(`Failed to ${currentQuiz.id ? 'update' : 'create'} quiz.`);
    }
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    if (!currentQuiz) return;
    const newQuestions = [...currentQuiz.questions!];
    (newQuestions[qIndex] as any)[field] = value;
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => {
    if (!currentQuiz) return;
    const newQuestions = [...currentQuiz.questions!];
    (newQuestions[qIndex].options[oIndex] as any)[field] = value;
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  const addQuestion = () => {
    if (!currentQuiz) return;
    const newQuestions = [...(currentQuiz.questions || [])];
    newQuestions.push({ text: '', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] });
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  const removeQuestion = (qIndex: number) => {
    if (!currentQuiz) return;
    const newQuestions = [...currentQuiz.questions!];
    newQuestions.splice(qIndex, 1);
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    if (!currentQuiz) return;
    const newQuestions = [...currentQuiz.questions!];
    newQuestions[qIndex].options.push({ text: '', is_correct: false });
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (!currentQuiz) return;
    const newQuestions = [...currentQuiz.questions!];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setCurrentQuiz({ ...currentQuiz, questions: newQuestions });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Quizzes</h1>
        <div className="flex items-center gap-4">
          {loadingCourses ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Quiz
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz List</CardTitle>
          <CardDescription>A list of quizzes for the selected course.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQuizzes ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizzes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.map((quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>{quiz.description}</TableCell>
                    <TableCell>{quiz.due_date ? format(new Date(quiz.due_date), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(quiz)}>Edit Quiz</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(quiz.id)}>Delete Quiz</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No quizzes found for this course.</p>
              <p className="text-sm text-gray-400">Select a course to see its quizzes or add a new one.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Quiz Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentQuiz?.id ? 'Edit Quiz' : 'Add New Quiz'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 flex-grow overflow-hidden">
            
            {/* Left Column: Quiz Details */}
            <div className="space-y-6 flex flex-col">
              <h2 className="text-xl font-semibold border-b pb-2">Quiz Details</h2>
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input id="title" value={currentQuiz?.title || ''} onChange={(e) => setCurrentQuiz({ ...currentQuiz!, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea id="description" value={currentQuiz?.description || ''} onChange={(e) => setCurrentQuiz({ ...currentQuiz!, description: e.target.value })} className="mt-1" rows={4} />
              </div>
              <div>
                <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                <Input id="due_date" type="date" value={currentQuiz?.due_date ? currentQuiz.due_date.split('T')[0] : ''} onChange={(e) => setCurrentQuiz({ ...currentQuiz!, due_date: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Right Column: Questions */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-semibold">Questions</h2>
                <Button onClick={addQuestion} size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
              <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                {currentQuiz?.questions?.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border rounded-lg bg-slate-50/50 relative">
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-500 hover:bg-red-100 hover:text-red-600" onClick={() => removeQuestion(qIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    <div className="space-y-3">
                      <Label htmlFor={`q-text-${qIndex}`} className="font-semibold text-red-600">{`Question ${qIndex + 1}`}</Label>
                      <Textarea
                        id={`q-text-${qIndex}`}
                        placeholder="What is the capital of..."
                        value={q.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        className="bg-white text-black"
                      />
                      <div className="pl-4 pt-2 space-y-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Checkbox 
                              id={`q-${qIndex}-opt-${oIndex}`}
                              checked={opt.is_correct}
                              onCheckedChange={(checked) => handleOptionChange(qIndex, oIndex, 'is_correct', checked)}
                            />
                            <Input
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt.text}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                              className="flex-grow"
                            />
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-red-100 hover:text-red-500" onClick={() => removeOption(qIndex, oIndex)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => addOption(qIndex)}>
                          <PlusCircle className="h-3 w-3 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                 {currentQuiz?.questions?.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                      <p className="text-slate-500">No questions yet.</p>
                      <p className="text-sm text-slate-400">Click "Add Question" to start building your quiz.</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageQuizzes;
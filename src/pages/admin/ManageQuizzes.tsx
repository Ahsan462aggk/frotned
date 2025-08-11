import { useState, useEffect, useCallback, FC } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreVertical, Plus, Loader2, Trash2, Edit, ClipboardEdit, ListChecks, X, Calendar as CalendarIcon, BookOpenCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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

const ManageQuizzes: FC = () => {
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
      due_date: new Date().toISOString(),
      questions: [{ text: 'New Question', options: [{ text: 'Option 1', is_correct: true }] }],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

    try {
      await fetchWithAuth(`/api/admin/quizzes/${quizId}`, { method: 'DELETE' });
      toast.success('Quiz deleted successfully!');
      if (selectedCourseId) fetchQuizzesByCourse(selectedCourseId);
    } catch (error) {
      toast.error('Failed to delete quiz.');
    }
  };

  const handleSave = async () => {
    if (!currentQuiz) return;

    const quizData = {
      ...currentQuiz,
      due_date: currentQuiz.due_date ? new Date(currentQuiz.due_date).toISOString() : null,
    };

    const url = currentQuiz.id ? `/api/admin/quizzes/${currentQuiz.id}` : '/api/admin/quizzes';
    const method = currentQuiz.id ? 'PUT' : 'POST';

    try {
      await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        data: quizData,
      });
      toast.success(`Quiz ${currentQuiz.id ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      if (selectedCourseId) fetchQuizzesByCourse(selectedCourseId);
    } catch (error) {
      toast.error(`Failed to ${currentQuiz.id ? 'update' : 'create'} quiz.`);
    }
  };

  const handleQuestionChange = (qIndex: number, field: string, value: any) => {
    const updatedQuestions = [...(currentQuiz?.questions || [])];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
    setCurrentQuiz({ ...currentQuiz!, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updatedQuestions = [...(currentQuiz?.questions || [])];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[oIndex] = { ...updatedOptions[oIndex], [field]: value };
    updatedQuestions[qIndex].options = updatedOptions;
    setCurrentQuiz({ ...currentQuiz!, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const newQuestion = { text: 'New Question', options: [{ text: 'Option 1', is_correct: true }] };
    setCurrentQuiz({ ...currentQuiz!, questions: [...(currentQuiz?.questions || []), newQuestion] });
  };

  const removeQuestion = (qIndex: number) => {
    const updatedQuestions = (currentQuiz?.questions || []).filter((_, i) => i !== qIndex);
    setCurrentQuiz({ ...currentQuiz!, questions: updatedQuestions });
  };

  const addOption = (qIndex: number) => {
    const updatedQuestions = [...(currentQuiz?.questions || [])];
    updatedQuestions[qIndex].options.push({ text: 'New Option', is_correct: false });
    setCurrentQuiz({ ...currentQuiz!, questions: updatedQuestions });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...(currentQuiz?.questions || [])];
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setCurrentQuiz({ ...currentQuiz!, questions: updatedQuestions });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <Card className="bg-gray-900/50 backdrop-blur-lg border border-purple-500/20 shadow-2xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text flex items-center gap-3">
                  <ListChecks className="w-10 h-10" /> Manage Quizzes
                </h1>
                <Button onClick={handleAdd} disabled={!selectedCourseId} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:scale-100">
                  <Plus className="mr-2 h-5 w-5" /> Add New Quiz
                </Button>
              </div>

              <div className="mb-6">
                <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                  <SelectTrigger className="w-full sm:w-[320px] bg-gray-800/70 border-gray-700 placeholder:text-gray-400 rounded-xl text-lg p-6">
                    <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course to begin"} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white rounded-xl">
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id} className="text-lg hover:bg-purple-500/20 cursor-pointer">{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loadingQuizzes ? (
                <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-purple-400" /></div>
              ) : quizzes.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="text-white">
                    <TableHeader className="border-b border-gray-700"><TableRow className="hover:bg-transparent"><TableHead className="text-white/80">Title</TableHead><TableHead className="text-white/80">Description</TableHead><TableHead className="text-white/80">Due Date</TableHead><TableHead className="text-right text-white/80">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {quizzes.map((quiz) => (
                        <TableRow key={quiz.id} className="border-gray-800 hover:bg-gray-800/60">
                          <TableCell className="font-medium text-lg">{quiz.title}</TableCell>
                          <TableCell className="text-gray-400">{quiz.description}</TableCell>
                          <TableCell>{quiz.due_date ? format(new Date(quiz.due_date), 'PPP') : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white"><span className="sr-only">Open menu</span><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white rounded-xl">
                                <DropdownMenuItem onClick={() => handleEdit(quiz)} className="cursor-pointer hover:bg-purple-500/20"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(quiz.id)} className="text-red-500 cursor-pointer hover:!bg-red-500/20 hover:!text-red-400"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20 bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
                  <BookOpenCheck className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-4 text-lg font-semibold">No Quizzes Found</h3>
                  <p className="mt-1 text-sm text-gray-500">{selectedCourseId ? 'This course has no quizzes yet.' : 'Please select a course to see its quizzes.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-5xl h-[90vh] flex flex-col rounded-2xl shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text pb-2 flex items-center gap-3"><ClipboardEdit className="w-8 h-8" />{currentQuiz?.id ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
              {/* Left Column: Quiz Details */}
              <div className="md:col-span-1 flex flex-col space-y-6 pr-4 border-r border-gray-700/50">
                <div><Label htmlFor="title" className="text-gray-400 text-sm">Quiz Title</Label><Input id="title" value={currentQuiz?.title || ''} onChange={(e) => setCurrentQuiz({ ...currentQuiz!, title: e.target.value })} className="bg-gray-800/70 border-gray-700 focus:border-purple-500 mt-2" /></div>
                <div><Label htmlFor="description" className="text-gray-400 text-sm">Description</Label><Textarea id="description" value={currentQuiz?.description || ''} onChange={(e) => setCurrentQuiz({ ...currentQuiz!, description: e.target.value })} className="bg-gray-800/70 border-gray-700 focus:border-purple-500 mt-2" /></div>
                <div><Label className="text-gray-400 text-sm">Due Date</Label>
                  <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-2 bg-gray-800/70 border-gray-700 hover:bg-gray-800", !currentQuiz?.due_date && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{currentQuiz?.due_date ? format(new Date(currentQuiz.due_date), "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white rounded-xl"><Calendar mode="single" selected={currentQuiz?.due_date ? new Date(currentQuiz.due_date) : undefined} onSelect={(date) => setCurrentQuiz({...currentQuiz!, due_date: date?.toISOString() || null})} initialFocus /></PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Right Column: Questions */}
              <div className="md:col-span-2 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center pb-2 mb-4"><h2 className="text-xl font-semibold">Questions & Options</h2><Button onClick={addQuestion} size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:scale-105 transition-transform"><Plus className="h-4 w-4 mr-2" />Add Question</Button></div>
                <div className="flex-grow overflow-y-auto pr-4 space-y-4 styled-scrollbar">
                  {currentQuiz?.questions?.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 border border-gray-700/50 rounded-xl bg-gray-900/50 relative group">
                      <div className="flex items-center justify-between mb-3">
                        <Label htmlFor={`q-text-${qIndex}`} className="font-semibold text-purple-400">{`Question ${qIndex + 1}`}</Label>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-red-500/20 hover:text-red-400 rounded-full w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeQuestion(qIndex)}><X className="h-4 w-4" /></Button>
                      </div>
                      <Textarea id={`q-text-${qIndex}`} placeholder="What is the capital of..." value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} className="bg-gray-800/70 border-gray-700 focus:border-purple-500" />
                      <div className="pl-4 pt-4 space-y-3">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3 group/option">
                            <Checkbox id={`q-${qIndex}-opt-${oIndex}`} checked={opt.is_correct} onCheckedChange={(checked) => handleOptionChange(qIndex, oIndex, 'is_correct', !!checked)} className="w-5 h-5 border-gray-600 data-[state=checked]:bg-green-500" />
                            <Input placeholder={`Option ${oIndex + 1}`} value={opt.text} onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)} className="flex-grow bg-gray-800/70 border-gray-700 focus:border-cyan-500" />
                            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-red-500/20 hover:text-red-400 rounded-full w-7 h-7 opacity-0 group-hover/option:opacity-100 transition-opacity" onClick={() => removeOption(qIndex, oIndex)}><X className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="mt-2 border-dashed border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:text-white" onClick={() => addOption(qIndex)}><Plus className="h-3 w-3 mr-2" />Add Option</Button>
                      </div>
                    </div>
                  ))}
                  {currentQuiz?.questions?.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
                      <p className="text-gray-500">No questions yet.</p>
                      <p className="text-sm text-gray-400">Click "Add Question" to start building your quiz.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-auto pt-4 border-t border-gray-700/50 gap-2 sm:gap-0"><Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-700 hover:bg-gray-800">Cancel</Button><Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform">Save Quiz</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageQuizzes;
import { useState, useEffect, useCallback, FC } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, MoreVertical, Edit, Trash2, Eye, Loader2, Calendar as CalendarIcon, BookOpenCheck, FileText, Award } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// --- Type Definitions ---
interface Course {
  id: string;
  title: string;
}

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
}

interface Submission {
  id: string;
  student_id: string;
  email: string;
  full_name: string;
  submitted_at: string;
  content_url: string;
  grade: number | null;
  feedback: string | null;
}

interface SubmissionsResponse {
  assignment: Assignment;
  submissions: Submission[];
}

// --- Main Component ---
const ManageAssignments: FC = () => {
  // --- State Management ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState({ courses: true, assignments: false, submissions: false });

  // Modals State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  
  // Submissions Data
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Form State
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState<Date>();
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // --- API Calls ---
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, courses: true }));
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth('https://student-portal-lms-seven.vercel.app/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await handleApiResponse(response);
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch courses.');
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!selectedCourse) {
      setAssignments([]);
      return;
    }
    try {
      setLoading(prev => ({ ...prev, assignments: true }));
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(
        `https://student-portal-lms-seven.vercel.app/api/admin/courses/${selectedCourse}/assignments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await handleApiResponse(response);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to fetch assignments.');
      setAssignments([]);
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // --- Modal Handlers ---
  const openCreateModal = () => {
    setEditingAssignment(null);
    setAssignmentTitle('');
    setAssignmentDesc('');
    setAssignmentDueDate(undefined);
    setIsAssignmentModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentTitle(assignment.title);
    setAssignmentDesc(assignment.description);
    setAssignmentDueDate(new Date(assignment.due_date));
    setIsAssignmentModalOpen(true);
  };

  // --- CRUD Handlers ---
  const handleSaveAssignment = async () => {
    if (!assignmentTitle || !assignmentDesc || !assignmentDueDate) {
      toast.error('Please fill all fields.');
      return;
    }
    
    const body = {
      title: assignmentTitle,
      description: assignmentDesc,
      due_date: assignmentDueDate.toISOString()
    };

    const baseUrl = 'https://student-portal-lms-seven.vercel.app/api';
    const endpoint = editingAssignment
      ? `/admin/courses/${selectedCourse}/assignments/${editingAssignment.id}`
      : `/admin/courses/${selectedCourse}/assignments`;
      
    const method = editingAssignment ? 'PUT' : 'POST';
    const token = localStorage.getItem('admin_access_token');

    try {
      console.log('Sending request to:', `${baseUrl}${endpoint}`);
      console.log('Request body:', body);
      
      console.log('Sending request with method:', method);
      console.log('Full URL:', `${baseUrl}${endpoint}`);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      
      const response = await fetchWithAuth(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: body
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseData = response.data;
      console.log('Response data:', responseData);

      if (response.status >= 400) {
        throw new Error(responseData.detail || responseData.message || `HTTP error! Status: ${response.status}`);
      }

      console.log('API Response:', responseData);
      
      toast.success(`Assignment ${editingAssignment ? 'updated' : 'created'} successfully!`);
      setIsAssignmentModalOpen(false);
      fetchAssignments();
    } catch (error: any) {
      console.error('Error saving assignment:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(error.message || `Failed to ${editingAssignment ? 'update' : 'create'} assignment.`);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(
        `https://student-portal-lms-seven.vercel.app/api/admin/courses/${selectedCourse}/assignments/${assignmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        toast.success('Assignment deleted successfully!');
        fetchAssignments();
      } else {
        try {
          const result = await handleApiResponse<{ detail?: string }>(response);
          toast.error(result.detail || 'Failed to delete assignment.');
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete assignment.');
        }
      }
    } catch (error) {
      toast.error('Failed to delete assignment.');
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setViewingSubmissionsFor(assignment);
    try {
      setLoading(prev => ({ ...prev, submissions: true }));
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(
        `https://student-portal-lms-seven.vercel.app/api/admin/courses/${assignment.course_id}/assignments/${assignment.id}/submissions/students`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await handleApiResponse<SubmissionsResponse>(response);
      setSubmissions(data?.submissions ?? []);
    } catch (error) {
      toast.error('Failed to fetch submissions.');
      setSubmissions([]);
    } finally {
      setLoading(prev => ({ ...prev, submissions: false }));
    }
  };

  const handleGradeSubmission = async () => {
    if (!grade || !gradingSubmission || !viewingSubmissionsFor) return;
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(
        `https://student-portal-lms-seven.vercel.app/api/admin/courses/${viewingSubmissionsFor.course_id}/assignments/${viewingSubmissionsFor.id}/submissions/${gradingSubmission.id}/grade`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: { grade: parseInt(grade), feedback }
        }
      );
      await handleApiResponse(response);
      toast.success('Submission graded successfully!');
      setGradingSubmission(null);
      handleViewSubmissions(viewingSubmissionsFor); // Refresh submissions list
    } catch (error) {
      toast.error('Failed to grade submission.');
    }
  };

  // --- Render Method ---
  return (
    <DashboardLayout userType="admin">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text pb-2 flex items-center gap-3">
              <BookOpenCheck className="w-10 h-10" />
              Manage Assignments
            </h1>
            <div className="flex items-center gap-4">
              <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                <SelectTrigger className="w-[280px] bg-gray-800/60 border-gray-700 hover:border-purple-500 focus:ring-purple-500 rounded-xl">
                  <SelectValue placeholder="Select a course to begin..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/80 text-white border-gray-700 backdrop-blur-md">
                  {loading.courses ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  ) : (
                    courses.map(course => (
                      <SelectItem key={course.id} value={course.id} className="hover:bg-purple-500/20">{course.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={openCreateModal} disabled={!selectedCourse} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100">
                <Plus className="mr-2 h-4 w-4" /> Create Assignment
              </Button>
            </div>
          </div>

          <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              {loading.assignments ? (
                <div className="flex items-center justify-center p-16"><Loader2 className="h-12 w-12 animate-spin text-purple-400" /></div>
              ) : assignments.length > 0 ? (
                <Table className="text-white">
                  <TableHeader className="border-b border-gray-700">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-white/80">Title</TableHead>
                      <TableHead className="text-white/80">Due Date</TableHead>
                      <TableHead className="text-right text-white/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id} className="border-gray-800 hover:bg-gray-800/60">
                        <TableCell className="font-medium text-lg">{assignment.title}</TableCell>
                        <TableCell>{format(new Date(assignment.due_date), 'PPPpp')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-900/80 text-white border-gray-700 backdrop-blur-md">
                              <DropdownMenuItem onClick={() => openEditModal(assignment)} className="hover:!bg-purple-500/20"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewSubmissions(assignment)} className="hover:!bg-purple-500/20"><Eye className="mr-2 h-4 w-4" /> View Submissions</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteAssignment(assignment.id)} className="hover:!bg-red-500/20 text-red-400"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-gray-400 p-16">
                  <p className="text-xl">{selectedCourse ? 'No assignments for this course yet.' : 'Select a course to see assignments.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals with consistent beautiful styling */}
      <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-2xl rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text pb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div><Label htmlFor="title" className="text-gray-400 text-sm">Title</Label><Input id="title" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} className="bg-gray-800/70 border-gray-700 focus:border-purple-500" /></div>
            <div><Label htmlFor="description" className="text-gray-400 text-sm">Description</Label><Textarea id="description" value={assignmentDesc} onChange={e => setAssignmentDesc(e.target.value)} className="bg-gray-800/70 border-gray-700 focus:border-purple-500" /></div>
            <div>
              <Label htmlFor="due_date" className="text-gray-400 text-sm">Due Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-gray-800/70 border-gray-700 hover:bg-gray-700/80 hover:text-white", !assignmentDueDate && "text-gray-400")}><CalendarIcon className="mr-2 h-4 w-4" />{assignmentDueDate ? format(assignmentDueDate, "PPPpp") : <span>Pick a date and time</span>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900/80 border-gray-700 backdrop-blur-md text-white">
                  <Calendar mode="single" selected={assignmentDueDate} onSelect={setAssignmentDueDate} initialFocus className="text-white" />
                  <div className="p-3 border-t border-gray-700"><Input type="time" value={assignmentDueDate ? format(assignmentDueDate, 'HH:mm') : ''} onChange={(e) => { if (!assignmentDueDate) return; const [h, m] = e.target.value.split(':').map(Number); const newDate = new Date(assignmentDueDate); newDate.setHours(h, m); setAssignmentDueDate(newDate); }} className="w-full bg-gray-800/70 border-gray-700" /></div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0"><DialogClose asChild><Button type="button" variant="outline" className="border-gray-700 hover:bg-gray-800">Cancel</Button></DialogClose><Button onClick={handleSaveAssignment} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSubmissionsFor} onOpenChange={(isOpen) => !isOpen && setViewingSubmissionsFor(null)}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-4xl rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text pb-2">Submissions for "{viewingSubmissionsFor?.title}"</DialogTitle></DialogHeader>
          {loading.submissions ? (
            <div className="flex items-center justify-center p-16"><Loader2 className="h-12 w-12 animate-spin text-purple-400" /></div>
          ) : submissions.length > 0 ? (
            <Table className="text-white"><TableHeader className="border-b border-gray-700"><TableRow className="hover:bg-transparent"><TableHead className="text-white/80">Student</TableHead><TableHead className="text-white/80">Submitted At</TableHead><TableHead className="text-white/80">Grade</TableHead><TableHead className="text-right text-white/80">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {submissions.map(sub => (
                  <TableRow key={sub.id} className="border-gray-800 hover:bg-gray-800/60">
                    <TableCell>{sub.full_name} <span className="text-gray-400">({sub.email})</span></TableCell>
                    <TableCell>{new Date(sub.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>{sub.grade ? <span className="font-bold text-green-400">{sub.grade} / 100</span> : <span className="text-yellow-400">Not Graded</span>}</TableCell>
                    <TableCell className="text-right"><Button size="sm" onClick={() => { setGradingSubmission(sub); setGrade(String(sub.grade ?? '')); setFeedback(sub.feedback ?? ''); }} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:scale-105 transition-transform">Grade</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-400 p-16">No one has submitted this assignment yet.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!gradingSubmission} onOpenChange={(isOpen) => !isOpen && setGradingSubmission(null)}>
        <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-lg rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text pb-2 flex items-center gap-3"><Award className="w-8 h-8" /> Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div><Label htmlFor="grade" className="text-gray-400 text-sm">Grade (out of 100)</Label><Input id="grade" type="number" value={grade} onChange={e => setGrade(e.target.value)} className="bg-gray-800/70 border-gray-700 focus:border-blue-500" /></div>
            <div><Label htmlFor="feedback" className="text-gray-400 text-sm">Feedback</Label><Textarea id="feedback" value={feedback} onChange={e => setFeedback(e.target.value)} className="bg-gray-800/70 border-gray-700 focus:border-blue-500" /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0"><Button variant="outline" onClick={() => setGradingSubmission(null)} className="border-gray-700 hover:bg-gray-800">Cancel</Button><Button onClick={handleGradeSubmission} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:scale-105 transition-transform">Submit Grade</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageAssignments;


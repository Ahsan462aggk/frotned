import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, MoreVertical, Edit, Trash2, Eye, Loader2, Calendar as CalendarIcon } from 'lucide-react';
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
const ManageAssignments = () => {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Assignments</h1>
          <Button onClick={openCreateModal} disabled={!selectedCourse || loading.assignments}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        </div>
        
        <Card>
          <CardHeader><CardTitle>Select a Course</CardTitle></CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={loading.courses}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder={loading.courses ? "Loading courses..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent className="max-h-56 custom-scrollbar">
                {courses.map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCourse && (
          <Card>
            <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
            <CardContent>
              {loading.assignments ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : assignments.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{new Date(assignment.due_date).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewSubmissions(assignment)}><Eye className="mr-2 h-4 w-4" /><span>View Submissions</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditModal(assignment)}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteAssignment(assignment.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No assignments have been added for this course yet.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* --- Modals --- */}
      <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input 
                id="title" 
                value={assignmentTitle} 
                onChange={e => setAssignmentTitle(e.target.value)} 
                className="col-span-3" 
                placeholder="Enter assignment title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc" className="text-right">Description</Label>
              <Textarea 
                id="desc" 
                value={assignmentDesc} 
                onChange={e => setAssignmentDesc(e.target.value)} 
                className="col-span-3" 
                placeholder="Enter assignment description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Due Date</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !assignmentDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {assignmentDueDate ? (
                        format(assignmentDueDate, "PPP")
                      ) : (
                        <span>Pick a due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={assignmentDueDate}
                      onSelect={setAssignmentDueDate}
                      initialFocus
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={assignmentDueDate ? format(assignmentDueDate, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (!assignmentDueDate) return;
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const newDate = new Date(assignmentDueDate);
                          newDate.setHours(hours, minutes);
                          setAssignmentDueDate(newDate);
                        }}
                        className="w-full"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {assignmentDueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {format(assignmentDueDate, "PPPpp")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button onClick={handleSaveAssignment}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSubmissionsFor} onOpenChange={(isOpen) => !isOpen && setViewingSubmissionsFor(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Submissions for "{viewingSubmissionsFor?.title}"</DialogTitle></DialogHeader>
          {loading.submissions ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : submissions.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Submitted At</TableHead><TableHead>Grade</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {submissions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.full_name}</TableCell>
                    <TableCell>{new Date(sub.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>{sub.grade ?? 'Not Graded'}</TableCell>
                    <TableCell className="text-right"><Button size="sm" onClick={() => { setGradingSubmission(sub); setGrade(String(sub.grade ?? '')); setFeedback(sub.feedback ?? ''); }}>Grade</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">No one has submitted this assignment yet.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!gradingSubmission} onOpenChange={(isOpen) => !isOpen && setGradingSubmission(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grade Submission</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="grade">Grade</Label><Input id="grade" type="number" value={grade} onChange={e => setGrade(e.target.value)} /></div>
            <div><Label htmlFor="feedback">Feedback</Label><Textarea id="feedback" value={feedback} onChange={e => setFeedback(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="secondary" onClick={() => setGradingSubmission(null)}>Cancel</Button><Button onClick={handleGradeSubmission}>Submit Grade</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageAssignments;


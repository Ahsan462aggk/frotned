import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

// Components
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/upload/FileUploader';

import { api } from '@/lib/api';

// Types
interface Course {
  _id: string;
  id: string;
  title: string;
  description: string;
  price: number;
  total_enrollments: number;
  is_published: boolean;
  thumbnail_url?: string;
  status?: string;
  difficulty_level?: string;
  outcomes?: string;
  prerequisites?: string;
  curriculum?: string;
  videos?: any[];
}


// Zod Schemas
const courseFormSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  thumbnail: z.any().optional(), // Thumbnail is handled separately and validated in the submit handler
  difficulty_level: z.string().min(1, 'Difficulty level is required'),
  outcomes: z.string().min(1, 'Outcomes are required'),
  prerequisites: z.string().min(1, 'Prerequisites are required'),
  curriculum: z.string().min(1, 'Curriculum is required'),
  status: z.string().min(1, 'Status is required'),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      difficulty_level: 'Beginner',
      outcomes: '',
      prerequisites: '',
      curriculum: '',
      status: 'draft',
      thumbnail: null,
    },
  });



  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/courses");
      setCourses(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch courses';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onSubmit = async (data: CourseFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Step 1: Handle thumbnail upload if a new one is selected
      let thumbnailUrl = selectedCourse?.thumbnail_url || '';
      if (thumbnailFile) {
        const thumbFormData = new FormData();
        thumbFormData.append('file', thumbnailFile);
        try {
          const res = await api.post('/api/admin/upload/image', thumbFormData);
          thumbnailUrl = res.data.url; // This is the private S3 URL
          // DO NOT set the preview to the private URL. The local blob preview is enough.
        } catch (error) {
          console.error('Thumbnail upload failed:', error);
          toast.error('Failed to upload thumbnail. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Create or Update the Course using FormData
      const isUpdating = !!selectedCourse;
      const courseFormData = new FormData();
      courseFormData.append('title', data.title);
      courseFormData.append('description', data.description);
      courseFormData.append('price', data.price.toString());
      if (data.difficulty_level) courseFormData.append('difficulty_level', data.difficulty_level);
      if (data.outcomes) courseFormData.append('outcomes', data.outcomes);
      if (data.prerequisites) courseFormData.append('prerequisites', data.prerequisites);
      if (data.curriculum) courseFormData.append('curriculum', data.curriculum);
      if (data.status) courseFormData.append('status', data.status);
      if (thumbnailUrl) {
        courseFormData.append('thumbnail_url', thumbnailUrl);
      }

      const courseResponse = isUpdating
        ? await api.put(`/api/admin/courses/${selectedCourse?.id}`, courseFormData)
        : await api.post('/api/admin/courses', courseFormData);

      toast.success(`Course ${isUpdating ? 'updated' : 'created'} successfully!`);

      // Step 3: Await fetching courses to get the new presigned URL before closing the dialog
      await fetchCourses();
      setIsDialogOpen(false);

    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'An unexpected error occurred.';
      toast.error(errorMessage);
      console.error('Error saving course:', error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress({});
    }
  };

  const handleThumbnailChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setThumbnailFile(file);
      const newPreview = URL.createObjectURL(file);
      setThumbnailPreview(newPreview);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(undefined);
    }
  };

  // Cleanup effect for the blob URL
  useEffect(() => {
    // This function will be called when the component unmounts or before the effect runs again.
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]); // The effect depends on thumbnailPreview



  const openDeleteDialog = (courseId: string) => {
    setCourseToDelete(courseId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(`/api/admin/courses/${courseToDelete}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete course';
      toast.error(message);
    } finally {
        setIsDeleteDialogOpen(false);
        setCourseToDelete(null);
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    const { videos, ...courseData } = course;
    form.reset(courseData);
    setThumbnailPreview(course.thumbnail_url || undefined);
    setIsDialogOpen(true);
  };

  const resetDialogState = () => {
    form.reset({
      title: '',
      description: '',
      price: 0,
      difficulty_level: 'Beginner',
      outcomes: '',
      prerequisites: '',
      curriculum: '',
      status: 'draft',
      thumbnail: null,
    });
    setSelectedCourse(null);
    setIsDialogOpen(false);
    setThumbnailFile(null);
    setThumbnailPreview(undefined);
  };

  const openNewDialog = () => {
    resetDialogState();
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Manage <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">Courses</span>
              </h1>
              <p className="text-gray-400 mt-1">Create, update, and manage all courses on the platform.</p>
            </div>
            <Button 
              onClick={openNewDialog} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full py-3 px-6 text-base font-semibold flex items-center gap-2"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Course
            </Button>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-white/20">
                    <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Title</TableHead>
                    <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Price</TableHead>
                    <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Enrollments</TableHead>
                    <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">Loading courses...</TableCell></TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">No courses found.</TableCell></TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course._id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                        <TableCell className="p-4 font-medium text-white">{course.title}</TableCell>
                        <TableCell className="p-4 text-gray-300">PKR {course.price}</TableCell>
                        <TableCell className="p-4 text-gray-300">{course.total_enrollments}</TableCell>
                        <TableCell className="p-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${course.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                            {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 flex justify-end gap-3">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full"><Pencil className="h-5 w-5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(course.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"><Trash2 className="h-5 w-5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isSubmitting && (isOpen ? setIsDialogOpen(true) : resetDialogState())}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white">
          <div className="sticky top-0 z-10 px-8 py-7 flex items-center gap-5 rounded-t-2xl border-b border-white/10 shadow-sm">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-500/10 shadow ring-2 ring-purple-500/20">
              <PlusCircle className="w-8 h-8 text-purple-400" />
            </span>
            <div>
              <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{selectedCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
              <DialogDescription className="text-base text-gray-400">{selectedCourse ? 'Update the details of your course.' : 'Fill in the details to create a new course.'}</DialogDescription>
            </div>
          </div>
          <FormProvider {...form}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-8 px-8 max-h-[70vh] overflow-y-auto bg-transparent custom-scrollbar">
                {/* Form fields with new styling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel className="text-gray-300">Title</FormLabel><FormControl><Input {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="text-gray-300">Description</FormLabel><FormControl><Textarea {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" rows={5} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel className="text-gray-300">Price</FormLabel><FormControl><Input type="number" {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel className="text-gray-300">Thumbnail</FormLabel>
                      <FormControl>
                        <FileUploader onUpload={handleThumbnailChange} value={thumbnailFile ? [thumbnailFile] : []} maxSize={2 * 1024 * 1024} multiple={false} />
                      </FormControl>
                    </FormItem>
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail preview" className="h-40 w-full rounded-lg border-2 border-white/20 shadow-lg object-cover mt-2" />} 
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                  <FormField control={form.control} name="difficulty_level" render={({ field }) => (<FormItem><FormLabel className="text-gray-300">Difficulty</FormLabel><FormControl><select {...field} className="w-full p-2 border rounded-lg bg-gray-800/60 text-white border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></FormControl></FormItem>)} />
                  <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel className="text-gray-300">Status</FormLabel><FormControl><select {...field} className="w-full p-2 border rounded-lg bg-gray-800/60 text-white border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"><option value="draft">Draft</option><option value="active">Active</option></select></FormControl></FormItem>)} />
                  <FormField control={form.control} name="outcomes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-gray-300">Outcomes</FormLabel><FormControl><Textarea {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="prerequisites" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-gray-300">Prerequisites</FormLabel><FormControl><Textarea {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="curriculum" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel className="text-gray-300">Curriculum</FormLabel><FormControl><Textarea {...field} className="bg-gray-800/60 border-gray-700 rounded-lg focus:ring-purple-500 focus:border-purple-500" /></FormControl></FormItem>)} />
                </div>
                <DialogFooter className="pt-6 flex justify-end gap-4 border-t border-white/10">
                  <Button type="button" variant="outline" onClick={resetDialogState} disabled={isSubmitting} className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700 text-gray-300">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg px-8 py-3 hover:scale-105 transform transition-transform">
                    {isSubmitting ? 'Saving...' : (selectedCourse ? 'Save Changes' : 'Create Course')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900/80 backdrop-blur-xl border-red-500/30 text-white rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-red-400">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">This will permanently delete the course. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700 text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="rounded-full bg-red-600 text-white hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
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
  thumbnail: z.any().optional(),
  difficulty_level: z.string().optional(),
  outcomes: z.string().optional(),
  prerequisites: z.string().optional(),
  curriculum: z.string().optional(),
  status: z.string().optional(),
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" /> Add New Course</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : courses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">No courses found.</TableCell></TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>PKR {course.price}</TableCell>
                  <TableCell>{course.total_enrollments}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {course.status === 'active' ? 'Active' : course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(course)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(course.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isSubmitting && (isOpen ? setIsDialogOpen(true) : resetDialogState())}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-background">
          <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md px-8 py-7 flex items-center gap-5 rounded-t-2xl border-b border-border shadow-sm">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted shadow ring-2 ring-primary/10">
              <PlusCircle className="w-8 h-8 text-primary" />
            </span>
            <div>
              <DialogTitle className="text-2xl font-extrabold tracking-tight mb-1 text-foreground">{selectedCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">{selectedCourse ? 'Update the details of your course.' : 'Fill in the details to create a new course.'}</DialogDescription>
            </div>
          </div>
          <FormProvider {...form}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-8 px-8 max-h-[80vh] overflow-y-auto bg-transparent">
                {/* Basic Info Section */}
                <div className="rounded-xl shadow-md bg-card border border-border p-6 mb-2">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <Pencil className="w-5 h-5 text-primary" />
                    </span>
                    <h2 className="text-lg font-bold text-primary tracking-wide">Basic Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Introduction to Programming" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Describe your course" rows={5} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} placeholder="e.g., 99.99" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel>Thumbnail</FormLabel>
                        <FormControl>
                          <FileUploader onUpload={handleThumbnailChange} value={thumbnailFile ? [thumbnailFile] : []} maxSize={2 * 1024 * 1024} multiple={false} />
                        </FormControl>
                      </FormItem>
                      {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail preview" className="h-40 w-full rounded-lg border-2 border-border shadow-lg object-cover mt-2" />}
                    </div>
                  </div>
                </div>
                {/* Divider */}
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Course Details</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {/* Details Section */}
                <div className="rounded-xl shadow-md bg-card border border-border p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                          <PlusCircle className="w-4 h-4 text-primary" />
                        </span>
                        <h3 className="text-md font-semibold text-primary">Level & Status</h3>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel htmlFor="difficulty_level" className="text-right">Difficulty</FormLabel>
                        <FormField control={form.control} name="difficulty_level" render={({ field }) => (
                          <FormControl>
                            <select id="difficulty_level" {...field} className="p-2 border rounded-lg col-span-3 bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/10">
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </FormControl>
                        )} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel htmlFor="status" className="text-right">Status</FormLabel>
                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormControl>
                            <select id="status" {...field} className="p-2 border rounded-lg col-span-3 bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/10">
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                            </select>
                          </FormControl>
                        )} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pink-100 dark:bg-pink-900/20">
                          <PlusCircle className="w-4 h-4 text-pink-600 dark:text-pink-300" />
                        </span>
                        <h3 className="text-md font-semibold text-pink-700 dark:text-pink-300">Outcomes, Prerequisites & Curriculum</h3>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel htmlFor="outcomes" className="text-right">Outcomes</FormLabel>
                        <FormField control={form.control} name="outcomes" render={({ field }) => (
                          <FormControl>
                            <Textarea id="outcomes" {...field} className="col-span-3 rounded-lg border-border focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                          </FormControl>
                        )} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel htmlFor="prerequisites" className="text-right">Prerequisites</FormLabel>
                        <FormField control={form.control} name="prerequisites" render={({ field }) => (
                          <FormControl>
                            <Textarea id="prerequisites" {...field} className="col-span-3 rounded-lg border-border focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                          </FormControl>
                        )} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <FormLabel htmlFor="curriculum" className="text-right">Curriculum</FormLabel>
                        <FormField control={form.control} name="curriculum" render={({ field }) => (
                          <FormControl>
                            <Textarea id="curriculum" {...field} className="col-span-3 rounded-lg border-border focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                          </FormControl>
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-6 flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={resetDialogState} disabled={isSubmitting} className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg px-8 py-3 hover:bg-primary/90">
                    {isSubmitting ? 'Saving...' : (selectedCourse ? 'Save Changes' : 'Create Course')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the course and all its contents. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
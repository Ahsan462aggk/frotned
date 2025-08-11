import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2, Trash2, Pencil, PlayCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// --- Type Definitions ---
interface Course {
  id: string;
  title: string;
}

interface S3UploadData {
  presigned_url: string;
  file_key: string;
  bucket: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string; // This might be legacy, the new URL is in cloudinary_url
  cloudinary_url: string; // The actual S3 URL is here
  public_id: string; // Using public_id to store S3 file_key for compatibility
  course_id: string;
  order: number;
  duration: number;
  is_preview: boolean;
}

// Quiz types can remain as they are, they are not directly related to the S3 change



const ManageVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Partial<Video> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const fetchVideosByCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoadingVideos(true);
    setVideos([]);
    try {
      const response = await fetchWithAuth(`/api/admin/videos?course_id=${courseId}`);
      const data = await handleApiResponse(response) as Video[];
      setVideos(data || []);
    } catch (error: any) {
        console.error("Failed to fetch videos:", error);
        const errorMessage = error.response?.data?.detail || 'Failed to fetch videos for the selected course.';
        toast.error(errorMessage);
    } finally {
      setLoadingVideos(false);
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

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchVideosByCourse(selectedCourseId);
    }
  }, [selectedCourseId, fetchVideosByCourse]);

  const handleOpenModal = (video: Partial<Video> | null = null) => {
    if (video) {
      setCurrentVideo(video);
    } else {
      if (!selectedCourseId) {
        toast.error('Please select a course first to add a video.');
        return;
      }
      const nextOrder = videos.length > 0 ? Math.max(...videos.map(v => v.order)) + 1 : 1;
      setCurrentVideo({ title: '', description: '', course_id: selectedCourseId, order: nextOrder, is_preview: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentVideo(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setVideoDuration(0);
  };

  const handleOpenPreviewModal = async (videoId: string) => {
    if (!videoId) {
      toast.error("Video ID is missing.");
      return;
    }
    try {
      const response = await fetchWithAuth(`/api/admin/videos/${videoId}/view-url`);
      const data = await handleApiResponse(response) as { view_url: string };
      if (data.view_url) {
        setPreviewVideoUrl(data.view_url);
        setIsPreviewModalOpen(true);
      } else {
        toast.error("Could not retrieve video playback URL.");
      }
    } catch (error) {
      console.error("Failed to get video view URL:", error);
      toast.error("Failed to get video playback URL.");
    }
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewVideoUrl(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        setVideoDuration(videoElement.duration);
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      const response = await fetchWithAuth(`/api/admin/videos/${videoId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Video deleted successfully!');
        if (selectedCourseId) fetchVideosByCourse(selectedCourseId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || 'Failed to delete video.');
      }
    } catch (error) {
      toast.error((error as Error).message || 'Failed to delete video.');
    }
  };

  const handleSave = async () => {
    if (!currentVideo || !selectedCourseId) return;

    // For new videos, a file must be selected.
    if (!currentVideo.id && !selectedFile) {
        toast.error("Please select a video file to upload.");
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
        let videoUrl = currentVideo.video_url;
        let fileKey = currentVideo.public_id; // public_id stores the S3 file key

        // If a new file is selected, upload it to S3
        if (selectedFile) {
            // 1. Get pre-signed URL from our backend
            console.log('Data sent to generate-video-upload-signature:', { content_type: selectedFile.type, file_name: selectedFile.name });
            const sigResponse = await fetchWithAuth('/api/admin/generate-video-upload-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { content_type: selectedFile.type, file_name: selectedFile.name }
            });
            
            console.log('Response from generate-video-upload-signature:', sigResponse);
            const s3Data: S3UploadData = await handleApiResponse(sigResponse);

            // 2. Upload file to S3 using the pre-signed URL
            await axios.put(s3Data.presigned_url, selectedFile, {
                headers: { 
                    'Content-Type': selectedFile.type
                },
                onUploadProgress: (progressEvent: any) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            videoUrl = `https://${s3Data.bucket}.s3.amazonaws.com/${s3Data.file_key}`;
            fileKey = s3Data.file_key;
            toast.success('Video uploaded to S3 successfully!');
        }

        // 3. Prepare metadata for our backend
        const videoData = {
            title: currentVideo.title,
            description: currentVideo.description,
            video_url: videoUrl,
            file_key: fileKey, // Match backend schema
            duration: videoDuration,
            is_preview: currentVideo.is_preview,
            order: currentVideo.order || 0, // Match backend schema
        };

        const endpoint = currentVideo.id
            ? `/api/admin/videos/${currentVideo.id}`
            : `/api/admin/courses/${selectedCourseId}/videos`;
        
        const method = currentVideo.id ? 'PUT' : 'POST';

        const response = await fetchWithAuth(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            data: videoData,
        });

        const savedVideo = await handleApiResponse(response) as Video;

        // 4. Update UI
        if (currentVideo.id) {
            setVideos(prev => prev.map(v => v.id === savedVideo.id ? savedVideo : v));
            toast.success('Video updated successfully!');
        } else {
            setVideos(prev => [...prev, savedVideo]);
            toast.success('Video created successfully!');
        }

        handleCloseModal();

    } catch (error) {
        console.error("Failed to save video:", error);
        toast.error('An error occurred during the video process. Please check console for details.');
    } finally {
        setIsUploading(false);
    }
};




  return (
    <DashboardLayout userType="admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Videos</h1>
        <div className="flex items-center space-x-4">
          {loadingCourses ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => handleOpenModal()} disabled={!selectedCourseId}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Video
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingVideos ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">Loading videos...</TableCell></TableRow>
            ) : videos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">No videos found for this course.</TableCell></TableRow>
            ) : (
              videos.sort((a, b) => a.order - b.order).map((video) => (
                <TableRow key={video.id}>
                  <TableCell>{video.order}</TableCell>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>{video.duration ? `${(video.duration / 60).toFixed(2)} mins` : 'N/A'}</TableCell>
                  <TableCell>{video.is_preview ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenPreviewModal(video.id)}><PlayCircle className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(video)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(video.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => !isUploading && (isOpen ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentVideo?.id ? 'Edit Video' : 'Add New Video'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" value={currentVideo?.title || ''} onChange={(e) => setCurrentVideo(v => ({...v, title: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={currentVideo?.description || ''} onChange={(e) => setCurrentVideo(v => ({...v, description: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="order" className="text-right">Order</Label>
                 <Input id="order" type="number" value={currentVideo?.order || 0} onChange={(e) => setCurrentVideo(v => ({...v, order: parseInt(e.target.value) || 0}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_preview" className="text-right">Preview</Label>
                <Checkbox id="is_preview" checked={currentVideo?.is_preview || false} onCheckedChange={(checked) => setCurrentVideo(v => ({...v, is_preview: !!checked }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-file" className="text-right">Video File</Label>
              <Input id="video-file" type="file" accept="video/*" onChange={handleFileChange} className="col-span-3" />
            </div>
            {selectedFile && <p className='text-sm text-center'>New file selected: {selectedFile.name}</p>}
            {isUploading && (
              <div className="col-span-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className='text-center text-sm mt-1'>{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewModalOpen} onOpenChange={(isOpen) => !isOpen && handleClosePreviewModal()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          {previewVideoUrl && (
            <video controls autoPlay src={previewVideoUrl} className="w-full rounded-lg mt-4 max-h-[70vh]">
              Your browser does not support the video tag.
            </video>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreviewModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default ManageVideos;

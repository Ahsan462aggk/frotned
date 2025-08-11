import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Trash2, Pencil, PlayCircle, Video as VideoIcon, UploadCloud, Film } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';

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
                        <div className="flex items-center gap-3">
                            <VideoIcon className="w-10 h-10 text-purple-400"/>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">Manage Videos</h1>
                                <p className="text-gray-400">Add, edit, or delete course videos.</p>
                            </div>
                        </div>
                        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform shadow-lg w-full sm:w-auto">
                            <Plus className="mr-2 h-5 w-5" /> Add New Video
                        </Button>
                    </div>

                    <div className="mb-6 max-w-md">
                        <Select onValueChange={setSelectedCourseId} value={selectedCourseId} disabled={loadingCourses}>
                            <SelectTrigger className="bg-gray-800/70 border-gray-700 focus:border-purple-500 rounded-xl">
                                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course to view videos"} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white rounded-xl">
                                {courses.map(course => <SelectItem key={course.id} value={course.id} className="hover:bg-purple-500/20">{course.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="border-b-purple-500/30 hover:bg-transparent">
                                    <TableHead className="text-purple-300">Order</TableHead>
                                    <TableHead className="text-purple-300">Title</TableHead>
                                    <TableHead className="text-purple-300">Duration</TableHead>
                                    <TableHead className="text-purple-300">Preview</TableHead>
                                    <TableHead className="text-right text-purple-300">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingVideos ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-400" /></TableCell></TableRow>
                                ) : videos.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-gray-500">No videos found. Select a course or add a new video.</TableCell></TableRow>
                                ) : ( videos.sort((a, b) => a.order - b.order).map(video => (
                                    <TableRow key={video.id} className="border-b-gray-800 hover:bg-purple-500/10">
                                        <TableCell>{video.order}</TableCell>
                                        <TableCell className="font-medium text-white">{video.title}</TableCell>
                                        <TableCell>{video.duration ? `${(video.duration / 60).toFixed(2)} mins` : 'N/A'}</TableCell>
                                        <TableCell>{video.is_preview ? <span className="text-green-400">Yes</span> : 'No'}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenPreviewModal(video.id)} className="text-green-400 hover:bg-green-500/20 hover:text-green-300 rounded-full"><PlayCircle className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(video)} className="text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)} className="text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                )))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => !isUploading && (isOpen ? setIsModalOpen(true) : handleCloseModal())}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-2xl rounded-2xl shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text pb-2 flex items-center gap-3"><VideoIcon className="w-8 h-8" />{currentVideo?.id ? 'Edit Video' : 'Add New Video'}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="title" className="text-gray-400">Title</Label><Input id="title" value={currentVideo?.title || ''} onChange={(e) => setCurrentVideo(v => ({...v, title: e.target.value}))} className="bg-gray-800/70 border-gray-700 focus:border-purple-500 mt-2" /></div>
                <div><Label htmlFor="order" className="text-gray-400">Order</Label><Input id="order" type="number" value={currentVideo?.order || 0} onChange={(e) => setCurrentVideo(v => ({...v, order: parseInt(e.target.value) || 0}))} className="bg-gray-800/70 border-gray-700 focus:border-purple-500 mt-2" /></div>
              </div>
              <div><Label htmlFor="description" className="text-gray-400">Description</Label><Textarea id="description" value={currentVideo?.description || ''} onChange={(e) => setCurrentVideo(v => ({...v, description: e.target.value}))} className="bg-gray-800/70 border-gray-700 focus:border-purple-500 mt-2 min-h-[80px]" /></div>
              <div>
                <Label htmlFor="video-file" className="text-gray-400">Video File</Label>
                <div className="mt-2 flex justify-center items-center w-full">
                    <label htmlFor="video-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800/70 hover:bg-gray-800/90">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-gray-400"/>
                            {selectedFile ? <p className="mb-2 text-sm text-pink-400 font-semibold">{selectedFile.name}</p> : <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>}
                            <p className="text-xs text-gray-500">MP4, AVI, MOV (MAX. 500MB)</p>
                        </div>
                        <Input id="video-file" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
              </div>
              {isUploading && <div className="w-full"><Progress value={uploadProgress} className="w-full bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" /><p className='text-center text-sm mt-1 text-gray-400'>{uploadProgress}% uploaded</p></div>}
              <div className="flex items-center space-x-2"><Checkbox id="is_preview" checked={currentVideo?.is_preview || false} onCheckedChange={(checked) => setCurrentVideo(v => ({...v, is_preview: !!checked }))} className="w-5 h-5 border-gray-600 data-[state=checked]:bg-pink-500" /><Label htmlFor="is_preview" className="text-gray-300">Allow this video to be previewed by non-enrolled students</Label></div>
            </div>
            <DialogFooter className="mt-auto pt-4 border-t border-gray-700/50 gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseModal} disabled={isUploading} className="border-gray-700 hover:bg-gray-800">Cancel</Button>
              <Button onClick={handleSave} disabled={isUploading} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform">
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Video'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewModalOpen} onOpenChange={(isOpen) => !isOpen && handleClosePreviewModal()}>
          <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-4xl rounded-2xl shadow-2xl">
            <DialogHeader><DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text flex items-center gap-3"><Film className="w-7 h-7"/> Video Preview</DialogTitle></DialogHeader>
            {previewVideoUrl && <video controls autoPlay src={previewVideoUrl} className="w-full rounded-lg mt-4 max-h-[70vh]">Your browser does not support the video tag.</video>}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageVideos;

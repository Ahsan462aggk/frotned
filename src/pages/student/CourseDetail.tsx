import { useState, useEffect, FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Upload, Play } from 'lucide-react';
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';

// --- INTERFACES ---
interface CourseInfo {
    id: string;
    title: string;
    description: string;
    price: number;
    instructor_name: string;
    image_url: string; // This can be kept for fallback or removed if unused
    sections: {
        id: string;
        title: string;
        videos: { id: string; title: string; }[];
        quizzes: { id:string; title: string; }[];
    }[];
}

interface Video {
    id: string;
    cloudinary_url: string;
    title: string;
    description: string;
    watched: boolean;
}

interface EnrolledCourse {
    id: string;
    title: string;
    instructor?: string;
    progress?: number;
    totalLessons?: number;
    completedLessons?: number;
    thumbnail_url?: string;
    expiration_date?: string;
}

interface EnrollmentFormData {
    first_name: string;
    last_name: string;
    qualification: string;
    ultrasound_experience: string;
    contact_number: string;
    qualification_certificate: File | null;
}

const CourseDetail: FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const enrollmentFormRef = useRef<HTMLDivElement>(null);

    // --- STATE ---
    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormData>({
        first_name: '',
        last_name: '',
        qualification: '',
        ultrasound_experience: '',
        contact_number: '',
        qualification_certificate: null
    });
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [completingVideoId, setCompletingVideoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseAndCheckEnrollment = async () => {
            if (!courseId) {
                setError("Course ID is missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // First check if course is enrolled
                const enrolledResponse = await fetchWithAuth('/api/courses/my-courses');
                const enrolledCourses = await handleApiResponse<EnrolledCourse[]>(enrolledResponse);
                const enrolledCourse = enrolledCourses.find(course => course.id === courseId);
                const isCourseEnrolled = !!enrolledCourse;
                setIsEnrolled(isCourseEnrolled);

                // Try to fetch detailed course info from explore courses
                try {
                    const courseResponse = await fetchWithAuth(`/api/courses/explore-courses/${courseId}`);
                    const courseData = await handleApiResponse<CourseInfo>(courseResponse);
                    setCourse(courseData);
                } catch (exploreError) {
                    // If explore course fetch fails, create a basic course object from enrolled course data
                    if (enrolledCourse) {
                        const basicCourse: CourseInfo = {
                            id: enrolledCourse.id,
                            title: enrolledCourse.title,
                            description: `Course: ${enrolledCourse.title}`,
                            price: 0, // Default price for enrolled courses
                            instructor_name: enrolledCourse.instructor || 'Instructor',
                            image_url: enrolledCourse.thumbnail_url || '',
                            sections: [] // Empty sections for enrolled courses
                        };
                        setCourse(basicCourse);
                    } else {
                        throw new Error('Course not found in enrolled or explore courses');
                    }
                }

            } catch (err) {
                if (err instanceof UnauthorizedError) {
                    navigate('/login');
                } else {
                    setError("Failed to load course details. Please try again later.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseAndCheckEnrollment();
    }, [courseId, navigate]);

    // Auto-scroll to payment section when application is approved
    useEffect(() => {
        // This useEffect is no longer needed as payment form is removed
        // if (applicationStatus === 'APPROVED' && paymentSectionRef.current) {
        //     setTimeout(() => {
        //         paymentSectionRef.current?.scrollIntoView({ 
        //             behavior: 'smooth', 
        //             block: 'start' 
        //         });
        //     }, 500); // Small delay to ensure the component is rendered
        // }
    }, []); // Removed applicationStatus from dependency array

    // Fetch videos when course is enrolled
    useEffect(() => {
        const fetchVideos = async () => {
            if (!courseId || !isEnrolled) return;
            
            setIsLoadingVideos(true);
            try {
                const response = await fetchWithAuth(`/api/courses/my-courses/${courseId}/videos-with-checkpoint`);
                const data = await handleApiResponse<Video[]>(response);
                setVideos(data);
                if (data.length > 0) {
                    setSelectedVideo(data[0]); // Select first video by default
                }
            } catch (error) {
                console.error('Failed to fetch videos:', error);
                toast.error('Failed to load course videos.');
            } finally {
                setIsLoadingVideos(false);
            }
        };

        fetchVideos();
    }, [courseId, isEnrolled]);

    const handleEnroll = () => {
        setShowEnrollmentForm(true);
        
        // Scroll to enrollment form after a short delay to ensure it's rendered
        setTimeout(() => {
            enrollmentFormRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;

        // Validate form
        if (!enrollmentForm.first_name || !enrollmentForm.last_name || !enrollmentForm.qualification || 
            !enrollmentForm.ultrasound_experience || !enrollmentForm.contact_number) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (!enrollmentForm.qualification_certificate) {
            toast.error('Please upload your qualification certificate.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Create form data with required fields
            const formData = new FormData();
            formData.append('first_name', enrollmentForm.first_name);
            formData.append('last_name', enrollmentForm.last_name);
            formData.append('qualification', enrollmentForm.qualification);
            formData.append('ultrasound_experience', enrollmentForm.ultrasound_experience);
            formData.append('contact_number', enrollmentForm.contact_number);
            formData.append('course_id', courseId);
            formData.append('qualification_certificate', enrollmentForm.qualification_certificate);
            
            const response = await fetchWithAuth(`/api/enrollments/apply`, { 
                method: 'POST',
                body: formData,
            });
            await handleApiResponse(response);
            toast.success('Enrollment application submitted successfully!');
            // setApplicationStatus('PENDING'); // This state is no longer needed
            setShowEnrollmentForm(false);
        } catch (error) {
            toast.error('Failed to submit enrollment application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof EnrollmentFormData, value: string | File | null) => {
        setEnrollmentForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleInputChange('qualification_certificate', file);
        }
    };

    const handleVideoPlay = async (video: Video) => {
        // Mark video as completed when played
        if (!video.watched) {
            setCompletingVideoId(video.id);
            try {
                await fetchWithAuth(`/api/courses/videos/${video.id}/complete`, {
                    method: 'POST',
                });
                
                // Update local state to mark video as watched
                setVideos(prevVideos => 
                    prevVideos.map(v => 
                        v.id === video.id ? { ...v, watched: true } : v
                    )
                );
                setSelectedVideo(prev => prev?.id === video.id ? { ...prev, watched: true } : prev);
                
                toast.success('Video marked as completed!');
            } catch (error) {
                console.error('Failed to mark video as completed:', error);
                toast.error('Failed to mark video as completed.');
            } finally {
                setCompletingVideoId(null);
            }
        }
    };

    const handleVideoSelect = (video: Video) => {
        setSelectedVideo(video);
    };

    const handleVideoToggleWatched = async (video: Video) => {
        setCompletingVideoId(video.id);
        try {
            // Use the same endpoint for both watched and unwatched - backend handles the toggle
            await fetchWithAuth(`/api/courses/videos/${video.id}/complete`, {
                method: 'POST',
            });
            
            // Toggle the local state
            const newWatchedState = !video.watched;
            setVideos(prevVideos => 
                prevVideos.map(v => 
                    v.id === video.id ? { ...v, watched: newWatchedState } : v
                )
            );
            setSelectedVideo(prev => prev?.id === video.id ? { ...prev, watched: newWatchedState } : prev);
            
            // Show appropriate success message
            toast.success(newWatchedState ? 'Video marked as completed!' : 'Video marked as unwatched!');
        } catch (error) {
            console.error('Failed to toggle video status:', error);
            toast.error('Failed to update video status.');
        } finally {
            setCompletingVideoId(null);
        }
    };

    // handlePaymentProofSubmit, handlePaymentFileChange, fetchPurchaseInfo, handleShowPaymentForm, handleVideoSelect, handleVideoPlay
    // These functions are no longer needed as payment form is removed

    if (isLoading) {
        return (
            <DashboardLayout userType="student">
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout userType="student">
                <div className="flex flex-col justify-center items-center h-screen">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="mt-4 text-red-500">{error}</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!course) {
        return (
            <DashboardLayout userType="student">
                <div className="text-center py-10">Course not found.</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout userType="student">
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className="w-full h-64 object-cover rounded-t-lg" />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-t-lg">
                                <span className="text-gray-500">No Image Available</span>
                            </div>
                        )}
                        <CardTitle className="text-3xl font-bold mt-4">{course.title}</CardTitle>
                        <CardDescription>Taught by: {course.instructor_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-800">Course Description</h3>
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                            </div>
                        </div>
                        
                        {/* Enrollment Form Section */}
                        {!isEnrolled && (
                            <div className="mt-6" ref={enrollmentFormRef}>
                                {!showEnrollmentForm ? (
                                    <Button onClick={handleEnroll} size="lg" className="w-full">
                                        Enroll Request Application (${course.price})
                                    </Button>
                                ) : (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Enrollment Application</CardTitle>
                                            <CardDescription>Please fill in your details to apply for this course.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="first_name">First Name *</Label>
                                                        <Input
                                                            id="first_name"
                                                            value={enrollmentForm.first_name}
                                                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="last_name">Last Name *</Label>
                                                        <Input
                                                            id="last_name"
                                                            value={enrollmentForm.last_name}
                                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="qualification">Qualification *</Label>
                                                    <Input
                                                        id="qualification"
                                                        value={enrollmentForm.qualification}
                                                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                                                        placeholder="e.g., Bachelor's in Medical Imaging"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="ultrasound_experience">Ultrasound Experience *</Label>
                                                    <Textarea
                                                        id="ultrasound_experience"
                                                        value={enrollmentForm.ultrasound_experience}
                                                        onChange={(e) => handleInputChange('ultrasound_experience', e.target.value)}
                                                        placeholder="Describe your experience with ultrasound technology"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="contact_number">Contact Number *</Label>
                                                    <Input
                                                        id="contact_number"
                                                        value={enrollmentForm.contact_number}
                                                        onChange={(e) => handleInputChange('contact_number', e.target.value)}
                                                        placeholder="+1234567890"
                                                        required
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor="qualification_certificate">Qualification Certificate *</Label>
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            id="qualification_certificate"
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={handleFileChange}
                                                            ref={fileInputRef}
                                                            required
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    {enrollmentForm.qualification_certificate && (
                                                        <p className="text-sm text-green-600 mt-1">
                                                            File selected: {enrollmentForm.qualification_certificate.name}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex space-x-2">
                                                    <Button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="flex-1"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Submitting...
                                                            </>
                                                        ) : (
                                                            'Submit Application'
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setShowEnrollmentForm(false)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Video Player Section - Only show when enrolled */}
                        {isEnrolled && (
                            <div className="mt-8">
                                <h3 className="text-2xl font-bold mb-4">Course Videos</h3>
                                
                                {isLoadingVideos ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p className="text-muted-foreground">Loading course videos...</p>
                                        </div>
                                    </div>
                                ) : videos.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Video Player */}
                                        <div className="lg:col-span-2">
                                            <Card>
                                                <CardContent className="p-0">
                                                    {selectedVideo ? (
                                                        <div>
                                                            <div className="aspect-video bg-black rounded-t-lg">
                                                                <video
                                                                    className="w-full h-full rounded-t-lg"
                                                                    controls
                                                                    controlsList="nodownload"
                                                                    src={selectedVideo.cloudinary_url}
                                                                    poster="https://placehold.co/800x450/000000/FFFFFF?text=Video+Player"
                                                                    onPlay={() => {
                                                                        handleVideoPlay(selectedVideo);
                                                                    }}
                                                                    onError={(e) => {
                                                                        console.error('Video loading error:', e);
                                                                        toast.error('Failed to load video. Please try again.');
                                                                    }}
                                                                >
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            </div>
                                                            <div className="p-4">
                                                                <h4 className="text-xl font-semibold mb-2">{selectedVideo.title}</h4>
                                                                <p className="text-muted-foreground">{selectedVideo.description}</p>
                                                                <div className="flex items-center mt-2">
                                                                    <Badge variant={selectedVideo.watched ? "default" : "secondary"}>
                                                                        {completingVideoId === selectedVideo.id ? (
                                                                            <>
                                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                Marking as completed...
                                                                            </>
                                                                        ) : selectedVideo.watched ? (
                                                                            "Watched"
                                                                        ) : (
                                                                            "Not Watched"
                                                                        )}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-4">
                                                                    <Badge variant={selectedVideo.watched ? "default" : "secondary"}>
                                                                        {completingVideoId === selectedVideo.id ? (
                                                                            <>
                                                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                                                Updating...
                                                                            </>
                                                                        ) : selectedVideo.watched ? (
                                                                            "Watched"
                                                                        ) : (
                                                                            "Not Watched"
                                                                        )}
                                                                    </Badge>
                                                                    
                                                                    <Button
                                                                        onClick={() => handleVideoToggleWatched(selectedVideo)}
                                                                        disabled={completingVideoId === selectedVideo.id}
                                                                        variant={selectedVideo.watched ? "outline" : "default"}
                                                                        size="sm"
                                                                        className={`transition-all duration-300 ${
                                                                            selectedVideo.watched 
                                                                                ? "border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600" 
                                                                                : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl"
                                                                        }`}
                                                                    >
                                                                        {completingVideoId === selectedVideo.id ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Updating...
                                                                            </>
                                                                        ) : selectedVideo.watched ? (
                                                                            <>
                                                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                                Mark as Unwatched
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                                Mark as Watched
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <div className="text-center">
                                                                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                                <p className="text-muted-foreground">Select a video to start learning</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                        
                                        {/* Video List */}
                                        <div className="lg:col-span-1">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Video Lessons</CardTitle>
                                                    <CardDescription>{videos.length} videos available</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                                        {videos.map((video) => (
                                                            <div
                                                                key={video.id}
                                                                onClick={() => {
                                                                    handleVideoSelect(video);
                                                                }}
                                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                                    selectedVideo?.id === video.id
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'bg-muted hover:bg-muted/80'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1">
                                                                        <h5 className="font-medium text-sm line-clamp-2">{video.title}</h5>
                                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                                            {video.description}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Badge 
                                                                            variant={video.watched ? "default" : "secondary"}
                                                                            className="text-xs"
                                                                        >
                                                                            {completingVideoId === video.id ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : video.watched ? (
                                                                                "✓"
                                                                            ) : (
                                                                                "○"
                                                                            )}
                                                                        </Badge>
                                                                        
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleVideoToggleWatched(video);
                                                                            }}
                                                                            disabled={completingVideoId === video.id}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className={`h-6 w-6 p-0 transition-all duration-200 ${
                                                                                video.watched 
                                                                                    ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" 
                                                                                    : "text-green-500 hover:text-green-600 hover:bg-green-50"
                                                                            }`}
                                                                        >
                                                                            {completingVideoId === video.id ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : video.watched ? (
                                                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            ) : (
                                                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center">
                                            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-muted-foreground">No videos available for this course yet.</p>
                                            <p className="text-sm text-muted-foreground mt-1">Check back later for new content.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Course Content Section - Removed */}
                        {/* <div className="mt-8">
                            <h3 className="text-2xl font-bold mb-4">Course Content</h3>
                            {course.sections.map(section => (
                                <div key={section.id} className="mb-4">
                                    <h4 className="text-xl font-semibold">{section.title}</h4>
                                    <ul className="list-disc list-inside ml-4 mt-2">
                                        {section.videos.map(video => <li key={video.id}>{video.title}</li>)}
                                        {section.quizzes.map(quiz => <li key={quiz.id}>{quiz.title} (Quiz)</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div> */}
                    </CardContent>
                </Card>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/courses')}>Back to Courses</Button>
            </div>
        </DashboardLayout>
    );
};

export default CourseDetail;
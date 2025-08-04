import { useState, useEffect, FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Upload, Play, CheckCircle, Circle } from 'lucide-react';
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
    image_url: string;
    sections: {
        id: string;
        title: string;
        videos: { id: string; title: string; }[];
        quizzes: { id: string; title: string; }[];
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

interface ApplicationStatusResponse {
    status: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface PurchaseInfo {
    course_title: string;
    course_price: number;
    bank_accounts: {
        bank_name: string;
        account_name: string;
        account_number: string;
    }[];
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
    const paymentFileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- STATE ---
    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [applicationStatus, setApplicationStatus] = useState<ApplicationStatusResponse['status'] | null>(null);
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
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null);
    const [isLoadingPurchaseInfo, setIsLoadingPurchaseInfo] = useState(false);
    const [paymentSubmitted, setPaymentSubmitted] = useState(false);
    const [paymentPending, setPaymentPending] = useState(false); // new state to track payment review
    
    // Video states
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [completingVideoId, setCompletingVideoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseAndStatus = async () => {
            let paymentStatus = null;
            if (!courseId) {
                setError("Course ID is missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch main course details and status in parallel
                const coursePromise = fetchWithAuth(`/api/courses/explore-courses/${courseId}`);
                
                let statusResponse: ApplicationStatusResponse;
                try {
                    const statusPromise = fetchWithAuth(`/api/courses/my-courses/${courseId}/enrollment-status`);
                    statusResponse = await handleApiResponse<ApplicationStatusResponse>(await statusPromise);
                } catch (statusError) {
                    console.log('Enrollment status endpoint failed, will check enrollment directly');
                    statusResponse = { status: 'NOT_APPLIED' };
                }

                const courseResponse = await handleApiResponse<CourseInfo>(await coursePromise);
                setCourse(courseResponse);
                setApplicationStatus(statusResponse.status);

                // --- Check payment proof status if application is approved or pending review ---
                if (statusResponse.status === 'APPROVED') { // Only check for payment if application is approved
                    try {
                        // This now calls the CORRECT, newly created backend endpoint
                        const paymentStatusRes = await fetchWithAuth(`/api/enrollments/${courseId}/payment-proof/status`);
                        if (paymentStatusRes.ok) {
                            const paymentStatusData = await handleApiResponse<{ status: string }>(paymentStatusRes);
                            if (paymentStatusData.status === 'pending') {
                                setPaymentSubmitted(true);
                                setPaymentPending(true);
                            }
                            // If status is 'approved', isEnrolled state will handle UI, so no special check needed here.
                        } else if (paymentStatusRes.status === 404) {
                            // 404 means no payment proof has been submitted yet, which is not an error.
                            console.log('Payment proof not yet submitted.');
                            setPaymentSubmitted(false);
                            setPaymentPending(false);
                        }
                    } catch (err) {
                        // This will catch network errors or if the application doesn't exist yet.
                        console.error("Could not check payment proof status, assuming it's not submitted.", err);
                        setPaymentSubmitted(false);
                        setPaymentPending(false);
                    }
                }
                // Always check if user is enrolled (for video access) regardless of application status
                try {
                    const enrolledResponse = await fetchWithAuth('/api/courses/my-courses');
                    const enrolledCourses = await handleApiResponse<EnrolledCourse[]>(enrolledResponse);
                    const enrolledCourse = enrolledCourses.find(course => course.id === courseId);
                    const isUserEnrolled = !!enrolledCourse;
                    setIsEnrolled(isUserEnrolled);
                
                    // If user is enrolled but application status is not APPROVED, update the status
                    if (isUserEnrolled && statusResponse.status !== 'APPROVED') {
                        console.log('User is enrolled but status was not APPROVED, updating status');
                        setApplicationStatus('APPROVED');
                    }
                } catch (enrollmentError) {
                    console.error('Failed to check enrollment status:', enrollmentError);
                    // Don't fail the entire request if enrollment check fails
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

        fetchCourseAndStatus();
    }, [courseId, navigate]);

    // Fetch videos when enrolled
    useEffect(() => {
        const fetchVideos = async () => {
            if (!courseId || !isEnrolled) return;
            
            setIsLoadingVideos(true);
            try {
                const response = await fetchWithAuth(`/api/courses/my-courses/${courseId}/videos-with-checkpoint`);
                const data = await handleApiResponse<Video[]>(response);
                setVideos(data);
                if (data.length > 0) {
                    setSelectedVideo(data[0]);
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

    // Autoplay video on selection
    useEffect(() => {
        if (selectedVideo && videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay was prevented by the browser.", error);
            });
        }
    }, [selectedVideo]);

    const handleEnroll = () => {
        setShowEnrollmentForm(true);
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
            setApplicationStatus('PENDING');
            setShowEnrollmentForm(false);
        } catch (error) {
            console.error('Enrollment error:', error);
            if (error instanceof Error) {
                toast.error(`Failed to submit enrollment application: ${error.message}`);
            } else {
                toast.error('Failed to submit enrollment application.');
            }
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

    const handlePaymentProofSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId || !paymentFile) return;

        setIsSubmittingPayment(true);
        
        try {
            const formData = new FormData();
            formData.append('file', paymentFile);
            
            const response = await fetchWithAuth(`/api/enrollments/${courseId}/payment-proof`, { 
                method: 'POST',
                body: formData,
            });

            // Process the response from the POST request, which should now contain the status
            const data = await handleApiResponse<{ status: string; message?: string }>(response);
            toast.success(data.message || 'Payment proof submitted successfully!');

            if (data && data.status === 'pending') {
                setPaymentSubmitted(true);
                setPaymentPending(true);
            } else {
                // Handle cases where status might not be pending or is missing
                // Fallback to an optimistic update, but log a warning
                console.warn('Payment status not returned as pending in POST response. Optimistically updating UI.');
                setPaymentSubmitted(true);
                setPaymentPending(true);
            }

            setShowPaymentForm(false);
            setPaymentFile(null);
        } catch (error) {
            toast.error('Failed to submit payment proof.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentFile(file);
        }
    };

    const fetchPurchaseInfo = async () => {
        if (!courseId) return;
        
        setIsLoadingPurchaseInfo(true);
        try {
            const response = await fetchWithAuth(`/api/enrollments/courses/${courseId}/purchase-info`);
            const data = await handleApiResponse<PurchaseInfo>(response);
            setPurchaseInfo(data);
        } catch (error) {
            toast.error('Failed to load payment information.');
        } finally {
            setIsLoadingPurchaseInfo(false);
        }
    };

    const handleShowPaymentForm = async () => {
        if (!purchaseInfo) {
            await fetchPurchaseInfo();
        }
        setShowPaymentForm(true);
    };

    // Video handling functions
    const handleVideoPlay = async (video: Video) => {
        if (!video.watched) {
            setCompletingVideoId(video.id);
            try {
                await fetchWithAuth(`/api/courses/videos/${video.id}/complete`, {
                    method: 'POST',
                });
                
                setVideos(prevVideos => 
                    prevVideos.map(v => 
                        v.id === video.id ? { ...v, watched: true } : v
                    )
                );
                setSelectedVideo(prev => prev?.id === video.id ? { ...prev, watched: true } : prev);
                
                toast.success('Video marked as completed!', { duration: 2000 });
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
            await fetchWithAuth(`/api/courses/videos/${video.id}/complete`, {
                method: 'POST',
            });
            
            const newWatchedState = !video.watched;
            setVideos(prevVideos => 
                prevVideos.map(v => 
                    v.id === video.id ? { ...v, watched: newWatchedState } : v
                )
            );
            setSelectedVideo(prev => prev?.id === video.id ? { ...prev, watched: newWatchedState } : prev);
            
            toast.success(newWatchedState ? 'Video marked as completed!' : 'Video marked as unwatched!', { duration: 2000 });
        } catch (error) {
            console.error('Failed to toggle video status:', error);
            toast.error('Failed to update video status.');
        } finally {
            setCompletingVideoId(null);
        }
    };

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
                            <h3 className="text-xl font-semibold mb-3 text-foreground">Course Description</h3>
                            <div className="rounded-lg p-4 bg-muted/50 dark:bg-muted/20 border">
                                <p className="leading-relaxed whitespace-pre-wrap text-foreground/80">{course.description}</p>
                            </div>
                        </div>
                        
                        {/* Enrollment Application Section */}
                        {applicationStatus === 'NOT_APPLIED' && !showEnrollmentForm && (
                            <Button onClick={handleEnroll} size="lg" className="w-full">
                                Enroll Request Application (${course.price})
                            </Button>
                        )}
                        
                        {applicationStatus === 'NOT_APPLIED' && showEnrollmentForm && (
                            <Card className="mt-6">
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
                        
                        {applicationStatus === 'PENDING' && (
                            <Card className="mt-6 border-yellow-200 bg-yellow-50">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                                            Application Pending Review
                                        </h3>
                                        <p className="text-yellow-700">
                                            Your enrollment application is currently under review by our admin team. 
                                            You will be notified once your application is approved or rejected.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {applicationStatus === 'APPROVED' && !isEnrolled && !showPaymentForm && !paymentSubmitted && (
                            <div className="text-center">
                                <Card className="mt-6 border-green-200 bg-green-50">
                                    <CardContent className="p-6">
                                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-green-800 mb-2">
                                            Application Approved!
                                        </h3>
                                        <p className="text-green-700 mb-4">
                                            Your enrollment application has been approved. Please submit your payment proof to complete the enrollment.
                                        </p>
                                        <Button 
                                            onClick={handleShowPaymentForm} 
                                            size="lg" 
                                            className="w-full"
                                            disabled={isLoadingPurchaseInfo}
                                        >
                                            {isLoadingPurchaseInfo ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Loading Payment Info...
                                                </>
                                            ) : (
                                                'Submit Payment Proof'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        
                        {applicationStatus === 'APPROVED' && !isEnrolled && showPaymentForm && !paymentSubmitted && (
                            <Card className="mt-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                                    <CardTitle className="flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        Payment Information
                                    </CardTitle>
                                    <CardDescription className="text-green-100">
                                        Please make the payment and upload your proof of payment to complete your enrollment.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {purchaseInfo && (
                                        <div className="mb-8">
                                            {/* Course and Amount Section */}
                                            <div className="bg-white rounded-xl p-6 shadow-md border border-green-200 mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        Course Details
                                                    </h3>
                                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                        ${purchaseInfo.course_price.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-600 font-medium">Course Title:</span>
                                                        <span className="text-gray-800 font-semibold">{purchaseInfo.course_title}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                                        <span className="text-gray-600 font-medium">Total Amount:</span>
                                                        <span className="text-green-700 font-bold text-lg">${purchaseInfo.course_price.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bank Account Details */}
                                            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200">
                                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                    Bank Account Details
                                                </h4>
                                                <div className="space-y-4">
                                                    {purchaseInfo.bank_accounts.map((account, index) => (
                                                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-bold text-blue-800 text-lg">{account.bank_name}</h5>
                                                                        <p className="text-blue-600 text-sm">Bank Account</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                                                    Active
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="bg-white p-4 rounded-lg border border-blue-200">
                                                                    <p className="text-gray-500 text-sm font-medium mb-1">Account Name</p>
                                                                    <p className="text-gray-800 font-semibold">{account.account_name}</p>
                                                                </div>
                                                                <div className="bg-white p-4 rounded-lg border border-blue-200">
                                                                    <p className="text-gray-500 text-sm font-medium mb-1">Account Number</p>
                                                                    <p className="text-gray-800 font-semibold font-mono">{account.account_number}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                <p className="text-yellow-800 text-sm flex items-center gap-2">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                    </svg>
                                                                    Please include your name as reference when making the payment
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Proof Upload Section */}
                                    <div className="bg-white rounded-xl p-6 shadow-md border border-purple-200 mt-6">
                                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload Payment Proof
                                        </h4>
                                        
                                        <form onSubmit={handlePaymentProofSubmit} className="space-y-6">
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-dashed border-purple-300">
                                                <div className="text-center">
                                                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                                        <Upload className="h-8 w-8 text-purple-600" />
                                                    </div>
                                                    <h5 className="text-lg font-semibold text-gray-800 mb-2">Upload Payment Receipt</h5>
                                                    <p className="text-gray-600 mb-4">
                                                        Please upload a screenshot or photo of your payment receipt/confirmation
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <Input
                                                            id="payment_file"
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={handlePaymentFileChange}
                                                            ref={paymentFileInputRef}
                                                            required
                                                            className="max-w-xs"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => paymentFileInputRef.current?.click()}
                                                            className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                                                        >
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Browse
                                                        </Button>
                                                    </div>
                                                    
                                                    {paymentFile && (
                                                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                                                            <p className="text-green-800 text-sm flex items-center gap-2">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                File selected: {paymentFile.name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex space-x-3">
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmittingPayment}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    {isSubmittingPayment ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Submitting Payment Proof...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Submit Payment Proof
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowPaymentForm(false);
                                                        setPaymentFile(null);
                                                    }}
                                                    disabled={isSubmittingPayment}
                                                    className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {applicationStatus === 'REJECTED' && (
                            <Card className="mt-6 border-red-200 bg-red-50">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-red-800 mb-2">
                                            Application Rejected
                                        </h3>
                                        <p className="text-red-700">
                                            Your enrollment application has been rejected. Please contact support for more information.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {(paymentSubmitted || paymentPending) && (
                            <Card className="mt-6 border-green-200 bg-green-50">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-green-800 mb-2">
                                            Payment Proof Submitted!
                                        </h3>
                                        <p className="text-green-700 mb-4">
                                            Your payment proof has been received and is pending admin approval. You will receive an email when your enrollment is approved.
                                        </p>
                                        <div className="bg-white rounded-lg p-4 border border-green-200">
                                            <p className="text-sm text-green-600">
                                                <strong>What happens next?</strong>
                                            </p>
                                            <ul className="text-sm text-green-600 mt-2 space-y-1">
                                                <li>• Admin will verify your payment proof</li>
                                                <li>• You'll receive a confirmation email when approved</li>
                                                <li>• Once approved, you'll have full access to the course</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Video Player Section - Only show when enrolled */}
                        {isEnrolled ? (
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
                                                                    ref={videoRef}
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
                                                            <div className="p-6 bg-background">
                                                                <h4 className="text-2xl font-bold mb-2 text-foreground">{selectedVideo.title}</h4>
                                                                <div className="mt-4 pt-4 border-t border-border/50">
                                                                    <h5 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Description</h5>
                                                                    <p className="text-foreground/80 whitespace-pre-wrap">{selectedVideo.description}</p>
                                                                </div>
                                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
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
                                                            <div className="shop text-center">
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
                                                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 border-transparent ${
                                                                    selectedVideo?.id === video.id
                                                                        ? 'bg-primary/10 border-primary text-primary'
                                                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                                }`}
                                                                onClick={() => handleVideoSelect(video)}
                                                            >
                                                                <Play className={`h-5 w-5 mr-3 flex-shrink-0 transition-colors duration-200 ${selectedVideo?.id === video.id ? 'text-primary' : ''}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-medium text-sm truncate transition-colors duration-200 ${selectedVideo?.id === video.id ? 'text-primary-foreground' : 'text-inherit'}`}>{video.title}</p>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className={`ml-2 flex-shrink-0 px-2 py-1 h-auto text-xs rounded-full transition-all duration-200 ${
                                                                        completingVideoId === video.id
                                                                            ? 'bg-muted text-muted-foreground'
                                                                            : video.watched
                                                                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                                                            : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                                                                    }`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleVideoToggleWatched(video);
                                                                    }}
                                                                    disabled={completingVideoId === video.id}
                                                                >
                                                                    {completingVideoId === video.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : video.watched ? (
                                                                        <>
                                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                                            <span>Watched</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Circle className="h-4 w-4 mr-1" />
                                                                            <span>Unwatched</span>
                                                                        </>
                                                                    )}
                                                                </Button>
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
                        ) : null}
                    </CardContent>
                </Card>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/courses')}>Back to Courses</Button>
            </div>
        </DashboardLayout>
    );
};

export default CourseDetail; 
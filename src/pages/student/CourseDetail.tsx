import { useState, useEffect, FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ClipboardEdit, Loader2, Upload, Send, CheckCircle, Info, AlertCircle, Play, Circle } from 'lucide-react';
import { fetchWithAuth, handleApiResponse, UnauthorizedError } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import '@/styles/video-protection.css';

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

interface PaymentStatusResponse {
    status: 'active' | 'approved';
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

// --- PAYMENT STATUS CARD COMPONENT ---
const PaymentStatusCard: FC<{
    paymentStatus: PaymentStatusResponse['status'];
    onShowPaymentForm: () => void;
    isLoadingPurchaseInfo: boolean;
    courseId: string;
    isEnrolled: boolean;
    setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
    setSelectedVideo: React.Dispatch<React.SetStateAction<Video | null>>;
    setIsLoadingVideos: React.Dispatch<React.SetStateAction<boolean>>;
    videoRef: React.RefObject<HTMLVideoElement>;
    handleVideoPlay: (video: Video) => Promise<void>;
    handleVideoSelect: (video: Video) => void;
    handleVideoToggleWatched: (video: Video) => Promise<void>;
    completingVideoId: string | null;
    videos: Video[];
    selectedVideo: Video | null;
    isLoadingVideos: boolean;
}> = ({
    paymentStatus,
    onShowPaymentForm,
    isLoadingPurchaseInfo,
    courseId,
    isEnrolled,
    setVideos,
    setSelectedVideo,
    setIsLoadingVideos,
    videoRef,
    handleVideoPlay,
    handleVideoSelect,
    handleVideoToggleWatched,
    completingVideoId,
    videos,
    selectedVideo,
    isLoadingVideos
}) => {
    useEffect(() => {
        const fetchVideos = async () => {
            if (!courseId || !isEnrolled || paymentStatus !== 'approved') return;

            setIsLoadingVideos(true);
            try {
                const res = await fetchWithAuth(`/api/courses/my-courses/${courseId}/videos-with-checkpoint`);
                const data = await handleApiResponse<Video[]>(res);
                setVideos(data);
                if (data.length > 0) {
                    setSelectedVideo(data[0]);
                    
                    // Auto-scroll to course videos section when coming from My Courses
                    setTimeout(() => {
                        const videoSection = document.getElementById('course-videos-section');
                        if (videoSection) {
                            videoSection.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        }
                    }, 500); // Small delay to ensure content is rendered
                }
            } catch (error) {
                console.error('Failed to fetch videos:', error);
                toast.error('Failed to load course videos.');
            } finally {
                setIsLoadingVideos(false);
            }
        };

        if (paymentStatus === 'approved') {
            fetchVideos();
        }
    }, [paymentStatus, courseId, isEnrolled, setVideos, setSelectedVideo, setIsLoadingVideos]);

    switch (paymentStatus) {
        case 'active':
            return (
                <Card className="mt-6 border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                                Payment Pending Review
                            </h3>
                            <p className="text-yellow-700 mb-4">
                                Your payment proof has been received and is pending admin approval.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                                <p className="text-sm text-yellow-600">
                                    <strong>What happens next?</strong>
                                </p>
                                <ul className="text-sm text-yellow-600 mt-2 space-y-1">
                                    <li>• Admin will verify your payment proof</li>
                                    <li>• You'll receive a confirmation email when approved</li>
                                    <li>• Once approved, you'll have full access to the course</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'approved':
            return (
                <div className="mt-8" id="course-videos-section">
                    <h3 className="text-2xl font-bold mb-4">Course Videos</h3>
                    
                    {/* Security Information Notice */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-amber-800 mb-2 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                                    </svg>
                                    Video Security Notice
                                </h4>
                                <div className="text-amber-700 space-y-2">
                                    <p className="text-sm leading-relaxed">
                                        <strong>Important:</strong> For security and content protection, the following actions during the entire video session (including when paused) will result in automatic logout:
                                    </p>
                                    <ul className="text-sm space-y-1 ml-4 list-disc">
                                        <li><strong>Switching browser tabs</strong> or minimizing the window</li>
                                        <li><strong>Accessing browser extensions</strong> or moving mouse to extension icons</li>
                                        <li><strong>Clicking outside the browser</strong> or losing focus</li>
                                        <li><strong>Resizing the browser window</strong> significantly</li>
                                    </ul>
                                    <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                                        <p className="text-sm text-red-800 flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                                            </svg>
                                            <span><strong>Security Active:</strong> Tab switching and extension access detection is enabled. Fullscreen mode is fully supported and will not trigger security violations.</span>
                                        </p>
                                    </div>
                                    
                                    {/* Anti-Download Warning */}
                                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <p className="text-sm text-red-800 flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                                            </svg>
                                            <span><strong>Download Protection:</strong> Video downloading, recording, or capturing is strictly prohibited. Violations will result in account suspension and legal action.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {isLoadingVideos ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-muted-foreground">Loading course videos...</p>
                            </div>
                        </div>
                    ) : videos.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardContent className="p-0">
                                        {selectedVideo ? (
                                            <div>
                                                <div className="aspect-video bg-black rounded-t-lg relative">
                                                    <video
                                                        className="w-full h-full rounded-t-lg video-protected"
                                                        controls
                                                        autoPlay
                                                        controlsList="nodownload noremoteplayback noplaybackrate"
                                                        disablePictureInPicture
                                                        disableRemotePlayback
                                                        onContextMenu={(e) => e.preventDefault()}
                                                        onSelectStart={(e) => e.preventDefault()}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        src={selectedVideo.cloudinary_url}
                                                        poster="https://placehold.co/800x450/000000/FFFFFF?text=Video+Player"
                                                        onPlay={(e) => {
                                                            handleVideoPlay(selectedVideo);
                                                            
                                                            // Targeted video security - only tab switching and extension access
                                                            console.log('Video security activated: tab switching and extension access detection');
                                                            
                                                            const videoElement = e.target as HTMLVideoElement;
                                                            let securityActive = true;
                                                            let isEnteringFullscreen = false;
                                                            
                                                            const handleSecurityViolation = async () => {
                                                                if (!securityActive) return; // Prevent multiple triggers
                                                                
                                                                console.warn('Security violation detected - showing warning');
                                                            
                                                                securityActive = false;
                                                                
                                                                // Show immediate security warning popup
                                                                const securityAlert = document.createElement('div');
                                                                securityAlert.style.cssText = `
                                                                    position: fixed;
                                                                    top: 50%;
                                                                    left: 50%;
                                                                    transform: translate(-50%, -50%);
                                                                    background: linear-gradient(135deg, #ef4444, #dc2626);
                                                                    color: white;
                                                                    padding: 30px 40px;
                                                                    border-radius: 15px;
                                                                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                                                                    z-index: 10000;
                                                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                                    font-size: 18px;
                                                                    font-weight: 600;
                                                                    text-align: center;
                                                                    min-width: 400px;
                                                                    border: 3px solid #fca5a5;
                                                                    animation: securityPulse 0.5s ease-in-out;
                                                                `;
                                                                
                                                                securityAlert.innerHTML = `
                                                                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                                                                        <svg style="width: 32px; height: 32px; margin-right: 12px;" fill="currentColor" viewBox="0 0 24 24">
                                                                            <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
                                                                        </svg>
                                                                        <span style="font-size: 24px; font-weight: 700;">SECURITY VIOLATION</span>
                                                                    </div>
                                                                    <div style="margin-bottom: 15px; font-size: 16px; line-height: 1.4;">
                                                                        Unauthorized access attempt detected!<br>
                                                                        You will be logged out for security reasons.
                                                                    </div>
                                                                    <div style="font-size: 14px; opacity: 0.9;">
                                                                        This action has been recorded for security purposes.
                                                                    </div>
                                                                `;
                                                                
                                                                // Add CSS animation
                                                                const style = document.createElement('style');
                                                                style.textContent = `
                                                                    @keyframes securityPulse {
                                                                        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                                                                        50% { transform: translate(-50%, -50%) scale(1.05); }
                                                                        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                                                                    }
                                                                `;
                                                                document.head.appendChild(style);
                                                                document.body.appendChild(securityAlert);
                                                                
                                                                // Show toast as well
                                                                toast.error('Security violation detected! Logging out...', { duration: 3000 });
                                                                
                                                                // Wait 3 seconds before logout
                                                                setTimeout(async () => {
                                                                    // Remove the popup
                                                                    document.body.removeChild(securityAlert);
                                                                    document.head.removeChild(style);
                                                                    
                                                                    try {
                                                                        // Call logout API endpoint
                                                                        await fetchWithAuth('/api/auth/logout', {
                                                                            method: 'POST'
                                                                        });
                                                                        console.log('Logout API called successfully');
                                                                    } catch (error) {
                                                                        console.error('Failed to call logout API:', error);
                                                                    }
                                                                    
                                                                    // Clear authentication data
                                                                    localStorage.removeItem('token');
                                                                    localStorage.removeItem('user');
                                                                    sessionStorage.clear();
                                                                    
                                                                    // Final logout message
                                                                    toast.success('You have been logged out for security reasons.');
                                                                    
                                                                    // Redirect to login
                                                                    setTimeout(() => {
                                                                        window.location.href = '/login';
                                                                    }, 500);
                                                                }, 3000); // 3 second delay
                                                             };

                                                             // 1. Tab switching detection - Active during entire video session (excluding fullscreen mode)
                                                             const handleTabVisibilityChange = () => {
                                                                  // Check if document is in fullscreen mode (any element)
                                                                  const isInFullscreen = !!(document.fullscreenElement || 
                                                                                           (document as any).webkitFullscreenElement || 
                                                                                           (document as any).mozFullScreenElement || 
                                                                                           (document as any).msFullscreenElement);
                                                                  
                                                                  if (securityActive && !videoElement.ended && !isInFullscreen) {
                                                                      if (document.hidden || document.visibilityState === 'hidden') {
                                                                          console.warn('Tab switch detected during video session (not in fullscreen)');
                                                                          handleSecurityViolation();
                                                                      }
                                                                  } else if (isInFullscreen) {
                                                                      console.log('Fullscreen mode detected - security detection disabled');
                                                                  }
                                                              };

                                                             // 2. Extension icon access detection - Active during entire video session (including pause)
                                                             const detectExtensionAccess = () => {
                                                                 if (securityActive && !videoElement.ended) {
                                                                     let extensionAreaHovered = false;
                                                                     let lastMousePosition = { x: 0, y: 0 };
                                                                    
                                                                    // Detect mouse movement to browser extension icon area
                                                                    const handleMouseMove = (e: MouseEvent) => {
                                                                        lastMousePosition = { x: e.clientX, y: e.clientY };
                                                                        
                                                                        // Extension icons are typically in the top-right area of browser
                                                                        // Top 50px and right 150px area where extensions are located
                                                                        const isInExtensionArea = e.clientY < 50 && e.clientX > (window.innerWidth - 150);
                                                                        
                                                                        if (isInExtensionArea && !extensionAreaHovered) {
                                                                            extensionAreaHovered = true;
                                                                            console.warn('Mouse moved to extension icon area - triggering logout');
                                                                            
                                                                            // Immediate logout when mouse enters extension icon area
                                                                            handleSecurityViolation();
                                                                        }
                                                                        
                                                                        // Also detect general toolbar area (broader detection)
                                                                        if (e.clientY < 70 && !isInExtensionArea) {
                                                                            console.warn('Mouse moved to browser toolbar area - immediate logout');
                                                                            // Immediate logout for any toolbar area access
                                                                            handleSecurityViolation();
                                                                        }
                                                                    };
                                                                    
                                                                    // Detect focus loss (when extension popup opens)
                                                                    const handleFocusLoss = () => {
                                                                        if (securityActive && !document.hasFocus()) {
                                                                            console.warn('Focus lost - immediate logout');
                                                                            handleSecurityViolation();
                                                                        }
                                                                    };
                                                                    
                                                                    // Monitor window size changes (extension popups can change window size)
                                                                    const initialWindowSize = { width: window.innerWidth, height: window.innerHeight };
                                                                    const handleWindowResize = () => {
                                                                        if (securityActive) {
                                                                            const widthChange = Math.abs(window.innerWidth - initialWindowSize.width);
                                                                            const heightChange = Math.abs(window.innerHeight - initialWindowSize.height);
                                                                            
                                                                            // If window size changed significantly, immediate logout
                                                                            if (widthChange > 20 || heightChange > 20) {
                                                                                console.warn('Window size changed - immediate logout');
                                                                                handleSecurityViolation();
                                                                            }
                                                                        }
                                                                    };
                                                                    
                                                                    // Add all event listeners
                                                                    document.addEventListener('mousemove', handleMouseMove);
                                                                    window.addEventListener('blur', handleFocusLoss);
                                                                    
                                                                    // Monitor focus changes more aggressively
                                                                     const focusMonitor = setInterval(() => {
                                                                         if (securityActive && !document.hasFocus()) {
                                                                             const wasInExtensionArea = lastMousePosition.y < 70;
                                                                             if (wasInExtensionArea) {
                                                                                 console.warn('Focus monitoring detected extension interaction');
                                                                                 handleSecurityViolation();
                                                                             }
                                                                         }
                                                                     }, 200); // Check every 200ms
                                                                     
                                                                     // Cleanup listeners after 30 seconds
                                                                     setTimeout(() => {
                                                                         document.removeEventListener('mousemove', handleMouseMove);
                                                                         window.removeEventListener('blur', handleFocusLoss);
                                                                         clearInterval(focusMonitor);
                                                                     }, 30000);
                                                                 }
                                                             };

                                                              // Proactive fullscreen detection to prevent false security violations
                                                              const handleFullscreenChange = () => {
                                                                  const isFullscreen = !!(document.fullscreenElement || 
                                                                                         (document as any).webkitFullscreenElement || 
                                                                                         (document as any).mozFullScreenElement || 
                                                                                         (document as any).msFullscreenElement);
                                                                  
                                                                  if (isFullscreen) {
                                                                      console.log('Fullscreen entered - security detection disabled');
                                                                      isEnteringFullscreen = false; // Security can be active in fullscreen
                                                                  } else {
                                                                      console.log('Fullscreen exited - temporarily disabling security detection');
                                                                      isEnteringFullscreen = true;
                                                                      // Reset flag after exit transition
                                                                      setTimeout(() => {
                                                                          isEnteringFullscreen = false;
                                                                          console.log('Fullscreen exit complete - security detection re-enabled');
                                                                      }, 1500);
                                                                  }
                                                              };

                                                             // Detect fullscreen requests proactively (before visibility change)
                                                             const interceptFullscreenRequests = () => {
                                                                 // Override video element fullscreen methods
                                                                 const originalRequestFullscreen = videoElement.requestFullscreen;
                                                                 const originalWebkitRequestFullscreen = (videoElement as any).webkitRequestFullscreen;
                                                                 const originalMozRequestFullScreen = (videoElement as any).mozRequestFullScreen;
                                                                 const originalMsRequestFullscreen = (videoElement as any).msRequestFullscreen;

                                                                 // Intercept standard requestFullscreen
                                                                 if (originalRequestFullscreen) {
                                                                     videoElement.requestFullscreen = function() {
                                                                         console.log('Fullscreen request detected - disabling security for transition');
                                                                         isEnteringFullscreen = true;
                                                                         setTimeout(() => isEnteringFullscreen = false, 3000);
                                                                         return originalRequestFullscreen.call(this);
                                                                     };
                                                                 }

                                                                 // Intercept webkit requestFullscreen
                                                                 if (originalWebkitRequestFullscreen) {
                                                                     (videoElement as any).webkitRequestFullscreen = function() {
                                                                         console.log('Webkit fullscreen request detected - disabling security for transition');
                                                                         isEnteringFullscreen = true;
                                                                         setTimeout(() => isEnteringFullscreen = false, 3000);
                                                                         return originalWebkitRequestFullscreen.call(this);
                                                                     };
                                                                 }

                                                                 // Intercept moz requestFullScreen
                                                                 if (originalMozRequestFullScreen) {
                                                                     (videoElement as any).mozRequestFullScreen = function() {
                                                                         console.log('Moz fullscreen request detected - disabling security for transition');
                                                                         isEnteringFullscreen = true;
                                                                         setTimeout(() => isEnteringFullscreen = false, 3000);
                                                                         return originalMozRequestFullScreen.call(this);
                                                                     };
                                                                 }

                                                                 // Intercept ms requestFullscreen
                                                                 if (originalMsRequestFullscreen) {
                                                                     (videoElement as any).msRequestFullscreen = function() {
                                                                         console.log('MS fullscreen request detected - disabling security for transition');
                                                                         isEnteringFullscreen = true;
                                                                         setTimeout(() => isEnteringFullscreen = false, 3000);
                                                                         return originalMsRequestFullscreen.call(this);
                                                                     };
                                                                 }
                                                             };

                                                             // Set up fullscreen request interception
                                                             interceptFullscreenRequests();

                                                             // Also detect double-click fullscreen attempts
                                                             videoElement.addEventListener('dblclick', () => {
                                                                 console.log('Double-click detected - likely fullscreen request, disabling security');
                                                                 isEnteringFullscreen = true;
                                                                 setTimeout(() => isEnteringFullscreen = false, 3000);
                                                             });

                                                             // Detect F11 key press for fullscreen
                                                             const handleKeyPress = (e: KeyboardEvent) => {
                                                                 if (e.key === 'F11') {
                                                                     console.log('F11 detected - fullscreen request, disabling security');
                                                                     isEnteringFullscreen = true;
                                                                     setTimeout(() => isEnteringFullscreen = false, 3000);
                                                                 }
                                                             };

                                                             // Add event listeners
                                                             document.addEventListener('visibilitychange', handleTabVisibilityChange);
                                                             window.addEventListener('blur', handleTabVisibilityChange);
                                                             document.addEventListener('fullscreenchange', handleFullscreenChange);
                                                             document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
                                                             document.addEventListener('mozfullscreenchange', handleFullscreenChange);
                                                             document.addEventListener('MSFullscreenChange', handleFullscreenChange);
                                                             document.addEventListener('keydown', handleKeyPress);
                                                             
                                                             // Activate extension detection
                                                             detectExtensionAccess();

                                                             // Cleanup function
                                                             const cleanup = () => {
                                                                 console.log('Video security deactivated');
                                                                 securityActive = false;
                                                                 document.removeEventListener('visibilitychange', handleTabVisibilityChange);
                                                                 window.removeEventListener('blur', handleTabVisibilityChange);
                                                                 document.removeEventListener('fullscreenchange', handleFullscreenChange);
                                                                 document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
                                                                 document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
                                                                 document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
                                                                 document.removeEventListener('keydown', handleKeyPress);
                                                                 // Note: Video element event listeners (dblclick) are automatically cleaned up when element is removed
                                                             };

                                                            // Cleanup only on video end (NOT on pause - security stays active during pause)
                                                        
                                                            
                                                            // Cleanup after 10 minutes max
    
                                                        }}
                                                        onPause={() => {
                                                            console.log('Video paused - checkpoint security REMAINS ACTIVE');
                                                        }}
                                                        onEnded={() => {
                                                            console.log('Video ended - checkpoint security deactivated');
                                                        }}
                                                        onError={(e) => {
                                                            console.error('Video loading error:', e);
                                                            toast.error('Failed to load video. Please try again.');
                                                        }}
                                                        onLoadStart={() => {
                                                            // Add referrer policy and other security headers
                                                            const video = document.querySelector('.video-protected') as HTMLVideoElement;
                                                            if (video) {
                                                                video.crossOrigin = 'anonymous';
                                                            }
                                                        }}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                     {/* Overlay to prevent right-click and selection */}
                                                     <div 
                                                         className="absolute inset-0 pointer-events-none"
                                                        style={{ 
                                                            background: 'transparent',
                                                            userSelect: 'none',
                                                            WebkitUserSelect: 'none',
                                                            MozUserSelect: 'none',
                                                            msUserSelect: 'none'
                                                        }}
                                                        onContextMenu={(e) => e.preventDefault()}
                                                        onSelectStart={(e) => e.preventDefault()}
                                                        onDragStart={(e) => e.preventDefault()}
                                                    />
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
                                                <div className="text-center">
                                                    <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                                    <p className="text-muted-foreground">Select a video to start learning</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            
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
            );
        default:
            return (
                <Card className="mt-6 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                        <div className="text-center">
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
                                onClick={onShowPaymentForm}
                                size="lg"
                                className="w-full"
                                disabled={isLoadingPurchaseInfo}
                            >
                                {isLoadingPurchaseInfo ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Submit Payment Proof'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
    }
};

// --- MAIN COMPONENT ---
const CourseDetail: FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const enrollmentFormRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const paymentFileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- STATE ---
    const [course, setCourse] = useState<CourseInfo | null>(null);
    const [applicationStatus, setApplicationStatus] = useState<ApplicationStatusResponse['status'] | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse['status'] | null>(null);
    const paymentFormRef = useRef<HTMLDivElement>(null);
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
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null);
    const [isLoadingPurchaseInfo, setIsLoadingPurchaseInfo] = useState(false);
    
    // Video states
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [completingVideoId, setCompletingVideoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourseAndStatus = async () => {
            if (!courseId) {
                setError("Course ID is missing.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch course details
                const courseRes = await fetchWithAuth(`/api/courses/explore-courses/${courseId}`);
                setCourse(await handleApiResponse(courseRes));

                // Fetch application status
                const statusRes = await fetchWithAuth(`/api/courses/my-courses/${courseId}/enrollment-status`);
                const statusData = await handleApiResponse<ApplicationStatusResponse>(statusRes);
                setApplicationStatus(statusData.status);

                // Fetch payment status if application is approved
                if (statusData.status === 'APPROVED') {
                    try {
                        const paymentStatusRes = await fetchWithAuth(`/api/enrollments/enrollments/${courseId}/payment-proof/status`);
                        const paymentStatusData = await handleApiResponse<PaymentStatusResponse>(paymentStatusRes);
                        setPaymentStatus(paymentStatusData.status);
                    } catch (paymentError) {
                        console.log('No payment proof submitted yet or error fetching status.');
                        setPaymentStatus('PENDING');
                    }

                } else {
                    setPaymentStatus(null); // Reset payment status if application is not approved
                }

                // Check enrollment status
                const enrolledCoursesRes = await fetchWithAuth('/api/courses/my-courses');
                const enrolledCourses = await handleApiResponse<EnrolledCourse[]>(enrolledCoursesRes);
                const isUserEnrolled = enrolledCourses.some((c: EnrolledCourse) => c.id === courseId);
                setIsEnrolled(isUserEnrolled);

            } catch (error) {
                if (error instanceof UnauthorizedError) {
                    toast.error("Session expired. Please log in.");
                    navigate('/auth/login');
                } else if (error instanceof Error) {
                    toast.error(`Failed to load course details: ${error.message}`);
                } else {
                    setError('An unexpected error occurred while loading course details.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourseAndStatus();
    }, [courseId, navigate]);

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

    useEffect(() => {
        if (showEnrollmentForm) {
            setTimeout(() => {
                enrollmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100); // A small delay ensures the element is rendered before scrolling
        }
    }, [showEnrollmentForm]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;

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
            const formData = new FormData();
            formData.append('first_name', enrollmentForm.first_name);
            formData.append('last_name', enrollmentForm.last_name);
            formData.append('qualification', enrollmentForm.qualification);
            formData.append('ultrasound_experience', enrollmentForm.ultrasound_experience);
            formData.append('contact_number', enrollmentForm.contact_number);
            formData.append('course_id', courseId);
            formData.append('qualification_certificate', enrollmentForm.qualification_certificate);
            
            await fetchWithAuth(`/api/enrollments/apply`, { 
                method: 'POST',
                data: formData,
            });
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
            
            const res = await fetchWithAuth(`/api/enrollments/${courseId}/payment-proof`, {
                method: 'POST',
                data: formData,
            });
            await handleApiResponse<{ status: string; message?: string }>(res);
            toast.success('Payment proof submitted successfully!');

            // Re-fetch payment status to ensure UI updates
            try {
                const paymentStatusRes = await fetchWithAuth(`/api/enrollments/enrollments/${courseId}/payment-proof/status`);
                const paymentStatusData = await handleApiResponse<PaymentStatusResponse>(paymentStatusRes);
                setPaymentStatus(paymentStatusData.status);
            } catch (paymentError) {
                console.log('Error re-fetching payment status:', paymentError);
                setPaymentStatus('active'); // Fallback to active (PENDING) if fetch fails
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

    // Advanced Anti-IDM Extension Protection
    useEffect(() => {
        // Store original functions
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest;
        
        // Advanced IDM extension detection and blocking
        const isVideoRequest = (url: string) => {
            const urlLower = url.toLowerCase();
            return urlLower.includes('.mp4') || 
                   urlLower.includes('.webm') || 
                   urlLower.includes('.avi') || 
                   urlLower.includes('.mov') ||
                   urlLower.includes('video') ||
                   urlLower.includes('stream');
        };

        // Create a proxy for video URLs to hide them from IDM extensions
        const createVideoProxy = (originalUrl: string) => {
            // Create a blob URL that acts as a proxy
            return fetch(originalUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            })
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                // Store mapping for cleanup
                (window as any).__videoProxyUrls = (window as any).__videoProxyUrls || new Map();
                (window as any).__videoProxyUrls.set(blobUrl, originalUrl);
                return blobUrl;
            });
        };

        // Override fetch to intercept and obfuscate video requests
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();
            
            if (isVideoRequest(url)) {
                // Add anti-IDM headers and random delays
                const headers = new Headers(init?.headers);
                headers.set('X-Requested-With', 'XMLHttpRequest');
                headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                headers.set('Pragma', 'no-cache');
                headers.set('Expires', '0');
                headers.set('X-Content-Type-Options', 'nosniff');
                headers.set('Referrer-Policy', 'no-referrer');
                headers.set('X-Frame-Options', 'DENY');
                
                // Add random delay to confuse extension timing
                await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
                
                // Make request with obfuscated headers
                const response = await originalFetch(input, {
                    ...init,
                    headers,
                    credentials: 'same-origin',
                    mode: 'cors'
                });
                
                // Clone response to prevent IDM from intercepting the stream
                const clonedResponse = response.clone();
                return clonedResponse;
            }
            
            return originalFetch(input, init);
        };

        // Override XMLHttpRequest to block IDM hooks
        window.XMLHttpRequest = class extends originalXHR {
            private _url: string = '';
            
            open(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
                this._url = url.toString();
                
                if (isVideoRequest(this._url)) {
                    // Add anti-IDM headers for video requests
                    super.open(method, this._url, async, user, password);
                    this.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    this.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    this.setRequestHeader('Pragma', 'no-cache');
                    this.setRequestHeader('X-Content-Type-Options', 'nosniff');
                } else {
                    super.open(method, this._url, async, user, password);
                }
            }
            
            send(body?: Document | XMLHttpRequestBodyInit | null) {
                if (isVideoRequest(this._url)) {
                    // Add random delay for video requests
                    setTimeout(() => super.send(body), Math.random() * 100);
                } else {
                    super.send(body);
                }
            }
        };

        // Detect and counter IDM extension presence
        const detectAndCounterIDM = () => {
            // Check for common IDM extension indicators in the DOM
            const idmIndicators = [
                '[id*="idm"]', '[class*="idm"]', '[data-idm]',
                '[id*="download"]', '[class*="download-manager"]',
                '[id*="internet-download"]', '[class*="internet-download"]'
            ];
            
            const suspiciousElements = document.querySelectorAll(idmIndicators.join(', '));
            
            if (suspiciousElements.length > 0) {
                console.warn('Download manager extension detected - activating enhanced protection');
                
                // Enhanced protection when IDM is detected
                document.body.style.userSelect = 'none';
                document.body.style.webkitUserSelect = 'none';
                
                // Hide all video elements temporarily
                const videos = document.querySelectorAll('video');
                videos.forEach(video => {
                    video.style.visibility = 'hidden';
                    setTimeout(() => {
                        video.style.visibility = 'visible';
                    }, 1000);
                });
                
                // Add fake video elements to confuse the extension
                const fakeVideo = document.createElement('video');
                fakeVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAKttZGF0';
                fakeVideo.style.display = 'none';
                document.body.appendChild(fakeVideo);
                
                // Remove fake element after delay
                setTimeout(() => {
                    document.body.removeChild(fakeVideo);
                }, 5000);
            }
        };

        // Monitor for IDM extension injection
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    detectAndCounterIDM();
                }
            });
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['id', 'class', 'data-idm']
        });

        // Periodically check for IDM extension
        const idmCheckInterval = setInterval(detectAndCounterIDM, 3000);

        // Block common IDM extension communication
        const blockIDMCommunication = () => {
            // Block postMessage communication that IDM might use
            const originalPostMessage = window.postMessage;
            window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
                if (typeof message === 'string' && 
                    (message.includes('idm') || message.includes('download') || message.includes('video'))) {
                    console.warn('Blocked suspicious postMessage:', message);
                    return;
                }
                return originalPostMessage.call(this, message, targetOrigin, transfer);
            };

            // Block localStorage access for IDM-related keys
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key: string, value: string) {
                if (key.toLowerCase().includes('idm') || 
                    key.toLowerCase().includes('download') ||
                    value.toLowerCase().includes('.mp4') ||
                    value.toLowerCase().includes('video')) {
                    console.warn('Blocked suspicious localStorage access:', key);
                    return;
                }
                return originalSetItem.call(this, key, value);
            };
        };

        blockIDMCommunication();

        // Initial detection
        setTimeout(detectAndCounterIDM, 1000);

        // Cleanup function
        return () => {
            window.fetch = originalFetch;
            window.XMLHttpRequest = originalXHR;
            observer.disconnect();
            clearInterval(idmCheckInterval);
            
            // Cleanup proxy URLs
            if ((window as any).__videoProxyUrls) {
                (window as any).__videoProxyUrls.forEach((originalUrl: string, blobUrl: string) => {
                    URL.revokeObjectURL(blobUrl);
                });
                delete (window as any).__videoProxyUrls;
            }
        };
    }, []);

    const fetchPurchaseInfo = async () => {
        if (!courseId) return;
        
        setIsLoadingPurchaseInfo(true);
        try {
            const res = await fetchWithAuth(`/api/enrollments/courses/${courseId}/purchase-info`);
            const data = await handleApiResponse<PurchaseInfo>(res);
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
        setTimeout(() => {
            paymentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100); // A small delay to ensure the element is rendered
    };

    const handleVideoPlay = async (video: Video) => {
        // Add body class for additional protection during video playback
        document.body.classList.add('video-playing');
        
        // Anti-IDM protection: Disable common download manager shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Remove protection after 5 seconds
        setTimeout(() => {
            document.body.classList.remove('video-playing');
            document.removeEventListener('keydown', handleKeyDown);
        }, 5000);
        
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
            <div className="container mx-auto px-6 py-10">
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 overflow-hidden shadow-2xl">
                    <CardHeader className="p-0">
                        <div className="relative w-full h-64 md:h-80">
                            {course.image_url ? (
                                <img src={course.image_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-pink-500/40 flex items-center justify-center">
                                    <span className="text-white/80">No Image Available</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">{course.title}</span>
                                </h1>
                                <p className="text-gray-200/90 mt-1">Taught by: {course.instructor_name}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-3 text-foreground">Course Description</h3>
                            <div className="rounded-lg p-4 bg-muted/50 dark:bg-muted/20 border relative">
                                <p className="leading-relaxed whitespace-pre-wrap text-foreground/80">
                                    {course.description.length > 400 && !isDescriptionExpanded
                                        ? `${course.description.substring(0, 400)}...`
                                        : course.description}
                                </p>
                                {course.description.length > 400 && (
                                    <Button 
                                        variant="link"
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="text-purple-400 hover:text-purple-300 px-0 mt-2 font-semibold"
                                    >
                                        {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {/* Enrollment Application Section */}
                        {applicationStatus === 'NOT_APPLIED' && !showEnrollmentForm && (
                            <Button onClick={handleEnroll} size="lg" className="w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full font-semibold flex items-center justify-center gap-2">
                                <ClipboardEdit className="h-5 w-5" />
                                <span>Enroll Request Application (${course.price})</span>
                            </Button>
                        )}
                        
                        {applicationStatus === 'NOT_APPLIED' && showEnrollmentForm && (
                            <div ref={enrollmentFormRef}>
                            <Card className="mt-8 border-2 border-primary/20 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
                                <CardHeader className="relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                                    Enrollment Application
                                                </CardTitle>
                                                <CardDescription className="text-muted-foreground/80 text-base">
                                                    Join our professional course and advance your career
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/10 rounded-lg border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 pt-0.5">
                                                    <Info className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-200 mb-1">Application Requirements</h4>
                                                    <p className="text-sm text-gray-400">
                                                        Please provide accurate information and upload your qualification certificate. All applications are reviewed within 24-48 hours.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <form onSubmit={handleFormSubmit} className="space-y-6">
                                        {/* Personal Information Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="first_name" className="text-sm font-medium text-foreground flex items-center">
                                                        First Name
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </Label>
                                                    <Input
                                                        id="first_name"
                                                        value={enrollmentForm.first_name}
                                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                        placeholder="Enter your first name"
                                                        className="h-12 border-2 border-border/50 focus:border-primary transition-colors"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="last_name" className="text-sm font-medium text-foreground flex items-center">
                                                        Last Name
                                                        <span className="text-red-500 ml-1">*</span>
                                                    </Label>
                                                    <Input
                                                        id="last_name"
                                                        value={enrollmentForm.last_name}
                                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                        placeholder="Enter your last name"
                                                        className="h-12 border-2 border-border/50 focus:border-primary transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="contact_number" className="text-sm font-medium text-foreground flex items-center">
                                                    Contact Number
                                                    <span className="text-red-500 ml-1">*</span>
                                                </Label>
                                                <Input
                                                    id="contact_number"
                                                    value={enrollmentForm.contact_number}
                                                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                                                    placeholder="e.g., +1 (555) 123-4567"
                                                    className="h-12 border-2 border-border/50 focus:border-primary transition-colors"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Professional Background Section */}
                                        <div className="space-y-4 pt-6 border-t border-border/50">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground">Professional Background</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="qualification" className="text-sm font-medium text-foreground flex items-center">
                                                    Educational Qualification
                                                    <span className="text-red-500 ml-1">*</span>
                                                </Label>
                                                <Input
                                                    id="qualification"
                                                    value={enrollmentForm.qualification}
                                                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                                                    placeholder="e.g., Bachelor's in Medical Imaging, MD, RN, etc."
                                                    className="h-12 border-2 border-border/50 focus:border-primary transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ultrasound_experience" className="text-sm font-medium text-foreground flex items-center">
                                                    Ultrasound Experience
                                                    <span className="text-red-500 ml-1">*</span>
                                                </Label>
                                                <Textarea
                                                    id="ultrasound_experience"
                                                    value={enrollmentForm.ultrasound_experience}
                                                    onChange={(e) => handleInputChange('ultrasound_experience', e.target.value)}
                                                    placeholder="Please describe your experience with ultrasound technology, including years of experience, types of procedures, and relevant training..."
                                                    className="min-h-[120px] border-2 border-border/50 focus:border-primary transition-colors resize-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Document Upload Section */}
                                        <div className="space-y-4 pt-6 border-t border-border/50">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground">Document Upload</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="qualification_certificate" className="text-sm font-medium text-foreground flex items-center">
                                                    Qualification Certificate
                                                    <span className="text-red-500 ml-1">*</span>
                                                </Label>
                                                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 hover:border-primary/50 transition-colors">
                                                    <div className="text-center">
                                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                                        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="border-primary/50 text-primary hover:bg-primary/10"
                                                            >
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Choose File
                                                            </Button>
                                                            <span className="text-sm text-muted-foreground">
                                                                or drag and drop
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            PDF, PNG, JPG up to 10MB
                                                        </p>
                                                    </div>
                                                    <Input
                                                        id="qualification_certificate"
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={handleFileChange}
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        required
                                                    />
                                                </div>
                                                {enrollmentForm.qualification_certificate && (
                                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                                File uploaded successfully
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                            {enrollmentForm.qualification_certificate.name}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 h-12 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-pink-500/30 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-5 w-5" />
                                                        Submit Application
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowEnrollmentForm(false)}
                                                disabled={isSubmitting}
                                                className="h-12 px-8 border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                            </div>
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
                        
                        {applicationStatus === 'APPROVED' && paymentStatus !== null && (
                            <PaymentStatusCard
                                paymentStatus={paymentStatus}
                                onShowPaymentForm={handleShowPaymentForm}
                                isLoadingPurchaseInfo={isLoadingPurchaseInfo}
                                courseId={courseId || ''}
                                isEnrolled={isEnrolled}
                                setVideos={setVideos}
                                setSelectedVideo={setSelectedVideo}
                                setIsLoadingVideos={setIsLoadingVideos}
                                videoRef={videoRef}
                                handleVideoPlay={handleVideoPlay}
                                handleVideoSelect={handleVideoSelect}
                                handleVideoToggleWatched={handleVideoToggleWatched}
                                completingVideoId={completingVideoId}
                                videos={videos}
                                selectedVideo={selectedVideo}
                                isLoadingVideos={isLoadingVideos}
                            />
                        )}
                        
                        {applicationStatus === 'APPROVED' && showPaymentForm && (
                            <Card ref={paymentFormRef} className="mt-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scroll-mt-24">
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
                    </CardContent>
                </Card>
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/student/courses')}>Back to Courses</Button>
            </div>
        </DashboardLayout>
    );
};

export default CourseDetail;
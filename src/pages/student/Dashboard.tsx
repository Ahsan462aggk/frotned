import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download } from "lucide-react";
import { fetchWithAuth, UnauthorizedError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// --- DATA TYPES ---
type AnalyticsData = {
  course_id: string;
  course: {
    title: string;
    description: string;
  };
  videos: {
    total: number;
    watched: number;
  };
  assignments: {
    total: number;
    submitted: number;
  };
  quizzes: {
    total: number;
    attempted: number;
  };
  progress: number;
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const [allAnalytics, setAllAnalytics] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCertificateLoading, setIsCertificateLoading] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const navigate = useNavigate();

  const [userName, setUserName] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.full_name && user.full_name.toLowerCase() !== 'string' ? user.full_name : 'Student';
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch user name if not available
        // Always fetch the latest profile to ensure the name is correct
        try {
          const response = await fetchWithAuth('/api/profile/profile');
          if (response.ok) {
            const data = await response.json();
            if (data.full_name && data.full_name.toLowerCase() !== 'string') {
              setUserName(data.full_name);
              // Also update localStorage for persistence
              const userSession = JSON.parse(localStorage.getItem('user') || '{}');
              userSession.full_name = data.full_name;
              localStorage.setItem('user', JSON.stringify(userSession));
            }
          }
        } catch (profileError) {
            console.warn('Could not fetch user profile name, using existing one.');
        }

        // Fetch all analytics
        const analyticsResponse = await fetchWithAuth('/api/student/dashboard/all-analytics');
        const analyticsData = await analyticsResponse.json();
        setAllAnalytics(analyticsData);

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Could not load your dashboard. Please try again later.");
        if (err instanceof UnauthorizedError) navigate('/login');
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [navigate]);


  const handleGetCertificate = async (courseId: string) => {
    setIsCertificateLoading(prev => ({ ...prev, [courseId]: true }));
    try {
        // 1. Fetch the latest user profile to ensure we have the correct name.
        const profileResponse = await fetchWithAuth('/api/profile/profile');
        if (!profileResponse.ok) {
            throw new Error('Could not fetch user profile.');
        }
        const profileData = await profileResponse.json();
        const studentName = profileData.full_name;

        if (!studentName || typeof studentName !== 'string' || studentName.toLowerCase() === 'string') {
            throw new Error('Invalid student name in profile. Please update your profile.');
        }

        // 2. Request the certificate with the student's name.
        const certResponse = await fetchWithAuth(`/api/courses/courses/${courseId}/certificate?name=${encodeURIComponent(studentName)}`);
        const certData = await certResponse.json();

        if (certResponse.ok && certData.certificate_url) {
            window.open(certData.certificate_url, '_blank');
        } else {
            toast({ title: "Error", description: certData.detail || "Could not generate certificate.", variant: "destructive" });
        }
    } catch (err) {
        console.error("Certificate generation failed", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsCertificateLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="student">
        <div className="flex flex-col justify-center items-center h-[calc(100vh-8rem)]">
          <p className="text-red-500 text-lg">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {userName}!</h1>
        
        {allAnalytics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {allAnalytics.map(analytics => (
              <Card key={analytics.course_id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{analytics.course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <AnalyticsDisplay 
                    analytics={analytics} 
                    onGetCertificate={() => handleGetCertificate(analytics.course_id)}
                    isCertificateLoading={!!isCertificateLoading[analytics.course_id]}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center h-64 flex items-center justify-center bg-muted/20 rounded-lg">
            <p className='text-muted-foreground'>You are not enrolled in any courses yet. Explore our courses to get started!</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

// --- HELPER COMPONENTS ---
const AnalyticsDisplay = ({ analytics, onGetCertificate, isCertificateLoading }: { analytics: AnalyticsData, onGetCertificate: () => void, isCertificateLoading: boolean }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="flex-1 relative">
        {/* Background course name watermark */}
        <span
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          <span className="text-2xl sm:text-4xl font-bold text-gray-300 dark:text-gray-700 opacity-10 tracking-widest mb-2">Course</span>
          <span className="text-4xl sm:text-6xl font-extrabold text-gray-300 dark:text-gray-700 opacity-10 whitespace-nowrap">{analytics.course.title}</span>
        </span>
        {/* Main stats and progress go here (z-10) */}
        <div className="relative z-10">
          {/* Add your stats/progress bars/components here as before */}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {analytics.progress === 100 && (
          <Button onClick={onGetCertificate} disabled={isCertificateLoading}>
            {isCertificateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} 
            Get Certificate
          </Button>
        )}
      </div>
    </div>

    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">Overall Progress</span>
        <span className="text-sm font-bold">{analytics.progress}%</span>
      </div>
      <Progress value={analytics.progress} className="w-full" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Videos Watched" value={`${analytics.videos.watched} / ${analytics.videos.total}`} />
      <StatCard title="Assignments Submitted" value={`${analytics.assignments.submitted} / ${analytics.assignments.total}`} />
      <StatCard title="Quizzes Attempted" value={`${analytics.quizzes.attempted} / ${analytics.quizzes.total}`} />
    </div>
  </div>
);

const StatCard = ({ title, value }: { title: string, value: string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
    <CardContent><p className="text-xl sm:text-2xl font-bold">{value}</p></CardContent>
  </Card>
);

export default Dashboard;

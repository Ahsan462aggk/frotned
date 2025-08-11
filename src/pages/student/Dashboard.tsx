import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-8">Welcome back, {userName}!</h1>
          
          {allAnalytics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {allAnalytics.map(analytics => (
                <div key={analytics.course_id} className="bg-gray-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col">
                  <h2 className="text-2xl font-bold text-white mb-4">{analytics.course.title}</h2>
                  <AnalyticsDisplay 
                    analytics={analytics} 
                    onGetCertificate={() => handleGetCertificate(analytics.course_id)}
                    isCertificateLoading={!!isCertificateLoading[analytics.course_id]}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center h-64 flex items-center justify-center bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl">
              <p className='text-gray-400'>You are not enrolled in any courses yet. Explore our courses to get started!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// --- HELPER COMPONENTS ---
const AnalyticsDisplay = ({ analytics, onGetCertificate, isCertificateLoading }: { analytics: AnalyticsData, onGetCertificate: () => void, isCertificateLoading: boolean }) => (
  <div className="space-y-6 flex flex-col flex-grow">
    <div className="flex-grow space-y-6">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">{analytics.progress}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${analytics.progress}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Videos Watched" value={`${analytics.videos.watched} / ${analytics.videos.total}`} />
        <StatCard title="Assignments Submitted" value={`${analytics.assignments.submitted} / ${analytics.assignments.total}`} />
        <StatCard title="Quizzes Attempted" value={`${analytics.quizzes.attempted} / ${analytics.quizzes.total}`} />
      </div>
    </div>

    <div className="mt-auto pt-4">
      {analytics.progress === 100 && (
        <Button 
          onClick={onGetCertificate} 
          disabled={isCertificateLoading} 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:scale-100"
        >
          {isCertificateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} 
          Get Certificate
        </Button>
      )}
    </div>
  </div>
);

const StatCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-center border border-white/10 shadow-lg">
    <p className="text-sm text-gray-300 font-medium">{title}</p>
    <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">{value}</p>
  </div>
);

export default Dashboard;

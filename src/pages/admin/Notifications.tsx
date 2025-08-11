import { useState, useEffect, FC } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Loader2, ExternalLink, Trash2, CheckCircle2, XCircle, CreditCard, Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  event_type: string;
  details: string;
  timestamp: string;
  course_id: string | null;
}

// Helper to get icon and color based on event type
const getNotificationStyle = (eventType: string) => {
  switch (eventType) {
    case 'enrollment_approved':
      return {
        Icon: CheckCircle2,
        color: 'text-green-500',
        borderColor: 'border-l-green-500',
      };
    case 'enrollment_expired':
      return {
        Icon: XCircle,
        color: 'text-red-500',
        borderColor: 'border-l-red-500',
      };
    case 'payment_proof':
      return {
        Icon: CreditCard,
        color: 'text-blue-500',
        borderColor: 'border-l-blue-500',
      };
    default:
      return {
        Icon: Bell,
        color: 'text-muted-foreground',
        borderColor: 'border-l-gray-500',
      };
  }
};

const AdminNotifications: FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_access_token');
        const response = await fetchWithAuth('https://student-portal-lms-seven.vercel.app/api/admin/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await handleApiResponse<Notification[]>(response);
        setNotifications(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleDeleteNotification = async (id: string) => {
    const originalNotifications = [...notifications];
    // Optimistically remove the notification from the UI
    setNotifications(currentNotifications => currentNotifications.filter(n => n.id !== id));

    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(`https://student-portal-lms-seven.vercel.app/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If the API call fails, revert the UI and show an error
        setNotifications(originalNotifications);
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete notification.' }));
        toast.error(errorData.detail);
      } else {
        toast.success('Notification deleted successfully.');
      }
    } catch (error: any) {      
      // Revert the UI on any exception
      setNotifications(originalNotifications); // Revert UI changes on failure
      toast.error('An unexpected error occurred.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text pb-4 mb-8 flex items-center gap-4">
            <Bell className="w-10 h-10" />
            Notifications
          </h1>

          {loading && (
            <div className="flex justify-center items-center h-[60vh]">
              <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <p className="text-xl font-semibold text-red-400">An Error Occurred</p>
              <p className="text-gray-400">{error}</p>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8">
              <Bell className="h-16 w-16 text-gray-500 mb-6" />
              <p className="text-2xl font-bold text-gray-300">All Caught Up!</p>
              <p className="text-gray-400">You have no new notifications.</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-5">
              {notifications.map((notification) => {
                const { Icon, color, borderColor } = getNotificationStyle(notification.event_type);
                const timestamp = new Date(notification.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                const getProofUrl = (details: string) => {
                  try {
                    const parsed = JSON.parse(details);
                    return parsed.payment_proof_url;
                  } catch (e) { return null; }
                };
                const proofUrl = notification.event_type === 'payment_proof' ? getProofUrl(notification.details) : null;

                                const renderDetail = (label: string, value: string | null) => value && (
                  <div className="bg-gray-800/70 p-3 rounded-lg flex-1 min-w-[200px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => copyToClipboard(value, label)}>
                              {copied === label ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 text-white border-gray-700"><p>Copy {label}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="font-mono text-sm break-all text-gray-200">{value}</p>
                  </div>
                );

                return (
                  <Card key={notification.id} className={cn('overflow-hidden border-l-4 bg-gray-800/60 backdrop-blur-md border-t-0 border-r-0 border-b-0 shadow-lg transition-all hover:shadow-purple-500/10', borderColor)}>
                    <CardHeader className="flex flex-row items-start justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Icon className={cn('h-7 w-7 flex-shrink-0', color)} />
                        <div>
                          <h3 className="text-lg font-semibold text-white">{notification.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                          <p className="text-xs text-gray-400">{timestamp}</p>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-500 transition-colors" onClick={() => handleDeleteNotification(notification.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 text-white border-gray-700"><p>Delete Notification</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 pl-14">
                      <p className="text-gray-300 mb-4">{notification.details.startsWith('{') ? JSON.parse(notification.details).message : notification.details}</p>
                      <div className="flex flex-wrap gap-4">
                        {renderDetail('User ID', notification.user_id)}
                        {renderDetail('Course ID', notification.course_id)}
                      </div>
                    </CardContent>
                    {(proofUrl || (notification.event_type === 'payment_proof' && notification.user_id && notification.course_id)) && (
                      <CardFooter className="flex flex-wrap justify-between items-center bg-gray-900/50 p-4 pl-14 gap-4">
                        {proofUrl && (
                          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-purple-400 hover:text-purple-300 transition-colors gap-2">
                            View Payment Proof <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {notification.event_type === 'payment_proof' && notification.user_id && notification.course_id && (
                          <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:scale-105 transition-transform">
                            <Link to={`/admin/enrollments?userId=${notification.user_id}&courseId=${notification.course_id}`}>
                              Approve Enrollment
                            </Link>
                          </Button>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;

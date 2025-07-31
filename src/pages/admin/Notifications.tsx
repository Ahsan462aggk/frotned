import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Loader2, ExternalLink, Trash2, CheckCircle2, XCircle, CreditCard, Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <DashboardLayout userType="admin">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Bell className="mr-3 h-8 w-8" />
          Notifications
        </h1>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <Card className="bg-destructive/10 border-destructive">
            <CardHeader className="flex flex-row items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>An Error Occurred</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">No New Notifications</h2>
            <p>You're all caught up!</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const { Icon, color, borderColor } = getNotificationStyle(notification.event_type);
              
              const getProofUrl = () => {
                if (notification.event_type === 'payment_proof') {
                  const match = notification.details.match(/Proof image: (https?:\/\/[^\s]+)/);
                  return match ? match[1] : null;
                }
                return null;
              };
              const proofUrl = getProofUrl();

              return (
                <Card key={notification.id} className={`shadow-md hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm border-l-4 ${borderColor}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-6 w-6 ${color}`} />
                        <div>
                          <CardTitle className="capitalize text-lg font-semibold">{notification.event_type.replace(/_/g, ' ')}</CardTitle>
                          <CardDescription>{new Date(notification.timestamp).toLocaleString()}</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteNotification(notification.id)} className="text-muted-foreground hover:text-primary">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm pl-12">
                    <div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{notification.details}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-muted-foreground">User ID</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(notification.user_id, 'User ID')}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy User ID</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="font-mono text-sm break-all">{notification.user_id}</p>
                      </div>
                      {notification.course_id && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Course ID</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(notification.course_id!, 'Course ID')}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy Course ID</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="font-mono text-sm break-all">{notification.course_id}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center bg-muted/50 p-3 pl-12">
                    <div>
                      {proofUrl && (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center font-medium"
                        >
                          View Payment Proof <ExternalLink className="ml-1.5 h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {notification.event_type === 'payment_proof' && notification.user_id && notification.course_id && (
                        <Button asChild size="sm">
                            <Link to={`/admin/enrollments?userId=${notification.user_id}&courseId=${notification.course_id}`}>
                                Approve Enrollment
                            </Link>
                        </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNotifications;

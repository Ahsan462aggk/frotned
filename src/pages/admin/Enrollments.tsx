import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminEnrollments = () => {
  const [searchParams] = useSearchParams();

  // State for Approve Enrollment form
  const [approveUserId, setApproveUserId] = useState('');
  const [approveCourseId, setApproveCourseId] = useState('');
  const [durationMonths, setDurationMonths] = useState('4');
  const [loadingApprove, setLoadingApprove] = useState(false);


  useEffect(() => {
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    if (userId) {
      setApproveUserId(userId);
    }
    if (courseId) {
      setApproveCourseId(courseId);
    }
  }, [searchParams]);

  const handleApproveEnrollment = async () => {
    if (!approveUserId || !approveCourseId || !durationMonths) {
      toast.error('Please fill all fields for approval.');
      return;
    }
    setLoadingApprove(true);
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetchWithAuth(
        `https://student-portal-lms-seven.vercel.app/api/admin/enrollments/approve?user_id=${approveUserId}&course_id=${approveCourseId}&duration_months=${durationMonths}`,
        { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await handleApiResponse(response);
      toast.success(result.detail || 'Enrollment approved successfully!');
      // Clear fields on success
      setApproveUserId('');
      setApproveCourseId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve enrollment.');
    } finally {
      setLoadingApprove(false);
    }
  };


  return (
    <DashboardLayout userType="admin">
      <div className="flex flex-col items-center min-h-screen p-6">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Manage Enrollments</h1>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Approve Enrollment Card */}
              <Card>
            <CardHeader>
              <CardTitle>Approve Enrollment</CardTitle>
              <CardDescription>Manually approve a student's enrollment for a course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approve-user-id">User ID</Label>
                <Input
                  id="approve-user-id"
                  placeholder="Enter user ID"
                  value={approveUserId}
                  onChange={(e) => setApproveUserId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approve-course-id">Course ID</Label>
                <Input
                  id="approve-course-id"
                  placeholder="Enter course ID"
                  value={approveCourseId}
                  onChange={(e) => setApproveCourseId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Enter duration in months"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleApproveEnrollment} disabled={loadingApprove}>
                {loadingApprove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve Enrollment
              </Button>
            </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEnrollments;

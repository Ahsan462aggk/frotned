import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';

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
      const result = await handleApiResponse(response) as { detail?: string };
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
      <div className="relative p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight">
              Manage <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">Enrollments</span>
            </h1>
            <p className="text-gray-400 mt-2">Manually approve student enrollments for courses.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 sm:p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleApproveEnrollment(); }} className="space-y-6">
              <div>
                <Label htmlFor="approve-user-id" className="text-sm font-medium text-gray-300">User ID</Label>
                <Input
                  id="approve-user-id"
                  placeholder="Enter user ID"
                  value={approveUserId}
                  onChange={(e) => setApproveUserId(e.target.value)}
                  className="mt-2 w-full bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
              <div>
                <Label htmlFor="approve-course-id" className="text-sm font-medium text-gray-300">Course ID</Label>
                <Input
                  id="approve-course-id"
                  placeholder="Enter course ID"
                  value={approveCourseId}
                  onChange={(e) => setApproveCourseId(e.target.value)}
                  className="mt-2 w-full bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-300">Duration (Months)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Enter duration in months"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="mt-2 w-full bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-lg py-3 text-base font-semibold" disabled={loadingApprove}>
                {loadingApprove ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Approve Enrollment'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEnrollments;

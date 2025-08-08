import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { fetchWithAuth, handleApiResponse } from "@/lib/api";

interface DashboardStats {
  total_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  recent_enrollments: number;
  total_revenue: number;
  completion_rate: number;
  last_updated: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth(
          "https://student-portal-lms-seven.vercel.app/api/admin/dashboard/stats"
        );
        const data = await handleApiResponse<DashboardStats>(response);
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout userType="admin">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Admin Dashboard</h1>
        {loading && (
          <div className="mt-6 text-gray-500">Loading stats...</div>
        )}
        {error && (
          <div className="mt-6 text-red-600 font-medium">
            {error}
            {error.includes('504') || error.toLowerCase().includes('timeout') ? (
              <div className="mt-2 text-sm text-red-400">
                The dashboard service is currently unavailable or taking too long to respond.<br />
                <ul className="list-disc pl-5 mt-1">
                  <li>Try again in a few minutes.</li>
                  <li>If the problem persists, contact the backend/server team.</li>
                  <li>Check your internet connection.</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}
        {stats && !loading && !error && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Total Courses</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_courses !== undefined ? stats.total_courses : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Total Enrollments</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_enrollments !== undefined ? stats.total_enrollments : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Active Enrollments</div>
              <div className="text-2xl font-bold text-blue-600">{stats.active_enrollments !== undefined ? stats.active_enrollments : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Recent Enrollments</div>
              <div className="text-2xl font-bold text-blue-600">{stats.recent_enrollments !== undefined ? stats.recent_enrollments : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Total Revenue</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_revenue !== undefined ? `$${stats.total_revenue}` : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm">Completion Rate</div>
              <div className="text-2xl font-bold text-blue-600">{stats.completion_rate !== undefined ? `${stats.completion_rate}%` : 'N/A'}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 md:col-span-2 lg:col-span-3">
              <div className="text-gray-600 text-sm">Last Updated</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.last_updated ? new Date(stats.last_updated).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', ' at') : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

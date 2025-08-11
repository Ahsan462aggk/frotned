import { useEffect, useState, FC, ReactNode } from 'react';
import { BookCopy, Users, DollarSign, BadgeCheck, Activity, UserPlus, Clock, AlertTriangle, Loader } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface DashboardStats {
  total_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  recent_enrollments: number;
  total_revenue: number;
  completion_rate: number;
  last_updated: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  details?: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, color, details }) => (
  <div className="relative group overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-md border border-purple-500/20 shadow-lg transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 hover:border-purple-500/50">
    <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
    <div className="p-6 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-300 tracking-wider uppercase">{title}</div>
        <div className="text-white/70 group-hover:scale-125 group-hover:text-white transition-all duration-300">{icon}</div>
      </div>
      <div className="mt-4 text-5xl font-bold text-white tracking-tighter bg-gradient-to-r ${color} text-transparent bg-clip-text">{value}</div>
      {details && <div className="mt-2 text-sm text-gray-400 tracking-wide">{details}</div>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/admin/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900/50 border border-red-500/30 text-red-300 p-6 rounded-2xl flex flex-col items-center justify-center h-64 shadow-lg">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Stats</h2>
          <p className="text-red-300 text-center">{error}</p>
        </div>
      );
    }

    if (stats) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value={`$${stats.total_revenue.toLocaleString()}`} icon={<DollarSign size={28} />} color="from-green-400 to-teal-500" />
          <StatCard title="Total Enrollments" value={stats.total_enrollments.toLocaleString()} icon={<Users size={28} />} color="from-blue-400 to-indigo-500" />
          <StatCard title="Total Courses" value={stats.total_courses.toLocaleString()} icon={<BookCopy size={28} />} color="from-purple-400 to-pink-500" />
          <StatCard title="Completion Rate" value={`${stats.completion_rate}%`} icon={<BadgeCheck size={28} />} color="from-yellow-400 to-orange-500" />
          <StatCard title="Active Enrollments" value={stats.active_enrollments.toLocaleString()} icon={<Activity size={28} />} color="from-red-400 to-pink-500" />
          <StatCard title="New This Month" value={stats.recent_enrollments.toLocaleString()} icon={<UserPlus size={28} />} color="from-cyan-400 to-light-blue-500" />
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <StatCard 
              title="Last Updated" 
              value={new Date(stats.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              icon={<Clock size={28} />} 
              color="from-gray-400 to-gray-500"
              details={new Date(stats.last_updated).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-600 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="bg-gray-900/50 backdrop-blur-lg border border-purple-500/20 shadow-2xl rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <Activity className="w-10 h-10 text-purple-400"/>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400">Real-time insights into your platform's performance.</p>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

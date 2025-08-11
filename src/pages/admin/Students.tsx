
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Download, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Student {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  last_active?: string;
  created_at?: string;
}

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('admin_access_token');
        const response = await fetchWithAuth(
          "https://student-portal-lms-seven.vercel.app/api/admin/users",
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        setStudents(data);
        setFilteredStudents(data);
      } catch (err: any) {
        setError(err.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = [...students];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student => 
        student.email.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term)
      );
    }

    // Apply tab filter
    if (activeTab === "active") {
      result = result.filter(student => student.is_active);
    } else if (activeTab === "inactive") {
      result = result.filter(student => !student.is_active);
    }

    setFilteredStudents(result);
  }, [searchTerm, activeTab, students]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout userType="admin">
      <div className="relative p-4 sm:p-6 lg:p-8 bg-gray-900 min-h-screen text-white">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Manage <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">Students</span>
              </h1>
              <p className="text-gray-400 mt-1">Search, filter, and manage all students on the platform.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-gray-800/60 border border-gray-700 rounded-full p-1">
                    <TabsTrigger value="all" className="px-4 py-1.5 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300">All</TabsTrigger>
                    <TabsTrigger value="active" className="px-4 py-1.5 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300">Active</TabsTrigger>
                    <TabsTrigger value="inactive" className="px-4 py-1.5 rounded-full data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300">Inactive</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full md:w-auto md:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search by email or ID..."
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 rounded-full focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>
            ) : error ? (
              <div className="p-8 text-center text-red-400"><p>{error}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b border-white/20">
                      <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Student</TableHead>
                      <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Email</TableHead>
                      <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Role</TableHead>
                      <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                       <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">No students found.</TableCell></TableRow>
                    ) : ( 
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                          <TableCell className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-white/20">
                                <AvatarFallback className="bg-purple-500/20 text-purple-300 font-bold">{getInitials(student.email)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-white">{student.email.split('@')[0]}</div>
                                <div className="text-xs text-gray-400">ID: {student.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="p-4 text-gray-300">{student.email}</TableCell>
                          <TableCell className="p-4 text-gray-300">{student.role.charAt(0).toUpperCase() + student.role.slice(1)}</TableCell>
                          <TableCell className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                                <DropdownMenuItem className="hover:bg-gray-700">View Details</DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-gray-700">Deactivate</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;

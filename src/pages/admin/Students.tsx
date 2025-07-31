
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Mail, Eye, MoreHorizontal, User, UserCheck, UserX, Clock, Filter, Download, Plus, Loader2, Users } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

    // Apply status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter(student => student.is_active === isActive);
    }

    // Apply tab filter
    if (activeTab === "active") {
      result = result.filter(student => student.is_active);
    } else if (activeTab === "inactive") {
      result = result.filter(student => !student.is_active);
    }

    setFilteredStudents(result);
  }, [searchTerm, statusFilter, activeTab, students]);

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">
              Manage and monitor student accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            
          </div>
        </div>

        <Card>
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <Tabs 
                defaultValue="all" 
                onValueChange={setActiveTab}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="inactive" className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Inactive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center text-destructive">
                <p>{error}</p>
                <Button variant="ghost" onClick={() => window.location.reload()} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No students found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="group">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(student.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {student.email.split('@')[0]}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {student.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.is_active)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.role.charAt(0).toUpperCase() + student.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;

import { useEffect, useState, FC } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { Loader2, CheckCircle, XCircle, User, Book, Phone, Award, Briefcase, FileText, ExternalLink } from 'lucide-react';

interface Application {
    id: string;
    user: { name: string; email: string };
    course: { title: string };
    status: 'pending' | 'approved' | 'rejected';
    qualification: string;
    qualification_certificate_url: string;
    contact_number: string;
    ultrasound_experience: string;
}

const AdminApplications: FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const { toast } = useToast();

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const data = await fetchWithAuth('/api/admin/enrollment-applications').then(res => handleApiResponse(res)) as Application[];
            setApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications', error);
            toast({ title: 'Error', description: 'Could not load applications.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleUpdateStatus = async (applicationId: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            await fetchWithAuth(`/api/admin/enrollment-applications/${applicationId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                data: { status, rejection_reason: reason },
            });
            toast({ title: 'Success', description: `Application has been ${status}.` });
            fetchApplications(); // Refresh the list
        } catch (error) {
            console.error('Failed to update status', error);
            toast({ title: 'Error', description: 'Failed to update application status.', variant: 'destructive' });
        }
    };

    const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">Approved</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300">Rejected</span>;
            default:
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300">Pending</span>;
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
                <div className="max-w-7xl mx-auto relative z-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-8">
                        Enrollment <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">Applications</span>
                    </h1>
                    <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-purple-500" /></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="w-full">
                                        <TableHeader>
                                            <TableRow className="border-b border-white/20">
                                                <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Student</TableHead>
                                                <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Course</TableHead>
                                                <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider">Status</TableHead>
                                                <TableHead className="p-4 text-sm font-semibold text-gray-300 uppercase tracking-wider text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {applications.map((app) => (
                                                <TableRow key={app.id} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                                                    <TableCell className="p-4 font-medium text-white">{app.user.name}</TableCell>
                                                    <TableCell className="p-4 text-gray-300">{app.course.title}</TableCell>
                                                    <TableCell className="p-4">{getStatusBadge(app.status)}</TableCell>
                                                    <TableCell className="p-4 text-right space-x-2">
                                                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => setSelectedApplication(app)}>View</Button>
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <Button size="sm" className="bg-green-500/80 hover:bg-green-500/100 text-white" onClick={() => handleUpdateStatus(app.id, 'approved')}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                                                <Dialog>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="destructive" size="sm" className="bg-red-500/80 hover:bg-red-500/100"><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="bg-gray-800/80 backdrop-blur-md border-gray-700 text-white">
                                                                        <DialogHeader>
                                                                            <DialogTitle className="text-2xl bg-gradient-to-r from-red-500 to-pink-500 text-transparent bg-clip-text">Reject Application</DialogTitle>
                                                                        </DialogHeader>
                                                                        <Textarea placeholder="Provide a reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="bg-gray-900/70 border-gray-600 text-white placeholder:text-gray-500 rounded-lg" />
                                                                        <DialogFooter>
                                                                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700" onClick={() => handleUpdateStatus(app.id, 'rejected', rejectionReason)}>Confirm Rejection</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {selectedApplication && (
                    <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
                        <DialogContent className="bg-gray-900/80 backdrop-blur-xl border-purple-500/30 text-white max-w-3xl rounded-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text pb-2 flex items-center gap-3">
                                    <FileText className="w-8 h-8" />
                                    Application Details
                                </DialogTitle>
                            </DialogHeader>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-lg">
                                {/* Column 1 */}
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <User className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Student</p>
                                            <p className="text-white font-medium">{selectedApplication.user.name}</p>
                                            <p className="text-gray-400 text-sm">{selectedApplication.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Book className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Course</p>
                                            <p className="text-white font-medium">{selectedApplication.course.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Contact Number</p>
                                            <p className="text-white font-medium">{selectedApplication.contact_number}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Column 2 */}
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <Award className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Qualification</p>
                                            <p className="text-white font-medium">{selectedApplication.qualification}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Briefcase className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Ultrasound Experience</p>
                                            <p className="text-white font-medium">{selectedApplication.ultrasound_experience}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <FileText className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400 text-sm">Qualification Certificate</p>
                                            <a href={selectedApplication.qualification_certificate_url} target="_blank" rel="noopener noreferrer" 
                                               className="text-purple-400 hover:text-purple-300 font-medium underline flex items-center gap-2 transition-colors">
                                                View Certificate <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminApplications;

import { useEffect, useState, FC } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithAuth, handleApiResponse } from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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

    return (
        <DashboardLayout userType="admin">
            <Card>
                <CardHeader>
                    <CardTitle>Enrollment Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.id}>
                                        <TableCell>{app.user.name}</TableCell>
                                        <TableCell>{app.course.title}</TableCell>
                                        <TableCell>{app.status}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>View</Button>
                                            {app.status === 'pending' && (
                                                <>
                                                    <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'approved')}><CheckCircle className="h-4 w-4 mr-2"/>Approve</Button>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" size="sm"><XCircle className="h-4 w-4 mr-2"/>Reject</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Reject Application</DialogTitle>
                                                            </DialogHeader>
                                                            <Textarea placeholder="Provide a reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                                                            <DialogFooter>
                                                                <Button variant="destructive" onClick={() => handleUpdateStatus(app.id, 'rejected', rejectionReason)}>Confirm Rejection</Button>
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
                    )}
                </CardContent>
            </Card>

            {selectedApplication && (
                <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        <div>
                            <p><strong>Student:</strong> {selectedApplication.user.name} ({selectedApplication.user.email})</p>
                            <p><strong>Course:</strong> {selectedApplication.course.title}</p>
                            <p><strong>Contact:</strong> {selectedApplication.contact_number}</p>
                            <p><strong>Qualification:</strong> {selectedApplication.qualification}</p>
                            <p><strong>Experience:</strong> {selectedApplication.ultrasound_experience}</p>
                            <p><strong>Certificate:</strong> <a href={selectedApplication.qualification_certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Certificate</a></p>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </DashboardLayout>
    );
};

export default AdminApplications;

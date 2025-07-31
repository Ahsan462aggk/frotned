import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { fetchWithAuth, UnauthorizedError } from '@/lib/api';

const EnrollmentApplication: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        qualification: '',
        ultrasound_experience: '',
        contact_number: '',
    });
    const [certificate, setCertificate] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCertificate(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certificate) {
            toast({ title: 'Error', description: 'Please upload your qualification certificate.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Step 1: Upload the certificate to the backend
            const uploadFormData = new FormData();
            uploadFormData.append('file', certificate);

            const uploadResponse = await fetchWithAuth('/api/uploads/certificate', {
                method: 'POST',
                body: uploadFormData,
            });
            const uploadData = await uploadResponse.json();
            const certificateUrl = uploadData.file_url; // Corrected to use file_url from the new endpoint

            // Step 2: Submit the application with the returned URL
            const applicationPayload = {
                ...formData,
                course_id: courseId!,
                qualification_certificate_url: certificateUrl,
            };

            await fetchWithAuth('/api/enrollments/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(applicationPayload),
            });

            toast({
                title: 'Success',
                description: 'Your application has been submitted successfully. You will be notified once it is reviewed.',
            });

            navigate(`/student/courses/${courseId}`);
        } catch (error) {
            console.error('Application submission error:', error);
            let errorMessage = 'Failed to submit application. Please try again.';
            if (error instanceof UnauthorizedError) {
                errorMessage = 'Session expired. Please log in again.';
                navigate('/login');
            } else if (error instanceof Error) {
                // Attempt to parse a JSON error response if possible
                try {
                    const errJson = JSON.parse(error.message);
                    if (errJson.detail) {
                        errorMessage = errJson.detail;
                    }
                } catch (e) {
                    // Not a JSON error, use the generic message
                }
            }
            
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Enrollment Application</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleInputChange} required />
                        <Input name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleInputChange} required />
                        <Input name="qualification" placeholder="Qualification (e.g., MBBS, FCPS)" value={formData.qualification} onChange={handleInputChange} required />
                        <Textarea name="ultrasound_experience" placeholder="Describe your ultrasound experience (if any)" value={formData.ultrasound_experience} onChange={handleInputChange} />
                        <Input name="contact_number" placeholder="Contact Number" value={formData.contact_number} onChange={handleInputChange} required />
                        <div>
                            <label htmlFor="certificate" className="block text-sm font-medium text-gray-700">Qualification Certificate</label>
                            <Input id="certificate" name="certificate" type="file" onChange={handleFileChange} required className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">Please upload your certificate (PDF, JPG, PNG).</p>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default EnrollmentApplication;

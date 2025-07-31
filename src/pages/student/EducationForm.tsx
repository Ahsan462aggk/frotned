import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface EducationFormProps {
  courseId: string;
  onSuccess: () => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ courseId, onSuccess }) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [qualification, setQualification] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [ultrasoundExperience, setUltrasoundExperience] = useState('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('qualification', qualification);
      formData.append('contact_number', contactNumber);
      if (ultrasoundExperience) {
        formData.append('ultrasound_experience', ultrasoundExperience);
      }
      if (certificate) {
        formData.append('certificate', certificate);
      } else {
        setError('Certificate is required.');
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/apply/${courseId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to submit education details.');
      }
      toast({ title: 'Success', description: 'Education details submitted. Your application is pending approval.' });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
      toast({ title: 'Error', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 p-4 border rounded-lg bg-muted/10 mb-6" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold mb-2">Education & Enrollment Details</h3>
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="qualification">Qualification</Label>
        <Input id="qualification" value={qualification} onChange={e => setQualification(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="contactNumber">Contact Number</Label>
        <Input id="contactNumber" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="ultrasoundExperience">Ultrasound Experience (optional)</Label>
        <Input id="ultrasoundExperience" value={ultrasoundExperience} onChange={e => setUltrasoundExperience(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="certificate">Qualification Certificate (PDF/JPG/PNG)</Label>
        <Input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCertificate(e.target.files?.[0] || null)} required />
      </div>
      {error && <div className="text-destructive text-sm">{error}</div>}
      <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Education Details'}</Button>
    </form>
  );
};

export default EducationForm;

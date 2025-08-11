import { useEffect, useState, ChangeEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, handleApiResponse } from "@/lib/api";

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  course_title: string;
  submission?: {
    file_url: string;
    submitted_at: string;
    grade: number | null;
  };
}

const AssignmentDetailPage = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssignmentDetail = async () => {
      if (!courseId || !assignmentId) return;
      setIsLoading(true);
      try {
        const res = await fetchWithAuth(`/api/student/assignments/courses/${courseId}/assignments/${assignmentId}`);
        setAssignment(await handleApiResponse(res));
      } catch (err: any) {
        setError(err.message || "Could not fetch assignment details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignmentDetail();
  }, [courseId, assignmentId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !courseId || !assignmentId) {
      toast({ title: "Submission Error", description: "Please select a file to submit.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetchWithAuth(`/api/student/assignments/courses/${courseId}/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        data: formData,
      });
      const data: { detail: string } = await handleApiResponse(res);
      toast({ title: "Success", description: data.detail || "Assignment submitted successfully." });
      navigate('/student/assignments');
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assignment) {
    return (
      <DashboardLayout userType="student">
        <div className="flex items-center justify-center h-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to load assignment</h2>
            <p className="text-gray-400">{error || "The assignment could not be found."}</p>
            <Link to="/student/assignments">
              <Button variant="outline" className="mt-6 bg-transparent border-purple-500 hover:bg-purple-500/10 text-purple-400 hover:text-white transition-colors">
                Back to Assignments
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
    submitted: { label: "Submitted", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    graded: { label: "Graded", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  };

  return (
    <DashboardLayout userType="student">
      <div className="relative px-4 py-6 md:px-6 text-white min-h-full overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-pink-900 to-transparent opacity-20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/student/assignments" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors mb-4 text-sm font-medium">
              &larr; Back to All Assignments
            </Link>
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                  {assignment.title}
                </h1>
                <p className="text-lg text-gray-400">{assignment.course_title}</p>
              </div>
              <div className="flex-shrink-0 mt-2 md:mt-0">
                <Badge variant="outline" className={`capitalize text-sm font-semibold px-3 py-1.5 ${statusConfig[assignment.status]?.className}`}>
                  {statusConfig[assignment.status]?.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-gray-900/70 backdrop-blur-sm ring-1 ring-white/10 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Description</h2>
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">{assignment.description}</p>
              </div>

              {assignment.submission && (
                <div className="bg-gray-900/70 backdrop-blur-sm ring-1 ring-white/10 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Your Submission</h2>
                  <div className="space-y-2 text-gray-300">
                    <p><strong>Submitted on:</strong> {new Date(assignment.submission.submitted_at).toLocaleString()}</p>
                    <p><strong>Grade:</strong> {assignment.submission.grade ?? 'Not graded yet'}</p>
                  </div>
                  <Button asChild variant="outline" className="mt-4 bg-transparent border-purple-500 hover:bg-purple-500/10 text-purple-400 hover:text-white transition-colors">
                    <a href={assignment.submission.file_url} target="_blank" rel="noopener noreferrer">View Submission</a>
                  </Button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-900/70 backdrop-blur-sm ring-1 ring-white/10 rounded-lg p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Due Date</h3>
                </div>
                <p className="text-gray-300 text-lg">{new Date(assignment.due_date).toLocaleDateString()}</p>
                
                {assignment.status === 'pending' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3">Submit Your Work</h3>
                    <div className="grid w-full items-center gap-2">
                      <Label htmlFor="assignment-file" className="text-gray-400">Upload file</Label>
                      <Input id="assignment-file" type="file" onChange={handleFileChange} className="bg-gray-800/50 border-gray-700 text-white file:text-purple-400 file:font-semibold" />
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedFile} className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-purple-500/30 rounded-full">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Submit Assignment
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssignmentDetailPage;

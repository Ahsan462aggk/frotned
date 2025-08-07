import { useEffect, useState, ChangeEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Upload, Loader2, AlertCircle } from "lucide-react";
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
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/student/assignments/courses/${courseId}/assignments/${assignmentId}`);
        const data = await handleApiResponse(res);
        setAssignment(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message || "Could not fetch assignment details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentDetail();
  }, [courseId, assignmentId, toast]);

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

      const data = await handleApiResponse(res);
      toast({ title: "Success", description: data.detail || "Assignment submitted successfully." });
      
      // Navigate back to the assignments list to see the updated status
      navigate('/student/assignments');

    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <DashboardLayout userType="student"><div className="flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div></DashboardLayout>;
  }

  if (error || !assignment) {
    return (
      <DashboardLayout userType="student">
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Failed to load assignment</h2>
          <p className="text-muted-foreground">{error || "The assignment could not be found."}</p>
          <Link to="/student/assignments"><Button variant="outline" className="mt-4">Back to Assignments</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="student">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-6 mb-6">
  <div>
    <Link to="/student/assignments" className="text-xs text-primary hover:underline mb-2 inline-block tracking-wide">&larr; Back to Assignments</Link>
    <h1 className="text-4xl font-extrabold text-gradient bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-1 leading-tight drop-shadow-sm">
      {assignment.title}
    </h1>
    <div className="flex items-center gap-2 mt-1">
      <span className="text-base font-medium text-secondary-foreground">{assignment.course_title}</span>
      <span className="mx-2 text-muted-foreground">|</span>
      <span className="inline-flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-1" />
        Due: <span className="ml-1 font-medium">{new Date(assignment.due_date)?.toLocaleDateString()}</span>
      </span>
    </div>
  </div>
  <div className="flex flex-col items-end gap-2">
    <Badge className={`px-4 py-1 text-base font-semibold tracking-wide ${assignment.status === 'graded' ? 'bg-green-100 text-green-800 border-green-300' : assignment.status === 'submitted' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>{assignment.status?.toUpperCase()}</Badge>
  </div>
</div>
          </CardHeader>
          <CardContent>
            <Card className="mb-8 bg-muted/40 border-0 shadow-none">
              <CardContent className="py-6 px-6 flex items-start gap-4">
                <div>
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary mr-3 h-10 w-10">
                    <AlertCircle className="h-6 w-6" />
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Assignment Description</h3>
                  <p className="text-base text-muted-foreground whitespace-pre-line">{assignment.description}</p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Submission</h3>
              {assignment.submission ? (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p><strong>Status:</strong> Submitted</p>
                    <p><strong>Submitted on:</strong> {new Date(assignment.submission.submitted_at).toLocaleString()}</p>
                    <p><strong>Grade:</strong> {assignment.submission.grade ?? 'Not graded yet'}</p>
                    <a href={assignment.submission.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="mt-2">View Submission</Button>
                    </a>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="assignment-file">Upload your file</Label>
                      <Input id="assignment-file" type="file" onChange={handleFileChange} />
                    </div>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedFile} className="mt-4">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Submit Assignment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssignmentDetailPage;

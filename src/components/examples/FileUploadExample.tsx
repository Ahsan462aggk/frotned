import { useState } from 'react';
import { FileUploader } from '../upload/FileUploader';
import { UploadProgress } from '../upload/UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export function FileUploadExample() {
  const [files, setFiles] = useState<File[]>([]);
  const { upload, cancel, tasks, isUploading } = useFileUpload();

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Example: Upload each file to the server
      for (const file of files) {
        await upload(
          '/api/upload', // Your upload endpoint
          file,
          'file',
          {
            // Additional data to send with the file
            uploadType: 'example',
            timestamp: new Date().toISOString(),
          }
        );
      }
      
      toast({
        title: 'Upload complete',
        description: 'All files have been uploaded successfully',
      });
      
      // Clear files after successful upload
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = (taskId: string) => {
    cancel(taskId);
    toast({
      title: 'Upload cancelled',
      description: 'The upload has been cancelled',
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>File Upload Example</CardTitle>
        <CardDescription>
          Upload files with progress tracking and cancellation support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploader
          onUpload={setFiles}
          accept={{
            'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
            'video/*': ['.mp4', '.webm', '.mov'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          }}
          maxSize={100 * 1024 * 1024} // 100MB
          multiple={true}
          value={files}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Upload Queue</h3>
            <div className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
          </div>
          
          <UploadProgress 
            tasks={tasks} 
            onCancel={handleCancel} 
            className="mt  -2"
          />

          <div className="flex justify-end space-x-2 pt-2">
            {tasks.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  tasks.forEach(task => handleCancel(task.id));
                  setFiles([]);
                }}
                disabled={!isUploading}
              >
                Cancel All
              </Button>
            )}
            <Button 
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

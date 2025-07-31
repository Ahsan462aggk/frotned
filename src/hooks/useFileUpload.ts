import { useState, useCallback, useRef, useEffect } from 'react';
import { uploadFile } from '@/lib/upload';
import { api } from '@/lib/api';

type CancelTokenSource = {
  token: any; // Using any to match the axios.CancelToken type
  cancel: (message?: string) => void;
};

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export const useFileUpload = () => {
  const [tasks, setTasks] = useState<Record<string, UploadTask>>({});
  const cancelSource = useRef<CancelTokenSource>();
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData: Record<string, any> = {}
  ): Promise<string> => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize task
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        id: taskId,
        file,
        progress: 0,
        status: 'pending'
      }
    }));

    try {
      // Update to uploading state
      setTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status: 'uploading' }
      }));
      
      setIsUploading(true);

      // Start upload
      cancelSource.current = api.source();
      const result = await uploadFile(
        endpoint,
        file,
        fieldName,
        additionalData,
        {
          onProgress: (progress) => {
            setTasks(prev => ({
              ...prev,
              [taskId]: { ...prev[taskId], progress }
            }));
          },
          cancelToken: cancelSource.current?.token
        }
      );

      // Update to completed
      setTasks(prev => ({
        ...prev,
        [taskId]: { 
          ...prev[taskId], 
          progress: 100, 
          status: 'completed',
          url: result.url || result
        }
      }));

      return result.url || result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setTasks(prev => ({
        ...prev,
        [taskId]: { 
          ...prev[taskId], 
          status: 'error',
          error: errorMessage
        }
      }));
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const cancel = useCallback((taskId: string) => {
    if (cancelSource.current) {
      cancelSource.current.cancel('Upload cancelled by user');
    }
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[taskId];
      return newTasks;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelSource.current) {
        cancelSource.current.cancel('Component unmounted');
      }
    };
  }, []);

  return {
    upload,
    cancel,
    tasks: Object.values(tasks),
    isUploading
  };
};

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

interface UploadProgressProps {
  tasks: UploadTask[];
  onCancel: (taskId: string) => void;
  className?: string;
}

export function UploadProgress({ tasks, onCancel, className }: UploadProgressProps) {
  if (tasks.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      <h4 className="text-sm font-medium">Upload Progress</h4>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate max-w-[200px]" title={task.file.name}>
                {task.file.name}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {task.status === 'completed' ? 'Completed' : 
                   task.status === 'error' ? 'Failed' : 
                   task.status === 'pending' ? 'Pending' :
                   `${task.progress}%`}
                </span>
                {task.status === 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onCancel(task.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{
                  transform: `translateX(-${100 - task.progress}%)`,
                  backgroundColor: task.status === 'error' ? 'hsl(var(--destructive))' : 
                                 task.status === 'completed' ? 'hsl(142.1, 76.2%, 36.3%)' : 'hsl(var(--primary))'
                }}
              />
            </div>
            {task.error && (
              <p className="text-xs text-destructive mt-1">{task.error}</p>
            )}
            {task.url && task.status === 'completed' && (
              <p className="text-xs text-green-600 mt-1 truncate">
                Uploaded to: {task.url}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

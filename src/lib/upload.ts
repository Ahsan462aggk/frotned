import { api } from './api';

import { CancelToken } from 'axios';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
  cancelToken?: CancelToken;
}

export const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string = 'file',
  additionalData: Record<string, any> = {},
  options: UploadOptions = {}
) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  // Append additional data
  Object.entries(additionalData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  });

  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        options.onProgress?.(progress);
      },
    });

    const result = response.data;
    options.onComplete?.(result.url || result);
    return result;
  } catch (error) {
    options.onError?.(error as Error);
    throw error;
  }
};

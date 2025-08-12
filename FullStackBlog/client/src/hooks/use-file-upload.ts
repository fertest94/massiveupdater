import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface FileUploadOptions {
  targetType: 'contacts' | 'companies' | 'both';
  keyColumns: string[];
}

interface FileUploadResult {
  sessionId: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  availableColumns: string[];
}

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: FileUploadOptions }): Promise<FileUploadResult> => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const domain = urlParams.get('domain');

      if (!token || !domain) {
        throw new Error('Missing security parameters');
      }

      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv'
      ];

      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Invalid file type. Only .xlsx and .csv files are allowed.');
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', options.targetType);
      formData.append('keyColumns', JSON.stringify(options.keyColumns));

      setUploadProgress(0);

      const response = await fetch(`/api/upload?token=${token}&domain=${domain}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      setUploadProgress(100);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `${data.fileName} with ${data.totalRows.toLocaleString()} rows processed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploadProgress(0);
    },
  });

  const uploadFile = (file: File, options: FileUploadOptions) => {
    return uploadMutation.mutateAsync({ file, options });
  };

  return {
    uploadFile,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error,
  };
}

import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Edit, Download, Clock, CheckCircle, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExecutionStepProps {
  sessionId: string;
  onExecutionStarted: () => void;
  onComplete: () => void;
  disabled?: boolean;
}

export default function ExecutionStep({ 
  sessionId, 
  onExecutionStarted, 
  onComplete, 
  disabled 
}: ExecutionStepProps) {
  const token = new URLSearchParams(window.location.search).get('token');
  const domain = new URLSearchParams(window.location.search).get('domain');

  const executeMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/execute?token=${token}&domain=${domain}`, { sessionId }),
    onSuccess: () => {
      onExecutionStarted();
      toast({
        title: "Execution started",
        description: "Processing updates in batches...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadReportsMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/download/${sessionId}/${type}?token=${token}&domain=${domain}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}-${sessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "CSV file is being downloaded",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecute = () => {
    executeMutation.mutate();
  };

  const handleEditBeforeExecute = () => {
    // Scroll back to preview table
    const previewElement = document.querySelector('[data-testid="preview-table-section"]');
    if (previewElement) {
      previewElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadReports = (type: string) => {
    downloadReportsMutation.mutate(type);
  };

  return (
    <section className={`glassmorphism rounded-2xl p-8 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          disabled ? 'bg-apple-gray-700' : 'bg-apple-blue'
        }`}>
          <span className="text-white font-semibold">4</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Execute Updates</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center justify-between p-4 bg-apple-gray-900 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">Records to update</span>
              </div>
              <span className="font-semibold text-green-400" data-testid="text-records-count">
                1,180
              </span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center justify-between p-4 bg-apple-gray-900 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Estimated time</span>
              </div>
              <span className="font-semibold text-yellow-400" data-testid="text-estimated-time">
                ~2 minutes
              </span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center justify-between p-4 bg-apple-gray-900 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-5 h-5 text-apple-blue" />
                <span className="text-white">Batch size</span>
              </div>
              <span className="font-semibold text-apple-blue" data-testid="text-batch-size">
                50 records/batch
              </span>
            </motion.div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleExecute}
            disabled={disabled || executeMutation.isPending}
            className="bg-apple-blue hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
            data-testid="button-execute-all"
          >
            <Play className="w-4 h-4 mr-2" />
            {executeMutation.isPending ? 'Starting...' : 'Execute All Updates'}
          </Button>
          
          <Button
            onClick={handleEditBeforeExecute}
            disabled={disabled}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
            data-testid="button-edit-before-execute"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Before Execute
          </Button>
          
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleDownloadReports('not-found')}
              disabled={disabled || downloadReportsMutation.isPending}
              variant="outline"
              className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200"
              data-testid="button-download-not-found"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Not Found
            </Button>
            
            <Button
              onClick={() => handleDownloadReports('duplicates')}
              disabled={disabled || downloadReportsMutation.isPending}
              variant="outline"
              className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200"
              data-testid="button-download-duplicates"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Duplicates
            </Button>
            
            <Button
              onClick={() => handleDownloadReports('errors')}
              disabled={disabled || downloadReportsMutation.isPending}
              variant="outline"
              className="bg-apple-gray-800 border-apple-gray-700 text-white hover:bg-apple-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200"
              data-testid="button-download-errors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Errors
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, Download, Undo, Plus, AlertTriangle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ResultsSectionProps {
  sessionId: string;
  onStartNew: () => void;
}

interface ExecutionResults {
  totalUpdated: number;
  totalNotFound: number;
  totalDuplicates: number;
  totalErrors: number;
  notFoundRecords: any[];
  duplicateRecords: any[];
  errorRecords: any[];
}

export default function ResultsSection({ sessionId, onStartNew }: ResultsSectionProps) {
  const token = new URLSearchParams(window.location.search).get('token');
  const domain = new URLSearchParams(window.location.search).get('domain');
  
  const { data: results, isLoading } = useQuery<ExecutionResults>({
    queryKey: [`/api/results/${sessionId}?token=${token}&domain=${domain}`],
    enabled: !!sessionId,
  });

  const downloadMutation = useMutation({
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

  const undoMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/undo/${sessionId}?token=${token}&domain=${domain}`, {}),
    onSuccess: () => {
      toast({
        title: "Undo process started",
        description: "Reverting changes to original values...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Undo failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <section className="glassmorphism rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-apple-gray-800 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-apple-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const handleDownload = (type: string) => {
    downloadMutation.mutate(type);
  };

  const handleUndo = () => {
    if (confirm('Are you sure you want to undo all changes? This will revert all updated records to their original values.')) {
      undoMutation.mutate();
    }
  };

  return (
    <section className="glassmorphism rounded-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <Check className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Execution Complete</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-green-400 mb-1" data-testid="stat-updated">
            {results?.totalUpdated || 0}
          </div>
          <div className="text-sm text-green-300">Successfully Updated</div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-red-400 mb-1" data-testid="stat-not-found">
            {results?.totalNotFound || 0}
          </div>
          <div className="text-sm text-red-300">Not Found</div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-yellow-400 mb-1" data-testid="stat-duplicates">
            {results?.totalDuplicates || 0}
          </div>
          <div className="text-sm text-yellow-300">Duplicates</div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 text-center"
        >
          <div className="text-2xl font-bold text-orange-400 mb-1" data-testid="stat-errors">
            {results?.totalErrors || 0}
          </div>
          <div className="text-sm text-orange-300">Errors</div>
        </motion.div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => handleDownload('not-found')}
            disabled={downloadMutation.isPending || !results?.totalNotFound}
            className="bg-apple-blue hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
            data-testid="button-download-not-found"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Not Found
          </Button>
          
          <Button
            onClick={() => handleDownload('duplicates')}
            disabled={downloadMutation.isPending || !results?.totalDuplicates}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
            data-testid="button-download-duplicates"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Duplicates
          </Button>
          
          <Button
            onClick={() => handleDownload('errors')}
            disabled={downloadMutation.isPending || !results?.totalErrors}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
            data-testid="button-download-errors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Errors
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleUndo}
            disabled={undoMutation.isPending || !results?.totalUpdated}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
            data-testid="button-undo-changes"
          >
            <Undo className="w-4 h-4 mr-2" />
            {undoMutation.isPending ? 'Undoing...' : 'Undo All Changes'}
          </Button>
          
          <Button
            onClick={onStartNew}
            className="bg-apple-blue hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
            data-testid="button-start-new"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Update
          </Button>
        </div>
      </div>
    </section>
  );
}

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessingIndicatorProps {
  sessionId: string;
  isExecution?: boolean;
  onComplete: () => void;
}

interface ProcessingStatus {
  sessionId: string;
  status: string;
  progress: number;
  currentRow: number;
  totalRows: number;
  processed?: number;
  remaining?: number;
  errors?: number;
  currentBatch?: number;
  totalBatches?: number;
}

export default function ProcessingIndicator({ 
  sessionId, 
  isExecution = false, 
  onComplete 
}: ProcessingIndicatorProps) {
  const endpoint = isExecution ? 'execution' : 'status';
  const token = new URLSearchParams(window.location.search).get('token');
  const domain = new URLSearchParams(window.location.search).get('domain');
  
  const { data: status } = useQuery<ProcessingStatus>({
    queryKey: [`/api/${endpoint}/${sessionId}?token=${token}&domain=${domain}`],
    refetchInterval: 1000, // Poll every second
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (status && (status.status === 'preview' || status.status === 'completed')) {
      onComplete();
    }
  }, [status, onComplete]);

  const isCompleted = status?.status === 'preview' || status?.status === 'completed';
  const progress = status?.progress || 0;

  return (
    <section className="glassmorphism rounded-2xl p-8">
      <div className="text-center">
        <motion.div
          animate={{ rotate: isCompleted ? 0 : 360 }}
          transition={{ duration: 1, repeat: isCompleted ? 0 : Infinity, ease: "linear" }}
          className="w-16 h-16 bg-apple-blue rounded-full flex items-center justify-center mx-auto mb-6"
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-2xl text-white"
            >
              ✓
            </motion.div>
          ) : (
            <RefreshCw className="w-8 h-8 text-white" />
          )}
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-4 text-white">
          {isExecution ? 'Updating Records' : 'Processing Your Data'}
        </h3>
        <p className="text-apple-gray-400 mb-6">
          {isExecution 
            ? 'Processing batch updates to Bitrix24...'
            : 'Searching Bitrix24 records and preparing preview...'
          }
        </p>
        
        {isExecution && status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-apple-gray-900 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {status.processed || 0}
              </div>
              <div className="text-sm text-apple-gray-400">Processed</div>
            </div>
            <div className="bg-apple-gray-900 rounded-xl p-4">
              <div className="text-2xl font-bold text-apple-blue mb-1">
                {status.remaining || 0}
              </div>
              <div className="text-sm text-apple-gray-400">Remaining</div>
            </div>
            <div className="bg-apple-gray-900 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {status.errors || 0}
              </div>
              <div className="text-sm text-apple-gray-400">Errors</div>
            </div>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="w-full mb-4">
          <Progress 
            value={progress} 
            className="h-3 bg-apple-gray-800" 
            data-testid="progress-bar"
          />
        </div>
        
        <p className="text-sm text-apple-gray-400" data-testid="progress-text">
          {isExecution && status
            ? `Processing batch ${status.currentBatch || 1} of ${status.totalBatches || 1}...`
            : `Processing row ${status?.currentRow || 0} of ${status?.totalRows || 0}...`
          }
        </p>
      </div>
    </section>
  );
}

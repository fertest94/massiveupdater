import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SecurityValidation from "@/components/SecurityValidation";
import FileUpload from "@/components/FileUpload";
import ConfigurationStep from "@/components/ConfigurationStep";
import PreviewTable from "@/components/PreviewTable";
import ExecutionStep from "@/components/ExecutionStep";
import ResultsSection from "@/components/ResultsSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import FloatingAlert from "@/components/FloatingAlert";
import { useSecurity } from "@/hooks/use-security";
import { Database, Users } from "lucide-react";

export default function MassUpdater() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const { isValidated, isValidating, validate } = useSecurity();

  const handleSecurityValidated = () => {
    setCurrentStep(1);
  };

  const handleFileUploaded = (data: any) => {
    setFileInfo(data);
    setSessionId(data.sessionId);
    setCurrentStep(2);
  };

  const handleConfigurationComplete = () => {
    setIsProcessing(true);
    setCurrentStep(3);
  };

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    setCurrentStep(4);
  };

  const handleExecutionStarted = () => {
    setIsExecuting(true);
  };

  const handleExecutionComplete = () => {
    setIsExecuting(false);
    setShowResults(true);
    setCurrentStep(5);
  };

  const handleStartNew = () => {
    setCurrentStep(1);
    setSessionId(null);
    setFileInfo(null);
    setIsProcessing(false);
    setIsExecuting(false);
    setShowResults(false);
  };

  if (!isValidated) {
    return (
      <SecurityValidation
        isValidating={isValidating}
        onValidated={handleSecurityValidated}
        onValidate={validate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-apple-gray-950">
      <FloatingAlert />
      
      {/* Header */}
      <header className="glassmorphism border-b border-apple-gray-800 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-apple-blue rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Mass Contact Updater</h1>
                <p className="text-sm text-apple-gray-400">Bitrix24 Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: File Upload */}
          {currentStep >= 1 && (
            <motion.div
              key="file-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <FileUpload
                onFileUploaded={handleFileUploaded}
                fileInfo={fileInfo}
                data-testid="file-upload-section"
              />
            </motion.div>
          )}

          {/* Step 2: Configuration */}
          {currentStep >= 2 && sessionId && (
            <motion.div
              key="configuration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <ConfigurationStep
                sessionId={sessionId}
                fileInfo={fileInfo}
                onComplete={handleConfigurationComplete}
                disabled={currentStep < 2}
                data-testid="configuration-section"
              />
            </motion.div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <ProcessingIndicator
                sessionId={sessionId!}
                onComplete={handleProcessingComplete}
                data-testid="processing-indicator"
              />
            </motion.div>
          )}

          {/* Step 3: Preview Table */}
          {currentStep >= 3 && !isProcessing && sessionId && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <PreviewTable
                sessionId={sessionId}
                disabled={currentStep < 3}
                data-testid="preview-table-section"
              />
            </motion.div>
          )}

          {/* Step 4: Execution */}
          {currentStep >= 4 && !isProcessing && !isExecuting && sessionId && (
            <motion.div
              key="execution"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <ExecutionStep
                sessionId={sessionId}
                onExecutionStarted={handleExecutionStarted}
                onComplete={handleExecutionComplete}
                disabled={currentStep < 4}
                data-testid="execution-section"
              />
            </motion.div>
          )}

          {/* Execution Progress */}
          {isExecuting && sessionId && (
            <motion.div
              key="execution-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <ProcessingIndicator
                sessionId={sessionId}
                isExecution={true}
                onComplete={handleExecutionComplete}
                data-testid="execution-progress"
              />
            </motion.div>
          )}

          {/* Step 5: Results */}
          {showResults && sessionId && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fade-in"
            >
              <ResultsSection
                sessionId={sessionId}
                onStartNew={handleStartNew}
                data-testid="results-section"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

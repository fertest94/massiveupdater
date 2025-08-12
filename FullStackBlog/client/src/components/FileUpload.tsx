import { useState } from "react";
import { motion } from "framer-motion";
import { useFileUpload } from "@/hooks/use-file-upload";
import { CloudUpload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (data: any) => void;
  fileInfo?: any;
}

export default function FileUpload({ onFileUploaded, fileInfo }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadFile(file, {
        targetType: 'contacts',
        keyColumns: ['EMAIL'], // Default, will be configured in next step
      });
      
      onFileUploaded(result);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} with ${result.totalRows} rows`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = () => {
    // Reset file state
    window.location.reload();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section className="glassmorphism rounded-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
          <span className="text-white font-semibold">1</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Upload Data File</h2>
      </div>
      
      {!fileInfo ? (
        <motion.div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragOver 
              ? 'border-apple-blue bg-blue-500/10' 
              : 'border-apple-gray-700 hover:border-apple-blue'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          data-testid="drop-zone"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-apple-gray-800 rounded-full flex items-center justify-center mx-auto">
              <CloudUpload className="w-8 h-8 text-apple-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-white">
                {isUploading ? 'Uploading...' : 'Drop your file here'}
              </h3>
              <p className="text-apple-gray-400 mb-4">
                Support for .xlsx and .csv files up to 100,000 rows
              </p>
              <Button
                disabled={isUploading}
                className="bg-apple-blue hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-xl"
                data-testid="button-choose-file"
              >
                {isUploading ? 'Processing...' : 'Choose File'}
              </Button>
            </div>
          </div>
          
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="input-file"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-apple-gray-900 rounded-xl"
          data-testid="file-info"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-white">{fileInfo.fileName}</p>
                <p className="text-sm text-apple-gray-400">
                  {formatFileSize(fileInfo.fileSize)} • {fileInfo.totalRows.toLocaleString()} rows
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-apple-gray-400 hover:text-white transition-colors"
              data-testid="button-remove-file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Building, Users, Key, Plus, X, GripVertical, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConfigurationStepProps {
  sessionId: string;
  fileInfo: any;
  onComplete: () => void;
  disabled?: boolean;
}

export default function ConfigurationStep({ 
  sessionId, 
  fileInfo, 
  onComplete, 
  disabled 
}: ConfigurationStepProps) {
  const [targetType, setTargetType] = useState<'contacts' | 'companies' | 'both'>('contacts');
  const [keyColumns, setKeyColumns] = useState<string[]>(['EMAIL']);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableColumns = fileInfo?.availableColumns || [];

  const handleAddKeyColumn = () => {
    const availableOptions = availableColumns.filter((col: string) => !keyColumns.includes(col));
    if (availableOptions.length > 0) {
      setKeyColumns([...keyColumns, availableOptions[0]]);
    }
  };

  const handleRemoveKeyColumn = (index: number) => {
    if (keyColumns.length > 1) {
      const newColumns = keyColumns.filter((_, i) => i !== index);
      setKeyColumns(newColumns);
    }
  };

  const handleKeyColumnChange = (index: number, value: string) => {
    const newColumns = [...keyColumns];
    newColumns[index] = value;
    setKeyColumns(newColumns);
  };

  const handleProcess = async () => {
    if (keyColumns.length === 0) {
      toast({
        title: "Configuration Error",
        description: "At least one key column is required",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const token = new URLSearchParams(window.location.search).get('token');
      const domain = new URLSearchParams(window.location.search).get('domain');
      
      await apiRequest('POST', `/api/process?token=${token}&domain=${domain}`, {
        sessionId,
        targetType,
        keyColumns,
      });
      
      onComplete();
      
      toast({
        title: "Processing started",
        description: "Searching Bitrix24 records...",
      });
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className={`glassmorphism rounded-2xl p-8 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          disabled ? 'bg-apple-gray-700' : 'bg-apple-blue'
        }`}>
          <span className="text-white font-semibold">2</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Configure Mapping</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Type Selection */}
        <div>
          <Label className="block text-sm font-medium mb-3 text-white">Update Target</Label>
          <RadioGroup
            value={targetType}
            onValueChange={(value: any) => setTargetType(value)}
            disabled={disabled}
            className="space-y-2"
          >
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center space-x-3 p-3 bg-apple-gray-900 rounded-xl cursor-pointer hover:bg-apple-gray-800 transition-colors"
            >
              <RadioGroupItem value="contacts" id="contacts" data-testid="radio-contacts" />
              <User className="w-4 h-4 text-apple-gray-400" />
              <Label htmlFor="contacts" className="text-white cursor-pointer">Contacts Only</Label>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center space-x-3 p-3 bg-apple-gray-900 rounded-xl cursor-pointer hover:bg-apple-gray-800 transition-colors"
            >
              <RadioGroupItem value="companies" id="companies" data-testid="radio-companies" />
              <Building className="w-4 h-4 text-apple-gray-400" />
              <Label htmlFor="companies" className="text-white cursor-pointer">Companies Only</Label>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className="flex items-center space-x-3 p-3 bg-apple-gray-900 rounded-xl cursor-pointer hover:bg-apple-gray-800 transition-colors"
            >
              <RadioGroupItem value="both" id="both" data-testid="radio-both" />
              <Users className="w-4 h-4 text-apple-gray-400" />
              <Label htmlFor="both" className="text-white cursor-pointer">Both Contacts & Companies</Label>
            </motion.div>
          </RadioGroup>
        </div>
        
        {/* Key Columns */}
        <div>
          <Label className="block text-sm font-medium mb-3 text-white">
            Search Key Columns (Priority Order)
          </Label>
          <div className="space-y-2" data-testid="key-columns-list">
            {keyColumns.map((column, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-apple-gray-900 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <GripVertical className="w-4 h-4 text-apple-gray-500 cursor-grab" />
                  <Key className="w-4 h-4 text-apple-blue" />
                  <select
                    value={column}
                    onChange={(e) => handleKeyColumnChange(index, e.target.value)}
                    disabled={disabled}
                    className="bg-transparent text-white border-none focus:outline-none"
                    data-testid={`select-key-column-${index}`}
                  >
                    {availableColumns.map((col: string) => (
                      <option key={col} value={col} className="bg-apple-gray-900 text-white">
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
                {keyColumns.length > 1 && (
                  <button
                    onClick={() => handleRemoveKeyColumn(index)}
                    disabled={disabled}
                    className="text-apple-gray-400 hover:text-red-400 transition-colors"
                    data-testid={`button-remove-key-column-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          
          {keyColumns.length < availableColumns.length && (
            <button
              onClick={handleAddKeyColumn}
              disabled={disabled}
              className="mt-3 text-apple-blue hover:text-blue-400 transition-colors text-sm flex items-center"
              data-testid="button-add-key-column"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Key Column
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-apple-gray-800">
        <Button
          onClick={handleProcess}
          disabled={disabled || isProcessing}
          className="bg-apple-blue hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-xl"
          data-testid="button-process-file"
        >
          <Search className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Search & Generate Preview'}
        </Button>
      </div>
    </section>
  );
}

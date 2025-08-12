import { motion } from "framer-motion";
import { Shield, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityValidationProps {
  isValidating: boolean;
  onValidated: () => void;
  onValidate: () => Promise<void>;
}

export default function SecurityValidation({ 
  isValidating, 
  onValidated, 
  onValidate 
}: SecurityValidationProps) {
  return (
    <div className="fixed inset-0 bg-apple-gray-950 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glassmorphism rounded-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-apple-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-white">Security Validation</h2>
          <p className="text-apple-gray-400 mb-6">
            Verifying access token and domain permissions...
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-apple-gray-300">Token validation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-apple-gray-300">Domain verification</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-apple-blue flex items-center justify-center">
                {isValidating ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-sm text-apple-gray-300">Bitrix24 connection</span>
            </div>
          </div>
          
          <Button
            onClick={onValidate}
            disabled={isValidating}
            className="w-full bg-apple-blue hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
            data-testid="button-continue"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Continue to App"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

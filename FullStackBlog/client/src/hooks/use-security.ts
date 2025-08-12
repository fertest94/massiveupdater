import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SecurityState {
  isValidated: boolean;
  isValidating: boolean;
  error: string | null;
}

export function useSecurity() {
  const [state, setState] = useState<SecurityState>({
    isValidated: false,
    isValidating: false,
    error: null,
  });

  useEffect(() => {
    // Check URL parameters on mount
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const domain = urlParams.get('domain');

    if (token && domain) {
      // Auto-validate if parameters are present
      validateSecurity();
    } else {
      setState(prev => ({
        ...prev,
        error: 'Missing security parameters. Please access this app through the authorized Bitrix24 interface.',
      }));
    }
  }, []);

  const validateSecurity = async () => {
    setState(prev => ({ ...prev, isValidating: true, error: null }));

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const domain = urlParams.get('domain');

      if (!token || !domain) {
        throw new Error('Missing security parameters');
      }

      // Validate with backend
      const response = await apiRequest('POST', '/api/validate-security', {
        token,
        domain,
      });

      const result = await response.json();

      if (result.valid) {
        setState(prev => ({
          ...prev,
          isValidated: true,
          isValidating: false,
          error: null,
        }));

        toast({
          title: "Security Validation Successful",
          description: "Access granted. You can now proceed with the application.",
        });
      } else {
        throw new Error(result.message || 'Security validation failed');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isValidated: false,
        isValidating: false,
        error: error.message,
      }));

      toast({
        title: "Security Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setState({
      isValidated: false,
      isValidating: false,
      error: null,
    });
  };

  return {
    ...state,
    validate: validateSecurity,
    reset,
  };
}

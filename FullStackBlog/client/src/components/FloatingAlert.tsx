import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, Info, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

export default function FloatingAlert() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const { toasts } = useToast();

  useEffect(() => {
    // Convert toast notifications to floating alerts
    const newAlerts = toasts.map((toast) => ({
      id: toast.id,
      type: toast.variant === 'destructive' ? 'error' as const : 'success' as const,
      title: toast.title as string || 'Notification',
      message: toast.description as string || '',
      autoHide: true,
      duration: 5000,
    }));
    
    setAlerts(newAlerts);
  }, [toasts]);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 space-y-4 max-w-sm">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4 
            }}
            className={`glassmorphism rounded-2xl p-4 border-l-4 ${getBorderColor(alert.type)} shadow-2xl backdrop-blur-xl`}
            data-testid={`alert-${alert.type}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-semibold text-white text-sm leading-tight" data-testid="alert-title">
                  {alert.title}
                </h4>
                {alert.message && (
                  <p className="text-sm text-apple-gray-300 mt-1 leading-relaxed" data-testid="alert-message">
                    {alert.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="flex-shrink-0 text-apple-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
                data-testid="button-close-alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {alert.autoHide && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (alert.duration || 5000) / 1000, ease: "linear" }}
                className="h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-3 rounded-full"
                onAnimationComplete={() => removeAlert(alert.id)}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

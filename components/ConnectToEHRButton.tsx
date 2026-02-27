"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { shouldUseMockEpic } from '@/lib/mockEpicAuth';
import { useSmartStatus } from '@/hooks/use-smart-status';
import { useToast } from '@/hooks/use-toast';

export default function ConnectToEHRButton() {
  // Get connection status from the hook
  const smartStatus = useSmartStatus();
  const { toast } = useToast();
  
  // State to track if we're using mock implementation and connection attempts
  const [isMockMode, setIsMockMode] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  
  // Reset connection state when status changes
  React.useEffect(() => {
    if (smartStatus.connected || !isConnecting) return;
    
    // If we were trying to connect and now we have an error,
    // reset the connecting state after a delay
    if (smartStatus.error) {
      const timer = setTimeout(() => {
        setIsConnecting(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [smartStatus, isConnecting]);
  
  // Check for mock mode on component mount
  React.useEffect(() => {
    setIsMockMode(shouldUseMockEpic());
  }, []);
  
  const handleConnect = () => {
    // Don't do anything if already connected or currently connecting
    if (smartStatus.connected) {
      toast({
        title: "Already connected",
        description: "You are already connected to the EHR system.",
      });
      return;
    }
    
    if (isConnecting) {
      toast({
        title: "Connection in progress",
        description: "Please wait, connection attempt in progress.",
      });
      return;
    }
    
    setIsConnecting(true);
    setConnectionAttempts(prev => prev + 1);
    
    // Check if we should use mock mode
    if (isMockMode || shouldUseMockEpic()) {
      // For mock mode, redirect directly to success URL with mock parameters
      window.location.href = `${window.location.origin}/api/smart/callback?code=mock-auth-code-${Date.now()}&state=mock-state&mock=true`;
      return;
    }
    
    // EHR Launch flow — clinician apps are launched from inside the EHR.
    // For sandbox testing, open Epic's launchpad so the user can initiate
    // the launch from there (mimics real Hyperspace launch).
    try {
      toast({
        title: "EHR Launch Required",
        description: "Opening Epic's sandbox launchpad. Launch ClinicalScribe from there.",
      });

      setTimeout(() => {
        try {
          // Open Epic launchpad for EHR launch testing
          const launchpadUrl = 'https://fhir.epic.com/Documentation?docId=testpatients'
          const launchWindow = window.open(launchpadUrl, '_blank')
          if (!launchWindow) {
            // Popup blocked — copy link to clipboard and show toast
            navigator.clipboard?.writeText(launchpadUrl)
            toast({
              title: "Popup Blocked",
              description: "Epic launchpad URL copied to clipboard. Open it manually.",
              variant: "destructive",
            })
          }
        } catch (redirectError) {
          console.error('Error opening launchpad:', redirectError)
        }
        setIsConnecting(false)
      }, 500)
    } catch (error) {
      console.error('Error starting EHR launch:', error);
      toast({
        title: "Connection Error",
        description: "Failed to open Epic launchpad.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await smartStatus.refreshToken();
      toast({
        title: "Token Refreshed",
        description: "Your EHR connection has been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh EHR connection. Please reconnect.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Connecting state
  if (isConnecting) {
    return (
      <motion.button
        className="flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-xl cursor-wait"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </motion.button>
    );
  }

  // Error state
  if (!smartStatus.loading && smartStatus.error) {
    return (
      <div className="flex gap-2">
        <motion.button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-xl transition-all duration-300 hover:scale-105 bg-orange-600/90 hover:bg-orange-700/90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AlertTriangle className="h-4 w-4" />
          Reconnect to EHR
        </motion.button>
        <motion.button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 font-medium text-white rounded-xl transition-all duration-300 hover:scale-105 bg-blue-600/90 hover:bg-blue-700/90 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </motion.button>
      </div>
    );
  }

  // Already connected state
  if (smartStatus.connected) {
    return (
      <div className="flex gap-2">
        <motion.button
          className="flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-xl cursor-default opacity-80"
        >
          <CheckCircle className="h-4 w-4" />
          Connected
        </motion.button>
        <motion.button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 font-medium text-white rounded-xl transition-all duration-300 hover:scale-105 bg-blue-600/90 hover:bg-blue-700/90 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </motion.button>
      </div>
    );
  }

  // Loading state
  if (smartStatus.loading) {
    return (
      <motion.button
        className="flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-xl cursor-wait"
      >
        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        Checking...
      </motion.button>
    );
  }

  // Normal connect button
  return (
    <motion.button
      onClick={handleConnect}
      className="flex items-center gap-2 px-6 py-2.5 font-medium text-white rounded-xl transition-all duration-300 hover:scale-105"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ExternalLink className="h-4 w-4" />
      {isMockMode ? 'Connect (Mock Mode)' : 'Connect to EHR'}
    </motion.button>
  );
}
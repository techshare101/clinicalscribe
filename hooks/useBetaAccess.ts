"use client";

import { useProfile } from "./useProfile";

export interface BetaAccessStatus {
  isLoading: boolean;
  hasBetaAccess: boolean;
  profile: any;
  needsUpgrade: boolean;
}

export function useBetaAccess(): BetaAccessStatus {
  const { profile, isLoading } = useProfile();
  
  // Check if user has beta access
  const hasBetaAccess = Boolean(profile?.betaActive);
  const needsUpgrade = !isLoading && !hasBetaAccess;

  return {
    isLoading,
    hasBetaAccess,
    profile,
    needsUpgrade
  };
}
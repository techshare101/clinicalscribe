"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, query, orderBy, limit, Timestamp, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

// Helper: Check if user should see demo mode (only FREE users)
function shouldUseDemoMode(profile: any): boolean {
  if (!profile) return true; // No profile = show demo
  if (profile.betaActive) return false;
  if (profile.proActive) return false;
  if (profile.teamActive) return false;
  return true; // Free user = show demo
}

// Types for dashboard data
type Patient = {
  id: string;
  name: string;
  status: string;
  priority: string;
  room: string;
  timestamp: Timestamp;
  formattedTime?: string;
};

type Transcription = {
  id: string;
  patient: string;
  type: string;
  content: string;
  timestamp: Timestamp;
  formattedTime?: string;
};

type AnalyticMetric = {
  id: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
};

type AuditLog = {
  id: string;
  user: string;
  action: string;
  patient: string;
  timestamp: Timestamp;
  formattedTime?: string;
};

interface DashboardData {
  patients: Patient[];
  transcriptions: Transcription[];
  analytics: AnalyticMetric[];
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;
  mode: "demo" | "real";
}

// Mock data as fallback
const mockPatients: Patient[] = [
  { id: "p1", name: "John Doe", status: "Awaiting Summary", priority: "High", room: "Room 101", timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
  { id: "p2", name: "Jane Smith", status: "SOAP Ready", priority: "Medium", room: "Room 205", timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
  { id: "p3", name: "Robert Johnson", status: "Signed", priority: "Low", room: "Room 302", timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)) },
  { id: "p4", name: "Emily Davis", status: "Awaiting Summary", priority: "High", room: "Room 105", timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)) },
  { id: "p5", name: "Michael Wilson", status: "SOAP Ready", priority: "Medium", room: "Room 210", timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000)) },
];

const mockTranscriptions: Transcription[] = [
  { id: "t1", patient: "John Doe", type: "Summary", content: "Patient presents with chest pain, diagnosed with mild hypertension.", timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
  { id: "t2", patient: "Jane Smith", type: "SOAP", content: "Subjective: Patient reports headache. Objective: BP 140/90. Assessment: Hypertension. Plan: Prescribe medication.", timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
  { id: "t3", patient: "Robert Johnson", type: "Summary", content: "Routine checkup, all vitals normal.", timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)) },
  { id: "t4", patient: "Emily Davis", type: "SOAP", content: "Subjective: Patient complains of back pain. Objective: Pain scale 7/10. Assessment: Muscle strain. Plan: Physical therapy.", timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)) },
  { id: "t5", patient: "Michael Wilson", type: "Summary", content: "Follow-up visit, medication adjusted.", timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000)) },
];

const mockAnalytics: AnalyticMetric[] = [
  { id: "daily", metric: "Daily Transcriptions", value: 24, target: 30, unit: "records" },
  { id: "completion", metric: "Completion Rate", value: 85, target: 95, unit: "%" },
  { id: "accuracy", metric: "Accuracy Rate", value: 92, target: 98, unit: "%" },
  { id: "active", metric: "Active Sessions", value: 3, target: 5, unit: "sessions" },
];

const mockAuditLogs: AuditLog[] = [
  { id: "a1", user: "Dr. Sarah Connor", action: "Approved Note", patient: "John Doe", timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
  { id: "a2", user: "Nurse Mike Johnson", action: "Exported PDF", patient: "Jane Smith", timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
  { id: "a3", user: "Admin Alex Thompson", action: "Reviewed Summary", patient: "Robert Johnson", timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)) },
  { id: "a4", user: "Dr. Sarah Connor", action: "Flagged for Review", patient: "Emily Davis", timestamp: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)) },
  { id: "a5", user: "Nurse Mike Johnson", action: "Created SOAP", patient: "Michael Wilson", timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000)) },
];

// Format Firestore timestamp to "X min ago" format
function formatTimestamp(timestamp: Timestamp | undefined) {
  if (!timestamp) return "";
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
    .replace("about ", "")
    .replace("less than a minute ago", "just now")
    .replace("minutes ago", "min ago");
}

// Add formatted time to mock data
const formatMockData = () => {
  const formattedPatients = mockPatients.map(patient => ({
    ...patient,
    formattedTime: formatTimestamp(patient.timestamp),
  }));

  const formattedTranscriptions = mockTranscriptions.map(transcription => ({
    ...transcription,
    formattedTime: formatTimestamp(transcription.timestamp),
  }));

  const formattedAuditLogs = mockAuditLogs.map(log => ({
    ...log,
    formattedTime: formatTimestamp(log.timestamp),
  }));

  return {
    patients: formattedPatients,
    transcriptions: formattedTranscriptions,
    analytics: mockAnalytics,
    auditLogs: formattedAuditLogs,
  };
};

// Create a context to provide data to dashboard components
const DashboardDataContext = createContext<DashboardData>({
  patients: [],
  transcriptions: [],
  analytics: [],
  auditLogs: [],
  loading: false,
  error: null,
  mode: "demo",
});

export function useDashboardData() {
  return useContext(DashboardDataContext);
}

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const [data, setData] = useState<DashboardData>({
    patients: [],
    transcriptions: [],
    analytics: [],
    auditLogs: [],
    loading: true,
    error: null,
    mode: "demo",
  });
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    // Check if user is a paying subscriber
    const useDemo = shouldUseDemoMode(profile);

    if (useDemo) {
      // FREE users: Show demo data
      const mockData = formatMockData();
      setData(prev => ({
        ...prev,
        ...mockData,
        loading: false,
        mode: "demo",
      }));
    } else {
      // PAYING users: Start with empty workspace (no demo data)
      setData(prev => ({
        ...prev,
        patients: [],
        transcriptions: [],
        analytics: [],
        auditLogs: [],
        loading: false,
        mode: "real",
      }));
    }

    // If no user, stay in current mode
    if (!user) {
      return;
    }

    // Set up unsubscribe functions for cleanup
    const unsubscribes: (() => void)[] = [];

    // Try to fetch real data in the background
    try {
      // Fetch patients data
      const patientsQuery = query(
        collection(db, "patients"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      
      const patientsUnsub = onSnapshot(patientsQuery, (snapshot) => {
        const patientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedTime: formatTimestamp(doc.data().timestamp),
        })) as Patient[];
        
        setData(prev => ({
          ...prev,
          patients: patientsData.length > 0 ? patientsData : prev.patients,
          mode: patientsData.length > 0 ? "real" : prev.mode,
        }));
      }, (error) => {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          // Suppress permissions errors as we handle them gracefully by staying in demo mode
          // console.log("Permissions error for patients collection, staying in demo mode");
        } else {
          // Log other errors
          console.error("Patients snapshot error:", error);
        }
      });
      
      unsubscribes.push(patientsUnsub);

      // Fetch transcriptions data
      const transcriptionsQuery = query(
        collection(db, "transcriptions"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      
      const transcriptionsUnsub = onSnapshot(transcriptionsQuery, (snapshot) => {
        const transcriptionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedTime: formatTimestamp(doc.data().timestamp),
        })) as Transcription[];
        
        setData(prev => ({
          ...prev,
          transcriptions: transcriptionsData.length > 0 ? transcriptionsData : prev.transcriptions,
          mode: transcriptionsData.length > 0 ? "real" : prev.mode,
        }));
      }, (error) => {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          // Suppress permissions errors as we handle them gracefully by staying in demo mode
          // console.log("Permissions error for transcriptions collection, staying in demo mode");
        } else {
          // Log other errors
          console.error("Transcriptions snapshot error:", error);
        }
      });
      
      unsubscribes.push(transcriptionsUnsub);

      // Fetch analytics data
      const analyticsQuery = query(collection(db, "analytics"));
      
      const analyticsUnsub = onSnapshot(analyticsQuery, (snapshot) => {
        const analyticsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AnalyticMetric[];
        
        setData(prev => ({
          ...prev,
          analytics: analyticsData.length > 0 ? analyticsData : prev.analytics,
          mode: analyticsData.length > 0 ? "real" : prev.mode,
        }));
      }, (error) => {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          // Suppress permissions errors as we handle them gracefully by staying in demo mode
          // console.log("Permissions error for analytics collection, staying in demo mode");
        } else {
          // Log other errors
          console.error("Analytics snapshot error:", error);
        }
      });
      
      unsubscribes.push(analyticsUnsub);

      // Fetch audit logs data
      const auditLogsQuery = query(
        collection(db, "audit_logs"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      
      const auditLogsUnsub = onSnapshot(auditLogsQuery, (snapshot) => {
        const auditLogsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedTime: formatTimestamp(doc.data().timestamp),
        })) as AuditLog[];
        
        setData(prev => ({
          ...prev,
          auditLogs: auditLogsData.length > 0 ? auditLogsData : prev.auditLogs,
          mode: auditLogsData.length > 0 ? "real" : prev.mode,
        }));
      }, (error) => {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
          // Suppress permissions errors as we handle them gracefully by staying in demo mode
          // console.log("Permissions error for audit_logs collection, staying in demo mode");
        } else {
          // Log other errors
          console.error("Audit logs snapshot error:", error);
        }
      });
      
      unsubscribes.push(auditLogsUnsub);
    } catch (error: any) {
      // Check if it's a permissions error
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        // Suppress permissions errors as we handle them gracefully by staying in demo mode
      } else {
        // Log other errors
        console.error("Error setting up Firestore listeners:", error);
      }
      // Stay in demo mode on error
    }

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsub => {
        try {
          unsub();
        } catch (e) {
          console.warn("Error unsubscribing from listener:", e);
        }
      });
    };
  }, [user, profile]);

  return (
    <DashboardDataContext.Provider value={data}>
      {children}
    </DashboardDataContext.Provider>
  );
}
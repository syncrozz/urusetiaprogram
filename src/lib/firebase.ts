import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore matching skill guidelines
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { app };

const STATE_DOC_PATH = 'system_state';
const STATE_DOC_ID = 'secretariat_main';

export interface CloudSyncState {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

/**
 * Save complete application state to Firebase Firestore
 */
export async function pushStateToFirebase(stateData: any): Promise<boolean> {
  try {
    const docRef = doc(db, STATE_DOC_PATH, STATE_DOC_ID);
    // Sanitize state data for Firestore
    const payload = {
      categories: stateData.categories || [],
      templates: stateData.templates || [],
      programs: stateData.programs || [],
      people: stateData.people || [],
      updates: stateData.updates || [],
      logs: stateData.logs || [],
      participantProfiles: stateData.participantProfiles || [],
      eventMemberships: stateData.eventMemberships || [],
      trainingSessions: stateData.trainingSessions || [],
      trainingAttendanceLogs: stateData.trainingAttendanceLogs || [],
      competitionEventConfigs: stateData.competitionEventConfigs || [],
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('unavailable')) {
      console.info('[Firebase Sync] Offline mode: state saved locally, will sync when reconnected.');
    } else {
      console.warn('[Firebase Sync] Push warning:', err);
    }
    return false;
  }
}

/**
 * Pull initial state from Firebase Firestore
 */
export async function fetchStateFromFirebase(): Promise<any | null> {
  try {
    const docRef = doc(db, STATE_DOC_PATH, STATE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('unavailable')) {
      console.info('[Firebase Sync] Operating with local state (offline).');
    } else {
      console.warn('[Firebase Sync] Fetch warning:', err);
    }
    return null;
  }
}

/**
 * Subscribe to real-time updates from Firebase Firestore
 */
export function subscribeToFirebaseState(
  onUpdate: (remoteData: any) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const docRef = doc(db, STATE_DOC_PATH, STATE_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    },
    (err) => {
      if (err?.code === 'unavailable' || err?.message?.includes('offline') || err?.message?.includes('unavailable')) {
        console.info('[Firebase Sync] Real-time listener running in offline mode.');
      } else {
        console.warn('[Firebase Sync] Real-time listener note:', err);
      }
      if (onError) onError(err);
    }
  );
}

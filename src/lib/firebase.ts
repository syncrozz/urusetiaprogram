import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
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

// Initialize Cloud Firestore with experimentalForceLongPolling to prevent WebChannel stream disconnection errors in iframe/sandboxed environments
let db: any;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    db = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } else {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
} catch (e) {
  // If already initialized, retrieve existing instance
  db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export { app, db };

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
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err: any) {
    console.error('[Firebase Sync] Push failed:', err);
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
    console.error('[Firebase Sync] Fetch failed:', err);
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
      console.warn('[Firebase Sync] Real-time listener error:', err);
      if (onError) onError(err);
    }
  );
}

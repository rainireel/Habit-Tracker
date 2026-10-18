import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const FIREBASE_CONFIG_STORAGE_KEY = 'habit_tracker_firebase_config';
const SYNC_CODE_STORAGE_KEY = 'habit_tracker_sync_code';

export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // 1. Check environment variables
  if (
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  ) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // 2. Check localStorage for user-configured credentials
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId && parsed.appId) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseConfig | null) {
  if (!config) {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

export function getActiveSyncCode(): string {
  const saved = localStorage.getItem(SYNC_CODE_STORAGE_KEY);
  if (saved && saved.trim()) return saved.trim().toUpperCase();
  
  // Default unique code for this user/device
  const newCode = generateRandomSyncCode();
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, newCode);
  return newCode;
}

export function setActiveSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_STORAGE_KEY, code.trim().toUpperCase());
}

export function generateRandomSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'HABIT-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } | null {
  const config = getStoredFirebaseConfig();
  if (!config) return null;

  try {
    if (!appInstance) {
      if (getApps().length > 0) {
        appInstance = getApp();
      } else {
        appInstance = initializeApp(config);
      }
    }

    if (!firestoreInstance && appInstance) {
      firestoreInstance = getFirestore(appInstance);
      // Try to enable offline persistence in browser
      try {
        enableIndexedDbPersistence(firestoreInstance).catch(() => {
          // Fallback if multiple tabs are open
        });
      } catch {}
    }

    if (!authInstance && appInstance) {
      authInstance = getAuth(appInstance);
    }

    if (appInstance && firestoreInstance && authInstance) {
      return { app: appInstance, db: firestoreInstance, auth: authInstance };
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
  return null;
}

export function resetFirebaseInstances() {
  appInstance = null;
  firestoreInstance = null;
  authInstance = null;
}

function normalizeSyncCode(code: string): string {
  const trimmed = code.trim();
  if (trimmed.startsWith('GOOGLE-') || trimmed.startsWith('USER-')) {
    return trimmed;
  }
  return trimmed.toUpperCase();
}

export async function getTrackerData(syncCode: string): Promise<any | null> {
  const instances = initFirebase();
  if (!instances || !syncCode) return null;

  const { db } = instances;
  const cleanCode = normalizeSyncCode(syncCode);
  const trackerDocRef = doc(db, 'trackers', cleanCode);

  try {
    const docSnap = await getDoc(trackerDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.warn('Failed to fetch tracker from cloud:', error);
  }
  return null;
}

export async function uploadTrackerData(syncCode: string, trackerData: any): Promise<boolean> {
  const instances = initFirebase();
  if (!instances || !syncCode) return false;

  const { db } = instances;
  const cleanCode = normalizeSyncCode(syncCode);
  const trackerDocRef = doc(db, 'trackers', cleanCode);

  try {
    await setDoc(
      trackerDocRef,
      {
        ...trackerData,
        lastUpdated: Date.now(),
        clientDeviceId: getClientDeviceId(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('Failed to sync to Firebase:', error);
    return false;
  }
}

export function subscribeToTrackerCloud(
  syncCode: string,
  onRemoteUpdate: (data: any) => void
): (() => void) | null {
  const instances = initFirebase();
  if (!instances || !syncCode) return null;

  const { db } = instances;
  const cleanCode = normalizeSyncCode(syncCode);
  const trackerDocRef = doc(db, 'trackers', cleanCode);

  const unsubscribe = onSnapshot(
    trackerDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Avoid reverberating own changes if local was the author within 1.5 seconds
        if (data.clientDeviceId === getClientDeviceId() && Date.now() - (data.lastUpdated || 0) < 1500) {
          return;
        }
        onRemoteUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore subscription error (will retry automatically):', err);
    }
  );

  return unsubscribe;
}

export async function loginWithGoogle(): Promise<User | null> {
  const instances = initFirebase();
  if (!instances) throw new Error('Firebase is not configured');
  const { auth } = instances;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const isMobile =
    typeof navigator !== 'undefined' &&
    (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(display-mode: standalone)').matches));

  try {
    if (isMobile) {
      try {
        const res = await signInWithPopup(auth, provider);
        return res.user;
      } catch (popupErr: any) {
        console.warn('Mobile popup blocked or failed, falling back to redirect:', popupErr);
        await signInWithRedirect(auth, provider);
        return null;
      }
    } else {
      const res = await signInWithPopup(auth, provider);
      return res.user;
    }
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Popup blocked, attempting redirect:', err);
      await signInWithRedirect(auth, provider);
      return null;
    }
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function checkRedirectResult(): Promise<User | null> {
  const instances = initFirebase();
  if (!instances) return null;
  try {
    const res = await getRedirectResult(instances.auth);
    return res?.user || null;
  } catch (err) {
    console.warn('No redirect result or error:', err);
    return null;
  }
}

export async function logoutGoogle(): Promise<void> {
  const instances = initFirebase();
  if (!instances) return;
  await signOut(instances.auth);
}

export function onAuthChange(callback: (user: User | null) => void): (() => void) | null {
  const instances = initFirebase();
  if (!instances) return null;
  return onAuthStateChanged(instances.auth, callback);
}

const DEVICE_ID_KEY = 'habit_tracker_device_id';
export function getClientDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

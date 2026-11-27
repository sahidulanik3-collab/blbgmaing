import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, type Database } from 'firebase/database';

/*
 * ===== FIREBASE CONFIGURATION =====
 *
 * Cloud sync দিয়ে সব ব্রাউজারে একই data দেখা যাবে।
 * 
 * Setup (একবারই করতে হবে, ৩ মিনিট):
 *
 * 1. https://console.firebase.google.com → "Create a project" → যেকোনো নাম দাও → Continue
 * 2. Google Analytics → Disable → Create Project → Continue
 * 3. বাম পাশে "Build" → "Realtime Database" → "Create Database"
 * 4. Location → যেকোনো → Next → "Start in TEST MODE" → Enable
 * 5. বাম পাশে Project Overview → gear (⚙) icon → Project Settings
 * 6. নিচে scroll → "Your apps" → "</>" (Web) icon click → app নাম দাও → Register app
 * 7. নিচে firebaseConfig object দেখাবে → সেখান থেকে value গুলো এখানে paste করো
 */
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function initFirebaseApp(): Database | null {
  if (!isFirebaseConfigured()) {
    console.info(
      '🔒 Firebase not configured — data is localStorage only (single browser).\n' +
      '   See src/utils/firebase.ts for setup instructions.'
    );
    return null;
  }
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    return db;
  } catch (e) {
    console.error('Firebase initialization failed:', e);
    return null;
  }
}

export function getFirebaseDb(): Database | null {
  return db;
}

export { ref, set as fbSet, onValue };
export type { Database };

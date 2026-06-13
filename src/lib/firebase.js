/**
 * firebase.js
 * Initializes the Firebase app and exports the Realtime Database instance.
 *
 * All config values come from environment variables (VITE_ prefix = exposed
 * to the browser by Vite). Never hardcode these — keep them in your .env file.
 */

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// We only use the Realtime Database — for signaling only.
// No file data ever touches Firebase.
export const db = getDatabase(app)

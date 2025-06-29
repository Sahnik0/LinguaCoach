import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCDhD1jVwxuCzPDh-jSl3VAIgRsKMeeVPo",
  authDomain: "service-agent-6afbd.firebaseapp.com",
  projectId: "service-agent-6afbd",
  storageBucket: "service-agent-6afbd.firebasestorage.app",
  messagingSenderId: "900106885199",
  appId: "1:900106885199:web:4847c5c0885a1d3044723a",
  measurementId: "G-W8F2SKK1ZH",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Analytics only on client side
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export default app

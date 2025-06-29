// This script would set up the required Firestore indexes
// Run this after deploying to Firebase

const admin = require("firebase-admin")

// Initialize Firebase Admin
const serviceAccount = require("./path-to-service-account-key.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "service-agent-6afbd",
})

const db = admin.firestore()

async function setupIndexes() {
  console.log("Setting up Firestore indexes...")

  // Note: Firestore indexes are typically created automatically when queries are run
  // or can be defined in firestore.indexes.json file

  // Required composite indexes:
  // 1. sessions: userId (Asc), createdAt (Desc)
  // 2. reports: userId (Asc), sessionId (Asc)
  // 3. scenarios: language (Asc), popularity (Desc)
  // 4. users: phoneNumber, email, createdAt (single field indexes)

  console.log("Indexes will be created automatically when queries are executed.")
  console.log("Make sure to deploy firestore.indexes.json with your Firebase project.")
}

setupIndexes().catch(console.error)

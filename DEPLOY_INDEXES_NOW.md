# 🔥 URGENT: Deploy Firebase Indexes

## The Issue
Your app is failing because Firebase Firestore indexes are missing. The error shows:
```
FirebaseError: The query requires an index.
```

## Quick Fix (5 minutes)

### Step 1: Install Firebase CLI (if not done)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```
- This will open a browser window
- Login with your Google account that has access to the Firebase project

### Step 3: Deploy Indexes
```bash
# Make sure you're in the project directory
cd /home/sahnik/Downloads/language-coach-app

# Deploy the indexes
firebase deploy --only firestore:indexes
```

### Step 4: Monitor Progress
```bash
# Check deployment status
firebase firestore:indexes
```

## Alternative: Manual Creation via Console

If CLI doesn't work, use the Firebase Console:

1. Go to: https://console.firebase.google.com/project/service-agent-6afbd/firestore/indexes
2. Click "Add Index"
3. Create these composite indexes:

### CALLS Collection Indexes:
1. **Index 1:**
   - Collection: `calls`
   - Fields: `userId` (Ascending) + `createdAt` (Descending)

2. **Index 2:**
   - Collection: `calls` 
   - Fields: `userId` (Ascending) + `status` (Ascending)

3. **Index 3:**
   - Collection: `calls`
   - Fields: `userId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)

4. **Index 4:**
   - Collection: `calls`
   - Fields: `userId` (Ascending) + `type` (Ascending) + `createdAt` (Descending)

### SESSIONS Collection Indexes:
1. **Index 1:**
   - Collection: `sessions`
   - Fields: `userId` (Ascending) + `createdAt` (Descending)

2. **Index 2:**
   - Collection: `sessions`
   - Fields: `userId` (Ascending) + `status` (Ascending) + `createdAt` (Descending)

### ANALYTICS Collection Indexes:
1. **Index 1:**
   - Collection: `analytics`
   - Fields: `userId` (Ascending) + `createdAt` (Descending)

2. **Index 2:**
   - Collection: `analytics`
   - Fields: `userId` (Ascending) + `sessionId` (Ascending)

3. **Index 3:**
   - Collection: `analytics`
   - Fields: `userId` (Ascending) + `type` (Ascending) + `createdAt` (Descending)

## Expected Timeline
- Index creation: 2-15 minutes depending on data size
- App will work immediately once indexes are enabled

## Verification
Once deployed, the app errors should disappear and you'll see:
```
✅ Database indexes working properly
```
in the phone setup component.

## Need Help?
Run this for detailed instructions:
```bash
npm run setup:indexes
```

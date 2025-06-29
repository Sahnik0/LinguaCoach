# Firebase Firestore Indexes Setup Guide

This guide explains how to set up the required Firestore indexes for the Language Coach App to work properly.

## Why Are Indexes Needed?

Firestore requires composite indexes for queries that:
- Filter on multiple fields
- Filter on one field and order by another field
- Use inequality operators on multiple fields

The Language Coach App uses several complex queries that require these indexes.

## Required Indexes

### 1. CALLS Collection

The `calls` collection stores phone call session data. Required indexes:

```
- userId (ASC) + createdAt (DESC)
  Used by: Dashboard recent calls, Phone setup history
  
- userId (ASC) + status (ASC)  
  Used by: Dashboard stats (completed calls count)
  
- userId (ASC) + status (ASC) + createdAt (DESC)
  Used by: Analytics dashboard (completed calls with date ordering)
  
- userId (ASC) + type (ASC) + createdAt (DESC)
  Used by: Phone setup (filtering phone calls by date)
```

### 2. SESSIONS Collection

The `sessions` collection stores chat session data. Required indexes:

```
- userId (ASC) + createdAt (DESC)
  Used by: Session history component
  
- userId (ASC) + status (ASC) + createdAt (DESC)
  Used by: Session filtering and sorting
```

### 3. ANALYTICS Collection

The `analytics` collection stores detailed session analytics. Required indexes:

```
- userId (ASC) + createdAt (DESC)
  Used by: General analytics queries
  
- userId (ASC) + sessionId (ASC)
  Used by: Linking analytics to specific sessions
  
- userId (ASC) + type (ASC) + createdAt (DESC)
  Used by: Analytics filtering by session type
```

## Deployment Steps

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Firebase project initialized: `firebase init firestore`

### Deploy Indexes

1. **Deploy the indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Monitor deployment:**
   ```bash
   firebase firestore:indexes
   ```

3. **Check status in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Navigate to Firestore Database > Indexes
   - Wait for all indexes to show "Enabled" status

### Deployment Timeline

- **Small datasets** (< 1000 documents): 2-5 minutes
- **Medium datasets** (1000-10000 documents): 5-15 minutes  
- **Large datasets** (> 10000 documents): 15+ minutes

## Fallback Strategies

The app includes automatic fallback strategies when indexes are not available:

1. **Composite Index Missing**: Falls back to simpler queries with client-side filtering
2. **Ordering Index Missing**: Falls back to unordered queries with client-side sorting
3. **All Indexes Missing**: Uses basic queries with full client-side processing

## Testing Index Status

The Phone Setup component includes index testing:

```tsx
// This will automatically test if indexes are working
const [indexesWorking, setIndexesWorking] = useState(false)

// Status indicators in the UI:
// ✅ "Database indexes working properly" 
// ⚠️ "Using fallback query with client-side filtering"
// 🔄 "Using basic query without server-side ordering"
```

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions"**
   - Ensure you're logged into the correct Firebase account
   - Check Firebase project permissions

2. **"Index creation failed"**
   - Check firestore.indexes.json syntax
   - Ensure field names match exactly

3. **"Queries still failing after deployment"**
   - Wait for indexes to finish building (check console)
   - Clear browser cache and restart app

### Verification Commands

```bash
# List all indexes
firebase firestore:indexes

# Check specific index status
firebase firestore:indexes --filter="collectionGroup:calls"

# Deploy only indexes (skip rules/functions)
firebase deploy --only firestore:indexes
```

## Performance Impact

### With Proper Indexes
- Query response time: 50-200ms
- Supports large datasets efficiently
- Server-side filtering and sorting

### Without Indexes (Fallback Mode)
- Query response time: 200-1000ms
- Limited by client memory for large datasets
- Client-side filtering and sorting

## Security Considerations

Indexes do not affect security rules. The following security rules should be configured separately:

```javascript
// Firestore Security Rules Example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /calls/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    match /sessions/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    match /analytics/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Monitoring and Maintenance

### Regular Checks
1. Monitor index performance in Firebase Console
2. Review query patterns in app analytics
3. Update indexes when adding new query patterns

### Cost Optimization
- Indexes increase storage costs slightly
- Query performance improvements reduce read costs
- Overall cost impact is typically neutral to positive

## Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
2. Review the app's fallback error messages
3. Check Firebase Console for detailed error information
4. Run the index setup script: `node scripts/setup-firestore-indexes.js`

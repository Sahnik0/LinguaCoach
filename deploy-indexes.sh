#!/bin/bash

echo "🔥 Firebase Indexes Deployment Script"
echo "======================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
    echo "✅ Firebase CLI installed"
fi

# Check if logged in
echo "🔍 Checking Firebase authentication..."
if firebase projects:list &> /dev/null; then
    echo "✅ Already logged in to Firebase"
else
    echo "🔐 Please log in to Firebase..."
    firebase login
fi

# Check if project is set
echo "🔍 Checking Firebase project configuration..."
if [ -f ".firebaserc" ]; then
    echo "✅ Firebase project configured"
else
    echo "⚠️  Setting up Firebase project..."
    echo '{"projects":{"default":"service-agent-6afbd"}}' > .firebaserc
fi

# Check if firebase.json exists
if [ -f "firebase.json" ]; then
    echo "✅ Firebase configuration file found"
else
    echo "⚠️  Creating Firebase configuration..."
    echo '{"firestore":{"rules":"firestore.rules","indexes":"firestore.indexes.json"}}' > firebase.json
fi

# Deploy indexes
echo "🚀 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Check status
echo "📊 Checking index status..."
firebase firestore:indexes

echo ""
echo "🎉 Deployment complete!"
echo "⏰ Indexes may take 2-15 minutes to build"
echo "🔍 Monitor progress at: https://console.firebase.google.com/project/service-agent-6afbd/firestore/indexes"
echo ""
echo "✅ Your app should work properly once indexes are enabled!"

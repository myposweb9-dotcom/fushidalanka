const admin = require('firebase-admin');

// Mock Firebase setup for development
let db, auth, storage;

try {
  // Try to load Firebase credentials
  const serviceAccount = require('./serviceAccountKey.json');

  // Check if it's a mock credential
  if (serviceAccount.private_key === '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n') {
    console.log('Using mock Firebase setup - no real database connection');
    // Create mock objects for development
    db = {
      collection: () => ({
        get: () => Promise.resolve({ forEach: () => {} }),
        add: () => Promise.resolve({ id: 'mock-id' }),
        where: () => ({ get: () => Promise.resolve({ forEach: () => {} }) })
      })
    };
    auth = { verifyIdToken: () => Promise.resolve({ uid: 'mock-uid' }) };
    storage = { bucket: () => ({ upload: () => Promise.resolve(['mock-file']) }) };
  } else {
    // Real Firebase initialization
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: serviceAccount.project_id + '.appspot.com'
    });

    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
  }
} catch (error) {
  console.log('Firebase not configured, using mock setup');
  // Create mock objects when Firebase is not available
  db = {
    collection: () => ({
      get: () => Promise.resolve({ forEach: () => {} }),
      add: () => Promise.resolve({ id: 'mock-id' }),
      where: () => ({ get: () => Promise.resolve({ forEach: () => {} }) })
    })
  };
  auth = { verifyIdToken: () => Promise.resolve({ uid: 'mock-uid' }) };
  storage = { bucket: () => ({ upload: () => Promise.resolve(['mock-file']) }) };
}

module.exports = { admin, db, auth, storage };

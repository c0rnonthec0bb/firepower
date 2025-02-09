# Firepower Documentation

Firepower is a utility library that provides a streamlined interface for working with Firebase services, particularly Firestore and Cloud Functions.

## Initialization

**IMPORTANT**: Before using any Firepower utilities, you must initialize the library with your Firebase instance:

```javascript
import { initFirepower } from 'firepower'
import firebase from 'firebase/compat/app'
// or
import admin from 'firebase-admin'

// Initialize with firebase client SDK
initFirepower(firebase)
// or with admin SDK
initFirepower(admin)
```

## Documentation Sections

- [Firestore Utilities](./firestore-utils.md) - Documentation for Firestore operations, including:
  - Document operations (set, update, add, delete, get)
  - Collection operations (query, batch operations)
  - Real-time updates (watch documents and collections)
  - Field value helpers
- [Cloud Functions](./cloud-functions.md) - Documentation for Cloud Functions triggers and callable functions

## Key Features

- Streamlined Firestore operations with consistent error handling and logging
- Batch operations and real-time updates for both client and admin SDK
- Collection group queries and pagination support
- Simplified Cloud Functions setup with sensible defaults
- Type-safe document snapshot wrappers
- General-purpose object comparison tools

## Quick Start

1. Initialize Firepower with your Firebase instance:
```javascript
import { initFirepower } from 'firepower'
import firebase from 'firebase/compat/app'
initFirepower(firebase)
```

2. Import and use Firestore operations:
```javascript
import { firestore } from 'firepower'

// Set document data
await firestore.setDoc('users/123', { name: 'John', age: 30 })

// Update specific fields
await firestore.updateDoc('users/123', { 'profile.age': 31 })

// Query a collection
const users = await firestore.getCol('users', 
  q => q.where('age', '>', 18).orderBy('name'))

// Watch for real-time updates
firestore.watchDoc('users/123', doc => {
  console.log('User updated:', doc.data)
})
```

See the individual documentation sections for detailed usage examples and advanced features.

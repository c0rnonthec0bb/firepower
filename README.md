# Firepower

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

## Firestore Utilities

### Document Operations

#### `setDoc(options, pathOrRefOrDocOrChange, additions)`
Sets a document's data in Firestore.
- `options`: Configuration options (optional)
  - `merge`: Whether to merge with existing data (default: true)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- `additions`: Data to set in the document
- Returns: Reference to the set document

#### `updateDoc(options, pathOrRefOrDocOrChange, additions)`
Updates a document's data in Firestore.
- Important: Document must exist, use dot notation for nested fields
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- `additions`: Data to update (using dot notation for nested fields)
- Returns: Reference to the updated document

Example:
```javascript
updateDoc(postDoc, {'postUser.lastName': 'Bittner'})
```

#### `addDoc(options, colPath, additions)`
Adds a new document to a collection with an auto-generated ID.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `colPath`: Path to the collection
- `additions`: Data for the new document
- Returns: Reference to the new document

#### `deleteDoc(options, pathOrRefOrDocOrChange)`
Deletes a document from Firestore.
- Note: No error if document doesn't exist
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- Returns: Reference to the deleted document

#### `getDoc(options, pathOrRefOrDocOrChange)`
Gets a single document from Firestore.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- Returns: FirepowerDocSnap wrapper around the document

### Collection Operations

#### `getCol(options, colPath, queryAdditions)`
Gets a collection of documents.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `colPath`: Path to the collection
- `queryAdditions`: Array of query modifier functions (optional)
  - Each function takes a query and returns a modified query
  - Functions are applied in order
  - Null or undefined functions are skipped
- Returns: FirepowerColSnap wrapper around the collection

Example:
```javascript
// Single query addition
getCol('users', [
  q => q.where('age', '>', 18)
])

// Multiple query additions
getCol('users', [
  q => q.where('age', '>', 18),
  q => q.orderBy('name'),
  q => q.limit(10)
])

// With some conditional filters
const isAdmin = true
getCol('users', [
  q => q.where('age', '>', 18),
  isAdmin ? q => q.where('role', '==', 'admin') : null,
  q => q.orderBy('name')
])
```

#### `getColGroup(options, colGroupName, queryAdditions)`
Gets documents from a collection group (nested collections with same name).
- `options`: Configuration options
- `colGroupName`: Name of the collection group
- `queryAdditions`: Array of query modifier functions (optional)
- Returns: FirepowerColSnap wrapper

#### `getColInBatches(options, colPath, orderByAddition, queryAdditions, limitPerBatch, batchCallback)`
Gets documents from a collection in batches.
- `options`: Configuration options
- `colPath`: Path to the collection
- `orderByAddition`: Function to add ordering (default: orderBy(docIdKey(), 'asc'))
- `queryAdditions`: Array of query modifier functions
- `limitPerBatch`: Number of documents per batch
- `batchCallback`: Function called after each batch

Example:
```javascript
// Process users in batches with multiple filters
await getColInBatches(
  'users',
  q => q.orderBy('createdAt', 'desc'),
  [
    q => q.where('status', '==', 'active'),
    q => q.where('age', '>', 18)
  ],
  100,
  async batch => {
    for (const doc of batch.docs) {
      await processUser(doc.data)
    }
  }
)
```

### Real-time Updates

#### `watchDoc(options, pathOrRefOrDocOrChange, callback)`
Watches a document for real-time updates.
- `options`: Configuration options
  - `updateInterval`: Optional polling interval (for admin SDK)
  - `includeMetadataChanges`: Include metadata changes (default: false)
  - `onError`: Error handler
- `pathOrRefOrDocOrChange`: Path or reference to document
- `callback`: Function called on document updates with a `FirepowerDocSnap`

Example:
```javascript
// Watch for changes to a user's profile
const unsubscribe = firestore.watchDoc(
  'users/123',
  (docSnap: FirepowerDocSnap) => {
    if (docSnap.exists) {
      // Access document data (automatically decoded)
      console.log('Profile updated:', docSnap.data)
      
      // Access document metadata
      console.log('Document ID:', docSnap.id)
      console.log('Document path:', docSnap.path)
    } else {
      console.log('Profile deleted')
    }
  }
)

// Later, when you want to stop watching:
unsubscribe()
```

#### `watchCol(options, colPath, queryAdditions, callback)`
Watches a collection for real-time updates.
- `options`: Similar to `watchDoc` options
- `colPath`: Path to the collection
- `queryAdditions`: Array of query modifier functions
- `callback`: Function called on collection updates with a `FirepowerColSnap`

Example:
```javascript
// Watch for new orders with multiple filters
const unsubscribe = firestore.watchCol(
  'orders',
  [
    q => q.where('status', '==', 'pending'),
    q => q.where('total', '>', 100),
    q => q.orderBy('createdAt', 'desc'),
    q => q.limit(20)
  ],
  (snapshot: FirepowerColSnap) => {
    console.log('Pending high-value orders:', snapshot.docs.length)
    snapshot.docs.forEach(doc => {
      console.log('Order:', doc.data)
    })
  }
)
```

#### `watchColGroup(options, colGroupName, queryAdditions, callback)`
Watches a collection group for real-time updates.
- Similar to `watchCol` but for collection groups
- `queryAdditions`: Array of query modifier functions

### Field Values

#### `docIdKey()`
Special FieldPath to refer to document ID in queries.

#### `serverIncrement(n)`
Creates an increment FieldValue.

#### `serverTimestamp()`
Creates a server timestamp FieldValue.

#### `serverArrayUnion(...elements)`
Creates an array union FieldValue.

#### `serverArrayRemove(...elements)`
Creates an array remove FieldValue.

#### `cloudDelete()`
Creates a field delete FieldValue.

### Snapshot Wrappers

#### FirepowerDocSnap
Wrapper around Firestore document snapshots with automatic data conversion. All document data is automatically decoded from Firestore format to native JavaScript types:

- `exists`: Whether the document exists
- `id`: The document ID
- `metadata`: The document metadata
- `ref`: The document reference
- `path`: The full document path
- `data`: The document data with automatic conversions:
  - `Timestamp` → `Date` objects
  - Nested arrays and objects are recursively converted
  - `GeoPoint` and `FieldValue` objects are preserved as-is

Example:
```javascript
const docSnap = await getDoc('users/123')

// Timestamps are automatically converted to Date objects
const createdAt = docSnap.data.createdAt // Date object
const lastLogin = docSnap.data.lastLogin // Date object

// Nested objects and arrays are also converted
const preferences = docSnap.data.preferences // All nested Timestamps are Date objects
const loginHistory = docSnap.data.loginHistory // Array of objects with Date objects
```

#### FirepowerColSnap
Wrapper around Firestore collection snapshots:
- `docs`: Array of `FirepowerDocSnap` instances for each document in the collection
  - Each document's data is automatically converted as described above
- `colSnap`: The underlying Firestore collection snapshot

Example:
```javascript
const colSnap = await getCol('users')

// All documents have their Timestamps converted to Dates
colSnap.docs.forEach(doc => {
  const createdAt = doc.data.createdAt // Date object
  console.log(`User ${doc.id} created at:`, createdAt.toLocaleString())
})
```

Note: When writing data back to Firestore (using `setDoc`, `updateDoc`, etc.), the library automatically converts your JavaScript `Date` objects back to Firestore `Timestamp` objects. You don't need to handle these conversions manually.

## Cloud Functions

### Function Triggers

#### `onDocCreated(options, wildcardDocPath, callback)`
Triggers when a new document is created in Firestore.

**Parameters:**
- `options`: Configuration options (optional)
  - `timeoutSeconds`: Function timeout (default: 60)
  - `memory`: Memory allocation (default: '256MB')
- `wildcardDocPath`: Path pattern to match documents
- `callback`: Function to execute when triggered

**Callback Parameters:**
- `context`: Function execution context
- `params`: URL parameters from the wildcard path
- `docChange`: DataComparison instance with document changes
- `id`: Document ID
- `ref`: Document reference
- `path`: Document path

#### `onDocUpdated(options, wildcardDocPath, callback)`
Triggers when a document is updated in Firestore.

**Parameters:**
- Same as `onDocCreated`

#### `onFunctionCall(options, callback)`
Creates an HTTPS callable function.

**Parameters:**
- `options`: Configuration options (optional)
  - `timeoutSeconds`: Function timeout (default: 60)
  - `memory`: Memory allocation (default: '256MB')
- `callback`: Function to execute when called

**Callback Parameters:**
- `data`: Data passed to the function
- `context`: Function execution context including:
  - `auth`: Authentication information
  - `signedInUserId`: Current user's ID
  - Request metadata (headers, method, params, etc.)

## Data Comparison

The `DataComparison` class is a general-purpose utility for comparing any two objects:

### Methods
- `isEqual`: Checks if two objects are equal
- `isUnequal`: Checks if two objects are not equal
- `objectNumericalDiff`: Compares numerical differences between objects
- `removedArrayValues`: Identifies values removed from arrays
- `transform(transformFn)`: Applies a transformation function to both objects being compared before comparison

Example usage with transform:
```javascript
const comparison = new DataComparison(oldData, newData)
  .transform(data => processData(data))
  // The comparison will now be performed on the transformed data

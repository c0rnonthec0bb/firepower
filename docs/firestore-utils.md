# Firestore Utilities

## Document Operations

### `setDoc(options, pathOrRefOrDocOrChange, additions)`
Sets a document's data in Firestore.
- `options`: Configuration options (optional)
  - `merge`: Whether to merge with existing data (default: true)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- `additions`: Data to set in the document
- Returns: Reference to the set document

### `updateDoc(options, pathOrRefOrDocOrChange, additions)`
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

### `addDoc(options, colPath, additions)`
Adds a new document to a collection with an auto-generated ID.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `colPath`: Path to the collection
- `additions`: Data for the new document
- Returns: Reference to the new document

### `deleteDoc(options, pathOrRefOrDocOrChange)`
Deletes a document from Firestore.
- Note: No error if document doesn't exist
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- Returns: Reference to the deleted document

### `getDoc(options, pathOrRefOrDocOrChange)`
Gets a single document from Firestore.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `pathOrRefOrDocOrChange`: Path or reference to the document
- Returns: FirepowerDocSnap wrapper around the document

## Collection Operations

### `getCol(options, colPath, queryAdditions)`
Gets a collection of documents.
- `options`: Configuration options (optional)
  - `transaction`: Optional transaction object
- `colPath`: Path to the collection
- `queryAdditions`: Function to add query filters (optional)
- Returns: FirepowerColSnap wrapper around the collection

Example:
```javascript
getCol('users', q => q.where('age', '>', 18).orderBy('name'))
```

### `getColGroup(options, colGroupName, queryAdditions)`
Gets documents from a collection group (nested collections with same name).
- `options`: Configuration options
- `colGroupName`: Name of the collection group
- `queryAdditions`: Function to add query filters (optional)
- Returns: FirepowerColSnap wrapper

### `getColInBatches(options, colPath, orderByAddition, queryAdditions, limitPerBatch, batchCallback)`
Gets documents from a collection in batches.
- `options`: Configuration options
- `colPath`: Path to the collection
- `orderByAddition`: Function to add ordering (default: orderBy(docIdKey(), 'asc'))
- `queryAdditions`: Function to add query filters
- `limitPerBatch`: Number of documents per batch
- `batchCallback`: Function called after each batch

### `getColGroupInBatches(options, colGroupName, orderByAddition, queryAdditions, limitPerBatch, batchCallback)`
Gets documents from a collection group in batches.
- Similar to `getColInBatches` but for collection groups

## Field Values

### `docIdKey()`
Special FieldPath to refer to document ID in queries.

### `serverIncrement(n)`
Creates an increment FieldValue.

### `serverTimestamp()`
Creates a server timestamp FieldValue.

### `serverArrayUnion(...elements)`
Creates an array union FieldValue.

### `serverArrayRemove(...elements)`
Creates an array remove FieldValue.

### `cloudDelete()`
Creates a field delete FieldValue.

## Document Snapshot Wrapper

The `FirepowerDocSnap` class provides a convenient wrapper around Firestore document snapshots with the following getters:

- `exists`: Whether the document exists
- `id`: The document ID
- `metadata`: The document metadata
- `ref`: The document reference
- `path`: The full document path
- `data`: The document data (automatically decoded from Firestore format)

## Collection Snapshot Wrapper

The `FirepowerColSnap` class provides a wrapper around Firestore collection snapshots:

- `docs`: Array of `FirepowerDocSnap` instances for each document in the collection
- `colSnap`: The underlying Firestore collection snapshot

## Real-time Updates

### `watchDoc(options, pathOrRefOrDocOrChange, callback)`
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

### `watchCol(options, colPath, queryAdditions, callback)`
Watches a collection for real-time updates.
- `options`: Similar to `watchDoc` options
- `colPath`: Path to the collection
- `queryAdditions`: Function to add query filters
- `callback`: Function called on collection updates with a `FirepowerColSnap`

Example:
```javascript
// Watch for new orders with status 'pending'
const unsubscribe = firestore.watchCol(
  'orders',
  q => q.where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(20),
  (snapshot: FirepowerColSnap) => {
    // Handle updates to the collection
    console.log('Pending orders:', snapshot.docs.length)
    
    // Access individual documents (each doc is a FirepowerDocSnap)
    snapshot.docs.forEach(doc => {
      // doc is a FirepowerDocSnap instance
      console.log('Order:', {
        id: doc.id,
        path: doc.path,
        data: doc.data  // automatically decoded from Firestore format
      })
    })
  }
)

// Later, when you want to stop watching:
unsubscribe()
```

### `watchColGroup(options, colGroupName, queryAdditions, callback)`
Watches a collection group for real-time updates.
- Similar to `watchCol` but for collection groups

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

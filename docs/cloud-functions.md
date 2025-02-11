# Cloud Functions

This document describes the Cloud Functions utilities available in the Firepower library.

## Setup

To use the Cloud Functions utilities, you need to initialize Firepower with both the Firebase Admin SDK and Functions instances:

```javascript
import { initFirepower } from '@acobb/firepower'
import admin from 'firebase-admin'
import functions from 'firebase-functions/v1'

initFirepower(admin, functions)
```

## Function Triggers

### `onDocCreated(options, wildcardDocPath, callback)`
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

### `onDocUpdated(options, wildcardDocPath, callback)`
Triggers when a document is updated in Firestore.

**Parameters:**
- `options`: Configuration options (optional)
  - `timeoutSeconds`: Function timeout (default: 60)
  - `memory`: Memory allocation (default: '256MB')
- `wildcardDocPath`: Path pattern to match documents
- `callback`: Function to execute when triggered

**Callback Parameters:**
- Same as `onDocCreated`, plus access to both old and new document versions through `docChange`

### `onFunctionCall(options, callback)`
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

## Logging
All functions include automatic logging using Firebase Functions logger:
- Function start with input parameters
- Function completion with results
- Error states when they occur

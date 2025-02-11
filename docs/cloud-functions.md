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

Triggers when a document is created. The callback receives:
- `context`: The Functions event context
- `params`: URL parameters from the wildcard path
- `docChange`: A `FirepowerDocSnap` object containing the new document
- `dataChange`: A simplified version of `docChange` that only contains the document data
- `id`: Document ID
- `ref`: Document reference
- `path`: Full document path

The callback can optionally return an object with:
- `updates`: Object with fields to update on the document
- `promiseFunctions`: Array of async functions to execute

Example:
```javascript
import { functions } from '@acobb/firepower'

functions.onDocCreated('users/{userId}', async ({ dataChange, id }) => {
  // dataChange contains just the document data
  const { name, email } = dataChange.newValue

  return {
    updates: {
      displayName: name.toUpperCase()
    },
    promiseFunctions: [
      async () => {
        await sendWelcomeEmail(email)
      }
    ]
  }
})
```

### `onDocUpdated(options, wildcardDocPath, callback)`

Triggers when a document is updated. The callback receives:
- `context`: The Functions event context
- `params`: URL parameters from the wildcard path
- `docChange`: A `DataComparison` object containing both old and new document snapshots
- `dataChange`: A simplified version of `docChange` that only contains the document data
- `id`: Document ID
- `ref`: Document reference
- `path`: Full document path

The callback can optionally return an object with:
- `updates`: Object with fields to update on the document
- `promiseFunctions`: Array of async functions to execute

Example:
```javascript
import { functions } from '@acobb/firepower'

functions.onDocUpdated('users/{userId}', async ({ dataChange }) => {
  // dataChange.oldValue and dataChange.newValue contain just the document data
  const { email: oldEmail } = dataChange.oldValue
  const { email: newEmail } = dataChange.newValue

  if (oldEmail !== newEmail) {
    return {
      promiseFunctions: [
        async () => {
          await sendEmailChangedNotification(oldEmail, newEmail)
        }
      ]
    }
  }
})
```

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

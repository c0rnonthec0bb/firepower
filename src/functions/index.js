
import { getFirebaseBase, isFirebaseAdminSDK, getLogger, optionalFirstArg } from '@/util'
import { getFunctionsBase } from '@/functions/util'
import { decodeFirestoreDocumentSnapshot } from '@/firestore/util'


export const onDocCreated = optionalFirstArg(async (ephemeralOptions = {}, wildcardDocPath, callback) => {
  const options = { timeoutSeconds: 60, memory: '256MB', ...ephemeralOptions }

  return functions.runWith(options).firestore.document(wildcardDocPath).onCreate(async (newDoc, context) => {
    const { eventId, params } = context

    const { data: newData, id, ref, path } = decodeFirestoreDocumentSnapshot(newDoc)

    const logPrefix = `onDocCreated ${path}`

    getLogger().info({ context, newData, eventId, params}, logPrefix)

    return await callback({ context, params, newDoc, newData, id, ref, path })
  })
})

// should return a `change` object with isChanged, oldValue, newValue
// should write a util to get a new change object with a transform function